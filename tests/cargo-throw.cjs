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
  getBoundingClientRect(){return this.rect||{left:0,top:0,width:460,height:819};}
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
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../assets/airport-traffic-v1.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../assets/cargo-throw-v1.js'),'utf8'),context);
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
scripts.forEach((m,i)=>{
  let code=m[1];
  if(i===scripts.length-1) code=code.replace('  /* ---------- init ---------- */', '  window.test = {scene,resize,render,getFloor:()=>FLOOR_Y,cartBodies,throwPose,updateThrow,dropY:SCENE_IMAGE_TOP+CargoThrow.DROP_Y*CARGO_SCALE,getFlight:()=>outgoingFlight,setNext:level=>{nextLevel=level;},setReady:(level,x)=>{curLevel=level;outgoingFlight=null;spawnTimer=0;const limits=aimLimits(level);currentX=Math.max(limits.min,Math.min(limits.max,x));},aim:x=>{const limits=aimLimits(curLevel);currentX=Math.max(limits.min,Math.min(limits.max,x));},bagW,bagH,topSurfaceY,bagRenderMatrix,startGame,pauseGame,resumeGame,homeMenu,openHelp,closeHelp,makeBag,processMerges,loseLife,frame,drop,Engine,engine,allBags,impactFX,bagPose,bagMatrix,stackShadows,drawBag,isFalling,updateFX,bakeImage,IMG,BAKED,BAG_SHADOWS,Body,get:()=>({state,score,best,livesLeft,curLevel,currentX,mergeCount,maxCombo,highestLevel,runAvailable,isDown,parts:parts.length,rings:rings.length,impacts:impacts.map(x=>({...x})),shakeT}),setPrefs:(v)=>{preferences={...preferences,...v};syncPreferences();},queue:(a,b)=>mergeQueue.push([a,b])};\n  /* ---------- init ---------- */');
  vm.runInContext(code,context,{filename:`inline-${i}.js`});
});
const t=context.test;
const step=(frames=1)=>{for(let i=0;i<frames;i++){now+=16.666;t.frame(now);}};
const spriteCenter=bag=>{
 const matrix=t.bagRenderMatrix(bag.lvl,bag.position.x,bag.position.y,t.bagPose(bag.angle,1,null,now,null),true);
 return {x:matrix.e,y:matrix.f};
};
const close=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-8,message);

// Aiming moves only the arrow; all launches originate inside the cargo hold.
assert.ok(!html.includes('/assets/handler/'),'no character artwork loaded by the game');
for(let level=1;level<=10;level++)for(const x of [30,230,430]){
 t.startGame();t.setReady(level,x);const aim=t.get().currentX;
 assert.equal(t.throwPose(),null);assert.equal(t.allBags().length,0,'aiming does not create a suitcase');
 t.drop();const origin=t.throwPose();close(origin.x,230,'common origin at the middle of the hold');
 assert.equal(origin.scale,.5);assert.equal(origin.alpha,0);assert.equal(t.allBags().length,0);
 t.drop();assert.equal(t.allBags().length,0,'repeated clicks cannot duplicate the airborne bag');
 const flight=t.getFlight();t.updateThrow(flight.duration*.5);const middle=t.throwPose();
 assert.ok(middle.alpha===1&&middle.scale>.5&&middle.shade<origin.shade,'bag emerges from shadow and depth');
 t.updateThrow(flight.duration);assert.equal(t.throwPose(),null);
 const bag=t.allBags()[0],center=spriteCenter(bag);
 assert.equal(bag.lvl,level);close(center.x,aim,'image center arrives exactly at the chosen arrow');
 close(center.y,t.dropY,'no vertical snap into physics');close(bag.velocity.x,0,'no sideways velocity after arrival');
 close(bag.angularVelocity,0,'no rotation after arrival');
 const start=center.x;step(10);close(spriteCenter(bag).x,start,'free fall is vertical before contact');
 step(50);assert.ok(t.get().curLevel>0,'next luggage becomes available');
}
console.log('PASS: all ten bags start inside the hold, emerge at full size and fall vertically at the arrow.');

