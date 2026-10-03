(function(){
  const RI_MIN=127462,RI_MAX=127487;
  function isoFromFlag(text){
    const m=String(text||'').match(/[\u{1F1E6}-\u{1F1FF}]{2}/u);
    if(!m)return null;
    return [...m[0]].map(c=>String.fromCharCode(c.codePointAt(0)-127397)).join('').toLowerCase();
  }
  function makeFlag(iso,alt){
    const img=document.createElement('img');
    img.src='https://flagcdn.com/w40/'+iso+'.png';
    img.srcset='https://flagcdn.com/w80/'+iso+'.png 2x';
    img.alt=alt||iso.toUpperCase()+' flag';
    img.loading='lazy';
    img.referrerPolicy='no-referrer';
    img.className='country-flag-img';
    img.onerror=()=>img.style.display='none';
    return img;
  }
  function replaceFlags(){
    document.querySelectorAll('.row .flag,.h100-flag,.flag').forEach(el=>{
      if(el.dataset.flagFixed==='1')return;
      const iso=isoFromFlag(el.textContent);
      if(!iso)return;
      const img=makeFlag(iso,iso.toUpperCase()+' flag');
      el.textContent='';
      el.appendChild(img);
      el.dataset.flagFixed='1';
    });
  }
  const style=document.createElement('style');
  style.textContent='.country-flag-img{display:block;width:28px;height:20px;object-fit:cover;border-radius:2px;margin:auto}.h100-flag .country-flag-img{width:26px;height:18px}.row .flag,.h100-flag,.flag{display:flex;align-items:center;justify-content:center}';
  document.head.appendChild(style);
  function start(){replaceFlags();new MutationObserver(replaceFlags).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();

  // Top 24 standalone page: rotate through every unique root-level music track.
  // Voice narration files under /voice are intentionally excluded.
  if(document.title.includes('Top 24 Live Population')){
    const audio=document.getElementById('audio'),button=document.getElementById('music');
    if(audio&&button){
      const tracks=[
        'Cathedral of Stars.mp3','Experience.mp3','Faith build up.mp3','Felt Keys for Marchers.mp3',
        'Gentle+Dreams (1).mp3','Gentle+Dreams.mp3','Midnight_Highway_Run.mp3',
        'Through+the+Foggy+Gates.mp3','Warriyo, LXNGVX - Mortals Funk Remix [NCS Release].mp3','hw 1.mp3'
      ].map(name=>({name,url:new URL('./'+encodeURIComponent(name),document.baseURI).href}));
      let index=Math.max(0,Number(localStorage.getItem('top24-track-index'))||0);
      let advancing=false;
      audio.loop=false;
      audio.volume=.25;
      function setTrack(i){
        index=(i+tracks.length)%tracks.length;
        const t=tracks[index];
        audio.src=t.url;
        audio.load();
        button.title='Play: '+t.name;
      }
      function next(){
        if(advancing)return;
        advancing=true;
        index=(index+1)%tracks.length;
        localStorage.setItem('top24-track-index',String(index));
        setTrack(index);
        if(localStorage.getItem('top24-music')==='on'){
          const p=audio.play();
          if(p)p.catch(()=>{}).finally(()=>{advancing=false});
          else advancing=false;
        }else advancing=false;
      }
      audio.addEventListener('ended',next);
      audio.addEventListener('error',()=>{setTimeout(next,250)});
      audio.addEventListener('play',()=>{button.textContent='🔊';button.title='Pause: '+tracks[index].name;localStorage.setItem('top24-music','on');localStorage.setItem('top24-track-index',String(index));});
      audio.addEventListener('pause',()=>{if(!audio.ended)button.textContent='♫'});
      setTrack(index);
    }
  }
})();
