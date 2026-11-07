export const ENDPOINT='https://overpass-api.de/api/interpreter';
export const CATEGORIES=['SAFE','MEDICAL','PUBLIC','MOVE'];
const KEY='sug_safe_map_trial_v1',TTL=86400000;
export function category(t={}){
 if(['defibrillator','shelter','assembly_point'].includes(t.emergency)||t.amenity==='shelter'||t.social_facility==='shelter'||['police','fire_station'].includes(t.amenity))return 'SAFE';
 if(t.amenity==='hospital')return 'MEDICAL';
 if(['toilets','townhall','community_centre','drinking_water','water_point'].includes(t.amenity)||t.emergency==='drinking_water'||t.drinking_water==='yes'||t.leisure==='park')return 'PUBLIC';
 if(['station','halt'].includes(t.railway)||t.highway==='bus_stop')return 'MOVE';
 return null;
}
export function centerKey(p){if(!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||Math.abs(p.lat)>85||Math.abs(p.lng)>180)throw Error('地図の中心を確認してください');return [p.lat.toFixed(3),p.lng.toFixed(3)].join(',');}
export function queryFor(key){if(!/^-?\d+\.\d{3},-?\d+\.\d{3}$/.test(key))throw Error('不正な座標');const a='(around:600,'+key+')';return '[out:json][timeout:15][maxsize:16777216];('+['nwr[amenity~"^(police|fire_station|hospital|toilets|townhall|community_centre|drinking_water|water_point|shelter)$"]','nwr[emergency~"^(defibrillator|shelter|assembly_point|drinking_water)$"]','nwr[social_facility=shelter]','nwr[drinking_water=yes]','nwr[leisure=park]','nwr[railway~"^(station|halt)$"]','nwr[highway=bus_stop]'].map(s=>s+a+';').join('')+');out center 80;';}
export function parseFacilities(json){
 if(json?.remark)throw Error('施設検索が完了しませんでした。時間をおいて再試行してください');
 if(!Array.isArray(json?.elements))throw Error('施設データの形式を確認できません');
 const seen=new Set(),out=[];
 for(const e of json.elements.slice(0,80)){const t=e.tags||{},c=category(t),lat=e.lat??e.center?.lat,lng=e.lon??e.center?.lon;
  if(!c||!['node','way','relation'].includes(e.type)||!Number.isSafeInteger(e.id)||e.id<=0||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)continue;
  const id=e.type+'/'+e.id;if(seen.has(id))continue;seen.add(id);
  out.push({id,lat,lng,category:c,name:String(t.name||t['name:ja']||'名称未登録').slice(0,200),address:String(t['addr:full']||['addr:province','addr:city','addr:suburb','addr:street','addr:housenumber'].map(k=>t[k]).filter(Boolean).join(' ')).slice(0,300),kind:String(t.emergency||t.social_facility||t.amenity||t.drinking_water||t.leisure||t.railway||t.highway),source:'https://www.openstreetmap.org/'+id});
 }return out;
}
export function createFacilityClient({storage,fetcher=fetch,now=Date.now,trial=false}){
 let busy=false;
 function read(){try{const raw=storage.getItem(KEY);if(!raw)return {cache:{},next:0,day:'',count:0};const s=JSON.parse(raw);if(!s.cache||typeof s.cache!=='object'||!Number.isFinite(s.next)||!Number.isFinite(s.count))throw Error();return s;}catch{throw Error('施設検索の保存状態を確認できません。取得を停止しています');}}
 function write(s){try{storage.setItem(KEY,JSON.stringify(s));}catch{throw Error('取得制限を保存できないため施設検索を停止しています');}}
 async function get(p){
  if(busy)throw Error('施設検索中です');const key=centerKey(p),time=now(),s=read(),cached=s.cache[key];
  if(cached&&time>=cached.at&&time-cached.at<TTL)return {...cached,cached:true};
  if(!trial)throw Error('施設の外部取得はローカル試験限定です。一般公開は未対応です');
  if(time<s.next)throw Error('再取得は '+new Date(s.next).toLocaleTimeString('ja-JP')+' 以降にお試しください');
  const day=new Date(time).toISOString().slice(0,10);if(s.day!==day){s.day=day;s.count=0;}if(s.count>=20)throw Error('本日の試験取得上限20回に達しました');
  s.count++;s.next=time+60000;write(s);busy=true;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
   const r=await fetcher(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({data:queryFor(key)}),signal:controller.signal,credentials:'omit'});
   if(r.status===429){const retry=r.headers.get('Retry-After');const wait=/^\d+$/.test(retry||'')?Number(retry)*1000:Date.parse(retry)-now();s.next=now()+Math.max(300000,Number.isFinite(wait)?wait:0);write(s);throw Error('施設配信が混雑しています。最低5分待機します。自動再試行はしません');}
   if(!r.ok)throw Error('施設データを取得できません（HTTP '+r.status+'）');
   const json=await r.json(),value={at:now(),center:key,data:parseFacilities(json),osmTimestamp:json.osm3s?.timestamp_osm_base||null};
   s.cache[key]=value;const keys=Object.keys(s.cache).sort((a,b)=>s.cache[b].at-s.cache[a].at);s.cache=Object.fromEntries(keys.slice(0,8).map(k=>[k,s.cache[k]]));write(s);return {...value,cached:false};
  }catch(e){if(e.name==='AbortError')throw Error('施設検索がタイムアウトしました。WALK記録は継続できます');throw e;}finally{clearTimeout(timer);busy=false;}
 }
 return {get};
}
