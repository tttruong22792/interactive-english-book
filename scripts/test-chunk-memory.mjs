import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const context={window:{},console,Date,Math,Set,Map,Array,Object,String,Number,RegExp,JSON};
for(const file of [
  '../data/english/patterns/specs-13-80.js',
  '../data/english/patterns/curriculum-13-80.js',
  '../data/english/active-study-packs.js',
  '../data/english/chunk-usage-vi.js',
  '../vocabulary-trainer.js',
  '../data/english/unique-chunk-bank.js',
  '../data/english/unique-study-chunks.js'
]){
  runInNewContext(readFileSync(new URL(file,import.meta.url),'utf8'),context,{filename:file});
}

const trainer=context.window.VocabularyTrainer;
assert.ok(trainer?.recordMemory,'Memory recall recorder is exported');

const packs=trainer.packs();
assert.equal(packs.length,80,'Expected 80 English pattern packs');

const important=[];
for(const pack of packs){
  const cards=trainer.studyChunks(pack).filter(card=>card.kind!=='building');
  assert.equal(cards.length,10,'Each pattern must expose 10 important chunks: '+pack.pattern);
  assert.ok(cards.every(card=>card.kind!=='building'),'No building blocks in memory deck');
  important.push(...cards);
}

assert.equal(important.length,800,'Expected 800 important chunks across 80 lessons');
const unique=new Map(important.map(card=>[String(card.baseEn).toLowerCase(),card]));
assert.equal(unique.size,800,'All 800 main chunks must be different across 80 lessons');

const supplements=packs.flatMap(pack=>trainer.usageSupplementChunks(pack));
assert.equal(supplements.length,3200,'Each lesson owns exactly 40 supplement cards');
const supplementUnique=new Map(supplements.map(card=>[String(card.baseEn).toLowerCase(),card]));
assert.equal(supplementUnique.size,3200,'All 3200 supplemental chunks must be distinct');
const combined=new Map([...important,...supplements].map(card=>[String(card.baseEn).toLowerCase(),card]));
assert.equal(combined.size,4000,'Zero duplicates between main and supplemental chunks');

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

console.log('PASS: 800 main + 3200 supplementary = 4000 unique chunks across 80 lessons; VI→EN recall works.');
