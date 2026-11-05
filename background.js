const MAX_SESSIONS = 500; // don't let storage grow forever

async function syncBadge() {
  const { studyMode = false } = await chrome.storage.local.get("studyMode");
  await chrome.action.setBadgeText({ text: studyMode ? "ON" : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#2f6b4f" });
}

async function saveSession(start, goal) {
  if (!start) return;
  const end = Date.now();
  if (end - start < 5000) return; // ignore accidental toggles under 5 seconds
  const { sessions = [] } = await chrome.storage.local.get("sessions");
  sessions.push({ start, end, goal });
  await chrome.storage.local.set({ sessions: sessions.slice(-MAX_SESSIONS) });
}

chrome.action.onClicked.addListener(async () => {
  const { studyMode = false, sessionStart, goal = "" } =
    await chrome.storage.local.get(["studyMode", "sessionStart", "goal"]);

  if (studyMode) {
    // save first, then switch off, so a failed save never loses the start time
    await saveSession(sessionStart, goal);
    await chrome.storage.local.set({ studyMode: false, sessionStart: null });
  } else {
    await chrome.storage.local.set({ studyMode: true, sessionStart: Date.now() });
  }
  syncBadge();
});

chrome.runtime.onStartup.addListener(syncBadge);
chrome.runtime.onInstalled.addListener(syncBadge);