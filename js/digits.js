// js/digits.js

/* Which characters of the counter moved between two ticks.

   The world figure gains a couple of souls a second, so all but the last digit
   or two are identical every time -- animating the whole number would mean
   thirteen animations a second to show two digits moving.

   A change in width means the thousands separators have all shifted, so
   patching characters in place would leave the commas in the wrong columns:
   the caller rebuilds instead, and nothing animates on that tick. */
export function diffDigits(prev, next) {
  if (prev.length !== next.length) return { rebuild: true, changed: [] };
  const changed = [];
  for (let i = 0; i < next.length; i++) {
    if (prev[i] !== next[i]) changed.push(i);
  }
  return { rebuild: false, changed };
}
