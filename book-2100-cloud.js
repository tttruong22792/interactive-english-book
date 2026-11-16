/* Book 2100: sync immutable word/sentence review events via the EXISTING
   Language Studio Supabase Auth account. No extra login, no secret keys.
   Local learning works offline. Events are idempotent and merge by UUID. */
(function(global){
"use strict";
var TABLE="language_studio_book2100_events";
var PREFIX="languageStudio:book2100Events:v1:";
var CLAIMED_KEY="languageStudio:book2100ClaimedOwner:v1";
var POLL_MS=30000,BATCH=100;
var store=null,listener=null,unlisten=null,unsubscribeAuth=null;
var activeOwner="guest",ledger={version:1,events:[]};
var signedIn=false,userId="",email="",ready=false,syncing=false,lastSyncAt=0,lastError="";
var syncPromise=null,debounce=0,poll=0,bootTimer=0,bootTries=0;
var pageListeners=new Set();

function uuid(){
  if(typeof crypto!=="undefined"&&typeof crypto.randomUUID==="function")return crypto.randomUUID();
  if(typeof crypto!=="undefined"&&typeof crypto.getRandomValues==="function"){
    var bytes=crypto.getRandomValues(new Uint8Array(16));
    bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
    var hex=Array.from(bytes,function(n){return n.toString(16).padStart(2,"0");}).join("");
    return hex.slice(0,8)+"-"+hex.slice(8,12)+"-"+hex.slice(12,16)+"-"+hex.slice(16,20)+"-"+hex.slice(20);
  }
  // A browser without secure randomness must not invent supposedly unique
  // events; leave SRS functional locally rather than risk cross-user writes.
  return null;
}
function validEvent(e){
  return !!(e&&typeof e.eventId==="string"&&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e.eventId)&&
    Number.isInteger(Number(e.id))&&Number(e.id)>=1&&Number(e.id)<=400&&
    (e.skill==="word"||e.skill==="sentence")&&
    ["baseline","correct","wrong","weak"].includes(e.kind)&&
    Number.isFinite(Number(e.at))&&Number(e.at)>0&&
    (e.kind!=="baseline"||(e.baseline&&typeof e.baseline==="object"&&!Array.isArray(e.baseline))));
}
function load(owner){
  try{
    var raw=JSON.parse(localStorage.getItem(PREFIX+owner)||"{}");
    return {version:1,events:Array.isArray(raw.events)?raw.events.filter(validEvent):[]};
  }catch(e){return {version:1,events:[]};}
}
function save(){try{localStorage.setItem(PREFIX+activeOwner,JSON.stringify(ledger));}catch(e){}}
function notify(){
  var snapshot=status();
  if(typeof listener==="function")try{listener(snapshot);}catch(e){console.error(e);}
  pageListeners.forEach(function(cb){try{cb(snapshot);}catch(e){console.error(e);}});
}
function status(){
  return {ready:ready,signedIn:signedIn,userId:userId,email:email,
    syncing:syncing,lastSyncAt:lastSyncAt,lastError:lastError,
    pending:!signedIn?ledger.events.length:Math.max(0,ledger.events.length-(lastRemoteCount||0)),
    revision:revision};
}
var lastRemoteCount=0,revision=0;
function snapshotLegacy(){
  if(!store||ledger.events.length)return;
  var state=store._dump();
  var now=Date.now();
  ["word","sentence"].forEach(function(skill){
    Object.keys(state[skill]||{}).forEach(function(k){
      var id=Number(k),baseline=state[skill][k],eventId=uuid();
      if(!eventId||!Number.isInteger(id)||id<1||id>400||!baseline)return;
      ledger.events.push({eventId:eventId,id:id,skill:skill,kind:"baseline",
        at:Math.max(1,Number(baseline.lastAt)||Number(baseline.firstAt)||now),
        assisted:false,baseline:baseline});
    });
  });
  save();
}
function append(ev){
  if(!validEvent(ev))return;
  if(ledger.events.some(function(other){return other.eventId===ev.eventId;}))return;
  ledger.events.push(ev);save();notify();
  if(signedIn)queueSync();
}
function onStudyEvent(change){
  var eventId=uuid();
  if(!eventId)return;
  append({eventId:eventId,id:change.id,skill:change.skill,
    kind:change.kind,assisted:!!change.assisted,
    at:change.at||Date.now()});
}
function mergeEvents(a,b){
  var unique=new Map();
  (a||[]).concat(b||[]).forEach(function(e){if(validEvent(e))unique.set(e.eventId,e);});
  return Array.from(unique.values()).sort(function(x,y){
    return x.at-y.at||x.eventId.localeCompare(y.eventId);
  });
}
function fromCloud(row){
  return {eventId:row.event_id,id:row.word_id,skill:row.skill,
    kind:row.event_kind,assisted:!!row.assisted,
    at:Date.parse(row.occurred_at),baseline:row.baseline||undefined};
}
function toCloud(e,user){
  return {user_id:user,event_id:e.eventId,word_id:e.id,skill:e.skill,
    event_kind:e.kind,assisted:!!e.assisted,
    occurred_at:new Date(e.at).toISOString(),
    baseline:e.kind==="baseline"?e.baseline:null};
}
async function pullAll(client,user){
  var all=[],start=0;
  for(;;){
    var res=await client.from(TABLE)
      .select("event_id,word_id,skill,event_kind,assisted,occurred_at,baseline")
      .eq("user_id",user)
      .order("occurred_at",{ascending:true})
      .order("event_id",{ascending:true})
      .range(start,start+499);
    if(res.error)throw res.error;
    var batch=res.data||[];
    all.push.apply(all,batch.map(fromCloud).filter(validEvent));
    if(batch.length<500)break;
    start+=500;
    if(start>100000)throw new Error("Số lần ôn vượt giới hạn đồng bộ; liên hệ hỗ trợ.");
  }
  return all;
}
async function getClient(){
  var auth=global.VocabCloudSync;
  if(!auth||typeof auth.getClient!=="function")throw new Error("Đăng nhập chưa sẵn sàng");
  return auth.getClient();
}
async function syncNow(){
  if(!signedIn||!userId||!store)return status();
  if(syncPromise)return syncPromise;
  var owner=userId;
  syncPromise=(async function(){
    syncing=true;notify();
    try{
      var client=await getClient();
      var remote=await pullAll(client,owner);
      if(owner!==userId)return status();
      var remoteIds=new Set(remote.map(function(e){return e.eventId;}));
      // Collect the CURRENT ledger after the await, so typing during a fetch
      // is not discarded. Every review has its own globally unique event ID.
      var local=ledger.events.slice();
      var localIds=new Set(local.map(function(e){return e.eventId;}));
      var hasNewRemote=remote.some(function(e){return !localIds.has(e.eventId);});
      var merged=mergeEvents(local,remote);
      ledger.events=merged;save();
      var missing=local.filter(function(e){return !remoteIds.has(e.eventId);});
      for(var n=0;n<missing.length;n+=BATCH){
        if(owner!==userId)break;
        var batch=missing.slice(n,n+BATCH).map(function(e){return toCloud(e,owner);});
        var result=await client.from(TABLE).upsert(batch,{
          onConflict:"user_id,event_id",ignoreDuplicates:true
        });
        if(result.error)throw result.error;
      }
      if(owner!==userId)return status();
      // New reviews entered during uploads remain in ledger; the next sync
      // flushes them without reusing IDs or resetting local progress.
      var final=mergeEvents(ledger.events,merged);
      ledger.events=final;save();
      // Avoid resetting input focus / SRS state on every polling pass.
      if(hasNewRemote){store.rebuild(final);revision++;}
      lastRemoteCount=remoteIds.size+missing.length;
      lastSyncAt=Date.now();lastError="";
      notify();
      if(final.length>lastRemoteCount)queueSync();
    }catch(error){
      lastError=String(error?.message||error||"Đồng bộ thất bại");
      notify();
    }finally{syncing=false;syncPromise=null;notify();}
    return status();
  })();
  return syncPromise;
}
function queueSync(){
  clearTimeout(debounce);
  debounce=setTimeout(function(){syncNow().catch(function(){})},650);
}
function switchOwner(id){
  var newOwner=id||"guest";
  if(newOwner===activeOwner)return;
  save();
  var claimed="";
  try{claimed=localStorage.getItem(CLAIMED_KEY)||"";}catch(e){}
  if(activeOwner==="guest"&&newOwner!=="guest"&&(!claimed||claimed===newOwner)){
    // First login: import this browser's existing anonymous learning once.
    var target=load(newOwner);
    target.events=mergeEvents(target.events,ledger.events);
    activeOwner=newOwner;ledger=target;save();
    try{localStorage.setItem(CLAIMED_KEY,newOwner);}catch(e){}
  }else{
    // Never send account A's learning to account B.
    activeOwner=newOwner;ledger=load(newOwner);
  }
  lastRemoteCount=0;lastSyncAt=0;
  if(store)store.rebuild(ledger.events);
  revision++;
  notify();
}
function handleAuth(statusInfo){
  var nextId=statusInfo?.signedIn?String(statusInfo.userId||""):"";
  if(nextId && nextId!==userId){
    userId=nextId;email=String(statusInfo.email||"");
    signedIn=true;switchOwner(nextId);queueSync();
  }else if(!nextId && userId){
    userId="";email="";signedIn=false;
    // Keep the former signed-in learning in a local account-specific cache.
    // It will be retrieved again when that same account signs in.
    notify();
  }else{
    signedIn=!!nextId;
    if(nextId){email=String(statusInfo.email||"");queueSync();}
    notify();
  }
  ready=true;
}
function boot(){
  var auth=global.VocabCloudSync;
  if(!auth || typeof auth.init!=="function"){
    if(++bootTries<80)bootTimer=setTimeout(boot,250);
    else{ready=true;lastError="Đồng bộ tài khoản chưa sẵn sàng";notify();}
    return;
  }
  unsubscribeAuth=auth.onChange(function(payload){
    if(payload.type==="ready"||payload.type==="auth"){
      handleAuth(payload.status);
    }
  });
  auth.init().then(function(){handleAuth(auth.status());}).catch(function(error){
    ready=true;lastError=String(error?.message||error);notify();
  });
  if(!poll)poll=setInterval(function(){
    if(!document.hidden&&signedIn)syncNow().catch(function(){});
  },POLL_MS);
}
function connect(srs,onUpdate){
  store=srs;
  listener=onUpdate;
  var claimed="";
  try{claimed=localStorage.getItem(CLAIMED_KEY)||"";}catch(e){}
  activeOwner=claimed||"guest";
  ledger=load(activeOwner);
  if(!claimed)snapshotLegacy();
  else if(ledger.events.length){store.rebuild(ledger.events);revision++;}
  if(unlisten)unlisten();
  unlisten=store.onChange(onStudyEvent);
  if(!bootTimer)boot();
  global.addEventListener("online",queueSync);
  global.addEventListener("focus",function(){if(signedIn)queueSync();});
  document.addEventListener("visibilitychange",function(){
    if(!document.hidden && signedIn)queueSync();
  });
  notify();
}
function onChange(callback){
  pageListeners.add(callback);
  return function(){pageListeners.delete(callback);};
}
global.Book2100CloudSync={connect:connect,syncNow:syncNow,status:status,onChange:onChange,
  _mergeEvents:mergeEvents,_validEvent:validEvent};
})(window);
