// js/narrator.js

const MUSIC_REST = 0.2;
const MUSIC_DUCKED = 0.05;
/* Narration sits at 30% rather than unity. Still well clear of the ducked bed
   at 0.05, so a line stays intelligible over the music. */
const VOICE_LEVEL = 0.2;
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
      voiceGain.gain.value = VOICE_LEVEL;
      voiceGain.connect(ctx.destination);

      const music = document.getElementById("bgMusic");
      if (music) {
        music.volume = 1;
        ctx.createMediaElementSource(music).connect(musicGain);
      }

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

  const dead = new Set();

  function play(url) {
    if (!ctx || !musicGain || !enabled || dead.has(url)) return Promise.resolve(false);
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

/* The manifest is the legacy audio index, while lines.json is the source of
   truth for the full line catalogue. Merge both so adding a new text line does
   not silently exclude it from narration. New lines default to <id>.mp3 and
   infer their category from the id prefix (wry/fact/chat/timeofday).

   Existing manifest metadata always wins, so crossings and other triggers keep
   working exactly as before. */
async function loadVoiceLines() {
  const [manifest, textPack] = await Promise.all([
    fetch("voice/manifest.json").then((r) => r.json()),
    fetch("voice/lines.json").then((r) => r.json()),
  ]);

  const byId = new Map((textPack || []).map((l) => [l.id, l]));
  const merged = [];

  for (const l of manifest.lines || []) {
    const text = byId.get(l.id);
    merged.push({
      ...(text || {}),
      ...l,
      category: l.category || text?.category || l.id.split("-")[0],
      file: l.file || `${l.id}.mp3`,
    });
    byId.delete(l.id);
  }

  for (const l of byId.values()) {
    merged.push({
      ...l,
      category: l.category || l.id.split("-")[0],
      file: l.file || `${l.id}.mp3`,
    });
  }

  return merged;
}

async function start() {
  const params = new URLSearchParams(location.search);
  const testMode = params.get("voice") === "test";
  const onlyCategory = (params.get("voice") || "").startsWith("cat:")
    ? params.get("voice").slice(4)
    : null;

  let lines = await loadVoiceLines();
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
    if (btn) btn.classList.toggle("off", !engine.enabled());
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
  }
  ["click", "touchstart", "keydown"].forEach((ev) =>
    document.addEventListener(ev, unlockAndRun, { once: true })
  );

  window.__narrator = { scheduler, engine, lines, say: (id) =>
    byId.has(id) ? engine.play("voice/" + byId.get(id).file) : null };
}

start().catch(() => {});
