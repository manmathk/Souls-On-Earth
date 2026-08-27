import "./digits.js";

const MUSIC_REST = 0.2;
const MUSIC_DUCKED = 0.05;
const VOICE_LEVEL = 0.2;
const DUCK_MS = 350;
const TAIL_MS = 500;

export function createAudioEngine() {
  let ctx = null;
  let musicGain = null;
  let voiceGain = null;
  let enabled = true;
  const elements = [];
  let cursor = 0;
  let restoreTimer = null;
  function ramp(param, value, ms) {
    const now = ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + ms / 1000);
  }
  async function unlock() {
    try {
      if (ctx) {
        if (ctx.state === "suspended") await ctx.resume();
        return !!musicGain;
      }
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      ctx = new Ctx();
      if (ctx.state === "suspended") await ctx.resume();
      musicGain = ctx.createGain();
      musicGain.gain.value = MUSIC_REST;
      musicGain.connect(ctx.destination);
      voiceGain = ctx.createGain();
      voiceGain.gain.value = VOICE_LEVEL;
      voiceGain.connect(ctx.destination);
      const music = document.getElementById("bgMusic");
      if (music) {
        music.volume = 1;
        ctx.createMediaElementSource(music).connect(musicGain);
      }
      for (let i = 0; i < 2; i++) {
        const el = new Audio();
        el.crossOrigin = "anonymous";
        el.preload = "auto";
        ctx.createMediaElementSource(el).connect(voiceGain);
        elements.push(el);
      }
      return true;
    } catch (e) {
      return false;
    }
  }
  const dead = new Set();
  function play(url) {
    if (!ctx || !musicGain || !enabled || dead.has(url)) return Promise.resolve(false);
    if (restoreTimer) {
      clearTimeout(restoreTimer);
      restoreTimer = null;
    }
    const el = elements[cursor++ % elements.length];
    return new Promise((resolve) => {
      let settled = false;
      const onEnded = () => { if (!settled) { settled = true; cleanup(); resolve(true); } };
      const onError = () => { if (!settled) { settled = true; cleanup(); dead.add(url); resolve(false); } };
      function cleanup() {
        el.removeEventListener("ended", onEnded);
        el.removeEventListener("error", onError);
        restoreTimer = setTimeout(() => {
          restoreTimer = null;
          ramp(musicGain.gain, MUSIC_REST, TAIL_MS);
        }, TAIL_MS);
      }
      el.addEventListener("ended", onEnded);
      el.addEventListener("error", onError);
      el.src = url;
      ramp(musicGain.gain, MUSIC_DUCKED, DUCK_MS);
      el.play().catch(onError);
    });
  }
  return {
    unlock,
    play,
    enabled: () => enabled,
    setEnabled(value) {
      enabled = value;
      if (!value && ctx && musicGain) ramp(musicGain.gain, MUSIC_REST, TAIL_MS);
    },
  };
}

