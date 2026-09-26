import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const L=window.TV1_LESSON;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const STORAGE_KEY='vuiHocTiengViet:hatGiongNho:game3d:v1';
const IMAGE_API='https://npkekrjzebsjfaizfcyb.supabase.co/functions/v1/vietnamese-lesson-images';
const IMAGE_OWNER_PREFIX='vuiHocTiengViet:imageOwner:';
const CLOUD_SLOT='warmup-main';
const CLOUD_KEY=String(L.id||'tv1-hat-giong-nho').replace(/-v\d+$/,'')+':'+CLOUD_SLOT;
const DEFAULT_IMAGE='./assets/hat-giong-nho.jpg?v=20260926';

const missions=[
  {id:'warmup',title:'Cổng tò mò',short:'Nhìn tranh và đoán câu chuyện',icon:'🌱',zone:'Cổng khu vườn'},
  {id:'map',title:'Bản đồ dấu vết',short:'Nhận ra chỗ dễ, chỗ khó',icon:'🗺️',zone:'Đài quan sát'},
  {id:'unlock',title:'Hang khóa chữ',short:'Phá khóa 8 tiếng khó',icon:'🔐',zone:'Hang chữ'},
  {id:'rimes',title:'Vườn họ vần',short:'Tìm quy luật thay vì học thuộc',icon:'🧩',zone:'Vườn vần'},
  {id:'quick',title:'Cầu Ghép Tiếng',short:'Tự ghép âm + vần + thanh để mở đường',icon:'🪨',zone:'Cầu đá chữ'},
  {id:'sentences',title:'Cổng Giọng Đọc',short:'Tự nhìn chữ, tự đọc to để mở khóa',icon:'🎙️',zone:'Cổng âm thanh'},
  {id:'full',title:'Cây Gậy Phép',short:'Chỉ từng chữ rồi tự đọc cả câu',icon:'✨',zone:'Nhà truyện'},
  {id:'comprehension',title:'Hồ gương hiểu bài',short:'Đọc → hình dung → hiểu',icon:'💡',zone:'Hồ gương'},
  {id:'final',title:'Đỉnh cây tri thức',short:'Đọc từ khó trong ngữ cảnh mới',icon:'🏆',zone:'Đỉnh cây'},
  {id:'review',title:'Hạt giống thức giấc',short:'Ôn cuối buổi và ngày 1–3–7',icon:'🧠',zone:'Trái tim khu vườn'}
];

const stationPositions=[
  new THREE.Vector3(-10,0,10),
  new THREE.Vector3(-4,0,14),
  new THREE.Vector3(4,0,14),
  new THREE.Vector3(10,0,10),
  new THREE.Vector3(13,0,3),
  new THREE.Vector3(11,0,-5),
  new THREE.Vector3(5,0,-11),
  new THREE.Vector3(-3,0,-13),
  new THREE.Vector3(-10,0,-9),
  new THREE.Vector3(-13,0,-1)
];

const els={
  canvas:$('#game3d'),
  loading:$('#loadingScreen'),
  progressText:$('#gameProgressText'),
  progressBar:$('#gameProgressBar'),
  starText:$('#gameStarText'),
  questTitle:$('#questTitle'),
  questDesc:$('#questDesc'),
  questMeta:$('#questMeta'),
  questGo:$('#questGo'),
  interact:$('#interactPrompt'),
  action:$('#mobileAction'),
  modal:$('#missionModal'),
  missionSheet:$('#missionSheet'),
  missionClose:$('#missionClose'),
  missionBody:$('#missionBody'),
  missionTitle:$('#missionTitle'),
  missionDesc:$('#missionDesc'),
  missionEyebrow:$('#missionEyebrow'),
  missionFooter:$('#missionFooter'),
  intro:$('#introModal'),
  startGame:$('#startGame'),
  parentModal:$('#parentModal'),
  parentClose:$('#parentClose'),
  parentBody:$('#parentBody'),
  settingsBtn:$('#settingsBtn'),
  soundBtn:$('#soundBtn'),
  joystick:$('#joystickZone'),
  joystickKnob:$('#joystickKnob'),
  toast:$('#gameToast')
};

function defaults(){
  return {
    completed:{},
    missionData:{
      warmupDone:false,
      mapDone:false,
      unlockStatus:{},
      unlockHints:{},
      rimeDone:{},
      quickAnswers:{},
      assembly:{},
      voiceGates:{},
      voiceAttempts:{},
      sentenceStatus:{},
      sentenceHints:{},
      activeSentenceHint:'',
      pointerProgress:{},
      fullPass1:false,
      fullPass2:false,
      comprehension:{},
      match:{},
      final:{},
      reviewSeen:false
    },
    stars:0,
    sound:true,
    introSeen:false,
    currentMission:0
  };
}

function loadState(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    const d=defaults();
    return {
      ...d,
      ...raw,
      completed:{...d.completed,...(raw.completed||{})},
      missionData:{
        ...d.missionData,
        ...(raw.missionData||{}),
        unlockStatus:{...(raw.missionData?.unlockStatus||{})},
        unlockHints:{...(raw.missionData?.unlockHints||{})},
        rimeDone:{...(raw.missionData?.rimeDone||{})},
        quickAnswers:{...(raw.missionData?.quickAnswers||{})},
        assembly:{...(raw.missionData?.assembly||{})},
        voiceGates:{...(raw.missionData?.voiceGates||{})},
        voiceAttempts:{...(raw.missionData?.voiceAttempts||{})},
        sentenceStatus:{...(raw.missionData?.sentenceStatus||{})},
        sentenceHints:{...(raw.missionData?.sentenceHints||{})},
        pointerProgress:{...(raw.missionData?.pointerProgress||{})},
        comprehension:{...(raw.missionData?.comprehension||{})},
        match:{...(raw.missionData?.match||{})},
        final:{...(raw.missionData?.final||{})}
      }
    };
  }catch(e){return defaults();}
}

let state=loadState();
let scene,camera,renderer,clock,player,playerGroup,playerShadow;
let stationMeshes=[],stationLabels=[],nextStationIndex=0,nearStation=-1;
let centralPlant,plantLeaves=[],plantFlowers=[],worldStarted=false;
let keys={};
let moveVector=new THREE.Vector2();
let joystickVector=new THREE.Vector2();
let autoTarget=null;
let raycaster=new THREE.Raycaster();
let pointer=new THREE.Vector2();
let clouds=[],fireflies=[],butterflies=[];
let soundCtx=null;

function saveState(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  updateHUD();
  updateWorldProgress();
}

function completedCount(){
  return missions.filter(m=>state.completed[m.id]).length;
}

function progressPercent(){
  return Math.round(completedCount()/missions.length*100);
}

function esc(s){
  return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function toast(msg){
  if(!els.toast)return;
  els.toast.textContent=msg;
  els.toast.classList.add('show');
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>els.toast.classList.remove('show'),1800);
}

function chime(kind='ok'){
  if(!state.sound)return;
  try{
    soundCtx=soundCtx||new (window.AudioContext||window.webkitAudioContext)();
    const now=soundCtx.currentTime;
    const freqs=kind==='complete'?[523,659,784]:kind==='bad'?[220,180]:[440,554];
    freqs.forEach((f,i)=>{
      const o=soundCtx.createOscillator();
      const g=soundCtx.createGain();
      o.type='sine';o.frequency.value=f;
      g.gain.setValueAtTime(0,now+i*.08);
      g.gain.linearRampToValueAtTime(.08,now+i*.08+.02);
      g.gain.exponentialRampToValueAtTime(.001,now+i*.08+.28);
      o.connect(g);g.connect(soundCtx.destination);
      o.start(now+i*.08);o.stop(now+i*.08+.3);
    });
  }catch(e){}
}

function updateHUD(){
  const p=progressPercent();
  els.progressText.textContent=p+'%';
  els.progressBar.style.width=p+'%';
  els.starText.textContent='⭐ '+Number(state.stars||0);
  els.soundBtn.textContent=state.sound?'🔊':'🔇';
  nextStationIndex=Math.min(missions.length-1,missions.findIndex(m=>!state.completed[m.id])===-1?missions.length-1:missions.findIndex(m=>!state.completed[m.id]));
  const q=missions[nextStationIndex];
  els.questTitle.textContent=q.title;
  els.questDesc.textContent=q.short;
  els.questGo.disabled=false;
  els.questGo.textContent=state.completed[q.id]?'Xem nhiệm vụ':'Đi tới nhiệm vụ';
}

function isUnlocked(index){
  if(index===0)return true;
  return missions.slice(0,index).every(m=>state.completed[m.id]);
}

