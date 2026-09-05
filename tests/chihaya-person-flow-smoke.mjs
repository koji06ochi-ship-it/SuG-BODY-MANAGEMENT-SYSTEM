import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';

const require=createRequire(import.meta.url);
const persons=JSON.parse(readFileSync(new URL('../assets/quest/chihaya-persons-20260905.json',import.meta.url),'utf8')).persons;
const flowSource=readFileSync(new URL('../assets/quest/person-card-flow-20260905.js',import.meta.url),'utf8');
const gpsCore=require('../assets/quest/person-gps-core-20260905.js');

class FakeElement{
  constructor(){this.textContent='';this.innerHTML='';this.className='';this.disabled=false;this.dataset={};this.classList={add(){},remove(){}}}
  querySelector(){return null}
}

function makeRuntime(storage){
  const nodes=new Map();
  const listeners=new Map();
  const node=id=>{if(!nodes.has(id))nodes.set(id,new FakeElement());return nodes.get(id)};
  node('steps').textContent='1,000';
  const localStorage={
    getItem(key){return storage.has(key)?storage.get(key):null},
    setItem(key,value){storage.set(key,String(value))}
  };
  const document={getElementById:node,querySelectorAll(){return []}};
  const context={
    console,document,localStorage,navigator:{},KANAN_PERSONS:persons,
    SUGQuestGps:gpsCore,__SUG_NATIVE_HEALTH__:{steps:1000},
    MutationObserver:class{observe(){}},
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},
    addEventListener(type,handler){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(handler)},
    dispatchEvent(event){for(const handler of listeners.get(event.type)||[])handler(event)},
    setTimeout(handler){handler();return 1},
    activateArea(){},go(screen){context.currentScreen=screen}
  };
  context.window=context;
  vm.runInNewContext(flowSource,context,{filename:'person-card-flow-20260905.js'});
  context.activateArea('千早赤阪村');
  return {context,nodes,node};
}

const masashige=persons[0];
const gpsAtBirth=gpsCore.evaluatePosition(34.4639008,135.625164,masashige.gpsPoints,[]);
assert.equal(gpsAtBirth.matched.point.id,'chihaya-kusunoki-birthplace');
const gpsOutside=gpsCore.evaluatePosition(34.6937,135.5023,masashige.gpsPoints,[]);
assert.equal(gpsOutside.matched,null);

const storage=new Map();
const first=makeRuntime(storage);
first.context.openPerson(masashige.id);
first.context.startPersonWalk();
assert.equal(first.context.SUGQuest.updateRegionalPresence({area:'chihaya',inside:true}),true);
first.context.dispatchEvent(new first.context.CustomEvent('sug:native-health',{detail:{steps:7000,regionalSteps:{chihaya:6000}}}));
for(const [spotId,spotName] of [['chihaya-kusunoki-birthplace','楠公誕生地'],['chihaya-shimo-akasaka-access','下赤阪の棚田・下赤阪城跡入口']]){
  assert.equal(first.context.SUGQuest.recordGpsCheck({area:'chihaya',personId:masashige.id,spotId,spotName,distanceMeters:30,verified:true}),true);
}
first.context.answerPersonWhy({disabled:false,dataset:{correct:'true'},classList:{add(){},remove(){}}});
assert.equal(first.node('pdGetBtn').disabled,false);
first.context.getPersonCard();
assert.equal(first.context.SUGQuest.getPersonProgress().persons['chihaya:'+masashige.id].got,true);
first.context.openNextPerson();
assert.equal(first.node('pdName').textContent,'楠木正行');
assert.equal(first.node('pdWalkBtn').disabled,false);

const reloaded=makeRuntime(storage);
reloaded.context.openPerson(masashige.id);
assert.equal(reloaded.node('pdGetBtn').textContent,'CARD GET済み');
reloaded.context.openPerson(persons[1].id);
assert.equal(reloaded.node('pdWalkBtn').disabled,false);

console.log('PASS chihaya flow: WALK + 2 GPS + WHY -> GET -> 楠木正行 unlock -> reload persistence');
