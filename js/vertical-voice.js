/* Voice-over for the vertical 9:16 stream pages, built on the Web Speech API.

   Each page supplies a `lines()` function that reads its own live DOM, so the
   narration always describes the segment currently on screen rather than a
   fixed script. One line is spoken per segment.

   This has to work on both Android Chrome and iOS Safari, which fail in
   different ways:

   1. `getVoices()` is populated asynchronously and the first synchronous call
      returns `[]` on both. Chrome fires `voiceschanged`; Safari often never
      does, so this also polls and then gives up rather than waiting forever.
      Until a voice resolves we speak with the engine default, which is better
      than staying silent.
   2. iOS grants speech only if the very first `speak()` runs SYNCHRONOUSLY
      inside a user-gesture handler. Awaiting anything first — including the
      voice list — loses the permission. So the first line is spoken directly
      from the click/key handler with no cancel() and no timer in between; that
      utterance is both the unlock and the first real narration.
   3. Android Chrome drops a `speak()` issued in the same task as a `cancel()`,
      so from the second line on, the two are separated by a tick. Requirements
      2 and 3 pull in opposite directions, which is why the first utterance is
      special-cased rather than every utterance being deferred.
   4. Both suspend speech when the page is backgrounded and can come back
      paused; `visibilitychange` resumes it.
   5. It wedges. Over a multi-week session an utterance whose `onend` never
      fires would silence the rest of the stream, so each one is watchdogged.
   6. Chrome truncates very long utterances, so lines are capped.

   Known limitation on iOS: speech cannot be routed through Web Audio, so the
   music bed cannot be ducked under it the way js/narrator.js ducks its mp3
   voice lines. Ducking relies on HTMLMediaElement.volume, which iOS Safari
   ignores. On iPhone the voice competes with the music at full level; on
   Android the bed ducks correctly. Lower the music with its own button if the
   mix is wrong on iOS. */

const RATE = 0.92;
const PITCH = 0.92;
const MAX_CHARS = 240;
const CANCEL_GAP_MS = 80;
/* Rough upper bound before we assume the engine wedged: ~11 chars/sec at this
   rate, plus generous headroom. */
const watchdogMs = (text) => 8000 + (text.length / 11) * 1000 * 1.8;

/* Apple ships novelty voices that are en-US and would otherwise win a naive
   language-only match. A history channel narrated by "Bad News" or "Bubbles" is
   worse than no voice at all, so they are excluded outright.

   Deliberately NOT blocked: Rishi (a real en-IN voice) and Reed / Flo / Eddy /
   Sandy / Shelley, which are ordinary modern Apple voices. An earlier version of
   this list caught all of them and cut the usable pool on a stock Mac from
   eleven voices down to five, which made two pages fall back to the same voice.
   Only the genuinely comic and robotic ones belong here. */
const NOVELTY = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|jester|junior|kathy|organ|princess|ralph|superstar|trinoids|whisper|wobble|zarvox|hysterical|bruce|fred|agnes|victoria|grandma|grandpa|rocko)\b/i;

/**
 * @param {SpeechSynthesisVoice[]} voices
 * @param {RegExp[]} prefer  Page-specific voice-name patterns, most wanted first.
 *        Tried before the generic ordering so each page can sound different;
 *        falls through when the device has none of them.
 */
export function pickVoice(voices, prefer = []) {
  if (!Array.isArray(voices) || !voices.length) return null;
  const usable = voices.filter((v) => v && v.name && !NOVELTY.test(v.name));
  const pool = usable.length ? usable : voices;
  const english = (v) => /^en\b|^en[-_]/i.test(v.lang || '');
  const lang = (re) => (v) => re.test(v.lang || '');
  const enUS = lang(/^en[-_]US$/i);
  const enGB = lang(/^en[-_]GB$/i);
  const named = (re, test) => pool.find((v) => (!test || test(v)) && re.test(v.name));

  /* Page preference first, but only among English voices — a name match on a
     non-English voice would read the script with the wrong phonology. */
  for (const re of prefer) {
    const hit = pool.find((v) => english(v) && re.test(v.name));
    if (hit) return hit;
  }
  return (
    /* Generic ordering: Android's Google voice, then the good Apple ones.
       Daniel is en-GB on Apple devices, which reads well here. */
    named(/google us english/i, enUS) ||
    named(/(alex|david|guy|ryan|aaron|tom|nathan)/i, enUS) ||
    named(/daniel/i, enGB) ||
    named(/(male|man)/i, enUS) ||
    pool.find(enUS) ||
    pool.find(enGB) ||
    pool.find(lang(/^en/i)) ||
    pool[0] ||
    null
  );
}

