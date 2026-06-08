const REQUESTS_COLLECTION = 'save_restore_requests';
const TOKENS_COLLECTION = 'save_restore_tokens';
const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

let cachedGoogleToken = null;
let cachedGoogleTokenExpiresAt = 0;

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    try {
      const url = new URL(request.url);
      if (request.method === 'GET' && url.pathname === '/health') {
        if (url.searchParams.get('deep') === '1') {
          const response = await firestoreFetch(
            env,
            documentUrl(env, '_worker_health', 'status')
          );
          if (response.status !== 200 && response.status !== 404) {
            throw new Error(`Firestore health check failed: ${response.status}`);
          }
          return json({
            ok: true,
            service: 'pokemin-save-recovery',
            firestore: 'connected',
          }, 200, cors);
        }
        return json({ ok: true, service: 'pokemin-save-recovery' }, 200, cors);
      }

      if (request.method === 'POST' && url.pathname === '/request') {
        return createRecoveryRequest(request, env, cors);
      }

      if (request.method === 'POST' && url.pathname === '/admin/approve') {
        return approveRecoveryRequest(request, env, cors);
      }

      if (request.method === 'POST' && url.pathname === '/redeem') {
        return redeemRecoveryToken(request, env, cors);
      }

      return json({ error: 'Not found.' }, 404, cors);
    } catch (error) {
      console.error('Recovery Worker error:', error);
      return json({ error: 'Recovery service unavailable.' }, 500, cors);
    }
  },
};

async function createRecoveryRequest(request, env, cors) {
  const body = await readJson(request);
  const username = cleanUsername(body.username);
  const uuid = cleanUuid(body.uuid);
  const loginProvider = cleanText(body.loginProvider, 32) || 'pokelike';
  if (!username || !uuid) return json({ error: 'Invalid recovery request.' }, 400, cors);

  const requestId = crypto.randomUUID();
  const now = new Date();
  const visitorHash = await hashText(
    `${request.headers.get('CF-Connecting-IP') || ''}:${env.REQUEST_HASH_SALT || ''}`
  );

  await setDocument(env, REQUESTS_COLLECTION, requestId, {
    requestId,
    username,
    usernameKey: normalizeUsername(username),
    uuid,
    loginProvider,
    status: 'pending',
    visitorHash,
    requestedAt: now,
    updatedAt: now,
  });

  return json({ ok: true, requestId, status: 'pending' }, 201, cors);
}

async function approveRecoveryRequest(request, env, cors) {
  if (!isAdminRequest(request, env)) return json({ error: 'Unauthorized.' }, 401, cors);

  const body = await readJson(request);
  const requestId = cleanId(body.requestId);
  if (!requestId) return json({ error: 'Invalid request ID.' }, 400, cors);

  const recoveryRequest = await getDocument(env, REQUESTS_COLLECTION, requestId);
  if (!recoveryRequest) return json({ error: 'Recovery request not found.' }, 404, cors);
  if (recoveryRequest.status !== 'pending') {
    return json({ error: 'Recovery request is not pending.' }, 409, cors);
  }

  const code = createRecoveryCode();
  const codeHash = await hashText(`${normalizeCode(code)}:${env.TOKEN_HASH_SALT}`);
  const ttlMinutes = Math.max(5, Math.min(1440, Number(env.TOKEN_TTL_MINUTES) || 30));
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60_000);
  const tokenId = normalizeUsername(recoveryRequest.username);

  await setDocument(env, TOKENS_COLLECTION, tokenId, {
    requestId,
    username: recoveryRequest.username,
    usernameKey: tokenId,
    uuid: recoveryRequest.uuid,
    codeHash,
    status: 'active',
    createdAt: now,
    expiresAt,
    usedAt: null,
  });

  await patchDocument(env, REQUESTS_COLLECTION, requestId, {
    status: 'approved',
    approvedAt: now,
    updatedAt: now,
    expiresAt,
  });

  return json({
    ok: true,
    requestId,
    username: recoveryRequest.username,
    recoveryCode: code,
    expiresAt: expiresAt.toISOString(),
  }, 200, cors);
}

async function redeemRecoveryToken(request, env, cors) {
  const body = await readJson(request);
  const usernameKey = normalizeUsername(body.username);
  const code = normalizeCode(body.code);
  if (!usernameKey || !code) return json({ error: 'Invalid username or recovery code.' }, 400, cors);

  const tokenDocument = await getDocumentWithMetadata(env, TOKENS_COLLECTION, usernameKey);
  if (!tokenDocument) return json({ error: 'Invalid or expired recovery code.' }, 401, cors);

  const token = tokenDocument.data;
  const expectedHash = await hashText(`${code}:${env.TOKEN_HASH_SALT}`);
  const expiresAt = token.expiresAt instanceof Date ? token.expiresAt : new Date(token.expiresAt);
  if (
    token.status !== 'active' ||
    token.codeHash !== expectedHash ||
    !Number.isFinite(expiresAt.getTime()) ||
    expiresAt.getTime() <= Date.now()
  ) {
    return json({ error: 'Invalid or expired recovery code.' }, 401, cors);
  }

  const now = new Date();
  await patchDocument(env, TOKENS_COLLECTION, usernameKey, {
    status: 'used',
    usedAt: now,
  }, tokenDocument.updateTime);

  if (token.requestId) {
    await patchDocument(env, REQUESTS_COLLECTION, token.requestId, {
      status: 'completed',
      completedAt: now,
      updatedAt: now,
    });
  }

  return json({
    ok: true,
    username: token.username,
    uuid: token.uuid,
    provider: 'recovery_code',
  }, 200, cors);
}

