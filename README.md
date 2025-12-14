# Quicksilver

A Chrome extension that simulates benign, human-like browsing patterns for privacy noise, QA/staging testing, and research into automation detection. Inspired by community tooling such as `immutabledev/chaff`, Quicksilver emphasizes consent, safety, and test-only operation.

## Ethical framing
- **Intended uses:** privacy-preserving traffic noise on approved domains, UX/analytics QA in staging, educational research on interaction modeling.
- **Non-goals:** ad/engagement fraud, revenue manipulation, undisclosed analytics poisoning, bypassing consent or paywalls, or interacting with financial or personal-data flows.
- **Controls:** allowlist/denylist filters, optional history seeding, neutral search terms only, rate limiting, and soft-lock detection to disengage on login/paywall/captcha pages.

## Features
- Human-like interaction simulator (navigation clicks, scrolling, mouse jitter, optional search + muted media playback) with randomized dwell time and idle/active ratios.
- Configurable behavior profiles for speed, session duration, pages per visit, and interaction mix.
- Safe navigation logic that respects allowlists/denylists, avoids destructive form submissions, and rate-limits sessions.
- Clear labeling for modes (Privacy Noise, QA/Test, Research) and an always-visible disclaimer in the popup/options UI.

## Architecture overview
- **Background service worker (`src/background.js`):**
  - Stores and merges user settings from `chrome.storage` with defaults.
  - Enforces allowlist/denylist filtering, optional history seeding, and session rate limits.
  - Coordinates start/stop commands from the popup and notifies the active tab.
- **Content script (`src/content.js`):**
  - Runs the interaction scheduler, soft-lock detection, randomized scroll/move/click/search/media actions, and idle behavior.
  - Tracks visit depth and ends sessions cleanly when limits are reached or safety triggers fire.
- **UI (`src/popup.html`, `src/options.html`):**
  - Popup toggles simulation mode per-tab with an ethical disclaimer.
  - Options page exposes profiles, allowlist/denylist, optional search/media actions, history seeding, and rate limits. Settings persist in `chrome.storage`.

## Install & local testing
1. Open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked**.
2. Select the repository folder containing `manifest.json`.
3. Open the popup to start/stop a session; use the options page to tune behavior.
4. Test on staging/approved domains. For history seeding, grant the optional History permission when prompted.

## Privacy-focused usage tips
- Prefer using the allowlist to restrict navigation to sites you own or test environments.
- Keep idle ratios above zero to preserve realistic pacing, and avoid fast modes on production sites.
- Disable optional search/media actions when working around sensitive content, and rely on neutral terms only.
- Review the denylist to block financial, checkout, or personal-data areas.

## Development notes
- Manifest V3, no build tooling required—edit the files under `src/` and reload the extension.
- Randomization is intentionally lightweight to keep behavior transparent; extend the scheduler or dictionaries for deeper research needs.
- Contributions should preserve the ethical guarantees above; changes that undermine them are out of scope.
