const RECOVERY_WORKER = 'https://pokemin-save-recovery.montefortefrancesco50.workers.dev';
const ADMIN_KEY_STORAGE = 'pokemin_recovery_admin_key';

const authForm = document.getElementById('admin-auth');
const keyInput = document.getElementById('admin-key');
const refreshButton = document.getElementById('refresh-btn');
const statusElement = document.getElementById('status');
const requestsElement = document.getElementById('requests');
const resultElement = document.getElementById('approval-result');
const resultTitle = document.getElementById('result-title');
const resultCode = document.getElementById('result-code');
const resultExpiry = document.getElementById('result-expiry');
const copyButton = document.getElementById('copy-code');

keyInput.value = sessionStorage.getItem(ADMIN_KEY_STORAGE) || '';

function adminKey() {
  return keyInput.value.trim();
}

function setBusy(busy) {
  authForm.querySelector('button').disabled = busy;
  refreshButton.disabled = busy;
}

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle('error', isError);
}

async function adminFetch(path, options = {}) {
  const key = adminKey();
  if (!key) throw new Error('Enter the admin API key.');
  sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${key}`);
  if (options.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${RECOVERY_WORKER}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

function renderRequests(requests) {
  requestsElement.replaceChildren();
  if (!requests.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No pending recovery requests.';
    requestsElement.appendChild(empty);
    return;
  }

  requests.forEach(item => {
    const row = document.createElement('article');
    row.className = 'request';

    const username = document.createElement('span');
    username.className = 'username';
    username.textContent = item.username || 'Unknown account';

    const date = document.createElement('time');
    date.className = 'date';
    date.dateTime = item.requestedAt || '';
    date.textContent = item.requestedAt
      ? new Date(item.requestedAt).toLocaleString()
      : 'Unknown date';

    const approve = document.createElement('button');
    approve.type = 'button';
    approve.className = 'approve';
    approve.textContent = 'Approve';
    approve.addEventListener('click', () => approveRequest(item, approve));

    row.append(username, date, approve);
    requestsElement.appendChild(row);
  });
}

async function loadRequests() {
  setBusy(true);
  setStatus('Loading pending requests...');
  try {
    const data = await adminFetch('/admin/requests');
    renderRequests(Array.isArray(data.requests) ? data.requests : []);
    setStatus(`${data.requests?.length || 0} pending request(s).`);
  } catch (error) {
    requestsElement.replaceChildren();
    setStatus(error.message, true);
  } finally {
    setBusy(false);
  }
}

async function approveRequest(item, button) {
  button.disabled = true;
  button.textContent = '...';
  try {
    const data = await adminFetch('/admin/approve', {
      method: 'POST',
      body: JSON.stringify({ requestId: item.requestId }),
    });
    resultTitle.textContent = `Recovery code for ${data.username}`;
    resultCode.textContent = data.recoveryCode;
    resultExpiry.textContent = `Expires ${new Date(data.expiresAt).toLocaleString()}`;
    resultElement.classList.add('visible');
    await loadRequests();
  } catch (error) {
    setStatus(error.message, true);
    button.disabled = false;
    button.textContent = 'Approve';
  }
}

authForm.addEventListener('submit', event => {
  event.preventDefault();
  loadRequests();
});
refreshButton.addEventListener('click', loadRequests);
copyButton.addEventListener('click', async () => {
  const code = resultCode.textContent;
  if (!code) return;
  await navigator.clipboard.writeText(code);
  copyButton.textContent = 'Copied';
  setTimeout(() => { copyButton.textContent = 'Copy recovery code'; }, 1500);
});