function missionIndex(id){return missions.findIndex(m=>m.id===id);}

function completeMission(id,stars=2){
  if(!state.completed[id]){
    state.completed[id]=true;
    state.stars+=stars;
    chime('complete');
    confetti();
  }
  saveState();
}

function confetti(){
  const layer=document.createElement('div');
  layer.style.cssText='position:fixed;inset:0;z-index:120;pointer-events:none;overflow:hidden';
  const chars=['⭐','✨','🌱','🌼','💚'];
  for(let i=0;i<28;i++){
    const s=document.createElement('span');
    s.textContent=chars[i%chars.length];
    s.style.cssText=`position:absolute;left:${5+Math.random()*90}%;top:-20px;font-size:${16+Math.random()*18}px;animation:fall ${1.2+Math.random()*.8}s ease-in forwards;animation-delay:${Math.random()*.25}s`;
    layer.appendChild(s);
  }
  const style=document.createElement('style');
  style.textContent='@keyframes fall{to{transform:translateY(105vh) rotate(480deg);opacity:.1}}';
  layer.appendChild(style);
  document.body.appendChild(layer);
  setTimeout(()=>layer.remove(),2200);
}

function makeCanvasLabel(text,sub,locked=false){
  const c=document.createElement('canvas');c.width=512;c.height=160;
  const ctx=c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);
  ctx.fillStyle=locked?'rgba(35,48,43,.76)':'rgba(255,255,255,.93)';
  roundRect(ctx,12,12,488,136,28);ctx.fill();
  ctx.strokeStyle=locked?'rgba(255,255,255,.16)':'rgba(66,139,96,.28)';ctx.lineWidth=4;
  roundRect(ctx,12,12,488,136,28);ctx.stroke();
  ctx.fillStyle=locked?'#e0e6e2':'#1e4f39';ctx.font='700 34px system-ui';ctx.textAlign='center';
  ctx.fillText(text,256,70);
  ctx.fillStyle=locked?'#aab5af':'#6b7b72';ctx.font='500 20px system-ui';
  ctx.fillText(sub,256,108);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false});
  const sp=new THREE.Sprite(mat);sp.scale.set(5.4,1.7,1);return sp;
}

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
}

function mat(color,rough=.8,metal=.05){
  return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
}

function addGround(){
  const ground=new THREE.Mesh(new THREE.CircleGeometry(30,64),mat(0x86c77d,1,0));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);

  const inner=new THREE.Mesh(new THREE.CircleGeometry(16.5,64),mat(0x99d58d,1,0));
  inner.rotation.x=-Math.PI/2;inner.position.y=.01;inner.receiveShadow=true;scene.add(inner);

  const pathMat=mat(0xd7b27a,1,0);
  for(let i=0;i<stationPositions.length;i++){
    const p=stationPositions[i];
    const tile=new THREE.Mesh(new THREE.CylinderGeometry(1.45,1.55,.12,24),pathMat);
    tile.position.set(p.x,.06,p.z);tile.receiveShadow=true;scene.add(tile);
  }
  const ring=new THREE.Mesh(new THREE.RingGeometry(13.7,15.2,64),pathMat);
  ring.rotation.x=-Math.PI/2;ring.position.y=.02;scene.add(ring);

  const centerPatch=new THREE.Mesh(new THREE.CircleGeometry(4.8,48),mat(0x74b96d,1,0));
  centerPatch.rotation.x=-Math.PI/2;centerPatch.position.y=.025;scene.add(centerPatch);

  for(let i=0;i<90;i++){
    const g=new THREE.Mesh(new THREE.ConeGeometry(.06+Math.random()*.04,.26+Math.random()*.26,5),mat(i%4===0?0x5a9d55:0x69ad61));
    const a=Math.random()*Math.PI*2,r=17+Math.random()*11;
    g.position.set(Math.cos(a)*r,.13,Math.sin(a)*r);g.rotation.y=Math.random()*6.28;scene.add(g);
  }
}

function addTrees(){
  const treeGroup=new THREE.Group();
  for(let i=0;i<28;i++){
    const a=i/28*Math.PI*2+(Math.random()-.5)*.12;
    const r=22+Math.random()*5;
    const h=2.8+Math.random()*2.4;
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.24,.34,h,8),mat(0x8a6847,1,0));
    trunk.position.y=h/2;
    const crown=new THREE.Group();
    const greens=[0x4d9855,0x5ca861,0x70b66a];
    for(let j=0;j<3;j++){
      const blob=new THREE.Mesh(new THREE.IcosahedronGeometry(1.35+Math.random()*.45,1),mat(greens[(i+j)%greens.length],.95,0));
      blob.scale.y=.85+Math.random()*.2;
      blob.position.set((j-1)*.65,h-.15+Math.random()*.45,(Math.random()-.5)*.6);
      blob.castShadow=true;crown.add(blob);
    }
    const t=new THREE.Group();t.add(trunk,crown);t.position.set(Math.cos(a)*r,0,Math.sin(a)*r);t.rotation.y=-a+.4;treeGroup.add(t);
  }
  scene.add(treeGroup);
}

function addFlowers(){
  const colors=[0xffcf5a,0xff8a9b,0x8cc7ff,0xffffff,0xc89cff];
  for(let i=0;i<80;i++){
    const a=Math.random()*Math.PI*2,r=5.5+Math.random()*15;
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.018,.025,.34,5),mat(0x4e9a58));
    stem.position.set(Math.cos(a)*r,.17,Math.sin(a)*r);
    const flower=new THREE.Mesh(new THREE.SphereGeometry(.09,7,6),mat(colors[i%colors.length],.7,0));
    flower.position.set(stem.position.x,.39,stem.position.z);
    scene.add(stem,flower);
  }
}

function addPond(){
  const pond=new THREE.Mesh(new THREE.CircleGeometry(3.2,40),new THREE.MeshPhysicalMaterial({color:0x69bde5,roughness:.18,metalness:.05,transparent:true,opacity:.82}));
  pond.rotation.x=-Math.PI/2;pond.position.set(-7,.04,-5);scene.add(pond);
  for(let i=0;i<10;i++){
    const lily=new THREE.Mesh(new THREE.CircleGeometry(.28+Math.random()*.14,14),mat(0x4f9e59));
    lily.rotation.x=-Math.PI/2;lily.position.set(-7+(Math.random()-.5)*4,.065,-5+(Math.random()-.5)*3);scene.add(lily);
  }
}

function addClouds(){
  for(let i=0;i<7;i++){
    const g=new THREE.Group();
    for(let j=0;j<4;j++){
      const m=new THREE.Mesh(new THREE.SphereGeometry(.9+Math.random()*.5,12,9),new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:.75}));
      m.position.set(j*.8,(j%2)*.3,(Math.random()-.5)*.35);g.add(m);
    }
    g.position.set(-20+i*7,10+Math.random()*3,-18-Math.random()*9);g.scale.setScalar(1+Math.random()*.8);scene.add(g);clouds.push(g);
  }
}

function addButterflies(){
  for(let i=0;i<8;i++){
    const g=new THREE.Group();
    const wingMat=new THREE.MeshBasicMaterial({color:[0xffd15c,0xff8ea0,0x7ac6ff,0xc6a3ff][i%4],side:THREE.DoubleSide});
    const w1=new THREE.Mesh(new THREE.CircleGeometry(.12,8),wingMat);w1.scale.set(1,.6,1);w1.rotation.y=.7;
    const w2=w1.clone();w2.rotation.y=-.7;w1.position.x=-.09;w2.position.x=.09;
    g.add(w1,w2);g.position.set((Math.random()-.5)*20,1.2+Math.random()*2,(Math.random()-.5)*20);scene.add(g);butterflies.push({g,phase:Math.random()*6.28});
  }
}

function createPlayer(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.38,.9,6,12),mat(0xf3c93f,.8,0));body.position.y=1.05;body.castShadow=true;
  const head=new THREE.Mesh(new THREE.SphereGeometry(.34,16,12),mat(0xffd1a8,.9,0));head.position.y=1.88;head.castShadow=true;
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.36,14,10),mat(0x26353d,.95,0));hair.scale.y=.55;hair.position.set(0,2.08,-.02);
  const legMat=mat(0x5e84aa,.85,0);
  const l1=new THREE.Mesh(new THREE.CylinderGeometry(.12,.13,.62,8),legMat);l1.position.set(-.16,.42,0);
  const l2=l1.clone();l2.position.x=.16;
  const armMat=mat(0xffd1a8,.9,0);
  const a1=new THREE.Mesh(new THREE.CylinderGeometry(.07,.08,.62,8),armMat);a1.position.set(-.48,1.18,0);a1.rotation.z=-.2;
  const a2=a1.clone();a2.position.x=.48;a2.rotation.z=.2;
  [l1,l2,a1,a2].forEach(x=>x.castShadow=true);
  g.add(body,head,hair,l1,l2,a1,a2);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.55,20),new THREE.MeshBasicMaterial({color:0x284b38,transparent:true,opacity:.18}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;scene.add(shadow);playerShadow=shadow;
  g.position.copy(stationPositions[0]).add(new THREE.Vector3(0,0,-2.6));scene.add(g);playerGroup=g;player=g;
}

