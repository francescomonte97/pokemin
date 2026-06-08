const RECOVERY_WORKER = 'https://pokemin-save-recovery.montefortefrancesco50.workers.dev';

const form = document.getElementById('recovery-form');
const submitButton = document.getElementById('recovery-submit');
const statusElement = document.getElementById('recovery-status');
const resultElement = document.getElementById('recovery-result');
const resetForm = document.getElementById('reset-form');
const resetButton = document.getElementById('reset-submit');
const resetStatusElement = document.getElementById('reset-status');

function showStatus(message, type = '') {
  statusElement.textContent = message;
  statusElement.className = `recovery-status visible${type ? ` ${type}` : ''}`;
}

function showResetStatus(message, type = '') {
  resetStatusElement.textContent = message;
  resetStatusElement.className = `recovery-status visible${type ? ` ${type}` : ''}`;
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

resetForm.addEventListener('submit', async event => {
  event.preventDefault();

  const username = document.getElementById('reset-username').value.trim();
  const code = document.getElementById('reset-code').value.trim();
  const newPassword = document.getElementById('reset-password').value;
  const confirmation = document.getElementById('reset-password-confirm').value;

  if (!username || !code || !newPassword) {
    showResetStatus('Complete every field.', 'error');
    return;
  }
  if (newPassword.length < 10) {
    showResetStatus('The new password must contain at least 10 characters.', 'error');
    return;
  }
  if (newPassword !== confirmation) {
    showResetStatus('The passwords do not match.', 'error');
    return;
  }

  resetButton.disabled = true;
  resetButton.textContent = 'Updating...';
  showResetStatus('Checking recovery code...');

  try {
    const response = await fetch(`${RECOVERY_WORKER}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, code, newPassword }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Unable to update the password.');

    showResetStatus('Cloud password updated. You can now use it in the game login.', 'success');
    resetForm.reset();
  } catch (error) {
    console.error('Cloud password reset failed:', error);
    showResetStatus(error?.message || 'Unable to update the password.', 'error');
  } finally {
    resetButton.disabled = false;
    resetButton.textContent = 'Set new cloud password';
  }
});
