import { createPlaylist } from "./playlist.js";

const TRACKS=["Felt Keys for Marchers.mp3","Faith build up.mp3","Gentle+Dreams (1).mp3","Gentle+Dreams.mp3"];

const css=`.ambient-controls{position:fixed;right:10px;top:10px;z-index:999}.ambient-btn{width:34px;height:34px;border:1px solid #ddd;border-radius:50%;background:#fff;color:#333;display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15)}.ambient-btn.off{opacity:.42;filter:grayscale(1)}.country .pop.direction-up{color:#179447}.country .pop.direction-down{color:#d62c2c}.country .pop.direction-neutral{color:inherit}`;
function addStyle(){const s=document.createElement("style");s.textContent=css;document.head.appendChild(s)}
function setupMusic(btn){const audio=document.createElement("audio");audio.preload="auto";audio.muted=true;audio.volume=.18;document.body.appendChild(audio);const playlist=createPlaylist({tracks:TRACKS});let current=null,exhausted=false;function cue(){const n=playlist.next();if(!n){exhausted=true;return false}current=n;audio.src=n;return true}function render(){btn.classList.toggle("off",audio.paused||exhausted)}async function play(){if(exhausted)return;if(!current&&!cue())return;audio.muted=false;try{await audio.play()}catch(e){}render()}function pause(){audio.pause();render()}audio.onended=()=>{current=null;if(cue())play()};audio.onerror=()=>{if(current)playlist.retire(current);current=null;if(cue())play()};btn.onclick=e=>{e.stopPropagation();if(audio.paused){play();try{localStorage.setItem("souls-music","on")}catch(e){}}else{pause();try{localStorage.setItem("souls-music","off")}catch(e){}}};let wanted=true;try{wanted=localStorage.getItem("souls-music")!=="off"}catch(e){}const gesture=()=>{if(wanted)play();document.removeEventListener("click",gesture);document.removeEventListener("touchstart",gesture);document.removeEventListener("keydown",gesture)};document.addEventListener("click",gesture,{once:true});document.addEventListener("touchstart",gesture,{once:true});document.addEventListener("keydown",gesture,{once:true});audio.onplay=render;audio.onpause=render;render()}

function setupCountryDirectionColors(){
  const roots=[document.getElementById("left"),document.getElementById("right")].filter(Boolean);
  if(!roots.length)return;
  const previous=new WeakMap();
  const paint=el=>{
    if(!el.matches(".country .pop"))return;
    const now=Number(el.textContent.replace(/[^0-9.-]/g,""));
    if(!Number.isFinite(now))return;
    const old=previous.get(el);
    previous.set(el,now);
    el.classList.remove("direction-up","direction-down","direction-neutral");
    if(old==null){
      el.classList.add("direction-neutral");
    }else if(now>old){
      el.classList.add("direction-up");
    }else if(now<old){
      el.classList.add("direction-down");
    }else{
      el.classList.add("direction-neutral");
    }
  };
  const scan=root=>root.querySelectorAll(".country .pop").forEach(paint);
  roots.forEach(scan);
  const observer=new MutationObserver(records=>{
    for(const record of records){
      if(record.type!=="childList"&&record.type!=="characterData")continue;
      if(record.target.nodeType===1){
        const target=record.target;
        if(target.matches?.(".country .pop"))paint(target);
        target.querySelectorAll?.(".country .pop").forEach(paint);
      }
      for(const node of record.addedNodes||[]){
        if(node.nodeType!==1)continue;
        if(node.matches?.(".country .pop"))paint(node);
        node.querySelectorAll?.(".country .pop").forEach(paint);
      }
    }
  });
  roots.forEach(root=>observer.observe(root,{subtree:true,childList:true,characterData:true}));
}

addStyle();
const wrap=document.createElement("div");wrap.className="ambient-controls";wrap.innerHTML='<button class="ambient-btn" id="ambientMusic" aria-label="Toggle music">🔊</button>';document.body.appendChild(wrap);setupMusic(document.getElementById("ambientMusic"));

/* index.html renders the country table before this module runs. The direction
   color is based on the actual displayed live value: green when it rises,
   red when it falls, neutral when unchanged. Other pages have no .country/.pop
   pair, so they are untouched. */
setupCountryDirectionColors();