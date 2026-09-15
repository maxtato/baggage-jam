const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
const byId = new Map();
class Element {
  constructor(tag='div', classes='') {
    this.tagName=tag.toUpperCase(); this.children=[]; this.events={}; this.attributes={}; this.style={}; this.dataset={}; this.textContent=''; this.isConnected=true;
    const values=new Set(classes.split(' ').filter(Boolean));
    this.classList={add:(...x)=>x.forEach(y=>values.add(y)),remove:(...x)=>x.forEach(y=>values.delete(y)),contains:x=>values.has(x),toggle:(x,force)=>{const on=force===undefined?!values.has(x):force;on?values.add(x):values.delete(x);return on;}};
  }
  addEventListener(type,cb){(this.events[type]??=[]).push(cb);}
  setAttribute(k,v){this.attributes[k]=v;}
  getAttribute(k){return this.attributes[k];}
  appendChild(el){this.children.push(el);return el;}
  focus(){document.activeElement=this;}
  querySelector(selector){return selector==='button'?byId.get('play'):null;}
  querySelectorAll(){return [];}
  getClientRects(){return [{}];}
  getBoundingClientRect(){return {left:0,top:0,width:460,height:819};}
  setPointerCapture(id){this.capturedPointer=id;}
  hasPointerCapture(id){return this.capturedPointer===id;}
  releasePointerCapture(id){if(this.capturedPointer===id)this.capturedPointer=null;}
  closest(selector){return selector==='button'&&this.tagName==='BUTTON'?this:null;}
  getContext(){return canvasContext;}
  set innerHTML(v){this.children=[];}
}
const gradient=()=>({addColorStop(){}});
const canvasContext=new Proxy({createLinearGradient:gradient,createRadialGradient:gradient}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
for(const match of html.matchAll(/<([a-z]+)\b([^>]*?)\bid="([^"]+)"([^>]*)>/g)) {
  const attrs=match[2]+match[4], c=attrs.match(/class="([^"]*)"/);
  byId.set(match[3],new Element(match[1],c?.[1]||''));
}
const document = {hidden:false,activeElement:null,documentElement:new Element('html'),events:{},createElement:tag=>new Element(tag),getElementById:id=>byId.get(id),querySelector:()=>new Element('img'),addEventListener(type,cb){(this.events[type]??=[]).push(cb);}};
const saved=new Map([['excedent_best','45'],['baggage_jam_preferences','{"sound":false,"motion":true,"haptics":false}']]);
let now=1000;
class FakeImage extends Element {constructor(){super('img');this.complete=false;this.width=100;this.naturalWidth=100;} }
const context={console,document,Image:FakeImage,localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},navigator:{},performance:{now:()=>now},setTimeout:()=>1,clearTimeout(){},requestAnimationFrame(){},requestIdleCallback(){},innerWidth:390,innerHeight:844,devicePixelRatio:2,events:{},addEventListener(type,cb){(this.events[type]??=[]).push(cb);},matchMedia:()=>({matches:false,addEventListener(){}})};
context.window=context;
vm.createContext(context);
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
scripts.forEach((m,i)=>{
  let code=m[1];
  if(i===scripts.length-1) code=code.replace('  /* ---------- init ---------- */', '  window.test = {handlerPose,heldBagLayout,getClock:()=>handlerClock,setNext:level=>{nextLevel=level;},setHeld:(level,x)=>{curLevel=level;currentX=x;handlerArrival=handlerClock-1;},bagW,bagH,topSurfaceY,bagRenderMatrix,startGame,pauseGame,resumeGame,homeMenu,openHelp,closeHelp,makeBag,processMerges,loseLife,frame,drop,Engine,engine,allBags,impactFX,bagPose,bagMatrix,stackShadows,drawBag,isFalling,updateFX,bakeImage,IMG,BAKED,BAG_SHADOWS,Body,get:()=>({state,score,best,livesLeft,curLevel,mergeCount,maxCombo,highestLevel,runAvailable,isDown,parts:parts.length,rings:rings.length,impacts:impacts.map(x=>({...x})),shakeT}), setPrefs:(v)=>{preferences={...preferences,...v};syncPreferences();}, queue:(a,b)=>mergeQueue.push([a,b])};\n  /* ---------- init ---------- */');
  vm.runInContext(code,context,{filename:`inline-${i}.js`});
});
const t=context.test;
const step=(frames=1)=>{for(let i=0;i<frames;i++){now+=16.666;t.frame(now);}};
const spriteCenter=bag=>{
 const matrix=t.bagRenderMatrix(bag.lvl,bag.position.x,bag.position.y,t.bagPose(bag.angle,1,null,now,null),true);
 return {x:matrix.e,y:matrix.f};
};
const close=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-8,message);

