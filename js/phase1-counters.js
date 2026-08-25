const YEAR=365.25*86400;
const DAY=86400;
const nf=new Intl.NumberFormat('en-US');
const fmt=n=>nf.format(Math.floor(n));
const esc=s=>String(s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]||m));

/* 2025 UN WUP-aligned city baseline + annual population growth (%).
   The baseline is a dated observation; everything shown after that date is
   calculated forward continuously, so the numbers do not freeze. */
const CITY_BASELINE=Date.parse('2025-07-01T00:00:00Z');
const CITIES=[
['🇮🇩','Jakarta',41913860,1.38],['🇧🇩','Dhaka',36585479,2.21],['🇯🇵','Tokyo',33412512,-0.17],['🇮🇳','New Delhi',30222405,0.75],['🇨🇳','Shanghai',29558908,1.31],['🇨🇳','Guangzhou',27563372,0.77],['🇪🇬','Cairo',25566102,1.24],['🇵🇭','Manila',24735305,0.59],['🇮🇳','Kolkata',22549738,0.45],['🇰🇷','Seoul',22490482,0.23],['🇵🇰','Karachi',21422590,1.98],['🇮🇳','Mumbai',20203056,0.87],['🇧🇷','São Paulo',18949790,0.16],['🇹🇭','Bangkok',18180280,1.03],['🇲🇽','Mexico City',17734212,0.14],['🇨🇳','Beijing',17013303,0.63],['🇵🇰','Lahore',15156430,1.52],['🇹🇷','Istanbul',15014763,0.54],['🇷🇺','Moscow',14524753,0.35],['🇻🇳','Ho Chi Minh City',14052713,1.38],['🇦🇷','Buenos Aires',14017736,0.11],['🇺🇸','New York City',13920148,-0.18],['🇨🇳','Shenzhen',13878396,0.64],['🇮🇳','Bengaluru',13187098,0.43],['🇯🇵','Osaka',12964145,-0.75],['🇳🇬','Lagos',12791699,1.23],['🇺🇸','Los Angeles',12740420,0.39],['🇦🇴','Luanda',11370127,2.89],['🇮🇳','Chennai',11153205,0.42],['🇨🇩','Kinshasa',10943641,0.90],['🇨🇴','Bogotá',10624315,1.31],['🇵🇪','Lima',10580241,1.04],['🇬🇧','London',10416420,0.82],['🇮🇳','Hajipur',9941510,1.78],['🇧🇷','Rio de Janeiro',9500336,0.17],['🇫🇷','Paris',9381921,0.08],['🇮🇳','Hyderabad',9190795,0.39],['🇮🇷','Tehran',9174964,0.63],['🇹🇼','Taipei',9136792,-0.21],['🇮🇩','Bandung',8909104,0.84],['🇲🇾','Kuala Lumpur',8443731,1.39],['🇹🇿','Dar es Salaam',7795114,2.48],['🇨🇳','Suzhou',7731101,0.30],['🇮🇳','Ahmedabad',7632408,0.44],['🇨🇳','Hangzhou',7500208,1.73],['🇨🇳','Wuhan',7363548,-0.53],['🇨🇳','Tianjin',7285342,0.67],['🇪🇬','Alexandria',7266957,1.10],['🇯🇵','Nagoya',7146160,-0.38],['🇿🇦','Johannesburg',7077175,1.60]];
const COUNTRIES=[['🇮🇳','India','IND',1476625576],['🇨🇳','China','CHN',1412914089],['🇺🇸','U.S.A.','USA',349035494],['🇮🇩','Indonesia','IDN',287886782],['🇵🇰','Pakistan','PAK',259299791],['🇳🇬','Nigeria','NGA',242431832],['🇧🇷','Brazil','BRA',213562666],['🇧🇩','Bangladesh','BGD',177818044],['🇷🇺','Russia','RUS',143394458],['🇪🇹','Ethiopia','ETH',138902185],['🇲🇽','Mexico','MEX',132997658],['🇯🇵','Japan','JPN',122427731],['🇪🇬','Egypt','EGY',120101175],['🇵🇭','Philippines','PHL',117724471],['🇨🇩','DR Congo','COD',116452162],['🇻🇳','Vietnam','VNM',102177431],['🇮🇷','Iran','IRN',93168497],['🇹🇷','Turkey','TUR',87926082],['🇩🇪','Germany','DEU',83644258],['🇹🇿','Tanzania','TZA',72563780],['🇹🇭','Thailand','THA',71559614],['🇬🇧','U.K.','GBR',69931528],['🇫🇷','France','FRA',66746401],['🇿🇦','South Africa','ZAF',65453084],['🇮🇹','Italy','ITA',58926166],['🇰🇪','Kenya','KEN',58636412],['🇲🇲','Myanmar','MMR',55184819],['🇨🇴','Colombia','COL',53936226],['🇸🇩','Sudan','SDN',53282719],['🇺🇬','Uganda','UGA',52761469],['🇰🇷','South Korea','KOR',51689732],['🇪🇸','Spain','ESP',49888179],['🇩🇿','Algeria','DZA',48104150],['🇮🇶','Iraq','IRQ',48045827],['🇦🇷','Argentina','ARG',45998102],['🇦🇫','Afghanistan','AFG',44988442],['🇾🇪','Yemen','YEM',43031272],['🇨🇦','Canada','CAN',42592980],['🇦🇴','Angola','AGO',40246376],['🇲🇦','Morocco','MAR',38803548],['🇸🇦','Saudi Arabia','SAU',38726102],['🇺🇿','Uzbekistan','UZB',37787086],['🇲🇿','Mozambique','MOZ',36682787],['🇲🇾','Malaysia','MYS',36416768],['🇵🇱','Poland','POL',36308335],['🇬🇭','Ghana','GHA',35726987],['🇵🇪','Peru','PER',34950093],['🇨🇮','Ivory Coast','CIV',33522793],['🇳🇵','Nepal','NPL',29585538],['🇻🇪','Venezuela','VEN',28619557]];

