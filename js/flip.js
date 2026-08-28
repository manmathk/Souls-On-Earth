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

/* The current index.html has a fixed 50-country POOL that omits Ukraine.
   Keep the existing UI and renderer untouched, but reconcile the already
   rendered ranking with Ukraine's live population estimate. */
(async function ensureUkraine(){
  if(typeof window === "undefined" || typeof document === "undefined") return;
  const YEAR=365.25*86400;
  let ukraine=null;
  const nf=new Intl.NumberFormat("en-US");
  const parseNumber=text=>{const n=Number(String(text).replace(/[^0-9.-]/g,""));return Number.isFinite(n)?n:null};
  const latestTwo=rows=>(rows||[]).filter(x=>typeof x.value==="number"&&x.value>0).map(x=>({year:Number(x.date),value:x.value})).filter(x=>Number.isFinite(x.year)).sort((a,b)=>b.year-a.year).slice(0,2);
  async function loadUkraine(){
    try{
      const r=await fetch("https://api.worldbank.org/v2/country/UKR/indicator/SP.POP.TOTL?format=json&mrv=8&per_page=20",{cache:"no-store"});
      if(!r.ok)throw Error("Ukraine API HTTP "+r.status);
      const j=await r.json(),p=latestTwo(j[1]);
      if(!p.length)throw Error("Ukraine population unavailable");
      const latest=p[0],prev=p[1]||p[0],years=Math.max(1,latest.year-prev.year);
      const growth=prev.value>0?Math.pow(latest.value/prev.value,1/years)-1:0;
      const anchor=Date.UTC(latest.year,6,1);
      ukraine={base:latest.value,growth,anchor};
    }catch(e){console.warn("Ukraine recovery failed",e)}
  }
  function current(){return ukraine?ukraine.base*Math.pow(1+ukraine.growth,Math.max(0,(Date.now()-ukraine.anchor)/1000/YEAR)):null}
  function reconcile(){
    const left=document.getElementById("left"),right=document.getElementById("right");
    if(!left||!right||!ukraine)return;
    const nodes=[...left.querySelectorAll(".country"),...right.querySelectorAll(".country")];
    if(nodes.length<2)return;
    if(nodes.some(row=>row.querySelector(".name")?.textContent.trim()==="Ukraine"))return;
    const rows=nodes.map(row=>({
      name:row.querySelector(".name")?.textContent.trim()||"",
      flag:row.querySelector(".flag")?.textContent.trim()||"🌐",
      value:parseNumber(row.querySelector(".pop")?.textContent||"")
    })).filter(r=>r.name&&r.value!==null);
    if(rows.length<2)return;
    rows.push({name:"Ukraine",flag:"🇺🇦",value:current()});
    rows.sort((a,b)=>b.value-a.value);
    const top=rows.slice(0,50),split=Math.ceil(top.length/2);
    const safe=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");
    const row=(r,i)=>`<div class="country"><span class="rank">${i+1}</span><span class="flag">${r.flag}</span><span class="name">${safe(r.name)}</span><span class="pop">${nf.format(Math.floor(r.value))}</span></div>`;
    left.innerHTML=top.slice(0,split).map(row).join("");
    right.innerHTML=top.slice(split).map((r,i)=>row(r,split+i)).join("");
  }
  await loadUkraine();
  setTimeout(reconcile,2000);
  setInterval(reconcile,1200);
})();