// The exact image position seen in the hand must become the physical drop position.
for(let level=1;level<=10;level++){
 for(const x of [t.bagW(level)/2,230,460-t.bagW(level)/2]){
  t.startGame();t.setHeld(level,x);
  const held=t.heldBagLayout(level),hand=t.handlerPose();
  assert.equal(hand.open,0);assert.ok(hand.rootX>=185&&hand.rootX<=309);
  close(hand.x,held.gripX,'hand follows the sprite grip');
  close(hand.y,held.gripY,'hand stays on the grip');
  t.drop();const bag=t.allBags()[0],center=spriteCenter(bag);
  close(center.x,held.x,'no horizontal snap on release');
  close(center.y,held.y,'no vertical snap on release');
  assert.equal(bag.lvl,level);
  t.drop();assert.equal(t.allBags().length,1,'second press during cooldown cannot duplicate a bag');
 }
}
console.log('PASS: all ten bags remain attached to their grips and release without a position jump at center and both edges.');

// A full sweep unfolds a constant-length arm, without a jump at the center.
t.setPrefs({motion:false});
for(let level=1;level<=10;level++){
 t.startGame();
 let previous=null;
 for(let i=0;i<=100;i++){
  const half=t.bagW(level)/2,x=half+(460-2*half)*i/100;
  t.setHeld(level,x);const pose=t.handlerPose();
  close(Math.hypot(pose.elbowX-pose.rootX,pose.elbowY-pose.rootY,pose.elbowZ),106,'upper arm does not stretch');
  close(Math.hypot(pose.elbowX-pose.x,pose.elbowY-pose.y,pose.elbowZ),86,'shorter forearm does not stretch');
  assert.ok(pose.rootY>=106&&pose.rootY<140,'shoulder stays high inside the new doorway');
  if(previous)assert.ok(Math.hypot(pose.elbowX-previous.elbowX,pose.elbowY-previous.elbowY)<12,'elbow does not flip when crossing the center');
  previous=pose;
  if(i>=55){
   const dx=pose.x-pose.rootX,dy=pose.y-pose.rootY;
   close((pose.elbowX-pose.rootX)*dy-(pose.elbowY-pose.rootY)*dx,0,'right reach keeps shoulder, elbow and wrist aligned');
  }
  if(i===50){
   assert.ok((pose.elbowY-pose.rootY)/(pose.y-pose.rootY)>.58,'elbow sits lower on the neutral arm');
  }
  if(i===100)close(pose.y,pose.rootY,'full right reach is horizontal from the shoulder');
  if(level<=6&&(i===0||i===100)){
   const slope=Math.abs((pose.y-pose.elbowY)/(pose.x-pose.elbowX));
   assert.ok(slope<Math.tan(Math.PI/6),'forearm is within 30 degrees of horizontal at both limits');
   assert.ok(pose.y<150,'outer reach lifts the hand clear of the doorway');
  }
 }
}
t.setPrefs({motion:true});
console.log('PASS: shorter fixed-length arm, lower elbow, smooth reach and straight horizontal extension from the shoulder on the right.');

