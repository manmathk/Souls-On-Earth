// js/flip.js

/* Sub-pixel drift is a constant on a fluid layout, and every rank change
   re-measures all 50 rows. Without a floor, a tick that moved nothing would
   still queue 50 animations of a third of a pixel. */
const MIN_MOVE = 0.5;

/* Where each row WAS relative to where it now IS, keyed the same as the input
   maps. Applying a shift as a transform puts the row back at its old position,
   so animating that transform to zero carries it to the new one -- the FLIP
   trick, which lets a wholesale innerHTML re-render still look like movement.

   Rows present in only one of the two maps are skipped: there is nowhere to
   animate them from or to. */
export function computeShifts(before, after) {
  const shifts = new Map();
  for (const [key, now] of after) {
    const was = before.get(key);
    if (!was) continue;
    const dx = was.x - now.x;
    const dy = was.y - now.y;
    if (Math.abs(dx) < MIN_MOVE && Math.abs(dy) < MIN_MOVE) continue;
    shifts.set(key, { dx, dy });
  }
  return shifts;
}
