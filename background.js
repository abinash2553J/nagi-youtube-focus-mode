const MAX_SESSIONS = 500;
const STALE_MS = 3 * 60 * 1000; // heartbeat is every 30s; background tabs get throttled
let sessionQueue = Promise.resolve();

function enqueueSessionTask(task) {
  const result = sessionQueue.then(task);
  sessionQueue = result.catch((error) => console.error("Nagi session update failed", error));
  return result;
}

async function syncBadge() {
  const { studyMode = false } = await chrome.storage.local.get("studyMode");
  await chrome.action.setBadgeText({ text: studyMode ? "ON" : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#2f6b4f" });
}

async function saveSession(start, end, goal) {
  if (end - start < 5000) return; // ignore accidental toggles
  const { sessions = [] } = await chrome.storage.local.get("sessions");
  sessions.push({ start, end, goal });
  await chrome.storage.local.set({ sessions: sessions.slice(-MAX_SESSIONS) });
}

async function finishSession() {
  const { sessionStart, goal = "", lastActive } =
    await chrome.storage.local.get(["sessionStart", "goal", "lastActive"]);

  if (sessionStart) {
    const now = Date.now();
    const stale = !lastActive || now - lastActive > STALE_MS;
    // if the heartbeat stopped long ago, the session really ended then
    const end = stale ? Math.max(lastActive || sessionStart, sessionStart) : now;
    await saveSession(sessionStart, end, goal);
  }

  await chrome.storage.local.set({ studyMode: false, sessionStart: null });
}

async function closeStaleSession() {
  const { studyMode, lastActive } =
    await chrome.storage.local.get(["studyMode", "lastActive"]);
  if (studyMode && (!lastActive || Date.now() - lastActive > STALE_MS)) {
    await finishSession();
    return true;
  }
  return false;
}

chrome.action.onClicked.addListener(() => enqueueSessionTask(async () => {
  const { studyMode = false } = await chrome.storage.local.get("studyMode");

  if (studyMode) {
    await finishSession();
  } else {
    const now = Date.now();
    await chrome.storage.local.set({
      studyMode: true,
      sessionStart: now,
      lastActive: now,
    });
  }
  await syncBadge();
}));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "nagi-setting") {
    if (!["feed", "shorts", "suggestions"].includes(message.id) || typeof message.checked !== "boolean") {
      return;
    }

    const result = enqueueSessionTask(async () => {
      const { hide = {} } = await chrome.storage.local.get("hide");
      await chrome.storage.local.set({ hide: { ...hide, [message.id]: message.checked } });
    });
    result.then(
      () => sendResponse({}),
      (error) => sendResponse({ error: error.message })
    );
    return true;
  }

  if (message?.type !== "nagi-heartbeat" || !sender.tab?.url?.startsWith("https://www.youtube.com/")) return;

  const result = enqueueSessionTask(async () => {
    if (await closeStaleSession()) return;
    const { studyMode } = await chrome.storage.local.get("studyMode");
    if (studyMode) await chrome.storage.local.set({ lastActive: Date.now() });
  });
  result.then(
    () => sendResponse({}),
    (error) => sendResponse({ error: error.message })
  );
  return true;
});

chrome.runtime.onStartup.addListener(() => enqueueSessionTask(async () => {
  await closeStaleSession(); // closes yesterday's forgotten session on browser start
  await syncBadge();
}));

chrome.runtime.onInstalled.addListener(syncBadge);