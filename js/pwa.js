let deferredPwaPrompt = null;

function isPwaInstalled() {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function canInstallPwa() {
  return !!deferredPwaPrompt && !isPwaInstalled();
}

function updatePwaInstallButtons() {
  const installed = isPwaInstalled();
  document.querySelectorAll('[data-pwa-install-button]').forEach(btn => {
    btn.disabled = installed;
    btn.classList.toggle('pwa-installed', installed);
    btn.textContent = installed ? 'App installed' : 'Scarica app';
  });
}

async function promptInstallPwa() {
  if (isPwaInstalled()) {
    alert('POKEMIN e gia installata come app.');
    return false;
  }

  if (!deferredPwaPrompt) {
    alert('Se il pulsante installazione del browser non compare ancora, apri il menu del browser e scegli "Aggiungi alla schermata Home" o "Installa app".');
    return false;
  }

  deferredPwaPrompt.prompt();
  const choice = await deferredPwaPrompt.userChoice;
  deferredPwaPrompt = null;
  updatePwaInstallButtons();
  return choice?.outcome === 'accepted';
}

function bindPwaInstallButtons(root = document) {
  root.querySelectorAll('[data-pwa-install-button]').forEach(btn => {
    if (btn.dataset.pwaInstallBound === '1') return;
    btn.dataset.pwaInstallBound = '1';
    btn.addEventListener('click', promptInstallPwa);
  });
  updatePwaInstallButtons();
}

function pwaInstallButtonHtml(extraClass = '') {
  return `<button type="button" class="btn-primary pwa-install-btn ${extraClass}" data-pwa-install-button>Scarica app</button>`;
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredPwaPrompt = event;
  updatePwaInstallButtons();
});

window.addEventListener('appinstalled', () => {
  deferredPwaPrompt = null;
  updatePwaInstallButtons();
});

window.addEventListener('DOMContentLoaded', () => {
  bindPwaInstallButtons(document);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .catch(err => console.warn('Service worker registration failed:', err));
  }
});