function createStation(index){
  const p=stationPositions[index];
  const g=new THREE.Group();
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.78,.92,.38,12),mat(0x8c7659,.9,.05));base.position.y=.19;base.castShadow=true;base.receiveShadow=true;
  const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.58,0),new THREE.MeshStandardMaterial({color:0xb9c4bd,emissive:0x111111,roughness:.3,metalness:.18}));
  crystal.position.y=1.08;crystal.rotation.y=.5;crystal.castShadow=true;crystal.userData.stationIndex=index;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.9,.055,8,28),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35}));
  ring.rotation.x=Math.PI/2;ring.position.y=.08;
  g.add(base,crystal,ring);g.position.copy(p);scene.add(g);
  g.userData={index,crystal,ring,base};
  stationMeshes.push(g);
  const label=makeCanvasLabel((index+1)+'. '+missions[index].title,missions[index].zone,!isUnlocked(index));
  label.position.set(p.x,2.9,p.z);scene.add(label);stationLabels.push(label);
}

function createCentralPlant(){
  const g=new THREE.Group();
  const soil=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.7,.35,28),mat(0x9b6d4a,.95,0));soil.position.y=.18;soil.receiveShadow=true;g.add(soil);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.15,.23,4.2,10),mat(0x4e9d5f,.85,0));stem.position.y=2.2;stem.castShadow=true;g.add(stem);
  for(let i=0;i<10;i++){
    const leaf=new THREE.Mesh(new THREE.SphereGeometry(.65,12,8),mat(i%2?0x5eae68:0x72bf73,.9,0));
    leaf.scale.set(1.3,.42,.72);
    const y=.85+i*.34;
    const side=i%2===0?1:-1;
    leaf.position.set(side*(.58+.06*i),y,(i%3-.8)*.28);
    leaf.rotation.z=side*.5;leaf.rotation.y=i*.4;leaf.visible=false;leaf.castShadow=true;g.add(leaf);plantLeaves.push(leaf);
  }
  for(let i=0;i<6;i++){
    const flower=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),mat([0xffd45f,0xff91a3,0x8fd2ff][i%3],.75,0));
    flower.position.set(Math.cos(i)*1.15,3.6+Math.sin(i*1.7)*.45,Math.sin(i)*1.15);flower.visible=false;g.add(flower);plantFlowers.push(flower);
  }
  g.position.set(0,0,0);scene.add(g);centralPlant=g;
}

function setupLights(){
  scene.add(new THREE.HemisphereLight(0xeaf7ff,0x617f4f,2.0));
  const sun=new THREE.DirectionalLight(0xfff4cf,2.35);sun.position.set(-12,20,8);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-28;sun.shadow.camera.right=28;sun.shadow.camera.top=28;sun.shadow.camera.bottom=-28;scene.add(sun);
}

function initWorld(){
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0xa7dce9);
  scene.fog=new THREE.Fog(0xa7dce9,30,62);
  camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,100);
  camera.position.set(0,8,10);
  renderer=new THREE.WebGLRenderer({canvas:els.canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight,false);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  clock=new THREE.Clock();
  setupLights();addGround();addTrees();addFlowers();addPond();addClouds();addButterflies();
  createCentralPlant();stationPositions.forEach((_,i)=>createStation(i));createPlayer();
  window.addEventListener('resize',onResize);
  window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);
  renderer.domElement.addEventListener('pointerdown',onWorldPointer);
  setupJoystick();
  updateWorldProgress();
  animate();
}

function updateWorldProgress(){
  if(!stationMeshes.length)return;
  stationMeshes.forEach((g,i)=>{
    const done=!!state.completed[missions[i].id],unlocked=isUnlocked(i);
    const crystal=g.userData.crystal;
    if(done){
      crystal.material.color.set(0x55d889);crystal.material.emissive.set(0x1c6b3a);crystal.material.emissiveIntensity=.8;
      g.userData.ring.material.color.set(0x7ff0a8);g.userData.ring.material.opacity=.8;
    }else if(unlocked){
      crystal.material.color.set(0xffd86a);crystal.material.emissive.set(0x9a6216);crystal.material.emissiveIntensity=.55;
      g.userData.ring.material.color.set(0xffdf82);g.userData.ring.material.opacity=.72;
    }else{
      crystal.material.color.set(0xaab5af);crystal.material.emissive.set(0x111111);crystal.material.emissiveIntensity=.08;
      g.userData.ring.material.color.set(0xbcc5bf);g.userData.ring.material.opacity=.26;
    }
    if(stationLabels[i]){scene.remove(stationLabels[i]);stationLabels[i].material.map.dispose();stationLabels[i].material.dispose();}
    const label=makeCanvasLabel((i+1)+'. '+missions[i].title,done?'Hoàn thành':unlocked?'Sẵn sàng':'Chưa mở khóa',!unlocked);
    label.position.set(stationPositions[i].x,2.9,stationPositions[i].z);scene.add(label);stationLabels[i]=label;
  });

  const count=completedCount();
  plantLeaves.forEach((l,i)=>l.visible=i<count);
  plantFlowers.forEach((f,i)=>f.visible=count>=6+i);
  if(centralPlant){
    const s=.62+count*.043;centralPlant.scale.set(s,s,s);
  }
}

function onResize(){
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight,false);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
}

function onKeyDown(e){
  keys[e.code]=true;
  if((e.code==='KeyE'||e.code==='Space')&&nearStation>=0&&!els.modal.classList.contains('hidden')===false){
    e.preventDefault();openMission(nearStation);
  }
  if(e.code==='Escape'){
    closeMission();closeParent();
  }
}
function onKeyUp(e){keys[e.code]=false;}

function setupJoystick(){
  if(!els.joystick)return;
  let active=false,origin={x:0,y:0};
  const move=(clientX,clientY)=>{
    const dx=clientX-origin.x,dy=clientY-origin.y,max=34;
    const len=Math.hypot(dx,dy)||1,scale=Math.min(1,max/len);
    const x=dx*scale,y=dy*scale;
    els.joystickKnob.style.transform=`translate(${x}px,${y}px)`;
    joystickVector.set(x/max,-y/max);
  };
  els.joystick.addEventListener('pointerdown',e=>{active=true;els.joystick.setPointerCapture(e.pointerId);const r=els.joystick.getBoundingClientRect();origin={x:r.left+r.width/2,y:r.top+r.height/2};move(e.clientX,e.clientY);});
  els.joystick.addEventListener('pointermove',e=>{if(active)move(e.clientX,e.clientY);});
  const end=()=>{active=false;joystickVector.set(0,0);els.joystickKnob.style.transform='translate(0,0)';};
  els.joystick.addEventListener('pointerup',end);els.joystick.addEventListener('pointercancel',end);
  els.action.onclick=()=>{if(nearStation>=0)openMission(nearStation);};
}

function onWorldPointer(e){
  if(!els.modal.classList.contains('hidden')||!els.parentModal.classList.contains('hidden')||!els.intro.classList.contains('hidden'))return;
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const crystals=stationMeshes.map(s=>s.userData.crystal);
  const hit=raycaster.intersectObjects(crystals,false)[0];
  if(hit){
    const idx=hit.object.userData.stationIndex;
    if(isUnlocked(idx)){autoTarget=stationPositions[idx].clone();autoTarget.z+=1.7;toast('Đang đi tới '+missions[idx].title);}
    else toast('Hãy hoàn thành nhiệm vụ trước để mở khu vực này.');
  }
}

