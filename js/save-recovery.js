import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';

const SAVE_SERVER = 'https://save.pokelike.xyz';
const RESTORE_REQUESTS_COLLECTION = 'save_restore_requests';
const ACCOUNTS_COLLECTION = 'player_accounts';

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

const form = document.getElementById('recovery-form');
const submitButton = document.getElementById('recovery-submit');
const statusElement = document.getElementById('recovery-status');
const resultElement = document.getElementById('recovery-result');

function showStatus(message, type = '') {
  statusElement.textContent = message;
  statusElement.className = `recovery-status visible${type ? ` ${type}` : ''}`;
}

function sanitizeUuid(value) {
  const uuid = String(value || '').trim();
  return /^[a-zA-Z0-9_-]{8,128}$/.test(uuid) ? uuid : '';
}

function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

async function hashAccessKey(accessKey, saltBase64) {
  const encoder = new TextEncoder();
  const salt = base64ToBytes(saltBase64);
  const key = await crypto.subtle.importKey('raw', encoder.encode(accessKey), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt,
    iterations: 120000,
    hash: 'SHA-256',
  }, key, 256);
  return bytesToBase64(new Uint8Array(bits));
}

async function loginWithPokeKey(username, pokeKey) {
  const usernameKey = normalizeUsername(username);
  if (!usernameKey) throw new Error('Invalid username.');

  const accountSnapshot = await getDoc(doc(db, ACCOUNTS_COLLECTION, usernameKey));
  if (!accountSnapshot.exists()) throw new Error('Invalid username or password.');

  const account = accountSnapshot.data();
  const salt = account.accessKeySalt || '';
  const expectedHash = account.accessKeyHash || '';
  if (!salt || !expectedHash) throw new Error('Poke_key is not available for this account.');

  const receivedHash = await hashAccessKey(pokeKey, salt);
  if (receivedHash !== expectedHash) throw new Error('Invalid username or password.');

  return {
    username: account.username || username,
    uuid: sanitizeUuid(account.uuid_1),
    provider: 'poke_key',
  };
}

async function authenticate(username, password) {
  try {
    const response = await fetch(`${SAVE_SERVER}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && sanitizeUuid(data.uuid)) {
      return {
        username: data.username || username,
        uuid: sanitizeUuid(data.uuid),
        provider: 'pokelike',
      };
    }
  } catch (error) {
    console.warn('Pokelike login unavailable:', error);
  }

  return loginWithPokeKey(username, password);
}

async function createRestoreRequest(account) {
  await setDoc(doc(db, RESTORE_REQUESTS_COLLECTION, account.uuid), {
    uuid: account.uuid,
    username: account.username,
    usernameKey: normalizeUsername(account.username),
    loginProvider: account.provider,
    requestStatus: 'pending',
    source: 'pokemin_save_recovery',
    requestedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

form.addEventListener('submit', async event => {
  event.preventDefault();

  const username = document.getElementById('recovery-username').value.trim();
  const password = document.getElementById('recovery-password').value;
  if (!username || !password) {
    showStatus('Enter username and password.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Checking...';
  resultElement.classList.remove('visible');
  showStatus('Authenticating your account...');

  try {
    const account = await authenticate(username, password);
    if (!account.uuid) throw new Error('No valid recovery profile was returned for this account.');

    showStatus('Account found. Creating recovery request...');
    await createRestoreRequest(account);

    document.getElementById('result-username').textContent = account.username;
    resultElement.classList.add('visible');
    showStatus('Recovery request saved successfully.', 'success');
    form.reset();
  } catch (error) {
    console.error('Save recovery request failed:', error);
    showStatus(error?.message || 'Unable to create the recovery request.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Request save recovery';
  }
});
