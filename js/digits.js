// js/digits.js

export function diffDigits(prev, next) {
  if (prev.length !== next.length) return { rebuild: true, changed: [] };
  const changed = [];
  for (let i = 0; i < next.length; i++) {
    if (prev[i] !== next[i]) changed.push(i);
  }
  return { rebuild: false, changed };
}

/* Country population direction cue.
   The country rows are ranked by population, but their colour is determined by
   the country's population-growth category: positive = upward/green, negative
   = downward/red, zero = neutral. This is deliberately independent of rank.
   The live baseline is exposed by index.html as window.__souls.data. A small
   fallback compares rendered values when a baseline is not yet available. */
(function installCountryDirectionColors(){
  if (typeof document === "undefined") return;

  const style = document.createElement("style");
  style.textContent = `
    .country .pop.direction-up{color:var(--growth,#179447)!important}
    .country .pop.direction-down{color:var(--deaths,#d62c2c)!important}
    .country .pop.direction-neutral{color:var(--text,#222)!important}
  `;
  (document.head || document.documentElement).appendChild(style);

  const previous = new WeakMap();

  function apply(el){
    if (!el || !el.classList || !el.closest(".country")) return;
    const row=el.closest(".country");
    const idx=Number(row.dataset.i);
    const countries=window.__souls?.data?.countries;
    const rate=countries && Number.isInteger(idx) && countries[idx] ? Number(countries[idx][3]) : NaN;

    el.classList.remove("direction-up","direction-down","direction-neutral");

    /* Prefer the actual growth category. This makes the colour correct on the
       first render instead of waiting for the second counter tick. */
    if (Number.isFinite(rate)) {
      if (rate > 0) el.classList.add("direction-up");
      else if (rate < 0) el.classList.add("direction-down");
      else el.classList.add("direction-neutral");
      return;
    }

    /* Fallback for the tiny interval before __souls.data is available. */
    const value=Number(String(el.textContent).replace(/[^0-9.-]/g,""));
    if (!Number.isFinite(value)) return;
    const old=previous.get(el);
    previous.set(el,value);
    if (old===undefined || value===old) el.classList.add("direction-neutral");
    else if (value>old) el.classList.add("direction-up");
    else el.classList.add("direction-down");
  }

  const scan=root=>{
    if (root.nodeType!==1) return;
    if (root.matches?.(".country .pop")) apply(root);
    root.querySelectorAll?.(".country .pop").forEach(apply);
  };

  const observer=new MutationObserver(mutations=>{
    for(const mutation of mutations){
      if(mutation.type==="childList") mutation.addedNodes.forEach(scan);
      else if(mutation.type==="characterData"){
        const parent=mutation.target.parentElement;
        if(parent?.matches(".pop")) apply(parent);
      }
    }
  });

  const start=()=>{
    document.querySelectorAll(".country .pop").forEach(apply);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  };

  if(document.body) start();
  else document.addEventListener("DOMContentLoaded",start,{once:true});
})();
