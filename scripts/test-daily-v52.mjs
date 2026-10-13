import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('daily-learning-v52.js','utf8');
new vm.Script(source,{filename:'daily-learning-v52.js'});
const fields=new Map();
function element(selector){
  if(!fields.has(selector))fields.set(selector,{onclick:null,disabled:false,textContent:'',value:'',innerHTML:'',dataset:{},focus(){}});
  return fields.get(selector);
}
const pack={lessonId:'en-pattern-001',order:1,pattern:"I'd like to"};
const sample=[
  ["take a closer look","xem xét kỹ hơn","I'd like to take a closer look at the report.","Tôi muốn xem xét kỹ báo cáo."],
  ["make a decision","đưa ra quyết định","I'd like to make a decision tomorrow.","Tôi muốn đưa ra quyết định ngày mai."],
  ["make a reservation","đặt chỗ","I'd like to make a reservation.","Tôi muốn đặt chỗ."]
].map((row,i)=>({key:'chunk2:en-pattern-001:'+i,baseEn:row[0],baseVi:row[1],modelEn:row[2],modelVi:row[3],pack,kind:'main',examples:[],usageExamples:[]}));
const state={saved:{},dailyV52Sessions:{},dailyV52Weak:{}};
let saves=0;
const context={
  window:{
    VocabCloudSync:{status:()=>({signedIn:false,userId:''}),getAccessToken:async()=>''},
    VocabularyTrainer:{packs:()=>[pack],packById:()=>pack,studyChunks:()=>sample,recordMemory:(env,card,correct)=>{env.state.saved[card.key]={trainer:{reviewCount:1,nextReviewAt:Date.now()+600000,recall:correct}};}}
  },
  document:{querySelector:element,querySelectorAll:()=>[]},
  Date,JSON,Array,Map,Set,Number,String,Math,
  location:{hash:'#daily'},
  setTimeout,clearTimeout,
  console
};
vm.createContext(context);
vm.runInContext(source,context);
const flow=context.window.DailyLearningV52;
assert.equal(flow.version,52);
const env={state,saveState:()=>saves++,setHeader:()=>{},toast:()=>{},speak:()=>{},startRecognition:()=>{},openTrainer:()=>{}};
flow.render(env);
const plan=flow.plan();
assert.equal(plan.review.length,0,'new learners have no fake review');
assert.equal(plan.newCards.length,3,'new learners start with three chunks');
assert.equal(plan.tasks.length,3);
assert.match(element('#mainView').innerHTML,/25 phút/);
element('#dailyNext').onclick();
const key='guest:'+Object.keys(state.dailyV52Sessions)[0].split(':').at(-1);
assert.equal(state.dailyV52Sessions[key].stage,2,'skip empty review');
for(let i=0;i<3;i++)element('#dailyNext').onclick();
assert.equal(state.dailyV52Sessions[key].stage,3,'advance from learning to recall');
assert.ok(saves>3,'saves incremental state');
const saved=state.dailyV52Sessions[key];
flow.render(env);
assert.equal(state.dailyV52Sessions[key].stage,3,'reopen resumes prior step');
assert.deepEqual(Object.keys(state.saved),[],'learning new chunks does not incorrectly claim mastery');
// Finish recall cards and use the explicit non-AI fallback.
for (let i=0;i<3;i++){
  element('#dailyAnswer').value=sample[i].modelEn;
  element('#dailyNext').onclick(); // check chunk use
  element('#dailyNext').onclick(); // next card
}
assert.equal(state.dailyV52Sessions[key].stage,4);
assert.equal(Object.keys(state.saved).length,3,'recall enters existing Chunk SRS without deleting old keys');
element('#dailyFallback').onclick();
element('#dailyMessage').value="I'd like to take a closer look.";
await element('#dailyNext').onclick();
assert.equal(state.dailyV52Sessions[key].conversation.turns,1);
element('#dailyFinishConversation').onclick();
assert.equal(state.dailyV52Sessions[key].stage,5);
assert.ok(state.dailyV52Sessions[key].completedAt);
flow.render(env);
assert.match(element('#mainView').innerHTML,/Buổi học đã hoàn thành/);
console.log('v52 daily: plan, learning, recall SRS, offline roleplay, persistence and finish OK');