function isAdminRequest(request, env) {
  const authorization = request.headers.get('Authorization') || '';
  return !!env.ADMIN_API_KEY && authorization === `Bearer ${env.ADMIN_API_KEY}`;
}

function createRecoveryCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const chars = [...bytes].map(byte => TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length]).join('');
  return `PKR-${chars.match(/.{1,4}/g).join('-')}`;
}

function cleanUsername(value) {
  const username = String(value || '').trim();
  return username && username.length <= 24 ? username : '';
}

function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

function cleanUuid(value) {
  const uuid = String(value || '').trim();
  return /^[a-zA-Z0-9_-]{8,128}$/.test(uuid) ? uuid : '';
}

function cleanId(value) {
  const id = String(value || '').trim();
  return /^[a-zA-Z0-9_-]{8,128}$/.test(id) ? id : '';
}

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizeCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function readJson(request) {
  const type = request.headers.get('Content-Type') || '';
  if (!type.includes('application/json')) throw new Error('Expected JSON.');
  return request.json();
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = env.ALLOWED_ORIGIN || '';
  return {
    'Access-Control-Allow-Origin': origin === allowedOrigin ? origin : allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin',
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}

async function hashText(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function getDocument(env, collection, id) {
  const result = await getDocumentWithMetadata(env, collection, id);
  return result?.data || null;
}

async function getDocumentWithMetadata(env, collection, id) {
  const response = await firestoreFetch(env, documentUrl(env, collection, id));
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore GET failed: ${response.status}`);
  const document = await response.json();
  return {
    data: decodeFields(document.fields || {}),
    updateTime: document.updateTime || '',
  };
}

async function setDocument(env, collection, id, data) {
  const response = await firestoreFetch(env, documentUrl(env, collection, id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encodeFields(data) }),
  });
  if (!response.ok) throw new Error(`Firestore write failed: ${response.status}`);
}

async function patchDocument(env, collection, id, data, updateTime = '') {
  const fields = encodeFields(data);
  const params = new URLSearchParams();
  Object.keys(fields).forEach(key => params.append('updateMask.fieldPaths', key));
  if (updateTime) params.set('currentDocument.updateTime', updateTime);

  const response = await firestoreFetch(
    env,
    `${documentUrl(env, collection, id)}?${params.toString()}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }
  );
  if (!response.ok) throw new Error(`Firestore update failed: ${response.status}`);
}

function documentUrl(env, collection, id) {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(env.FIREBASE_PROJECT_ID)}` +
    `/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`;
}

async function firestoreFetch(env, url, options = {}) {
  const accessToken = await getGoogleAccessToken(env);
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${accessToken}`);
  return fetch(url, { ...options, headers });
}

async function getGoogleAccessToken(env) {
  if (cachedGoogleToken && Date.now() < cachedGoogleTokenExpiresAt) return cachedGoogleToken;

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: 'RS256', typ: 'JWT' });
  const claim = base64UrlJson({
    iss: env.FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  });
  const unsignedJwt = `${header}.${claim}`;
  const privateKey = await importPrivateKey(env.FIREBASE_PRIVATE_KEY);
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    new TextEncoder().encode(unsignedJwt)
  );
  const assertion = `${unsignedJwt}.${base64UrlBytes(new Uint8Array(signature))}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`Google OAuth failed: ${response.status}`);
  const data = await response.json();
  cachedGoogleToken = data.access_token;
  cachedGoogleTokenExpiresAt = Date.now() + Math.max(60, Number(data.expires_in) - 120) * 1000;
  return cachedGoogleToken;
}

async function importPrivateKey(value) {
  const pem = String(value || '').replace(/\\n/g, '\n');
  const bytes = Uint8Array.from(
    atob(pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '')),
    character => character.charCodeAt(0)
  );
  return crypto.subtle.importKey(
    'pkcs8',
    bytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

function base64UrlJson(value) {
  return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlBytes(bytes) {
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function encodeFields(data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encodeValue(value)]));
}

function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === 'number') return { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (typeof value === 'object') return { mapValue: { fields: encodeFields(value) } };
  return { stringValue: String(value) };
}

function decodeFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function decodeValue(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return new Date(value.timestampValue);
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  return null;
}