export function capLine(text, max = MAX_CHARS) {
  const t = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  /* Cut at the last sentence end that fits, else the last word. */
  const window = t.slice(0, max);
  const sentence = Math.max(window.lastIndexOf('. '), window.lastIndexOf('! '), window.lastIndexOf('? '));
  if (sentence > max * 0.5) return window.slice(0, sentence + 1);
  const word = window.lastIndexOf(' ');
  return (word > 0 ? window.slice(0, word) : window).replace(/[,;:]$/, '') + '.';
}

function loadVoices(synth, timeoutMs = 6000) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => {
      if (done) return;
      done = true;
      clearInterval(poll);
      clearTimeout(bail);
      try { synth.removeEventListener('voiceschanged', onChange); } catch (e) { /* older Safari */ }
      resolve(v && v.length ? v : []);
    };
    const tryNow = () => {
      const v = synth.getVoices();
      if (v && v.length) finish(v);
    };
    const onChange = tryNow;
    try { synth.addEventListener('voiceschanged', onChange); } catch (e) { /* older Safari */ }
    /* Safari does not reliably fire voiceschanged, so poll as well. */
    const poll = setInterval(tryNow, 250);
    const bail = setTimeout(() => finish(synth.getVoices()), timeoutMs);
    tryNow();
  });
}

function addControl(onToggle) {
  const style = document.createElement('style');
  /* Stacked BELOW the music button that ambient-ui.js pins at right:10px/top:10px,
     rather than beside it: side by side, this button reached into the nav and sat on
     top of the last link. Sitting under the header it clears the nav entirely, and
     every page's stage is centre-aligned at the top so it covers no content. */
  style.textContent =
    '.vv-ctl{position:fixed;right:10px;top:62px;z-index:10000}' +
    '.vv-ctl button{width:34px;height:34px;padding:0;border-radius:50%;cursor:pointer;' +
    'display:flex;align-items:center;justify-content:center;font-size:15px;line-height:1;' +
    '-webkit-appearance:none;appearance:none;' +
    'background:rgba(20,16,14,.92);color:#ffc257;border:1px solid rgba(255,194,87,.45);' +
    'box-shadow:0 2px 10px rgba(0,0,0,.5)}' +
    '.vv-ctl button.off{opacity:.42;filter:grayscale(1)}' +
    '.vv-ctl button:active{transform:scale(.95)}';
  document.head.appendChild(style);
  const wrap = document.createElement('div');
  wrap.className = 'vv-ctl';
  /* A microphone, deliberately NOT a speaker: ambient-ui.js already owns the
     speaker glyphs for the music bed (U+1F50A / U+1F507), and three speaker
     variants side by side were impossible to tell apart. U+FE0F forces the
     emoji presentation, since U+1F399 renders as monochrome text without it. */
  wrap.innerHTML =
    '<button id="vvBtn" class="off" aria-label="Toggle narration" title="Narration">' +
    '&#127897;&#65039;</button>';
  document.body.appendChild(wrap);
  const btn = wrap.firstElementChild;
  return { btn, style };
}

/* Duck the music bed while speaking. No-op on iOS, which ignores .volume. */
function duck(on) {
  const a = document.querySelector('audio');
  if (!a) return;
  try { a.volume = on ? 0.05 : 0.18; } catch (e) { /* iOS ignores this */ }
}

/**
 * @param {() => string|string[]|null} lines  Reads the page's live DOM and
 *        returns what to say for the current segment. Returning null skips.
 * @param {number} segmentMs  How often a new segment appears.
 */
