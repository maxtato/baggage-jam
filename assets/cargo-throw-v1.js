(function(scope){
  'use strict';
  const ORIGIN={x:512,y:360},DROP_Y=920;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
  function launch(targetX,level=1,{gravity=4480}={}){
    // End on a 120 Hz physics tick, so the handover cannot add a second step.
    const duration=Math.round((.78+clamp(Math.abs(targetX-ORIGIN.x)/340)*.04)*120)/120;
    const drag=.005*60,initialVy=-625,exitVy=1625;
    // A longer, lower arc with a controlled exit speed. Match both velocity and
    // acceleration to free fall, without hitting the game's speed cap on arrival.
    const c1=initialVy*duration,c2=gravity*.72*duration*duration/2;
    const distance=DROP_Y-ORIGIN.y-c1-c2,velocity=exitVy*duration-c1-2*c2;
    const acceleration=(gravity-drag*exitVy)*duration*duration-2*c2;
    const vertical=[c1,c2,10*distance-4*velocity+acceleration/2,
      -15*distance+7*velocity-acceleration,6*distance-3*velocity+acceleration/2];
    return{targetX,level,elapsed:0,duration,gravity,drag,initialVy,vertical};
  }
  function pose(flight){
    const t=clamp(flight.elapsed/flight.duration),dx=flight.targetX-ORIGIN.x;
    const [c1,c2,c3,c4,c5]=flight.vertical;
    // Start with lateral momentum and spread its turn into the accelerating fall.
    // Both lateral speed and acceleration still reach zero at the lower join.
    const along=t+t*t*t*(4+t*(-7+3*t));
    return {x:ORIGIN.x+dx*along,
      y:ORIGIN.y+t*(c1+t*(c2+t*(c3+t*(c4+t*c5)))),
      scale:.5+.5*smooth(0,.72,t),alpha:smooth(0,.04,t),shade:.78*(1-smooth(0,.34,t)),
      angle:Math.sign(dx)*.15*64*(t*(1-t))**3,progress:t,
      vx:dx*(1-t)**2*(1+2*t+15*t*t)/flight.duration,
      vy:(c1+t*(2*c2+t*(3*c3+t*(4*c4+t*5*c5))))/flight.duration};
  }
  // Keep the aiming arrow just below the opening, independent of the throw arc.
  function markerY(){return 760;}
  function clipHold(c){
    c.beginPath();c.moveTo(351,205);c.lineTo(656,205);c.lineTo(656,224);c.lineTo(681,224);c.lineTo(685,212);
    c.bezierCurveTo(697,224,701,258,702,303);c.bezierCurveTo(705,378,706,550,700,622);
    c.bezierCurveTo(699,647,694,659,677,662);c.lineTo(335,662);c.bezierCurveTo(319,660,313,651,311,636);
    c.bezierCurveTo(304,570,304,390,308,304);c.bezierCurveTo(309,264,311,230,324,213);
    c.lineTo(326,225);c.lineTo(349,225);c.closePath();c.clip();
  }
  function shadeHold(c){
    c.save();clipHold(c);const shade=c.createLinearGradient(512,205,512,662);
    shade.addColorStop(0,'rgba(2,5,8,.78)');shade.addColorStop(.6,'rgba(2,5,8,.58)');shade.addColorStop(1,'rgba(2,5,8,.16)');
    c.fillStyle=shade;c.fillRect(300,200,410,470);c.restore();
  }
  function drawArrow(c,x,y,{floor=1400,width=128,active=false}={}){
    c.save();c.globalAlpha=active?.3:1;c.lineJoin='round';c.lineCap='round';
    c.translate(x,y);c.beginPath();c.moveTo(-12,-64);c.lineTo(12,-64);c.lineTo(12,-32);c.lineTo(29,-32);
    c.lineTo(0,0);c.lineTo(-29,-32);c.lineTo(-12,-32);c.closePath();
    c.fillStyle='#f4c340';c.strokeStyle='#202821';c.lineWidth=3;c.fill();c.stroke();
    c.strokeStyle='#fff4c2';c.lineWidth=3;c.beginPath();c.moveTo(-6,-55);c.lineTo(-6,-27);c.lineTo(-17,-27);c.stroke();c.restore();
  }
  function createRenderer(createCanvas){
    const masks=new WeakMap();
    function shadow(image){
      if(masks.has(image))return masks.get(image);
      const c=createCanvas(image.width,image.height),p=c.getContext('2d');p.drawImage(image,0,0);
      p.globalCompositeOperation='source-in';p.fillStyle='#020508';p.fillRect(0,0,c.width,c.height);
      masks.set(image,c);return c;
    }
    function drawFlight(c,image,flight,width,height){
      const p=pose(flight);if(!image||!image.width)return p;
      c.save();if(p.progress<.2)clipHold(c);
      c.globalAlpha=p.alpha;c.translate(p.x,p.y);c.rotate(p.angle);c.scale(p.scale,p.scale);
      c.drawImage(image,-width/2,-height/2,width,height);
      if(p.shade>.001){c.globalAlpha*=p.shade;c.drawImage(shadow(image),-width/2,-height/2,width,height);}
      c.restore();return p;
    }
    return{drawFlight};
  }
  const api={launch,pose,markerY,shadeHold,drawArrow,createRenderer,DROP_Y,ORIGIN};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else scope.CargoThrow=api;
})(typeof window==='undefined'?globalThis:window);
