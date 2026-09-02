import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  segmentIndex, elapsedParts, formatElapsed, projectPopulation,
  doublingYears, yearsToOvertake, crossedThresholds, dayFraction, formatCount
} from './vertical-math.js';

test('segmentIndex wraps at the item count', () => {
  assert.equal(segmentIndex(0, 50000, 4), 0);
  assert.equal(segmentIndex(50000, 50000, 4), 1);
  assert.equal(segmentIndex(150000, 50000, 4), 3);
  assert.equal(segmentIndex(200000, 50000, 4), 0);
});

test('segmentIndex is stable within one segment', () => {
  assert.equal(segmentIndex(50000, 50000, 4), segmentIndex(99999, 50000, 4));
});

test('segmentIndex returns 0 for a degenerate count', () => {
  assert.equal(segmentIndex(123456, 50000, 0), 0);
  assert.equal(segmentIndex(123456, 0, 4), 0);
});

test('elapsedParts never goes negative for a future date', () => {
  assert.deepEqual(elapsedParts(1000, 0), { y: 0, d: 0, h: 0, m: 0, s: 0 });
});

test('formatElapsed zero-pads hours, minutes and seconds', () => {
  assert.equal(formatElapsed(0, 3723000), '0y 0d 01h 02m 03s');
});

test('formatElapsed groups thousands in the year count', () => {
  const out = formatElapsed(Date.UTC(476, 8, 4), Date.UTC(2026, 8, 2));
  assert.match(out, /^1,5\d{2}y \d{1,3}d \d{2}h \d{2}m \d{2}s$/);
});

test('projectPopulation grows an expanding population forward', () => {
  const anchor = Date.UTC(2024, 6, 1);
  const oneYearLater = anchor + 365.25 * 86400 * 1000;
  const grown = projectPopulation(1_000_000, 2024, 10, oneYearLater);
  assert.ok(grown > 1_000_000, 'population should grow');
  assert.ok(Math.abs(grown - 1_000_000 * Math.exp(0.01)) < 1, 'should match exp(net*years)');
});

test('projectPopulation clamps to the baseline before the anchor date', () => {
  assert.equal(projectPopulation(500, 2024, 10, Date.UTC(2020, 0, 1)), 500);
});

test('projectPopulation returns 0 for a non-positive baseline', () => {
  assert.equal(projectPopulation(0, 2024, 10, Date.now()), 0);
  assert.equal(projectPopulation(-5, 2024, 10, Date.now()), 0);
});

test('doublingYears follows ln2 over the rate', () => {
  assert.ok(Math.abs(doublingYears(10) - Math.LN2 / 0.01) < 1e-9);
});

test('doublingYears is Infinity for a non-positive rate', () => {
  assert.equal(doublingYears(0), Infinity);
  assert.equal(doublingYears(-5), Infinity);
});

test('yearsToOvertake solves the crossover for a faster challenger', () => {
  const t = yearsToOvertake({ pop: 100, netPerThousand: 20 }, { pop: 200, netPerThousand: 0 });
  assert.ok(Math.abs(t - Math.LN2 / 0.02) < 1e-9);
});

test('yearsToOvertake is 0 when the challenger already leads', () => {
  assert.equal(yearsToOvertake({ pop: 300, netPerThousand: 1 }, { pop: 200, netPerThousand: 1 }), 0);
});

test('yearsToOvertake is null when the challenger never catches up', () => {
  assert.equal(yearsToOvertake({ pop: 100, netPerThousand: 0 }, { pop: 200, netPerThousand: 10 }), null);
  assert.equal(yearsToOvertake({ pop: 100, netPerThousand: 5 }, { pop: 200, netPerThousand: 5 }), null);
});

test('crossedThresholds returns passed marks ascending and is inclusive', () => {
  const marks = [{ label: 'c', value: 1000 }, { label: 'a', value: 100 }, { label: 'b', value: 500 }];
  assert.deepEqual(crossedThresholds(500, marks), [{ label: 'a', value: 100 }, { label: 'b', value: 500 }]);
});

test('crossedThresholds is empty for junk input', () => {
  assert.deepEqual(crossedThresholds(NaN, [{ label: 'a', value: 1 }]), []);
  assert.deepEqual(crossedThresholds(10, null), []);
});

test('dayFraction is 0 at local midnight and ~0.5 at local noon', () => {
  const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
  assert.equal(dayFraction(midnight.getTime()), 0);
  const noon = new Date(); noon.setHours(12, 0, 0, 0);
  assert.ok(Math.abs(dayFraction(noon.getTime()) - 0.5) < 1e-6);
});

test('formatCount groups thousands and floors at zero', () => {
  assert.equal(formatCount(1234567.9), '1,234,567');
  assert.equal(formatCount(-5), '0');
  assert.equal(formatCount(NaN), '0');
});

test('elapsedParts guards non-finite inputs', () => {
  assert.deepEqual(elapsedParts(NaN, 0), { y: 0, d: 0, h: 0, m: 0, s: 0 });
  assert.deepEqual(elapsedParts(undefined, 0), { y: 0, d: 0, h: 0, m: 0, s: 0 });
});

test('formatElapsed contains no NaN when input is NaN', () => {
  assert.doesNotMatch(formatElapsed(NaN, 0), /NaN/);
});

test('segmentIndex guards negative now to stay in range', () => {
  const idx = segmentIndex(-1, 50000, 4);
  assert.ok(idx >= 0 && idx < 4);
});
