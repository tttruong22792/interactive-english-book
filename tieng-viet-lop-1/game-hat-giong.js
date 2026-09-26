import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const L = window.TV1_LESSON;
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

const STORAGE='tv1:hat-giong-nho:spell-read-game:v1';
const COACH_API='https://npkekrjzebsjfaizfcyb.supabase.co/functions/v1/vietnamese-reading-coach';

const STAGES=[
  {
    id:'stage1',
    title:'Hạt giống bên đường',
    subtitle:'Ghép chữ để nhặt hạt',
    icon:'🌱',
    target:'Một hạt giống nhỏ',
    focusWords:['hạt','nhỏ']
  },
  {
    id:'stage2',
    title:'Cây cầu vào vườn',
    subtitle:'Đọc đúng để mở cầu',
    icon:'🪨',
    target:'Bé nhặt được',
    focusWords:['nhặt','được']
  },
  {
    id:'stage3',
    title:'Giọt sương sớm',
    subtitle:'Chọn đúng âm rồi đọc to',
    icon:'💧',
    target:'sương sớm',
    focusWords:['sương','sớm']
  },
  {
    id:'stage4',
    title:'Lá non thức giấc',
    subtitle:'Chỉ từng chữ và tự đọc',
    icon:'🍃',
    target:'Lá non khẽ rung rung',
    focusWords:['khẽ']
  },
  {
    id:'stage5',
    title:'Lời cảm ơn của lá',
    subtitle:'Tự đọc cả câu không có mẫu',
    icon:'🌼',
    target:'Dường như lá muốn cảm ơn bé',
    focusWords:['dường']
  },
  {
    id:'final',
    title:'Cây nở hoa',
    subtitle:'Đọc trọn bài để hoàn thành',
    icon:'🏆',
    target:'Hạt giống nhỏ',
    focusWords:[]
  }
];

const FINAL_SENTENCES=L.fullText.slice();

function defaultState(){
  return {
    current:0,
    completed:{},
    pieces:{hat:false,nho:false,sInitial:false,sRime:false},
    voicePassed:{},
    attempts:{},
    scaffold:{},
    wand4:0,
    wand5:0,
    finalRead:{},
    collection:{},
    childName:'',
    introSeen:false,
    sound:true
  };
}
function loadState(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORAGE)||'{}');
    const d=defaultState();
    return {
      ...d,...raw,
      completed:{...d.completed,...(raw.completed||{})},
      pieces:{...d.pieces,...(raw.pieces||{})},
      voicePassed:{...d.voicePassed,...(raw.voicePassed||{})},
      attempts:{...d.attempts,...(raw.attempts||{})},
      scaffold:{...d.scaffold,...(raw.scaffold||{})},
      finalRead:{...d.finalRead,...(raw.finalRead||{})},
      collection:{...d.collection,...(raw.collection||{})}
    };
  }catch(e){return defaultState();}
}
let state=loadState();
function save(){
  localStorage.setItem(STORAGE,JSON.stringify(state));
  renderHUD();
  updateWorldFromState();
}

const els={
  canvas:$('#world'),
  loading:$('#loading'),
  stageStrip:$('#stageStrip'),
  progressText:$('#progressText'),
  progressBar:$('#progressBar'),
  storyKicker:$('#storyKicker'),
  storyTitle:$('#storyTitle'),
  storyDesc:$('#storyDesc'),
  openStage:$('#openStage'),
  collectionCount:$('#collectionCount'),
  collectionWords:$('#collectionWords'),
  overlay:$('#challengeOverlay'),
  challengeTitle:$('#challengeTitle'),
  challengeSub:$('#challengeSub'),
  challengeBody:$('#challengeBody'),
  challengeFooter:$('#challengeFooter'),
  closeChallenge:$('#closeChallenge'),
  intro:$('#introOverlay'),
  start:$('#startGame'),
  parent:$('#parentOverlay'),
  parentBody:$('#parentBody'),
  parentClose:$('#parentClose'),
  parentBtn:$('#parentBtn'),
  soundBtn:$('#soundBtn'),
  toast:$('#toast')
};

let scene,camera,renderer,clock;
let world={};
let cameraTarget=new THREE.Vector3();
let activeStageForCamera=0;
let scratchUntil=0;
let voiceIdleTimer=null;
let recorder=null,recordChunks=[],recordStream=null,recordingGate=null;
let dragGhost=null,dragSource=null;

function esc(v){
  return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function toast(msg){
  els.toast.textContent=msg;
  els.toast.classList.add('show');
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>els.toast.classList.remove('show'),1800);
}
function completedCount(){return STAGES.filter(s=>state.completed[s.id]).length;}
function progress(){return Math.round(completedCount()/STAGES.length*100);}
function isUnlocked(i){return i===0 || STAGES.slice(0,i).every(s=>state.completed[s.id]);}
function nextStageIndex(){
  const i=STAGES.findIndex(s=>!state.completed[s.id]);
  return i<0?STAGES.length-1:i;
}
function addCollection(words){
  words.forEach(w=>state.collection[w]=true);
}
function collectionList(){return Object.keys(state.collection);}

function renderHUD(){
  const p=progress();
  els.progressText.textContent=p+'%';
  els.progressBar.style.width=p+'%';
  const active=STAGES[state.current]||STAGES[0];
  els.storyKicker.textContent='MÀN '+(state.current+1)+' / '+STAGES.length;
  els.storyTitle.textContent=active.icon+' '+active.title;
  els.storyDesc.textContent=active.subtitle;
  els.openStage.textContent=state.completed[active.id]?'Xem lại màn':'Bắt đầu màn';
  els.stageStrip.innerHTML=STAGES.map((s,i)=>{
    const done=!!state.completed[s.id],activeCls=i===state.current?'active':'',locked=!isUnlocked(i);
    return '<button class="stage-dot '+activeCls+' '+(done?'done ':'')+(locked?'locked':'')+'" data-stage="'+i+'" '+(locked?'disabled':'')+'><span>'+(done?'✓':(i+1))+'</span><small>'+esc(s.title)+'</small></button>';
  }).join('');
  $$('[data-stage]',els.stageStrip).forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.stage); if(!isUnlocked(i))return;
    state.current=i;save();moveCameraToStage(i);
  });
  const list=collectionList();
  els.collectionCount.textContent=list.length+' từ';
  els.collectionWords.innerHTML=list.length?list.map(w=>'<span>'+esc(w)+'</span>').join(''):'<span>Chưa có từ nào</span>';
  els.soundBtn.textContent=state.sound?'🔊':'🔇';
}

