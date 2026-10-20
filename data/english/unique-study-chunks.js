/* One learnable chunk, one lesson across the entire 80-pattern curriculum.
   Preserve saved keys on original owners; previously studied duplicates remain
   in user storage and are read as aliases on the unique owner card. */
(function(){
"use strict";
const W=window, trainer=W.VocabularyTrainer;
const bank=W.UNIQUE_CHUNK_BANK||[];
const packs=(W.ACTIVE_STUDY_PACK_LIST||[]).slice().sort((a,b)=>a.order-b.order);
if(!trainer||!bank.length||packs.length!==80)return;
const norm=value=>String(value||"").toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9'\s]/g," ").replace(/\s+/g," ").trim();
const slug=value=>String(value||"").toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80);
const taken=new Map(),aliases={},audit=[];
let bankIndex=0;
function associate(existing,alternate){
 if(!alternate||!existing||existing===alternate)return;
 (aliases[existing]||(aliases[existing]=[]));
 if(!aliases[existing].includes(alternate))aliases[existing].push(alternate);
}
function reserve(phrase,cardKey){
 const key=norm(phrase);
 if(!key)return false;
 const owner=taken.get(key);
 if(owner){associate(owner.key,cardKey);return false;}
 taken.set(key,{key:cardKey,phrase:String(phrase)});
 return true;
}
function selectNew(kind,pack,localFamilies){
 let loops=0,idx=bankIndex;
 while(loops<bank.length*2){
  const item=bank[idx%bank.length];idx++;loops++;
  if(!item){break;}
  if(taken.has(norm(item.en)))continue;
  const n=localFamilies.get(item.family)||0;
  if(n>=2 && loops<bank.length)continue;
  bankIndex=idx%bank.length;
  localFamilies.set(item.family,n+1);
  const key=(kind==='main'?'chunk2:':'usage-addon:')+pack.lessonId+':'+slug(item.en);
  reserve(item.en,key);
  return [item.en,item.vi,item.modelEn,item.modelVi];
 }
 throw new Error("Not enough varied non-repeating collocations to fill lesson #"+pack.order);
}
function makeUsage(phrase,meaning){
 const examples=[
  [phrase.charAt(0).toUpperCase()+phrase.slice(1)+".",meaning.charAt(0).toUpperCase()+meaning.slice(1)+"."],
  ["I need to "+phrase+".","Tôi cần "+meaning+"."],
  ["Could you "+phrase+"?","Bạn có thể "+meaning+" không?"],
  ["I'm going to "+phrase+".","Tôi sẽ "+meaning+"."],
  ["We should "+phrase+".","Chúng ta nên "+meaning+"."]
 ];
 W.CHUNK_USAGE_EXAMPLES[phrase.toLowerCase()]=examples.map(r=>r[0]);
 W.CHUNK_USAGE_EXAMPLE_VI[phrase.toLowerCase()]=examples.map(r=>r[1]);
}
const updated=[];
for(const pack of packs){
 const localFamilies=new Map();
 const originalMain=trainer.studyChunks(pack).filter(c=>c.kind==='main');
 const main=[];
 let removedMain=0,removedSupplement=0;
 for(const card of originalMain){
  if(reserve(card.baseEn,card.key)){
   main.push([card.baseEn,card.baseVi,card.modelEn,card.modelVi]);
  }else removedMain++;
 }
 // A learner still receives 10 useful, new-to-the-curriculum main chunks in
 // each lesson, rather than an empty deck after duplicates are removed.
 while(main.length<10){
  const row=selectNew('main',pack,localFamilies);
  main.push(row);
  makeUsage(row[0],row[1]);
 }
 const selectedMain=main.slice(0,10);
 // Keep old secondary building blocks only when not already assigned to a
 // main or secondary chunk in an earlier/current lesson.
 const building=[];
 for(const row of pack.buildingBlocks||[]){
  const id='chunk2:'+pack.lessonId+':'+slug(row?.[0]);
  if(row?.[0]&&reserve(row[0],id))building.push(row);
 }
 // Derive optional supplements from original meaningful examples. This is
 // intentionally done before replacing the pack, retaining legacy card keys.
 const originals=trainer.usageSupplementChunks(pack);
 const chosen=[];
 for(const card of originals){
  if(chosen.length>=40)break;
  if(reserve(card.baseEn,card.key)){
   chosen.push([card.baseEn,card.baseVi,card.contextEn||card.modelEn,card.contextVi||card.modelVi]);
  }else removedSupplement++;
 }
 while(chosen.length<40){
  const row=selectNew('supplement',pack,localFamilies);
  chosen.push(row);
 }
 const allowed=chosen.map(row=>norm(row[0]));
 const next={
  ...pack,
  activeChunks:selectedMain.slice(0,6),
  recognitionChunks:selectedMain.slice(6),
  buildingBlocks:building,
  supplementChunks:chosen,
  allowedSupplementKeys:allowed
 };
 // A fresh pack object bypasses the trainer's WeakMap cache of pre-migration
 // derived examples. All callers (including the commute player) see one owner.
 W.ACTIVE_STUDY_PACKS[pack.lessonId]=next;
 updated.push(next);
 audit.push({order:pack.order,main:main.length,supplement:allowed.length,removedMain,removedSupplement});
}
W.ACTIVE_STUDY_PACK_LIST=updated;
W.CHUNK_CANONICAL_SAVED_ALIASES=aliases;
W.CHUNK_UNIQUE_AUDIT=audit;
W.CHUNK_UNIQUE_COUNT=taken.size;
})();
