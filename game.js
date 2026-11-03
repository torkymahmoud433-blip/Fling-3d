import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
(() => {
'use strict';
const $=id=>document.getElementById(id);
const ui={menu:$('menu'),pause:$('pause-screen'),crash:$('crash-screen'),speed:$('speed'),distance:$('distance'),final:$('final-distance'),mission:$('mission-text'),loading:$('loading'),gear:$('gear')};
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9bb8c5);scene.fog=new THREE.Fog(0x9bb8c5,45,190);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,350);camera.position.set(0,5.2,10.5);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;$('scene').appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xdceeff,0x536047,2.0));
const sun=new THREE.DirectionalLight(0xffedcf,2.4);sun.position.set(-18,30,14);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;scene.add(sun);
const mat=(color,roughness=.82,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const asphalt=mat(0x343a3d),sidewalk=mat(0xb5b4a9),grass=mat(0x617b55),lineMat=mat(0xe5e2d4),glass=mat(0x263d4a,.28,.15),rubber=mat(0x15191b),white=mat(0xe6e2d8),red=mat(0xb84738),yellow=mat(0xc9f36a,.35,.18),chrome=mat(0x8d999d,.25,.7);
function box(parent,w,h,d,material,x=0,y=0,z=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function makeCar(color=0xc9f36a){
 const root=new THREE.Group(),bodyMat=mat(color,.36,.22);
 box(root,1.72,.48,3.35,bodyMat,0,.62,0);box(root,1.48,.56,1.72,bodyMat,0,1.08,-.25);
 const cabin=box(root,1.35,.48,1.5,glass,0,1.12,-.28);cabin.castShadow=false;
 box(root,1.76,.12,1.1,bodyMat,0,.91,1.0);
 for(const x of [-.88,.88])for(const z of [-1.05,1.05]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.22,18),rubber);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.42,z);wheel.castShadow=true;root.add(wheel);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.23,16),chrome);hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);root.add(hub)}
 for(const x of [-.58,.58]){box(root,.28,.13,.06,white,x,.68,1.7);box(root,.25,.12,.06,red,x,.68,-1.7)}
 box(root,1.5,.08,.08,chrome,0,.48,1.72);
 return root;
}
const road=box(scene,13,.12,220,asphalt,0,-.12,-72);road.receiveShadow=true;
for(const x of [-7.1,7.1])box(scene,1,.18,220,sidewalk,x,-.08,-72);
for(const x of [-2.17,2.17])for(let z=22;z>-190;z-=12)box(scene,.12,.015,4.5,lineMat,x,-.045,z);
for(const x of [-9.2,9.2]){const verge=box(scene,3,.08,220,grass,x,-.19,-72);verge.receiveShadow=true}
function building(x,z,w,h,d,color){const b=box(scene,w,h,d,mat(color),x,h/2-.08,z);for(let yy=.9;yy<h-.5;yy+=1.5)for(let xx=-w/2+.55;xx<w/2-.25;xx+=1.2){const win=box(scene,.48,.62,.035,mat(0x829da2,.3),x+xx,yy,z+d/2+.02);win.castShadow=false}return b}
const colors=[0x9b9b91,0xb9aa91,0x7f8d8b,0xc2b8a4,0x87939b,0xa88f7d];
for(let i=0;i<24;i++){const z=18-i*9;const side=i%2?1:-1;const w=4+(i%3)*1.3,h=5+(i%5)*2.2;building(side*(12+(i%3)*2),z,w,h,5,colors[i%colors.length]);}
for(let z=18;z>-190;z-=18)for(const x of [-8.1,8.1]){const trunk=box(scene,.22,1.5,.22,mat(0x594632),x,.7,z);const crown=new THREE.Mesh(new THREE.SphereGeometry(.9,8,7),mat(0x47704a));crown.position.set(x,2,z);crown.castShadow=true;scene.add(crown)}
const player=makeCar();player.position.set(0,0,4);scene.add(player);
const traffic=[];const trafficColors=[0xe7e2d7,0x4f7d9b,0xb94f42,0xd3a64e,0x647078];
function addTraffic(z,lane){const c=makeCar(trafficColors[Math.floor(Math.random()*trafficColors.length)]);c.scale.setScalar(.92);c.position.set((lane-1)*3.8,0,z);scene.add(c);traffic.push({mesh:c,lane,z,speed:Math.random()*5+7})}
for(let i=0;i<7;i++)addTraffic(-24-i*24,Math.floor(Math.random()*3));
const keys={left:false,right:false,gas:false,brake:false};let state='menu',speed=0,steer=0,travel=0,last=performance.now(),cruise=0,shake=0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function reset(){speed=0;steer=0;travel=0;player.position.x=0;traffic.forEach((c,i)=>{c.z=-24-i*24;c.lane=Math.floor(Math.random()*3);c.mesh.position.set((c.lane-1)*3.8,0,c.z)});ui.distance.textContent='0';}
function begin(){reset();state='playing';ui.menu.classList.add('hidden');ui.pause.classList.add('hidden');ui.crash.classList.add('hidden');}
function endTrip(){state='crash';speed=0;ui.final.textContent=Math.floor(travel)+' m';ui.crash.classList.remove('hidden');navigator.vibrate?.(100)}
function pause(){if(state!=='playing')return;state='paused';ui.pause.classList.remove('hidden');Object.keys(keys).forEach(k=>keys[k]=false)}
function resume(){if(state==='paused'){state='playing';ui.pause.classList.add('hidden')}}
function update(dt){if(state!=='playing')return;const t=Math.min(dt/16.67,2.2);
 const accel=keys.gas?25:0,brake=keys.brake?52:0;speed=clamp(speed+(accel-brake-(keys.gas?1.4:7))*dt/1000,0,48);
 const target=(keys.left?-1:0)+(keys.right?1:0);steer=THREE.MathUtils.damp(steer,target,5.5,dt/1000);player.position.x=clamp(player.position.x+steer*(.035+speed*.0013)*t,-4.7,4.7);
 player.rotation.z=THREE.MathUtils.damp(player.rotation.z,-steer*.075,7,dt/1000);player.rotation.y=THREE.MathUtils.damp(player.rotation.y,-steer*.045,5,dt/1000);
 const move=speed*dt/1000;travel+=move*2.2;road.position.z+=move; if(road.position.z>0)road.position.z=-72;
 for(const c of traffic){c.z+=move-c.speed*dt/1000;if(c.z>13){c.z=-175-Math.random()*25;c.lane=Math.floor(Math.random()*3);c.mesh.position.x=(c.lane-1)*3.8;c.speed=7+Math.random()*5}c.mesh.position.z=c.z;
 if(Math.abs(c.z-player.position.z)<2.55&&Math.abs(c.mesh.position.x-player.position.x)<1.55&&speed>5){endTrip();return}}
 // Camera follows with a little steering lag, keeping the car low in frame.
 camera.position.x=THREE.MathUtils.damp(camera.position.x,player.position.x*.36,2.4,dt/1000);camera.position.y=THREE.MathUtils.damp(camera.position.y,5.0+speed*.006,2,dt/1000);camera.position.z=THREE.MathUtils.damp(camera.position.z,10.8+speed*.025,2,dt/1000);camera.lookAt(player.position.x*.18,1.05,-10);
 ui.speed.textContent=Math.round(speed*3.2);ui.distance.textContent=Math.floor(travel);ui.mission.textContent=speed>34?'WATCH YOUR SPEED':speed>18?'KEEP YOUR DISTANCE':'CITY DRIVE';
}
function render(){renderer.render(scene,camera)}
function frame(now){const dt=Math.min(now-last,50);last=now;update(dt);render();requestAnimationFrame(frame)}
$('start').addEventListener('click',begin);$('retry').addEventListener('click',begin);$('restart-pause').addEventListener('click',begin);$('pause').addEventListener('click',pause);$('resume').addEventListener('click',resume);
document.querySelectorAll('[data-control]').forEach(btn=>{const k=btn.dataset.control;const on=e=>{e.preventDefault();keys[k]=true;btn.classList.add('active');try{btn.setPointerCapture(e.pointerId)}catch{}};const off=e=>{e.preventDefault();keys[k]=false;btn.classList.remove('active')};btn.addEventListener('pointerdown',on);['pointerup','pointercancel','lostpointercapture'].forEach(ev=>btn.addEventListener(ev,off))});
addEventListener('keydown',e=>{const map={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'gas',' ':'gas',ArrowDown:'brake',s:'brake'};if(map[e.key]){keys[map[e.key]]=true;e.preventDefault()}if(e.key==='Escape')state==='playing'?pause():resume()});
addEventListener('keyup',e=>{const map={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'gas',' ':'gas',ArrowDown:'brake',s:'brake'};if(map[e.key])keys[map[e.key]]=false});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6))});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
ui.loading.remove();render();requestAnimationFrame(frame);
})();