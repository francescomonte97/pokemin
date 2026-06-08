const RECOVERY_WORKER = 'https://pokemin-save-recovery.montefortefrancesco50.workers.dev';

const form = document.getElementById('recovery-form');
const submitButton = document.getElementById('recovery-submit');
const statusElement = document.getElementById('recovery-status');
const resultElement = document.getElementById('recovery-result');

function showStatus(message, type = '') {
  statusElement.textContent = message;
  statusElement.className = `recovery-status visible${type ? ` ${type}` : ''}`;
}

async function createRestoreRequest(username) {
  const response = await fetch(`${RECOVERY_WORKER}/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Unable to create the recovery request.');
  return data;
}

form.addEventListener('submit', async event => {
  event.preventDefault();

  const username = document.getElementById('recovery-username').value.trim();
  if (!username) {
    showStatus('Enter your username.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Checking...';
  resultElement.classList.remove('visible');

  try {
    showStatus('Creating recovery request...');
    await createRestoreRequest(username);

    document.getElementById('result-username').textContent = username;
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
