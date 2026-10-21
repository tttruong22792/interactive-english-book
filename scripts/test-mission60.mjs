import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext,Script} from "node:vm";
const files=[
 "data/english/patterns/specs-13-80.js","data/english/patterns/curriculum-13-80.js",
 "data/english/patterns/supplements-13-80.js","data/english/active-study-packs.js",
 "data/english/chunk-usage-vi.js","vocabulary-trainer.js",
 "data/english/unique-chunk-bank.js","data/english/unique-study-chunks.js",
 "data/english/reading-stories-a1.js","data/english/reading-stories-a2.js",
 "data/english/reading-stories-b1-b2.js","mission60-core.js"
];
const w={};
const context={window:w,Date,Math,Map,Set,WeakMap,Array,Number,String,Object,JSON,RegExp,console};
for(const file of files){
 new Script(readFileSync(file,"utf8"),{filename:file}).runInNewContext(context);
}
const C=w.Mission60Core;
assert.ok(C,"Mission engine must be initialized");
assert.equal(C.allCards().length,4000,"Entire existing 4000-chunk corpus remains accessible");
assert.equal(C.packs().length,80);
assert.equal(C.chapters().length,30);
assert.equal(C.planDay(1).chunkCount,66);
assert.equal(C.planDay(60).chunkEnd,4000);
assert.deepEqual([...C.planDay(1).patterns],[1,2]);
assert.deepEqual([...C.planDay(40).patterns],[79,80]);
assert.deepEqual([...C.planDay(41).patterns],[1,2,3,4]);
assert.deepEqual([...C.planDay(60).patterns],[77,78,79,80]);
assert.equal(C.planDay(2).reading,1);
assert.equal(C.planDay(59).reading,0);
assert.equal(C.planDay(60).reading,30);
assert.equal(Array.from({length:60},(_,i)=>C.planDay(i+1).chunkCount).reduce((a,b)=>a+b,0),4000);
assert.ok(C.equal("I'd like to go.","I would like to go"));
assert.ok(C.equal("Don't hesitate to call.","Do not hesitate to call"));
assert.ok(!C.equal("I would like to go.","I would like"));
assert.ok(!C.equal("Could you send the file?","send the file"));
assert.ok(!C.equal("make a reservation","make sure"));
const state={saved:{}},now=new Date("2026-10-22T08:00:00+09:00").getTime();
let d=C.daily(state,now);
assert.equal(d.day,1);
assert.equal(d.todayChunks.length,66);
assert.equal(d.todaysPacks.length,2);
assert.equal(d.certified,0);
assert.equal(d.mastered,0);
assert.equal(d.dayPassed,false,"Viewing a mission cannot mark it as complete");
const c=d.todayChunks[0],m=d.mission;
assert.ok(!C.recordChunk(m,c.key,c.baseEn,"",d.today,true),"Revealed answer is always incorrect");
assert.ok(!C.recordChunk(m,c.key,c.baseEn,"some of the words",d.today),"Partial phrase does not pass");
assert.equal(d.mission.chunkProof[c.key].passDates.length,0);
assert.ok(C.recordChunk(m,c.key,c.baseEn,c.baseEn,d.today));
assert.equal(m.chunkProof[c.key].firstTry,false,"Incorrect first attempt stays on the audit trail");
assert.equal(C.proofStatus(m.chunkProof[c.key],d.today).mastered,false);
const later1=C.after(d.today,1),later3=C.after(d.today,4),later7=C.after(d.today,11);
assert.ok(C.recordChunk(m,c.key,c.baseEn,c.baseEn,later1));
assert.ok(C.recordChunk(m,c.key,c.baseEn,c.baseEn,later3));
assert.ok(C.recordChunk(m,c.key,c.baseEn,c.baseEn,later7));
assert.equal(C.proofStatus(m.chunkProof[c.key],later7).mastered,true,"Proof of mastery needs independent spaced days");
const reviewDay=new Date("2026-11-03T08:00:00+09:00").getTime();
const firstBatch=C.daily(state,reviewDay);
const assigned=firstBatch.reviews.map(c=>c.key);
if(assigned.length){
 const card=firstBatch.reviews[0];
 assert.ok(C.recordChunk(m,card.key,card.baseEn,card.baseEn,firstBatch.today));
 const repeated=C.daily(state,reviewDay);
 assert.deepEqual(repeated.reviews.map(c=>c.key),assigned,
   "Review assignment must not grow forever as individual cards are completed");
 assert.equal(repeated.reviewRemaining.length,firstBatch.reviewRemaining.length-1,
   "Completed assigned reviews must be counted accurately");
}