// Retraction must not turn the elbow beyond the wrist after the hand opens.
for(const x of [30,230,430]){
 t.startGame();t.setHeld(1,x);t.drop();
 for(let i=0;i<23;i++){
  const pose=t.handlerPose();
  if(pose){
   const dx=pose.x-pose.rootX,dy=pose.y-pose.rootY;
   const along=((pose.elbowX-pose.rootX)*dx+(pose.elbowY-pose.rootY)*dy)/(dx*dx+dy*dy);
   assert.ok(along>0&&along<1,'elbow never folds beyond the wrist during release');
  }
  step();
 }
}
console.log('PASS: opening and withdrawal do not reverse the elbow.');

t.startGame();assert.equal(t.get().curLevel,4,'playtest starts with the green duffel');
// A quick release during the arrival animation must use the same visible position.
const arriving=t.heldBagLayout(4);t.drop();
close(spriteCenter(t.allBags()[0]).y,arriving.y,'arrival animation does not shift the drop');
step(2);const opening=t.handlerPose();
assert.ok(opening.open>0&&opening.open<1,'fingers open over successive frames');
step(4);assert.equal(t.handlerPose().open,1);
const beforePause=t.handlerPose(),clock=t.getClock();t.pauseGame();step(120);
assert.equal(t.getClock(),clock,'pause freezes the hand animation clock');
t.resumeGame();assert.deepEqual(t.handlerPose(),beforePause,'resume preserves the release pose');
step(7);const retracting=t.handlerPose();
assert.ok(retracting.y<beforePause.y&&retracting.alpha<1,'released hand withdraws into the hold');
step(11);assert.equal(t.handlerPose(),null,'the hand clears before the next luggage arrives');
step(8);assert.ok(t.get().curLevel>0);assert.equal(t.handlerPose().open,0);
console.log('PASS: entry, opening fingers, paused release, retraction, and automatic next bag.');

const emit=(target,type,event={})=>(target.events[type]||[]).forEach(fn=>fn(event));
const pointer=(id,x)=>({pointerId:id,pointerType:'touch',isPrimary:true,button:0,clientX:x,
 target:byId.get('game'),cancelable:true,preventDefault(){}});
t.startGame();step(15);
const initial=t.handlerPose();emit(byId.get('stage'),'pointerdown',pointer(5,120));
close(t.handlerPose().x,initial.x,'touching away from the bag does not snap the hand');
emit(context,'pointermove',pointer(5,195));
close(t.handlerPose().x,initial.x+75,'the hand follows the finger delta');
const release=t.heldBagLayout(4);emit(context,'pointerup',pointer(5,195));
assert.equal(t.allBags().length,1);close(spriteCenter(t.allBags()[0]).x,release.x,'touch release uses the final aim');
t.startGame();emit(byId.get('stage'),'pointerdown',pointer(6,230));
emit(context,'pointercancel',pointer(6,230));emit(context,'pointerup',pointer(6,230));
assert.equal(t.allBags().length,0);assert.equal(t.handlerPose().open,0);
console.log('PASS: touch aiming, release, cancellation and no extra bag.');

// A wider next bag must fit on screen before it is shown or dropped.
for(const side of [-1,1]){
 t.startGame();t.setHeld(1,side<0?t.bagW(1)/2:460-t.bagW(1)/2);t.setNext(6);
 t.drop();step(30);assert.equal(t.get().curLevel,6);
 const held=t.heldBagLayout(6);
 assert.ok(held.x>=t.bagW(6)/2&&held.x<=460-t.bagW(6)/2,'wider next bag stays fully on screen');
 t.drop();const bag=t.allBags().find(b=>b.lvl===6);
 close(spriteCenter(bag).x,held.x,'wider next bag does not jump sideways when released');
}
console.log('PASS: a wider next bag remains visible and releases without a jump at either screen edge.');


t.setPrefs({motion:false});t.startGame();
const still=t.handlerPose();assert.equal(still.alpha,1);step(15);
assert.deepEqual(t.handlerPose(),still,'reduced motion keeps a steady hand');
t.drop();assert.equal(t.allBags().length,1);assert.equal(t.handlerPose(),null);
step(30);assert.ok(t.get().curLevel>0);assert.equal(t.handlerPose().alpha,1);
console.log('PASS: reduced-motion play retains immediate drops and a steady grip.');