function updatePlayer(dt){
  if(!playerGroup)return;
  moveVector.set(0,0);
  if(keys.KeyW||keys.ArrowUp)moveVector.y+=1;
  if(keys.KeyS||keys.ArrowDown)moveVector.y-=1;
  if(keys.KeyA||keys.ArrowLeft)moveVector.x-=1;
  if(keys.KeyD||keys.ArrowRight)moveVector.x+=1;
  moveVector.add(joystickVector);
  let moving=false,dir=new THREE.Vector3();
  if(autoTarget){
    dir.copy(autoTarget).sub(playerGroup.position);dir.y=0;
    const d=dir.length();
    if(d<.45){autoTarget=null;}
    else{dir.normalize();moving=true;}
  }else if(moveVector.lengthSq()>.02){
    moveVector.normalize();
    const camForward=new THREE.Vector3();camera.getWorldDirection(camForward);camForward.y=0;camForward.normalize();
    const camRight=new THREE.Vector3(camForward.z,0,-camForward.x);
    dir.copy(camForward).multiplyScalar(moveVector.y).add(camRight.multiplyScalar(moveVector.x)).normalize();moving=true;
  }

  if(moving){
    const speed=5.1;
    playerGroup.position.addScaledVector(dir,speed*dt);
    const maxR=18.5;
    const r=Math.hypot(playerGroup.position.x,playerGroup.position.z);
    if(r>maxR){playerGroup.position.x*=maxR/r;playerGroup.position.z*=maxR/r;}
    const targetRot=Math.atan2(dir.x,dir.z);
    playerGroup.rotation.y=lerpAngle(playerGroup.rotation.y,targetRot,Math.min(1,dt*9));
    const walk=Math.sin(performance.now()*.012)*.035;playerGroup.position.y=Math.abs(walk);
  }else playerGroup.position.y=THREE.MathUtils.lerp(playerGroup.position.y,0,.15);
  playerShadow.position.set(playerGroup.position.x,.012,playerGroup.position.z);

  let nearest=-1,dist=99;
  stationPositions.forEach((p,i)=>{
    const d=Math.hypot(playerGroup.position.x-p.x,playerGroup.position.z-p.z);
    if(d<dist){dist=d;nearest=i;}
  });
  nearStation=(dist<2.45&&isUnlocked(nearest))?nearest:-1;
  els.interact.classList.toggle('show',nearStation>=0);
  els.action.disabled=nearStation<0;
  if(nearStation>=0)els.interact.innerHTML='<kbd>E</kbd> '+missions[nearStation].title;
  els.questMeta.textContent=nearStation>=0?'Đã tới '+missions[nearStation].zone:'Cách nhiệm vụ tiếp theo '+distanceToNext().toFixed(1)+' m';
}

function distanceToNext(){
  const p=stationPositions[nextStationIndex]||stationPositions[0];
  return Math.hypot(playerGroup.position.x-p.x,playerGroup.position.z-p.z);
}

function lerpAngle(a,b,t){
  let d=(b-a+Math.PI)%(Math.PI*2)-Math.PI;return a+d*t;
}

function updateCamera(dt){
  const offset=new THREE.Vector3(0,6.7,8.8);
  const targetPos=playerGroup.position.clone().add(offset);
  camera.position.lerp(targetPos,1-Math.pow(.001,dt));
  const look=playerGroup.position.clone().add(new THREE.Vector3(0,1.1,0));
  camera.lookAt(look);
}

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(.05,clock.getDelta());
  if(worldStarted){
    updatePlayer(dt);updateCamera(dt);
    stationMeshes.forEach((s,i)=>{
      s.userData.crystal.rotation.y+=dt*(.65+i*.03);
      s.userData.crystal.position.y=1.08+Math.sin(performance.now()*.0018+i)*.08;
      s.userData.ring.rotation.z+=dt*.35;
    });
    clouds.forEach((c,i)=>{c.position.x+=dt*(.18+.02*i);if(c.position.x>28)c.position.x=-28;});
    butterflies.forEach((b,i)=>{
      b.phase+=dt*(1.2+i*.04);b.g.position.y+=Math.sin(b.phase*2)*dt*.08;
      b.g.position.x+=Math.cos(b.phase)*dt*.12;b.g.position.z+=Math.sin(b.phase*.7)*dt*.12;b.g.rotation.y=b.phase;
    });
  }
  renderer.render(scene,camera);
}

function missionReady(index){
  return isUnlocked(index);
}

function openMission(index){
  if(!missionReady(index)){toast('Khu vực này chưa mở khóa.');return;}
  autoTarget=null;
  state.currentMission=index;saveState();
  const m=missions[index];
  els.missionEyebrow.textContent='NHIỆM VỤ '+(index+1)+' / '+missions.length+' · '+m.zone.toUpperCase();
  els.missionTitle.textContent=m.icon+' '+m.title;
  els.missionDesc.textContent=m.short;
  renderMission(index);
  els.modal.classList.remove('hidden');
}

function closeMission(){els.modal.classList.add('hidden');}

function setMissionFooter({canComplete=true,label='Hoàn thành nhiệm vụ',note='Không thưởng cho tốc độ. Chỉ hoàn thành khi con tự làm được.'}={}){
  els.missionFooter.innerHTML=`<span class="mission-footer-note">${esc(note)}</span><button id="missionDoneBtn" class="mission-done" ${canComplete?'':'disabled'}>${esc(label)}</button>`;
  const b=$('#missionDoneBtn');
  if(b)b.onclick=()=>{
    const idx=state.currentMission,m=missions[idx];
    if(!canComplete)return;
    completeMission(m.id,idx===2||idx===5?3:2);
    closeMission();
    if(idx<missions.length-1){
      nextStationIndex=idx+1;
      autoTarget=stationPositions[idx+1].clone().add(new THREE.Vector3(0,0,1.7));
      toast('Đã mở '+missions[idx+1].title+'!');
    }
  };
}

async function getCloudImageUrl(){
  try{
    const r=await fetch(IMAGE_API+'?slot='+encodeURIComponent(CLOUD_KEY)+'&_='+Date.now(),{cache:'no-store'});
    if(!r.ok)return DEFAULT_IMAGE;
    const d=await r.json();return d?.url||DEFAULT_IMAGE;
  }catch(e){return DEFAULT_IMAGE;}
}

function imageBox(id='missionStoryImage'){
  return `<div class="story-image"><img id="${id}" src="${DEFAULT_IMAGE}" alt="Bạn nhỏ chăm mầm cây trong vườn"></div>`;
}
async function hydrateMissionImage(id){
  const img=$('#'+id);if(img)img.src=await getCloudImageUrl();
}

function renderMission(index){
  const id=missions[index].id;
  if(id==='warmup')renderWarmupMission();
  else if(id==='map')renderMapMission();
  else if(id==='unlock')renderUnlockMission();
  else if(id==='rimes')renderRimeMission();
  else if(id==='quick')renderQuickMission();
  else if(id==='sentences')renderSentenceMission();
  else if(id==='full')renderFullMission();
  else if(id==='comprehension')renderComprehensionMission();
  else if(id==='final')renderFinalMission();
  else renderReviewMission();
}

function renderWarmupMission(){
  const d=state.missionData;
  els.missionBody.innerHTML=`<div class="warmup-mission">${imageBox()}<div class="prompt-stack">${L.warmup.prompts.map((q,i)=>`<div class="prompt-card"><span>${i+1}</span><b>${esc(q)}</b></div>`).join('')}</div></div>
    <div class="parent-note"><b>👨‍👩‍👧 Vai trò bố/mẹ:</b> chỉ hỏi, không sửa câu trả lời. Sau 2–3 câu nói: <b>“Mình đọc xem chuyện thật sự xảy ra thế nào nhé.”</b></div>
    <button id="warmupTalked" class="secondary-btn" style="margin-top:12px">${d.warmupDone?'✓ Đã trò chuyện xong':'Đã trò chuyện xong'}</button>`;
  hydrateMissionImage();
  $('#warmupTalked').onclick=()=>{d.warmupDone=true;saveState();renderWarmupMission();};
  setMissionFooter({canComplete:d.warmupDone});
}

function renderMapMission(){
  const d=state.missionData;
  const chips=(arr)=>arr.map(w=>`<span class="word-chip">${esc(w)}</span>`).join('');
  els.missionBody.innerHTML=`<div class="difficulty-grid">
    <section class="difficulty-card easy"><h3>🟢 Dễ</h3><div class="word-cloud">${chips(L.difficulty.easy)}</div></section>
    <section class="difficulty-card attn"><h3>🟡 Cần chú ý</h3><div class="word-cloud">${chips(L.difficulty.attention)}</div></section>
    <section class="difficulty-card key"><h3>🔴 Tiếng khóa</h3><div class="word-cloud">${chips(L.difficulty.key)}</div></section>
  </div>
  <div class="gap-ribbon"><b>Lỗ hổng chính của bài này</b><span>ương / ường</span><span>ươn / ườn</span><span>uông / uống</span><span>ươc / ược</span><p>Không học thuộc từng từ. Mục tiêu là nhận ra cấu trúc để gặp từ mới vẫn tự ghép được.</p></div>
  <button id="mapUnderstood" class="secondary-btn" style="margin-top:12px">${d.mapDone?'✓ Đã hiểu chiến lược':'Đã hiểu chiến lược'}</button>`;
  $('#mapUnderstood').onclick=()=>{d.mapDone=true;saveState();renderMapMission();};
  setMissionFooter({canComplete:d.mapDone});
}

