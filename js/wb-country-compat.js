/* Compatibility layer for phase1-counters.js.
   The World Bank /country metadata endpoint can intermittently return 404/empty
   responses in browser/edge environments. phase1 only needs a verified list of
   real ISO countries, and the indicator response already contains that metadata.
   Synthesize the metadata response from population indicator records so the
   shared counter engine does not fail with 0 countries. */
(function(){
  const originalFetch=window.fetch.bind(window);
  let populationProbe=null;
  const isCountry=(x)=>{
    const code=String(x?.countryiso3code||x?.country?.id||'').toUpperCase();
    const iso2=String(x?.country?.iso2Code||'').toUpperCase();
    const region=String(x?.country?.region?.id||'').toUpperCase();
    const name=String(x?.country?.value||'').toLowerCase();
    return /^[A-Z]{3}$/.test(code)&&/^[A-Z]{2}$/.test(iso2)&&region!=='NA'&&name!=='world'&&!/^(high|upper middle|lower middle|low) income/.test(name)&&!/^ida|^ibrd/.test(name);
  };
  function probe(){
    if(populationProbe)return populationProbe;
    populationProbe=originalFetch('https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&mrv=1&per_page=10000',{cache:'no-store',mode:'cors'})
      .then(r=>{if(!r.ok)throw new Error('Population probe HTTP '+r.status);return r.json();});
    return populationProbe;
  }
  window.fetch=function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(/api\.worldbank\.org\/v2\/country\?[^#]*format=json/i.test(url)&&/per_page=400/i.test(url)){
      return probe().then(j=>{
        const seen=new Set(),rows=[];
        for(const x of (j&&j[1])||[]){
          if(!isCountry(x))continue;
          const c=x.country, id=String(x.countryiso3code||c.id).toUpperCase();
          if(seen.has(id))continue;
          seen.add(id);
          rows.push({id,iso2Code:String(c.iso2Code).toUpperCase(),name:c.value,region:{id:String(c.region?.id||'').toUpperCase(),value:c.region?.value||''}});
        }
        return new Response(JSON.stringify([{page:1,pages:1,per_page:String(rows.length),total:rows.length},rows]),{status:200,headers:{'Content-Type':'application/json'}});
      });
    }
    return originalFetch(input,init);
  };
})();