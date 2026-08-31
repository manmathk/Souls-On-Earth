(function(){
  function emojiToIso(text){
    const chars=[...String(text||'')].filter(c=>{const n=c.codePointAt(0);return n>=127462&&n<=127487;});
    if(chars.length<2)return null;
    return chars.slice(0,2).map(c=>String.fromCharCode(c.codePointAt(0)-127397)).join('').toLowerCase();
  }
  function replaceFlags(){
    document.querySelectorAll('.row .flag, .h100-flag').forEach(el=>{
      if(el.dataset.flagFixed==='1')return;
      const iso=emojiToIso(el.textContent);
      if(!iso)return;
      const img=document.createElement('img');
      img.src='https://flagcdn.com/24x18/'+iso+'.png';
      img.srcset='https://flagcdn.com/48x36/'+iso+'.png 2x';
      img.alt=iso.toUpperCase()+' flag';
      img.loading='lazy';
      img.referrerPolicy='no-referrer';
      img.className='country-flag-img';
      img.onerror=function(){this.replaceWith(document.createTextNode(el.textContent));};
      el.textContent='';
      el.appendChild(img);
      el.dataset.flagFixed='1';
    });
  }
  const style=document.createElement('style');
  style.textContent='.country-flag-img{display:block;width:20px;height:15px;object-fit:cover;border-radius:1px;margin:auto}.h100-flag .country-flag-img{width:18px;height:13px}.row .flag,.h100-flag{display:flex;align-items:center;justify-content:center}';
  document.head.appendChild(style);
  new MutationObserver(replaceFlags).observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',replaceFlags);else replaceFlags();
})();
