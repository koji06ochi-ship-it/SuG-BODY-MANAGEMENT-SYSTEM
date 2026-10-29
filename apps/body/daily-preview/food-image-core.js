(function(root){'use strict';
async function prepare(file,options={}){
 if(!(file instanceof Blob)||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('JPEG/PNG/WebPの写真を選択してください');
 if(file.size>12_000_000)throw Error('元の写真は12MB以下にしてください');
 const maxDimension=Math.max(640,Math.min(2048,Number(options.maxDimension)||1280));
 let bitmap;
 try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'})}
 catch(_){bitmap=await new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('写真を読み込めません'))};img.src=url})}
 const scale=Math.min(1,maxDimension/Math.max(bitmap.width,bitmap.height)),width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const context=canvas.getContext('2d',{alpha:false});if(!context)throw Error('写真を処理できません');
 context.fillStyle='#fff';context.fillRect(0,0,width,height);context.drawImage(bitmap,0,0,width,height);if(typeof bitmap.close==='function')bitmap.close();
 const dataUrl=canvas.toDataURL('image/jpeg',Math.max(.55,Math.min(.9,Number(options.quality)||.78)));
 if(dataUrl.length>8_000_000)throw Error('送信用写真を8MB未満にできません');
 return{dataUrl,width,height,mimeType:'image/jpeg',metadataRemoved:true};
}
root.BodyFoodImage={prepare};if(typeof module!=='undefined')module.exports=root.BodyFoodImage;
})(typeof globalThis!=='undefined'?globalThis:this);