function chime(kind='good'){
  if(!state.sound)return;
  try{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    chime.ctx=chime.ctx||new AudioCtx();
    const ctx=chime.ctx,now=ctx.currentTime;
    const notes=kind==='good'?[523,659,784]:[260,230];
    notes.forEach((f,i)=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.frequency.value=f;o.type='sine';
      g.gain.setValueAtTime(.001,now+i*.07);
      g.gain.linearRampToValueAtTime(.06,now+i*.07+.015);
      g.gain.exponentialRampToValueAtTime(.001,now+i*.07+.22);
      o.connect(g);g.connect(ctx.destination);o.start(now+i*.07);o.stop(now+i*.07+.24);
    });
  }catch(e){}
}

function gentleFail(){
  scratchUntil=performance.now()+1200;
}

function completeStage(index){
  const s=STAGES[index];
  if(!state.completed[s.id]){
    state.completed[s.id]=true;
    chime('good');
    celebrate();
  }
  if(index<STAGES.length-1){
    state.current=index+1;
  }
  save();
  closeChallenge();
  moveCameraToStage(state.current);
  if(index<STAGES.length-1)toast('✨ Đã mở '+STAGES[index+1].title);
}

function celebrate(){
  const layer=document.createElement('div');
  layer.style.cssText='position:fixed;inset:0;z-index:130;pointer-events:none;overflow:hidden';
  const chars=['✨','🌱','⭐','🌼','💚'];
  for(let i=0;i<24;i++){
    const s=document.createElement('span');
    s.textContent=chars[i%chars.length];
    s.style.cssText='position:absolute;left:'+(5+Math.random()*90)+'%;top:-30px;font-size:'+(16+Math.random()*18)+'px;animation:confFall '+(1.2+Math.random()*.7)+'s ease-in forwards;animation-delay:'+Math.random()*.2+'s';
    layer.appendChild(s);
  }
  const style=document.createElement('style');
  style.textContent='@keyframes confFall{to{transform:translateY(105vh) rotate(420deg);opacity:.1}}';
  layer.appendChild(style);document.body.appendChild(layer);setTimeout(()=>layer.remove(),2100);
}

function init3D(){
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0xa8dceb);
  scene.fog=new THREE.Fog(0xa8dceb,28,70);
  camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,120);
  renderer=new THREE.WebGLRenderer({canvas:els.canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
  renderer.setSize(innerWidth,innerHeight,false);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
  clock=new THREE.Clock();

  scene.add(new THREE.HemisphereLight(0xe9f8ff,0x557346,2.0));
  const sun=new THREE.DirectionalLight(0xfff4cf,2.25);sun.position.set(-12,20,9);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;scene.add(sun);

  createWorld();
  window.addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight,false);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
  });
  moveCameraToStage(state.current,true);
  animate();
}

