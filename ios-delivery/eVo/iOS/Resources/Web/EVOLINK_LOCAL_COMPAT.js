/* Local JSON checksums and UUIDs on offline HTTP LAN. No secure-context or permission changes. */
(()=>{'use strict';
 const c=globalThis.crypto;if(!c)return;
 const shaFallback=typeof c.subtle?.digest!=='function',uuidFallback=typeof c.randomUUID!=='function';
 const K=new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
 const rr=(x,n)=>(x>>>n)|(x<<(32-n));
 async function digest(algorithm,input){
  if(String(typeof algorithm==='string'?algorithm:algorithm?.name).toUpperCase()!=='SHA-256')throw new DOMException('Only local SHA-256 checksums are supported.','NotSupportedError');
  const bytes=ArrayBuffer.isView(input)?new Uint8Array(input.buffer,input.byteOffset,input.byteLength):input instanceof ArrayBuffer?new Uint8Array(input):null;if(!bytes)throw new TypeError('Expected an ArrayBuffer or typed view.');
  const size=Math.ceil((bytes.length+9)/64)*64,padded=new Uint8Array(size);padded.set(bytes);padded[bytes.length]=0x80;const view=new DataView(padded.buffer),bits=bytes.length*8;view.setUint32(size-8,Math.floor(bits/0x100000000));view.setUint32(size-4,bits>>>0);
  const h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]),w=new Uint32Array(64);
  for(let offset=0;offset<size;offset+=64){for(let i=0;i<16;i++)w[i]=view.getUint32(offset+i*4);for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2];w[i]=(w[i-16]+(rr(x,7)^rr(x,18)^(x>>>3))+w[i-7]+(rr(y,17)^rr(y,19)^(y>>>10)))>>>0;}
   let [a,b,d,e,f,g,j,k]=h;for(let i=0;i<64;i++){const t1=(k+(rr(f,6)^rr(f,11)^rr(f,25))+((f&g)^(~f&j))+K[i]+w[i])>>>0,t2=((rr(a,2)^rr(a,13)^rr(a,22))+((a&b)^(a&d)^(b&d)))>>>0;k=j;j=g;g=f;f=(e+t1)>>>0;e=d;d=b;b=a;a=(t1+t2)>>>0;}const values=[a,b,d,e,f,g,j,k];for(let i=0;i<8;i++)h[i]=(h[i]+values[i])>>>0;
  }const result=new ArrayBuffer(32),out=new DataView(result);for(let i=0;i<8;i++)out.setUint32(i*4,h[i]);return result;
 }
 if(shaFallback)Object.defineProperty(c,'subtle',{value:Object.freeze({digest}),configurable:true});
 if(uuidFallback&&typeof c.getRandomValues==='function')Object.defineProperty(c,'randomUUID',{configurable:true,value(){const b=c.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);}});
 window.EVOLINK_LOCAL_COMPAT=Object.freeze({version:1,sha256Fallback:shaFallback,uuidFallback,secureContext:globalThis.isSecureContext===true});
})();
