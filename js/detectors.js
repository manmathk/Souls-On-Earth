/* Fires when a monotonically rising counter crosses a multiple of `step`.

   The daily counters reset to zero at local midnight, so a falling value means
   a new day rather than a crossing. Without the re-baseline below, every
   crossing clip for the day would fire at once as the counter climbed back
   through bands it had already passed. */
export function createCrossingDetector(step) {
  let last = null;
  return {
    check(value) {
      if (last === null || value < last) {
        last = value;
        return null;
      }
      const prevBand = Math.floor(last / step);
      const band = Math.floor(value / step);
      last = value;
      return band > prevBand ? band * step : null;
    },
  };
}

/* Reports a swap between two adjacent ranks, which is the only reordering the
   compounding growth rates can actually produce between ticks. Anything larger
   means the baseline was replaced wholesale by the World Bank refresh, and
   announcing that as an overtake would be wrong. */
export function detectRankChange(prevNames, nextNames) {
  if (!prevNames || !nextNames) return null;
  if (prevNames.length !== nextNames.length) return null;

  let i = 0;
  while (i < prevNames.length && prevNames[i] === nextNames[i]) i++;
  if (i >= prevNames.length - 1) return null;

  const swapped =
    prevNames[i] === nextNames[i + 1] &&
    prevNames[i + 1] === nextNames[i] &&
    prevNames.slice(i + 2).every((n, k) => n === nextNames[i + 2 + k]);

  return swapped ? { over: nextNames[i], under: nextNames[i + 1] } : null;
}