function m(color,rough=.85,metal=.02){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function addMesh(g,geo,matl,x,y,z){
  const o=new THREE.Mesh(geo,matl);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;
}
function createWorld(){
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(90,34),m(0x83c97b,1,0));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const path=new THREE.Mesh(new THREE.PlaneGeometry(72,5),m(0xd8b57b,1,0));path.rotation.x=-Math.PI/2;path.position.y=.015;scene.add(path);

  world.stageGroups=[];
  const xs=[-25,-15,-5,6,17,28];
  xs.forEach((x,i)=>{
    const g=new THREE.Group();g.position.x=x;scene.add(g);world.stageGroups.push(g);
    const marker=addMesh(g,new THREE.CylinderGeometry(1.5,1.7,.15,28),m(0xe6cc91),0,.08,0);
    marker.receiveShadow=true;
    const pole=addMesh(g,new THREE.CylinderGeometry(.08,.1,2.1,8),m(0x7c674d),0,1.05,-2.2);
    const sign=addMesh(g,new THREE.BoxGeometry(3.6,1.25,.15),m(i===5?0xf1d56b:0xf4ead3),0,2,-2.2);
    sign.rotation.y=.02;
  });

  createForest();
  createStageOne(world.stageGroups[0]);
  createStageTwo(world.stageGroups[1]);
  createStageThree(world.stageGroups[2]);
  createStageFour(world.stageGroups[3]);
  createStageFive(world.stageGroups[4]);
  createFinal(world.stageGroups[5]);
  createPlayer();
  updateWorldFromState();
}
function createForest(){
  world.clouds=[];
  for(let i=0;i<34;i++){
    const a=(i/34)*Math.PI*2;
    const x=-35+i*2.2,z=(i%2?10.5:-10.5)+(Math.random()-.5)*3;
    const g=new THREE.Group();
    const h=3+Math.random()*2.5;
    addMesh(g,new THREE.CylinderGeometry(.22,.34,h,8),m(0x866748),0,h/2,0);
    for(let j=0;j<3;j++){
      const c=addMesh(g,new THREE.IcosahedronGeometry(1.35+Math.random()*.45,1),m([0x4e9955,0x62aa61,0x75b86c][(i+j)%3]),(j-1)*.7,h-.1+Math.random()*.4,(Math.random()-.5)*.5);
      c.scale.y=.85;
    }
    g.position.set(x,0,z);scene.add(g);
  }
  for(let i=0;i<7;i++){
    const g=new THREE.Group();
    for(let j=0;j<4;j++){
      const c=addMesh(g,new THREE.SphereGeometry(.8+Math.random()*.4,12,8),new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:.75}),j*.7,(j%2)*.25,(Math.random()-.5)*.3);
      c.castShadow=false;
    }
    g.position.set(-28+i*10,10+Math.random()*3,-18-Math.random()*8);scene.add(g);world.clouds.push(g);
  }
  for(let i=0;i<120;i++){
    const f=addMesh(scene,new THREE.ConeGeometry(.05,.22+Math.random()*.22,5),m(i%5===0?0xf6d76e:0x5fae60),(Math.random()-.5)*75,.12,(Math.random()<.5?-1:1)*(4+Math.random()*7));
    f.rotation.y=Math.random()*6.28;
  }
}
function createStageOne(g){
  world.seed=addMesh(g,new THREE.SphereGeometry(.28,12,8),m(0x8a5739),-1.1,.28,.25);
  world.seed.scale.set(1,.65,.6);world.seed.visible=false;
  world.stage1Glow=addMesh(g,new THREE.RingGeometry(.55,.72,24),new THREE.MeshBasicMaterial({color:0xffd66c,transparent:true,opacity:.7}),-1.1,.03,.25);
  world.stage1Glow.rotation.x=-Math.PI/2;world.stage1Glow.visible=false;
}
function createStageTwo(g){
  const water=addMesh(g,new THREE.PlaneGeometry(6,7),new THREE.MeshPhysicalMaterial({color:0x63b9df,roughness:.2,transparent:true,opacity:.8}),0,.02,0);
  water.rotation.x=-Math.PI/2;
  world.bridge=[];
  [-1.8,0,1.8].forEach((x,i)=>{
    const rock=addMesh(g,new THREE.BoxGeometry(1.5,.32,1.5),m(0x8f8b82),x,.18,0);
    rock.visible=false;world.bridge.push(rock);
  });
}
function createStageThree(g){
  world.sproutStem=addMesh(g,new THREE.CylinderGeometry(.1,.16,1.4,8),m(0x4f9e59),0,.7,0);world.sproutStem.visible=false;
  world.sproutLeaves=[];
  [-1,1].forEach((side,i)=>{
    const leaf=addMesh(g,new THREE.SphereGeometry(.55,12,8),m(i?0x68b56c:0x76c079),side*.42,1.05,0);
    leaf.scale.set(1.3,.35,.6);leaf.rotation.z=side*.45;leaf.visible=false;world.sproutLeaves.push(leaf);
  });
  world.dew3=[];
  for(let i=0;i<4;i++){
    const drop=addMesh(g,new THREE.SphereGeometry(.13,10,8),new THREE.MeshPhysicalMaterial({color:0x86d8f2,roughness:.15,transparent:true,opacity:.88}),-1+i*.65,1.9+Math.random()*.4,-.5+i*.2);
    drop.visible=false;world.dew3.push(drop);
  }
}
function createStageFour(g){
  world.leafBranch=addMesh(g,new THREE.CylinderGeometry(.12,.16,3.5,8),m(0x795d43),0,1.6,0);world.leafBranch.rotation.z=Math.PI/2;
  world.leaves4=[];
  for(let i=0;i<5;i++){
    const leaf=addMesh(g,new THREE.SphereGeometry(.5,12,8),m(i%2?0x64ae67:0x75bd72),-1.4+i*.7,1.75,(i%2-.5)*.4);
    leaf.scale.set(1.35,.4,.7);leaf.rotation.z=(i%2?-.4:.4);leaf.visible=false;world.leaves4.push(leaf);
  }
}
function createStageFive(g){
  world.tree5=new THREE.Group();g.add(world.tree5);
  addMesh(world.tree5,new THREE.CylinderGeometry(.25,.38,4.5,10),m(0x805f43),0,2.25,0);
  world.crowns5=[];
  [[-1,4.4,0],[0,5.1,0],[1.1,4.45,.2],[-.4,4.5,-.9],[.6,4.35,-.8]].forEach((p,i)=>{
    const c=addMesh(world.tree5,new THREE.IcosahedronGeometry(1.2,1),m(i%2?0x5ca961:0x70b96d),...p);world.crowns5.push(c);
  });
  world.flowers5=[];
  for(let i=0;i<14;i++){
    const a=i/14*Math.PI*2;
    const fl=addMesh(world.tree5,new THREE.SphereGeometry(.15,10,8),m([0xffd66a,0xff9cab,0xffffff][i%3]),Math.cos(a)*(1.2+Math.random()*.7),4.6+Math.sin(a*2)*.7,Math.sin(a)*(1+Math.random()*.6));
    fl.visible=false;world.flowers5.push(fl);
  }
}
function createFinal(g){
  world.finalTree=new THREE.Group();g.add(world.finalTree);
  addMesh(world.finalTree,new THREE.CylinderGeometry(.38,.55,6.4,12),m(0x795a3f),0,3.2,0);
  world.finalCanopy=[];
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;
    const c=addMesh(world.finalTree,new THREE.IcosahedronGeometry(1.45,1),m(i%2?0x58ad62:0x73c276),Math.cos(a)*1.35,6+Math.sin(a*2)*.5,Math.sin(a)*1.2);
    world.finalCanopy.push(c);
  }
  world.finalFlowers=[];
  for(let i=0;i<28;i++){
    const a=Math.random()*Math.PI*2,r=.6+Math.random()*2.3;
    const fl=addMesh(world.finalTree,new THREE.SphereGeometry(.13+Math.random()*.05,8,6),m([0xffd35e,0xff8ca3,0xb899ff,0xffffff][i%4]),Math.cos(a)*r,5.4+Math.random()*1.8,Math.sin(a)*r);
    fl.visible=false;world.finalFlowers.push(fl);
  }
  world.finalTree.scale.set(.72,.72,.72);
}
function createPlayer(){
  const g=new THREE.Group();
  addMesh(g,new THREE.CapsuleGeometry(.35,.85,6,12),m(0xf0c83f),0,1,0);
  addMesh(g,new THREE.SphereGeometry(.32,16,12),m(0xffd1ab),0,1.78,0);
  const hair=addMesh(g,new THREE.SphereGeometry(.34,14,10),m(0x26323a),0,1.98,-.02);hair.scale.y=.55;
  world.armL=addMesh(g,new THREE.CylinderGeometry(.065,.075,.58,8),m(0xffd1ab),-.44,1.15,0);world.armL.rotation.z=-.18;
  world.armR=addMesh(g,new THREE.CylinderGeometry(.065,.075,.58,8),m(0xffd1ab),.44,1.15,0);world.armR.rotation.z=.18;
  addMesh(g,new THREE.CylinderGeometry(.11,.12,.58,8),m(0x5980a7),-.15,.4,0);
  addMesh(g,new THREE.CylinderGeometry(.11,.12,.58,8),m(0x5980a7),.15,.4,0);
  g.position.set(-27,0,3.2);scene.add(g);world.player=g;
}
function updateWorldFromState(){
  if(!world.stageGroups)return;
  world.seed.visible=!!state.pieces.hat;
  world.stage1Glow.visible=!!state.pieces.hat&&!state.completed.stage1;
  world.bridge.forEach((b,i)=>b.visible=!!state.completed.stage2 || !!state.voicePassed.stage2);
  const sproutOn=!!state.completed.stage3||!!state.voicePassed.stage3phrase;
  world.sproutStem.visible=sproutOn;world.sproutLeaves.forEach(l=>l.visible=sproutOn);world.dew3.forEach(d=>d.visible=sproutOn);
  const leavesOn=!!state.completed.stage4||state.wand4>0;world.leaves4.forEach((l,i)=>l.visible=leavesOn&&i<Math.max(state.wand4,1));
  world.flowers5.forEach((f,i)=>f.visible=!!state.completed.stage5 || (state.wand5>0&&i<state.wand5*2));
  world.finalFlowers.forEach((f,i)=>f.visible=!!state.completed.final);
  world.finalTree.scale.setScalar(state.completed.final?1:.72+completedCount()*.045);
}
function moveCameraToStage(index,instant=false){
  activeStageForCamera=index;
  const x=[-25,-15,-5,6,17,28][index]||-25;
  cameraTarget.set(x,1.8,0);
  if(instant){
    camera.position.set(x,7.4,11);camera.lookAt(cameraTarget);
    if(world.player)world.player.position.set(x-2.5,0,3.2);
  }
}
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(.05,clock.getDelta());
  const x=[-25,-15,-5,6,17,28][activeStageForCamera]||-25;
  const desired=new THREE.Vector3(x,7.2,11);
  camera.position.lerp(desired,1-Math.pow(.002,dt));
  cameraTarget.lerp(new THREE.Vector3(x,1.8,0),1-Math.pow(.002,dt));
  camera.lookAt(cameraTarget);
  if(world.player){
    const px=x-2.5;
    world.player.position.x=THREE.MathUtils.lerp(world.player.position.x,px,1-Math.pow(.004,dt));
    world.player.position.z=THREE.MathUtils.lerp(world.player.position.z,3.2,1-Math.pow(.004,dt));
    if(performance.now()<scratchUntil){
      world.armR.rotation.z=.8+Math.sin(performance.now()*.02)*.35;
      world.armR.rotation.x=-.7;
      world.player.rotation.y=Math.sin(performance.now()*.02)*.08;
    }else{
      world.armR.rotation.z=THREE.MathUtils.lerp(world.armR.rotation.z,.18,.12);
      world.armR.rotation.x=THREE.MathUtils.lerp(world.armR.rotation.x,0,.12);
      world.player.rotation.y=THREE.MathUtils.lerp(world.player.rotation.y,0,.12);
    }
  }
  if(world.stage1Glow)world.stage1Glow.rotation.z+=dt*.7;
  if(world.dew3)world.dew3.forEach((d,i)=>{d.position.y+=Math.sin(performance.now()*.002+i)*dt*.04});
  if(world.leaves4)world.leaves4.forEach((l,i)=>{if(l.visible)l.rotation.y=Math.sin(performance.now()*.003+i)*.15});
  if(world.clouds)world.clouds.forEach((c,i)=>{c.position.x+=dt*(.14+i*.01);if(c.position.x>45)c.position.x=-45});
  renderer.render(scene,camera);
}

