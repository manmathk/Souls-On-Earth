const YEAR=365.25*86400;
const DAY=86400;
const nf=new Intl.NumberFormat('en-US');
const fmt=n=>nf.format(Math.max(0,Math.floor(Number(n)||0)));
const esc=s=>String(s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]||m));

const WORLD_ANCHOR=Date.parse('2026-07-01T00:00:00Z');
const WORLD_POP_2026=8300678395;
const WORLD_ANNUAL_CHANGE_2026=69065325;
const WORLD_GROWTH_RATE=WORLD_ANNUAL_CHANGE_2026/WORLD_POP_2026;

const CITY_BASELINE=Date.parse('2025-07-01T00:00:00Z');
const CITIES=[['🇮🇩','Jakarta',41913860,1.38],['🇧🇩','Dhaka',36585479,2.21],['🇯🇵','Tokyo',33412512,-0.17],['🇮🇳','New Delhi',30222405,0.75],['🇨🇳','Shanghai',29558908,1.31],['🇨🇳','Guangzhou',27563372,0.77],['🇪🇬','Cairo',25566102,1.24],['🇵🇭','Manila',24735305,0.59],['🇮🇳','Kolkata',22549738,0.45],['🇰🇷','Seoul',22490482,0.23],['🇵🇰','Karachi',21422590,1.98],['🇮🇳','Mumbai',20203056,0.87],['🇧🇷','São Paulo',18949790,0.16],['🇹🇭','Bangkok',18180280,1.03],['🇲🇽','Mexico City',17734212,0.14],['🇨🇳','Beijing',17013303,0.63],['🇵🇰','Lahore',15156430,1.52],['🇹🇷','Istanbul',15014763,0.54],['🇷🇺','Moscow',14524753,0.35],['🇻🇳','Ho Chi Minh City',14052713,1.38],['🇦🇷','Buenos Aires',14017736,0.11],['🇺🇸','New York City',13920148,-0.18],['🇨🇳','Shenzhen',13878396,0.64],['🇮🇳','Bengaluru',13187098,0.43],['🇯🇵','Osaka',12964145,-0.75],['🇳🇬','Lagos',12791699,1.23],['🇺🇸','Los Angeles',12740420,0.39],['🇦🇴','Luanda',11370127,2.89],['🇮🇳','Chennai',11153205,0.42],['🇨🇩','Kinshasa',10943641,0.90],['🇨🇴','Bogotá',10624315,1.31],['🇵🇪','Lima',10580241,1.04],['🇬🇧','London',10416420,0.82],['🇮🇳','Hajipur',9941510,1.78],['🇧🇷','Rio de Janeiro',9500336,0.17],['🇫🇷','Paris',9381921,0.08],['🇮🇳','Hyderabad',9190795,0.39],['🇮🇷','Tehran',9174964,0.63],['🇹🇼','Taipei',9136792,-0.21],['🇮🇩','Bandung',8909104,0.84],['🇲🇾','Kuala Lumpur',8443731,1.39],['🇹🇿','Dar es Salaam',7795114,2.48],['🇨🇳','Suzhou',7731101,0.30],['🇮🇳','Ahmedabad',7632408,0.44],['🇨🇳','Hangzhou',7500208,1.73],['🇨🇳','Wuhan',7363548,-0.53],['🇨🇳','Tianjin',7285342,0.67],['🇪🇬','Alexandria',7266957,1.10],['🇯🇵','Nagoya',7146160,-0.38],['🇿🇦','Johannesburg',7077175,1.60]];

