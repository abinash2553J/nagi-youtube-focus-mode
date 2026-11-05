const root = document.documentElement;
let panel = null;
let goalInput = null;
let timerEl = null;
let timerId = null;

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function buildPanel() {
  panel = document.createElement("div");
  panel.id = "nagi-panel";

  const title = document.createElement("div");
  title.className = "nagi-title";
  title.textContent = "凪 Nagi";

  goalInput = document.createElement("input");
  goalInput.type = "text";
  goalInput.placeholder = "Goal for this session";
  goalInput.addEventListener("change", () => {
    chrome.storage.local.set({ goal: goalInput.value.trim() });
  });
  // keep YouTube's keyboard shortcuts (k, f, m...) from firing while typing
  goalInput.addEventListener("keydown", (e) => e.stopPropagation());

  timerEl = document.createElement("div");
  timerEl.className = "nagi-timer";
  timerEl.textContent = "00:00:00";

  panel.append(title, goalInput, timerEl);
  root.appendChild(panel);
}

function removePanel() {
  clearInterval(timerId);
  timerId = null;
  panel?.remove();
  panel = goalInput = timerEl = null;
}

function render({ studyMode, goal, sessionStart, hide }) {
  const opts = { feed: true, shorts: true, suggestions: true, ...hide };
  root.classList.toggle("nagi-on", !!studyMode);
  root.classList.toggle("nagi-hide-feed", !!studyMode && opts.feed);
  root.classList.toggle("nagi-hide-shorts", !!studyMode && opts.shorts);
  root.classList.toggle("nagi-hide-suggestions", !!studyMode && opts.suggestions);


  if (!studyMode) {
    removePanel();
    return;
  }

  if (!panel) buildPanel();
  if (document.activeElement !== goalInput) goalInput.value = goal || "";

  clearInterval(timerId);
  const tick = () => {
    timerEl.textContent = formatTime(Date.now() - (sessionStart || Date.now()));
  };
  tick();
  timerId = setInterval(tick, 1000);
}

function refresh() {
  chrome.storage.local
    .get(["studyMode", "goal", "sessionStart", "hide"])
    .then(render);
}

refresh();
chrome.storage.onChanged.addListener(refresh);