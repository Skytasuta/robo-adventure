import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const container=document.getElementById('threeview');

const scene=new THREE.Scene();scene.background=new THREE.Color(0x151f42);scene.fog=new THREE.FogExp2(0x17284b,0.018);
const camera=new THREE.PerspectiveCamera(44,1,0.1,300);const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;container.append(renderer.domElement);window.dispatchEvent(new Event('robo-3d-ready'));
scene.add(new THREE.HemisphereLight(0xe8edff,0x395d70,2.1));let sun=new THREE.DirectionalLight(0xffead1,3.1);sun.position.set(8,16,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;scene.add(sun);
const grp=new THREE.Group();scene.add(grp);const mat=(c,rough=.72,metal=0)=>new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal});const geoBox=(w,h,d)=>new THREE.BoxGeometry(w,h,d);const emit=c=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.8,roughness:.35});
let fields=null,robot=null,lastTime=0,target=new THREE.Vector3(),yaw=.75,pitch=.66,dist=19,isDragging=false,lastX=0,lastY=0,active=null;
function mesh(geo,m,x,y,z,parent=grp){let o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function box(w,h,d,m,x,y,z,p=grp){return mesh(geoBox(w,h,d),m,x,y,z,p)}
function sphere(r,m,x,y,z,p=grp){return mesh(new THREE.SphereGeometry(r,16,12),m,x,y,z,p)}
function tube(r,h,m,x,y,z,p=grp){return mesh(new THREE.CylinderGeometry(r,r,h,10),m,x,y,z,p)}
function decoTree(x,z){tube(.14,.8,mat('#815746'),x,.52,z);sphere(.59,mat('#368e78'),x,1.24,z);sphere(.38,mat('#68b68a'),x+.28,1.55,z+.12);sphere(.2,emit('#93f5b0'),x-.25,1.14,z-.25)}
function crystal(x,z){let g=new THREE.ConeGeometry(.37,1.25,5);mesh(g,emit('#47e8ff'),x,.9,z);sphere(.25,emit('#c9a5ff'),x,1.55,z)}
function gateway(x,z,color){box(.24,1.8,.24,mat(color),x-.47,.94,z);box(.24,1.8,.24,mat(color),x+.47,.94,z);box(1.18,.23,.30,emit(color),x,1.81,z);sphere(.23,emit('#ffca72'),x,2.12,z)}
function switchBox(x,z){box(.8,.18,.8,mat('#596d83'),x,.48,z);box(.45,.15,.45,emit('#ffbb54'),x,.62,z)}
function robo(){const r=new THREE.Group();box(.95,.85,.65,mat('#f6ffff',.32),0,1.22,0,r);box(.8,.61,.19,mat('#2d527a',.2),0,1.26,.37,r);sphere(.115,emit('#72f8ff'),-.22,1.32,.48,r);sphere(.115,emit('#72f8ff'),.22,1.32,.48,r);box(.47,.18,.12,emit('#83ecff'),0,1.07,.48,r);box(.72,.55,.6,mat('#d9e6f6'),0,.5,0,r);box(.25,.5,.3,mat('#468bd2'),-.35,.15,0,r);box(.25,.5,.3,mat('#468bd2'),.35,.15,0,r);box(.27,.57,.27,mat('#8dd3ea'),-.62,.74,0,r);box(.27,.57,.27,mat('#8dd3ea'),.62,.74,0,r);tube(.07,.35,mat('#f5e5b6'),0,1.8,0,r);sphere(.16,emit('#ffda79'),0,2.02,0,r);grp.add(r);return r}
function deleteAll(){for(const o of [...grp.children])grp.remove(o)}
function setWorld(data){if(!data||!data.level)return;const lv=data.level;fields=data;deleteAll();let world=data.world;scene.background=new THREE.Color(['#234d58','#151e43','#38295f'][world]);scene.fog.color.set(scene.background);let tiles=[mat('#69bc8d'),mat('#3c9e86'),mat('#617ca3'),mat('#515b94'),mat('#9a80b9'),mat('#7c61a5')];for(let x=0;x<lv.w;x++)for(let y=0;y<lv.h;y++){let bx=x-(lv.w-1)/2,bz=y-(lv.h-1)/2,blocked=lv.blocked.some(p=>p[0]===x&&p[1]===y);let m=tiles[world*2+(x+y)%2];box(.98,.44,.98,m,bx,0,bz);if(world===0&&Math.random()<.12)sphere(.06,emit('#fbe99c'),bx+.25,.29,bz-.25);if(blocked){if(world===0){decoTree(bx,bz)}else if(world===1){box(.75,.95,.75,mat('#7d4a83'),bx,.73,bz);sphere(.21,emit('#ff477a'),bx,1.3,bz)}else{crystal(bx,bz)}}}
const coord=p=>[p[0]-(lv.w-1)/2,p[1]-(lv.h-1)/2];let [gx,gz]=coord(lv.goal);gateway(gx,gz,['#5de9b9','#fd6ddd','#f2cc87'][world]);if(lv.item&&!data.gotItem){const [x,z]=coord(lv.item);crystal(x,z)}if(lv.sw&&!data.gotSwitch){const [x,z]=coord(lv.sw);switchBox(x,z)}if(data.red){const [x,z]=coord(data.red);box(.98,.055,.98,emit('#ff3333'),x,.25,z)}robot=robo();const [rx,rz]=coord(data.pos);robot.position.set(rx,.25,rz);robot.rotation.y= -data.direction*Math.PI/2+Math.PI/2;target.set(0,0,0);updateCamera()}
function updateCamera(){camera.position.set(target.x+Math.cos(yaw)*Math.cos(pitch)*dist,Math.sin(pitch)*dist,target.z+Math.sin(yaw)*Math.cos(pitch)*dist);camera.lookAt(target.x,0,target.z);camera.updateProjectionMatrix()}
function resize(){let w=container.clientWidth||650,h=container.clientHeight||440;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}
const observer=new ResizeObserver(resize);observer.observe(container);resize();
renderer.domElement.addEventListener('pointerdown',e=>{isDragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});renderer.domElement.addEventListener('pointerup',()=>isDragging=false);renderer.domElement.addEventListener('pointermove',e=>{if(!isDragging)return;yaw-=(e.clientX-lastX)*.008;pitch=Math.max(.30,Math.min(1.35,pitch+(e.clientY-lastY)*.007));lastX=e.clientX;lastY=e.clientY;updateCamera()});renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(10,Math.min(32,dist+e.deltaY*.013));updateCamera()},{passive:false});
window.addEventListener('robo-render',ev=>setWorld(ev.detail));
let time=0;function loop(t){requestAnimationFrame(loop);time=t*.001;if(robot)robot.position.y=.23+Math.sin(time*3)*.05;renderer.render(scene,camera)}requestAnimationFrame(loop);
// An event may be emitted before the asynchronous 3D module finishes loading.
const originalDraw=window.draw;if(typeof originalDraw==='function'){
 // Trigger a redraw after loading the renderer; existing game state is preserved.
 try{originalDraw()}catch(e){console.warn('waiting for mission selection',e)}
}