const state={countries:[],lastCountryRefresh:0,loading:false};
function setHero(title,value,label){for(const [id,text] of [['heroTitle',title],['hero',fmt(value)],['heroLabel',label]]){const e=document.getElementById(id);if(e)e.textContent=text;}}
function fetchJSON(url,retries=3){return new Promise(async(resolve,reject)=>{for(let i=0;i<retries;i++){try{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();if(!Array.isArray(j)||!Array.isArray(j[1]))throw new Error('Invalid API response');resolve(j);return;}catch(e){if(i===retries-1){reject(e);return;}await new Promise(r=>setTimeout(r,700*(i+1)));}}});}
function latestByCountry(data){const out=new Map();for(const x of data[1]||[]){if(typeof x.value!=='number'||!x.countryiso3code)continue;const year=Number(x.date),old=out.get(x.countryiso3code);if(!old||year>old.year)out.set(x.countryiso3code,{value:x.value,year});}return out;}
function flagFor(code){const map={USA:'US',GBR:'GB',CAN:'CA',RUS:'RU',KOR:'KR',PRK:'KP',IRN:'IR',COD:'CD',COG:'CG',CIV:'CI',TZA:'TZ',CZE:'CZ',LAO:'LA',VNM:'VN',PHL:'PH',CHE:'CH',ARE:'AE',SAU:'SA',NZL:'NZ',EGY:'EG',TUR:'TR',DEU:'DE',FRA:'FR',ESP:'ES',ITA:'IT',NLD:'NL',BEL:'BE',PRT:'PT',AUT:'AT',SWE:'SE',NOR:'NO',DNK:'DK',FIN:'FI',POL:'PL',UKR:'UA',ISR:'IL',MYS:'MY',IDN:'ID',THA:'TH',JPN:'JP',CHN:'CN',IND:'IN',PAK:'PK',BGD:'BD',AUS:'AU',BRA:'BR',MEX:'MX',ARG:'AR',COL:'CO',PER:'PE',CHL:'CL',BOL:'BO',ECU:'EC',URY:'UY',PRY:'PY',ZAF:'ZA',NGA:'NG',KEN:'KE',ETH:'ET',GHA:'GH',UGA:'UG',SDN:'SD',DZA:'DZ',MAR:'MA',TUN:'TN',LBY:'LY',AGO:'AO',MOZ:'MZ',ZMB:'ZM',ZWE:'ZW',MDG:'MG',CMR:'CM',SEN:'SN',MLI:'ML',NER:'NE',TCD:'TD',RWA:'RW',SOM:'SO',AFG:'AF',IRQ:'IQ',YEM:'YE',JOR:'JO',SYR:'SY',LBN:'LB',KAZ:'KZ',UZB:'UZ',TKM:'TM',KGZ:'KG',TJK:'TJ',MNG:'MN',GEO:'GE',ARM:'AM',AZE:'AZ',ROU:'RO',BGR:'BG',HUN:'HU',SRB:'RS',HRV:'HR',SVK:'SK',SVN:'SI',BIH:'BA',ALB:'AL',MDA:'MD',LTU:'LT',LVA:'LV',EST:'EE',ISL:'IS',IRL:'IE',LUX:'LU',GRC:'GR',CYP:'CY',MLT:'MT',BHR:'BH',KWT:'KW',QAT:'QA',OMN:'OM',PSE:'PS',BRN:'BN',SGP:'SG',BTN:'BT',LKA:'LK',NPL:'NP',MMR:'MM',KHM:'KH',MUS:'MU',FJI:'FJ',PNG:'PG',WSM:'WS',TON:'TO'};const cc=map[code];if(!cc)return '🌐';return String.fromCodePoint(...[...cc].map(c=>127397+c.charCodeAt()));}

