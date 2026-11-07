export const TEST_MODE = typeof location !== 'undefined' && new URLSearchParams(location.search).get('test') === '1';
export const PREFIX = TEST_MODE ? 'sug_walk_local_test_v1:' : 'sug_walk_local_v1:';
export const SPOTS = Object.freeze([
  {id:'OSAKA_CHAKAI_CARD_003', name:'大阪茶会', title:'CAFE 大阪茶会', address:'大阪府大阪市北区天神橋2丁目1-25 1F', lat:34.696423, lng:135.511810, art:'01_osaka_chakai_card_art.jpg'},
  {id:'RYO_CARD_001', name:'焼肉ホルモン瞭 天満店', title:'焼肉ホルモン 瞭', address:'大阪府大阪市北区天神橋4丁目8-23', lat:34.704868, lng:135.511353, art:'02_yakiniku_ryo_card_art.jpg'},
  {id:'HACHIKENYA_WATANABE_CARD_001', name:'八軒家浜・渡辺津', title:'八軒家浜・渡辺津', address:'大阪市中央区天満橋京町・八軒家浜船着場周辺', lat:34.6906210, lng:135.5160938, art:'04_hachikenya_watanabe_card_art.jpg'}
]);
export function distance(a,b) {
  const r=Math.PI/180, dlat=(b.lat-a.lat)*r, dlng=(b.lng-a.lng)*r;
  const h=Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlng/2)**2;
  return 6371000*2*Math.asin(Math.sqrt(Math.min(1,h)));
}
export function validFix(p,now=Date.now()) {
  return p && Number.isFinite(p.lat) && Math.abs(p.lat)<=90 && Number.isFinite(p.lng) && Math.abs(p.lng)<=180 && Number.isFinite(p.accuracy) && p.accuracy>=0 && p.accuracy<=50 && Number.isFinite(p.t) && now-p.t>=-5000 && now-p.t<=20000;
}
export function arrived(p,spot,now=Date.now()) {
  return validFix(p,now) && distance(p,spot)+p.accuracy<=100;
}
export function segment(a,b) {
  if(!a||!b)return 0;
  const seconds=(b.t-a.t)/1000, meters=distance(a,b);
  // Do not bridge suspended sessions, stale timestamps, GPS jumps or stationary jitter.
  return seconds>0 && seconds<=30 && meters>=Math.max(4,(a.accuracy+b.accuracy)/2) && meters/seconds<=3 ? meters : 0;
}
export function claim(storage,spot,fix,now=Date.now()) {
  if(!SPOTS.some(s=>s.id===spot.id)||!arrived(fix,spot,now))return 'not-arrived';
  const key=PREFIX+'card:'+spot.id;
  if(storage.getItem(key)!==null)return 'owned';
  // One stable key per card: a repeated tap/tab cannot create a second copy.
  const value=JSON.stringify({id:spot.id,acquiredAt:new Date(now).toISOString(),source:'gps-proximity'});
  storage.setItem(key,value);
  if(storage.getItem(key)!==value)throw new Error('保存結果を確認できません');
  return 'saved';
}
export function routeURL(spot,fix,now=Date.now()) {
  const q=new URLSearchParams({api:'1',destination:`${spot.lat},${spot.lng}`,travelmode:'walking'});
  if(validFix(fix,now))q.set('origin',`${fix.lat},${fix.lng}`);
  return 'https://www.google.com/maps/dir/?'+q;
}

const MAP_TRAVEL_MODES = new Set(['walking','bicycling','transit']);
export function mapsSearchURL(query) {
  const destination=String(query||'').trim();
  if(!destination||destination.length>200)throw new Error('目的地を入力してください（200文字以内）');
  return 'https://www.google.com/maps/search/?'+new URLSearchParams({api:'1',query:destination});
}
export function mapsRouteURL(destination,mode='walking',fix=null,now=Date.now()) {
  const query=String(destination||'').trim();
  if(!query||query.length>200)throw new Error('目的地を入力してください（200文字以内）');
  if(!MAP_TRAVEL_MODES.has(mode))throw new Error('経路モードを確認してください');
  const params=new URLSearchParams({api:'1',destination:query,travelmode:mode});
  if(validFix(fix,now))params.set('origin',`${fix.lat},${fix.lng}`);
  return 'https://www.google.com/maps/dir/?'+params;
}

// Keep an uncredited anchor separately from the latest sample. Short steps
// accumulate until they exceed the accuracy/jitter threshold; gaps use sample time.
export function createDistanceTracker() {
  let anchor=null, previous=null;
  const reset=()=>{anchor=null;previous=null;};
  return {reset, push(next,now=Date.now()) {
    if(!validFix(next,now)){reset();return 0;}
    if(previous && next.t<=previous.t)return 0;
    if(!previous){anchor=previous=next;return 0;}
    const dt=(next.t-previous.t)/1000;
    if(dt>30 || distance(previous,next)/dt>3){anchor=previous=next;return 0;}
    previous=next;
    const meters=distance(anchor,next);
    if(meters+1e-7<Math.max(4,(anchor.accuracy+next.accuracy)/2))return 0;
    anchor=next;
    return meters;
  }};
}
