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

const sessionState = {
  active: false,
  tabId: null,
  mode: 'privacy',
  lastStart: 0
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ settings: defaultSettings });
});

async function getSettings() {
  const stored = await chrome.storage.sync.get(['settings']);
  return { ...defaultSettings, ...(stored.settings || {}) };
}

function isUrlAllowed(url, settings) {
  const denyMatch = settings.denylist.some((pattern) => url.includes(pattern.trim()));
  if (denyMatch) return false;
  if (settings.allowlist.length === 0) return true;
  return settings.allowlist.some((pattern) => pattern.trim() && url.includes(pattern.trim()));
}

async function chooseSeedUrl(settings, currentUrl) {
  if (currentUrl && isUrlAllowed(currentUrl, settings)) {
    return currentUrl;
  }

  if (settings.allowlist.length > 0) {
    const choices = settings.allowlist.filter(Boolean);
    if (choices.length) {
      const pick = choices[Math.floor(Math.random() * choices.length)];
      return pick.startsWith('http') ? pick : `https://${pick}`;
    }
  }

  if (settings.useHistorySeeds) {
    try {
      const hasHistory = await chrome.permissions.contains({ permissions: ['history'] });
      if (hasHistory) {
        const entries = await chrome.history.search({ text: '', maxResults: 20 });
        const filtered = entries.filter((entry) => isUrlAllowed(entry.url, settings));
        if (filtered.length) {
          return filtered[Math.floor(Math.random() * filtered.length)].url;
        }
      }
    } catch (error) {
      console.warn('History lookup failed', error);
    }
  }

  return null;
}

function rateLimited(settings) {
  const now = Date.now();
  const windowMs = settings.rateLimitMinutes * 60 * 1000;
  return now - sessionState.lastStart < windowMs;
}

async function startSimulation(tabId, mode) {
  const settings = await getSettings();
  if (rateLimited(settings)) {
    return { ok: false, message: `Rate limit in effect. Try again later.` };
  }

  const tab = await chrome.tabs.get(tabId);
  const seedUrl = await chooseSeedUrl(settings, tab.url);

  if (!seedUrl) {
    return { ok: false, message: 'No approved sites are available. Update your allowlist or disable restrictions.' };
  }

  if (!isUrlAllowed(seedUrl, settings)) {
    return { ok: false, message: 'The selected page is not allowed by your filters.' };
  }

  sessionState.active = true;
  sessionState.tabId = tabId;
  sessionState.mode = mode;
  sessionState.lastStart = Date.now();

  if (tab.url !== seedUrl) {
    await chrome.tabs.update(tabId, { url: seedUrl });
  }

  chrome.tabs.sendMessage(tabId, {
    type: 'quicksilver:begin',
    settings,
    mode
  }).catch(() => {
    console.warn('Unable to reach content script');
  });

  return { ok: true, message: 'Simulation started.' };
}

function stopSimulation() {
  if (sessionState.tabId !== null) {
    chrome.tabs.sendMessage(sessionState.tabId, { type: 'quicksilver:stop' }).catch(() => {});
  }
  sessionState.active = false;
  sessionState.tabId = null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'quicksilver:start') {
    startSimulation(message.tabId, message.mode).then(sendResponse);
    return true;
  }
  if (message?.type === 'quicksilver:stop') {
    stopSimulation();
    sendResponse({ ok: true, message: 'Stopped.' });
    return true;
  }
  return undefined;
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (!sessionState.active || tabId !== sessionState.tabId) return;
  if (info.status === 'complete') {
    chrome.tabs.sendMessage(tabId, {
      type: 'quicksilver:sync',
      mode: sessionState.mode
    }).catch(() => {});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (sessionState.tabId === tabId) {
    stopSimulation();
  }
});
