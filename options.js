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
  document.getElementById(id).addEventListener("change", (e) => {
    chrome.runtime.sendMessage({
      type: "nagi-setting",
      id,
      checked: e.target.checked,
    }).then(
      (response) => {
        if (response?.error) console.error("Could not save Nagi settings", response.error);
      },
      (error) => console.error("Could not save Nagi settings", error)
    );
  });
});

load();