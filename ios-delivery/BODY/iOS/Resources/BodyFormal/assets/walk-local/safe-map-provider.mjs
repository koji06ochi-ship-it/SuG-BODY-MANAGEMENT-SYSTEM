// Facility provider only. Map tiles, GPS, distance and cards are independent.
export const CATEGORIES=['SAFE','MEDICAL','PUBLIC','MOVE'];
const BASE=new URL('./data/safe-map/',import.meta.url),KEY='sug_safe_static_v1';
const HOUR=3600000,DAY=24*HOUR;
const validPoint=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180;
export function meters(a,b){const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlng=(b.lng-a.lng)*rad;return 12742000*Math.asin(Math.min(1,Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlng/2)**2)));}
export function deliveryMode(location){return ['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&['/tools/safe-map-preview.html','/tools/safe-map-failure-preview.html'].includes(location.pathname)?'local-trial':'static';}
function catalog(v){
 if(v?.schemaVersion!==1||!Array.isArray(v.regions)||v.regions.length>5000)throw Error('施設索引の形式が不正です');
 const ids=new Set();for(const r of v.regions){if(!/^[a-z0-9-]+$/.test(r.id)||ids.has(r.id)||!validPoint(r)||!Number.isFinite(r.radius)||r.radius<=0||r.radius>1000||!/^[-a-z0-9]+\.json$/.test(r.file)||typeof r.name!=='string')throw Error('地域索引の形式が不正です');ids.add(r.id);}return v;
}
function dataset(v,r){
 const osm=v?.source==='OpenStreetMap contributors'&&v.license==='ODbL-1.0';
 const official=typeof v?.source==='string'&&v.source.length<=160&&/^https:\/\//.test(v.sourceUrl||'')&&['CC-BY-4.0','CC-BY','CC-BY-2.1-JP','ODbL-1.0','PDL-1.0'].includes(v.license)&&/^https:\/\//.test(v.licenseUrl||'');
 if(v?.schemaVersion!==1||v.id!==r.id||v.lat!==r.lat||v.lng!==r.lng||v.radius!==r.radius||v.partial!==true||(!osm&&!official)||!Number.isFinite(Date.parse(v.retrievedAt))||!Array.isArray(v.data)||v.data.length>1000)throw Error('施設データの形式が不正です');
 const ids=new Set();for(const f of v.data){const validId=osm?/^(node|way|relation)\/[1-9]\d*$/.test(f.id):/^municipality\/[a-z0-9-]+\/[a-z0-9-]+\/[a-f0-9]{16}$/.test(f.id);if(!validPoint(f)||!CATEGORIES.includes(f.category)||!validId||ids.has(f.id)||(osm?f.source!=='https://www.openstreetmap.org/'+f.id:f.source!==v.sourceUrl)||typeof f.name!=='string'||f.name.length>200||typeof f.address!=='string'||f.address.length>300||typeof f.kind!=='string'||f.kind.length>80)throw Error('施設情報の形式が不正です');ids.add(f.id);}return v;
}
export function createStaticClient({fetcher=fetch,storage,now=Date.now,base=BASE}={}){
 let cache={},busy=false;const blocked=new Map();
 try{const s=JSON.parse(storage?.getItem(KEY)||'{}');if(s&&typeof s==='object'&&!Array.isArray(s))cache=s;}catch{}
 function save(){const entries=Object.entries(cache).filter(([,v])=>Number.isFinite(v?.at)).sort((a,b)=>b[1].at-a[1].at).slice(0,9);cache=Object.fromEntries(entries);try{storage?.setItem(KEY,JSON.stringify(cache));}catch{/* Optional cache must not block WALK. */}}
 async function read(file,ttl,validate){
  const url=new URL(file,base).href,old=cache[url],time=now();let usable=false;
  if(old&&Number.isFinite(old.at)&&time>=old.at&&time-old.at<7*DAY){try{validate(old.value);usable=true;}catch{}}
  if(usable&&time-old.at<ttl)return {value:old.value,cached:true,offline:false};
  if(time<(blocked.get(url)||0)){if(usable)return {value:old.value,cached:true,offline:true};throw Error('施設配信の再取得は30秒以上待ってください');}
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{
   const response=await fetcher(url,{signal:controller.signal,credentials:'omit',cache:'default',redirect:'error'});
   if(!response.ok){let wait=30000;if(response.status===429){const retry=response.headers.get('Retry-After');wait=Math.max(300000,/^\d+$/.test(retry||'')?Number(retry)*1000:(Date.parse(retry)-time)||0);}blocked.set(url,time+wait);throw Error('施設配信エラー（HTTP '+response.status+'）');}
   const text=await response.text();if(text.length>2000000)throw Error('施設データが上限を超えました');const value=validate(JSON.parse(text));cache[url]={at:time,value};save();return {value,cached:false,offline:false};
  }catch(e){if(!blocked.has(url)||blocked.get(url)<time)blocked.set(url,time+30000);if(usable)return {value:old.value,cached:true,offline:true};throw Error(e.name==='AbortError'?'施設配信がタイムアウトしました':e.message||'施設データを取得できません');}finally{clearTimeout(timer);}
 }
 async function readOptional(file,ttl,validate){
  const url=new URL(file,base).href,old=cache[url],time=now();
  if(old&&Number.isFinite(old.at)&&time>=old.at&&time-old.at<ttl){if(old.missing)return {value:{schemaVersion:1,regions:[]},cached:true,offline:false,missing:true};try{validate(old.value);return {value:old.value,cached:true,offline:false};}catch{}}
  if(time<(blocked.get(url)||0))return {value:{schemaVersion:1,regions:[]},cached:false,offline:true};
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{const response=await fetcher(url,{signal:controller.signal,credentials:'omit',cache:'default',redirect:'error'});if(response.status===404){cache[url]={at:time,missing:true};save();return {value:{schemaVersion:1,regions:[]},cached:false,offline:false,missing:true};}if(!response.ok)throw Error('施設追加索引エラー（HTTP '+response.status+'）');const text=await response.text();if(text.length>1000000)throw Error('施設追加索引が上限を超えました');const value=validate(JSON.parse(text));cache[url]={at:time,value};save();return {value,cached:false,offline:false};}
  catch{return {value:{schemaVersion:1,regions:[]},cached:false,offline:true};}finally{clearTimeout(timer);}
 }
 async function loadCatalog(){
  let bundle;try{bundle=await read('catalog-bundle-20261016.json',HOUR,catalog);}catch(e){if(!/HTTP 404/.test(e.message||''))throw e;}
  if(bundle)return {value:bundle.value,cached:bundle.cached,offline:bundle.offline};
  const primary=await read('catalog.json',HOUR,catalog),addons=[];
  for(const file of ['catalog-additions.json','catalog-additions-20261016.json','catalog-additions-20261016-2.json','catalog-additions-20261016-3.json','catalog-additions-20261016-4.json','catalog-additions-20261016-5.json'])addons.push(await readOptional(file,HOUR,v=>catalog(v)));
  const combined=catalog({schemaVersion:1,regions:[...primary.value.regions,...addons.flatMap(x=>x.value.regions)]});
  return {value:combined,cached:primary.cached&&addons.every(x=>x.cached),offline:primary.offline||addons.some(x=>x.offline)};
 }
 async function readRegion(region,center){
  const response=await read(region.file,DAY,v=>dataset(v,region)),v=response.value;
  return {status:'ready',data:center?v.data.filter(f=>meters(center,f)<=region.radius):v.data,at:Date.parse(v.retrievedAt),osmTimestamp:v.osmTimestamp||null,sourceUpdatedAt:v.sourceUpdatedAt||null,region:region.name,partial:true,cached:response.cached,offline:response.offline,old:now()-Date.parse(v.retrievedAt)>7*DAY,source:v.source,sourceUrl:v.sourceUrl||null,license:v.license,licenseUrl:v.licenseUrl||null};
 }
 return {mode:'static',requiresLock:false,async listRegions(){return (await loadCatalog()).value.regions;},async get(center){
  if(!validPoint(center))throw Error('地図の中心を確認してください');if(busy)throw Error('施設取得中です');busy=true;
  try{
   const index=await loadCatalog();
   const region=index.value.regions.filter(r=>meters(center,r)<=r.radius).sort((a,b)=>meters(center,a)-meters(center,b))[0];
   if(!region)return {status:'unprepared',data:[],at:now(),cached:index.cached,offline:index.offline};
   const value=await readRegion(region,center);return {...value,offline:index.offline||value.offline};
  }finally{busy=false;}
 },async getViewport(bounds){
  const south=bounds.south??bounds._southWest?.lat,north=bounds.north??bounds._northEast?.lat,west=bounds.west??bounds._southWest?.lng,east=bounds.east??bounds._northEast?.lng;
  if(![south,north,west,east].every(Number.isFinite)||south>north||west>east||north-south>0.08||east-west>0.08)throw Error('地図範囲を拡大してから検索してください');
  if(busy)throw Error('施設取得中です');busy=true;
  try{
   const index=await loadCatalog(),latMid=(south+north)/2,lngMid=(west+east)/2;
   const intersects=r=>{const lat=Math.max(south,Math.min(north,r.lat)),lng=Math.max(west,Math.min(east,r.lng));return meters(r,{lat,lng})<=r.radius;};
   const intersecting=index.value.regions.filter(intersects),regions=intersecting.sort((a,b)=>(Number(b.priority)||0)-(Number(a.priority)||0)||meters({lat:latMid,lng:lngMid},a)-meters({lat:latMid,lng:lngMid},b)).slice(0,8);
   if(!regions.length)return {status:'unprepared',data:[],at:now(),cached:index.cached,offline:index.offline,partial:true,coverageComplete:false};
   const responses=[];for(const region of regions)responses.push({region,value:await readRegion(region,null)});
   const seen=new Set(),data=[];for(const {region,value} of responses)for(const f of value.data){if(f.lat<south||f.lat>north||f.lng<west||f.lng>east||meters(region,f)>region.radius||seen.has(f.id))continue;seen.add(f.id);data.push(f);}
   const retrievalTimes=responses.map(x=>x.value.at).filter(Number.isFinite);
   const sources=[...new Map(responses.map(x=>[x.value.sourceUrl||'https://www.openstreetmap.org/copyright',{label:x.value.source,sourceUrl:x.value.sourceUrl||'https://www.openstreetmap.org/copyright',license:x.value.license,licenseUrl:x.value.licenseUrl||'https://opendatacommons.org/licenses/odbl/1-0/',sourceUpdatedAt:x.value.sourceUpdatedAt||null}])).values()];
   return {status:'insufficient',data:data.slice(0,80),at:now(),retrievedAt:retrievalTimes.length?Math.max(...retrievalTimes):null,osmTimestamp:responses.map(x=>x.value.osmTimestamp).filter(Boolean).sort().at(-1)||null,region:[...new Set(responses.map(x=>x.value.region))].join('、'),partial:true,coverageComplete:false,cached:index.cached&&responses.every(x=>x.value.cached),offline:index.offline||responses.some(x=>x.value.offline),old:responses.some(x=>x.value.old),sources,samples:regions.length,omittedSamples:intersecting.length>regions.length,...(sources.length===1?{source:sources[0].label,sourceUrl:sources[0].sourceUrl,license:sources[0].license,licenseUrl:sources[0].licenseUrl,sourceUpdatedAt:sources[0].sourceUpdatedAt}:{})};
  }finally{busy=false;}
 }};
}
export function createFacilityProvider({location=globalThis.location,storage,fetcher=fetch,now=Date.now}={}){
 if(deliveryMode(location)==='static')return createStaticClient({storage,fetcher,now});
 let client;return {mode:'local-trial',requiresLock:true,async get(p){client??=import('./safe-map-data.mjs').then(m=>m.createFacilityClient({storage,fetcher,now,trial:true}));return (await client).get(p);}};
}
