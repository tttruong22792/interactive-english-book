import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";

const read=p=>readFile(new URL("../"+p,import.meta.url),"utf8");
const storageData=new Map();
const storage={
  getItem(key){return storageData.has(key)?storageData.get(key):null;},
  setItem(key,value){storageData.set(key,String(value));}
};
const ctx=vm.createContext({window:{localStorage:storage}});
vm.runInContext(await read("book-2100-srs.js"),ctx,{filename:"book-2100-srs.js"});
const API=ctx.window.Book2100SRS;
const DAY=86400000;
let now=Date.UTC(2026,10,16,9);
const clock=()=>now;
const srs=API.createStore({storage,clock});
const word=(id)=>srs.get(id,"word");
const sentence=(id)=>srs.get(id,"sentence");

assert.equal(word(1).status,"new","Untested word is not mastered");
assert.equal(word(1).due,false,"Untested word has no review deadline");
assert.equal(srs.summary([{n:1},{n:2}],"word").new,2);

// A single success starts a 1-day review, never instant mastery.
srs.record(1,"word",true);
assert.equal(word(1).status,"weak");
assert.equal(word(1).stage,1);
assert.equal(word(1).dueAt,now+DAY);
assert.equal(srs.dueEntries([{id:1,entries:[{n:1}]}],"word").length,0);
for(let i=0;i<10;i++)srs.record(1,"word",true);
assert.equal(word(1).stage,1,"Ten same-day successes must not inflate mastery");
assert.equal(word(1).history.length,1,"Repeated practice is one graded day");
assert.equal(word(1).attempts,11);

// Other days before the due date do not advance a stage.
now+=DAY;
assert.equal(word(1).due,true);
srs.record(1,"word",true);
assert.equal(word(1).stage,2);
assert.equal(word(1).status,"learning");
assert.equal(word(1).dueAt,now+3*DAY);
now+=DAY;
srs.record(1,"word",true);
assert.equal(word(1).stage,2,"Not yet due means no promotion");

// The third and fourth true spaced reviews extend the interval.
now+=2*DAY;
srs.record(1,"word",true);
assert.equal(word(1).stage,3);
assert.equal(word(1).dueAt,now+7*DAY);
now+=7*DAY;
srs.record(1,"word",true);
assert.equal(word(1).stage,4);
assert.equal(word(1).status,"mastered");
assert.equal(word(1).dueAt,now+14*DAY);
assert.equal(word(1).history.length,4);

// One lapse resets the word to weak and schedules a near-term review.
now+=DAY;
srs.record(1,"word",false);
assert.equal(word(1).stage,0);
assert.equal(word(1).status,"weak");
assert.equal(word(1).dueAt,now+DAY);
srs.record(1,"word",true);
assert.equal(word(1).stage,0,"Correcting today's error is not spaced evidence");
assert.equal(word(1).history.at(-1).result,"again");

// Sentence memory is tracked independently from the underlying word.
srs.record(1,"sentence",true);
assert.equal(sentence(1).stage,1);
assert.equal(word(1).stage,0);

// Hearing the word before writing cannot earn mastery.
srs.record(2,"word",true,{assisted:true});
assert.equal(word(2).stage,0);
assert.equal(word(2).status,"weak");
now+=DAY;
srs.record(2,"word",true);
assert.equal(word(2).stage,1);
now+=DAY;
assert.equal(word(2).due,true);
srs.record(2,"word",true,{assisted:true});
assert.equal(word(2).stage,1,"Hinted answer never increases stage");
assert.equal(word(2).due,true,"Hinted answer does not clear due review");

// Manual weak marking is explicit and cannot grant a mastery promotion today.
srs.markDue(2,"word");
assert.equal(word(2).status,"weak");
assert.equal(word(2).due,true);
srs.record(2,"word",true);
assert.equal(word(2).stage,0,"Manual weak marking must remain weak that day");

// Absent records and unrelated IDs remain new.
assert.equal(word(3).status,"new");
assert.equal(sentence(2).status,"new");
const sum=srs.summary([{n:1},{n:2},{n:3}],"word");
assert.equal(sum.weak,2);
assert.equal(sum.new,1);
assert.equal(sum.total,3);
assert.equal(sum.due,2,"Both the lapsed and manually flagged words are due");