// The last part of the arc must meet the vertical fall without a corner or an
// acceleration jump. Sample the motion, rather than asserting curve coefficients.
const Flight=context.CargoThrow,sourceScale=819*1.005/1536;
for(const targetX of [153,265,512,755,873]){
 const flight=Flight.launch(targetX,4),sample=time=>Flight.pose({...flight,elapsed:time}),h=1e-6;
 const end=sample(flight.duration),before=sample(flight.duration-h);
 assert.ok(sample(0).shade>=.97,'luggage begins deep in the cargo shadow');
 assert.ok(sample(flight.duration*.25).shade>.55,'shadow remains visible during emergence');
 assert.equal(sample(flight.duration*.6).shade,0,'bag reaches full daylight before free fall');
 assert.ok(sample(0).y<400,'throw starts higher inside the hold');
 assert.ok(end.y>=900,'vertical fall begins below the fuselage');
 assert.ok(Math.abs(end.x-targetX)<1e-8&&Math.abs(end.y-Flight.DROP_Y)<1e-8);
 assert.ok(Math.abs(before.vx)<.01&&end.vx===0,'sideways motion eases away before the handover');
 assert.ok(Math.abs((end.vx-before.vx)/h)<2,'sideways deceleration also reaches zero');
 assert.ok(Math.abs((end.vy-before.vy)/h-(flight.gravity-flight.drag*end.vy))<.05,'vertical acceleration matches gravity and drag');
 assert.ok(end.vy*sourceScale/60<15,'handover starts below the game speed limit');
 let previousVy=-Infinity,turnsBelowDoor=false,apexY=Infinity,visibleAscent=0;
 let previousPose=null,previousDistance=0;
 for(let i=0;i<=100;i++){
  const p=sample(flight.duration*i/100);
  assert.ok(p.x>=Math.min(512,targetX)-1e-8&&p.x<=Math.max(512,targetX)+1e-8,'arc never overshoots the arrow');
  assert.ok(p.vy>=previousVy-1e-8,'downward speed grows continuously throughout the extended arc');
  previousVy=p.vy;
  apexY=Math.min(apexY,p.y);
  if(p.vy<0&&p.alpha>=.9&&p.shade<.9)visibleAscent++;
  if(previousPose&&previousPose.vy>=0&&p.vy>=0){
   const distance=Math.hypot(p.x-previousPose.x,p.y-previousPose.y);
   assert.ok(distance>=previousDistance-1e-8,'equal time steps cover increasing distances throughout the downward turn');
   previousDistance=distance;
  }
  previousPose=p;
  if(p.y>740&&Math.abs(p.vx)>30)turnsBelowDoor=true;
 }
 assert.ok(apexY<Flight.ORIGIN.y-45&&apexY>Flight.ORIGIN.y-80,'the toss rises visibly before descending');
 assert.ok(visibleAscent>=6,'the upward part is visible before the bag starts falling');
 if(Math.abs(targetX-512)>200)assert.ok(turnsBelowDoor,'sideways travel continues below the old vertical transition');
}
// Exercise the actual frame loop: creating the physics body must not advance it
// through an extra tick on the same frame, or snap the sprite into fall stretch.
for(const x of [100,230,360]){
 t.startGame();t.setReady(4,x);t.drop();let before;
 while(t.getFlight()){before=t.throwPose();step();}
 const bag=t.allBags()[0],distance=spriteCenter(bag).y-before.y;
 const expected=before.vy*sourceScale/60;
 assert.ok(Math.abs(distance/expected-1)<.08,'rendered travel stays continuous across the real physics handover');
 const born=t.bagPose(0,1,null,bag._throwReleasedAt,bag);
 const after=t.bagPose(0,1,null,bag._throwReleasedAt+60,bag);
 assert.equal(born.normal,1,'no sudden sprite stretch at release');
 assert.ok(after.normal>1&&after.normal<1.11,'fall stretch blends in progressively');
 let previous=spriteCenter(bag),lastDistance=distance;
 for(let i=0;i<8;i++){
  step();const center=spriteCenter(bag),travel=Math.hypot(center.x-previous.x,center.y-previous.y);
  assert.ok(travel>=lastDistance*.99,'physics preserves momentum after the vertical handover');
  previous=center;lastDistance=travel;
 }
}
console.log('PASS: visible upward toss, no slowdown through the downward turn, continuous physics handover and gradual fall stretch.');

