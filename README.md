# Souls On Earth 🌍

**Souls On Earth** is a browser-based, real-time world population visualization designed for **24/7 YouTube Live streaming**. It presents a continuously updating estimate of Earth's population together with births, deaths, population growth, and country rankings.

## 🚀 Live Project

**GitHub Pages:** https://manmathk.github.io/Souls-On-Earth/

## ✨ Features

### 🌍 Live World Population
- Continuously updates the estimated global population.
- Uses a calculated live progression between authoritative population observations rather than displaying a stale static number.
- Digit-level rendering keeps the large population counter visually stable while values change.

### 👶 Births, Deaths & Population Growth
- Tracks estimated births during the current day.
- Tracks estimated deaths during the current day.
- Calculates population growth as births minus deaths.
- Counters are designed to continue ticking during a long-running live stream.
- Semantic colors communicate direction: **green for positive growth, red for deaths/negative movement, and neutral styling where appropriate**.

### 🌎 Country Population Ranking
- Displays a live ranking of the world's largest countries by population.
- Supports a **Top 50** country view on the main layout.
- Country values are projected forward from the latest available demographic baseline so older annual data can be converted into a current live estimate.
- Country populations continue increasing/decreasing according to their configured demographic rates.
- Ukraine is explicitly included in the country dataset and is kept synchronized with the live renderer.

### 📺 YouTube Live Optimized
The interface is designed specifically for continuous horizontal YouTube Live streams:

- Responsive desktop and mobile layout.
- Two-column country ranking.
- Safe spacing around YouTube's mobile player controls and overlays.
- Important counters remain visible without requiring scrolling.
- Lightweight CSS animations for ambient visual movement.
- No canvas-based animation loop for decorative effects, helping reduce CPU usage during long streams.

### 🎨 Visual Design
- Clean white primary interface.
- YouTube-inspired red LIVE and Subscribe controls.
- Green population-growth indicators.
- Red death indicators.
- Responsive typography and spacing.
- Optional visual themes are supported by the existing theme system.
- Ambient floating particles provide subtle motion without interfering with the data.

### 💬 Viewer Engagement
The stream includes viewer-facing prompts such as:

> 👇 COMMENT YOUR COUNTRY IN THE CHAT! 👇

This is intended to encourage interaction during a long-running population stream.

## 📊 Data & Methodology

Population figures from public demographic datasets are **estimates**, not a live census count. The application converts the latest available population observations and demographic rates into a continuously moving estimate.

Conceptually, the live projection follows:

```text
Current estimate ≈ baseline population + elapsed time × population change rate
```

For countries where the source data is annual, the application interpolates/extrapolates the population between the available observation date and the current time.

This approach makes the visualization behave like a live population clock while retaining a transparent connection to the underlying demographic data.

### Important accuracy note

The displayed number should be understood as a **statistical live estimate**, not an exact real-time measurement of every person born or deceased at that instant. Population datasets are periodically revised, and different organizations can publish different estimates because of methodology, reference dates, migration assumptions, and revision cycles.

## 🧩 Project Structure

```text
Souls-On-Earth/
├── index.html              # Main horizontal live population page
├── js/
│   ├── phase1-counters.js  # Population/birth/death live counters
│   └── flip.js             # Ranking/visual transition compatibility logic
├── README.md               # Project documentation
└── ...                     # Supporting assets and project files
```

## 📱 Vertical 9:16 Page Family

Four pages built for portrait streaming — a vertical 24/7 live source that is also
clippable into Shorts:

| Page | What it shows |
|---|---|
| `vs.html` | Head-to-head country matchups with a live widening/closing verdict |
| `focus.html` | One country per segment with doubling time, crossover estimate and world share |
| `scale.html` | A day's births, deaths or net growth climbing past real place populations |
| `chronicle.html` | Authored history moments with live elapsed-time counters |

### How the frame works

The viewport is the live frame. A centred 9:16 stage inside it holds all content, and
the leftover bands carry the channel header and the comment CTA. A Short cropped to
9:16 therefore lands exactly on the stage, free of chrome, while the live stream shows
both. The stage is sized with:

```css
width: min(100vw, calc((100dvh - 100px) * 9 / 16)); aspect-ratio: 9/16;
```

`width` resolves through `min()` and `aspect-ratio` derives the height, so the stage
can never overflow either axis. The `100px` is the two chrome bands (56 + 44) — change
one and you must change the other.

Segments advance every 50 seconds, indexed off the wall clock
(`Math.floor(Date.now() / 50000) % count`) so rotation is self-correcting after
background-tab throttling and identical across devices. DOM is rebuilt once per
segment; only number text updates each second.

### Visual system

Palette, display faces and devices follow `index-backup.html` so the vertical family
reads as the same channel: obsidian ground, ember glow from below, gold rim light from
above, bone text. Display type is Bebas Neue, live numbers are JetBrains Mono, both
loaded with `font-display:swap` behind full system fallbacks — a page with no network
still renders correctly. The ember field is nine nodes animated purely in CSS, so it
costs nothing over a long session.

`.chrome-top` carries 56px of right padding on purpose: `js/ambient-ui.js` pins a
fixed music button at `right:10px`, which otherwise sits on top of the nav and clips
the last link.

### Editing the content