function openStage(index=state.current){
  if(!isUnlocked(index)){toast('Hãy hoàn thành màn trước.');return;}
  state.current=index;save();moveCameraToStage(index);
  clearVoiceIdle();
  const s=STAGES[index];
  els.challengeTitle.textContent=s.icon+' '+s.title;
  els.challengeSub.textContent=s.subtitle;
  renderStage(index);
  els.overlay.classList.remove('hidden');
}
function closeStage(){clearVoiceIdle();stopRecordingIfNeeded();els.overlay.classList.add('hidden');}
function footer(canComplete,label='Qua màn',note='Chỉ qua màn khi bé đã tự giải và tự đọc.'){
  els.challengeFooter.innerHTML='<small>'+esc(note)+'</small><button id="completeStageBtn" class="primary" '+(canComplete?'':'disabled')+'>'+esc(label)+'</button>';
  const b=$('#completeStageBtn');if(b)b.onclick=()=>completeStage(state.current);
}
function renderStage(index){
  if(index===0)renderStage1();
  else if(index===1)renderStage2();
  else if(index===2)renderStage3();
  else if(index===3)renderStage4();
  else if(index===4)renderStage5();
  else renderFinal();
}

function renderStage1(){
  const hatDone=state.pieces.hat,nhoDone=state.pieces.nho,voice=state.voicePassed.stage1;
  els.challengeBody.innerHTML=
    '<div class="step-title"><span>1</span><div><h3>Ghép đúng tiếng “hạt”</h3><small>Không có giọng đọc mẫu. Bé tự nhìn và tự ghép.</small></div></div>'+
    '<div class="drag-zone"><div class="word-goal"><div class="drop-line">'+
      dropSlot('h','h')+'<b class="plus">+</b>'+dropSlot('at','at')+'<b class="plus">+</b>'+dropSlot('nặng','• nặng')+
    '</div></div><div class="piece-bank"><small>Kéo 3 hòn đá vào đúng ô</small><div class="pieces">'+
      piece('nặng','• nặng')+piece('h','h')+piece('at','at')+
    '</div></div></div>'+
    (hatDone?'<div class="blend-result">Con tự ghép: <b>h + at + nặng → hạt</b> 🌱</div>':'')+
    '<div class="step-title" style="margin-top:20px"><span>2</span><div><h3>Tìm đúng cấu tạo của “nhỏ”</h3><small>Nhìn tranh nhỏ và tự suy luận.</small></div></div>'+
    '<div class="choice-stones">'+
      choiceStone('nh-o-hỏi','nh + o + hỏi')+
      choiceStone('n-o-hỏi','n + o + hỏi')+
      choiceStone('nh-o-sắc','nh + o + sắc')+
    '</div>'+
    (nhoDone?'<div class="blend-result">Đúng: <b>nh + o + hỏi → nhỏ</b> ✨</div>':'')+
    (hatDone&&nhoDone?voiceGateMarkup({id:'stage1',target:'Một hạt giống nhỏ',segments:'<span class="seg-word">Một hạt giống</span> <span class="seg-onset">nh</span><span class="seg-rime">o</span><span class="seg-tone">hỏi</span>',steps:['nh + o → nho','nho + hỏi → nhỏ'],spell:'nhờ ... o ... nho ... hỏi'}):'');
  initDragPuzzle();
  $$('.choice-stone').forEach(b=>b.onclick=()=>{
    if(b.dataset.choice==='nh-o-hỏi'){state.pieces.nho=true;addCollection(['nhỏ']);save();chime();renderStage1();}
    else{b.classList.add('wrong');gentleFail();setTimeout(()=>b.classList.remove('wrong'),380);}
  });
  if(hatDone&&nhoDone)bindVoiceGate({id:'stage1',target:'Một hạt giống nhỏ',onPass:()=>{addCollection(['hạt','nhỏ']);save();renderStage1();}});
  footer(hatDone&&nhoDone&&voice,'🌱 Nhặt hạt giống','Phải ghép đúng “hạt”, chọn đúng “nhỏ” và tự đọc cụm trước khi nhặt hạt.');
}
function dropSlot(key,label){
  const filled=(key==='h'||key==='at'||key==='nặng')&&state.pieces.hat;
  return '<div class="drop-slot '+(filled?'filled':'')+'" data-expect="'+esc(key)+'">'+(filled?esc(label):'…')+'</div>';
}
function piece(key,label){return '<button class="glyph-piece '+(state.pieces.hat?'used':'')+'" data-piece="'+esc(key)+'">'+esc(label)+'</button>';}
function choiceStone(key,label){
  const correct=state.pieces.nho&&key==='nh-o-hỏi';
  return '<button class="choice-stone '+(correct?'correct':'')+'" data-choice="'+esc(key)+'">'+esc(label)+'</button>';
}
function initDragPuzzle(){
  if(state.pieces.hat)return;
  $$('.glyph-piece').forEach(p=>{
    p.addEventListener('pointerdown',e=>startPieceDrag(e,p));
  });
}
function startPieceDrag(e,pieceEl){
  e.preventDefault();dragSource=pieceEl;
  const r=pieceEl.getBoundingClientRect();
  dragGhost=pieceEl.cloneNode(true);dragGhost.classList.add('drag-ghost');dragGhost.style.width=r.width+'px';dragGhost.style.height=r.height+'px';dragGhost.style.left=(e.clientX-r.width/2)+'px';dragGhost.style.top=(e.clientY-r.height/2)+'px';
  document.body.appendChild(dragGhost);pieceEl.setPointerCapture?.(e.pointerId);
  const move=ev=>{if(dragGhost){dragGhost.style.left=(ev.clientX-r.width/2)+'px';dragGhost.style.top=(ev.clientY-r.height/2)+'px';}};
  const up=ev=>{
    window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);
    const ghost=dragGhost;dragGhost=null;if(ghost)ghost.remove();
    const under=document.elementFromPoint(ev.clientX,ev.clientY);
    const slot=under?.closest?.('.drop-slot');
    if(slot&&slot.dataset.expect===pieceEl.dataset.piece&&!slot.classList.contains('filled')){
      slot.classList.add('filled');slot.textContent=pieceEl.textContent;pieceEl.classList.add('used');pieceEl.dataset.placed='1';chime();
      const placed=$$('.glyph-piece[data-placed="1"]').length;
      if(placed===3){state.pieces.hat=true;addCollection(['hạt']);save();setTimeout(renderStage1,250);}
    }else{
      gentleFail();
    }
  };
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
}

