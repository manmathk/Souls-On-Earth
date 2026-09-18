import "./flag-fix.js";
import { createPlaylist } from "./playlist.js";

/* All MP3 background tracks available in the repository. Keep filenames URL-safe
   by using the encoded form for spaces and plus signs. */
const TRACKS=[
  "Cathedral%20of%20Stars.mp3",
  "Experience.mp3",
  "Faith%20build%20up.mp3",
  "Felt%20Keys%20for%20Marchers.mp3",
  "Gentle%2BDreams%20(1).mp3",
  "Gentle%2BDreams.mp3",
  "Midnight_Highway_Run.mp3",
  "Through%2Bthe%20Foggy%20Gates.mp3",
  "hw%201.mp3",
  "hw%202.mp3"
];

const css=`.ambient-controls{position:fixed;right:10px;top:10px;z-index:999}.ambient-btn{width:34px;height:34px;border:1px solid #ddd;border-radius:50%;background:#fff;color:#333;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.16)}.ambient-btn.off{opacity:.55}.ambient-btn:active{transform:scale(.95)}
/* Civilizations featured hero image: give the carousel artwork much more visual weight. */
.hero-main{grid-template-columns:180px minmax(0,1fr) 32px!important;gap:16px!important;max-width:900px!important}.hero-image-wrap{width:180px!important;height:132px!important;border-radius:14px!important}
@media(max-width:700px){.hero-main{grid-template-columns:100px minmax(0,1fr) 26px!important;gap:9px!important}.hero-image-wrap{width:100px!important;height:82px!important;border-radius:10px!important}}
@media(max-width:430px){.hero-main{grid-template-columns:78px minmax(0,1fr) 24px!important;gap:7px!important}.hero-image-wrap{width:78px!important;height:66px!important}.hero-fallback{font-size:28px!important}}
`;
function addStyle(){const s=document.createElement("style");s.textContent=css;document.head.appendChild(s)}
function setupMusic(btn){const audio=document.createElement("audio");audio.preload="auto";audio.muted=true;audio.volume=.18;audio.setAttribute("playsinline","");document.body.appendChild(audio);const playlist=createPlaylist({tracks:TRACKS});let wanted=true,started=false,current=null,exhausted=false;try{wanted=localStorage.getItem("souls-music")!=="off"}catch(e){}
function cue(){const n=playlist.next();if(!n){exhausted=true;return false}current=n;audio.src=n;return true}
function render(){btn.classList.toggle("off",!wanted||audio.paused||exhausted);btn.textContent=wanted&&!audio.paused&&!exhausted?"🔊":"🔇"}
async function startMuted(){if(!wanted||started)return;if(!current&&!cue())return;started=true;try{await audio.play()}catch(e){started=false;console.debug("Music autoplay blocked",e)}render()}
async function unmuteAfterGesture(){if(!wanted)return;try{if(!started)await startMuted();audio.muted=false;await audio.play();render()}catch(e){console.debug("Audible music requires user interaction",e)}}
function pause(){wanted=false;audio.pause();try{localStorage.setItem("souls-music","off")}catch(e){}render()}
audio.onended=()=>{current=null;if(wanted&&cue()){audio.muted=false;audio.play().catch(()=>{})}render()};audio.onerror=()=>{if(current)playlist.retire(current);current=null;if(wanted&&cue()){audio.muted=false;audio.play().catch(()=>{})}render()};btn.onclick=e=>{e.stopPropagation();if(wanted&&!audio.paused){pause();return}wanted=true;try{localStorage.setItem("souls-music","on")}catch(e){}unmuteAfterGesture()};audio.onplay=render;audio.onpause=render;startMuted();const gesture=()=>{if(wanted)unmuteAfterGesture();document.removeEventListener("pointerdown",gesture);document.removeEventListener("keydown",gesture)};document.addEventListener("pointerdown",gesture);document.addEventListener("keydown",gesture);render()}
function setupCountryDirectionColors(){const roots=[document.getElementById("left"),document.getElementById("right")].filter(Boolean);if(!roots.length)return;const previous=new WeakMap();const paint=()=>roots.forEach(root=>root.querySelectorAll(".country").forEach(el=>{const value=el.querySelector(".delta,.change,.rate");if(!value)return;const text=value.textContent||"";el.classList.toggle("positive",/\+|↑|▲/.test(text));el.classList.toggle("negative",/−|-|↓|▼/.test(text))}));new MutationObserver(paint).observe(document.body,{subtree:true,childList:true,characterData:true});paint()}
function setupYouTubeStickers(){const hero=document.querySelector(".hero"),liveRow=document.querySelector(".live-row");if(!hero||!liveRow||!document.getElementById("world")||!document.getElementById("births"))return}
addStyle();const wrap=document.createElement("div");wrap.className="ambient-controls";wrap.innerHTML='<button class="ambient-btn" id="ambientMusic" aria-label="Toggle music" title="Toggle background music">🔊</button>';document.body.appendChild(wrap);setupMusic(wrap.firstElementChild);setupCountryDirectionColors();setupYouTubeStickers();