- `data/chronicle.json` — history entries (`id`, `era`, `title`, `date`, `body`).
  Entries whose date does not parse are dropped with a console warning rather than
  shown with a substituted date. The body text is read aloud verbatim by the
  voice-over, so it is the main thing worth editing.
- `data/focus-notes.json` — an optional authored line per country, keyed by ISO3.
  Absent keys are fine; the page then shows derived facts only.

### Voice-over

`js/vertical-voice.js` narrates the segment currently on screen. Each page passes a
`lines()` function that reads its own live DOM, so the narration always matches what
is displayed rather than following a fixed script. One line per segment, spoken
through the Web Speech API, with the music bed ducked underneath.

The control sits below the music button at `right:10px; top:62px` and uses a
**microphone** glyph (U+1F399 U+FE0F), deliberately not a speaker — `ambient-ui.js`
already owns the speaker glyphs (U+1F50A / U+1F507) for the music bed, and three
speaker variants stacked together were impossible to tell apart. Dimmed at 0.42
opacity when narration is off, full opacity when on. Speech is gesture-gated by every
browser, so the first tap anywhere on the page arms it.

Each page gets its own voice, rate and pitch, so the four sound like different
narrators rather than one script read four times:

| Page | Preferred voice | Rate / pitch |
|---|---|---|
| `chronicle.html` | Daniel, Google UK English Male, Arthur | 0.86 / 0.86 — grave storyteller |
| `vs.html` | Google US English, Alex, Aaron | 0.99 / 0.98 — brisk announcer |
| `scale.html` | Samantha, Google UK English Female | 0.93 / 1.00 — clear and neutral |
| `focus.html` | Moira, Rishi, Google Australian | 0.90 / 0.94 — documentary |

`prefer` is a list of name patterns tried in order among English voices, falling back
to a generic ordering when a device ships none of them. The rate and pitch differences
mean the pages still sound distinct on a device with only one voice installed.

Five things this has to work around:

- `speechSynthesis.getVoices()` returns `[]` on the first synchronous call in both
  Chrome and Safari. It is populated asynchronously, so the module waits on
  `voiceschanged` and also polls, since Safari often never fires that event.
- **iOS** grants speech only if the first `speak()` runs synchronously inside the
  gesture handler. Awaiting anything first — or routing it through a timer — loses the
  permission. So the first line is spoken directly from the click/key handler with no
  `cancel()` and no `setTimeout` in between; that utterance is both the unlock and the
  first real narration.
- **Android Chrome** drops a `speak()` issued in the same task as a `cancel()`, so
  from the second line onward the two are separated by a tick. These two requirements
  pull in opposite directions, which is why the first utterance is special-cased
  instead of every utterance being deferred.
- Apple ships novelty voices (`Bad News`, `Bubbles`, `Zarvox`) that are `en-US` and
  would win a naive language-only match. They are excluded by name — but only the
  genuinely comic ones: `Rishi`, `Reed`, `Flo`, `Eddy`, `Sandy` and `Shelley` are
  ordinary voices and blocking them cut the usable pool on a stock Mac from 16 down
  to 5, which made two pages fall back onto the same voice.

Every utterance is watchdogged: if `onend` never fires the queue is reset, so one
wedged line cannot silence the rest of a multi-week session.

**Known limitation on iOS:** speech cannot be routed through Web Audio, so the music
bed cannot be ducked the way `js/narrator.js` ducks its mp3 lines — ducking relies on
`HTMLMediaElement.volume`, which iOS Safari ignores. On iPhone the voice competes with
the music at full level; lower it with the music button if the mix is wrong.

### Shared code

Three modules are shared: the existing `js/humanity-data.js` (World Bank client,
data-only), `js/vertical-math.js` (pure functions, covered by
`node js/vertical-math.test.js` — 21 tests), and `js/vertical-voice.js` (narration
engine). Each page owns its own CSS and rendering, so the frame CSS is intentionally
repeated per page.

## ⚙️ Technology

- HTML5
- CSS3
- Vanilla JavaScript
- ES modules
- Public demographic/population data sources
- GitHub Pages for static hosting

No server is required for the basic visualization. The page runs directly in the browser and performs its data calculations and rendering client-side.

## ▶️ Running Locally

Because the project uses JavaScript modules, serve it through a local HTTP server rather than opening `index.html` directly with `file://`.

For example:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## 📡 YouTube Live Usage

The page can be captured as a browser source or shared directly through a streaming setup for a continuous horizontal live broadcast.

Recommended stream format:

- **16:9 horizontal**
- 1080p when available
- 24/7 continuous broadcast
- Browser/page audio enabled when applicable

## 🔧 Design Principles

1. **Never freeze the live counters.**
2. **Keep the UI readable on both desktop and mobile.**
3. **Preserve semantic green/red population indicators.**
4. **Avoid unnecessary full-page DOM rebuilds every second.**
5. **Keep country rankings synchronized with the live counter engine.**
6. **Protect important data from common YouTube mobile overlays.**
7. **Prefer lightweight browser-side animation for long-running streams.**

## ⚠️ Disclaimer

Souls On Earth is an educational/visualization project. Population values are modeled statistical estimates and should not be interpreted as exact census figures or official real-time counts.

## 📜 License

See the repository files for the applicable project licensing information.