// Pause freezes the in-flight luggage without losing or duplicating it.
t.startGame();t.setReady(6,100);t.drop();step(10);const beforePause=t.throwPose();
t.pauseGame();step(90);assert.deepEqual(t.throwPose(),beforePause);t.resumeGame();step(40);assert.equal(t.allBags().length,1);
const emit=(target,type,event={})=>(target.events[type]||[]).forEach(fn=>fn(event));
const pointer=(id,x)=>({pointerId:id,pointerType:'touch',isPrimary:true,button:0,clientX:x,target:byId.get('game'),cancelable:true,preventDefault(){}});
for(const rect of [{left:0,width:320,height:568},{left:0,width:390,height:844},{left:0,width:1363,height:936}]){
 context.innerWidth=rect.width;context.innerHeight=rect.height;t.resize();byId.get('game').rect={...rect,top:0};
 t.startGame();const screenX=(worldX)=>(t.scene.x+worldX*t.scene.scale)/t.scene.width*rect.width;
 const initial=t.get().currentX;
 emit(byId.get('stage'),'pointerdown',pointer(5,screenX(150)));close(t.get().currentX,initial,'touch down preserves arrow position');
 emit(context,'pointermove',pointer(5,screenX(230)));close(t.get().currentX,initial+80,'arrow follows relative finger movement');
 assert.equal(t.throwPose(),null,'bag stays hidden until release');
 emit(context,'pointerup',pointer(5,screenX(230)));assert.ok(t.throwPose());
 assert.equal(t.allBags().length,0);step(50);assert.equal(t.allBags().length,1);close(spriteCenter(t.allBags()[0]).x,initial+80,'release locks the arrow position');
}
byId.get('game').rect=null;t.startGame();emit(byId.get('stage'),'pointerdown',pointer(6,230));
emit(context,'pointercancel',pointer(6,230));emit(context,'pointerup',pointer(6,230));step(60);
assert.equal(t.allBags().length,0);assert.equal(t.throwPose(),null);
console.log('PASS: pause, direct arrow aiming on three screen sizes, release and pointer cancellation.');

// Resizing moves the physical trolley and resting bags together, while the
// artwork reaches all four edges and the open hatch remains below the HUD.
t.startGame();
const floorBefore=t.getFloor(),resting=t.makeBag(1,230,floorBefore-20);
resting._landed=true;
const gapBefore=floorBefore-resting.position.y;
for(const [width,height] of [[320,568],[390,844],[430,932],[844,390],[1363,936]]){
 context.innerWidth=width;context.innerHeight=height;t.resize();
 assert.equal(byId.get('stage').style.width,width+'px');
 assert.equal(byId.get('stage').style.height,height+'px');
 assert.equal(byId.get('scenery').width,Math.round(width*2));
 assert.equal(byId.get('scenery').height,Math.round(height*2));
 close(t.getFloor()-resting.position.y,gapBefore,'resting bag stays on the same part of the trolley after resizing');
 close(t.cartBodies[2].position.y,t.getFloor()+30,'physical floor follows the artwork');
 const imageTop=t.scene.y+(819-819*1.005)*.55*t.scene.scale;
 close(imageTop,t.scene.header,'open hatch begins below the HUD');
 close(imageTop+(819*1.005*(1435+(1550-1402)*1024/993)/1536+t.scene.gap)*t.scene.scale,height,'illustration ends exactly at the screen bottom');
}
console.log('PASS: full-screen portrait and landscape layouts keep the floor, bags and HUD aligned.');

context.innerWidth=390;context.innerHeight=844;t.resize();t.startGame();
t.setReady(4,230);t.drop();step(150);
const landed=t.allBags()[0];
assert.ok(landed._landed,'a dropped bag reaches the repositioned trolley');
assert.ok(Math.abs(landed.bounds.max.y-t.getFloor())<2,'the landed bag rests on the visible floor');
context.innerWidth=844;context.innerHeight=390;t.resize();step(30);
assert.ok(Math.abs(landed.bounds.max.y-t.getFloor())<2,'changing orientation preserves floor contact');
console.log('PASS: a real physics drop lands on the trolley and stays grounded after rotation.');



// Reduced motion preserves the essential trip out of the hold and vertical fall.
t.setPrefs({motion:false});t.startGame();t.setReady(4,230);t.drop();assert.ok(t.throwPose());step(50);assert.equal(t.allBags().length,1);
console.log('PASS: reduced-motion launch remains visible.');
module.exports = { game:t, step, context };
