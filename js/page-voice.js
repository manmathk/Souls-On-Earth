/* Runtime narration for secondary live-counter pages.
   Primary engine: Kokoro-82M in the browser. Browser SpeechSynthesis is a
   fallback so narration still works if the neural model is unavailable. */

const PAGE_LINES={
  cities:[
    "These are the world's fifty largest cities by population. Watch the numbers move as urban populations continue to change.",
    "Asia dominates the top of this ranking, with some of the world's biggest urban populations concentrated across South and East Asia.",
    "Which city are you watching from? Find it in the live ranking and tell us in the chat.",
    "A city can gain thousands of residents while the ranking around it barely changes. Every number here is a live estimate.",
    "From Jakarta and Dhaka to Tokyo and New Delhi, these cities represent an enormous share of humanity's urban population."
  ],
  births:[
    "This counter estimates births happening around the world today, using the latest available population and birth-rate data.",
    "Every second, new lives are being added to the world's population. Watch the counter and see how quickly the number grows.",
    "Which country do you think is adding the most people through births? Tell us your guess in the chat.",
    "Birth rates vary dramatically between countries, creating very different population futures around the world.",
    "The live figure is a calculated estimate, not a real-time registry of individual births."
  ],
  deaths:[
    "This counter estimates deaths occurring around the world today from the latest available population and mortality data.",
    "The number rises continuously as the global population experiences mortality every second of every day.",
    "Population change is shaped by both sides of the equation: births add people, while deaths remove them.",
    "Countries with older populations can record substantially different mortality patterns from countries with younger populations.",
    "This is a statistical live estimate based on published rates, not a real-time record of individual deaths."
  ],
  growth:[
    "This is the net population growth counter: estimated births minus estimated deaths.",
    "When births outnumber deaths, the world's population grows. When deaths catch up, that growth slows.",
    "Some countries are growing rapidly while others are already experiencing population decline.",
    "The live number is calculated from the latest available demographic rates and continuously projected forward.",
    "Population growth is one of the clearest ways to see how births, deaths and demographics interact."
  ]
};

const PAGE_VOICES={cities:"am_michael",births:"af_heart",deaths:"am_adam",growth:"bf_emma"};
const MODEL_ID="onnx-community/Kokoro-82M-v1.0-ONNX";
const FIRST_DELAY=5000;
const GAP_MIN=90000, GAP_MAX=180000;
const VOLUME=.22;

function shuffle(a){
  const x=[...a];
  for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}
  return x;
}

async function loadKokoro(){
  const mod=await import("https://esm.sh/kokoro-js@1.2.1");
  const device=navigator.gpu?"webgpu":"wasm";
  return mod.KokoroTTS.from_pretrained(MODEL_ID,{dtype:device==="webgpu"?"q8":"q4f16",device});
}

function browserSpeak(text,done){
  if(!("speechSynthesis" in window)){done?.();return false;}
  try{
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    const voices=speechSynthesis.getVoices();
    const preferred=voices.find(v=>/en-IN|en-US|en-GB/i.test(v.lang)&&/natural|neural|premium|enhanced/i.test(v.name));
    if(preferred)u.voice=preferred;
    u.lang=preferred?.lang||"en-IN";
    u.rate=.94;u.pitch=.98;u.volume=VOLUME;
    u.onend=()=>done?.();u.onerror=()=>done?.();
    speechSynthesis.speak(u);
    return true;
  }catch(e){done?.();return false;}
}

async function start(){
  const page=document.body.dataset.page;
  const pool=PAGE_LINES[page];
  if(!pool?.length)return;

  let bag=shuffle(pool),started=false,timer=null,tts=null,loading=null,audio=null,objectUrl=null;
  const nextLine=()=>{if(!bag.length)bag=shuffle(pool);return bag.pop();};
  const schedule=ms=>{clearTimeout(timer);timer=setTimeout(playNext,ms);};

  async function ensureTTS(){
    if(tts)return tts;
    if(!loading)loading=loadKokoro().catch(e=>{console.warn("Kokoro unavailable",e);return null;});
    tts=await loading;
    return tts;
  }

  async function playWithKokoro(text,engine){
    const result=await engine.generate(text,{voice:PAGE_VOICES[page],speed:.96});
    if(!started)return false;
    if(audio){audio.pause();audio.remove();}
    if(objectUrl)URL.revokeObjectURL(objectUrl);
    objectUrl=URL.createObjectURL(await result.toBlob());
    audio=new Audio(objectUrl);
    audio.volume=VOLUME;
    audio.onended=()=>schedule(GAP_MIN+Math.random()*(GAP_MAX-GAP_MIN));
    audio.onerror=()=>schedule(5000);
    await audio.play();
    return true;
  }

  async function playNext(){
    if(!started)return;
    const text=nextLine();

    // Give Kokoro a few seconds to initialize. If the model is still loading,
    // use the phone's native speech engine for this line instead of staying silent.
    const engine=await Promise.race([
      ensureTTS(),
      new Promise(resolve=>setTimeout(()=>resolve(null),FIRST_DELAY))
    ]);
    if(!started)return;

    if(engine){
      try{if(await playWithKokoro(text,engine))return;}
      catch(e){console.warn("Kokoro playback failed",e);}
    }

    browserSpeak(text,()=>schedule(GAP_MIN+Math.random()*(GAP_MAX-GAP_MIN)));
  }

  function unlock(){
    if(started)return;
    started=true;
    playNext();
  }

  // Register the gesture listeners BEFORE any model/network work.
  ["click","touchstart","keydown"].forEach(ev=>document.addEventListener(ev,unlock,{once:true,passive:true}));
}

start().catch(e=>console.warn("Page narration failed to initialize",e));
