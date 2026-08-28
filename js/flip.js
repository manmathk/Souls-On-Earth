// js/flip.js
const MIN_MOVE = 0.5;
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
if (typeof document !== "undefined") {
  const el = document.querySelector(".channel-sub");
  if (el) el.textContent = "🔴  ♙ 6629  👍 820";
}

/* Ukraine is not in index.html's historical POOL, so it cannot participate in
   that page's own per-second update loop. Keep the existing renderer/UI intact
   and maintain Ukraine as a real live row using the same 1-July-2026 UN-WPP
   baseline used by the page's built-in world snapshot.

   2026-07-01 Ukraine population: 39,535,849
   2026 annual population change: +555,473 (~+1.43%)
   The positive rate is important: Ukraine's total population projection can
   rise even though natural increase is negative because net migration is part
   of the UN projection. Do NOT derive this row from birth/death alone. */
(async function ensureUkraine(){
  if(typeof window === "undefined" || typeof document === "undefined") return;

  const YEAR=365.25*86400;
  const BASE_DATE=Date.parse("2026-07-01T00:00:00Z");
  const BASE_POP=39535849;
  const ANNUAL_GROWTH=555473/BASE_POP; // UN-WPP 2026 total population change
  const nf=new Intl.NumberFormat("en-US");

  function current(){
    const years=Math.max(0,(Date.now()-BASE_DATE)/1000/YEAR);
    return BASE_POP*Math.pow(1+ANNUAL_GROWTH,years);
  }
  function parseNumber(text){
    const n=Number(String(text).replace(/[^0-9.-]/g,""));
    return Number.isFinite(n)?n:null;
  }
  function safe(s){
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");
  }
  function makeRow(r,i){
    return `<div class="country"><span class="rank">${i+1}</span><span class="flag">${r.flag}</span><span class="name">${safe(r.name)}</span><span class="pop">${nf.format(Math.floor(r.value))}</span></div>`;
  }

  function rowsFromDOM(){
    const left=document.getElementById("left"),right=document.getElementById("right");
    if(!left||!right)return null;
    const nodes=[...left.querySelectorAll(".country"),...right.querySelectorAll(".country")];
    if(!nodes.length)return null;
    return nodes.map(row=>({
      name:row.querySelector(".name")?.textContent.trim()||"",
      flag:row.querySelector(".flag")?.textContent.trim()||"🌐",
      value:parseNumber(row.querySelector(".pop")?.textContent||"")
    })).filter(r=>r.name&&r.value!==null&&r.name!=="Ukraine");
  }

  function paint(){
    const left=document.getElementById("left"),right=document.getElementById("right");
    if(!left||!right)return;

    const existing=[...left.querySelectorAll(".country"),...right.querySelectorAll(".country")];
    const uk=existing.find(row=>row.querySelector(".name")?.textContent.trim()==="Ukraine");

    /* If the main renderer has already put Ukraine back, update only its
       number. This is the important part that was missing: the previous guard
       returned as soon as Ukraine existed, leaving its displayed integer
       frozen forever. */
    if(uk){
      const pop=uk.querySelector(".pop");
      if(pop)pop.textContent=nf.format(Math.floor(current()));
      return;
    }

    /* Main index.html can re-render its original 50 rows when its own ranking
       changes. Reinsert Ukraine into that freshly rendered DOM without
       changing the page's CSS or controls. */
    const rows=rowsFromDOM();
    if(!rows||rows.length<2)return;
    rows.push({name:"Ukraine",flag:"🇺🇦",value:current()});
    rows.sort((a,b)=>b.value-a.value);
    const top=rows.slice(0,50),split=Math.ceil(top.length/2);
    left.innerHTML=top.slice(0,split).map(makeRow).join("");
    right.innerHTML=top.slice(split).map((r,i)=>makeRow(r,split+i)).join("");
    const head=document.getElementById("rankHead");
    if(head)head.textContent=`TOP ${top.length} LARGEST COUNTRIES BY POPULATION (LIVE)`;
  }

  /* Wait for index.html's module to paint its first ranking. */
  for(let i=0;i<40;i++){
    if(document.getElementById("left")?.querySelector(".country"))break;
    await new Promise(r=>setTimeout(r,250));
  }
  paint();
  setInterval(paint,1000);
})();
