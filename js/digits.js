// js/digits.js

/* Which characters of the counter moved between two ticks.

   The world figure gains a couple of souls a second, so all but the last digit
   or two are identical every time -- animating the whole number would mean
   thirteen animations a second to show two digits moving.

   A change in width means the thousands separators have all shifted, so
   patching characters in place would leave the commas in the wrong columns:
   the caller rebuilds instead, and nothing animates on that tick. */
export function diffDigits(prev, next) {
  if (prev.length !== next.length) return { rebuild: true, changed: [] };
  const changed = [];
  for (let i = 0; i < next.length; i++) {
    if (prev[i] !== next[i]) changed.push(i);
  }
  return { rebuild: false, changed };
}

/* Country population direction cue.
   The index page continuously rewrites each .pop value. Compare consecutive
   rendered values rather than guessing from rank movement: an increase is
   upward/green, a decrease is downward/red, and an unchanged value is neutral.
   New rows start neutral until their first live comparison. */
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
  const apply = el => {
    if (!el || !el.classList || !el.closest(".country")) return;
    const value = Number(String(el.textContent).replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(value)) return;

    const old = previous.get(el);
    previous.set(el, value);
    if (old === undefined) {
      el.classList.add("direction-neutral");
      return;
    }

    el.classList.remove("direction-up","direction-down","direction-neutral");
    if (value > old) el.classList.add("direction-up");
    else if (value < old) el.classList.add("direction-down");
    else el.classList.add("direction-neutral");
  };

  const scan = root => {
    if (root.nodeType !== 1) return;
    if (root.matches && root.matches(".country .pop")) apply(root);
    if (root.querySelectorAll) root.querySelectorAll(".country .pop").forEach(apply);
  };

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") mutation.addedNodes.forEach(scan);
      else if (mutation.type === "characterData") {
        const parent = mutation.target.parentElement;
        if (parent && parent.matches(".pop")) apply(parent);
      }
    }
  });

  const start = () => {
    document.querySelectorAll(".country .pop").forEach(apply);
    observer.observe(document.body, {subtree:true,childList:true,characterData:true});
  };

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, {once:true});
})();
