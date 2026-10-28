import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(p,'utf8'),win={};
const ctx=vm.createContext({window:win,console,Date,Math,Set,Map,Array,Object,String,Number,RegExp,JSON,WeakMap});
function load(path){vm.runInContext(read(path),ctx,{filename:path});}
load('data/english/patterns/specs-13-80.js');
load('data/english/patterns/curriculum-13-80.js');
for(let i=1;i<=12;i++)load('data/english/patterns/'+String(i).padStart(3,'0')+'.js');
load('data/english/patterns/supplements-13-80.js');
load('data/english/active-study-packs.js');
load('data/english/chunk-usage-vi.js');
load('vocabulary-trainer.js');
load('data/english/unique-chunk-bank.js');
load('data/english/unique-study-chunks.js');
load('daily-80-v60.js');
const d=win.Daily80V60;
assert.ok(d&&typeof d.render==='function','New study app is registered');
assert.equal(d.courseDays,60);
assert.equal(win.VocabularyTrainer.packs().length,80,'All 80 patterns preserved');
const totalWords=items=>items.reduce((n,x)=>n+x.en.split(/\s+/).length,0);
const early=d.lessonItems(1),late=d.lessonItems(60);
assert.equal(early.length,80,'Day one teaches exactly one example for each of 80 patterns');
assert.equal(late.length,80,'Last day teaches exactly one example for each pattern');
assert.ok(totalWords(late)>totalWords(early),'Later-day examples should be measurably more complex on average');
assert.ok(early.find(x=>x.id===3).en.startsWith('I want to '),'Pattern 3 must teach I want to, not a contrast question');
assert.ok(early.find(x=>x.id===6).en.startsWith('Would you like to '),'Pattern 6 must teach the polite question');
const uniquelyScheduled=new Set();
for(let day=1;day<=50;day++){
 for(const item of d.lessonItems(day)){
  assert.ok(item.chunkKey&&item.chunk?.[0]&&item.chunk?.[1],'Missing daily chunk, day '+day+' pattern '+item.id);
  assert.ok(!uniquelyScheduled.has(item.chunkKey),'Repeated chunk assigned to two daily learning cards: '+item.chunkKey);
  uniquelyScheduled.add(item.chunkKey);
 }
}
assert.equal(uniquelyScheduled.size,4000,'All 4,000 unique chunks get a scheduled first exposure in days 1–50');
for(const day of [1,2,3,15,20,21,40,41,55,60]){
 const items=d.lessonItems(day);
 assert.equal(items.length,80,'80 examples each day '+day);
 assert.equal(new Set(items.map(x=>x.id)).size,80,'No repeated structure on day '+day);
 assert.equal(new Set(items.map(x=>x.group)).size,8,'Eight coherent pattern groups on day '+day);
 for(const item of items){
  assert.ok(item.pattern&&item.meaning&&item.en&&item.vi,'Real bilingual example on day '+day+' pattern '+item.id);
  const fromLesson=d.sourcePool(item.id);
  assert.ok(fromLesson.some(x=>x.en===item.en&&x.vi===item.vi),'Example must originate in existing lesson '+item.id);
 }
 const root={days:{},skills:{}};
 const quiz=d.chooseQuiz(items,root,day);
 assert.equal(quiz.length,16,'16 strict recall prompts every day');
 assert.equal(new Set(quiz.map(x=>x.id)).size,16,'No duplicated prompts');
 for(let g=0;g<8;g++)assert.equal(quiz.filter(x=>x.group===g).length,2,'Two prompts per group');
}
for(let start=1;start<=60;start+=5){
 const checked=new Set();
 for(let day=start;day<start+5;day++){
  for(const card of d.chooseQuiz(d.lessonItems(day),{days:{},skills:{}},day)){
   assert.ok(!checked.has(card.id),'Repeated before all 80 examined: '+card.id);
   checked.add(card.id);
  }
 }
 assert.equal(checked.size,80,'Five-day assessment must cover all 80 structures');
}
assert.ok(d.grade("I'd like to take a break.","I would like to take a break"));
assert.ok(!d.grade("I have to take a break.","I have take a break"));
assert.ok(!d.grade("I want to leave.","I want to go."),'Different sentence must fail');
assert.ok(!d.grade('I need to work',''),'Blank answer must fail');
const root=d.stateFor({});
let today=d.dayData(root,1),items=d.lessonItems(1),quiz=d.chooseQuiz(items,root,1);
assert.equal(d.currentDay(root),1);
const bad=d.examResult(root,1,quiz,quiz.map((x,i)=>i<13?x.en:'wrong'),'2026-10-26',items);
assert.equal(bad.correct,13);
assert.equal(bad.passed,false);
assert.equal(d.currentDay(root),1,'A failed quiz cannot unlock the next day');
const good=d.examResult(root,1,quiz,quiz.map((x,i)=>i<14?x.en:'wrong'),'2026-10-26',items);
assert.equal(good.correct,14);
assert.equal(good.passed,true);
assert.equal(d.currentDay(root),1,'Passing quiz without studying all 80 is NOT completion');
today.seen=Array.from({length:80},(_,i)=>i+1);
const cleared=d.examResult(root,1,quiz,quiz.map((x,i)=>i<14?x.en:'wrong'),'2026-10-26',items);
assert.equal(root.days[1].completedAt,null,'Seeing all 80 and passing 16/16 must not bypass independent recall gates');
for(let stage=0;stage<8;stage++){
 const cards=d.lessonItems(1).slice(stage*10,stage*10+10);
 for(const card of cards){
  assert.equal(d.recordCheckpoint(root,1,stage,'sentence',card,card.en,'write','2026-10-26').correct,true);
  assert.equal(d.recordCheckpoint(root,1,stage,'chunk',card,card.chunk[0],'write','2026-10-26').correct,true);
 }
 assert.ok(d.stageComplete(today,stage,items),'Both recall halves must be independently completed at stage '+stage);
}
d.examResult(root,1,quiz,quiz.map(x=>x.en),'2026-10-26',items);
assert.ok(root.days[1].completedAt,'80 exposures, 8×(10 sentence + 10 chunk recall) and exam unlock next day');
assert.equal(d.currentDay(root),2);
assert.equal(root.days[1].attempts.length,4,'Keep honest history, including failed attempts');
assert.equal(Object.keys(root.chunkSeen).length,0,'A quiz does not fake chunk exposure');
const examples=['I want to go home','I would like to leave','I hope to finish'].map(x=>x.toLowerCase());
assert.equal(d.mastery({successes:{'2026-10-26':examples[0]}}),'recalled');
assert.equal(d.mastery({successes:{'2026-10-26':examples[0],'2026-10-28':examples[0]}}),'remembered');
assert.equal(d.mastery({successes:{'2026-10-26':examples[0],'2026-10-28':examples[1],'2026-11-03':examples[2]}}),'solid');
assert.equal(d.mastery({successes:{'2026-10-26':examples[0],'2026-10-27':examples[1],'2026-10-28':examples[2]}}),'remembered','Three quick successes are not long-term mastery');
assert.equal(d.mastery({successes:{'2026-10-20':'one','2026-10-22':'two','2026-10-27':'three'},lastFail:'2026-10-28'}),'weak','Incorrect recall revokes solid badge');
assert.equal(d.mastery({successes:{'2026-10-20':'one','2026-10-22':'two','2026-10-27':'three','2026-10-28':'four'},lastFail:'2026-10-28'}),'recalled','Retry restarts mastery streak');
const retake=d.stateFor({});
const retakeQuiz=d.chooseQuiz(d.lessonItems(1),retake,1),allCorrect=retakeQuiz.map(x=>x.en);
d.examResult(retake,1,retakeQuiz,allCorrect,'2026-10-27');
d.examResult(retake,1,retakeQuiz,['bad answer',...allCorrect.slice(1)],'2026-10-27');
assert.equal(d.mastery(retake.skills[retakeQuiz[0].id]),'weak','Failed same-day retry resets credit');
d.examResult(retake,1,retakeQuiz,allCorrect,'2026-10-27');
assert.equal(d.mastery(retake.skills[retakeQuiz[0].id]),'recalled');
const html=read('index.html'),app=read('app.js'),build=read('scripts/build-static.mjs'),sw=read('sw.js'),css=read('daily-80-v60.css'),manifest=JSON.parse(read('manifest.webmanifest'));
new vm.Script(app);
assert.ok(app.includes("if(!location.hash) location.hash='#daily';"));
assert.ok(app.includes("r.name === 'legacy-daily'")&&app.includes("r.name === 'daily-v52'"),'Both older daily learning systems remain reachable');
assert.ok(app.includes("route:'japanese'")&&app.includes("route:'settings'"),'Old Japanese and settings screens remain accessible');
assert.ok(html.includes('daily-80-v60.css')&&html.includes('runtime-20261028-daily80-v62.js'),'New assets in HTML');
assert.ok(build.includes('"daily-80-v60.js"')&&build.includes('"daily-80-v60.css"'),'New assets in Pages builder');
assert.ok(sw.includes("'./daily-80-v60.css'")&&sw.includes("'./runtime-20261028-daily80-v61d.js'"));
assert.ok(manifest.start_url.endsWith('#daily'));
assert.ok(css.includes('.day80-focus')&&css.includes('.day80-quiz')&&css.includes('@media(max-width:760px)'));
assert.ok(css.includes('.day80-mastery-map')&&read('daily-80-v60.js').includes('data-day80-pattern')&&read('daily-80-v60.js').includes('masteryMapHTML'),'The 80-pattern mastery drill-down must remain available');
assert.ok(css.includes('.day80-review-answer.is-hidden')&&read('daily-80-v60.js').includes('day80ReviewSaved'),'Incorrect answers persist for revision');
const screen={innerHTML:''},listeners={},input={value:'wrong answer'};
ctx.document={
 querySelector(selector){
  if(selector==='#day80Input'&&screen.innerHTML.includes('id="day80Input"'))return input;
  if(!selector.startsWith('#')||!screen.innerHTML.includes('id="'+selector.slice(1)+'"'))return null;
  return {disabled:false,hidden:false,classList:{remove(){}},addEventListener(_name,callback){listeners[selector]=callback;}};
 },
 querySelectorAll(){return [];}
};
const liveState={daily80v60:{version:60,start:'2026-10-27',days:{1:{seen:Array.from({length:80},(_,i)=>i+1),attempts:[],completedAt:null}},skills:{},chunkSeen:{}}};
d.render({main:screen,state:liveState,setHeader(){},saveState(){},speak(){}});
assert.ok(screen.innerHTML.includes('day80-mastery-map'),'Dashboard must render mastery map');
assert.ok(listeners['#day80Resume'],'Dashboard binds controls without throwing');
listeners['#day80Resume']();
assert.ok(screen.innerHTML.includes('id="day80GateContinue"'),'80 exposures alone enter the checkpoint rather than the final exam');
for(let stage=0;stage<8;stage++)for(const card of d.lessonItems(1).slice(stage*10,stage*10+10)){d.recordCheckpoint(liveState.daily80v60,1,stage,'sentence',card,card.en);d.recordCheckpoint(liveState.daily80v60,1,stage,'chunk',card,card.chunk[0]);}
d.render();listeners['#day80Resume']();
assert.ok(screen.innerHTML.includes('id="day80QuizNext"'),'Quiz starts only after both types of recall are completed');
for(let i=0;i<16;i++){input.value='wrong answer';assert.ok(listeners['#day80QuizNext']);listeners['#day80QuizNext']();}
assert.ok(screen.innerHTML.includes('id="day80ReviewWrong"'),'Result has button to review mistakes');
listeners['#day80ReviewWrong']();
assert.ok(screen.innerHTML.includes('id="day80ReviewReveal"'),'Failed answers open recall screen');
listeners['#day80ReviewExit']();
assert.ok(screen.innerHTML.includes('id="day80ReviewWrong"'),'Exiting review returns to the right result');
listeners['#day80Return']();
assert.ok(screen.innerHTML.includes('id="day80ReviewSaved"'),'Mistakes remain accessible after leaving results');
listeners['#day80ReviewSaved']();
assert.ok(screen.innerHTML.includes('id="day80ReviewReveal"'),'Saved mistakes can be reopened');
const engineText=read('daily-80-v60.js');
assert.ok(engineText.includes('env.speak?.(items[index].en,null,0.7);'),'Next sentence must automatically play at slow speed');
assert.ok(engineText.includes('if((index+1)%10===0){openCheckpoint(Math.floor(index/10));return;}'),'Every ten cards must enter an active recall gate');
assert.ok(html.includes("script.onerror = function ()")&&html.includes("runtime.js?fallback=20261028-v62"),'A failed versioned script should fall back to same-build runtime');
assert.ok(html.includes('id="lsRetryBoot"'),'Boot failures should offer an explicit retry without deleting progress');
const gateState=d.stateFor({});
const gateDay=d.dayData(gateState,1),stageCards=d.lessonItems(1).slice(0,10);
gateDay.seen=stageCards.map(x=>x.id);
assert.equal(d.firstBlockedStage(gateDay,d.lessonItems(1)),0);
assert.equal(d.stageProgress(gateDay,0,'sentence',d.lessonItems(1)),0);
assert.equal(d.stageProgress(gateDay,0,'chunk',d.lessonItems(1)),0);
assert.ok(!d.recordCheckpoint(gateState,1,0,'sentence',stageCards[0],'wrong').correct);
assert.equal(d.stageProgress(gateDay,0,'sentence',d.lessonItems(1)),0);
assert.ok(d.recordCheckpoint(gateState,1,0,'sentence',stageCards[0],stageCards[0].en).correct);
assert.equal(d.stageProgress(gateDay,0,'sentence',d.lessonItems(1)),1);
assert.equal(d.stageProgress(gateDay,0,'chunk',d.lessonItems(1)),0,'Recall sentences never auto-credits chunks');
assert.ok(d.checkpointHTML(gateDay,0,d.lessonItems(1)).includes('CÂU HOÀN CHỈNH'));
assert.ok(d.checkpointHTML(gateDay,0,d.lessonItems(1)).includes('CỤM TỪ'));
assert.ok(d.checkpointHTML(gateDay,0,d.lessonItems(1),'sentence',1).includes('day80GateInput'));
assert.ok(!d.checkpointHTML(gateDay,0,d.lessonItems(1),'sentence',1).includes('I\'d like to order this.'),'English answer must not be visible before recall');
assert.ok(css.includes('.day80-gate-question'),'Recall checkpoint has a mobile-friendly separate screen');
console.log('PASS v62: 60-day progressive real-content curriculum, 80 structures per day, 8 functional groups, 16-item strict exam, honest recall mastery and archived legacy modules.');
