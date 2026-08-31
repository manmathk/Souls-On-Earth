const YEAR=365.25*86400;
const DAY=86400;
const nf=new Intl.NumberFormat('en-US');
const fmt=n=>nf.format(Math.max(0,Math.floor(Number(n)||0)));
const esc=s=>String(s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]||m));

/* UN WPP 2024 / Worldometer 2026 reference point. */
const WORLD_ANCHOR=Date.parse('2026-07-01T00:00:00Z');
const WORLD_POP_2026=8300678395;
const WORLD_ANNUAL_CHANGE_2026=69065325;
const WORLD_GROWTH_RATE=WORLD_ANNUAL_CHANGE_2026/WORLD_POP_2026;

const CITY_BASELINE=Date.parse('2025-07-01T00:00:00Z');
const CITIES=[['🇮🇩','Jakarta',41913860,1.38],['🇧🇩','Dhaka',36585479,2.21],['🇯🇵','Tokyo',33412512,-0.17],['🇮🇳','New Delhi',30222405,0.75],['🇨🇳','Shanghai',29558908,1.31],['🇨🇳','Guangzhou',27563372,0.77],['🇪🇬','Cairo',25566102,1.24],['🇵🇭','Manila',24735305,0.59],['🇮🇳','Kolkata',22549738,0.45],['🇰🇷','Seoul',22490482,0.23],['🇵🇰','Karachi',21422590,1.98],['🇮🇳','Mumbai',20203056,0.87],['🇧🇷','São Paulo',18949790,0.16],['🇹🇭','Bangkok',18180280,1.03],['🇲🇽','Mexico City',17734212,0.14],['🇨🇳','Beijing',17013303,0.63],['🇵🇰','Lahore',15156430,1.52],['🇹🇷','Istanbul',15014763,0.54],['🇷🇺','Moscow',14524753,0.35],['🇻🇳','Ho Chi Minh City',14052713,1.38],['🇦🇷','Buenos Aires',14017736,0.11],['🇺🇸','New York City',13920148,-0.18],['🇨🇳','Shenzhen',13878396,0.64],['🇮🇳','Bengaluru',13187098,0.43],['🇯🇵','Osaka',12964145,-0.75],['🇳🇬','Lagos',12791699,1.23],['🇺🇸','Los Angeles',12740420,0.39],['🇦🇴','Luanda',11370127,2.89],['🇮🇳','Chennai',11153205,0.42],['🇨🇩','Kinshasa',10943641,0.90],['🇨🇴','Bogotá',10624315,1.31],['🇵🇪','Lima',10580241,1.04],['🇬🇧','London',10416420,0.82],['🇮🇳','Hajipur',9941510,1.78],['🇧🇷','Rio de Janeiro',9500336,0.17],['🇫🇷','Paris',9381921,0.08],['🇮🇳','Hyderabad',9190795,0.39],['🇮🇷','Tehran',9174964,0.63],['🇹🇼','Taipei',9136792,-0.21],['🇮🇩','Bandung',8909104,0.84],['🇲🇾','Kuala Lumpur',8443731,1.39],['🇹🇿','Dar es Salaam',7795114,2.48],['🇨🇳','Suzhou',7731101,0.30],['🇮🇳','Ahmedabad',7632408,0.44],['🇨🇳','Hangzhou',7500208,1.73],['🇨🇳','Wuhan',7363548,-0.53],['🇨🇳','Tianjin',7285342,0.67],['🇪🇬','Alexandria',7266957,1.10],['🇯🇵','Nagoya',7146160,-0.38],['🇿🇦','Johannesburg',7077175,1.60]];

const state={countries:[],lastCountryRefresh:0,loading:false};
function setHero(title,value,label){for(const [id,text] of [['heroTitle',title],['hero',fmt(value)],['heroLabel',label]]){const e=document.getElementById(id);if(e)e.textContent=text;}}
function setText(id,text){const e=document.getElementById(id);if(e)e.textContent=text;}

/* Browser-safe API loader. World Bank supports both JSON and JSONP. JSONP is
   used as a fallback because it works on static GitHub Pages when a browser
   or network blocks cross-origin fetch requests. */
