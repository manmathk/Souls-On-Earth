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
