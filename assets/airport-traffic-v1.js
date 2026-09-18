(function(scope){
  'use strict';
  const clamp=x=>Math.max(0,Math.min(1,x));
  function create(random=Math.random){return {random,wait:25+random()*20,active:false,landing:true,elapsed:0};}
  function update(s,dt){
    if(!s.active){s.wait-=dt;if(s.wait<=0){s.active=true;s.elapsed=0;}return;}
    s.elapsed+=dt;
    if(s.elapsed>=18){s.active=false;s.landing=!s.landing;s.wait=55+s.random()*35;}
  }
  function pose(s,left=0,right=1024){
    if(!s.active)return null;
    const t=clamp(s.elapsed/18),u=s.landing?(1.3*t-.3*t*t):(.65*t+.35*t*t);
    const height=s.landing?110*Math.max(0,1-t/.38)**2:160*clamp((t-.5)/.5)**2;
    return {x:s.landing?left-150+(right-left+300)*u:right+150-(right-left+300)*u,y:1081-height,height,direction:s.landing?1:-1,angle:s.landing?0:-.13*clamp((t-.45)/.2)};
  }
  function draw(c,s,left,right){
    const p=pose(s,left,right);if(!p)return;
    c.save();
    // Distant traffic passes behind the parked baggage truck.
    c.beginPath();c.moveTo(left-200,900);c.lineTo(right+200,900);c.lineTo(right+200,1140);c.lineTo(342,1140);c.lineTo(342,965);c.lineTo(left-200,965);c.closePath();c.clip();
    c.globalAlpha=.17*(1-p.height/210);c.fillStyle='#303534';c.beginPath();c.ellipse(p.x,1091,61,2.2,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
    c.translate(p.x,p.y);c.scale(p.direction,1);c.rotate(p.angle);
    c.lineJoin='round';c.lineCap='round';c.lineWidth=1.25;c.strokeStyle='#414744';
    c.fillStyle='#dadcd8';c.beginPath();c.moveTo(-10,-7);c.lineTo(-38,-19);c.lineTo(-30,-19);c.lineTo(19,-5);c.closePath();c.fill();c.stroke();
    c.fillStyle='#faf9ef';c.beginPath();c.moveTo(-65,-8);c.lineTo(-57,-37);c.lineTo(-48,-38);c.lineTo(-44,-12);c.bezierCurveTo(-15,-13,34,-14,48,-10);c.quadraticCurveTo(68,-3,65,0);c.quadraticCurveTo(60,5,39,5);c.lineTo(-48,3);c.closePath();c.fill();c.stroke();
    c.fillStyle='#bfc6c5';c.beginPath();c.moveTo(10,-1);c.lineTo(-25,19);c.lineTo(-39,19);c.lineTo(-8,-2);c.closePath();c.fill();c.stroke();
    c.fillStyle='#f5f4ec';c.beginPath();c.ellipse(-1,9,10,4,0,0,Math.PI*2);c.fill();c.stroke();
    c.fillStyle='#404d50';c.beginPath();c.moveTo(44,-9);c.lineTo(51,-7);c.lineTo(55,-4);c.lineTo(44,-4);c.closePath();c.fill();
    for(let x=-32;x<38;x+=7)c.fillRect(x,-7,2.8,2.5);
    c.strokeStyle='#686f6b';c.lineWidth=.7;c.beginPath();c.moveTo(-48,0);c.lineTo(42,1);c.stroke();
    c.strokeStyle='#3b413f';c.lineWidth=1.3;
    for(const x of [-22,43]){c.beginPath();c.moveTo(x,4);c.lineTo(x,8);c.stroke();c.fillStyle='#303735';c.beginPath();c.arc(x,9,2,0,Math.PI*2);c.fill();}
    c.restore();
  }
  const api={create,update,pose,draw};if(typeof module!=='undefined'&&module.exports)module.exports=api;else scope.AirportTraffic=api;
})(typeof window==='undefined'?globalThis:window);