function renderStage2(){
  const passed=state.voicePassed.stage2;
  els.challengeBody.innerHTML=
    '<div class="step-title"><span>1</span><div><h3>Cửa ải Thần Âm Thanh</h3><small>Ba tảng đá chỉ xuất hiện khi AI nghe đúng cụm.</small></div></div>'+
    '<div class="parent-note" style="margin-bottom:12px"><b>Game hoàn toàn im lặng trước khi bé đọc.</b> Bé nhìn chữ rồi tự đọc liên tục: “Bé nhặt được”.</div>'+
    voiceGateMarkup({
      id:'stage2',
      target:'Bé nhặt được',
      segments:'<span class="seg-word">Bé</span> <span class="seg-onset">nh</span><span class="seg-rime">ặt</span> <span class="seg-onset">đ</span><span class="seg-rime">ược</span>',
      steps:['nh + ăt + nặng → nhặt','đ + ươc + nặng → được'],
      spell:'nhờ ... ăt ... nhăt ... nặng. đờ ... ươc ... ược'
    })+
    (passed?'<div class="blend-result">✨ Cầu phép đã xuất hiện. Bé đã tự đọc được “Bé nhặt được”.</div>':'');
  bindVoiceGate({id:'stage2',target:'Bé nhặt được',onPass:()=>{addCollection(['nhặt','được']);save();renderStage2();}});
  footer(passed,'🪨 Bước qua cầu','Không có nút chơi lụi: phải đọc vào micro để cầu xuất hiện.');
}

function renderStage3(){
  const partsDone=state.pieces.sInitial&&state.pieces.sRime;
  const phraseDone=state.voicePassed.stage3phrase;
  const dewDone=state.voicePassed.stage3dew;
  els.challengeBody.innerHTML=
    '<div class="step-title"><span>1</span><div><h3>Tự tạo tiếng “sương”</h3><small>Chọn đúng âm đầu và vần.</small></div></div>'+
    '<div class="rime-puzzle"><div class="word-frame"><div class="word-frame-inner"><span class="word-frame-slot">'+(state.pieces.sInitial?'s':'…')+'</span><b>+</b><span class="word-frame-slot">'+(state.pieces.sRime?'ương':'…')+'</span></div></div>'+
    '<div class="floating-options"><h4>Âm đầu</h4><div class="float-list"><button class="float-choice" data-initial="s">s</button><button class="float-choice" data-initial="x">x</button></div><h4 style="margin-top:14px">Vần</h4><div class="float-list"><button class="float-choice" data-rime="ương">ương</button><button class="float-choice" data-rime="uông">uông</button><button class="float-choice" data-rime="ang">ang</button></div></div></div>'+
    (partsDone?'<div class="blend-result"><b>s + ương → sương</b>. Con đã tự phân tích đúng.</div>':'')+
    (partsDone?voiceGateMarkup({id:'stage3phrase',target:'sương sớm',segments:'<span class="seg-onset">s</span><span class="seg-rime">ương</span> <span class="seg-onset">s</span><span class="seg-rime">ơm</span><span class="seg-tone">sắc</span>',steps:['s + ương → sương','s + ơm + sắc → sớm'],spell:'sờ ... ương. sờ ... ơm ... sắc'}):'')+
    (phraseDone?dewMarkup(dewDone):'');
  $$('[data-initial]').forEach(b=>b.onclick=()=>{
    if(b.dataset.initial==='s'){state.pieces.sInitial=true;chime();save();renderStage3();}
    else{b.classList.add('wrong');gentleFail();setTimeout(()=>b.classList.remove('wrong'),350);}
  });
  $$('[data-rime]').forEach(b=>b.onclick=()=>{
    if(b.dataset.rime==='ương'){state.pieces.sRime=true;chime();save();renderStage3();}
    else{b.classList.add('wrong');gentleFail();setTimeout(()=>b.classList.remove('wrong'),350);}
  });
  if(partsDone)bindVoiceGate({id:'stage3phrase',target:'sương sớm',onPass:()=>{addCollection(['sương','sớm']);save();renderStage3();}});
  if(phraseDone&&!dewDone)bindDewChallenge();
  footer(partsDone&&phraseDone&&dewDone,'💧 Tưới mầm cây','Phải tự tạo “sương”, đọc “sương sớm”, rồi đọc “sớm” để giữ giọt sương.');
}
function dewMarkup(done){
  return '<div class="step-title" style="margin-top:20px"><span>2</span><div><h3>Giọt sương sắp rơi</h3><small>Đọc “sớm” trước khi giọt chạm lá. Nếu chậm, giọt chỉ bay lên lại — không bị phạt.</small></div></div>'+
  '<div class="dew-challenge"><div class="dew-timer" id="dewTimer">10.0 s</div><div class="dew-message">'+(done?'Đã thu được giọt sương ✨':'Giữ micro và đọc “sớm”')+'</div><div class="dew-drop" id="dewDrop"><b>sớm</b></div><div class="dew-leaf"></div></div>'+
  (done?'<div class="blend-result">💧 Giọt sương đã vào bình nước.</div>':voiceGateMarkup({id:'stage3dew',target:'sớm',compact:true,segments:'<span class="seg-onset">s</span><span class="seg-rime">ơm</span><span class="seg-tone">sắc</span>',steps:['s + ơm → sơm','sơm + sắc → sớm'],spell:'sờ ... ơm ... sắc'}));
}
function bindDewChallenge(){
  let start=performance.now(),raf;
  const drop=$('#dewDrop'),timer=$('#dewTimer');
  const tick=()=>{
    if(state.voicePassed.stage3dew)return;
    const elapsed=(performance.now()-start)/1000;
    const remain=Math.max(0,10-elapsed);
    if(timer)timer.textContent=remain.toFixed(1)+' s';
    if(drop)drop.style.top=(20+Math.min(1,elapsed/10)*105)+'px';
    if(remain<=0){start=performance.now();if(drop)drop.style.top='20px';toast('Giọt sương bay lên lại. Thử thêm lần nữa nhé!');}
    raf=requestAnimationFrame(tick);
  };raf=requestAnimationFrame(tick);
  bindVoiceGate({id:'stage3dew',target:'sớm',onPass:()=>{cancelAnimationFrame(raf);addCollection(['sớm']);save();renderStage3();}});
}

