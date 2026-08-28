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

/* Static channel snapshot.
   index.html already imports this module before its main render starts, so
   this keeps the subscriber figure in one small, cacheable source without
   adding another script tag to the stream page. The value is intentionally a
   snapshot, not presented as a live API result. */
if (typeof document !== "undefined") {
  const el = document.querySelector(".channel-sub");
  if (el) el.textContent = "🔴  ♙ 6629  👍 820";
}

/* ---------------------------------------------------------------------------
   Country recovery guard

   index.html's historical POOL is intentionally small and can become stale
   when a country's World Bank record is revised or a country is accidentally
   omitted from that pool. The page already imports this module before its main
   render, so use this tiny guard to recover Ukraine from the same World Bank
   population source without touching the page markup, ranking CSS, music,
   themes, narration, or any other UI.

   We only add the country when it is absent. The live page's existing ranking
   logic then sees the new row naturally and places it at its correct position.
   The country is anchored to the active baseline's 1-July year, matching the
   projection model used by index.html. If the source observation is older than
   the baseline, we carry it forward with its own observed CAGR before handing
   it to the existing live projection. */
(async function recoverUkraine(){
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const API="https://api.worldbank.org/v2/country/UKR/indicator/SP.POP.TOTL";
  const YEAR=365.25*86400;
  let lastAnchor="";

  function latestTwo(rows){
    const values=(rows||[])
      .filter(r=>typeof r.value==="number"&&Number.isFinite(r.value))
      .map(r=>({year:Number(r.date),value:r.value}))
      .filter(r=>Number.isFinite(r.year)&&r.value>0)
      .sort((a,b)=>b.year-a.year);
    return values.slice(0,2);
  }

  async function load(){
    try{
      if(!window.__souls||!window.__souls.data) return;
      const data=window.__souls.data;
      const countries=data.countries;
      if(!Array.isArray(countries)) return;

      const anchorYear=Number(data.year);
      if(!Number.isFinite(anchorYear)) return;

      /* Do not duplicate Ukraine if a future index baseline adds it itself. */
      const existing=countries.find(c=>Array.isArray(c)&&(
        c[1]==="Ukraine" || c[1]==="Ukrainian Republic"
      ));
      if(existing){lastAnchor=String(anchorYear);return;}

      /* Re-fetch only when the active baseline year changes. The first fetch
         is deliberately delayed until the main module has exposed __souls. */
      if(lastAnchor===String(anchorYear)) return;

      const response=await fetch(`${API}?format=json&mrv=8&per_page=20`,{cache:"no-store"});
      if(!response.ok) throw new Error(`Ukraine population HTTP ${response.status}`);
      const json=await response.json();
      const pair=latestTwo(json[1]);
      if(!pair.length) throw new Error("Ukraine population unavailable");

      const latest=pair[0];
      const previous=pair[1]||latest;
      const years=Math.max(1,latest.year-previous.year);
      let growth=0;
      if(previous.value>0&&latest.value>0){
        growth=(Math.pow(latest.value/previous.value,1/years)-1)*100;
      }

      /* Convert the latest observed population to the active baseline date so
         the existing countryPopulation() function can use the same global
         anchor without introducing a second rendering model. */
      const yearsToAnchor=anchorYear-latest.year;
      const populationAtAnchor=latest.value*Math.pow(1+growth/100,yearsToAnchor);

      /* Sanity bounds prevent a corrupt API value from entering the ranking. */
      if(!Number.isFinite(populationAtAnchor)||populationAtAnchor<=0||populationAtAnchor>100000000) {
        throw new Error("Ukraine population sanity check failed");
      }

      countries.push(["🇺🇦","Ukraine",populationAtAnchor,+growth.toFixed(2)]);
      lastAnchor=String(anchorYear);

      /* index.html's update loop calls ranking() on every tick. Mutating the
         same data.countries array is therefore enough to make Ukraine enter
         the actual Top 50; no DOM injection or duplicate table is used. */
    }catch(error){
      console.warn("Ukraine country recovery skipped:",error);
    }
  }

  /* index.html exposes __souls near the end of its module. Wait for that
     module rather than racing it. */
  for(let i=0;i<30&&!window.__souls;i++) await new Promise(r=>setTimeout(r,250));
  await load();

  /* Recheck occasionally so a newly published baseline does not leave the
     recovered country anchored to an obsolete source year. */
  setInterval(load,10*60*1000);
})();
