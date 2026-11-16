import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";
import {randomUUID} from "node:crypto";

const read=name=>readFile(new URL("../"+name,import.meta.url),"utf8");
const srsCode=await read("book-2100-srs.js");
const cloudCode=await read("book-2100-cloud.js");
const bookCode=await read("book-2100.js");
new vm.Script(srsCode);new vm.Script(cloudCode);new vm.Script(bookCode);
const db=new Map(),userA="11111111-1111-4111-8111-111111111111",userB="22222222-2222-4222-8222-222222222222";
function storage(){let data=new Map();return {
  getItem:key=>data.has(key)?data.get(key):null,
  setItem:(key,value)=>data.set(key,String(value)),
  _all:()=>data
};}
function serverQuery(state){
  return {
    select(){return this;},
    eq(column,value){if(column==="user_id")this.owner=value;return this;},
    order(){return this;},
    async range(start,end){
      if(state.offline)return {error:new Error("offline")};
      const rows=[...db.values()].filter(row=>row.user_id===this.owner)
        .sort((a,b)=>a.occurred_at.localeCompare(b.occurred_at)||a.event_id.localeCompare(b.event_id))
        .slice(start,end+1);
      return {data:rows,error:null};
    },
    async upsert(rows){
      if(state.offline)return {error:new Error("offline")};
      for(const row of rows){
        const key=row.user_id+":"+row.event_id;
        if(!db.has(key))db.set(key,row);
      }
      return {error:null};
    }
  };
}
function device(owner,seed=()=>{}){
  const local=storage(),observers=[],state={offline:false,userId:owner};
  let currentTime=Date.UTC(2026,10,17,8);
  const fakeWindow={
    localStorage:local,
    crypto:{randomUUID:randomUUID},
    addEventListener(){},
    setTimeout,clearTimeout,setInterval(){return 1;},clearInterval,
  };
  const auth={
    status:()=>({signedIn:!!state.userId,userId:state.userId,email:"learner@example.com"}),
    init:async()=>auth.status(),
    onChange:(callback)=>{observers.push(callback);return ()=>{};},
    getClient:async()=>({from:()=>serverQuery(state)}),
    emit:(id)=>{
      state.userId=id;
      const status=auth.status();
      observers.forEach(callback=>callback({type:"auth",status}));
    }
  };
  fakeWindow.VocabCloudSync=auth;
  const ctx=vm.createContext({
    window:fakeWindow,localStorage:local,
    crypto:fakeWindow.crypto,
    document:{hidden:false,addEventListener(){}},
    console,setTimeout,clearTimeout,setInterval:fakeWindow.setInterval,clearInterval,
    Date,Map,Set,Promise
  });
  vm.runInContext(srsCode,ctx);
  const srs=fakeWindow.Book2100SRS.createStore({storage:local,clock:()=>currentTime});
  seed(srs);
  vm.runInContext(cloudCode,ctx);
  const changes=[];
  fakeWindow.Book2100CloudSync.connect(srs,s=>changes.push(s));
  return {local,srs,cloud:fakeWindow.Book2100CloudSync,auth,state,changes,
    time:()=>currentTime,advance:days=>{currentTime+=days*86400000;}};
}
const wait=()=>new Promise(resolve=>setTimeout(resolve,35));
const a=device(userA);
const b=device(userA);
await wait();
await a.cloud.syncNow();
a.srs.record(5,"word",true);
a.srs.record(5,"sentence",true);
await a.cloud.syncNow();
await b.cloud.syncNow();
assert.equal(b.srs.get(5,"word").successes,1,"Word recall must sync to second device");
assert.equal(b.srs.get(5,"sentence").successes,1,"Sentence recall must sync independently");
assert.equal(b.srs.get(5,"word").dueAt,a.srs.get(5,"word").dueAt,"Due timestamp should be identical across machines");

