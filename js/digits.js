// js/digits.js

export function diffDigits(prev, next) {
  if (prev.length !== next.length) return { rebuild: true, changed: [] };
  const changed = [];
  for (let i = 0; i < next.length; i++) {
    if (prev[i] !== next[i]) changed.push(i);
  }
  return { rebuild: false, changed };
}

/* Country direction is based ONLY on the displayed whole-number population.
   Normal values are neutral. When the displayed integer changes at runtime,
   both the country name and population briefly use the direction color. */
(function installCountryDirectionColors(){
  if (typeof document === "undefined") return;
  const style=document.createElement("style");
  style.textContent=`
    .country.runtime-up .name,.country.runtime-up .pop{color:var(--growth,#179447)!important}
    .country.runtime-down .name,.country.runtime-down .pop{color:var(--deaths,#d62c2c)!important}
    .country.runtime-neutral .name,.country.runtime-neutral .pop{color:var(--text,#222)!important}
  `;
  (document.head||document.documentElement).appendChild(style);

  const previous=new Map();
  let ready=false;
  function apply(row){
    if(!row?.classList?.contains("country"))return;
    const pop=row.querySelector(".pop");
    if(!pop)return;
    const name=row.querySelector(".name");
    const key=row.dataset.i||name?.textContent.trim();
    if(!key)return;
    const n=Number(String(pop.textContent).replace(/[^0-9.-]/g,""));
    if(!Number.isFinite(n))return;
    const whole=Math.floor(n),old=previous.get(key);
    row.classList.remove("runtime-up","runtime-down","runtime-neutral");
    if(!ready||old===undefined||whole===old)row.classList.add("runtime-neutral");
    else if(whole>old)row.classList.add("runtime-up");
    else row.classList.add("runtime-down");
    previous.set(key,whole);
  }
  function scan(node){
    if(node.nodeType!==1)return;
    if(node.matches?.(".country"))apply(node);
    node.querySelectorAll?.(".country").forEach(apply);
  }
  function start(){
    document.querySelectorAll(".country").forEach(apply);
    ready=true;
    new MutationObserver(ms=>ms.forEach(m=>{
      if(m.type==='childList')m.addedNodes.forEach(scan);
      else if(m.type==='characterData'){
        const row=m.target.parentElement?.closest?.(".country");
        if(row)apply(row);
      }
    })).observe(document.body,{subtree:true,childList:true,characterData:true});
  }
  if(document.body)start();else document.addEventListener("DOMContentLoaded",start,{once:true});
})();