export function initVoice({ lines, segmentMs = 50000, prefer = [], rate = RATE, pitch = PITCH }) {
  const synth = window.speechSynthesis;
  const Utter = window.SpeechSynthesisUtterance;
  if (!synth || typeof Utter !== 'function') {
    console.debug('Voice-over unavailable: no speechSynthesis in this browser');
    return null;
  }

  const state = { on: false, voice: null, unlocked: false, timer: null, guard: null, last: '' };
  const { btn } = addControl();

  function clearTimers() {
    clearTimeout(state.timer);
    clearTimeout(state.guard);
    state.timer = null;
    state.guard = null;
  }

  function stop() {
    state.on = false;
    state.last = '';
    clearTimers();
    try { synth.cancel(); } catch (e) { /* nothing queued */ }
    duck(false);
    btn.classList.add('off');
  }

  function scheduleNext(ms) {
    clearTimeout(state.timer);
    state.timer = setTimeout(speakCurrent, ms);
  }

  function nextText() {
    try {
      const out = lines();
      const joined = Array.isArray(out) ? out.filter(Boolean).join(' ') : out;
      return joined ? capLine(joined) : null;
    } catch (e) {
      console.debug('Voice line generator failed', e);
      return null;
    }
  }

  function utter(text) {
    const u = new Utter(text);
    if (state.voice) u.voice = state.voice;
    u.lang = (state.voice && state.voice.lang) || 'en-US';
    u.rate = rate;
    u.pitch = pitch;
    u.volume = 1;

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(state.guard);
      duck(false);
      if (state.on) scheduleNext(Math.round(segmentMs / 3));
    };
    u.onend = finish;
    u.onerror = finish;

    duck(true);
    try {
      synth.speak(u);
      state.unlocked = true;
    } catch (e) {
      console.debug('speak() threw', e);
      finish();
      return;
    }

    /* If the engine wedges, onend never arrives. Recover rather than going
       silent for the rest of a multi-week session. */
    state.guard = setTimeout(() => {
      if (settled) return;
      console.debug('Voice-over watchdog fired; resetting the speech queue');
      try { synth.cancel(); } catch (e2) { /* ignore */ }
      finish();
    }, watchdogMs(text));
  }

  /**
   * @param {boolean} inGesture  True when called directly from a user-gesture
   *        handler. iOS grants speech only to a speak() issued in that same
   *        task, so the FIRST utterance must go out synchronously — no cancel(),
   *        no timer. Deferring it (as an earlier version did, to accommodate
   *        Android) silently lost the permission and nothing ever spoke.
   */
  function speakCurrent(inGesture) {
    if (!state.on) return;
    const text = nextText();
    if (!text || text === state.last) { scheduleNext(Math.round(segmentMs / 3)); return; }
    state.last = text;

    if (inGesture && !state.unlocked) { utter(text); return; }

    /* Once unlocked, Android Chrome needs the opposite: it silently drops a
       speak() issued in the same task as a cancel(), so clear the queue and
       hand off to the next tick. */
    try { synth.cancel(); } catch (e) { /* ignore */ }
    setTimeout(() => { if (state.on) utter(text); }, CANCEL_GAP_MS);
  }

  /* `inGesture` must be true when start() is reached directly from a click or
     key handler, with nothing awaited in between. It speaks the first line
     synchronously, which is both the iOS unlock and the first real narration —
     there is no separate silent primer to be cancelled. */
  function start(inGesture) {
    if (state.on) return;
    state.on = true;
    btn.classList.remove('off');
    speakCurrent(inGesture === true);
    if (!state.voice) {
      loadVoices(synth).then((v) => {
        state.voice = state.voice || pickVoice(v, prefer);
        if (!state.voice) console.debug('No named voice available; using the engine default');
      });
    }
  }

  btn.onclick = (e) => {
    e.stopPropagation();
    if (state.on) stop(); else start(true);
  };

  /* Speech is gesture-gated on both platforms. Arm on the first interaction so
     the stream operator only has to tap the page once.

     Taps on our own control are ignored here: pointerdown fires before click,
     so arming from it would start the voice and the button's own handler would
     then immediately stop it, making the first press a no-op. Let the button
     speak for itself. */
  const arm = (e) => {
    if (e && e.target && e.target.closest && e.target.closest('.vv-ctl')) return;
    document.removeEventListener('pointerdown', arm);
    document.removeEventListener('keydown', arm);
    if (!state.on) start(true);
  };
  document.addEventListener('pointerdown', arm, { passive: true });
  document.addEventListener('keydown', arm);

  /* Both platforms suspend speech in a backgrounded tab and can return paused. */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || !state.on) return;
    try { synth.resume(); } catch (e) { /* ignore */ }
    if (!synth.speaking && !synth.pending) scheduleNext(400);
  });

  window.addEventListener('pagehide', stop);

  /* Warm the voice list so the first spoken line already has a chosen voice. */
  loadVoices(synth, 8000).then((v) => { state.voice = state.voice || pickVoice(v, prefer); });

  return {
    start, stop,
    isOn: () => state.on,
    voice: () => state.voice,
    voiceName: () => (state.voice ? `${state.voice.name} (${state.voice.lang})` : null)
  };
}