function renderStage4(){
  const words=['Lá','non','khẽ','rung','rung'];
  const allPointed=state.wand4>=words.length,passed=state.voicePassed.stage4;
  els.challengeBody.innerHTML=
    '<div class="step-title"><span>1</span><div><h3>Cây gậy phép đọc chữ</h3><small>Chỉ từng chữ theo đúng thứ tự. Chỉ tới đâu, lá sáng tới đó.</small></div></div>'+
    wandMarkup(words,state.wand4,'wand4')+
    (allPointed?voiceGateMarkup({id:'stage4',target:'Lá non khẽ rung rung',segments:'<span class="seg-word">Lá non</span> <span class="seg-onset">kh</span><span class="seg-rime">ẽ</span> <span class="seg-word">rung rung</span>',steps:['kh + e + ngã → khẽ','Sau đó nối lại cả câu'],spell:'khờ ... e ... ngã'}):'')+
    (passed?'<div class="blend-result">🍃 Lá non rung lên vì con đã tự đọc đúng câu.</div>':'');
  bindWand('wand4',words);
  if(allPointed)bindVoiceGate({id:'stage4',target:'Lá non khẽ rung rung',onPass:()=>{addCollection(['khẽ']);save();renderStage4();}});
  footer(allPointed&&passed,'🍃 Làm lá rung','Phải chỉ đúng từng chữ và tự đọc cả câu.');
}
function renderStage5(){
  const words=['Dường','như','lá','muốn','cảm','ơn','bé'];
  const allPointed=state.wand5>=words.length,passed=state.voicePassed.stage5;
  els.challengeBody.innerHTML=
    '<div class="step-title"><span>1</span><div><h3>Lời cảm ơn bí mật</h3><small>Không có gợi ý ban đầu. Con tự chỉ và đọc.</small></div></div>'+
    wandMarkup(words,state.wand5,'wand5')+
    (allPointed?voiceGateMarkup({id:'stage5',target:'Dường như lá muốn cảm ơn bé',segments:'<span class="seg-onset">D</span><span class="seg-rime">ường</span> <span class="seg-word">như lá muốn cảm ơn bé</span>',steps:['d + ương + huyền → dường','Nối lại cả câu'],spell:'dờ ... ương ... huyền'}):'')+
    (passed?'<div class="blend-result">🌼 Cây bắt đầu nở hoa. Con đã tự đọc được câu cuối.</div>':'');
  bindWand('wand5',words);
  if(allPointed)bindVoiceGate({id:'stage5',target:'Dường như lá muốn cảm ơn bé',onPass:()=>{addCollection(['dường']);save();renderStage5();}});
  footer(allPointed&&passed,'🌼 Làm cây nở hoa','Đây là màn đỉnh điểm: tự chỉ từng chữ và tự đọc cả câu.');
}
function wandMarkup(words,count,key){
  return '<div class="wand-reader"><div class="wand-words">'+words.map((w,i)=>{
    const cls=i<count?'lit':i===count?'ready':'locked';
    return '<button class="wand-word '+cls+'" data-wand="'+esc(key)+'" data-i="'+i+'" '+(i>count?'disabled':'')+'>'+esc(w)+'</button>';
  }).join('')+'</div><div class="wand-help">🪄 Chạm chữ đang viền vàng, vừa chạm vừa đọc chữ đó thành tiếng.</div></div>';
}
function bindWand(key,words){
  $$('[data-wand="'+key+'"]').forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.i);
    if(i!==state[key])return;
    state[key]++;chime();save();
    if(key==='wand4')updateWorldFromState();
    if(key==='wand5')updateWorldFromState();
    key==='wand4'?renderStage4():renderStage5();
  });
}

