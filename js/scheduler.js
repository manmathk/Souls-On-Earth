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

const SCHEDULED = ["fact", "wry", "chat", "timeofday"];

/* Selection has three jobs: keep the mix varied (category rotation), respect
   the clock (timeofday gating), and let genuine on-screen events jump the
   queue. History blocking is best-effort — if every candidate is blocked we
   would rather repeat a line than fall silent, so the fallback ignores it. */
export function createScheduler({ lines, historySize = 60, random = Math.random }) {
  const byId = new Map(lines.map((l) => [l.id, l]));
  const history = createHistory(historySize);
  const events = [];
  let lastCategory = null;

  const bags = new Map();
  for (const cat of SCHEDULED) {
    const ids = lines.filter((l) => l.category === cat).map((l) => l.id);
    if (ids.length) bags.set(cat, createBag(ids, random));
  }

  function eligible(id, hourUTC) {
    const line = byId.get(id);
    if (!line) return false;
    if (!line.hours) return true;
    const [from, to] = line.hours;
    // A window may wrap past midnight (e.g. 22 -> 5).
    return from <= to ? hourUTC >= from && hourUTC < to
                      : hourUTC >= from || hourUTC < to;
  }

  function pickFrom(cat, hourUTC, allowRepeat) {
    const bag = bags.get(cat);
    if (!bag) return null;
    // Bounded scan: one full pass of the bag is enough to know.
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

      let cats = SCHEDULED.filter((c) => c !== lastCategory && bags.has(c));
      if (!cats.length) {
        cats = SCHEDULED.filter((c) => bags.has(c));
      }
      const order = createBag(cats, random);

      for (const allowRepeat of [false, true]) {
        for (let i = 0; i < cats.length; i++) {
          const cat = order.take();
          if (cat === null) break;
          const id = pickFrom(cat, hourUTC, allowRepeat);
          if (id) {
            history.push(id);
            lastCategory = cat;
            return id;
          }
        }
      }
      return null;
    },

    pushEvent(id) {
      if (byId.has(id)) events.push(id);
    },

    state: () => ({ lastCategory, pendingEvents: events.length }),
  };
}