const state={anchor:CITY_BASELINE,global:8300678395,birthRate:16,deathRate:7.7,countryRates:new Map(),lastWorldRefresh:0};
const elapsed=()=>Math.max(0,(Date.now()-state.anchor)/1000);
const projected=(pop,growth,anchor=CITY_BASELINE)=>pop*Math.pow(1+growth/100,Math.max(0,(Date.now()-anchor)/1000)/YEAR);
function setHero(title,value,label){const a=document.getElementById('heroTitle'),b=document.getElementById('hero'),c=document.getElementById('heroLabel');if(a)a.textContent=title;if(b)b.textContent=fmt(value);if(c)c.textContent=label;}
function renderRows(rows){const mid=Math.ceil(rows.length/2);const html=(r,i)=>`<div class="row"><span class="rank">${i+1}</span><span class="flag">${r[0]}</span><span class="name">${esc(r[1])}</span><strong>${fmt(r[2])}</strong></div>`;const l=document.getElementById('left'),r=document.getElementById('right');if(l)l.innerHTML=rows.slice(0,mid).map((x,i)=>html(x,i)).join('');if(r)r.innerHTML=rows.slice(mid).map((x,i)=>html(x,i+mid)).join('');const count=document.getElementById('count');if(count)count.textContent=rows.length;}

function cityPopulation(c){return projected(c[2],c[3]);}
function renderCities(){
 const rows=CITIES.map(c=>[c[0],c[1],cityPopulation(c)]).sort((a,b)=>b[2]-a[2]);
 const total=rows.reduce((s,r)=>s+r[2],0);
 const growthPerSec=CITIES.reduce((s,c)=>s+c[2]*(c[3]/100)/YEAR,0);
 setHero('Top 50 Cities Population',total,'COMBINED CITY POPULATION · +'+growthPerSec.toFixed(2)+' / SEC');
 renderRows(rows);
}

function collectLatest(j){const out={};for(const x of(j[1]||[])){if(typeof x.value!=='number')continue;const y=+x.date;if(!out[x.countryiso3code]||y>out[x.countryiso3code].year)out[x.countryiso3code]={year:y,value:x.value};}return out;}
async function fetchCountryRates(){try{const codes=COUNTRIES.map(c=>c[2]).join(';');const [br,dr]=await Promise.all([fetch(`https://api.worldbank.org/v2/country/${codes}/indicator/SP.DYN.CBRT.IN?format=json&mrv=5&per_page=500`).then(r=>r.json()),fetch(`https://api.worldbank.org/v2/country/${codes}/indicator/SP.DYN.CDRT.IN?format=json&mrv=5&per_page=500`).then(r=>r.json())]);const B=collectLatest(br),D=collectLatest(dr);COUNTRIES.forEach(c=>{if(B[c[2]]&&D[c[2]])state.countryRates.set(c[2],{b:B[c[2]].value,d:D[c[2]].value,year:Math.min(B[c[2]].year,D[c[2]].year)});});}catch(e){}}
function countryBirthFlows(){return COUNTRIES.map(c=>{const r=state.countryRates.get(c[2])||{b:16,d:7.7};const daily=c[3]*r.b/1000/365.25;return[c[0],c[1],daily];}).sort((a,b)=>b[2]-a[2]);}
function countryDeathFlows(){return COUNTRIES.map(c=>{const r=state.countryRates.get(c[2])||{b:16,d:7.7};const daily=c[3]*r.d/1000/365.25;return[c[0],c[1],daily];}).sort((a,b)=>b[2]-a[2]);}

