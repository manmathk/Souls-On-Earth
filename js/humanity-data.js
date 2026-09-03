const HUMANITY_API='https://api.worldbank.org/v2';
const HUMANITY_YEAR=365.25*86400;
const humanitySleep=ms=>new Promise(r=>setTimeout(r,ms));
const humanityFmt=n=>new Intl.NumberFormat('en-US').format(Math.max(0,Math.floor(Number.isFinite(n)?n:0)));
async function humanityJSON(url,retries=5){for(let i=0;;i++){try{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);const j=await r.json();if(!Array.isArray(j)||!j[1])throw new Error('Invalid World Bank response');return j}catch(e){if(i>=retries)throw e;await humanitySleep(Math.min(4000,500*(i+1)));}}}
function humanityLatest(j){for(const x of j[1]||[]){const v=Number(x.value);if(Number.isFinite(v))return {value:v,year:Number(x.date)};}return null;}
function humanityLatestByCode(j){const out=new Map();for(const x of j[1]||[]){const v=Number(x.value),y=Number(x.date),code=x.countryiso3code;if(!code||!Number.isFinite(v)||!Number.isFinite(y))continue;const old=out.get(code);if(!old||y>old.year)out.set(code,{value:v,year:y});}return out;}
async function humanityIndicator(indicator){
 const j=await humanityJSON(`${HUMANITY_API}/country/all/indicator/${indicator}?format=json&date=2014:2024&per_page=20000`);
 return {json:j,latest:humanityLatestByCode(j)};
}
function humanityFlag(cc){return cc&&cc.length===2?cc.toUpperCase().replace(/./g,c=>String.fromCodePoint(127397+c.charCodeAt(0))):'🌐';}
function humanityProject(c,now=Date.now()){
 const base=Number(c.population);if(!Number.isFinite(base)||base<=0)return 0;
 const anchor=Date.UTC(Number(c.populationYear)||2024,6,1);
 const years=Math.max(0,(now-anchor)/1000/HUMANITY_YEAR);
 const net=(Number.isFinite(c.birthRate)&&Number.isFinite(c.deathRate))?(c.birthRate-c.deathRate)/1000:0;
 return base*Math.exp(net*years);
}
function humanityIsRealCountry(x){
 const code=String(x?.countryiso3code||'').toUpperCase();
 const c=x?.country||{};
 const iso2=String(c.iso2Code||'').toUpperCase();
 const region=String(c.region?.id||'').toUpperCase();
 const name=String(c.value||'').trim().toLowerCase();
 return /^[A-Z]{3}$/.test(code)&&/^[A-Z]{2}$/.test(iso2)&&region!=='NA'&&name&&name!=='world'&&!/^(high|upper middle|lower middle|low) income$/.test(name)&&!/^ida|^ibrd/.test(name);
}
function humanityUniverseFromIndicator(j){
 const seen=new Set(),out=[];
 for(const x of j?.[1]||[]){
   if(!humanityIsRealCountry(x))continue;
   const c=x.country,iso=String(x.countryiso3code).toUpperCase();
   if(seen.has(iso))continue;
   seen.add(iso);
   out.push({id:iso,iso2Code:String(c.iso2Code).toUpperCase(),name:c.value,region:{id:String(c.region?.id||'').toUpperCase(),value:c.region?.value||''}});
 }
 return out;
}
async function humanityLoadData(){
 // Load the population indicator first. Its records already contain country
 // name, ISO2, ISO3 and region metadata, so the separate /country endpoint is
 // only an optional optimization and must never make the page fail.
 const popResult=await humanityIndicator('SP.POP.TOTL');
 let universe=[];
 try{
   const meta=await humanityJSON(`${HUMANITY_API}/country?format=json&per_page=400`);
   universe=(meta[1]||[]).filter(c=>c.id&&c.iso2Code&&c.name&&c.region&&c.region.id!=='NA');
 }catch(e){
   console.warn('World Bank country metadata unavailable; deriving country list from population indicator.',e);
   universe=humanityUniverseFromIndicator(popResult.json);
 }
 const [birthResult,deathResult,worldPop,worldBirth,worldDeath]=await Promise.all([
   humanityIndicator('SP.DYN.CBRT.IN'),
   humanityIndicator('SP.DYN.CDRT.IN'),
   humanityJSON(`${HUMANITY_API}/country/WLD/indicator/SP.POP.TOTL?format=json&date=2014:2024&per_page=20`),
   humanityJSON(`${HUMANITY_API}/country/WLD/indicator/SP.DYN.CBRT.IN?format=json&date=2014:2024&per_page=20`),
   humanityJSON(`${HUMANITY_API}/country/WLD/indicator/SP.DYN.CDRT.IN?format=json&date=2014:2024&per_page=20`)
 ]);
 const pop=popResult.latest,birth=birthResult.latest,death=deathResult.latest;
 const wp=humanityLatest(worldPop),wb=humanityLatest(worldBirth),wd=humanityLatest(worldDeath);
 if(!wp||!wb||!wd)throw new Error('Global demographic data unavailable');
 const countries=[];
 for(const c of universe){
   const iso=String(c.id).toUpperCase();
   const p=pop.get(iso),b=birthResult.latest.get(iso),d=deathResult.latest.get(iso);
   if(!p||!Number.isFinite(p.value)||p.value<=0)continue;
   countries.push({iso,cc:c.iso2Code,name:c.name,population:p.value,populationYear:p.year,birthRate:b?.value,deathRate:d?.value,birthYear:b?.year,deathYear:d?.year,flag:humanityFlag(c.iso2Code)});
 }
 if(countries.length<150)throw new Error(`Only ${countries.length} real countries loaded`);
 const now=Date.now();
 countries.forEach(c=>{c.livePopulation=humanityProject(c,now);c.netPerSec=(Number.isFinite(c.birthRate)&&Number.isFinite(c.deathRate))?c.livePopulation*(c.birthRate-c.deathRate)/1000/HUMANITY_YEAR:0;});
 countries.sort((a,b)=>b.livePopulation-a.livePopulation);
 return {countries,world:{population:wp.value,year:wp.year,birthRate:wb.value,deathRate:wd.value,anchor:Date.UTC(wp.year,6,1)}};
}
window.HumanityData={load:humanityLoadData,project:humanityProject,fmt:humanityFmt,YEAR:HUMANITY_YEAR};