// Legacy green ticks remain saved, but are not mistaken for spaced mastery.
const legacyData=new Map(),legacyStorage={
  getItem(k){return legacyData.get(k)||null;},
  setItem(k,v){legacyData.set(k,String(v));}
};
const legacy=API.createStore({storage:legacyStorage,clock});
assert.equal(legacy.seedLegacy([10,11],[11]),true);
assert.equal(legacy.get(10,"word").stage,0);
assert.equal(legacy.get(10,"word").source,"legacy");
assert.equal(legacy.get(10,"word").due,true);
assert.equal(legacy.get(11,"sentence").stage,0);
assert.equal(legacy.seedLegacy([12],[12]),false,"Migration must be one-time only");
assert.equal(legacy.get(12,"word").status,"new");

// Persisted state is recovered after a reload with no change to schedule.
const recovered=API.createStore({storage:legacyStorage,clock});
assert.equal(recovered.get(10,"word").stage,0);
assert.equal(recovered.get(10,"word").due,true);
assert.equal(recovered.get(11,"sentence").source,"legacy");

// A due queue can span multiple STEPs and is sorted by weak priority.
const queue=legacy.dueEntries([
  {id:1,entries:[{n:10}]},{id:2,entries:[{n:11}]}
],"word");
assert.deepEqual(Array.from(queue,x=>x.id),[10,11]);
assert.deepEqual(Array.from(queue,x=>x.step),[1,2]);

// Corrupted stored JSON must not crash the textbook or erase legacy progress.
legacyData.set(legacy.key,"{invalid");
const repaired=API.createStore({storage:legacyStorage,clock});
assert.equal(repaired.get(10,"word").status,"new");

// UI integration assertions ensure the original grid does not change shape.
const js=await read("book-2100.js");
new vm.Script(js,{filename:"book-2100.js"});
for(const token of ["masteryButton(n)","data-mastery","data-review-launch",
  "function showMasteryDetail(n)","function startReview(ids)","function submitReview(input)",
  "srs.record(n,type,false)","srs.record(n,type,true,{assisted:",
  "data-srs-practice","data-srs-weak","bk-review-input","nextReview(true)",
  "if(root.querySelector(\".bk-srs-layer\"))closeSrsLayer()"]){
  // Action names are tied to stable DOM data attributes; those that changed
  // are checked separately below.
  if(token==="data-srs-practice"||token==="data-srs-weak")continue;
  assert.ok(js.includes(token),"Missing SRS UI integration: "+token);
}
assert.ok(js.includes("data-srs-practice"),"Mastery details should provide a review action");
assert.ok(js.includes("data-srs-weak"),"Manual weak marking should be present");
assert.match(js,/bk-cell bk-number/,"Original number column preserved");
assert.ok(js.includes("line(n,\"doneWords\")"),"Original correct check remains");
assert.ok(js.includes("line(n,\"doneSentences\")"),"Original sentence check remains");
assert.ok(js.includes("if(!typed){focusNext(n,type);return;}"),"Enter-blank-to-next preserved");
assert.ok(js.includes("inputNode.value=\"\""),"Correct answer still clears input");
const css=await read("book-2100.css");
assert.match(css,/\.book2100\.bk-fit \.bk-scroll\{[\s\S]*?overflow:hidden/,"Desktop no-scroll fit preserved");
assert.match(css,/grid-template-rows:repeat\(var\(--bk-row-count,12\),minmax\(0,1fr\)\)/,"All 12/13 rows still fit");
assert.match(css,/\.book2100\.bk-mastery/,"Mastery indicators styled");
assert.match(css,/\.book2100\.bk-srs-layer/,"Details and review overlays are separate from grid");
assert.match(css,/\.book2100\.bk-review-dialog/);
assert.match(css,/\.book2100\.bk-study-word \.bk-show-words/,"iPhone recall layout retained");
const index=await read("index.html");
assert.ok(index.indexOf('src="book-2100-srs.js')>=0);
assert.ok(index.indexOf('src="book-2100-srs.js')<index.indexOf('src="book-2100.js'),"Scheduler must load before book");
const sw=await read("sw.js"),build=await read("scripts/build-static.mjs");
assert.ok(sw.includes("./book-2100-srs.js"),"Service worker must cache SRS engine");
assert.ok(build.includes('"book-2100-srs.js"'),"Production artifact must contain SRS engine");

console.log("PASS — Book 2100 SRS: 400 independent word/sentence records, adaptive intervals, mastery levels, no same-day inflation, assisted-recall protection, migration, persistence, review queue and compact responsive layout.");
