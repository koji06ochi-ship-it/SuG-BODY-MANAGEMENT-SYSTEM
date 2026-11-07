import { FilesetResolver, PoseLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs";

let poseLandmarker=null;
let poseInitPromise=null;

function status(text, cls=""){
  ["romModelStatus","shrModelStatus"].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.textContent=text;el.className="romStatus "+cls;}
  });
}
async function ensurePose(){
  if(poseLandmarker)return poseLandmarker;
  if(poseInitPromise)return poseInitPromise;
  poseInitPromise=(async()=>{
    status("Poseモデル：読み込み中...");
    try{
      const vision=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
      try{
        poseLandmarker=await PoseLandmarker.createFromOptions(vision,{
          baseOptions:{
            modelAssetPath:"https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate:"GPU"
          },
          runningMode:"IMAGE",
          numPoses:1,
          minPoseDetectionConfidence:.5,
          minPosePresenceConfidence:.5,
          minTrackingConfidence:.5
        });
      }catch(gpuErr){
        poseLandmarker=await PoseLandmarker.createFromOptions(vision,{
          baseOptions:{
            modelAssetPath:"https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
          },
          runningMode:"IMAGE",
          numPoses:1,
          minPoseDetectionConfidence:.5,
          minPosePresenceConfidence:.5,
          minTrackingConfidence:.5
        });
      }
      status("Poseモデル：準備OK","ok");
      return poseLandmarker;
    }catch(e){
      status("Poseモデル：読込失敗","bad");
      poseInitPromise=null;
      throw e;
    }
  })();
  return poseInitPromise;
}

const LEFT={shoulder:11,hip:23,knee:25,ankle:27,heel:29,foot:31};
const RIGHT={shoulder:12,hip:24,knee:26,ankle:28,heel:30,foot:32};

