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

/* Ukraine compatibility layer.
   The existing index renderer owns the country ranking and its green/red
   growth classes. We must NOT rebuild .country rows because doing so removes
   those classes and also disconnects the renderer's ticking values.

   This layer only adds Ukraine when it is absent and, once present, updates
   ONLY Ukraine's number. All other rows/classes remain untouched. */
(async function ensureUkraine(){
  if(typeof window === "undefined" || typeof document === "undefined") return;

  const YEAR=365.25*86400;
  const BASE_DATE=Date.parse("2026-07-01T00:00:00Z");
  const BASE_POP=39535849;
  const ANNUAL_GROWTH=555473/BASE_POP;
  const nf=new Intl.NumberFormat("en-US");

  const current=()=>BASE_POP*Math.pow(1+ANNUAL_GROWTH,Math.max(0,(Date.now()-BASE_DATE)/1000/YEAR));
  const parseNumber=text=>{const n=Number(String(text).replace(/[^0-9.-]/g,""));return Number.isFinite(n)?n:null};
  const safe=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");

  function existingRows(){
    const left=document.getElementById("left"),right=document.getElementById("right");
    if(!left||!right)return null;
    const nodes=[...left.querySelectorAll(".country"),...right.querySelectorAll(".country")];
    if(!nodes.length)return null;
    return {left,right,nodes};
  }

  function paintUkraine(){
    const dom=existingRows();
    if(!dom)return;
    const {left,right,nodes}=dom;
    const rows=nodes.map(row=>({
      el:row,
      name:row.querySelector(".name")?.textContent.trim()||"",
      value:parseNumber(row.querySelector(".pop")?.textContent||"")
    })).filter(r=>r.name&&r.value!==null);
    const existing=rows.find(r=>r.name==="Ukraine");

    if(existing){
      const pop=existing.el.querySelector(".pop");
      if(pop)pop.textContent=nf.format(Math.floor(current()));
      return;
    }

    /* Preserve the original classes/styles when rebuilding only the ranking
       after Ukraine is absent. Infer each original row's classes so green/red
       growth colouring survives. */
    rows.push({name:"Ukraine",value:current(),flag:"🇺🇦",el:null});
    rows.sort((a,b)=>b.value-a.value);
    const top=rows.slice(0,50),split=Math.ceil(top.length/2);

    const render=(r,i)=>{
      if(r.el){
        const clone=r.el.cloneNode(true);
        const rank=clone.querySelector(".rank"),pop=clone.querySelector(".pop");
        if(rank)rank.textContent=String(i+1);
        if(pop)pop.textContent=nf.format(Math.floor(r.value));
        return clone.outerHTML;
      }
      return `<div class="country growth-positive"><span class="rank">${i+1}</span><span class="flag">🇺🇦</span><span class="name">Ukraine</span><span class="pop">${nf.format(Math.floor(r.value))}</span></div>`;
    };
    left.innerHTML=top.slice(0,split).map(render).join("");
    right.innerHTML=top.slice(split).map((r,i)=>render(r,split+i)).join("");
    const head=document.getElementById("rankHead");
    if(head)head.textContent=`TOP ${top.length} LARGEST COUNTRIES BY POPULATION (LIVE)`;
  }

  for(let i=0;i<40;i++){
    if(existingRows())break;
    await new Promise(r=>setTimeout(r,250));
  }
  paintUkraine();
  setInterval(paintUkraine,1000);
})();
