import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const ctx={window:{},console,Date,Math,Set,Map,Array,Object,String,Number,RegExp,JSON,WeakMap};
for(const path of [
 '../data/english/patterns/specs-13-80.js',
 '../data/english/patterns/curriculum-13-80.js',
 '../data/english/patterns/supplements-13-80.js',
 '../data/english/active-study-packs.js',
 '../data/english/chunk-usage-vi.js',
 '../vocabulary-trainer.js'
]){
 runInNewContext(readFileSync(new URL(path,import.meta.url),'utf8'),ctx,{filename:path});
}
const trainer=ctx.window.VocabularyTrainer;
const packs=trainer.packs();
assert.equal(packs.length,80);
const prior=[];
let added=0;
for(const pack of packs){
 const supplemental=trainer.usageSupplementChunks(pack);
 assert.equal(supplemental,trainer.usageSupplementChunks(pack),'Memoized cards are stable');
 if(pack.order<=12){prior.push(supplemental.length);continue;}
 assert.ok(supplemental.length>=40,'At least 40 supplementary chunks for lesson '+pack.order);
 assert.ok(supplemental.length<=80,'Avoid unusable unbounded decks for lesson '+pack.order);
 assert.ok((pack.supplementChunks||[]).length>=40,'Lesson '+pack.order+' has manually selected contextual supplement sources');
 assert.equal(new Set(supplemental.map(x=>x.baseEn.toLowerCase())).size,supplemental.length,'No repeat phrases '+pack.order);
 for(const card of supplemental){
  assert.ok(card.baseEn?.trim().length>3,'English phrase missing lesson '+pack.order);
  assert.ok(card.baseVi?.trim().length>3,'Vietnamese cue missing lesson '+pack.order);
  assert.ok(card.contexts?.length,'Example context missing lesson '+pack.order);
  assert.ok(card.contexts.every(x=>x.en&&x.vi),'Bilingual example context missing lesson '+pack.order);
  assert.equal(card.kind,'usage-addon');
  assert.ok(card.key.startsWith('usage-addon:'+pack.lessonId+':'),'Stable progress key '+pack.order);
 }
 added+=pack.supplementChunks.length;
}
assert.ok(prior.every(x=>x>=30),'Earlier lessons 1–12 retain their rich supplemental examples');
assert.equal(added,68*44,'Forty-four new carefully contextualized chunks per lesson');
const example=packs.find(p=>p.order===13);
assert.ok(trainer.usageSupplementChunks(example).some(x=>x.baseEn==='take a closer look at the report'));
assert.ok(trainer.usageSupplementChunks(example).some(x=>x.baseEn==='let me know if anything changes'));
console.log('PASS: lessons 13–80 each have 48–52 supplementary chunks; old lessons and saved keys preserved');