function vis(lm,idx){return Number(lm[idx]?.visibility??1)}
function sideScore(lm,s){return [s.shoulder,s.hip,s.knee,s.ankle,s.foot].reduce((a,i)=>a+vis(lm,i),0)/5}
function pt(lm,idx,w,h){return {x:lm[idx].x*w,y:lm[idx].y*h,v:vis(lm,idx)}}
function angle3(a,b,c){
  const v1={x:a.x-b.x,y:a.y-b.y},v2={x:c.x-b.x,y:c.y-b.y};
  const dot=v1.x*v2.x+v1.y*v2.y,m1=Math.hypot(v1.x,v1.y),m2=Math.hypot(v2.x,v2.y);
  if(!m1||!m2)return null;
  return Math.acos(Math.max(-1,Math.min(1,dot/(m1*m2))))*180/Math.PI;
}
function trunkAngle(sh,hip){return Math.atan2(Math.abs(sh.x-hip.x),Math.abs(sh.y-hip.y))*180/Math.PI}
function depthInfo(hip,knee,h){
  const d=(hip.y-knee.y)/h;
  if(d>=.015)return {label:"ランドマーク上は平行以下",delta:d};
  if(d>=-.02)return {label:"ほぼ平行",delta:d};
  return {label:"平行より浅め",delta:d};
}
function drawLine(ctx,a,b,color="#d6b75a",width=5){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
function drawDot(ctx,p,color="#fff"){ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#111";ctx.lineWidth=2;ctx.stroke()}
function drawLabel(ctx,text,x,y){
  ctx.font="700 22px system-ui";const pad=8,w=ctx.measureText(text).width+pad*2;
  ctx.fillStyle="rgba(0,0,0,.78)";ctx.fillRect(x-4,y-25,w,31);
  ctx.fillStyle="#f1d77c";ctx.fillText(text,x+pad-4,y-2);
}


const SHR_IDX={
  left:{shoulder:11,elbow:13,wrist:15,hip:23},
  right:{shoulder:12,elbow:14,wrist:16,hip:24}
};
const shrAutoState={
  start:{img:null,url:null,lm:null,taps:[],arm:null,scapAngle:null,confidence:null},
  end:{img:null,url:null,lm:null,taps:[],arm:null,scapAngle:null,confidence:null}
};

function shrCanvas(which){return document.getElementById(which==="start"?"shrCanvasStart":"shrCanvasEnd")}
function shrReadout(which){return document.getElementById(which==="start"?"shrStartReadout":"shrEndReadout")}
function shrSideKey(){return document.getElementById("shrSide")?.value==="left"?"left":"right"}

function fitCanvasToImage(canvas,img){
  const maxW=900,maxH=1100;
  let w=img.naturalWidth,h=img.naturalHeight;
  const s=Math.min(1,maxW/w,maxH/h);
  canvas.width=Math.max(1,Math.round(w*s));
  canvas.height=Math.max(1,Math.round(h*s));
}

function shrMid(a,b){return{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
function shrNorm(v){
  const m=Math.hypot(v.x,v.y)||1;
  return{x:v.x/m,y:v.y/m}
}
function shrDot(a,b){return a.x*b.x+a.y*b.y}
function shrAngleBetween(a,b){
  const na=shrNorm(a),nb=shrNorm(b);
  return Math.acos(Math.max(-1,Math.min(1,shrDot(na,nb))))*180/Math.PI;
}
function shrPointFromLm(lm,idx,canvas){
  return{x:lm[idx].x*canvas.width,y:lm[idx].y*canvas.height,v:Number(lm[idx]?.visibility??1)}
}
function shrBodyBasis(lm,canvas){
  const ls=shrPointFromLm(lm,11,canvas),rs=shrPointFromLm(lm,12,canvas),
        lh=shrPointFromLm(lm,23,canvas),rh=shrPointFromLm(lm,24,canvas);
  const sh=shrMid(ls,rs),hip=shrMid(lh,rh);
  const down=shrNorm({x:hip.x-sh.x,y:hip.y-sh.y});
  const right=shrNorm({x:down.y,y:-down.x});
  const up={x:-down.x,y:-down.y};
  return{sh,hip,down,right,up};
}
function shrArmElevation(lm,canvas,side){
  const s=SHR_IDX[side];
  const shoulder=shrPointFromLm(lm,s.shoulder,canvas),
        elbow=shrPointFromLm(lm,s.elbow,canvas),
        hip=shrPointFromLm(lm,s.hip,canvas);
  const arm={x:elbow.x-shoulder.x,y:elbow.y-shoulder.y};
  const trunk={x:hip.x-shoulder.x,y:hip.y-shoulder.y};
  const angle=shrAngleBetween(arm,trunk);
  const confidence=Math.min(shoulder.v,elbow.v,hip.v);
  return{angle,confidence,shoulder,elbow,hip};
}
function shrScapPoints(which){
  const st=shrAutoState[which],canvas=shrCanvas(which);
  if(!st.lm||st.taps.length<2)return null;
  const basis=shrBodyBasis(st.lm,canvas);
  // Rear-view photo: identify medial root vs lateral acromion by distance from body midline.
  const lateralDistance=q=>Math.abs(shrDot({x:q.x-basis.sh.x,y:q.y-basis.sh.y},basis.right));
  const [a,b]=st.taps;
  const root=lateralDistance(a)<=lateralDistance(b)?a:b;
  const acromion=root===a?b:a;
  return {root,acromion,basis};
}
function shrScapAngle(which){
  const pts=shrScapPoints(which);
  if(!pts)return null;
  const {root,acromion,basis}=pts;
  // Choose outward direction from the body midline toward the acromion.
  const sideSign=shrDot({x:acromion.x-basis.sh.x,y:acromion.y-basis.sh.y},basis.right)>=0?1:-1;
  const outward={x:basis.right.x*sideSign,y:basis.right.y*sideSign};
  const line=shrNorm({x:acromion.x-root.x,y:acromion.y-root.y});
  const x=shrDot(line,outward),y=shrDot(line,basis.up);
  return Math.atan2(y,x)*180/Math.PI;
}
function shrDraw(which){
  const st=shrAutoState[which],canvas=shrCanvas(which);
  if(!canvas)return;
  const ctx=canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(st.img)ctx.drawImage(st.img,0,0,canvas.width,canvas.height);

  if(st.lm){
    const side=shrSideKey(),s=SHR_IDX[side];
    const shoulder=shrPointFromLm(st.lm,s.shoulder,canvas),
          elbow=shrPointFromLm(st.lm,s.elbow,canvas),
          wrist=shrPointFromLm(st.lm,s.wrist,canvas),
          hip=shrPointFromLm(st.lm,s.hip,canvas);
    drawLine(ctx,shoulder,elbow,"#d6b75a",5);
    drawLine(ctx,elbow,wrist,"#d6b75a",4);
    drawLine(ctx,shoulder,hip,"#8f8f98",3);
    [shoulder,elbow,wrist,hip].forEach(q=>drawDot(ctx,q,"#fff"));
    if(st.arm!=null)drawLabel(ctx,`腕 ${Math.round(st.arm)}°`,shoulder.x+12,shoulder.y-10);
  }

  if(st.taps.length){
    if(st.taps.length===1){
      const q=st.taps[0];
      ctx.fillStyle="#ffd86b";
      ctx.beginPath();ctx.arc(q.x,q.y,9,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#111";ctx.lineWidth=2;ctx.stroke();
      drawLabel(ctx,"1点目",q.x+10,q.y-8);
    }else{
      const pts=shrScapPoints(which);
      const root=pts.root,acromion=pts.acromion;
      [[root,"根元","#ffd86b"],[acromion,"肩峰","#79d6ff"]].forEach(([q,label,color])=>{
        ctx.fillStyle=color;
        ctx.beginPath();ctx.arc(q.x,q.y,9,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle="#111";ctx.lineWidth=2;ctx.stroke();
        drawLabel(ctx,label,q.x+10,q.y-8);
      });
      drawLine(ctx,root,acromion,"#ffcf55",5);
      const a=shrScapAngle(which);
      if(a!=null)drawLabel(ctx,`肩甲骨 ${a.toFixed(1)}°`,acromion.x+10,acromion.y+22);
    }
  }
}
function shrUpdateUI(){
  const start=shrAutoState.start,end=shrAutoState.end;
  const aStart=shrScapAngle("start"),aEnd=shrScapAngle("end");

  const armExcursion=(start.arm!=null&&end.arm!=null)?Math.max(0,end.arm-start.arm):null;
  const armEl=document.getElementById("shrArm");
  const ssEl=document.getElementById("shrScapStart");
  const seEl=document.getElementById("shrScapEnd");
  if(armEl)armEl.value=armExcursion==null?"":armExcursion.toFixed(2);
  if(ssEl)ssEl.value=aStart==null?"":aStart.toFixed(2);
  if(seEl)seEl.value=aEnd==null?"":aEnd.toFixed(2);

  const armOut=document.getElementById("shrArmAuto"),
        ssOut=document.getElementById("shrScapStartAuto"),
        seOut=document.getElementById("shrScapEndAuto");
  if(armOut)armOut.textContent=armExcursion==null?"--":`${armExcursion.toFixed(1)}°`;
  if(ssOut)ssOut.textContent=aStart==null?"--":`${aStart.toFixed(1)}°`;
  if(seOut)seOut.textContent=aEnd==null?"--":`${aEnd.toFixed(1)}°`;

  const sr=shrReadout("start"),er=shrReadout("end");
  if(sr){
    if(!start.img)sr.textContent="写真を選択してください。";
    else if(!start.lm)sr.innerHTML="写真OK｜<b>自動解析待ち</b>";
    else sr.innerHTML=`START検出角 ${start.arm?.toFixed(1)??"--"}°｜信頼度 ${Math.round((start.confidence||0)*100)}%｜タップ ${start.taps.length}/2`;
  }
  if(er){
    if(!end.img)er.textContent="写真を選択してください。";
    else if(!end.lm)er.innerHTML="写真OK｜<b>自動解析待ち</b>";
    else er.innerHTML=`UP検出角 <b>${end.arm?.toFixed(1)??"--"}°</b>｜信頼度 ${Math.round((end.confidence||0)*100)}%｜タップ ${end.taps.length}/2`;
  }

  const guide=document.getElementById("shrTapGuide");
  if(guide){
    if(!start.lm||!end.lm)guide.innerHTML="<b>次：</b> START・UPの写真を選び「写真から腕角度を自動検出」。";
    else if(start.taps.length<2)guide.innerHTML="<b>START写真：</b> 肩甲棘の根元 ＋ 肩峰の後外側 の順にタップ。";
    else if(end.taps.length<2)guide.innerHTML="<b>UP写真：</b> 肩甲棘の根元 ＋ 肩峰の後外側 の順にタップ。";
    else{
      const excursion=(aStart!=null&&aEnd!=null)?aEnd-aStart:null;
      const armMove=(start.arm!=null&&end.arm!=null)?Math.max(0,end.arm-start.arm):null;
      guide.innerHTML=`<b>完了：</b> 腕 ${start.arm?.toFixed(1)??"--"}° → ${end.arm?.toFixed(1)??"--"}°${armMove!=null?`｜挙上量 ${armMove.toFixed(1)}°`:""}<br>肩甲骨 ${aStart?.toFixed(1)??"--"}° → ${aEnd?.toFixed(1)??"--"}°${excursion!=null?`｜上方回旋量 ${excursion.toFixed(1)}°`:""}。下の「肩甲上腕リズムを判定」を押してください。`;
    }
  }
}
function shrCanvasPoint(evt,canvas){
  const r=canvas.getBoundingClientRect();
  const clientX=evt.touches?.[0]?.clientX??evt.clientX;
  const clientY=evt.touches?.[0]?.clientY??evt.clientY;
  return{x:(clientX-r.left)*(canvas.width/r.width),y:(clientY-r.top)*(canvas.height/r.height)}
}
function shrTap(which,evt){
  const st=shrAutoState[which],canvas=shrCanvas(which);
  if(!st.lm)return alert("先に写真の自動解析をしてください");
  if(st.taps.length>=2)return;
  const q=shrCanvasPoint(evt,canvas);
  st.taps.push(q);
  st.scapAngle=shrScapAngle(which);
  shrDraw(which);shrUpdateUI();
}
["start","end"].forEach(which=>{
  const c=shrCanvas(which);
  if(c)c.addEventListener("click",e=>shrTap(which,e));
});

window.loadShrPhoto=function(which,input){
  const file=input?.files?.[0];if(!file)return;
  const st=shrAutoState[which];
  if(st.url)URL.revokeObjectURL(st.url);
  st.url=URL.createObjectURL(file);
  st.lm=null;st.taps=[];st.arm=null;st.scapAngle=null;st.confidence=null;
  const img=new Image();
  img.onload=()=>{
    st.img=img;
    const canvas=shrCanvas(which);fitCanvasToImage(canvas,img);
    shrDraw(which);shrUpdateUI();
  };
  img.src=st.url;
};

window.analyzeShrPhotos=async function(){
  const start=shrAutoState.start,end=shrAutoState.end;
  if(!start.img||!end.img)return alert("STARTとUPの2枚の写真を選択してください");
  const btn=document.getElementById("shrAutoBtn");
  if(btn){btn.disabled=true;btn.textContent="自動解析中...";}
  try{
    const model=await ensurePose();
    const side=shrSideKey();
    for(const which of ["start","end"]){
      const st=shrAutoState[which],canvas=shrCanvas(which);
      const res=model.detect(st.img),lm=res?.landmarks?.[0];
      if(!lm)throw new Error(`${which==="start"?"START":"UP"}写真で人物姿勢を検出できません`);
      const arm=shrArmElevation(lm,canvas,side);
      if(arm.confidence<.35)throw new Error(`${which==="start"?"START":"UP"}写真の肩・肘・股関節の検出信頼度が低いです`);
      st.lm=lm;st.arm=arm.angle;st.confidence=arm.confidence;st.taps=[];st.scapAngle=null;
      shrDraw(which);
    }
    shrUpdateUI();
    if(start.arm>20){
      const g=document.getElementById("shrTapGuide");
      if(g)g.innerHTML=`<b>確認：</b> START写真の腕角が ${start.arm.toFixed(1)}° あります。STARTはできるだけ腕を体側に下ろした写真にしてください。ROM解析はSTART→UPの差分で挙上量を補正します。<br>そのまま測る場合はSTART写真を2点タップしてください。`;
    }
  }catch(e){
    alert("SHR写真解析：" + (e?.message||e));
  }finally{
    if(btn){btn.disabled=false;btn.textContent="写真から腕角度を自動検出";}
  }
};

window.resetShrTaps=function(){
  ["start","end"].forEach(which=>{
    shrAutoState[which].taps=[];shrAutoState[which].scapAngle=null;shrDraw(which);
  });
  shrUpdateUI();
};
window.resetShrAutoTap=function(){
  ["start","end"].forEach(which=>{
    const st=shrAutoState[which];
    st.lm=null;st.taps=[];st.arm=null;st.scapAngle=null;st.confidence=null;
    shrDraw(which);
  });
  ["shrArm","shrScapStart","shrScapEnd"].forEach(id=>{const e=document.getElementById(id);if(e)e.value=""});
  shrUpdateUI();
};


const moveState={img:null,url:null,lm:null};

function moveCanvas(){
  return document.getElementById("moveCanvas");
}
function movePt(lm,idx,canvas){
  return {x:lm[idx].x*canvas.width,y:lm[idx].y*canvas.height,v:Number(lm[idx]?.visibility??1)};
}
function moveMid(a,b){return{x:(a.x+b.x)/2,y:(a.y+b.y)/2,v:Math.min(a.v??1,b.v??1)}}
function moveLineAngleToHorizontal(a,b){
  let ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
  ang=((ang+90)%180+180)%180-90;
  return Math.abs(ang);
}
function moveLineAngleToVertical(a,b){
  const dx=b.x-a.x,dy=b.y-a.y;
  return Math.atan2(Math.abs(dx),Math.abs(dy)||1e-9)*180/Math.PI;
}
function movePointLineDistance(p,a,b){
  const vx=b.x-a.x,vy=b.y-a.y,wx=p.x-a.x,wy=p.y-a.y;
  const den=Math.hypot(vx,vy)||1;
  return Math.abs(vx*wy-vy*wx)/den;
}
function moveFlag(value,good,warn){
  if(value<=good)return {label:"偏位小",level:"good"};
  if(value<=warn)return {label:"軽度確認",level:"warn"};
  return {label:"要確認",level:"bad"};
}
function drawMoveSkeleton(ctx,lm,canvas){
  const pairs=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[27,31],[24,26],[26,28],[28,32]];
  pairs.forEach(([a,b])=>{
    const pa=movePt(lm,a,canvas),pb=movePt(lm,b,canvas);
    if(Math.min(pa.v,pb.v)>=.3)drawLine(ctx,pa,pb,"#d6b75a",3);
  });
}
function movementConfidence(lm,idxs){
  return Math.min(...idxs.map(i=>Number(lm[i]?.visibility??0)));
}

window.renderMoveGuide=window.renderMoveGuide||function(){};

window.loadMovementPhoto=function(input){
  const file=input?.files?.[0];if(!file)return;
  if(moveState.url)URL.revokeObjectURL(moveState.url);
  moveState.url=URL.createObjectURL(file);moveState.lm=null;
  const img=new Image();
  img.onload=()=>{
    moveState.img=img;
    const canvas=moveCanvas();
    fitCanvasToImage(canvas,img);
    const ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
  };
  img.src=moveState.url;
};

window.analyzeMovementScreen=async function(){
  const img=moveState.img,canvas=moveCanvas(),btn=document.getElementById("moveAnalyzeBtn");
  if(!img?.naturalWidth)return alert("先に写真を選択してください");
  const type=document.getElementById("moveType")?.value||"sls_front";
  const side=document.getElementById("moveSide")?.value||"right";
  const pain=Math.max(0,Math.min(10,Number(document.getElementById("movePain")?.value||0)));
  if(btn){btn.disabled=true;btn.textContent="解析中...";}
  try{
    const model=await ensurePose();
    const res=model.detect(img),lm=res?.landmarks?.[0];
    if(!lm)throw new Error("人物姿勢を検出できません。身体全体が見える写真で再撮影してください。");
    moveState.lm=lm;

    const ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    drawMoveSkeleton(ctx,lm,canvas);

    const s=side==="right"?{sh:12,el:14,wr:16,hip:24,knee:26,ank:28,foot:32}:{sh:11,el:13,wr:15,hip:23,knee:25,ank:27,foot:31};
    let metrics={},summary="",interpretation="",jbjScore=0,metricCards=[],confidence=0;

    if(type==="sls_front"){
      const ids=[11,12,23,24,s.hip,s.knee,s.ank]; confidence=movementConfidence(lm,ids);
      const hip=movePt(lm,s.hip,canvas),knee=movePt(lm,s.knee,canvas),ank=movePt(lm,s.ank,canvas);
      const lh=movePt(lm,23,canvas),rh=movePt(lm,24,canvas),ls=movePt(lm,11,canvas),rs=movePt(lm,12,canvas);
      const midH=moveMid(lh,rh),midS=moveMid(ls,rs);
      const kneeInner=angle3(hip,knee,ank),kneeFlex=180-kneeInner;
      const dev=movePointLineDistance(knee,hip,ank)/(Math.hypot(hip.x-ank.x,hip.y-ank.y)||1)*100;
      const pelvicTilt=moveLineAngleToHorizontal(lh,rh);
      const trunkLean=moveLineAngleToVertical(midH,midS);
      const df=moveFlag(dev,5,10),pf=moveFlag(pelvicTilt,5,10),tf=moveFlag(trunkLean,5,10);
      if(kneeFlex<45){jbjScore=20;interpretation="しゃがみが浅め、または評価側が支持脚ではない可能性があります。前額面評価の比較精度は低め。『評価側＝床についている支持脚』を確認し、同じ深さで再比較推奨。";}
      else{
        const max=Math.max(dev/10,pelvicTilt/10,trunkLean/10);
        jbjScore=max>1?50:max>.5?25:5;
        interpretation="膝・骨盤・体幹の前額面偏位を2Dで数値化。原因筋や障害を断定せず、股関節/足関節ROMと左右比較。";
      }
      metrics={kneeFlex,kneeDeviationPct:dev,pelvicTilt,trunkLean};
      summary=`膝屈曲 ${kneeFlex.toFixed(0)}°｜膝偏位 ${dev.toFixed(1)}%｜骨盤 ${pelvicTilt.toFixed(1)}°｜体幹 ${trunkLean.toFixed(1)}°`;
      metricCards=[
        ["膝屈曲",`${kneeFlex.toFixed(0)}°`,kneeFlex>=40?"比較可能":"浅め","info"],
        ["前額面膝偏位",`${dev.toFixed(1)}%`,df.label,df.level],
        ["骨盤ライン傾斜",`${pelvicTilt.toFixed(1)}°`,`${pf.label}｜水平=0°`,pf.level],
        ["体幹側屈",`${trunkLean.toFixed(1)}°`,tf.label,tf.level]
      ];
      [hip,knee,ank].forEach(q=>drawDot(ctx,q));
      drawLabel(ctx,`膝 ${kneeFlex.toFixed(0)}°`,knee.x+12,knee.y-8);
    }

    else if(type==="lunge_side"){
      const ids=[s.sh,s.hip,s.knee,s.ank,s.foot];confidence=movementConfidence(lm,ids);
      const sh=movePt(lm,s.sh,canvas),hip=movePt(lm,s.hip,canvas),knee=movePt(lm,s.knee,canvas),ank=movePt(lm,s.ank,canvas),foot=movePt(lm,s.foot,canvas);
      const kneeFlex=180-angle3(hip,knee,ank),hipFlex=180-angle3(sh,hip,knee);
      const trunkLean=trunkAngle(sh,hip),shinLean=moveLineAngleToVertical(ank,knee);
      metrics={kneeFlex,hipFlex,trunkLean,shinLean};
      jbjScore=pain>=4?50:5;
      summary=`膝 ${kneeFlex.toFixed(0)}°｜股 ${hipFlex.toFixed(0)}°｜下腿 ${shinLean.toFixed(0)}°｜体幹 ${trunkLean.toFixed(0)}°`;
      interpretation="ランジでは下腿が前傾すること自体をエラー扱いしません。深さ・体幹・股/膝角度を同条件で比較します。";
      metricCards=[
        ["膝屈曲",`${kneeFlex.toFixed(0)}°`,"深さの比較値","info"],
        ["股関節屈曲",`${hipFlex.toFixed(0)}°`,"前脚側","info"],
        ["下腿前傾",`${shinLean.toFixed(0)}°`,"垂直からの角度","info"],
        ["体幹前傾",`${trunkLean.toFixed(0)}°`,"垂直からの角度","info"]
      ];
      [sh,hip,knee,ank,foot].forEach(q=>drawDot(ctx,q));
    }

    else if(type==="hinge_side"){
      const ids=[s.sh,s.hip,s.knee,s.ank];confidence=movementConfidence(lm,ids);
      const sh=movePt(lm,s.sh,canvas),hip=movePt(lm,s.hip,canvas),knee=movePt(lm,s.knee,canvas),ank=movePt(lm,s.ank,canvas);
      const kneeFlex=180-angle3(hip,knee,ank),hipFlex=180-angle3(sh,hip,knee);
      const trunkLean=trunkAngle(sh,hip),shinLean=moveLineAngleToVertical(ank,knee);
      let pattern="ミックス";
      if(hipFlex>=55&&kneeFlex<=45)pattern="ヒンジ優位傾向";
      else if(kneeFlex>=60)pattern="スクワット要素大きめ";
      metrics={kneeFlex,hipFlex,trunkLean,shinLean,pattern};
      jbjScore=pain>=4?50:5;
      summary=`${pattern}｜股 ${hipFlex.toFixed(0)}°｜膝 ${kneeFlex.toFixed(0)}°｜体幹 ${trunkLean.toFixed(0)}°`;
      interpretation="ヒップヒンジは股関節屈曲を主体にした動作。『腰が丸い』など脊柱分節は通常Poseだけでは直接判定しない。";
      metricCards=[
        ["動作パターン",pattern,"S.u.G比較用","info"],
        ["股関節屈曲",`${hipFlex.toFixed(0)}°`,"ヒンジ量","info"],
        ["膝屈曲",`${kneeFlex.toFixed(0)}°`,"膝の参加量","info"],
        ["体幹前傾",`${trunkLean.toFixed(0)}°`,"垂直からの角度","info"],
        ["下腿傾斜",`${shinLean.toFixed(0)}°`,"垂直からの角度","info"]
      ];
      [sh,hip,knee,ank].forEach(q=>drawDot(ctx,q));
    }

    else if(type==="overhead_front"){
      const ids=[11,12,13,14,23,24];confidence=movementConfidence(lm,ids);
      const ls=movePt(lm,11,canvas),rs=movePt(lm,12,canvas),le=movePt(lm,13,canvas),re=movePt(lm,14,canvas),
            lh=movePt(lm,23,canvas),rh=movePt(lm,24,canvas);
      const midS=moveMid(ls,rs),midH=moveMid(lh,rh);
      const lArm=angle3(lh,ls,le),rArm=angle3(rh,rs,re); // trunk-down vs arm
      const asym=Math.abs(lArm-rArm);
      const shoulderTilt=moveLineAngleToHorizontal(ls,rs);
      const trunkLean=moveLineAngleToVertical(midH,midS);
      const af=moveFlag(asym,10,20),sf=moveFlag(shoulderTilt,5,10),tf=moveFlag(trunkLean,5,10);
      const avg=(lArm+rArm)/2;
      jbjScore=Math.max(asym>20?50:asym>10?25:5,shoulderTilt>10?25:5,trunkLean>10?25:5);
      metrics={leftArm:lArm,rightArm:rArm,armAsym:asym,shoulderTilt,trunkLean,avgArm:avg};
      summary=`左 ${lArm.toFixed(0)}°｜右 ${rArm.toFixed(0)}°｜左右差 ${asym.toFixed(1)}°｜体幹 ${trunkLean.toFixed(1)}°`;
      interpretation="両腕挙上の左右差と体幹/肩ラインの代償候補を比較。肩甲骨の真の3D運動はSHRタップ評価と胸椎ROMを併用。";
      metricCards=[
        ["左腕挙上",`${lArm.toFixed(0)}°`,avg>=150?"":"総挙上量も確認","info"],
        ["右腕挙上",`${rArm.toFixed(0)}°`,avg>=150?"":"総挙上量も確認","info"],
        ["左右差",`${asym.toFixed(1)}°`,af.label,af.level],
        ["肩ライン傾斜",`${shoulderTilt.toFixed(1)}°`,`${sf.label}｜水平=0°`,sf.level],
        ["体幹側屈",`${trunkLean.toFixed(1)}°`,tf.label,tf.level]
      ];
      [ls,rs,le,re,lh,rh].forEach(q=>drawDot(ctx,q));
    }

    if(confidence<.35)throw new Error("主要ランドマークの信頼度が低いです。撮影方向と全身の写り方を確認してください。");

    const memo=document.getElementById("moveMemo")?.value||"";
    currentMovementResult={
      date:document.getElementById("moveDate")?.value||today(),
      type,side,pain,confidence,metrics,summary,interpretation,jbjScore,memo
    };

    const result=document.getElementById("moveResult");
    result.innerHTML=`<div class="${pain>=4?"smartWarn":"notice"}"><b>${esc(moveLabel(type))}</b>｜ランドマーク信頼度 ${Math.round(confidence*100)}%${pain>=4?`<br>痛み ${pain}/10：症状を優先`:""}</div>
      <div class="moveScreenGrid">${metricCards.map(([t,v,n,l])=>`<div class="moveMetric"><span>${esc(t)}</span><b>${esc(v)}</b><small>${esc(n||"")}</small>${moveFlagHtml(n||"参考",l||"info")}</div>`).join("")}</div>
      <div class="aromPattern"><strong>S.u.G解釈</strong><br>${esc(interpretation)}<br><br><strong>次に見る</strong><br>左右同条件・前回差・AROM/PROM・CARE・Joint by Joint MAPと統合。</div>
      <div class="romLegend">※ 数値帯はS.u.Gの比較用ヒューリスティックであり、医学的な正常/異常カットオフではありません。特に前額面評価はカメラ位置に強く影響されます。</div>
      <button class="secondary" style="width:100%;margin-top:9px" onclick="saveMovementScreen()">この動作スクリーンを保存</button>`;
  }catch(e){
    console.error(e);alert("動作スクリーン："+(e?.message||e));
  }finally{
    if(btn){btn.disabled=false;btn.textContent="動作を自動解析";}
  }
};

window.analyzeSquatRom=async function(){
  const img=document.getElementById("romSourceImage");
  if(!img?.naturalWidth)return window.__SUG_ROM_ERROR__?.("先に側面画像を選択してください。");
  const btn=document.getElementById("romAnalyzeBtn");
  btn.disabled=true;btn.textContent="解析中...";
  try{
    const model=await ensurePose();
    const result=model.detect(img);
    const lm=result?.landmarks?.[0];
    if(!lm)throw new Error("人物の姿勢を検出できません。全身が見える側面画像で再撮影してください。");

    const canvas=document.getElementById("romCanvas");
    if(!canvas)throw new Error("画像キャンバスを準備できませんでした。");
    const ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);

    const lScore=sideScore(lm,LEFT),rScore=sideScore(lm,RIGHT);
    const s=lScore>=rScore?LEFT:RIGHT,sideLabel=lScore>=rScore?"左側ランドマーク":"右側ランドマーク";
    const sh=pt(lm,s.shoulder,canvas.width,canvas.height),hip=pt(lm,s.hip,canvas.width,canvas.height),
          knee=pt(lm,s.knee,canvas.width,canvas.height),ankle=pt(lm,s.ankle,canvas.width,canvas.height),
          foot=pt(lm,s.foot,canvas.width,canvas.height);

    const confidence=Math.min(sh.v,hip.v,knee.v,ankle.v,foot.v);
    if(confidence<.35)throw new Error("主要関節の検出信頼度が低いです。身体の側面全体が明るく見える画像で再撮影してください。");

    const kneeA=angle3(hip,knee,ankle),hipA=angle3(sh,hip,knee),ankleA=angle3(knee,ankle,foot),trunk=trunkAngle(sh,hip);
    const depth=depthInfo(hip,knee,canvas.height);

    // Reference left-right knee difference only when both sides are reasonably visible.
    let lrDiff=null;
    const minLR=Math.min(vis(lm,LEFT.hip),vis(lm,LEFT.knee),vis(lm,LEFT.ankle),vis(lm,RIGHT.hip),vis(lm,RIGHT.knee),vis(lm,RIGHT.ankle));
    if(minLR>=.55){
      const lk=angle3(pt(lm,LEFT.hip,canvas.width,canvas.height),pt(lm,LEFT.knee,canvas.width,canvas.height),pt(lm,LEFT.ankle,canvas.width,canvas.height));
      const rk=angle3(pt(lm,RIGHT.hip,canvas.width,canvas.height),pt(lm,RIGHT.knee,canvas.width,canvas.height),pt(lm,RIGHT.ankle,canvas.width,canvas.height));
      if(lk!=null&&rk!=null)lrDiff=Math.abs(lk-rk);
    }

    [ [sh,hip],[hip,knee],[knee,ankle],[ankle,foot] ].forEach(([a,b])=>drawLine(ctx,a,b));
    [sh,hip,knee,ankle,foot].forEach(p=>drawDot(ctx,p));
    drawLabel(ctx,`股 ${Math.round(hipA)}°`,hip.x+12,hip.y-8);
    drawLabel(ctx,`膝 ${Math.round(kneeA)}°`,knee.x+12,knee.y-8);
    drawLabel(ctx,`足 ${Math.round(ankleA)}°`,ankle.x+12,ankle.y-8);

    let advice="";
    if(depth.label==="平行より浅め")advice="今回のボトムはランドマーク基準で平行より浅め。重量を上げる前に、狙うROMを再現できるか確認。";
    else if(depth.label==="ほぼ平行")advice="ランドマーク基準ではほぼ平行。次回も同じカメラ位置で再現性を比較。";
    else advice="ランドマーク基準では平行以下まで到達。深さだけでなく、膝・股関節角度とフォーム再現性を継続比較。";
    if(lrDiff!=null&&lrDiff>=10)advice+=` 左右膝角差が約${lrDiff.toFixed(0)}°あるため、正面撮影でも左右差を確認候補。`;

    window.__SUG_ROM_RESULT__?.({
      exercise:"squat",sideLabel,visibility:confidence,kneeAngle:kneeA,hipAngle:hipA,
      ankleAngle:ankleA,trunkAngle:trunk,depthLabel:depth.label,depthDelta:depth.delta,
      lrKneeDiff:lrDiff,advice
    });
  }catch(e){
    console.error(e);window.__SUG_ROM_ERROR__?.(e?.message||String(e));
  }finally{
    btn.disabled=false;btn.textContent="スクワットROMを自動判定";
  }
};



window.dispatchEvent(new CustomEvent('sug:rom-care:analysis-ready', { detail: { version: '27.82' } }));