function installSupportStickers() {
  if (!document.querySelector(".live-row") || document.getElementById("supportStickers")) return;
  const style = document.createElement("style");
  style.id = "support-stickers-style";
  style.textContent = `
    .support-stickers{position:relative;height:48px;margin:14px auto 0;width:min(100%,300px);display:flex;align-items:center;justify-content:center;pointer-events:none;overflow:visible;z-index:2}
    .support-sticker{position:absolute;display:flex;align-items:center;gap:7px;min-width:188px;max-width:265px;height:34px;padding:3px 10px 3px 6px;border-radius:18px;background:#fff;box-shadow:0 3px 12px rgba(0,0,0,.14);color:#333;font:700 11px/1 Arial,Helvetica,sans-serif;opacity:0;transform:translateY(10px) scale(.9);animation:support-sticker-in 4.8s ease both}
    .support-icon{position:relative;width:38px;height:27px;flex:0 0 38px;display:block}.support-copy{display:flex;flex-direction:column;gap:3px;white-space:nowrap;text-align:left}.support-title{font-size:11px;font-weight:800}.support-sub{font-size:9px;font-weight:500;color:#777}
    .sticker-super .support-icon{border-radius:14px;background:#63dfc1}.sticker-super .support-icon:before{content:"";position:absolute;left:7px;top:5px;width:11px;height:11px;border-radius:50%;background:#fff;box-shadow:18px 0 0 #f3c58e}.sticker-super .support-icon:after{content:"";position:absolute;left:14px;bottom:-5px;border:5px solid transparent;border-top-color:#63dfc1}
    .sticker-chat .support-icon{border-radius:14px;background:#f49b4d}.sticker-chat .support-icon:before{content:"";position:absolute;left:9px;top:9px;width:5px;height:5px;border-radius:50%;background:#fff;box-shadow:10px 0 0 #fff,20px 0 0 #fff}.sticker-chat .support-icon:after{content:"";position:absolute;left:14px;bottom:-5px;border:5px solid transparent;border-top-color:#f49b4d}
    .sticker-member .support-icon:before{content:"";position:absolute;left:3px;bottom:2px;width:19px;height:17px;border-radius:3px;background:#49b83e;box-shadow:18px -1px 0 1px #67df45}.sticker-member .support-icon:after{content:"★";position:absolute;right:1px;top:0;color:#fff;font-size:17px;line-height:25px}
    .sticker-gift .support-icon:before{content:"★";position:absolute;left:12px;bottom:0;width:22px;height:22px;border-radius:50%;background:#00c93b;color:#111;text-align:center;line-height:22px;font-size:13px}.sticker-gift .support-icon:after{content:"🎀";position:absolute;left:8px;top:-2px;font-size:21px;line-height:20px}
    @keyframes support-sticker-in{0%{opacity:0;transform:translateY(10px) scale(.9)}10%{opacity:1;transform:translateY(0) scale(1)}78%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-8px) scale(.95)}}
    @media(max-width:520px){.support-stickers{height:44px;margin-top:12px;width:min(100%,265px)}.support-sticker{min-width:170px;height:31px;padding-right:8px;gap:6px}.support-icon{transform:scale(.9);transform-origin:center}.support-title{font-size:10px}.support-sub{font-size:8px}}
    @media(prefers-reduced-motion:reduce){.support-sticker{animation:none;opacity:1;transform:none}}
  `;
  document.head.appendChild(style);
  const wrap = document.createElement("div");
  wrap.id = "supportStickers";
  wrap.className = "support-stickers";
  wrap.setAttribute("aria-hidden", "true");
  wrap.innerHTML = `
    <div class="support-sticker sticker-super"><span class="support-icon"></span><span class="support-copy"><span class="support-title">Super Stickers</span><span class="support-sub">Get creative with animated GIFs</span></span></div>
    <div class="support-sticker sticker-chat"><span class="support-icon"></span><span class="support-copy"><span class="support-title">Super Chat</span><span class="support-sub">Make your message stand out</span></span></div>
    <div class="support-sticker sticker-member"><span class="support-icon"></span><span class="support-copy"><span class="support-title">Membership</span><span class="support-sub">Unlock members-only perks</span></span></div>
    <div class="support-sticker sticker-gift"><span class="support-icon"></span><span class="support-copy"><span class="support-title">Membership gifting</span><span class="support-sub">Buy memberships for viewers</span></span></div>
  `;
  document.querySelector(".live-row").insertAdjacentElement("afterend", wrap);
  const stickers=[...wrap.querySelectorAll(".support-sticker")];
  let current=Math.floor(Math.random()*stickers.length);
  function show(i){stickers.forEach((el,n)=>{el.style.display=n===i?"flex":"none";if(n===i){el.style.animation="none";void el.offsetWidth;el.style.animation="support-sticker-in 4.8s ease both"}})}
  show(current);
  setInterval(()=>{current=(current+1)%stickers.length;show(current)},4800);
}

import { createScheduler } from "./scheduler.js";
import { createCrossingDetector, detectRankChange } from "./detectors.js";

const GAP_MIN_MS=90000;
const GAP_MAX_MS=180000;
const CROSSING_STEP=50000;
function gap(){return GAP_MIN_MS+Math.random()*(GAP_MAX_MS-GAP_MIN_MS)}

