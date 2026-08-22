// js/playlist.js

/* Rotation order for the background music bed. Shuffles the track list, plays
   it through, then reshuffles — so a page that has been up for weeks does not
   march through the same sequence, and a restart does not always open on the
   same track.

   `rng` is injectable so the tests can pin the shuffle. */
export function createPlaylist({ tracks, rng = Math.random }) {
  /* A track whose file 404s or fails to decode is retired for the session.
     Without this, one bad filename comes back every pass and drops the bed
     into silence each time. */
  const dead = new Set();
  let order = [];
  let index = 0;
  let last = null;

  function shuffled() {
    const pool = tracks.filter((t) => !dead.has(t));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // A fresh pass opening on the track that just finished would play it twice
    // back to back. With a single live track that repeat is the only option.
    if (pool.length > 1 && pool[0] === last) {
      [pool[0], pool[1]] = [pool[1], pool[0]];
    }
    return pool;
  }

  return {
    /* The next track to play, or null when nothing is left playable — callers
       must stop on null rather than retrying, or a fully-retired list spins. */
    next() {
      for (;;) {
        if (index >= order.length) {
          order = shuffled();
          index = 0;
          if (order.length === 0) return null;
        }
        const track = order[index++];
        if (dead.has(track)) continue; // retired after this pass was built
        last = track;
        return track;
      }
    },

    retire(track) {
      dead.add(track);
    },
  };
}
