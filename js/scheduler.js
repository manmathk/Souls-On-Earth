/* Draw without replacement, reshuffling only once the bag empties. Plain
   random selection clusters: over 230 lines it replays a line within a few
   minutes often enough to be audible on a 24/7 stream. */
export function createBag(ids, random = Math.random) {
  const source = [...ids];
  let pool = [];

  function refill() {
    pool = [...source];
    // Fisher-Yates, driven by the injected random so tests stay deterministic.
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }

  return {
    take() {
      if (!source.length) return null;
      if (!pool.length) refill();
      return pool.pop();
    },
    remaining() {
      return pool.length;
    },
  };
}

/* Fixed-size ring of recently played ids. An id stays blocked until `size`
   others have aired, which is what sets the floor between repeats. */
export function createHistory(size) {
  const ring = [];
  return {
    has: (id) => ring.includes(id),
    push(id) {
      ring.push(id);
      if (ring.length > size) ring.shift();
    },
  };
}

/* All normal voiceovers share one global shuffle bag. This means the next
   voice is randomized across fact/wry/chat/timeofday instead of forcing a
   category rotation. Each clip is drawn once before the pool reshuffles.
   Time-of-day constraints are still respected. Event-triggered clips retain
   priority over the normal shuffle. */
export function createScheduler({ lines, historySize = 60, random = Math.random }) {
  const byId = new Map(lines.map((l) => [l.id, l]));
  const history = createHistory(historySize);
  const events = [];
  const bag = createBag(lines.map((l) => l.id), random);

  function eligible(id, hourUTC) {
    const line = byId.get(id);
    if (!line) return false;
    if (!line.hours) return true;
    const [from, to] = line.hours;
    // A window may wrap past midnight (e.g. 22 -> 5).
    return from <= to ? hourUTC >= from && hourUTC < to
                      : hourUTC >= from || hourUTC < to;
  }

  function pick(hourUTC, allowRepeat) {
    const limit = lines.length + 1;
    for (let i = 0; i < limit; i++) {
      const id = bag.take();
      if (id === null) return null;
      if (!eligible(id, hourUTC)) continue;
      if (!allowRepeat && history.has(id)) continue;
      return id;
    }
    return null;
  }

  return {
    next({ hourUTC }) {
      if (events.length) {
        const id = events.shift();
        history.push(id);
        return id;
      }

      // Prefer an unseen clip from the current shuffle cycle. Only when the
      // recent-history window blocks the entire cycle do we allow a repeat.
      for (const allowRepeat of [false, true]) {
        const id = pick(hourUTC, allowRepeat);
        if (id) {
          history.push(id);
          return id;
        }
      }
      return null;
    },

    pushEvent(id) {
      if (byId.has(id)) events.push(id);
    },

    state: () => ({ pendingEvents: events.length, remaining: bag.remaining() }),
  };
}
