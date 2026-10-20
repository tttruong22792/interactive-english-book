import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const w={};
const ctx={window:w,console,Date,Math,Set,Map,Array,Object,String,Number,RegExp,JSON,WeakMap};
for(const file of [
 '../data/english/patterns/specs-13-80.js',
 '../data/english/patterns/curriculum-13-80.js',
 '../data/english/patterns/supplements-13-80.js',
 '../data/english/active-study-packs.js',
 '../data/english/chunk-usage-vi.js',
 '../vocabulary-trainer.js',
 '../data/english/unique-chunk-bank.js',
 '../data/english/unique-study-chunks.js'
])runInNewContext(readFileSync(new URL(file,import.meta.url),'utf8'),ctx,{filename:file});
const t=w.VocabularyTrainer;
assert.equal(t.packs().length,80,'Exactly 80 lessons');
const normalized=s=>String(s).toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9'\s]/g,' ').replace(/\s+/g,' ').trim();
const seen=new Map();let count=0;
for(const p of t.packs()){
 const main=t.studyChunks(p).filter(c=>c.kind!=='building');
 const addons=t.usageSupplementChunks(p);
 assert.equal(main.length,10,'10 meaningful main chunks per lesson '+p.order);
 assert.equal(addons.length,40,'40 supplements per lesson '+p.order);
 for(const card of [...main,...addons]){
  assert.ok(card.baseVi.trim().length>2,'Missing Vietnamese meaning in '+p.order);
  const key=normalized(card.baseEn);
  assert.ok(!seen.has(key),'Duplicate learning chunk "'+card.baseEn+'" in '+seen.get(key)+' and '+p.order);
  seen.set(key,p.order);count++;
  if(card.kind==='main'){
   assert.equal(card.usageExamples.length,5,'Five contextual uses of main chunk '+card.baseEn);
   assert.ok(card.usageExamples.every(x=>x.vi?.trim()),'Missing five-use Vietnamese meaning');
  }else{
   assert.ok(card.contexts?.length>0,'Supplement lacks concrete context '+card.baseEn);
   assert.ok(card.contexts[0].vi?.trim(),'Supplement lacks Vietnamese context '+card.baseEn);
  }
 }
}
assert.equal(count,4000);
assert.equal(w.CHUNK_UNIQUE_COUNT>=4000,true);
assert.ok(w.UNIQUE_CHUNK_BANK.length>=4000,'Adequate variety across life domains');
const aliasEntry=Object.entries(w.CHUNK_CANONICAL_SAVED_ALIASES).find(([k,v])=>v.some(x=>x!==k));
assert.ok(aliasEntry,'Existing duplicate progress is not discarded');
const [ownerKey,aliasKeys]=aliasEntry;
const owner=t.packs().flatMap(p=>[...t.studyChunks(p).filter(x=>x.kind==='main'),...t.usageSupplementChunks(p)]).find(c=>c.key===ownerKey);
assert.ok(owner,'Canonical owner for saved progress must be available');
const oldSaved={[aliasKeys[0]]:{trainer:{reviewCount:4,skills:{recall:2,recognize:2},updatedAt:12345}}};
assert.equal(t.progressFor(owner,oldSaved).reviewCount,4,'Progress from old duplicate card must remain visible');
assert.ok(t.progressFor(owner,oldSaved).skills.recall>=2,'Legacy active recall grade must be preserved');
console.log('PASS 80 lessons: exactly 4,000 distinct learnable chunks; five bilingual contexts per main card; legacy recall progress kept');
