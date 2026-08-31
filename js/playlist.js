// js/playlist.js

/* Index data refreshes asynchronously. During a baseline swap the old DOM can
   survive for one tick while the country array has already changed. Keep that
   transient state from taking down the live counter. This is intentionally
   scoped to .pop cells on index.html; other pages and other NodeLists are not
   affected. */
(function guardStalePopulationRows(){
  if(typeof window==='undefined'||!window.NodeList||!window.__souls)return;
  const proto=window.NodeList.prototype;
  if(proto.__soulsPopGuard)return;
  const original=proto.forEach;
  proto.forEach=function(callback,thisArg){
    if(typeof callback!=='function')return original.call(this,callback,thisArg);
    return original.call(this,(el,index,list)=>{
      try{
        if(el&&el.nodeType===1&&el.classList&&el.classList.contains('pop')){
          const i=Number(el.dataset&&el.dataset.i);
          const countries=window.__souls&&window.__souls.data&&window.__souls.data.countries;
          if(!Number.isInteger(i)||!Array.isArray(countries)||!countries[i]||!Array.isArray(countries[i])||countries[i].length<4)return;
        }
      }catch(e){
        /* A defensive guard must never become a new source of page failure. */
      }
      return callback.call(thisArg,el,index,list);
    },thisArg);
  };
  Object.defineProperty(proto,'__soulsPopGuard',{value:true,enumerable:false});
})();

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
    if (pool.length > 1 && pool[0] === last) {
      [pool[0], pool[1]] = [pool[1], pool[0]];
    }
    return pool;
  }

  return {
    next() {
      for (;;) {
        if (index >= order.length) {
          order = shuffled();
          index = 0;
          if (order.length === 0) return null;
        }
        const track = order[index++];
        if (dead.has(track)) continue;
        last = track;
        return track;
      }
    },
    retire(track) {
      dead.add(track);
    },
  };
}
