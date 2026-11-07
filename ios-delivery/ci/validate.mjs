import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
function parseOpenStep(text){
 const tokens=text.match(/"(?:\\.|[^"\\])*"|\/\*[\s\S]*?\*\/|\/\/[^\n]*|[{}()=;,]|[^\s{}()=;,]+/g).filter(v=>!v.startsWith('//')&&!v.startsWith('/*'));let at=0;
 function take(){assert(at<tokens.length,'Unexpected end');return tokens[at++]}function expect(t){assert.equal(take(),t)}
 function value(){const t=take();if(t==='{'){const out={};while(tokens[at]!=='}'){const key=value();expect('=');assert(!Object.hasOwn(out,key));out[key]=value();expect(';')}expect('}');return out}if(t==='('){const out=[];while(tokens[at]!==')'){out.push(value());if(tokens[at]!==')')expect(',')}expect(')');return out}return t.startsWith('"')?JSON.parse(t):t}
 const out=value();assert.equal(at,tokens.length);return out;
}
function files(p){return fs.readdirSync(p,{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(path.join(p,d.name)):[path.join(p,d.name)])}
function check(app){
 const identity=JSON.parse(fs.readFileSync(root+'/'+app+'/IDENTITY.json'));const ios=root+'/'+app+'/iOS',project=ios+'/'+identity.scheme+'.xcodeproj';
 const text=fs.readFileSync(project+'/project.pbxproj','utf8'),pbx=parseOpenStep(text),objects=pbx.objects;assert.equal(objects[pbx.rootObject].isa,'PBXProject');let references=0;const sources=[];
 for(const [key,obj]of Object.entries(objects)){
  assert(/^[A-F0-9]{24}$/.test(key));if(obj.isa==='PBXFileReference'&&obj.sourceTree==='SOURCE_ROOT'){const p=path.resolve(ios,obj.path);assert(p.startsWith(path.resolve(ios)+path.sep));assert(fs.existsSync(p),'Missing resource: '+obj.path);references++;if(obj.lastKnownFileType==='sourcecode.swift')sources.push(path.basename(p))}
  for(const k of ['fileRef','productReference','buildConfigurationList','mainGroup','productRefGroup'])if(obj[k])assert(objects[obj[k]],'Dangling reference: '+k);
  for(const k of ['children','files','buildPhases','buildConfigurations','targets'])for(const ref of obj[k]||[])assert(objects[ref],'Dangling reference: '+k);
 }
 assert.deepEqual(sources.sort(),fs.readdirSync(ios+'/Sources').filter(n=>n.endsWith('.swift')).sort());
 const scheme=fs.readFileSync(project+'/xcshareddata/xcschemes/'+identity.scheme+'.xcscheme','utf8');for(const ref of scheme.matchAll(/BlueprintIdentifier="([A-F0-9]{24})"/g))assert.equal(objects[ref[1]].isa,'PBXNativeTarget');
 const plist=fs.readFileSync(ios+'/Sources/Info.plist','utf8');assert(new RegExp('<key>CFBundleDisplayName</key>\\s*<string>S\\.u\\.G '+app+'</string>').test(plist));
 const assets=ios+'/Assets.xcassets/AppIcon.appiconset',catalog=JSON.parse(fs.readFileSync(assets+'/Contents.json')),png=fs.readFileSync(assets+'/'+catalog.images[0].filename);assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1024);assert.equal(png[24],8);assert.equal(png[25],2);
 for(const p of files(ios)){
  assert(!/\.(p8|p12|pfx|key|mobileprovision)$/i.test(p),'Credential file');assert(!path.basename(p).startsWith('.env'));
  if(/\.(swift|js|mjs|cjs|json|html|plist)$/.test(p))assert(!/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|sk-(?:proj-)?[A-Za-z0-9_-]{48,}/.test(fs.readFileSync(p,'utf8')),'Possible secret material');
 }
 if(app==='WAY')assert(fs.readFileSync(ios+'/Sources/WAYSourceMissing.swift','utf8').includes('#error("WAY_SOURCE_MISSING'));
 else {assert(/<key>NSAllowsLocalNetworking<\/key>\s*<true\s*\/>/.test(plist));const server=fs.readFileSync(ios+'/Sources/BundleHTTPServer.swift','utf8');assert(server.includes('params.requiredLocalEndpoint = .hostPort(host: "127.0.0.1"'));assert(server.includes('real_api_transport_disabled'));assert(server.includes("connect-src 'self' blob:"));}
 return {app,projectReferencesExist:references,swiftSources:sources.length,opaque1024Icon:true,credentialPatternScan:'NO_MATCH (not a comprehensive security audit)',swiftBuild:'NOT_RUN',iphone:'NOT_TESTED',WAYSourceMissing:app==='WAY'};
}
const index=process.argv.indexOf('--app'),apps=index<0?['BODY','eVo','WALK','WAY']:[process.argv[index+1]];assert(apps.every(v=>['BODY','eVo','WALK','WAY'].includes(v)));
console.log(JSON.stringify({scope:'Static paths, OpenStep structure, scheme references, icon header and source guards; not a Swift build',results:apps.map(check)},null,2));
