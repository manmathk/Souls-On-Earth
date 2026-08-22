// js/narrator.js

const MUSIC_REST = 0.18;
const MUSIC_DUCKED = 0.05;
const DUCK_MS = 350;
const TAIL_MS = 500;

/* All audible level control goes through gain nodes. iOS Safari silently
   ignores HTMLMediaElement.volume, so the element's own volume is pinned to 1
   and musicGain becomes the single place level is decided. */
export function createAudioEngine() {
  let ctx = null;
  let musicGain = null;
  let voiceGain = null;
  let enabled = true;
  const elements = [];
  let cursor = 0;
  let restoreTimer = null;

  function ramp(param, value, ms) {
    const now = ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + ms / 1000);
  }

  /* Creates the AudioContext and wires the graph on the first call; resumes
     it on suspended calls thereafter. Never throws and never leaves a
     rejected promise behind — returns true once the graph is actually ready
     to play through, false on any failure (no AudioContext support,
     resume() rejecting, a node failing to construct). Task 7 checks this
     before starting its narration loop, so a caller that skips the check
     never gets to a dead engine silently. */
  async function unlock() {
    try {
      if (ctx) {
        if (ctx.state === "suspended") await ctx.resume();
        return !!musicGain;
      }
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      ctx = new Ctx();
      if (ctx.state === "suspended") await ctx.resume();

      musicGain = ctx.createGain();
      musicGain.gain.value = MUSIC_REST;
      musicGain.connect(ctx.destination);

      voiceGain = ctx.createGain();
      voiceGain.gain.value = 1;
      voiceGain.connect(ctx.destination);

      const music = document.getElementById("bgMusic");
      if (music) {
        music.volume = 1; // gain node owns the level from here on
        ctx.createMediaElementSource(music).connect(musicGain);
      }

      // Two elements reused round-robin. Creating one per clip leaks steadily,
      // which matters when the page runs for weeks.
      for (let i = 0; i < 2; i++) {
        const el = new Audio();
        el.crossOrigin = "anonymous";
        el.preload = "auto";
        ctx.createMediaElementSource(el).connect(voiceGain);
        elements.push(el);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /* A clip that 404s or fails to decode is retired for the session. Without
     this, a single missing file reappears in rotation forever, producing a
     silent gap every time it is drawn. */
  const dead = new Set();

  /* Callers must serialize calls: await each play() before starting the
     next. Reusing an element whose previous clip is still playing fires
     "abort" on that element, not "error" — a case the listeners below do
     not handle. */
  function play(url) {
    if (!ctx || !musicGain || !enabled || dead.has(url)) return Promise.resolve(false);
    // A pending restore from the previous clip must not fire mid-clip and
    // swell the music back up while this one is speaking.
    if (restoreTimer) {
      clearTimeout(restoreTimer);
      restoreTimer = null;
    }
    const el = elements[cursor++ % elements.length];

    return new Promise((resolve) => {
      let settled = false;
      const onEnded = () => { if (!settled) { settled = true; cleanup(); resolve(true); } };
      const onError = () => { if (!settled) { settled = true; cleanup(); dead.add(url); resolve(false); } };
      function cleanup() {
        el.removeEventListener("ended", onEnded);
        el.removeEventListener("error", onError);
        restoreTimer = setTimeout(() => {
          restoreTimer = null;
          ramp(musicGain.gain, MUSIC_REST, TAIL_MS);
        }, TAIL_MS);
      }
      el.addEventListener("ended", onEnded);
      el.addEventListener("error", onError);

      el.src = url;
      ramp(musicGain.gain, MUSIC_DUCKED, DUCK_MS);
      el.play().catch(onError);
    });
  }

  return {
    unlock,
    play,
    enabled: () => enabled,
    setEnabled(value) {
      enabled = value;
      if (!value && ctx && musicGain) ramp(musicGain.gain, MUSIC_REST, TAIL_MS);
    },
  };
}

import { createScheduler } from "./scheduler.js";
import { createCrossingDetector, detectRankChange } from "./detectors.js";

const GAP_MIN_MS = 45000;
const GAP_MAX_MS = 90000;
const CROSSING_STEP = 50000;

function gap() {
  return GAP_MIN_MS + Math.random() * (GAP_MAX_MS - GAP_MIN_MS);
}

async function start() {
  const params = new URLSearchParams(location.search);
  const testMode = params.get("voice") === "test";
  const onlyCategory = (params.get("voice") || "").startsWith("cat:")
    ? params.get("voice").slice(4)
    : null;

  const manifest = await fetch("voice/manifest.json").then((r) => r.json());
  let lines = manifest.lines;
  if (onlyCategory) lines = lines.filter((l) => l.category === onlyCategory);

  const byId = new Map(lines.map((l) => [l.id, l]));
  const scheduler = createScheduler({ lines, historySize: 60 });
  const engine = createAudioEngine();

  const crossings = {
    births: createCrossingDetector(CROSSING_STEP),
    deaths: createCrossingDetector(CROSSING_STEP),
    growth: createCrossingDetector(CROSSING_STEP),
  };
  const crossingClip = new Map();
  const rankClip = new Map();
  for (const l of lines) {
    if (l.trigger && l.trigger.kind === "crossing") {
      const key = l.trigger.counter + ":" + l.trigger.at;
      if (!crossingClip.has(key)) crossingClip.set(key, []);
      crossingClip.get(key).push(l.id);
    }
    if (l.trigger && l.trigger.kind === "rank") {
      rankClip.set(l.trigger.over + ">" + l.trigger.under, l.id);
    }
  }

  const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
  let prevOrder = null;
  let running = false;

  document.addEventListener("souls:tick", (e) => {
    const { births, deaths, growth, order } = e.detail;
    for (const [name, value] of [["births", births], ["deaths", deaths], ["growth", growth]]) {
      const at = crossings[name].check(value);
      if (at === null) continue;
      const options = crossingClip.get(name + ":" + at);
      if (options) scheduler.pushEvent(pickOne(options));
    }
    const change = detectRankChange(prevOrder, order);
    if (change) {
      const id = rankClip.get(change.over + ">" + change.under) || rankClip.get("*>*");
      if (id) scheduler.pushEvent(id);
    }
    prevOrder = order;
  });

  async function loop() {
    if (running) return;
    running = true;
    for (;;) {
      const id = scheduler.next({ hourUTC: new Date().getUTCHours() });
      if (id && byId.has(id)) await engine.play("voice/" + byId.get(id).file);
      await new Promise((r) => setTimeout(r, testMode ? 3000 : gap()));
    }
  }

  const btn = document.getElementById("voiceBtn");
  function paint() {
    if (btn) btn.textContent = engine.enabled() ? "🎙 Voice" : "🔇 Voice";
  }
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      engine.setEnabled(!engine.enabled());
      try { localStorage.setItem("souls-voice", engine.enabled() ? "on" : "off"); } catch (_) {}
      paint();
    });
  }
  try { engine.setEnabled(localStorage.getItem("souls-voice") !== "off"); } catch (_) {}
  paint();

  async function unlockAndRun() {
    if (await engine.unlock()) loop();
    // false: no AudioContext or it failed to resume. Stay silent; the page is unaffected.
  }
  ["click", "touchstart", "keydown"].forEach((ev) =>
    document.addEventListener(ev, unlockAndRun, { once: true })
  );

  window.__narrator = { scheduler, engine, lines, say: (id) =>
    byId.has(id) ? engine.play("voice/" + byId.get(id).file) : null };
}

/* Any failure here leaves the page exactly as it is today — same silent-failure
   contract the World Bank refresh already follows. */
start().catch(() => {});
