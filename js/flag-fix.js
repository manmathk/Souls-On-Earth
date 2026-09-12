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
})();
