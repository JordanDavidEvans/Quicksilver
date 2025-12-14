const defaultSettings = {
  mode: 'privacy',
  interactionSpeed: 'normal',
  pagesPerVisit: 3,
  sessionDurationMs: 3 * 60 * 1000,
  idleRatio: 0.3,
  allowlist: [],
  denylist: [],
  useHistorySeeds: false,
  enableSearch: true,
  enableMedia: false,
  rateLimitMinutes: 5
};

function minutesToMs(minutes) {
  return minutes * 60 * 1000;
}

function msToMinutes(ms) {
  return Math.round(ms / (60 * 1000));
}

function loadForm(settings) {
  document.getElementById('mode').value = settings.mode;
  document.getElementById('speed').value = settings.interactionSpeed;
  document.getElementById('pages').value = settings.pagesPerVisit;
  document.getElementById('duration').value = msToMinutes(settings.sessionDurationMs);
  document.getElementById('idle').value = settings.idleRatio;
  document.getElementById('allowlist').value = (settings.allowlist || []).join('\n');
  document.getElementById('denylist').value = (settings.denylist || []).join('\n');
  document.getElementById('useHistory').checked = settings.useHistorySeeds;
  document.getElementById('search').checked = settings.enableSearch;
  document.getElementById('media').checked = settings.enableMedia;
  document.getElementById('rateLimit').value = settings.rateLimitMinutes;
}

async function restoreSettings() {
  const stored = await chrome.storage.sync.get(['settings']);
  loadForm({ ...defaultSettings, ...(stored.settings || {}) });
}

function parseList(value) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function saveSettings() {
  const settings = {
    mode: document.getElementById('mode').value,
    interactionSpeed: document.getElementById('speed').value,
    pagesPerVisit: Number(document.getElementById('pages').value) || defaultSettings.pagesPerVisit,
    sessionDurationMs: minutesToMs(Number(document.getElementById('duration').value) || 3),
    idleRatio: Number(document.getElementById('idle').value) || defaultSettings.idleRatio,
    allowlist: parseList(document.getElementById('allowlist').value),
    denylist: parseList(document.getElementById('denylist').value),
    useHistorySeeds: document.getElementById('useHistory').checked,
    enableSearch: document.getElementById('search').checked,
    enableMedia: document.getElementById('media').checked,
    rateLimitMinutes: Number(document.getElementById('rateLimit').value) || defaultSettings.rateLimitMinutes
  };

  if (settings.useHistorySeeds) {
    const granted = await chrome.permissions.request({ permissions: ['history'] });
    if (!granted) {
      settings.useHistorySeeds = false;
      document.getElementById('useHistory').checked = false;
      alert('History permission not granted. Seed from history disabled.');
    }
  }

  await chrome.storage.sync.set({ settings });
  alert('Settings saved.');
}

function resetSettings() {
  chrome.storage.sync.set({ settings: defaultSettings }).then(() => restoreSettings());
}

document.addEventListener('DOMContentLoaded', () => {
  restoreSettings();
  document.getElementById('save').addEventListener('click', saveSettings);
  document.getElementById('reset').addEventListener('click', resetSettings);
});
