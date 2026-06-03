import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js';
import { doc, getFirestore, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';

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