function unlockCard(item,index){
  const d=state.missionData,level=Number(d.unlockHints[item.word]||0),status=d.unlockStatus[item.word]||'';
  return `<article class="unlock-card" data-word="${esc(item.word)}">
    <div class="unlock-top"><div><div class="unlock-word">${esc(item.word)}</div><div class="unlock-family">${esc(item.family)}</div></div><span>${status==='self'?'✅':status==='help'?'⚠️':'🔒'}</span></div>
    <div class="unlock-hints">${level?item.hints.slice(0,level).map((h,i)=>`<div class="unlock-hint"><span>B${i+1}</span><b>${esc(h)}</b></div>`).join(''):'<div class="unlock-hint"><span>B1</span><b>Cho con 5 giây tự đọc trước. Chưa mở đáp án.</b></div>'}</div>
    <div class="unlock-actions">
      <button class="hint-more" ${level>=item.hints.length?'disabled':''}>${level>=item.hints.length?'Đã mở hết':'Gợi ý tiếp theo'}</button>
      <button class="good mark-self">✅ Tự đọc được</button>
      <button class="help mark-help">⚠️ Cần trợ giúp</button>
    </div>
    ${status?`<div class="return-context"><b>Đưa trở lại ngữ cảnh:</b><span>${esc(item.phrase)}</span><span>${esc(item.sentence)}</span><br><small>Kiểm tra khái quát: ${item.transfer.map(esc).join(' · ')}</small></div>`:''}
  </article>`;
}

function renderUnlockMission(){
  const d=state.missionData;
  els.missionBody.innerHTML=`<div class="parent-note"><b>Quy tắc:</b> Tự đọc → tìm vần → tách → ghép. <b>Dừng gợi ý ngay</b> khi con tự tìm ra.</div>
    <div class="unlock-grid" style="margin-top:12px">${L.keyWords.map(unlockCard).join('')}</div>`;
  $$('.unlock-card').forEach(card=>{
    const word=card.dataset.word,item=L.keyWords.find(x=>x.word===word);
    $('.hint-more',card).onclick=()=>{d.unlockHints[word]=Math.min(item.hints.length,Number(d.unlockHints[word]||0)+1);saveState();renderUnlockMission();};
    $('.mark-self',card).onclick=()=>{const old=d.unlockStatus[word];d.unlockStatus[word]='self';if(old!=='self')state.stars++;saveState();chime();renderUnlockMission();};
    $('.mark-help',card).onclick=()=>{d.unlockStatus[word]='help';saveState();renderUnlockMission();};
  });
  const tried=Object.keys(d.unlockStatus).length;
  setMissionFooter({canComplete:tried>=5,note:`Đã thử ${tried}/8 tiếng. Không cần hoàn hảo mới được đi tiếp; lỗi còn lại sẽ săn lại cuối bài.`});
}

function renderRimeMission(){
  const d=state.missionData;
  els.missionBody.innerHTML=`<div class="parent-note"><b>Chỉ luyện rất ngắn.</b> Nếu con yếu một cấu trúc, sửa đúng chỗ rồi quay lại bài đọc.</div>
    <div class="rime-grid" style="margin-top:12px">${L.rimeDrills.map((g,i)=>`<section class="rime-house ${d.rimeDone[i]?'done':''}" data-i="${i}"><h3>🏠 ${esc(g.title)}</h3><div class="rime-words">${g.words.map(w=>`<span>${esc(w)}</span>`).join('')}</div><button class="secondary-btn rime-done">${d.rimeDone[i]?'✓ Đã luyện':'Đã luyện một lượt'}</button></section>`).join('')}</div>
    <div class="gap-ribbon"><b>Điểm cần phân biệt</b><span><b>ươn</b> kết thúc bằng n</span><span><b>ương</b> kết thúc bằng ng</span></div>`;
  $$('.rime-house').forEach(card=>$('.rime-done',card).onclick=()=>{d.rimeDone[card.dataset.i]=true;saveState();chime();renderRimeMission();});
  setMissionFooter({canComplete:Object.keys(d.rimeDone).length>=2,note:'Chỉ cần luyện đúng những nhà vần con còn yếu.'});
}


const ASSEMBLY_PUZZLES=[
  {id:'hat',word:'hạt',context:'Nhặt hạt giống',parts:{onset:'h',rime:'at',tone:'nặng'},options:{onset:['h','nh','t'],rime:['at','ăt','an'],tone:['nặng','sắc','hỏi']}},
  {id:'nho',word:'nhỏ',context:'Tìm bông hoa nhỏ',parts:{onset:'nh',rime:'o',tone:'hỏi'},options:{onset:['n','nh','ng'],rime:['o','ô','ơ'],tone:['hỏi','sắc','ngã']}},
  {id:'duoc',word:'được',context:'Mở cổng vào vườn',parts:{onset:'đ',rime:'ươc',tone:'nặng'},options:{onset:['d','đ','t'],rime:['ươc','ương','uông'],tone:['nặng','huyền','sắc']}},
  {id:'suong',word:'sương',context:'Gom giọt sương',parts:{onset:'s',rime:'ương',tone:'ngang'},options:{onset:['s','x','r'],rime:['ương','uông','ươn'],tone:['ngang','sắc','huyền']}}
];

const VOICE_GATES=[
  {id:'gate2',label:'Mở cầu đá',target:'Bé nhặt được',note:'Câu 2 · đọc nối 3 tiếng'},
  {id:'dew',label:'Giữ giọt sương',target:'sương sớm',note:'Câu 3 · phân biệt s/x'},
  {id:'line4',label:'Làm lá rung',target:'Lá non khẽ rung rung',note:'Câu 4 · tự đọc cả câu'},
  {id:'line5',label:'Làm cây nở hoa',target:'Dường như lá muốn cảm ơn bé',note:'Câu 5 · tự đọc cả câu'}
];

