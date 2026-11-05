# 凪 Nagi: YouTube Focus Mode

Calm the noise. Nagi is a Chrome/Edge extension that hides YouTube's Shorts,
home feed and suggested videos while you study, shows your goal and a
session timer, and keeps a weekly focus report.


## Features
- **One-click study mode** from the toolbar button (badge shows ON)
- **Hides** Shorts, the home feed and suggested videos; each one is optional in settings
- **Goal + timer** for each session, which survive closing the tab or browser
- **Weekly focus report**: total time, sessions, longest session and a bar per day
- Works on Chrome and Edge

## Install (about 2 minutes)
1. Click **Code → Download ZIP** on this page and unzip it.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder (the one containing `manifest.json`).
5. Click the puzzle-piece icon and pin **Nagi**.
6. Open YouTube and click the Nagi icon to start a session.

Settings and the weekly report: right-click the Nagi icon → **Options**.

## How it works

**Hiding survives YouTube's page changes.** YouTube is a single-page app: it swaps
content without reloading, so hiding elements once at page load only works for the
first video. Nagi instead adds classes (`nagi-hide-feed`, `nagi-hide-shorts`,
`nagi-hide-suggestions`) to `<html>`, and CSS rules apply to every matching element,
including ones YouTube creates later. Selectors use YouTube's stable custom tags
(like `ytd-reel-shelf-renderer`) rather than generated class names.

**The timer stays correct when the background worker sleeps.** Manifest V3 service
workers go idle, so nothing is counted in memory. Nagi stores a `sessionStart`
timestamp in `chrome.storage.local` and computes elapsed time from it on every tick.

**Forgotten sessions end honestly.** While study mode is on and a YouTube tab is open,
the page sends a heartbeat request every 30 seconds. The background worker records it only
while the session is fresh. If a session
is closed after the heartbeat has gone stale (for example, you left it on overnight), it
ends at the last heartbeat instead of recording hours of phantom focus time. A stale
session is also closed when the browser starts or a YouTube tab is opened again.

**The report** splits each session across the days it overlaps, so a session that
crosses midnight is counted correctly on both days.

## Project structure
```
manifest.json     extension config (Manifest V3)
background.js     toolbar click, session saving, badge, stale-session cleanup
content.js        runs on youtube.com: classes, panel, timer, heartbeat
nagi.css          hiding rules and panel styles
options.html/js   settings page
report.html/js    weekly focus report
icons/            toolbar and store icons
```

## Known limitations
- YouTube can change its page structure, which may break selectors.
- "Focus time" means time with study mode on and a YouTube tab open. A YouTube tab left
  open with the computer awake still counts.
- Session history keeps the latest 500 sessions.

## Roadmap
- "5 more minutes" button that locks for an hour after use
- Idle detection (`chrome.idle`) to stop counting when you step away
- Chrome Web Store release

## License
MIT