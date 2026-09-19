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
  const truckShadows=new WeakMap();
  function truckShadow(sprites){
    if(truckShadows.has(sprites))return truckShadows.get(sprites);
    const mask=scope.document.createElement('canvas');mask.width=674;mask.height=304;
    const m=mask.getContext('2d');m.drawImage(sprites,45,625,1165,525,0,0,674,304);
    m.globalCompositeOperation='source-in';m.fillStyle='#252b29';m.fillRect(0,0,674,304);
    truckShadows.set(sprites,mask);return mask;
  }
  function draw(c,s,left,right,sprites){
    const p=pose(s,left,right);
    if(!sprites||!sprites.complete||!sprites.naturalWidth)return;
    if(p){
      c.save();
      c.globalAlpha=.17*(1-p.height/210);c.fillStyle='#303534';c.beginPath();c.ellipse(p.x,1091,61,2.2,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
      c.translate(p.x,p.y+10);c.scale(-p.direction,1);c.rotate(-p.angle);
      c.drawImage(sprites,75,125,1135,390,-65,-44.67,130,44.67);
      c.restore();
    }
    // Actual alpha silhouette is painted after aircraft, so every gap remains open.
    c.save();c.globalAlpha=.25;
    // Flatten the real alpha silhouette onto the tarmac, anchored at the tyres.
    c.drawImage(truckShadow(sprites),0,1109,337,19);
    c.globalAlpha=.32;c.fillStyle='#252b29';
    for(const [x,r] of [[48,14],[93,14],[271,18]]){c.beginPath();c.ellipse(x,1125,r,2.2,0,0,Math.PI*2);c.fill();}
    c.restore();
    c.drawImage(sprites,45,625,1165,525,0,977,337,151.87);
  }
  const api={create,update,pose,draw};if(typeof module!=='undefined'&&module.exports)module.exports=api;else scope.AirportTraffic=api;
})(typeof window==='undefined'?globalThis:window);