async function loadVoiceLines(){
  const [manifest,textPack]=await Promise.all([fetch("voice/manifest.json").then(r=>r.json()),fetch("voice/lines.json").then(r=>r.json())]);
  const byId=new Map((textPack||[]).map(l=>[l.id,l]));
  const merged=[];
  for(const l of manifest.lines||[]){const text=byId.get(l.id);merged.push({...(text||{}),...l,category:l.category||text?.category||l.id.split("-")[0],file:l.file||`${l.id}.mp3`});byId.delete(l.id)}
  for(const l of byId.values())merged.push({...l,category:l.category||l.id.split("-")[0],file:l.file||`${l.id}.mp3`});
  return merged;
}

function preloadVoiceFiles(lines){
  const cache=[];
  for(const line of lines){
    if(!line?.file) continue;
    const audio=new Audio();
    audio.preload="auto";
    audio.src="voice/"+line.file;
    audio.load();
    cache.push(audio);
  }
  window.__voicePreload=cache;
}

async function start(){
  const params=new URLSearchParams(location.search);
  const testMode=params.get("voice")==="test";
  const onlyCategory=(params.get("voice")||"").startsWith("cat:")?params.get("voice").slice(4):null;
  let lines=await loadVoiceLines();
  if(onlyCategory)lines=lines.filter(l=>l.category===onlyCategory);
  preloadVoiceFiles(lines);
  const byId=new Map(lines.map(l=>[l.id,l]));
  const scheduler=createScheduler({lines,historySize:60});
  const engine=createAudioEngine();
  const crossings={births:createCrossingDetector(CROSSING_STEP),deaths:createCrossingDetector(CROSSING_STEP),growth:createCrossingDetector(CROSSING_STEP)};
  const crossingClip=new Map();
  const rankClip=new Map();
  for(const l of lines){if(l.trigger&&l.trigger.kind==="crossing"){const key=l.trigger.counter+":"+l.trigger.at;if(!crossingClip.has(key))crossingClip.set(key,[]);crossingClip.get(key).push(l.id)}if(l.trigger&&l.trigger.kind==="rank")rankClip.set(l.trigger.over+">"+l.trigger.under,l.id)}
  const pickOne=arr=>arr[Math.floor(Math.random()*arr.length)];
  let prevOrder=null;
  let running=false;
  document.addEventListener("souls:tick",e=>{const {births,deaths,growth,order}=e.detail;for(const [name,value] of [["births",births],["deaths",deaths],["growth",growth]]){const at=crossings[name].check(value);if(at===null)continue;const options=crossingClip.get(name+":"+at);if(options)scheduler.pushEvent(pickOne(options))}const change=detectRankChange(prevOrder,order);if(change){const id=rankClip.get(change.over+">"+change.under)||rankClip.get("*>*");if(id)scheduler.pushEvent(id)}prevOrder=order});
  async function loop(){if(running)return;running=true;for(;;){const id=scheduler.next({hourUTC:new Date().getUTCHours()});if(id&&byId.has(id))await engine.play("voice/"+byId.get(id).file);await new Promise(r=>setTimeout(r,testMode?3000:gap()))}}
  const btn=document.getElementById("voiceBtn");
  function paint(){if(btn)btn.classList.toggle("off",!engine.enabled())}
  if(btn){btn.addEventListener("click",e=>{e.stopPropagation();engine.setEnabled(!engine.enabled());try{localStorage.setItem("souls-voice",engine.enabled()?"on":"off")}catch(_){}paint()})}
  try{engine.setEnabled(localStorage.getItem("souls-voice")!=="off")}catch(_){}
  paint();
  async function unlockAndRun(){if(await engine.unlock())loop()}
  ["click","touchstart","keydown"].forEach(ev=>document.addEventListener(ev,unlockAndRun,{once:true}));
  window.__narrator={scheduler,engine,lines,say:id=>byId.has(id)?engine.play("voice/"+byId.get(id).file):null};
}

installSupportStickers();
start().catch(()=>{});
