const NFC_PREFIX = 'pokelike-debug-v1';

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    try {
      const url = new URL(request.url);

      if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
        return json({
          visitorId: await createVisitorId(request, env),
          nfcDebug: 'available',
        }, 200, cors);
      }

      if (request.method === 'POST' && url.pathname === '/admin/debug-nfc/token') {
        if (!isAdminRequest(request, env)) {
          return json({ error: 'Unauthorized.' }, 401, cors);
        }
        const token = await createNfcToken(env);
        return json({
          ok: true,
          tagValue: token,
          tagHash: await sha256Hex(token),
        }, 200, cors);
      }

      if (request.method === 'POST' && url.pathname === '/debug-nfc/verify') {
        const body = await readJson(request);
        const valid = await verifyNfcToken(body.tagValue, env);
        return json({ ok: true, valid }, 200, cors);
      }

      return json({ error: 'Not found.' }, 404, cors);
    } catch (error) {
      console.error('Visitor/debug Worker error:', error);
      return json({ error: 'Service unavailable.' }, 500, cors);
    }
  },
};

async function createVisitorId(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  return sha256Hex(`${ip}:${env.IP_HASH_SALT || ''}`);
}

async function createNfcToken(env) {
  if (!env.NFC_SIGNING_SECRET) throw new Error('NFC signing unavailable.');
  const ttl = Math.max(300, Number(env.NFC_TOKEN_TTL_SECONDS) || 31536000);
  const expiresAt = Math.floor(Date.now() / 1000) + ttl;
  const nonceBytes = crypto.getRandomValues(new Uint8Array(18));
  const nonce = bytesToHex(nonceBytes);
  const payload = `${NFC_PREFIX}:${expiresAt}:${nonce}`;
  const signature = await hmacHex(payload, env.NFC_SIGNING_SECRET);
  return `${payload}:${signature}`;
}

async function verifyNfcToken(value, env) {
  const token = String(value || '').trim();
  if (!env.NFC_SIGNING_SECRET || token.length > 512) return false;
  const parts = token.split(':');
  if (parts.length !== 4 || parts[0] !== NFC_PREFIX) return false;

  const expiresAt = Number(parts[1]);
  const nonce = parts[2];
  const signature = parts[3].toLowerCase();
  if (
    !Number.isSafeInteger(expiresAt) ||
    expiresAt < Math.floor(Date.now() / 1000) ||
    !/^[a-f0-9]{36}$/.test(nonce) ||
    !/^[a-f0-9]{64}$/.test(signature)
  ) {
    return false;
  }

  const payload = `${NFC_PREFIX}:${expiresAt}:${nonce}`;
  const expected = await hmacHex(payload, env.NFC_SIGNING_SECRET);
  return timingSafeEqual(signature, expected);
}

function isAdminRequest(request, env) {
  const authorization = request.headers.get('Authorization') || '';
  return !!env.ADMIN_API_KEY && authorization === `Bearer ${env.ADMIN_API_KEY}`;
}

async function readJson(request) {
  const type = request.headers.get('Content-Type') || '';
  if (!type.includes('application/json')) throw new Error('Expected JSON.');
  return request.json();
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(String(value))
  );
  return bytesToHex(new Uint8Array(digest));
}

async function hmacHex(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(String(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(value)
  );
  return bytesToHex(new Uint8Array(signature));
}

function timingSafeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function bytesToHex(bytes) {
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = env.ALLOWED_ORIGIN || '';
  const alternateAllowedOrigin = allowedOrigin.includes('://www.')
    ? allowedOrigin.replace('://www.', '://')
    : allowedOrigin.replace('://', '://www.');
  const local = /^https?:\/\/(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(origin);
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin',
  };
  if (origin === allowedOrigin || origin === alternateAllowedOrigin || local) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}
