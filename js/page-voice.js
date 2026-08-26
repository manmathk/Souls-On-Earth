/* Runtime narration for secondary live-counter pages.
   Uses Kokoro-82M in the browser: no API key, no MP3 files, and no server.
   The model is cached by the browser after its first download. */

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

const PAGE_VOICES={
  cities:"am_michael",
  births:"af_heart",
  deaths:"am_adam",
  growth:"bf_emma"
};

const GAP_MIN=90000;
const GAP_MAX=180000;
const FIRST_MIN=30000;
const FIRST_MAX=60000;
const VOLUME=.20;
const MODEL_ID="onnx-community/Kokoro-82M-v1.0-ONNX";

function shuffle(a){
  const x=[...a];
  for(let i=x.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [x[i],x[j]]=[x[j],x[i]];
  }
  return x;
}

async function start(){
  const page=document.body.dataset.page;
  const pool=PAGE_LINES[page];
  if(!pool||!pool.length)return;

  let tts;
  try{
    const mod=await import("https://esm.sh/kokoro-js@1.2.1");
    const device=navigator.gpu?"webgpu":"wasm";
    tts=await mod.KokoroTTS.from_pretrained(MODEL_ID,{
      dtype:device==="webgpu"?"q8":"q4f16",
      device
    });
  }catch(e){
    console.warn("Kokoro TTS unavailable",e);
    return;
  }

  let bag=shuffle(pool);
  let started=false;
  let timer=null;
  let audio=null;
  let objectUrl=null;

  function nextLine(){
    if(!bag.length)bag=shuffle(pool);
    return bag.pop();
  }
  function schedule(ms){
    clearTimeout(timer);
    timer=setTimeout(playNext,ms);
  }
  async function playNext(){
    if(!started)return;
    const text=nextLine();
    try{
      const result=await tts.generate(text,{voice:PAGE_VOICES[page],speed:0.96});
      if(!started)return;
      if(audio){audio.pause();audio.remove();}
      if(objectUrl)URL.revokeObjectURL(objectUrl);
      objectUrl=URL.createObjectURL(await result.toBlob());
      audio=new Audio(objectUrl);
      audio.volume=VOLUME;
      audio.addEventListener("ended",()=>schedule(GAP_MIN+Math.random()*(GAP_MAX-GAP_MIN)),{once:true});
      audio.addEventListener("error",()=>schedule(5000),{once:true});
      await audio.play();
    }catch(e){
      console.warn("Kokoro narration failed",e);
      schedule(5000);
    }
  }

  function unlock(){
    if(started)return;
    started=true;
    // The gesture only unlocks audio. Give the page a natural quiet opening.
    schedule(FIRST_MIN+Math.random()*(FIRST_MAX-FIRST_MIN));
  }

  ["click","touchstart","keydown"].forEach(ev=>
    document.addEventListener(ev,unlock,{once:true,passive:true})
  );
}

start().catch(()=>{});
