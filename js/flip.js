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

/* Ukraine recovery for the existing index renderer.
   The historical POOL in index.html contains exactly 50 entries and omits
   Ukraine. The main module keeps that POOL in module scope, so this module
   cannot mutate it directly. Instead, after the renderer paints, we reconcile
   the visible ranking from the rows already produced by index.html and the
   authoritative Ukraine population series. This preserves the existing UI and
   does not add a second table or alter the page layout. */
(async function ensureUkraine(){
  if(typeof window === "undefined" || typeof document === "undefined") return;
  const YEAR=365.25*86400;
  let ukraine=null;

  function parseNumber(text){
    const n=Number(String(text).replace(/[^0-9.-]/g,""));
    return Number.isFinite(n)?n:null;
  }
  function latestTwo(rows){
    return (rows||[]).filter(x=>typeof x.value==="number"&&x.value>0)
      .map(x=>({year:Number(x.date),value:x.value}))
      .filter(x=>Number.isFinite(x.year))
      .sort((a,b)=>b.year-a.year).slice(0,2);
  }
  async function loadUkraine(){
    try{
      const r=await fetch("https://api.worldbank.org/v2/country/UKR/indicator/SP.POP.TOTL?format=json&mrv=8&per_page=20",{cache:"no-store"});
      if(!r.ok) throw Error("Ukraine API HTTP "+r.status);
      const j=await r.json();
      const p=latestTwo(j[1]);
      if(!p.length) throw Error("Ukraine population unavailable");
      const latest=p[0],prev=p[1]||p[0],years=Math.max(1,latest.year-prev.year);
      const growth=prev.value>0?(Math.pow(latest.value/prev.value,1/years)-1):0;
      const baselineYear=new Date().getUTCFullYear();
      const anchor=Date.UTC(baselineYear,6,1);
      const yearsToAnchor=(anchor-Date.UTC(latest.year,6,1))/1000/YEAR;
      const base=latest.value*Math.pow(1+growth,yearsToAnchor);
      ukraine={name:"Ukraine",flag:"🇺🇦",base,growth,anchor};
    }catch(e){console.warn("Ukraine recovery failed",e)}
  }
  function currentUkraine(){
    if(!ukraine)return null;
    const years=(Date.now()-ukraine.anchor)/1000/YEAR;
    return ukraine.base*Math.pow(1+ukraine.growth,Math.max(0,years));
  }
  function reconcile(){
    const left=document.getElementById("left"),right=document.getElementById("right");
    if(!left||!right)return;
    const containers=[...left.querySelectorAll(".country"),...right.querySelectorAll(".country")];
    if(containers.length<2)return;
    if(containers.some(row=>row.querySelector(".name")?.textContent.trim()==="Ukraine"))return;
    const uk=currentUkraine();
    if(!uk)return;
    const rows=containers.map(row=>({
      row,
      name:row.querySelector(".name")?.textContent.trim()||"",
      flag:row.querySelector(".flag")?.textContent.trim()||"",
      pop:parseNumber(row.querySelector(".pop")?.textContent||row.querySelector("strong")?.textContent||"")
    })).filter(x=>x.name&&x.pop!=null);
    if(rows.length<2)return;
    rows.push({name:uk.name,flag:uk.flag,pop:uk});
    rows.sort((a,b)=>(typeof b.pop==="number"?b.pop:b.pop)-(typeof a.pop==="number"?a.pop:a.pop));
    const top=rows.slice(0,50);
    const html=r=>`<div class="country"><span class="rank">${r.rank}</span><span class="flag">${r.flag}</span><span class="name">${r.name.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</span><span class="pop">${new Intl.NumberFormat("en-US").format(Math.floor(r.pop))}</span></div>`;
    const split=Math.ceil(top.length/2);
    left.innerHTML=top.slice(0,split).map((r,i)=>html({...r,rank:i+1})).join("");
    right.innerHTML=top.slice(split).map((r,i)=>html({...r,rank:split+i+1})).join("");
  }
  await loadUkraine();
  /* The main module renders asynchronously. Reconcile shortly after startup,
     then repeat at the same cadence as its live ranking so Ukraine cannot be
     overwritten by the legacy 50-country renderer. */
  setTimeout(reconcile,1500);
  setInterval(reconcile,1100);
})();