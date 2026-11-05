const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

function event() {
  return { addListener(listener) { this.listener = listener; } };
}

function loadBackground(state, now) {
  const handlers = { action: event(), startup: event(), installed: event(), message: event() };
  const context = {
    Date: { now: () => now },
    console,
    chrome: {
      storage: {
        local: {
          async get(keys) {
            if (Array.isArray(keys)) return Object.fromEntries(keys.map((key) => [key, state[key]]));
            return { [keys]: state[keys] };
          },
          async set(values) { Object.assign(state, values); },
        },
      },
      action: {
        onClicked: handlers.action,
        async setBadgeText() {},
        async setBadgeBackgroundColor() {},
      },
      runtime: { onStartup: handlers.startup, onInstalled: handlers.installed, onMessage: handlers.message },
    },
  };
  vm.runInNewContext(readFileSync("background.js", "utf8"), context);
  return handlers.message.listener;
}

function sendMessage(listener, message, sender = {}) {
  return new Promise((resolve, reject) => {
    const keepAlive = listener(message, sender, (response) =>
      response?.error ? reject(new Error(response.error)) : resolve()
    );
    assert.equal(keepAlive, true);
  });
}

test("a heartbeat does not revive a stale study session", async () => {
  const staleAt = 1_000_000;
  const state = {
    studyMode: true,
    sessionStart: staleAt - 60_000,
    lastActive: staleAt,
    goal: "Read",
  };
  const listener = loadBackground(state, staleAt + 10 * 60_000);

  await sendMessage(listener, { type: "nagi-heartbeat" }, {
    tab: { url: "https://www.youtube.com/watch?v=1" },
  });

  assert.equal(state.studyMode, false);
  assert.equal(state.sessionStart, null);
  assert.equal(state.lastActive, staleAt);
  assert.equal(state.sessions.length, 1);
  assert.equal(state.sessions[0].end, staleAt);
});

test("overlapping setting changes preserve both values", async () => {
  const state = { hide: { feed: true, shorts: true, suggestions: true } };
  const listener = loadBackground(state, 1_000_000);

  await Promise.all([
    sendMessage(listener, { type: "nagi-setting", id: "feed", checked: false }),
    sendMessage(listener, { type: "nagi-setting", id: "shorts", checked: false }),
  ]);
  assert.deepEqual({ ...state.hide }, { feed: false, shorts: false, suggestions: true });
});
