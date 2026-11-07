(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SUGQuestGps=api;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  function distanceMeters(lat1,lng1,lat2,lng2){
    const radius=6371000;
    const phi1=Number(lat1)*Math.PI/180,phi2=Number(lat2)*Math.PI/180;
    const deltaPhi=(Number(lat2)-Number(lat1))*Math.PI/180;
    const deltaLambda=(Number(lng2)-Number(lng1))*Math.PI/180;
    const a=Math.sin(deltaPhi/2)**2+Math.cos(phi1)*Math.cos(phi2)*Math.sin(deltaLambda/2)**2;
    return 2*radius*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }
  function evaluatePosition(lat,lng,points,checkedIds){
    const checked=new Set((checkedIds||[]).map(String));
    const candidates=(points||[]).filter(point=>!checked.has(String(point.id||point.name))).map(point=>({
      point:point,
      distanceMeters:distanceMeters(lat,lng,+point.lat,+point.lng)
    })).sort((a,b)=>a.distanceMeters-b.distanceMeters);
    const nearest=candidates[0]||null;
    const matched=candidates.find(item=>item.distanceMeters<=Number(item.point.radiusMeters||100))||null;
    return {matched:matched,nearest:nearest};
  }
  return {distanceMeters:distanceMeters,evaluatePosition:evaluatePosition};
});
