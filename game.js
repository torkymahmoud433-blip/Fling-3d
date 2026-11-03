(()=>{
'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
const $=id=>document.getElementById(id);
const ui={menu:$('menu'),pause:$('pause-screen'),crash:$('crash-screen'),speed:$('speed'),score:$('score'),distance:$('distance'),final:$('final-score'),mission:$('mission-text')};
let W=0,H=0,dpr=1,last=0,raf=0,state='menu',speed=0,score=0,distance=0,playerX=0,steer=0,roadScroll=0,spawn=0,shake=0;
const held={left:false,right:false,gas:false,brake:false};let traffic=[];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const lerp=(a,b,t)=>a+(b-a)*t;
function resize(){dpr=Math.min(devicePixelRatio||1,1.7);W=innerWidth;H=innerHeight;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize,{passive:true});resize();
function poly(points,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fill()}
function rounded(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function roadBounds(t){const horizon=H*.36, y=horizon+t*(H-horizon);const half=lerp(W*.07,W*.48,t);const center=W*.5+Math.sin(roadScroll*.0005+t*2)*W*.035*t;return {y,left:center-half,right:center+half,center,half}}
function drawBackground(dt){
 const sky=ctx.createLinearGradient(0,0,0,H*.58);sky.addColorStop(0,'#6e9eb2');sky.addColorStop(1,'#d9c8a0');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 const hz=H*.36;
 // distant skyline
 ctx.fillStyle='#73847d';for(let i=0;i<18;i++){let bw=W/13, x=i*W/15-(roadScroll*.025%bw), bh=H*(.055+(i*37%7)*.012);ctx.fillRect(x,hz-bh,bw*.7,bh)}
 ctx.fillStyle='#a8a28a';ctx.fillRect(0,hz,W,H-hz);
 // roadside grass and city blocks
 const stripe=(roadScroll*.11)%90;
 for(let i=0;i<12;i++){let t=(i*90+stripe)/1080;let y=hz+t*(H-hz);let b=roadBounds(t);let scale=.25+t*1.5;
  ctx.fillStyle=i%2?'#617c57':'#6d875d';ctx.fillRect(0,y,W,Math.max(2,scale*8));
  if(i%2===0){let side=i%4===0?-1:1;let x=b.center+side*(b.half+W*(.05+t*.09));let bw=scale*26,bh=scale*48;ctx.fillStyle='#9c8c77';ctx.fillRect(x-bw/2,y-bh,bw,bh);ctx.fillStyle='#d4c2a0';for(let k=0;k<3;k++)ctx.fillRect(x-bw*.3+k*bw*.25,y-bh*.75,bw*.1,bh*.12)}
 }
 // road
 let top=roadBounds(0),bottom=roadBounds(1);poly([[top.left,hz],[top.right,hz],[bottom.right,H],[bottom.left,H]],'#343b40');
 poly([[top.left,hz],[top.left+W*.012,hz],[bottom.left+W*.035,H],[bottom.left,H]],'#d6d0bc');
 poly([[top.right-W*.012,hz],[top.right,hz],[bottom.right,H],[bottom.right-W*.035,H]],'#d6d0bc');
 // lane dashes
 for(let i=0;i<14;i++){let t=((i/14+roadScroll*.00065)%1);let b=roadBounds(t),dashH=lerp(2,24,t),dashW=lerp(1,5,t);for(let lane=1;lane<=2;lane++){let x=b.left+(b.right-b.left)*lane/3;ctx.fillStyle='#e6e4d7';ctx.fillRect(x-dashW/2,b.y-dashH/2,dashW,dashH)}}
}
function drawCar(x,y,w,h,color,isPlayer=false){
 ctx.save();ctx.translate(x,y);
 // shadow
 ctx.fillStyle='#10171955';ctx.beginPath();ctx.ellipse(0,h*.42,w*.7,h*.16,0,0,Math.PI*2);ctx.fill();
 // wheels
 rounded(-w*.52,-h*.05,w*.18,h*.43,3,'#14191c');rounded(w*.34,-h*.05,w*.18,h*.43,3,'#14191c');
 // body
 poly([[-w*.43,h*.32],[-w*.5,-h*.04],[-w*.35,-h*.36],[-w*.22,-h*.48],[w*.22,-h*.48],[w*.36,-h*.34],[w*.5,-h*.04],[w*.43,h*.32]],color);
 // windows
 poly([[-w*.29,-h*.12],[-w*.2,-h*.39],[w*.2,-h*.39],[w*.29,-h*.12]],'#253c49');
 ctx.fillStyle='#d8e5e5';ctx.globalAlpha=.35;ctx.fillRect(-w*.03,-h*.37,w*.06,h*.22);ctx.globalAlpha=1;
 ctx.fillStyle=isPlayer?'#f7e9a2':'#f6d6a3';ctx.fillRect(-w*.36,h*.19,w*.14,h*.07);ctx.fillRect(w*.22,h*.19,w*.14,h*.07);
 ctx.fillStyle='#9b2d25';ctx.fillRect(-w*.36,-h*.02,w*.12,h*.07);ctx.fillRect(w*.24,-h*.02,w*.12,h*.07);
 if(isPlayer){ctx.fillStyle='#ffffff22';ctx.fillRect(-w*.38,-h*.02,w*.76,h*.035)}
 ctx.restore();
}
function drawTraffic(){for(const car of traffic){const t=car.z,b=roadBounds(t),laneX=b.left+(b.right-b.left)*(car.lane+0.5)/3;const cw=lerp(12,54,t),ch=cw*1.55;drawCar(laneX+car.offset*b.half,b.y-ch*.2,cw,ch,car.color)}}
function drawPlayer(){const y=H*.82,w=Math.min(W*.17,74),h=w*1.55;const x=W*.5+playerX*W*.34;drawCar(x,y,w,h,'#c9f36a',true)}
function draw(){drawBackground();drawTraffic();drawPlayer();if(shake>0){ctx.fillStyle='#ff554422';ctx.fillRect(0,0,W,H)}}
function update(dt){
 if(state!=='playing')return;
 const step=Math.min(dt,32)/16.67;
 const accel=held.gas?0.22:0,brake=held.brake?0.42:0;
 speed=clamp(speed+accel*step-brake*step-(held.gas?0:.055*step),0,180);
 let target=(held.left?-1:0)+(held.right?1:0);steer=lerp(steer,target,.18*step);playerX=clamp(playerX+steer*.035*step*(.45+speed/100),-1.12,1.12);
 roadScroll+=speed*dt*.05;distance+=speed*dt/3600;score+=Math.floor(speed*dt/1200);
 spawn-=dt;if(spawn<=0&&speed>15){traffic.push({z:.02,lane:Math.floor(Math.random()*3),offset:(Math.random()-.5)*.08,color:['#e8e5dc','#d65e4e','#4b83a4','#d4a84d','#65717c'][Math.floor(Math.random()*5)],v:Math.random()*.35+.12});spawn=Math.max(450,1350-speed*4)+Math.random()*700}
 for(const car of traffic){car.z+=(.11+speed/800-car.v)*dt/1000;if(car.z>1.12)car.dead=true;const laneCenter=(car.lane-1)*.65; if(car.z>.78&&car.z<.91&&Math.abs(playerX-laneCenter)<.34){crash();break}}
 traffic=traffic.filter(c=>!c.dead);if(Math.abs(playerX)>1.03&&speed>35){speed=Math.max(0,speed-.35*step);shake=1}
 shake=Math.max(0,shake-.04*step);
 ui.speed.textContent=Math.round(speed);ui.score.textContent=score;ui.distance.textContent=Math.floor(distance)+' m';
 ui.mission.textContent=speed>130?'HIGH SPEED':speed>70?'KEEP YOUR DISTANCE':'DRIVE CAREFULLY';
}
function loop(now){let dt=now-last||16;last=now;update(dt);draw();raf=requestAnimationFrame(loop)}
function start(){traffic=[];speed=0;score=0;distance=0;playerX=0;steer=0;spawn=500;state='playing';Object.keys(held).forEach(k=>held[k]=false);ui.menu.classList.add('hidden');ui.pause.classList.add('hidden');ui.crash.classList.add('hidden');if(!raf){last=performance.now();raf=requestAnimationFrame(loop)}}
function crash(){if(state!=='playing')return;state='crash';speed=0;ui.final.textContent=score;ui.crash.classList.remove('hidden');navigator.vibrate?.(90)}
function pause(){if(state!=='playing')return;state='paused';ui.pause.classList.remove('hidden');Object.keys(held).forEach(k=>held[k]=false)}
function resume(){if(state!=='paused')return;state='playing';ui.pause.classList.add('hidden')}
$('start').addEventListener('click',start);$('retry').addEventListener('click',start);$('restart-pause').addEventListener('click',start);$('pause').addEventListener('click',pause);$('resume').addEventListener('click',resume);
document.querySelectorAll('[data-control]').forEach(btn=>{const key=btn.dataset.control;const on=e=>{e.preventDefault();held[key]=true;btn.classList.add('active');btn.setPointerCapture?.(e.pointerId)};const off=e=>{e.preventDefault();held[key]=false;btn.classList.remove('active')};btn.addEventListener('pointerdown',on);['pointerup','pointercancel','lostpointercapture','pointerleave'].forEach(ev=>btn.addEventListener(ev,off))});
addEventListener('keydown',e=>{const map={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'gas',' ':'gas',ArrowDown:'brake',s:'brake'};if(map[e.key]){held[map[e.key]]=true;e.preventDefault()}if(e.key==='Escape')state==='playing'?pause():resume()});
addEventListener('keyup',e=>{const map={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'gas',' ':'gas',ArrowDown:'brake',s:'brake'};if(map[e.key])held[map[e.key]]=false});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause()});
draw();})();