C.recordChunk(m,c.key,c.baseEn,"wrong",later7);
assert.equal(C.proofStatus(m.chunkProof[c.key],later7).mastered,false,"A failure revokes mastery");
const p=d.todaysPacks[0],probes=C.probes(p,false);
assert.equal(probes.length,2);
assert.ok(!C.recordPattern(m,p.lessonId,0,probes[0].en,"",false,d.today,true));
assert.ok(C.recordPattern(m,p.lessonId,0,probes[0].en,probes[0].en,false,d.today));
assert.equal(m.patternProof[p.lessonId].passed,false,"One sentence can't pass the pattern");
assert.ok(C.recordPattern(m,p.lessonId,1,probes[1].en,probes[1].en,false,d.today));
assert.equal(m.patternProof[p.lessonId].passed,true);
assert.equal(m.patternProof[p.lessonId].firstTry,false);
assert.equal(m.patternProof[p.lessonId].reviewPassed,false,"Initial pass is not the spaced re-test");
const review=C.probes(p,true);
assert.equal(review.length,2);
review.forEach((q,i)=>C.recordPattern(m,p.lessonId,i,q.en,q.en,true,later7));
assert.equal(m.patternProof[p.lessonId].reviewPassed,true);
const story=C.chapters()[0];
assert.ok(story.questions.length>=2);
const wrong=C.recordReading(m,story,story.questions.map(q=>(q.answer+1)%q.choices.length),d.today);
assert.equal(wrong.passed,false);
assert.equal(m.readingProof[story.id].passed,false,"Marking as read is not sufficient");
const correct=C.recordReading(m,story,story.questions.map(q=>q.answer),d.today);
assert.equal(correct.passed,true);
assert.equal(m.readingProof[story.id].firstTry,false,"Failed first quiz remains recorded");
const skipped=C.daily(state,new Date("2026-10-24T08:00:00+09:00").getTime());
assert.equal(skipped.day,3);
assert.ok(skipped.backlog.length>=100,"Skipped tasks carry to a later day");
assert.equal(skipped.dayPassed,false);
const html=readFileSync("index.html","utf8"),sw=readFileSync("sw.js","utf8");
const css=readFileSync("mission60.css","utf8"),app=readFileSync("app.js","utf8"),build=readFileSync("scripts/build-static.mjs","utf8");
new Script(readFileSync("mission60-ui.js","utf8"),{filename:"mission60-ui.js"});
assert.ok(html.includes("mission60.css")&&html.includes("runtime-20261022-mission60-v59.js"));
assert.ok(sw.includes("'./mission60.css'")&&sw.includes("runtime-20261022-mission60-v59.js"));
assert.ok(build.includes('"mission60-core.js"')&&build.includes('"mission60-ui.js"')&&build.includes('"mission60.css"'));
assert.ok(app.includes("r.name === 'daily') renderMission60()")&&app.includes("r.name === 'coach') renderDailyV52()"),"Old AI 25-minute plan remains optional");
assert.ok(app.includes("if(!location.hash) location.hash='#daily';"));
assert.ok(css.includes(".m60-task")&&css.includes(".m60-test-card")&&css.includes("@media(max-width:760px)"));
assert.ok(JSON.parse(readFileSync("manifest.webmanifest","utf8")).start_url.endsWith("#daily"));
console.log("PASS Mission 60: 80 patterns, 4000 cards, 30 readings, 60-day target schedule, strict grading, spaced mastery, backlog carry and responsive PWA");
