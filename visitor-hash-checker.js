(() => {
  'use strict';

  const ipInput = document.getElementById('ip');
  const saltInput = document.getElementById('salt');
  const hashInput = document.getElementById('hash');
  const result = document.getElementById('result');

  function isValidIp(value) {
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) {
      return value.split('.').every(part => Number(part) <= 255);
    }
    return value.includes(':') && /^[0-9a-f:.]+$/i.test(value);
  }

  async function sha256Hex(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');
  }

  async function verifyVisitorId() {
    const ip = ipInput.value.trim();
    const salt = saltInput.value;
    const expected = hashInput.value.trim().toLowerCase();

    if (!isValidIp(ip)) {
      result.className = 'bad';
      result.textContent = 'Inserisci un indirizzo IPv4 o IPv6 valido.';
      return;
    }
    if (!salt) {
      result.className = 'bad';
      result.textContent = 'Inserisci il salt privato usato dal Worker.';
      return;
    }
    if (!/^[a-f0-9]{64}$/.test(expected)) {
      result.className = 'bad';
      result.textContent = 'Il visitorId deve essere un hash SHA-256 di 64 caratteri.';
      return;
    }

    result.className = '';
    result.textContent = 'Verifica in corso...';

    try {
      const calculated = await sha256Hex(`${ip}:${salt}`);
      const match = calculated === expected;
      result.className = match ? 'ok' : 'bad';
      result.textContent = match
        ? `Corrispondenza trovata.\n\nIP verificato:\n${ip}`
        : `Nessuna corrispondenza.\n\nHash calcolato:\n${calculated}`;
    } catch (error) {
      result.className = 'bad';
      result.textContent = `Verifica non disponibile: ${error.message}`;
    }
  }

  document.getElementById('check').addEventListener('click', verifyVisitorId);
  document.getElementById('clear').addEventListener('click', () => {
    ipInput.value = '';
    saltInput.value = '';
    hashInput.value = '';
    result.className = '';
    result.textContent = 'In attesa...';
    ipInput.focus();
  });

  [ipInput, saltInput, hashInput].forEach(input => {
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        verifyVisitorId();
      }
    });
  });
})();
