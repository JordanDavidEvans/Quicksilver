async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function restoreMode() {
  const stored = await chrome.storage.sync.get(['settings']);
  const settings = stored.settings || {};
  document.getElementById('mode').value = settings.mode || 'privacy';
}

async function start() {
  const tab = await getActiveTab();
  const mode = document.getElementById('mode').value;
  const response = await chrome.runtime.sendMessage({ type: 'quicksilver:start', tabId: tab.id, mode });
  document.getElementById('status').textContent = response.message;
}

async function stop() {
  const response = await chrome.runtime.sendMessage({ type: 'quicksilver:stop' });
  document.getElementById('status').textContent = response.message;
}

document.addEventListener('DOMContentLoaded', () => {
  restoreMode();
  document.getElementById('start').addEventListener('click', start);
  document.getElementById('stop').addEventListener('click', stop);
});