async function refreshWorld(){
 if(Date.now()-state.lastWorldRefresh<3600000)return;
 state.lastWorldRefresh=Date.now();
 try{const [p,b,d]=await Promise.all([fetch('https://api.worldbank.org/v2/country/WLD/indicator/SP.POP.TOTL?format=json&mrv=5').then(r=>r.json()),fetch('https://api.worldbank.org/v2/country/WLD/indicator/SP.DYN.CBRT.IN?format=json&mrv=5').then(r=>r.json()),fetch('https://api.worldbank.org/v2/country/WLD/indicator/SP.DYN.CDRT.IN?format=json&mrv=5').then(r=>r.json())]);const latest=j=>{for(const x of(j[1]||[]))if(typeof x.value==='number')return {value:x.value,year:+x.date};};const pv=latest(p),bv=latest(b),dv=latest(d);if(pv&&bv&&dv){state.global=pv.value;state.birthRate=bv.value;state.deathRate=dv.value;state.anchor=Date.now();}}catch(e){state.lastWorldRefresh=0;}}

function update(){
 const now=new Date();const midnight=new Date(now);midnight.setHours(0,0,0,0);const todaySeconds=(Date.now()-midnight.getTime())/1000;const page=document.body.dataset.page;
 if(page==='cities')renderCities();
 if(page==='births'){const rows=countryBirthFlows();const totalPerDay=rows.reduce((s,r)=>s+r[2],0);setHero('Births Today',totalPerDay*todaySeconds/DAY,'ESTIMATED BIRTHS TODAY · '+(totalPerDay/DAY).toFixed(2)+' / SEC');renderRows(rows.map(r=>[r[0],r[1],r[2]*todaySeconds/DAY]));}
 if(page==='deaths'){const rows=countryDeathFlows();const totalPerDay=rows.reduce((s,r)=>s+r[2],0);setHero('Deaths Today',totalPerDay*todaySeconds/DAY,'ESTIMATED DEATHS TODAY · '+(totalPerDay/DAY).toFixed(2)+' / SEC');renderRows(rows.map(r=>[r[0],r[1],r[2]*todaySeconds/DAY]));}
 if(page==='growth'){const birthPerSec=state.global*state.birthRate/1000/YEAR;const deathPerSec=state.global*state.deathRate/1000/YEAR;const netPerSec=birthPerSec-deathPerSec;setHero('Current World Population',state.global+netPerSec*elapsed(),'LIVE ESTIMATE · '+(netPerSec>=0?'+':'')+netPerSec.toFixed(2)+' / SEC');const rows=COUNTRIES.map(c=>{const r=state.countryRates.get(c[2])||{b:16,d:7.7};return[c[0],c[1],Math.max(0,c[3]*(r.b-r.d)/1000/365.25*todaySeconds/DAY)];}).sort((a,b)=>b[2]-a[2]);renderRows(rows);const be=document.getElementById('births'),de=document.getElementById('deaths'),ne=document.getElementById('net');if(be)be.textContent=fmt(birthPerSec*todaySeconds);if(de)de.textContent=fmt(deathPerSec*todaySeconds);if(ne)ne.textContent=(netPerSec>=0?'+':'−')+fmt(Math.abs(netPerSec*todaySeconds));}
 const utc=document.getElementById('utc');if(utc)utc.textContent=now.toISOString().replace('T',' ').slice(0,19)+' UTC';
}

(async()=>{await Promise.all([refreshWorld(),fetchCountryRates()]);setInterval(()=>{refreshWorld();fetchCountryRates();},3600000);setInterval(update,1000);update();})();