function normalizeSpeech(s){
  return String(s||'').toLowerCase().normalize('NFC').replace(/[.,;:!?“”"()…]/g,' ').replace(/\s+/g,' ').trim();
}
function foldVietnamese(s){
  return normalizeSpeech(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
}
function speechMatches(transcript,target){
  const a=normalizeSpeech(transcript),b=normalizeSpeech(target);
  if(a===b||a.includes(b))return true;
  const af=foldVietnamese(a),bf=foldVietnamese(b);
  return af===bf||af.includes(bf);
}
function speechSupported(){
  return !!(window.SpeechRecognition||window.webkitSpeechRecognition);
}
function startSpeechCheck(target,onResult,onFail){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){onFail(new Error('Trình duyệt này chưa hỗ trợ nhận diện giọng nói.'));return;}
  const rec=new SR();
  rec.lang='vi-VN';rec.interimResults=false;rec.maxAlternatives=5;rec.continuous=false;
  let finished=false;
  rec.onresult=e=>{
    finished=true;
    const alts=[];
    for(let i=0;i<e.results[0].length;i++)alts.push(e.results[0][i].transcript||'');
    const ok=alts.some(t=>speechMatches(t,target));
    onResult({ok,transcript:alts[0]||'',alternatives:alts});
  };
  rec.onerror=e=>{if(!finished)onFail(new Error(e.error||'Không nhận được giọng nói.'));};
  rec.onend=()=>{if(!finished)onFail(new Error('Chưa nghe rõ. Hãy thử lại.'));};
  try{rec.start();}catch(e){onFail(e);}
}

function assemblyCard(p){
  const d=state.missionData,sel=d.assembly[p.id]?.selected||{},done=!!d.assembly[p.id]?.done;
  const slot=(key,label)=>`<div class="build-slot ${sel[key]?'filled':''}" data-drop-group="${key}"><small>${label}</small><strong>${esc(sel[key]||'...')}</strong></div>`;
  const choiceGroup=(key,label)=>`<div class="stone-group"><small>${label}</small><div>${p.options[key].map(v=>`<button class="stone-piece" draggable="true" data-piece-group="${key}" data-piece-value="${encodeURIComponent(v)}">${esc(v)}</button>`).join('')}</div></div>`;
  return `<section class="assembly-card ${done?'done':''}" data-puzzle="${p.id}">
    <div class="assembly-head"><div><span>🪨 ${esc(p.context)}</span><h3>${done?'✅ '+esc(p.word):'Tự ghép tiếng để hành động'}</h3></div><b class="assembly-target">${done?esc(p.word):'?'}</b></div>
    <div class="build-equation">${slot('onset','Âm đầu')}<b>+</b>${slot('rime','Vần')}<b>+</b>${slot('tone','Thanh')}</div>
    <div class="stone-bank">${choiceGroup('onset','Chọn âm đầu')}${choiceGroup('rime','Chọn vần')}${choiceGroup('tone','Chọn thanh')}</div>
    <div class="assembly-feedback">${done?'Con đã tự ghép đúng. Game chỉ xác nhận sau khi con hoàn thành.':'Kéo hòn đá vào ô, hoặc chạm hòn đá rồi chạm ô.'}</div>
  </section>`;
}

function checkAssembly(p){
  const d=state.missionData,entry=d.assembly[p.id]||{selected:{}},s=entry.selected||{};
  const complete=['onset','rime','tone'].every(k=>s[k]);
  if(!complete)return false;
  const ok=s.onset===p.parts.onset&&s.rime===p.parts.rime&&s.tone===p.parts.tone;
  if(ok&&!entry.done){
    entry.done=true;state.stars++;chime();confetti();toast('Tự ghép đúng: '+p.word+'!');
  }
  entry.wrong=!ok;d.assembly[p.id]=entry;saveState();return ok;
}

function setAssemblyPiece(puzzleId,group,value){
  const d=state.missionData,p=ASSEMBLY_PUZZLES.find(x=>x.id===puzzleId);
  const entry=d.assembly[puzzleId]||{selected:{},done:false};entry.selected=entry.selected||{};
  entry.selected[group]=value;entry.wrong=false;d.assembly[puzzleId]=entry;saveState();
  checkAssembly(p);renderQuickMission();
}

function bindAssembly(){
  let tapped=null;
  $$('.assembly-card').forEach(card=>{
    const puzzleId=card.dataset.puzzle;
    $$('.stone-piece',card).forEach(btn=>{
      btn.addEventListener('dragstart',e=>{
        e.dataTransfer.setData('text/plain',JSON.stringify({puzzleId,group:btn.dataset.pieceGroup,value:decodeURIComponent(btn.dataset.pieceValue)}));
      });
      btn.onclick=()=>{tapped={puzzleId,group:btn.dataset.pieceGroup,value:decodeURIComponent(btn.dataset.pieceValue)};$$('.stone-piece').forEach(x=>x.classList.remove('picked'));btn.classList.add('picked');};
    });
    $$('.build-slot',card).forEach(slot=>{
      slot.addEventListener('dragover',e=>e.preventDefault());
      slot.addEventListener('drop',e=>{
        e.preventDefault();try{const data=JSON.parse(e.dataTransfer.getData('text/plain'));if(data.puzzleId===puzzleId&&data.group===slot.dataset.dropGroup)setAssemblyPiece(data.puzzleId,data.group,data.value);}catch(err){}
      });
      slot.onclick=()=>{if(tapped&&tapped.puzzleId===puzzleId&&tapped.group===slot.dataset.dropGroup)setAssemblyPiece(tapped.puzzleId,tapped.group,tapped.value);};
    });
  });
}

function voiceGateCard(g){
  const d=state.missionData,done=!!d.voiceGates[g.id],attempts=Number(d.voiceAttempts[g.id]||0);
  return `<section class="voice-gate ${done?'done':''}" data-gate="${g.id}">
    <div class="voice-gate-icon">${done?'✅':'🎙️'}</div>
    <div class="voice-gate-copy"><small>${esc(g.note)}</small><h3>${esc(g.target)}</h3><p>${done?'Cổng đã mở. Con đã tự đọc trước khi nhận xác nhận.':'Game không đọc mẫu. Con nhìn chữ rồi tự đọc to vào micro.'}</p></div>
    <div class="voice-gate-actions">
      ${done?'<span class="voice-success">Đã mở khóa</span>':`<button class="voice-start" type="button">🎙️ Giữ cổng & đọc</button>${(!speechSupported()||attempts>=3)?'<button class="parent-confirm" type="button">👨‍👩‍👧 Bố/mẹ xác nhận đọc đúng</button>':''}`}
    </div>
    <div class="voice-feedback" data-feedback="${g.id}">${attempts&&!done?'Đã thử '+attempts+' lần. Nếu máy nhận sai nhiều lần, bố/mẹ có thể xác nhận.':''}</div>
  </section>`;
}

function bindVoiceGates(rerender){
  $$('.voice-gate').forEach(card=>{
    const id=card.dataset.gate,g=VOICE_GATES.find(x=>x.id===id),d=state.missionData;
    const start=$('.voice-start',card);
    if(start)start.onclick=()=>{
      const feedback=$('[data-feedback="'+id+'"]',card);
      start.disabled=true;start.textContent='🎙️ Đang nghe...';feedback.textContent='Con tự nhìn chữ và đọc ngay bây giờ.';
      startSpeechCheck(g.target,res=>{
        d.voiceAttempts[id]=Number(d.voiceAttempts[id]||0)+1;
        if(res.ok){
          d.voiceGates[id]=true;state.stars++;saveState();chime('complete');confetti();toast('Cổng mở! Con tự đọc được rồi.');rerender();
        }else{
          saveState();chime('bad');feedback.textContent='Máy nghe thành: “'+(res.transcript||'...')+'”. Không sao, thử lại. Game chưa đọc đáp án.';start.disabled=false;start.textContent='🎙️ Thử đọc lại';
          if(d.voiceAttempts[id]>=3)rerender();
        }
      },err=>{
        d.voiceAttempts[id]=Number(d.voiceAttempts[id]||0)+1;saveState();feedback.textContent=err.message;start.disabled=false;start.textContent='🎙️ Thử lại';
        if(d.voiceAttempts[id]>=3||!speechSupported())rerender();
      });
    };
    const confirm=$('.parent-confirm',card);
    if(confirm)confirm.onclick=()=>{d.voiceGates[id]=true;state.stars++;saveState();chime();toast('Bố/mẹ đã xác nhận con tự đọc đúng.');rerender();};
  });
}

function wandSentence(index){
  const d=state.missionData,words=uniqueWords(L.story.sentences[index].text),progress=Number(d.pointerProgress[index]||0);
  return `<section class="wand-sentence" data-line="${index}"><div class="wand-head"><span>✨ Cây gậy phép · Câu ${index+1}</span><b>${progress>=words.length?'Đã chỉ hết chữ':'Chỉ từ trái sang phải'}</b></div>
    <div class="wand-words">${words.map((w,i)=>`<button class="wand-word ${i<progress?'lit':''} ${i===progress?'next':''}" data-word-index="${i}" type="button">${esc(w)}</button>`).join('')}</div>
    <small>Chạm từng chữ theo đúng thứ tự và <b>tự đọc chữ đó</b>. Game không phát âm mẫu.</small></section>`;
}

function bindWand(){
  $$('.wand-sentence').forEach(card=>{
    const idx=Number(card.dataset.line),d=state.missionData,words=uniqueWords(L.story.sentences[idx].text);
    $$('.wand-word',card).forEach(btn=>btn.onclick=()=>{
      const wi=Number(btn.dataset.wordIndex),expected=Number(d.pointerProgress[idx]||0);
      if(wi!==expected){toast('Hãy chỉ từ trái sang phải.');return;}
      d.pointerProgress[idx]=Math.min(words.length,expected+1);saveState();chime();renderFullMission();
    });
  });
}

function renderQuickMission(){
  const d=state.missionData;
  els.missionBody.innerHTML=`<div class="parent-note"><b>Không có giọng đọc mẫu.</b> Muốn nhân vật tiếp tục, con phải tự ghép đúng âm đầu + vần + thanh. Sau khi ghép đúng game mới xác nhận bằng hiệu ứng.</div>
    <div class="assembly-grid" style="margin-top:12px">${ASSEMBLY_PUZZLES.map(assemblyCard).join('')}</div>`;
  bindAssembly();
  const done=ASSEMBLY_PUZZLES.filter(p=>d.assembly[p.id]?.done).length;
  setMissionFooter({canComplete:done===ASSEMBLY_PUZZLES.length,note:`Đã tự ghép ${done}/${ASSEMBLY_PUZZLES.length} tiếng. Không thể qua cầu bằng cách nghe rồi lặp lại.`});
}

function tokenize(text){
  return String(text).toLowerCase().normalize('NFC').replace(/[.,;:!?“”"()…]/g,' ').split(/\s+/).filter(Boolean);
}
function uniqueWords(text){return [...new Set(tokenize(text))];}
function predictedWords(text){
  const tokens=tokenize(text),out=[];
  [...L.keyWords.map(k=>k.word),...L.difficulty.attention].forEach(w=>{if(tokens.includes(w.toLowerCase())&&!out.includes(w))out.push(w)});
  return out;
}
function genericHints(word){return ['Cho con 5 giây tự đọc tiếng “'+word+'”.','Hỏi: “Con nhìn thấy vần nào?”','Tách phụ âm đầu + vần.','Xác định thanh rồi ghép lại.','Đọc lại cả cụm chứa tiếng “'+word+'”.'];}

function hintPanel(sentenceIndex,word){
  const d=state.missionData,key=sentenceIndex+'::'+word;
  if(d.activeSentenceHint!==key)return '';
  const item=L.keyWords.find(k=>k.word===word),hints=item?item.hints:genericHints(word),level=Math.max(1,Number(d.sentenceHints[key]||1));
  return `<div class="hint-box" data-key="${esc(key)}"><h4>🔐 Phá khóa: ${esc(word)}</h4><div class="hint-steps">${hints.slice(0,level).map((h,i)=>`<div><span>B${i+1}</span><b>${esc(h)}</b></div>`).join('')}</div>
    <div class="hint-actions">${level<hints.length?'<button class="secondary-btn hint-next">Gợi ý tiếp theo →</button>':'<span>Đã mở hết gợi ý.</span>'}<button class="secondary-btn hint-solved">✅ Con tự đọc ra rồi</button></div></div>`;
}

function sentenceBlock(item,index){
  const d=state.missionData,status=d.sentenceStatus[index]||'',watch=predictedWords(item.text),words=uniqueWords(item.text);
  return `<section class="sentence-mission ${status}" data-i="${index}"><div class="sentence-title"><b>Câu ${index+1}</b><span>${status==='ok'?'✅ Đọc được':status==='help'?'⚠️ Có vấp':'Chưa đọc'}</span></div>
    <div class="sentence-chunks">${item.chunks.map((c,i)=>`<span>${esc(c)}</span>${i<item.chunks.length-1?'<i>/</i>':''}`).join('')}</div>
    ${watch.length?`<div class="sentence-watch">${watch.map(w=>`<button data-watch="${esc(w)}">${esc(w)}</button>`).join('')}</div>`:''}
    ${status==='help'?`<div class="stumble-picker"><b>Con vấp ở tiếng nào?</b><small>Chạm đúng tiếng để mở gợi ý từng bước.</small><div class="stumble-list">${words.map(w=>`<button data-watch="${esc(w)}">${esc(w)}</button>`).join('')}</div></div>`:''}
    ${words.map(w=>hintPanel(index,w)).join('')}
    <div class="sentence-status-actions"><button data-status="ok">✅ Con đọc được câu</button><button data-status="help">⚠️ Con bị vấp</button></div>
    ${status?`<div class="parent-note"><b>${esc(item.check)}</b><div style="margin-top:7px"><button class="secondary-btn reveal-answer">Xem đáp án sau khi con nói</button><span class="answer hidden" style="margin-left:8px"><b>${esc(item.answer)}</b></span></div></div>`:''}
  </section>`;
}

function renderSentenceMission(){
  const d=state.missionData;
  els.missionBody.innerHTML=`<div class="parent-note"><b>Voice Gate:</b> game giữ im lặng. Con phải nhìn chữ và tự đọc to. Nhận diện giọng nói chỉ dùng để kiểm tra từ/cụm đã đọc, không phát mẫu trước.</div>
    <div class="voice-gate-list" style="margin-top:12px">${VOICE_GATES.map(voiceGateCard).join('')}</div>
    <div class="speech-note">💡 Nhận diện giọng trẻ em có thể sai dù con đọc đúng. Sau 3 lần máy nghe sai, nút <b>Bố/mẹ xác nhận</b> sẽ xuất hiện để tránh làm con nản.</div>`;
  bindVoiceGates(renderSentenceMission);
  const done=VOICE_GATES.filter(g=>d.voiceGates[g.id]).length;
  setMissionFooter({canComplete:done===VOICE_GATES.length,note:`Đã mở ${done}/${VOICE_GATES.length} cổng bằng giọng đọc. Không có điểm thưởng cho đọc nhanh.`});
}

function renderFullMission(){
  const d=state.missionData;
  const w4=uniqueWords(L.story.sentences[3].text).length,w5=uniqueWords(L.story.sentences[4].text).length;
  els.missionBody.innerHTML=`<div class="reading-card"><h3>${esc(L.story.title)}</h3>${imageBox('fullStoryImage')}
    <div class="wand-zone"><h4>✨ Đỉnh điểm: Cây gậy phép</h4><p>Hai câu cuối không còn gợi ý. Con chỉ từng chữ từ trái sang phải và tự đọc. Chỉ tới đâu, chữ sáng tới đó.</p>${wandSentence(3)}${wandSentence(4)}</div>
    <div class="reading-text">${L.fullText.map(s=>`<p>${esc(s)}</p>`).join('')}</div>
    <div class="reading-passes"><button id="fullPass1" class="reading-pass ${d.fullPass1?'done':''}"><b>1. Lượt 1: Đọc đúng</b><small>Tự giải mã khi gặp tiếng lạ.</small></button><button id="fullPass2" class="reading-pass ${d.fullPass2?'done':''}"><b>2. Lượt 2: Đọc liền mạch</b><small>Chỉ làm nếu con vẫn còn tập trung.</small></button></div></div>`;
  hydrateMissionImage('fullStoryImage');bindWand();
  $('#fullPass1').onclick=()=>{d.fullPass1=true;saveState();chime();renderFullMission();};
  $('#fullPass2').onclick=()=>{d.fullPass2=true;saveState();chime();renderFullMission();};
  const wandDone=Number(d.pointerProgress[3]||0)>=w4&&Number(d.pointerProgress[4]||0)>=w5;
  setMissionFooter({canComplete:d.fullPass1&&wandDone,note:wandDone?'Hai câu cuối đã được chỉ và tự đọc. Lượt 1 toàn bài là đủ để qua màn.':'Hãy dùng Cây gậy phép chỉ hết hai câu cuối trước.'});
}

function renderComprehensionMission(){
  const d=state.missionData;
  els.missionBody.innerHTML=`<div class="comprehension-grid">${L.comprehension.map((q,i)=>`<section class="comp-item" data-i="${i}"><b>${i+1}. ${esc(q.prompt)}</b><div class="comp-choices">${q.choices.map(c=>{const ch=d.comprehension[i],cls=ch===c?(c===q.answer?'correct':'wrong'):'';return `<button class="comp-choice ${cls}" data-c="${encodeURIComponent(c)}">${esc(c)}</button>`}).join('')}</div></section>`).join('')}</div>
    <h3 class="match-title">Ghép đúng như trong sách</h3><div class="match-grid"><div class="match-col">${L.matching.map((x,i)=>`<button class="match-btn match-left" data-i="${i}">${esc(x.left)}</button>`).join('')}</div><div class="match-col">${[...L.matching].reverse().map(x=>`<button class="match-btn match-right" data-v="${encodeURIComponent(x.right)}">${esc(x.right)}</button>`).join('')}</div></div>`;
  $$('.comp-item').forEach(card=>{const i=Number(card.dataset.i),q=L.comprehension[i];$$('.comp-choice',card).forEach(b=>b.onclick=()=>{const c=decodeURIComponent(b.dataset.c);d.comprehension[i]=c;c===q.answer?chime():chime('bad');saveState();renderComprehensionMission();});});
  let selected=null;
  $$('.match-left').forEach(b=>b.onclick=()=>{$$('.match-left').forEach(x=>x.classList.remove('selected'));selected=Number(b.dataset.i);b.classList.add('selected')});
  $$('.match-right').forEach(b=>b.onclick=()=>{if(selected===null){toast('Chọn bên trái trước.');return;}const v=decodeURIComponent(b.dataset.v),want=L.matching[selected].right;if(v===want){d.match[selected]=true;chime();b.classList.add('correct');$$('.match-left')[selected].classList.add('correct');selected=null;saveState();}else{chime('bad');b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),450)}});
  const correct=L.comprehension.filter((q,i)=>d.comprehension[i]===q.answer).length;
  setMissionFooter({canComplete:correct>=3,note:`Đúng ${correct}/4. Mục tiêu là hiểu ý, không cần trả lời y nguyên câu trong sách.`});
}

function renderFinalMission(){
  const d=state.missionData;
  els.missionBody.innerHTML=`<div class="parent-note"><b>Đây là kiểm tra thật.</b> Không hỏi lại đúng câu cũ. Con phải dùng cấu trúc đã học trong ngữ cảnh mới.</div><div class="final-stack" style="margin-top:12px">${L.finalChallenge.map((s,i)=>`<div class="final-row ${d.final[i]||''}" data-i="${i}"><span>${i+1}</span><b>${esc(s)}</b><div class="final-actions"><button data-v="self">✅ Tự đọc</button><button data-v="help">⚠️ Cần gợi ý</button></div></div>`).join('')}</div>`;
  $$('.final-row').forEach(row=>$$('[data-v]',row).forEach(b=>b.onclick=()=>{const i=Number(row.dataset.i),old=d.final[i];d.final[i]=b.dataset.v;if(b.dataset.v==='self'&&old!=='self'){state.stars++;chime()}saveState();renderFinalMission();}));
  const tried=Object.keys(d.final).length;
  setMissionFooter({canComplete:tried>=4,note:`Đã thử ${tried}/5 câu. Tự đọc được trong câu mới mới là dấu hiệu con đang biết cách giải mã.`});
}

function renderReviewMission(){
  const d=state.missionData;
  const block=(title,subtitle,content)=>`<section class="review-card"><span>${esc(title)}</span><h3>${esc(subtitle)}</h3>${content}</section>`;
  els.missionBody.innerHTML=`<div class="review-grid">
    ${block('CUỐI BUỔI','Săn lại tiếng khó',`<div class="end-words">${L.review.end.map(w=>`<span>${esc(w)}</span>`).join('')}</div>`)}
    ${block('NGÀY 1','Câu ngắn mới',L.review.day1.map(s=>`<p>${esc(s)}</p>`).join(''))}
    ${block('NGÀY 3','Đổi từ cùng cấu trúc',L.review.day3.map(s=>`<p>${esc(s)}</p>`).join(''))}
    ${block('NGÀY 7','Đọc trong ngữ cảnh mới',L.review.day7.map(s=>`<p>${esc(s)}</p>`).join(''))}
  </div>
  <div class="reward-banner"><div class="big">🌳</div><h3>Hạt giống đã thức giấc</h3><p>Con không chỉ đọc xong bài hôm nay. Con đã luyện phản xạ: <b>không biết → tách → ghép → tự đọc.</b></p><button id="reviewSeenBtn" class="secondary-btn">${d.reviewSeen?'✓ Đã xem lịch ôn':'Đã xem lịch ôn'}</button></div>`;
  $('#reviewSeenBtn').onclick=()=>{d.reviewSeen=true;saveState();renderReviewMission();};
  setMissionFooter({canComplete:d.reviewSeen,label:'🏆 Hoàn thành bài học',note:'Ngày mai chỉ ôn 2–3 phút bằng câu mới, không học lại cả bài.'});
}

function openParent(){
  els.parentBody.innerHTML=`<div class="parent-grid">
    <section class="parent-card"><h3>🖼️ Ảnh bài học</h3><p>Ảnh được lưu trên cloud và đồng bộ giữa các thiết bị.</p><div class="story-image" style="margin-bottom:9px"><img id="parentImagePreview" src="${DEFAULT_IMAGE}" alt="Ảnh bài học"></div><label>📷 Chọn / thay ảnh<input id="parentImageInput" class="parent-file" type="file" accept="image/jpeg,image/png,image/webp"></label><button id="parentResetImage">↩ Ảnh mặc định</button><div id="parentImageStatus" class="parent-status">Đang kiểm tra...</div></section>
    <section class="parent-card"><h3>🎮 Cài đặt game</h3><div class="sound-toggle"><input id="parentSound" type="checkbox" ${state.sound?'checked':''}><label for="parentSound">Âm thanh phần thưởng</label></div><p>Không có AI đọc. Bố/mẹ vẫn là người trực tiếp hướng dẫn con đọc.</p><button id="resetGame">Làm lại toàn bộ bài</button><button id="openStudy">Mở chế độ giáo trình 2D</button></section>
  </div>`;
  els.parentModal.classList.remove('hidden');
  hydrateParentImage();
  $('#parentSound').onchange=e=>{state.sound=e.target.checked;saveState();};
  $('#resetGame').onclick=()=>{if(confirm('Xóa toàn bộ tiến độ game của bài này?')){localStorage.removeItem(STORAGE_KEY);state=defaults();saveState();location.reload();}};
  $('#openStudy').onclick=()=>location.href='./hat-giong-nho-study.html';
  $('#parentImageInput').onchange=onParentUpload;
  $('#parentResetImage').onclick=resetCloudImage;
}

async function hydrateParentImage(){
  const st=$('#parentImageStatus'),img=$('#parentImagePreview');
  try{
    const r=await fetch(IMAGE_API+'?slot='+encodeURIComponent(CLOUD_KEY)+'&_='+Date.now(),{cache:'no-store'});
    if(r.status===404){st.textContent='Đang dùng ảnh mặc định.';return;}
    const d=await r.json();if(d.url){img.src=d.url;st.textContent='✓ Đang dùng ảnh cloud'+(d.originalName?' · '+d.originalName:'');}
  }catch(e){st.textContent='Không kết nối được cloud.';}
}

async function onParentUpload(e){
  const file=e.target.files?.[0],st=$('#parentImageStatus'),img=$('#parentImagePreview');if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){st.textContent='Chỉ nhận JPG, PNG hoặc WebP.';return;}
  if(file.size>10*1024*1024){st.textContent='Ảnh phải nhỏ hơn 10 MB.';return;}
  st.textContent='Đang upload lên cloud...';
  try{
    const token=localStorage.getItem(IMAGE_OWNER_PREFIX+CLOUD_KEY)||'';
    const fd=new FormData();fd.append('slot',CLOUD_KEY);fd.append('file',file,file.name);
    const headers={};if(token)headers['x-owner-token']=token;
    const r=await fetch(IMAGE_API,{method:'POST',headers,body:fd,cache:'no-store'});const d=await r.json();
    if(!r.ok)throw new Error(d.error||'Upload thất bại');
    if(d.ownerToken)localStorage.setItem(IMAGE_OWNER_PREFIX+CLOUD_KEY,d.ownerToken);
    img.src=d.url;st.textContent='✓ Upload xong và đã đồng bộ.';toast('Ảnh đã đồng bộ lên cloud.');
  }catch(err){st.textContent='Không upload được: '+err.message;}
  e.target.value='';
}

async function resetCloudImage(){
  const st=$('#parentImageStatus'),token=localStorage.getItem(IMAGE_OWNER_PREFIX+CLOUD_KEY)||'';
  if(!token){st.textContent='Chỉ thiết bị đã upload ảnh mới có thể xóa ảnh cloud.';return;}
  st.textContent='Đang trả về ảnh mặc định...';
  try{
    const r=await fetch(IMAGE_API+'?slot='+encodeURIComponent(CLOUD_KEY),{method:'DELETE',headers:{'x-owner-token':token}});const d=await r.json();
    if(!r.ok)throw new Error(d.error||'Không thể xóa');
    localStorage.removeItem(IMAGE_OWNER_PREFIX+CLOUD_KEY);$('#parentImagePreview').src=DEFAULT_IMAGE;st.textContent='✓ Đã dùng ảnh mặc định.';
  }catch(e){st.textContent='Không thể đổi ảnh: '+e.message;}
}
function closeParent(){els.parentModal.classList.add('hidden');}

els.questGo.onclick=()=>{autoTarget=stationPositions[nextStationIndex].clone().add(new THREE.Vector3(0,0,1.7));toast('Đi tới '+missions[nextStationIndex].title);};
els.missionClose.onclick=closeMission;
els.modal.addEventListener('click',e=>{if(e.target===els.modal)closeMission()});
els.settingsBtn.onclick=openParent;
els.parentClose.onclick=closeParent;
els.parentModal.addEventListener('click',e=>{if(e.target===els.parentModal)closeParent()});
els.soundBtn.onclick=()=>{state.sound=!state.sound;saveState();chime();};

els.startGame.onclick=()=>{
  state.introSeen=true;saveState();els.intro.classList.add('hidden');worldStarted=true;
  toast('Chạm “Đi tới nhiệm vụ” hoặc dùng WASD / joystick.');
};

initWorld();updateHUD();
setTimeout(()=>els.loading.classList.add('hide'),700);
if(state.introSeen){els.intro.classList.add('hidden');worldStarted=true;}
else{worldStarted=false;}
