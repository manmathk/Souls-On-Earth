/* Page-specific narration for the secondary live counters.
   Index.html keeps its existing narrator/scheduler. These pages use this small
   independent player so their voice catalogue can be relevant to the page
   instead of borrowing world-table triggers. */
const PAGE_LINES={
  cities:["wry-0001","fact-0001","chat-0001","wry-0002","fact-0014","chat-0002","wry-0008","wry-0004"],
  births:["wry-0001","fact-0014","chat-0001","chat-0002","wry-0008","wry-0002"],
  deaths:["fact-0014","wry-0004","wry-0002","chat-0002","wry-0008"],
  growth:["wry-0002","fact-0014","chat-0002","wry-0008","wry-0004","wry-0001"]
};

const GAP_MIN=90000;
const GAP_MAX=180000;
const FIRST_MIN=30000;
const FIRST_MAX=60000;
const VOLUME=.20;

function shuffle(a){
  const x=[...a];
  for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}
  return x;
}

async function start(){
  const page=document.body.dataset.page;
  const wanted=PAGE_LINES[page];
  if(!wanted)return;

  let pack=[];
  try{pack=await fetch("voice/lines.json",{cache:"no-store"}).then(r=>r.json());}catch(e){return;}
  const byId=new Map((pack||[]).map(x=>[x.id,x]));
  let pool=wanted.map(id=>byId.get(id)).filter(Boolean);
  if(!pool.length)return;

  let bag=[];
  const refill=()=>{bag=shuffle(pool);};
  refill();
  let audio=null;
  let started=false;
  let timer=null;

  function nextLine(){
    if(!bag.length)refill();
    return bag.pop();
  }
  function schedule(ms){
    clearTimeout(timer);
    timer=setTimeout(playNext,ms);
  }
  function playNext(){
    if(!started)return;
    const line=nextLine();
    if(!line){schedule(GAP_MAX);return;}
    if(audio){audio.pause();audio.remove();}
    audio=new Audio("voice/"+(line.file||`${line.id}.mp3`));
    audio.preload="auto";
    audio.volume=VOLUME;
    audio.addEventListener("ended",()=>schedule(GAP_MIN+Math.random()*(GAP_MAX-GAP_MIN)),{once:true});
    audio.addEventListener("error",()=>schedule(3000),{once:true});
    audio.play().catch(()=>schedule(5000));
  }

  async function unlock(){
    if(started)return;
    started=true;
    schedule(FIRST_MIN+Math.random()*(FIRST_MAX-FIRST_MIN));
  }

  // Browsers require a user gesture before audible playback. Do not add a
  // visible voice control: the existing page controls remain unchanged.
  ["click","touchstart","keydown"].forEach(ev=>document.addEventListener(ev,unlock,{once:true,passive:true}));
}

start().catch(()=>{});