function renderFinal(){
  const doneCount=FINAL_SENTENCES.filter((_,i)=>state.finalRead[i]).length;
  if(doneCount===FINAL_SENTENCES.length){
    renderSummary();return;
  }
  els.challengeBody.innerHTML=
    '<div class="step-title"><span>🏆</span><div><h3>Đọc trọn câu chuyện</h3><small>Mỗi câu là một cánh hoa. Không có giọng đọc mẫu.</small></div></div>'+
    '<div class="final-reading">'+FINAL_SENTENCES.map((s,i)=>
      '<section class="final-sentence '+(state.finalRead[i]?'done':'')+'"><div class="final-sentence-head"><b>Câu '+(i+1)+'</b><small>'+(state.finalRead[i]?'✅ Đã tự đọc':'Chưa mở')+'</small></div><p>'+esc(s)+'</p>'+(state.finalRead[i]?'':'<button class="secondary final-open" data-final="'+i+'">🎙️ Đọc câu này</button>')+'</section>'
    ).join('')+'</div>'+
    '<div id="finalVoiceArea"></div>';
  $$('[data-final]').forEach(b=>b.onclick=()=>openFinalVoice(Number(b.dataset.final)));
  footer(false,'🏆 Hoàn thành','Phải tự đọc đủ 5 câu. Cây chỉ nở hoa khi toàn bài đã được đọc.');
}
function openFinalVoice(i){
  const area=$('#finalVoiceArea');
  area.innerHTML=voiceGateMarkup({
    id:'final'+i,
    target:FINAL_SENTENCES[i],
    segments:'<span class="seg-word">'+esc(FINAL_SENTENCES[i])+'</span>',
    steps:['Nếu vấp, tìm đúng tiếng khó trong câu rồi tách âm đầu + vần + thanh.','Đọc lại cả câu sau khi xử lý tiếng khó.'],
    spell:finalSpellAid(i)
  });
  area.scrollIntoView({behavior:'smooth',block:'center'});
  bindVoiceGate({id:'final'+i,target:FINAL_SENTENCES[i],onPass:()=>{
    state.finalRead[i]=true;save();chime();if(Object.values(state.finalRead).filter(Boolean).length>=5){renderSummary();}else renderFinal();
  }});
}
function finalSpellAid(i){
  return [
    'đờ ... ương ... huyền. hờ ... at ... nặng',
    'nhờ ... ăt ... nặng. đờ ... ươc ... nặng. xờ ... uông ... sắc',
    'vờ ... ươn. uông ... sắc. sờ ... ương. sờ ... ơm ... sắc',
    'khờ ... e ... ngã. rờ ... ung',
    'dờ ... ương ... huyền'
  ][i]||'Tách âm đầu ... vần ... thanh';
}
function renderSummary(){
  addCollection(['hạt','nhỏ','nhặt','được','sương','sớm','khẽ','dường']);save();
  const name=state.childName.trim()||'Con';
  els.challengeBody.innerHTML=
    '<div class="summary"><div class="summary-tree">🌳✨</div><h2>Khu vườn đã nở hoa!</h2><p><b>'+esc(name)+'</b> đã tự ghép chữ và tự đọc để đi hết câu chuyện.</p>'+
    '<div class="summary-card"><b>📚 Từ con đã tự đọc được</b><div class="summary-words">'+['hạt','nhỏ','nhặt','được','sương','sớm','khẽ','dường'].map(w=>'<span>'+w+'</span>').join('')+'</div><p>Hôm nay '+esc(name.toLowerCase()==='con'?'con':name)+' đã tự mình đánh vần/đọc được <b>8 từ trọng tâm</b> và đọc trọn 5 câu.</p></div>'+
    '<div class="summary-card"><b>🧠 Ôn cách quãng</b><p>Ngày 1: Bé uống nước. · Con đường rất dài.<br>Ngày 3: Em ngủ trên giường. · Sáng sớm có sương.<br>Ngày 7: Cây vươn cao trong vườn. · Những giọt sương còn trên lá.</p></div></div>';
  footer(true,'🏆 Kết thúc bài','Chơi xong cũng chính là học xong: ghép chữ → tự đọc → đọc cả câu → hiểu bài.');
  const b=$('#completeStageBtn');if(b)b.onclick=()=>{if(!state.completed.final){state.completed.final=true;save();celebrate();chime();}closeStage();updateWorldFromState();};
}

function voiceGateMarkup({id,target,segments,steps,spell,compact=false}){
  const passed=!!state.voicePassed[id];
  const sc=Math.max(0,Number(state.scaffold[id]||0));
  const attempts=Number(state.attempts[id]||0);
  const heard=state.voicePassed[id+'_heard']||'';
  return '<section class="voice-gate" data-gate="'+esc(id)+'" data-target="'+esc(target)+'" data-spell="'+encodeURIComponent(spell||'')+'">'+
    '<div class="voice-gate-head"><b>🎙️ Mở khóa bằng giọng nói</b><span>'+(passed?'✅ Đã mở':'Không có giọng đọc mẫu')+'</span></div>'+
    '<div class="read-target">'+esc(target)+'</div>'+
    (passed?'<div class="blend-result">AI đã nhận ra câu con đọc. Cửa đã mở ✨</div>':
      '<div class="mic-row"><button class="mic-button" type="button"><div><span>🎙️</span><small>GIỮ ĐỂ ĐỌC</small></div></button><div class="voice-status"><b>Giữ nút micro và tự đọc to</b><small>Thả tay khi đọc xong. Giọng nói chỉ được dùng để chấm lần này, không lưu trong game.</small><div class="wave"><i></i><i></i><i></i><i></i><i></i></div></div></div>')+
    (heard?'<div class="ai-heard">AI nghe được: <b>'+esc(heard)+'</b></div>':'')+
    (!passed&&sc>0?scaffoldMarkup(sc,segments,steps,spell,id):'')+
    (!passed&&attempts>0?'<div class="ai-heard">Đã thử '+attempts+' lần. Không sao, mình dùng thêm một gợi ý nhỏ.</div>':'')+
  '</section>';
}
function scaffoldMarkup(level,segments,steps,spell,id){
  let html='<div class="scaffold"><div class="scaffold-title">💡 Gợi ý tầng '+level+'</div>';
  if(level>=1)html+='<div class="color-segments">'+segments+'</div>';
  if(level>=2)html+='<div class="spell-steps">'+steps.map((s,i)=>'<div class="spell-step">'+(i+1)+'. '+esc(s)+'</div>').join('')+'</div>';
  if(level>=3)html+='<button class="secondary spell-audio" data-spell-audio="'+esc(id)+'">🔊 Nghe từng mảnh đánh vần</button>';
  return html+'</div>';
}
function bindVoiceGate({id,target,onPass}){
  const gate=$('[data-gate="'+id+'"]');if(!gate||state.voicePassed[id])return;
  const mic=$('.mic-button',gate);if(!mic)return;
  mic.onpointerdown=e=>{e.preventDefault();startRecording(id,target,onPass,mic);};
  const stop=e=>{e?.preventDefault();if(recordingGate===id)stopRecording();};
  mic.onpointerup=stop;mic.onpointercancel=stop;mic.onpointerleave=e=>{if(e.buttons===1)stop(e);};
  const spellBtn=$('[data-spell-audio="'+id+'"]',gate);
  if(spellBtn)spellBtn.onclick=()=>playSpellAid(decodeURIComponent(gate.dataset.spell||''));
  clearVoiceIdle();
  voiceIdleTimer=setTimeout(()=>{
    if(!state.voicePassed[id]&&Number(state.scaffold[id]||0)<1){
      state.scaffold[id]=1;save();
      rerenderCurrentStage();
      toast('Mình tách màu chữ ra một chút nhé.');
    }
  },5000);
}
function clearVoiceIdle(){if(voiceIdleTimer){clearTimeout(voiceIdleTimer);voiceIdleTimer=null;}}
async function startRecording(id,target,onPass,mic){
  clearVoiceIdle();
  if(recordingGate)return;
  if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){
    toast('Trình duyệt này chưa hỗ trợ ghi âm. Hãy dùng Chrome/Edge/Safari mới.');
    return;
  }
  try{
    recordStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    const types=['audio/webm;codecs=opus','audio/webm','audio/mp4'];
    const type=types.find(t=>MediaRecorder.isTypeSupported?.(t))||'';
    recorder=type?new MediaRecorder(recordStream,{mimeType:type}):new MediaRecorder(recordStream);
    recordChunks=[];recordingGate=id;
    recorder.ondataavailable=e=>{if(e.data?.size)recordChunks.push(e.data);};
    recorder.onstop=()=>submitRecording(id,target,onPass,recorder.mimeType||type||'audio/webm');
    recorder.start();
    mic.classList.add('recording');
    const st=$('.voice-status b',mic.closest('.voice-gate'));if(st)st.textContent='Đang nghe... đọc xong thì thả tay';
  }catch(e){
    toast('Cần cho phép micro để qua cửa đọc.');
    recordingGate=null;
  }
}
function stopRecording(){
  if(!recorder||recorder.state==='inactive')return;
  const gateId=recordingGate;
  const mic=$('[data-gate="'+gateId+'"] .mic-button');if(mic)mic.classList.remove('recording');
  recorder.stop();
}
function stopRecordingIfNeeded(){
  try{if(recorder&&recorder.state!=='inactive')recorder.stop();}catch(e){}
  if(recordStream){recordStream.getTracks().forEach(t=>t.stop());recordStream=null;}
  recordingGate=null;
}
async function submitRecording(id,target,onPass,mime){
  const blob=new Blob(recordChunks,{type:mime});
  if(recordStream){recordStream.getTracks().forEach(t=>t.stop());recordStream=null;}
  recorder=null;recordingGate=null;recordChunks=[];
  const gate=$('[data-gate="'+id+'"]'),status=gate?$('.voice-status b',gate):null;
  if(blob.size<1000){if(status)status.textContent='Chưa nghe rõ. Giữ micro lâu hơn một chút.';gentleFail();return;}
  if(status)status.textContent='AI đang kiểm tra câu con vừa đọc...';
  try{
    const fd=new FormData();
    const ext=mime.includes('mp4')?'m4a':'webm';
    fd.append('audio',blob,'reading.'+ext);fd.append('target',target);fd.append('gateId',id);
    const res=await fetch(COACH_API,{method:'POST',body:fd,cache:'no-store'});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||'Không kiểm tra được giọng đọc.');
    state.voicePassed[id+'_heard']=data.transcript||'';
    if(data.passed){
      state.voicePassed[id]=true;
      chime('good');
      save();
      onPass?.(data);
    }else{
      state.attempts[id]=Number(state.attempts[id]||0)+1;
      state.scaffold[id]=Math.min(3,Math.max(1,Number(state.scaffold[id]||0)+1));
      save();gentleFail();toast('Chưa mở. Mình thử lại với một gợi ý nhỏ nhé.');
      rerenderCurrentStage();
    }
  }catch(e){
    if(status)status.textContent='Không kết nối được bộ kiểm tra giọng nói. Hãy thử lại.';
    toast('Lỗi kiểm tra micro. Không tính là đọc sai.');
  }
}
async function playSpellAid(text){
  if(!text)return;
  toast('Đang mở gợi ý đánh vần từng mảnh...');
  try{
    const r=await fetch(COACH_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'spell',text}),cache:'no-store'});
    if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.error||'Không tạo được gợi ý âm thanh');}
    const blob=await r.blob(),url=URL.createObjectURL(blob),audio=new Audio(url);
    audio.onended=()=>URL.revokeObjectURL(url);await audio.play();
  }catch(e){toast('Chưa phát được gợi ý âm thanh.');}
}
function rerenderCurrentStage(){renderStage(state.current);}