function fetchJSON(url,retries=2){return new Promise(async(resolve,reject)=>{for(let i=0;i<retries;i++){try{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();if(!Array.isArray(j)||!Array.isArray(j[1]))throw new Error('Invalid API response');return resolve(j);}catch(e){if(i===retries-1)break;await new Promise(r=>setTimeout(r,500));}}
 const cb='wbcb_'+Date.now()+'_'+Math.random().toString(36).slice(2);const s=document.createElement('script');const timeout=setTimeout(()=>{cleanup();reject(new Error('World Bank request timed out'));},12000);function cleanup(){clearTimeout(timeout);delete window[cb];s.remove();}window[cb]=j=>{cleanup();if(Array.isArray(j)&&Array.isArray(j[1]))resolve(j);else reject(new Error('Invalid JSONP response'));};s.onerror=()=>{cleanup();reject(new Error('World Bank request failed'));};s.src=url.replace('format=json','format=jsonP')+'&prefix='+cb;document.head.appendChild(s);
});}

function latestByCountry(data){const out=new Map();for(const x of data[1]||[]){if(typeof x.value!=='number'||!x.countryiso3code)continue;const code=x.countryiso3code;if(code.length!==3)continue;const year=Number(String(x.date).slice(0,4));const old=out.get(code);if(!old||year>old.year)out.set(code,{value:x.value,year,name:x.country?.value||code});}return out;}
function flagFor(code){const map={USA:'US',GBR:'GB',CAN:'CA',RUS:'RU',KOR:'KR',PRK:'KP',IRN:'IR',COD:'CD',COG:'CG',CIV:'CI',TZA:'TZ',CZE:'CZ',LAO:'LA',VNM:'VN',PHL:'PH',CHE:'CH',ARE:'AE',SAU:'SA',NZL:'NZ',EGY:'EG',TUR:'TR',DEU:'DE',FRA:'FR',ESP:'ES',ITA:'IT',NLD:'NL',BEL:'BE',PRT:'PT',AUT:'AT',SWE:'SE',NOR:'NO',DNK:'DK',FIN:'FI',POL:'PL',UKR:'UA',ISR:'IL',MYS:'MY',IDN:'ID',THA:'TH',JPN:'JP',CHN:'CN',IND:'IN',PAK:'PK',BGD:'BD',AUS:'AU',BRA:'BR',MEX:'MX',ARG:'AR',COL:'CO',PER:'PE',CHL:'CL',BOL:'BO',ECU:'EC',URY:'UY',PRY:'PY',ZAF:'ZA',NGA:'NG',KEN:'KE',ETH:'ET',GHA:'GH',UGA:'UG',SDN:'SD',DZA:'DZ',MAR:'MA',TUN:'TN',LBY:'LY',AGO:'AO',MOZ:'MZ',ZMB:'ZM',ZWE:'ZW',MDG:'MG',CMR:'CM',SEN:'SN',MLI:'ML',NER:'NE',TCD:'TD',RWA:'RW',SOM:'SO',AFG:'AF',IRQ:'IQ',YEM:'YE',JOR:'JO',SYR:'SY',LBN:'LB',KAZ:'KZ',UZB:'UZ',TKM:'TM',KGZ:'KG',TJK:'TJ',MNG:'MN',GEO:'GE',ARM:'AM',AZE:'AZ',ROU:'RO',BGR:'BG',HUN:'HU',SRB:'RS',HRV:'HR',SVK:'SK',SVN:'SI',BIH:'BA',ALB:'AL',MDA:'MD',LTU:'LT',LVA:'LV',EST:'EE',ISL:'IS',IRL:'IE',LUX:'LU',GRC:'GR',CYP:'CY',MLT:'MT',BHR:'BH',KWT:'KW',QAT:'QA',OMN:'OM',PSE:'PS',BRN:'BN',SGP:'SG',BTN:'BT',LKA:'LK',NPL:'NP',MMR:'MM',KHM:'KH',MUS:'MU',FJI:'FJ',PNG:'PG',WSM:'WS',TON:'TO'};const cc=map[code];if(!cc)return '🌐';return String.fromCodePoint(...[...cc].map(c=>127397+c.charCodeAt()));}

