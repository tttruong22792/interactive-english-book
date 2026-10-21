import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
const files=['data/english/patterns/specs-13-80.js','data/english/patterns/curriculum-13-80.js',
'data/english/patterns/supplements-13-80.js','data/english/active-study-packs.js',
'data/english/chunk-usage-vi.js','vocabulary-trainer.js','data/english/unique-chunk-bank.js',
'data/english/unique-study-chunks.js','data/english/reading-stories-a1.js',
'data/english/reading-stories-a2.js','data/english/reading-stories-b1-b2.js','study-plan-60.js'];
const w={};const ctx={window:w,console,Date,Math,Set,Map,Array,Object,String,Number,RegExp,JSON,WeakMap};
for(const path of files)runInNewContext(readFileSync(path,'utf8'),ctx,{filename:path});
const s=w.StudyPlan60,content=s.course(),state={saved:{}};
assert.equal(content.packs.length,80,'80 patterns unchanged');
assert.equal(content.cards.length,4000,'4000 unique chunks unchanged');
assert.equal(content.stories.length,30,'30 reading stories unchanged');
let previous=[];
let focusTotal=0,exposureTotal=0;
for(let day=1;day<=60;day++){
 const p=s.plan(day,content);
 assert.equal(p.day,day);
 assert.equal(p.focus.length,12,'12 deep recall items/day');
 focusTotal+=p.focus.length;exposureTotal+=p.exposure.length;
 assert.ok(p.exposure.length>0);
 if(day<=40)assert.deepEqual([...p.patterns],[2*day-1,2*day]);
 else assert.equal(p.patterns.length,0);
 assert.ok(p.story?(day%2===0):day%2===1,'Reading every second day');
 for(const x of p.focus){
  assert.ok(!previous.includes(x.key),'Deep daily prompts never repeat');
  previous.push(x.key);
 }
}
assert.equal(focusTotal,720,'720 strict first-pass recall items over 60 days');
assert.equal(exposureTotal,4000,'Full 4000-item exposure curriculum in 60 days');
assert.ok(s.assess("take a closer look","Take a closer look."));
assert.ok(!s.assess("take a closer look","look closer"),'No vague paraphrase passes');
assert.ok(!s.assess("look into the issue","look at the issue"),'Missing key words fails');
assert.ok(!s.assess("make sure everything is ready",""),'Blank must fail');
const progress=s.summarize(state);
assert.equal(progress.day,1);
const p=state.sixtyDayPlan,day=s.plan(1,content);
const failAnswers=day.focus.map((c,i)=>i<10?c.baseEn:'incorrect');
const fail=s.saveAttempt(p,1,failAnswers,day.focus);
assert.equal(fail.correct,10);assert.equal(fail.passed,false);
assert.equal(s.summarize(state).day,1,'10/12 cannot unlock');
const passAnswers=day.focus.map((c,i)=>i<11?c.baseEn:'incorrect');
const pass=s.saveAttempt(p,1,passAnswers,day.focus);
assert.equal(pass.correct,11);assert.equal(pass.passed,true);
assert.equal(s.summarize(state).day,2,'11/12 unlocks next day');
assert.equal(p.attempts[1].length,2,'Keep every attempt for honest history');
const css=readFileSync('study-plan-60.css','utf8'),html=readFileSync('index.html','utf8'),sw=readFileSync('sw.js','utf8'),builder=readFileSync('scripts/build-static.mjs','utf8'),app=readFileSync('app.js','utf8');
new Script(app);
assert.ok(html.includes('study-plan-60.css'));
assert.ok(builder.includes('"study-plan-60.js"')&&builder.includes('"study-plan-60.css"'));
assert.ok(sw.includes("'./study-plan-60.css'"));
assert.ok(css.includes('.plan60-question')&&css.includes('@media(max-width:760px)'));
assert.ok(app.includes('window.StudyPlan60'));
console.log('PASS: 60-day curriculum, 80 patterns, 4000 exposure cards, 720 strict recall cards, 30 readings, no manual completion and 11/12 gate');