// Offline practice must survive on the local phone. A different word studied
// on the computer must not overwrite the phone's pending review.
b.state.offline=true;
b.srs.record(7,"word",false);
await b.cloud.syncNow();
assert.equal(b.srs.get(7,"word").mistakes,1,"Offline incorrect recall stays in local cache");
a.srs.record(8,"word",true);
await a.cloud.syncNow();
b.state.offline=false;
await b.cloud.syncNow();
await a.cloud.syncNow();
assert.equal(a.srs.get(7,"word").mistakes,1,"Phone offline event reaches computer");
assert.equal(b.srs.get(8,"word").successes,1,"Computer event reaches phone");
assert.equal(b.srs.get(5,"sentence").successes,1,"Independent sentence grade survives concurrent merge");

// Pulling the same UUIDs again must not double-count progress.
const sizeBefore=db.size,attemptsBefore=a.srs.get(5,"word").attempts;
await a.cloud.syncNow();await b.cloud.syncNow();
assert.equal(db.size,sizeBefore,"Event upsert must be idempotent");
assert.equal(a.srs.get(5,"word").attempts,attemptsBefore,"Replaying cloud data must not multiply attempts");

// Existing pre-cloud SRS grades migrate without wiping their dates/levels.
const c=device(userA,srs=>{
  srs.record(30,"word",true);
  srs.record(31,"sentence",true);
});
await wait();await c.cloud.syncNow();await a.cloud.syncNow();
assert.equal(a.srs.get(30,"word").successes,1,"Pre-existing local word must migrate");
assert.equal(a.srs.get(31,"sentence").successes,1,"Pre-existing local sentence must migrate");

// Signing out does not leave another user's study record visible.
b.auth.emit("");
await wait();
assert.equal(b.srs.get(5,"word").status,"new","Signed-out guest mode must not expose A's progress");
// An account change must not upload account A events as account B.
b.auth.emit(userB);
await wait();await b.cloud.syncNow();
assert.equal(b.srs.get(5,"word").status,"new","Other account should have independent progress");
assert.equal([...db.values()].filter(row=>row.user_id===userB).length,0,"Nothing from A may leak to B");
b.auth.emit(userA);await wait();await b.cloud.syncNow();
assert.equal(b.srs.get(5,"word").successes,1,"Signing back in restores account A's history");

// Front-end integration: the compact one-page controls and auto pronunciation
// must remain independent of the mobile/desktop book layout and SRS.
for(const token of [
  "async function playStep()",
  "function sequencePause(milliseconds,epoch)",
  "sequenceActive",
  'data-sequence',
  'data-repeat-audio',
  'data-cloud-status',
  'void speak(n,type);',
  'void speak(n,"word");',
  "function onCloudStatus(info)",
  "Book2100CloudSync.connect(srs,onCloudStatus)",
  'if(state.mode==="word")state.page="words"',
  'if(state.mode==="sentence")state.page="sentences"',
  'if(!typed){focusNext(n,type);return;}',
  'showAnswerMark(inputNode,"wrong")',
  'showAnswerMark(inputNode,"correct")'
]){
  assert.ok(bookCode.includes(token),"Missing book integration: "+token);
}
const html=await read("index.html"),sw=await read("sw.js"),build=await read("scripts/build-static.mjs");
assert.ok(html.indexOf('src="book-2100-srs.js')<html.indexOf('src="book-2100-cloud.js'));
assert.ok(html.indexOf('src="book-2100-cloud.js')<html.indexOf('src="book-2100.js'));
assert.ok(sw.includes("./book-2100-cloud.js"),"PWA must cache sync client");
assert.ok(build.includes('"book-2100-cloud.js"'),"Pages must ship sync client");
assert.ok((await read("cloud-sync.js")).includes("getClient, // Authenticated Supabase client"),"Share existing Supabase Auth, never a second login");
console.log("PASS — Book 2100: multi-device word/sentence SRS, due dates, offline merge, idempotent events, account separation, local legacy migration, sequential audio and correct-Enter pronunciation.");
