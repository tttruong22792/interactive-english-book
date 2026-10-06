import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const context={window:{},console,Date,Math,Set,Map,Array,Object,String,Number,RegExp,JSON};
for(const file of [
  '../data/english/active-study-packs.js',
  '../data/english/chunk-usage-vi.js',
  '../vocabulary-trainer.js'
]){
  runInNewContext(readFileSync(new URL(file,import.meta.url),'utf8'),context,{filename:file});
}

const trainer=context.window.VocabularyTrainer;
assert.ok(trainer?.recordMemory,'Memory recall recorder is exported');

const packs=trainer.packs();
assert.equal(packs.length,11,'Expected 11 English pattern packs');

const important=[];
for(const pack of packs){
  const cards=trainer.studyChunks(pack).filter(card=>card.kind!=='building');
  assert.equal(cards.length,10,'Each pattern must expose 10 important chunks: '+pack.pattern);
  assert.ok(cards.every(card=>card.kind!=='building'),'No building blocks in memory deck');
  important.push(...cards);
}

assert.equal(important.length,110,'Expected 110 important chunk occurrences across lessons');
const unique=new Map(important.map(card=>[String(card.baseEn).toLowerCase(),card]));
assert.equal(unique.size,94,'All-lessons main deck should deduplicate to 94 chunks');

const supplements=packs.flatMap(pack=>trainer.usageSupplementChunks(pack));
assert.equal(supplements.length,508,'Expected all meaningful highlighted usage parts across lessons');
const supplementUnique=new Map(supplements.map(card=>[String(card.baseEn).toLowerCase(),card]));
assert.equal(supplementUnique.size,383,'Highlighted usage parts should deduplicate to 383 supplements');
const combined=new Map([...important,...supplements].map(card=>[String(card.baseEn).toLowerCase(),card]));
assert.equal(combined.size,476,'Main + supplement memory deck should have 476 unique learnable items');

for(const expected of ['for five minutes','after this','before we continue','from work','and get some fresh air']){
  assert.ok(supplementUnique.has(expected),'Missing highlighted supplement: '+expected);
}

const env={
  state:{saved:{}},
  saveState(){},
  queueVocabUpsert(){},
  esc:value=>String(value??''),
  uiIcon(){return '';}
};
const card=important[0];
trainer.recordMemory(env,card,true);
let progress=env.state.saved[card.key].trainer;
assert.ok(progress.skills.recall>=1,'Remembered card increases Recall');
assert.ok(progress.skills.recognize>=2,'Successful recall implies recognition');
assert.ok(progress.nextReviewAt>Date.now(),'Remembered card is scheduled for review');

trainer.recordMemory(env,card,false);
progress=env.state.saved[card.key].trainer;
assert.ok(progress.wrongCount>=1,'Forgotten card records an error');
assert.ok(progress.nextReviewAt>Date.now(),'Forgotten card is scheduled again soon');

const supplementCard=supplementUnique.get('for five minutes');
assert.equal(supplementCard.kind,'usage-addon');
assert.equal(supplementCard.parentEn,'take a break');
assert.match(supplementCard.contextEn,/Take a break for five minutes/i);
trainer.recordMemory(env,supplementCard,true);
assert.ok(env.state.saved[supplementCard.key].trainer.skills.recall>=1,'Supplement recall is tracked independently');

console.log('PASS: Memory deck = 94 main + 383 highlighted supplements / 476 unique combined; VI→EN ratings update Recall progress.');
