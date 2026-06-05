import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js';
import { doc, getDoc, getFirestore, runTransaction, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBAbtomUhRnJOKdEkFZPdHo-3o4OYF8Aik',
  authDomain: 'hotlist-insights.firebaseapp.com',
  projectId: 'hotlist-insights',
  storageBucket: 'hotlist-insights.firebasestorage.app',
  messagingSenderId: '542456803768',
  appId: '1:542456803768:web:3b546e431cfe51ed76df4d',
  measurementId: 'G-VT2Z0QSD19',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const PLAYER_STATS_COLLECTION = 'player_stats';
const FALLBACK_ACCOUNTS_COLLECTION = 'player_accounts';
const FALLBACK_SAVES_COLLECTION = 'player_saves';
const VISITOR_ID_ENDPOINT = 'https://pokemin-visitor-id.montefortefrancesco50.workers.dev/';
const STATS_WRITE_INTERVAL_MS = 5 * 60 * 1000;
const PLAYTIME_KEY = 'poke_playtime_ms';
const LAST_STATS_WRITE_KEY = 'poke_firestore_stats_last_write';
const VISITOR_ID_KEY = 'poke_visitor_id';

let activeStartedAt = Date.now();
let statsWriteInFlight = false;
let visitorIdPromise = null;

isAnalyticsSupported()
  .then(supported => { if (supported) getAnalytics(app); })
  .catch(err => console.warn('Firebase analytics unavailable:', err));

function sanitizeUuid(uuid) {
  const value = String(uuid || '').trim();
  return /^[a-zA-Z0-9_-]{8,128}$/.test(value) ? value : '';
}

function getPlayerId() {
  const saveUuid = sanitizeUuid(localStorage.getItem('poke_save_uuid'));
  if (saveUuid) return saveUuid;

  let visitorId = sanitizeUuid(localStorage.getItem(VISITOR_ID_KEY));
  if (!visitorId) {
    visitorId = `visitor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

async function loadCloudflareVisitorId() {
  if (visitorIdPromise) return visitorIdPromise;
  visitorIdPromise = (async () => {
    try {
      const res = await fetch(VISITOR_ID_ENDPOINT, { cache: 'no-store' });
      if (!res.ok) return getPlayerId();
      const data = await res.json();
      const workerVisitorId = sanitizeUuid(data?.visitorId);
      if (workerVisitorId) {
        localStorage.setItem(VISITOR_ID_KEY, workerVisitorId);
        return workerVisitorId;
      }
    } catch (err) {
      console.warn('Cloudflare visitor id unavailable:', err);
    }
    return getPlayerId();
  })();
  return visitorIdPromise;
}

function sanitizeDocId(value) {
  const safe = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return safe;
}

function normalizeAccountUsername(value) {
  return sanitizeDocId(value).slice(0, 32);
}

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, ch => ch.charCodeAt(0));
}

function createUuidV4() {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

async function hashFallbackPassword(password, saltBase64 = '') {
  const cryptoApi = globalThis.crypto;
  const enc = new TextEncoder();
  const salt = saltBase64 ? base64ToBytes(saltBase64) : cryptoApi.getRandomValues(new Uint8Array(16));
  const key = await cryptoApi.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await cryptoApi.subtle.deriveBits({
    name: 'PBKDF2',
    salt,
    iterations: 120000,
    hash: 'SHA-256',
  }, key, 256);
  return {
    salt: bytesToBase64(salt),
    hash: bytesToBase64(new Uint8Array(bits)),
  };
}

function createAccessKey() {
  const cryptoApi = globalThis.crypto;
  const bytes = cryptoApi.getRandomValues(new Uint8Array(18));
  return [...bytes]
    .map(b => b.toString(36).padStart(2, '0').slice(-2))
    .join('')
    .replace(/(.{6})/g, '$1-')
    .replace(/-$/, '')
    .toUpperCase();
}

function safeFallbackUsername(username) {
  const clean = String(username || '').trim();
  const key = normalizeAccountUsername(clean);
  if (!key || clean.length > 24) throw new Error('invalid username');
  return { username: clean, key };
}

async function provisionFallbackAccount(usernameValue, uuidValue, options = {}) {
  const { username, key } = safeFallbackUsername(usernameValue);
  const safeUuid = sanitizeUuid(uuidValue);
  if (!safeUuid) throw new Error('invalid uuid');
  const allowExisting = options.allowExisting !== false;

  const accountRef = doc(db, FALLBACK_ACCOUNTS_COLLECTION, key);
  const accessKey = createAccessKey();
  const keyVerifier = await hashFallbackPassword(accessKey);
  const visitorId = await loadCloudflareVisitorId();

  await runTransaction(db, async tx => {
    const existing = await tx.get(accountRef);
    if (existing.exists() && !allowExisting) throw new Error('username already exists');
    const base = existing.exists() ? existing.data() : {};
    tx.set(accountRef, {
      ...base,
      username,
      usernameKey: key,
      uuid_1: safeUuid,
      poke_key: accessKey,
      accessKeySalt: keyVerifier.salt,
      accessKeyHash: keyVerifier.hash,
      authProvider: 'firestore_fallback',
      visitorId,
      createdAt: base.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    tx.set(doc(db, FALLBACK_SAVES_COLLECTION, safeUuid), {
      uuid_1: safeUuid,
      usernameKey: key,
      createdAt: base.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  return { uuid: safeUuid, uuid_1: safeUuid, username, accessKey };
}

async function registerFallbackAccount(usernameValue) {
  const uuid_1 = createUuidV4();
  return provisionFallbackAccount(usernameValue, uuid_1, { allowExisting: false });
}

async function loginFallbackAccount(usernameValue, accessKey) {
  const { key } = safeFallbackUsername(usernameValue);
  const snap = await getDoc(doc(db, FALLBACK_ACCOUNTS_COLLECTION, key));
  if (!snap.exists()) throw new Error('invalid credentials');
  const account = snap.data();
  const salt = account.accessKeySalt || account.passwordSalt || '';
  const expected = account.accessKeyHash || account.passwordHash || '';
  const verifier = await hashFallbackPassword(accessKey, salt);
  if (verifier.hash !== expected) throw new Error('invalid credentials');
  return { uuid: account.uuid_1, uuid_1: account.uuid_1, username: account.username || usernameValue };
}

async function loadFallbackSave(uuid) {
  const safeUuid = sanitizeUuid(uuid);
  if (!safeUuid) return null;
  const snap = await getDoc(doc(db, FALLBACK_SAVES_COLLECTION, safeUuid));
  if (!snap.exists()) return null;
  return snap.data()?.save || null;
}

async function saveFallbackSave(uuid, save) {
  const safeUuid = sanitizeUuid(uuid);
  if (!safeUuid || !save || typeof save !== 'object') return;
  await setDoc(doc(db, FALLBACK_SAVES_COLLECTION, safeUuid), {
    uuid_1: safeUuid,
    save,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

function getPlayerStatsDocId(uuid) {
  const displayUsername = sanitizeDocId(localStorage.getItem('poke_username_1'));
  if (displayUsername) return displayUsername;

  const username = sanitizeDocId(localStorage.getItem('poke_username'));
  if (username) return username;

  const trainer = sanitizeDocId(localStorage.getItem('poke_trainer'));
  if (trainer) return trainer;

  return `player-${uuid.slice(0, 12)}`;
}

function safeJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || ''); }
  catch { return fallback; }
}

function safeInt(key) {
  const n = Number.parseInt(localStorage.getItem(key) || '0', 10);
  return Number.isFinite(n) ? n : 0;
}

function countDexEntries(key) {
  const dex = safeJson(key, {});
  if (!dex || typeof dex !== 'object') return 0;
  return Object.values(dex).filter(Boolean).length;
}

function countHallOfFameWins(entries, predicate) {
  if (!Array.isArray(entries)) return 0;
  return entries.filter(predicate).length;
}

function getTotalPlaytimeMs() {
  const stored = Number.parseInt(localStorage.getItem(PLAYTIME_KEY) || '0', 10);
  const base = Number.isFinite(stored) ? stored : 0;
  return base + Math.max(0, Date.now() - activeStartedAt);
}

function persistPlaytime() {
  const total = getTotalPlaytimeMs();
  localStorage.setItem(PLAYTIME_KEY, String(total));
  activeStartedAt = Date.now();
}

function getPlaytimeParts() {
  const totalMinutes = Math.floor(getTotalPlaytimeMs() / 60000);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

function buildPlayerStatsPayload(uuid) {
  persistPlaytime();
  const achievements = safeJson('poke_achievements', []);
  const hofEntries = safeJson('poke_hall_of_fame', []);
  const hofIndex = safeJson('poke_hof_index', {});
  const username = localStorage.getItem('poke_username') || '';
  const displayUsername = localStorage.getItem('poke_username_1') || username;
  const playtime = getPlaytimeParts();

  return {
    uuid,
    visitorId: localStorage.getItem(VISITOR_ID_KEY) || '',
    isLoggedIn: !!localStorage.getItem('poke_save_uuid'),
    username,
    displayUsername,
    trainer: localStorage.getItem('poke_trainer') || '',
    source: 'pokemin_web',
    stats: {
      playtime,
      eliteWins: safeInt('poke_elite_wins'),
      achievementsUnlocked: Array.isArray(achievements) ? achievements.length : 0,
      pokedexCaught: countDexEntries('poke_dex'),
      shinyCaught: countDexEntries('poke_shiny_dex'),
      hallOfFameEntries: Array.isArray(hofEntries) ? hofEntries.length : 0,
      normalWins: countHallOfFameWins(hofEntries, e => e && !e.endless && !e.hardMode && !e.gen2Mode),
      nuzlockeWins: countHallOfFameWins(hofEntries, e => e && !e.endless && !!e.hardMode),
      gen2Wins: countHallOfFameWins(hofEntries, e => e && !e.endless && !!e.gen2Mode),
      battleTowerClears: countHallOfFameWins(hofEntries, e => e && !!e.endless),
      maxBattleTowerStage: Number(hofIndex?.maxEndlessStage || 0),
      hofPokemonLines: Array.isArray(hofIndex?.evoLineRoots) ? hofIndex.evoLineRoots.length : 0,
      starterRuns: Array.isArray(hofIndex?.starterRuns) ? hofIndex.starterRuns.length : 0,
    },
    updatedAt: serverTimestamp(),
  };
}

async function writePlayerStats(uuid, { force = false, reason = 'sync' } = {}) {
  const safeUuid = sanitizeUuid(uuid);
  if (!safeUuid || statsWriteInFlight) return;

  const lastWrite = Number.parseInt(localStorage.getItem(LAST_STATS_WRITE_KEY) || '0', 10) || 0;
  if (!force && Date.now() - lastWrite < STATS_WRITE_INTERVAL_MS) return;

  statsWriteInFlight = true;
  try {
    await setDoc(doc(db, PLAYER_STATS_COLLECTION, getPlayerStatsDocId(safeUuid)), {
      ...buildPlayerStatsPayload(safeUuid),
      lastWriteReason: reason,
    }, { merge: true });
    localStorage.setItem(LAST_STATS_WRITE_KEY, String(Date.now()));
  } catch (err) {
    console.warn('Firestore player stats sync failed:', err);
  } finally {
    statsWriteInFlight = false;
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    persistPlaytime();
    writePlayerStats(getPlayerId(), { reason: 'visibility_hidden' });
  } else {
    activeStartedAt = Date.now();
  }
}

window.queuePlayerStatsToFirestore = function queuePlayerStatsToFirestore(reason = 'sync', options = {}) {
  writePlayerStats(getPlayerId(), { ...options, reason });
};

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', onVisibilityChange);
}

if (typeof window !== 'undefined') {
  window.pokeFirestoreAuthFallback = {
    login: loginFallbackAccount,
    register: registerFallbackAccount,
    provision: provisionFallbackAccount,
    loadSave: loadFallbackSave,
    saveLocal: saveFallbackSave,
  };

  window.addEventListener('pagehide', () => {
    persistPlaytime();
    try {
      localStorage.setItem('poke_firestore_stats_dirty', '1');
    } catch {}
  });
  window.addEventListener('DOMContentLoaded', async () => {
    activeStartedAt = Date.now();
    await loadCloudflareVisitorId();
    writePlayerStats(getPlayerId(), { force: true, reason: 'page_enter' });
    if (localStorage.getItem('poke_firestore_stats_dirty') === '1') {
      localStorage.removeItem('poke_firestore_stats_dirty');
      writePlayerStats(getPlayerId(), { reason: 'resume_dirty' });
    }
  });
}