function renderParent(){
  els.parentBody.innerHTML=
    '<div class="parent-grid"><section class="parent-card"><h3>👧 Tên hiển thị</h3><p>Dùng ở màn tổng kết. Không bắt buộc.</p><input id="childName" type="text" maxlength="20" placeholder="Ví dụ: Bé An" value="'+esc(state.childName)+'"><button id="saveName" class="secondary">Lưu tên</button></section>'+
    '<section class="parent-card"><h3>🎙️ Kiểm tra giọng nói</h3><p>Game gửi đoạn ghi âm tạm thời tới bộ nhận diện để đối chiếu với chữ mục tiêu. Game không lưu file giọng nói vào localStorage hay Supabase Storage.</p><button id="micTest" class="secondary">Kiểm tra quyền micro</button><div id="micTestStatus"></div></section>'+
    '<section class="parent-card"><h3>🔊 Âm thanh</h3><p>Chỉ có hiệu ứng thưởng và gợi ý đánh vần ở tầng 3. Không có đọc mẫu cả từ/câu trước khi bé tự đọc.</p><button id="toggleSound" class="secondary">'+(state.sound?'Tắt âm thanh':'Bật âm thanh')+'</button></section>'+
    '<section class="parent-card"><h3>♻️ Tiến độ</h3><p>Xóa để chơi lại bài từ đầu.</p><button id="resetGame" class="secondary">Làm lại toàn bộ bài</button></section></div>';
  $('#saveName').onclick=()=>{state.childName=$('#childName').value.trim();save();toast('Đã lưu tên.');};
  $('#toggleSound').onclick=()=>{state.sound=!state.sound;save();renderParent();};
  $('#micTest').onclick=async()=>{
    const st=$('#micTestStatus');st.textContent='Đang xin quyền micro...';
    try{const s=await navigator.mediaDevices.getUserMedia({audio:true});s.getTracks().forEach(t=>t.stop());st.textContent='✓ Micro sẵn sàng.';}catch(e){st.textContent='Chưa có quyền micro. Hãy cho phép trong trình duyệt.';}
  };
  $('#resetGame').onclick=()=>{if(confirm('Xóa toàn bộ tiến độ bài Hạt giống nhỏ?')){localStorage.removeItem(STORAGE);state=defaultState();save();closeParent();moveCameraToStage(0);toast('Đã làm lại bài.');}};
}

els.openStage.onclick=()=>openStage(state.current);
els.closeChallenge.onclick=closeStage;
els.overlay.onclick=e=>{if(e.target===els.overlay)closeStage();};
els.parentBtn.onclick=()=>{renderParent();els.parent.classList.remove('hidden');};
els.parentClose.onclick=closeParent;
els.parent.onclick=e=>{if(e.target===els.parent)closeParent();};
els.soundBtn.onclick=()=>{state.sound=!state.sound;save();};
function closeParent(){els.parent.classList.add('hidden');}
els.start.onclick=()=>{
  state.introSeen=true;save();
  els.intro.classList.add('hidden');
  moveCameraToStage(state.current);
  setTimeout(()=>openStage(state.current),650);
};

init3D();
renderHUD();
setTimeout(()=>els.loading.classList.add('hide'),700);
if(state.introSeen)els.intro.classList.add('hidden');