async function fetchIndicatorAll(indicator){
  const all=[];let page=1,total=1;
  while(page<=total){
    const j=await fetchJSON(`https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&mrv=10&per_page=1000&page=${page}`);
    const meta=j[0]||{};total=Number(meta.pages)||1;all.push(...(j[1]||[]));page++;
    if(page<=total)await new Promise(r=>setTimeout(r,120));
  }
  return [null,all];
}
async function fetchCountries(force=false){
  if(!force&&Date.now()-state.lastCountryRefresh<3600000&&state.countries.length)return;
  if(state.loading)return;
  state.loading=true;
  try{
    const meta=await fetchJSON('https://api.worldbank.org/v2/country?format=json&per_page=400');
    const universe=(meta[1]||[]).filter(c=>c.iso3Code&&c.name&&c.region&&c.region.id!=='NA');
    const [p,b,d]=await Promise.all([fetchIndicatorAll('SP.POP.TOTL'),fetchIndicatorAll('SP.DYN.CBRT.IN'),fetchIndicatorAll('SP.DYN.CDRT.IN')]);
    const pm=latestByCountry(p),bm=latestByCountry(b),dm=latestByCountry(d),out=[];
    for(const c of universe){const pv=pm.get(c.iso3Code);if(!pv||pv.value<=0)continue;const bv=bm.get(c.iso3Code),dv=dm.get(c.iso3Code);out.push({code:c.iso3Code,name:c.name,flag:flagFor(c.iso3Code),p:pv.value,pYear:pv.year,b:bv?.value??null,bYear:bv?.year??null,d:dv?.value??null,dYear:dv?.year??null});}
    if(out.length<100)throw new Error('Country dataset incomplete: '+out.length);
    state.countries=out;state.lastCountryRefresh=Date.now();
  }finally{state.loading=false;}
}
function countryProjected(c,now=Date.now()){const anchor=Date.UTC(c.pYear,6,1);const years=Math.max(0,(now-anchor)/1000/YEAR);if(typeof c.b==='number'&&typeof c.d==='number'){const net=(c.b-c.d)/1000;return c.p*Math.pow(Math.max(.0001,1+net),years);}return c.p;}
function countryRows(mode,ascending=false){const rows=state.countries.map(c=>{const pop=countryProjected(c);let value=pop;if(mode==='births')value=typeof c.b==='number'?pop*c.b/1000/YEAR*DAY:0;else if(mode==='deaths')value=typeof c.d==='number'?pop*c.d/1000/YEAR*DAY:0;else if(mode==='growth')value=typeof c.b==='number'&&typeof c.d==='number'?pop*(c.b-c.d)/1000/YEAR*DAY:0;return[c.flag,c.name,value,c.code,c.b,c.d,pop];}).filter(r=>Number.isFinite(r[2])&&r[2]>0);rows.sort((a,b)=>ascending?a[2]-b[2]:b[2]-a[2]);return rows;}
function renderRows(rows){const mid=Math.ceil(rows.length/2);const html=(r,i)=>{const dir=typeof r[4]==='number'&&typeof r[5]==='number'?r[4]-r[5]:0;const cls=dir>0?'growth-up':dir<0?'growth-down':'growth-neutral';return `<div class="row ${cls}"><span class="rank">${i+1}</span><span class="flag">${r[0]}</span><span class="name">${esc(r[1])}</span><strong class="pop">${fmt(r[2])}</strong></div>`};const l=document.getElementById('left'),r=document.getElementById('right');if(l)l.innerHTML=rows.slice(0,mid).map((x,i)=>html(x,i)).join('');if(r)r.innerHTML=rows.slice(mid).map((x,i)=>html(x,i+mid)).join('');const c=document.getElementById('count');if(c)c.textContent=rows.length;}
function renderCities(){const rows=CITIES.map(c=>[c[0],c[1],c[2]*Math.pow(1+c[3]/100,Math.max(0,(Date.now()-CITY_BASELINE)/1000)/YEAR)]).sort((a,b)=>b[2]-a[2]);const rate=CITIES.reduce((s,c)=>s+c[2]*Math.pow(1+c[3]/100,Math.max(0,(Date.now()-CITY_BASELINE)/1000)/YEAR)*c[3]/100/YEAR,0);setHero('Top 50 Cities Population',rows.reduce((s,r)=>s+r[2],0),'COMBINED POPULATION · +'+rate.toFixed(2)+' / SEC');const cr=document.getElementById('cityRate'),cg=document.getElementById('cityGrowth');if(cr)cr.textContent=rate.toFixed(2);if(cg)cg.textContent='+'+fmt(rate*DAY);renderRows(rows.map(r=>[r[0],r[1],r[2],null,null,null]));}
function worldNow(now=Date.now()){const years=(now-WORLD_ANCHOR)/1000/YEAR;return WORLD_POP_2026*Math.pow(1+WORLD_GROWTH_RATE,Math.max(0,years));}
function worldNetPerSec(now=Date.now()){const years=(now-WORLD_ANCHOR)/1000/YEAR;return WORLD_POP_2026*Math.pow(1+WORLD_GROWTH_RATE,Math.max(0,years))*WORLD_GROWTH_RATE/YEAR;}
function update(){
  const now=Date.now(),midnight=new Date(now);midnight.setHours(0,0,0,0);const sec=Math.max(0,(now-midnight.getTime())/1000),page=document.body.dataset.page;
  if(page==='world'||!page){const pop=worldNow(now),n=worldNetPerSec(now),births=pop*0.0162/1000/YEAR,deaths=Math.max(0,births-n);const e=id=>document.getElementById(id);const w=e('world');if(w)w.textContent=fmt(pop);const b=e('births');if(b)b.textContent=fmt(births*sec);const d=e('deaths');if(d)d.textContent=fmt(deaths*sec);const g=e('growth');if(g)g.textContent='+'+fmt(n*sec);}
  if(page==='cities')renderCities();
  if(page==='births'||page==='least-births'){const rows=countryRows('births',page==='least-births');const perDay=rows.reduce((s,r)=>s+r[2],0),v=perDay*sec/DAY;setHero(page==='least-births'?'Least Births Today':'Births Today',v,'ESTIMATED · '+(perDay/DAY).toFixed(2)+' / SEC');renderRows(page==='least-births'?rows.slice(0,50).map(r=>[r[0],r[1],r[2]*sec/DAY,r[3],r[4],r[5]]):rows.slice(0,50).map(r=>[r[0],r[1],r[2]*sec/DAY,r[3],r[4],r[5]]));}
  if(page==='deaths'||page==='least-deaths'){const rows=countryRows('deaths',page==='least-deaths');const perDay=rows.reduce((s,r)=>s+r[2],0),v=perDay*sec/DAY;setHero(page==='least-deaths'?'Least Deaths Today':'Deaths Today',v,'ESTIMATED · '+(perDay/DAY).toFixed(2)+' / SEC');renderRows(rows.slice(0,50).map(r=>[r[0],r[1],r[2]*sec/DAY,r[3],r[4],r[5]]));}
  if(page==='growth'){const pop=worldNow(now),n=worldNetPerSec(now),births=pop*0.0162/1000/YEAR,deaths=Math.max(0,births-n);setHero('Current World Population',pop,'LIVE ESTIMATE · '+n.toFixed(2)+' / SEC');renderRows(countryRows('growth').slice(0,50).map(r=>[r[0],r[1],r[2]*sec/DAY,r[3],r[4],r[5]]));const be=document.getElementById('births'),de=document.getElementById('deaths'),ne=document.getElementById('net');if(be)be.textContent=fmt(births*sec);if(de)de.textContent=fmt(deaths*sec);if(ne)ne.textContent='+'+fmt(n*sec);}
  if(page==='least'){const rows=state.countries.map(c=>[c.flag,c.name,countryProjected(c),c.code,c.b,c.d]).sort((a,b)=>a[2]-b[2]).slice(0,50);renderRows(rows);setHero('Least Populated Countries',rows.reduce((s,r)=>s+r[2],0),'LOWEST 50 · LIVE ESTIMATE');}
  const u=document.getElementById('utc');if(u)u.textContent=new Date(now).toISOString().replace('T',' ').slice(0,19)+' UTC';
}
(async()=>{try{await fetchCountries();update();setInterval(update,1000);setInterval(()=>fetchCountries(true).then(update).catch(e=>console.warn('Country refresh failed',e)),3600000);}catch(e){console.error('Population data failed',e);for(const id of ['hero','heroMini','world','births','deaths','growth','net']){const el=document.getElementById(id);if(el)el.textContent='—';}const l=document.getElementById('left'),r=document.getElementById('right');const msg='<div style="padding:30px;text-align:center;color:#777;font-weight:700">Country data could not be loaded. Refresh the page to try again.</div>';if(l)l.innerHTML=msg;if(r)r.innerHTML='';}})();