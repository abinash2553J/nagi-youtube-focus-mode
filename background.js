async function syncBadge() {
  const { studyMode = false } = await chrome.storage.local.get("studyMode");
  await chrome.action.setBadgeText({ text: studyMode ? "ON" : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#2f6b4f" });
}

chrome.action.onClicked.addListener(async () => {
  const { studyMode = false } = await chrome.storage.local.get("studyMode");
  const next = !studyMode;
  await chrome.storage.local.set({
    studyMode: next,
    sessionStart: next ? Date.now() : null,
  });
  syncBadge();
});

chrome.runtime.onStartup.addListener(syncBadge);
chrome.runtime.onInstalled.addListener(syncBadge);