const DEFAULTS = { feed: true, shorts: true, suggestions: true };
const ids = Object.keys(DEFAULTS);

async function load() {
  const { hide } = await chrome.storage.local.get("hide");
  const settings = { ...DEFAULTS, ...hide };
  ids.forEach((id) => {
    document.getElementById(id).checked = settings[id];
  });
}

ids.forEach((id) => {
  document.getElementById(id).addEventListener("change", async (e) => {
    const { hide } = await chrome.storage.local.get("hide");
    await chrome.storage.local.set({
      hide: { ...DEFAULTS, ...hide, [id]: e.target.checked },
    });
  });
});

load();