/* Pure helpers shared by the vertical 9:16 stream pages.

   This is the one piece of shared code in the vertical page family. It exists
   because inline <script> blocks cannot be imported by a test, and this
   arithmetic is worth testing. Keep it free of DOM access and rendering so it
   stays testable under `node --test`. */

const YEAR_SECONDS = 365.25 * 86400;
/* Tropical year, matching the elapsed() helper already in historical-events.html
   so the two pages agree on how old a historical date is. */
const TROPICAL_YEAR_SECONDS = 365.2425 * 86400;
const nf = new Intl.NumberFormat('en-US');

export function segmentIndex(now, segmentMs, count) {
  if (!Number.isFinite(now) || !Number.isFinite(segmentMs) || segmentMs <= 0) return 0;
  if (!Number.isInteger(count) || count <= 0) return 0;
  return (Math.floor(now / segmentMs) % count + count) % count;
}

export function elapsedParts(fromMs, now = Date.now()) {
  if (!Number.isFinite(fromMs) || !Number.isFinite(now)) {
    return { y: 0, d: 0, h: 0, m: 0, s: 0 };
  }
  let s = Math.max(0, (now - fromMs) / 1000);
  const y = Math.floor(s / TROPICAL_YEAR_SECONDS);
  s -= y * TROPICAL_YEAR_SECONDS;
  const d = Math.floor(s / 86400);
  s -= d * 86400;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  return { y, d, h, m, s: Math.floor(s - m * 60) };
}

export function formatElapsed(fromMs, now = Date.now()) {
  const p = elapsedParts(fromMs, now);
  const pad = (n) => String(n).padStart(2, '0');
  return `${nf.format(p.y)}y ${p.d}d ${pad(p.h)}h ${pad(p.m)}m ${pad(p.s)}s`;
}

/* Same exponential model as humanityProject() in js/humanity-data.js: the
   baseline is anchored to 1 July of its reference year, because World Bank
   annual figures are mid-year estimates. */
export function projectPopulation(baseline, baseYear, netPerThousand, now = Date.now()) {
  const base = Number(baseline);
  if (!Number.isFinite(base) || base <= 0) return 0;
  const anchor = Date.UTC(Number(baseYear) || 2024, 6, 1);
  const years = Math.max(0, (now - anchor) / 1000 / YEAR_SECONDS);
  const net = Number.isFinite(Number(netPerThousand)) ? Number(netPerThousand) / 1000 : 0;
  return base * Math.exp(net * years);
}

export function doublingYears(netPerThousand) {
  const r = Number(netPerThousand) / 1000;
  if (!Number.isFinite(r) || r <= 0) return Infinity;
  return Math.LN2 / r;
}

/* When does `a` overtake `b`, in years? Both grow exponentially, so
   pop_a * e^(ra*t) = pop_b * e^(rb*t) solves to t = ln(pb/pa) / (ra - rb).
   Returns null when the crossover never happens. */
export function yearsToOvertake(a, b) {
  const pa = Number(a && a.pop);
  const pb = Number(b && b.pop);
  const ra = Number(a && a.netPerThousand) / 1000;
  const rb = Number(b && b.netPerThousand) / 1000;
  if (!Number.isFinite(pa) || !Number.isFinite(pb) || pa <= 0 || pb <= 0) return null;
  if (!Number.isFinite(ra) || !Number.isFinite(rb)) return null;
  if (pa >= pb) return 0;
  if (ra <= rb) return null;
  const t = Math.log(pb / pa) / (ra - rb);
  return Number.isFinite(t) && t >= 0 ? t : null;
}

export function crossedThresholds(value, thresholds) {
  const v = Number(value);
  if (!Number.isFinite(v) || !Array.isArray(thresholds)) return [];
  return thresholds
    .filter((t) => t && Number.isFinite(Number(t.value)) && Number(t.value) <= v)
    .sort((x, y) => Number(x.value) - Number(y.value));
}

export function dayFraction(now = Date.now()) {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const elapsed = (now - midnight.getTime()) / 1000;
  return Math.min(1, Math.max(0, elapsed / 86400));
}

export function formatCount(n) {
  return nf.format(Math.max(0, Math.floor(Number(n) || 0)));
}
