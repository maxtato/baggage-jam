const assert = require('assert/strict');
const { game:t, step, context } = require('./handler.cjs');
context.innerWidth=390; context.innerHeight=844; t.resize();
t.setPrefs({motion:false});

function onFloor(level,x) {
  const bag=t.makeBag(level,x,t.getFloor()-200);
  t.Body.translate(bag,{x:0,y:t.getFloor()-bag.bounds.max.y-.1});
  return bag;
}

// A case entering a narrow gap must find a resting pose instead of vibrating.
t.startGame();
const left=onFloor(6,160),right=onFloor(7,300);
step(180);
const middle=t.makeBag(5,230,Math.min(left.bounds.min.y,right.bounds.min.y)-180);
step(480);
const pile=[left,right,middle];
assert.ok(pile.every(b=>b.isSleeping),'the compressed pile comes to rest');
const resting=pile.map(b=>({x:b.position.x,y:b.position.y,angle:b.angle}));
step(120);
pile.forEach((b,i)=>{
  assert.equal(b.position.x,resting[i].x,'settled cases do not shimmy sideways');
  assert.equal(b.position.y,resting[i].y,'settled cases do not rise and fall');
  assert.equal(b.angle,resting[i].angle,'settled cases do not tremble');
});
console.log('PASS: a case wedged between two others settles and remains motionless.');

// Rest is reversible: a real collision must move the pile again.
t.makeBag(4,middle.position.x,middle.bounds.min.y-160);
let woke=false,moved=false;
for(let i=0;i<120;i++){
  step();
  woke ||= !middle.isSleeping;
  moved ||= Math.hypot(middle.position.x-resting[2].x,middle.position.y-resting[2].y)>.5;
}
assert.ok(woke&&moved,'a new impact wakes the resting case and transfers motion');
console.log('PASS: a new impact wakes the pile without permanently locking cases.');

// Fusion can remove a supporting case. Sleeping neighbours must rejoin physics.
t.startGame();
const a=onFloor(6,140),b=onFloor(6,300),supported=t.makeBag(2,140,t.getFloor()-210);
context.Matter.Sleeping.set(supported,true);
a.merging=b.merging=true;t.queue(a,b);t.processMerges(10000);
assert.equal(supported.isSleeping,false,'support changes wake resting neighbours');
assert.ok(t.allBags().some(bag=>bag.lvl===7),'fusion still creates the next luggage');
const before=supported.position.y;step(10);
assert.ok(supported.position.y>before+.5,'the unsupported bag falls instead of floating');
console.log('PASS: fusion wakes unsupported bags and gravity resumes.');

// A bag freely suspended above the trolley cannot enter the resting state.
t.startGame();const airborne=t.makeBag(3,230,t.getFloor()-300);
for(let i=0;i<20;i++){
  step();assert.equal(airborne.isSleeping,false,'free-falling cases stay active');
}
console.log('PASS: free-falling luggage remains active.');
