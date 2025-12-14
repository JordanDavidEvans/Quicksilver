const neutralSearchTerms = [
  'testing',
  'sample content',
  'performance check',
  'accessibility',
  'automation research',
  'user journey',
  'latency',
  'documentation'
];

const state = {
  active: false,
  settings: null,
  mode: 'privacy',
  sessionEndsAt: 0,
  pagesVisited: 0,
  timers: []
};

function clearTimers() {
  state.timers.forEach((id) => clearTimeout(id));
  state.timers = [];
}

function getSpeedDelay(speed) {
  switch (speed) {
    case 'slow':
      return { min: 2000, max: 4000 };
    case 'fast':
      return { min: 400, max: 1200 };
    default:
      return { min: 1200, max: 2500 };
  }
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function detectSoftLock() {
  const text = document.body.innerText.toLowerCase();
  const triggers = ['captcha', 'paywall', 'subscribe', 'login', 'log in', 'sign in'];
  if (triggers.some((token) => text.includes(token))) return true;
  const passwordInputs = document.querySelectorAll('input[type="password"], input[name*="password"]');
  return passwordInputs.length > 0;
}

function moveMouseNaturally() {
  const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  const x = Math.random() * width;
  const y = Math.random() * height;
  const event = new MouseEvent('mousemove', {
    clientX: x,
    clientY: y,
    movementX: randomBetween(-3, 3),
    movementY: randomBetween(-3, 3),
    bubbles: true,
    cancelable: true
  });
  document.dispatchEvent(event);
}

function scrollPage() {
  const direction = Math.random() > 0.2 ? 1 : -1;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return;
  const target = Math.min(Math.max(0, window.scrollY + direction * randomBetween(100, 500)), maxScroll);
  window.scrollTo({ top: target, behavior: 'smooth' });
}

function pickSafeClickable() {
  const links = Array.from(document.querySelectorAll('a[href]')).filter((link) => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    const text = (link.innerText || '').toLowerCase();
    if (text.includes('sign out') || text.includes('logout') || text.includes('subscribe')) return false;
    return true;
  });

  const buttons = Array.from(document.querySelectorAll('button')).filter((btn) => {
    const type = (btn.getAttribute('type') || '').toLowerCase();
    if (type === 'submit' || type === 'reset') return false;
    const text = (btn.innerText || '').toLowerCase();
    if (text.includes('pay') || text.includes('buy') || text.includes('delete')) return false;
    return true;
  });

  const options = [...links, ...buttons];
  return options.length ? options[randomBetween(0, options.length - 1)] : null;
}

function triggerClick(element) {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width * Math.random();
  const y = rect.top + rect.height * Math.random();
  const eventInit = { bubbles: true, cancelable: true, clientX: x, clientY: y };
  element.dispatchEvent(new MouseEvent('mouseover', eventInit));
  element.dispatchEvent(new MouseEvent('mousemove', eventInit));
  element.dispatchEvent(new MouseEvent('mousedown', eventInit));
  element.dispatchEvent(new MouseEvent('mouseup', eventInit));
  element.dispatchEvent(new MouseEvent('click', eventInit));
}

function performSearch() {
  const inputs = Array.from(
    document.querySelectorAll('input[type="search"], input[type="text"]:not([type="password"])')
  ).filter((input) => {
    const name = (input.name || '').toLowerCase();
    return !name.includes('email') && !name.includes('phone');
  });

  if (!inputs.length) return;
  const input = inputs[randomBetween(0, inputs.length - 1)];
  const term = neutralSearchTerms[randomBetween(0, neutralSearchTerms.length - 1)];
  input.focus();
  input.value = term;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
}

function interactWithMedia() {
  const mediaElements = Array.from(document.querySelectorAll('video, audio'));
  const target = mediaElements.find((el) => el.paused || el.muted === false);
  if (!target) return;
  target.muted = true;
  target.volume = 0.05;
  target.play().catch(() => {});
}

function scheduleAction() {
  if (!state.active) return;
  if (Date.now() > state.sessionEndsAt) {
    stopSession();
    return;
  }

  if (detectSoftLock()) {
    console.warn('Quicksilver: disengaging due to potential soft lock.');
    stopSession();
    return;
  }

  const { min, max } = getSpeedDelay(state.settings.interactionSpeed);
  const delay = randomBetween(min, max);
  const timer = setTimeout(runAction, delay);
  state.timers.push(timer);
}

function runAction() {
  if (!state.active) return;

  const actions = ['move', 'scroll'];
  if (state.settings.enableSearch) actions.push('search');
  if (state.settings.enableMedia) actions.push('media');
  actions.push('click');

  const choice = actions[randomBetween(0, actions.length - 1)];
  switch (choice) {
    case 'move':
      moveMouseNaturally();
      break;
    case 'scroll':
      scrollPage();
      break;
    case 'search':
      performSearch();
      break;
    case 'media':
      interactWithMedia();
      break;
    case 'click': {
      const target = pickSafeClickable();
      if (target) {
        triggerClick(target);
        state.pagesVisited += target.tagName.toLowerCase() === 'a' ? 1 : 0;
        if (state.pagesVisited >= state.settings.pagesPerVisit) {
          stopSession();
          return;
        }
      }
      break;
    }
    default:
      break;
  }

  const idleChance = state.settings.idleRatio;
  if (Math.random() < idleChance) {
    const idleTimer = setTimeout(scheduleAction, randomBetween(2000, 5000));
    state.timers.push(idleTimer);
  } else {
    scheduleAction();
  }
}

function stopSession() {
  state.active = false;
  clearTimers();
}

function startSession(settings, mode) {
  stopSession();
  state.settings = settings;
  state.mode = mode;
  state.sessionEndsAt = Date.now() + settings.sessionDurationMs;
  state.pagesVisited = 0;
  state.active = true;
  scheduleAction();
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'quicksilver:begin') {
    startSession(message.settings, message.mode);
  }
  if (message?.type === 'quicksilver:stop') {
    stopSession();
  }
  if (message?.type === 'quicksilver:sync' && state.active) {
    scheduleAction();
  }
});
