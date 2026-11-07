/* TOP only: original provided images, edge-white matte removed for display.
   No image generation, asset writes, credentials or network API. */
(()=>{'use strict';
if(!document.body.classList.contains('v13-top'))return;
const audit={ready:false,assets:{},failures:[],externalAPIEnabled:false};window.__EVOLINK_TOP__=audit;
async function displayOriginal(img){
 const name=img.dataset.originalMatte,source=img.getAttribute('src');
 try{
  await img.decode();const w=img.naturalWidth,h=img.naturalHeight,n=w*h;if(n>3000000)throw Error('asset_dimensions_exceed_display_limit');
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.className=img.className;canvas.id=img.id;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',img.alt);canvas.dataset.originalSource=source;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
  const pixels=ctx.getImageData(0,0,w,h),p=pixels.data,visited=new Uint8Array(n),queue=new Uint32Array(n);let head=0,tail=0;
  const enqueue=i=>{if(visited[i])return;visited[i]=1;const k=i*4;if(p[k]>=232&&p[k+1]>=232&&p[k+2]>=232&&Math.max(p[k],p[k+1],p[k+2])-Math.min(p[k],p[k+1],p[k+2])<15)queue[tail++]=i;};
  for(let x=0;x<w;x++){enqueue(x);enqueue((h-1)*w+x);}for(let y=0;y<h;y++){enqueue(y*w);enqueue(y*w+w-1);}
  while(head<tail){const i=queue[head++],x=i%w;p[i*4+3]=0;if(x>0)enqueue(i-1);if(x<w-1)enqueue(i+1);if(i>=w)enqueue(i-w);if(i<n-w)enqueue(i+w);}
  // Original RGB pixels remain unchanged; only connected outer matte alpha changes.
  ctx.putImageData(pixels,0,0);img.replaceWith(canvas);audit.assets[name]={source,width:w,height:h,edgeMattePixels:tail,originalRGBUnchanged:true,ready:true};
 }catch{audit.failures.push(name);audit.assets[name]={source,ready:false};}
}
async function displayLandscape(){
 try{
  const img=new Image();img.src='/assets/EVOLINK_TOP_REFERENCE.jpg';await img.decode();
  const canvas=document.createElement('canvas');canvas.width=780;canvas.height=500;canvas.className='top-mountain';canvas.setAttribute('aria-hidden','true');const ctx=canvas.getContext('2d');
  const sky=ctx.createLinearGradient(0,0,0,500);sky.addColorStop(0,'#001c16');sky.addColorStop(.45,'#093b42');sky.addColorStop(.72,'#4a7270');sky.addColorStop(1,'#001c13');ctx.fillStyle=sky;ctx.fillRect(0,0,780,500);
  const sx=img.naturalWidth/714,sy=img.naturalHeight/1280;
  // Only clean scenery at x=0..325, y=425..615. The generated logo,
  // character, motto and all pictured controls are outside these source bounds.
  ctx.drawImage(img,0,425*sy,325*sx,190*sy,0,270,430,228);
  const extension=document.createElement('canvas');extension.width=450;extension.height=228;const ec=extension.getContext('2d');ec.drawImage(img,0,425*sy,150*sx,190*sy,0,0,450,228);ec.globalCompositeOperation='destination-in';const seam=ec.createLinearGradient(0,0,100,0);seam.addColorStop(0,'#0000');seam.addColorStop(1,'#000');ec.fillStyle=seam;ec.fillRect(0,0,450,228);ctx.drawImage(extension,330,270);
  const blend=ctx.createLinearGradient(0,260,0,310);blend.addColorStop(0,'#093b42');blend.addColorStop(1,'#093b4200');ctx.fillStyle=blend;ctx.fillRect(0,260,780,50);
  const floor=ctx.createLinearGradient(0,430,0,500);floor.addColorStop(0,'#001c1300');floor.addColorStop(1,'#001c13');ctx.fillStyle=floor;ctx.fillRect(0,430,780,70);
  document.querySelector('.top-mountain').replaceWith(canvas);audit.landscape={ready:true,source:img.getAttribute('src'),sourceRegionAt714x1280:[0,425,325,190],referenceLogoOrCharacterUsed:false,wholeReferenceUsedAsPage:false};
 }catch{audit.failures.push('landscape');audit.landscape={ready:false};}
}
(async()=>{await displayLandscape();for(const img of document.querySelectorAll('[data-original-matte]'))await displayOriginal(img);audit.ready=audit.failures.length===0&&Object.keys(audit.assets).length===2;document.documentElement.dataset.topAssets=audit.ready?'ready':'failed';})();
})();