async function fetchIndicator(indicator){
 const url='https://api.worldbank.org/v2/country/all/indicator/'+indicator+'?format=json&mrv=1&per_page=1000';
 return fetchJSON(url);
}
async function fetchCountries(force=false){
 if(!force&&state.countries.length&&Date.now()-state.lastCountryRefresh<3600000)return state.countries;
 if(state.loading)return state.countries;
 state.loading=true;
 try{
   const [p,b,d]=await Promise.all([fetchIndicator('SP.POP.TOTL'),fetchIndicator('SP.DYN.CBRT.IN'),fetchIndicator('SP.DYN.CDRT.IN')]);
   const pm=latestByCountry(p),bm=latestByCountry(b),dm=latestByCountry(d),out=[];
   for(const [code,pv] of pm){
     if(!pv.value||pv.value<=0)continue;
     const bv=bm.get(code),dv=dm.get(code);
     out.push({code,name:pv.name||code,flag:flagFor(code),p:pv.value,pYear:pv.year,b:bv?.value??null,bYear:bv?.year??null,d:dv?.value??null,dYear:dv?.year??null});
   }
   if(out.length<100)throw new Error('Only '+out.length+' countries returned');
   state.countries=out;state.lastCountryRefresh=Date.now();
   return out;
 }finally{state.loading=false;}
}
function countryProjected(c,now=Date.now()){
 const anchor=Date.UTC(c.pYear,6,1);const years=Math.max(0,(now-anchor)/1000/YEAR);
 if(typeof c.b==='number'&&typeof c.d==='number'){const net=(c.b-c.d)/1000;return c.p*Math.pow(Math.max(.0001,1+net),years);}
 return c.p;
}
function countryRows(mode,ascending=false){
 const rows=state.countries.map(c=>{const pop=countryProjected(c);let value=pop;
   if(mode==='births')value=typeof c.b==='number'?pop*c.b/1000/YEAR*DAY:0;
   else if(mode==='deaths')value=typeof c.d==='number'?pop*c.d/1000/YEAR*DAY:0;
   else if(mode==='growth')value=typeof c.b==='number'&&typeof c.d==='number'?pop*(c.b-c.d)/1000/YEAR*DAY:0;
   return[c.flag,c.name,value,c.code,c.b,c.d,pop];
 }).filter(r=>Number.isFinite(r[2])&&r[2]>0);
 rows.sort((a,b)=>ascending?a[2]-b[2]:b[2]-a[2]);return rows;
}
function renderRows(rows){
 const mid=Math.ceil(rows.length/2);const html=(r,i)=>{const dir=typeof r[4]==='number'&&typeof r[5]==='number'?r[4]-r[5]:0;const cls=dir>0?'growth-up':dir<0?'growth-down':'growth-neutral';return `<div class="row ${cls}"><span class="rank">${i+1}</span><span class="flag">${r[0]}</span><span class="name">${esc(r[1])}</span><strong class="pop">${fmt(r[2])}</strong></div>`};
 const l=document.getElementById('left'),r=document.getElementById('right');if(l)l.innerHTML=rows.slice(0,mid).map((x,i)=>html(x,i)).join('');if(r)r.innerHTML=rows.slice(mid).map((x,i)=>html(x,i+mid)).join('');setText('count',rows.length);
}
function loadingRows(text='Loading live country data…'){const msg=`<div style="padding:30px;text-align:center;color:#777;font-weight:700">${text}</div>`;const l=document.getElementById('left'),r=document.getElementById('right');if(l)l.innerHTML=msg;if(r)r.innerHTML='';}
function renderCities(){const rows=CITIES.map(c=>[c[0],c[1],c[2]*Math.pow(1+c[3]/100,Math.max(0,(Date.now()-CITY_BASELINE)/1000)/YEAR)]).sort((a,b)=>b[2]-a[2]);const rate=CITIES.reduce((s,c)=>s+c[2]*Math.pow(1+c[3]/100,Math.max(0,(Date.now()-CITY_BASELINE)/1000)/YEAR)*c[3]/100/YEAR,0);setHero('Top 50 Cities Population',rows.reduce((s,r)=>s+r[2],0),'COMBINED POPULATION · +'+rate.toFixed(2)+' / SEC');setText('cityRate',rate.toFixed(2));setText('cityGrowth','+'+fmt(rate*DAY));renderRows(rows.map(r=>[r[0],r[1],r[2],null,null,null]));}
function worldNow(now=Date.now()){const years=(now-WORLD_ANCHOR)/1000/YEAR;return WORLD_POP_2026*Math.pow(1+WORLD_GROWTH_RATE,Math.max(0,years));}
function worldNetPerSec(now=Date.now()){const years=(now-WORLD_ANCHOR)/1000/YEAR;return WORLD_POP_2026*Math.pow(1+WORLD_GROWTH_RATE,Math.max(0,years))*WORLD_GROWTH_RATE/YEAR;}
function updateWorld(){const now=Date.now(),midnight=new Date(now);midnight.setHours(0,0,0,0);const sec=Math.max(0,(now-midnight.getTime())/1000),pop=worldNow(now),n=worldNetPerSec(now),births=pop*0.0162/1000/YEAR,deaths=Math.max(0,births-n);setText('world',fmt(pop));setText('births',fmt(births*sec));setText('deaths',fmt(deaths*sec));setText('growth','+'+fmt(n*sec));setText('net','+'+fmt(n*sec));}
function updateCountryPage(){
 const page=document.body.dataset.page,now=Date.now();if(!state.countries.length)return;
 const midnight=new Date(now);midnight.setHours(0,0,0,0);const sec=Math.max(0,(now-midnight.getTime())/1000);
 if(page==='cities'){renderCities();return;}
 if(page==='least'){const rows=countryRows('population',true).slice(0,50);setHero('Least Populated Countries',rows.reduce((s,r)=>s+r[2],0),'LOWEST 50 · LIVE ESTIMATE');renderRows(rows);return;}
 if(page==='births'||page==='least-births'){const rows=countryRows('births',page==='least-births');const shown=page==='least-births'?rows.slice(0,50):rows.slice(0,50);const perDay=shown.reduce((s,r)=>s+r[2],0),v=perDay*sec/DAY;setHero(page==='least-births'?'Least Births Today':'Births Today',v,'ESTIMATED · '+(perDay/DAY).toFixed(2)+' / SEC');renderRows(shown.map(r=>[r[0],r[1],r[2]*sec/DAY,r[3],r[4],r[5]]));return;}
 if(page==='deaths'||page==='least-deaths'){const rows=countryRows('deaths',page==='least-deaths');const shown=rows.slice(0,50);const perDay=shown.reduce((s,r)=>s+r[2],0),v=perDay*sec/DAY;setHero(page==='least-deaths'?'Least Deaths Today':'Deaths Today',v,'ESTIMATED · '+(perDay/DAY).toFixed(2)+' / SEC');renderRows(shown.map(r=>[r[0],r[1],r[2]*sec/DAY,r[3],r[4],r[5]]));return;}
 if(page==='growth'){const rows=countryRows('growth').slice(0,50);const n=worldNetPerSec(now),pop=worldNow(now);setHero('Current World Population',pop,'LIVE ESTIMATE · '+n.toFixed(2)+' / SEC');renderRows(rows.map(r=>[r[0],r[1],r[2]*sec/DAY,r[3],r[4],r[5]]));setText('births',fmt(pop*0.0162/1000/YEAR*sec));setText('deaths',fmt(Math.max(0,pop*0.0162/1000/YEAR-n)*sec));setText('net','+'+fmt(n*sec));}
}
function update(){updateWorld();updateCountryPage();const u=document.getElementById('utc');if(u)u.textContent=new Date().toISOString().replace('T',' ').slice(0,19)+' UTC';}

/* World clock renders immediately. Country pages load independently so one
   failed country request can never blank the main world counter. */
(async()=>{
 const page=document.body.dataset.page;
 update();setInterval(update,1000);
 if(page==='world'||page==='cities'){try{await fetchCountries();update();}catch(e){console.warn('Country data unavailable:',e);}}
 else{loadingRows();try{await fetchCountries();update();}catch(e){console.error('Country data failed',e);loadingRows('Country data could not be loaded. Please refresh and try again.');}}
 setInterval(async()=>{try{await fetchCountries(true);update();}catch(e){console.warn('Country refresh failed',e);}},3600000);
})();