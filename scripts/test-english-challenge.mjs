import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const context={
  window:{},
  console,
  Date,
  Math,
  Set,
  Map,
  Array,
  Object,
  String,
  Number,
  RegExp,
  JSON
};

for(const file of [
  '../data/english/tenses.js',
  '../data/english/active-study-packs.js',
  '../data/english/chunk-usage-vi.js',
  '../vocabulary-trainer.js',
  '../english-challenge.js'
]){
  const source=readFileSync(new URL(file,import.meta.url),'utf8');
  runInNewContext(source,context,{filename:file});
}

const challenge=context.window.EnglishChallenge;
assert.ok(challenge?.collect,'Challenge collector is available');

const lesson={
  id:'en-pattern-test',
  order:99,
  title:"I'd like to…"
};
const lessonRows=[
  {en:"I'd like to take a break.",vi:'Tôi muốn nghỉ một chút.'},
  {en:"I'd like to check the schedule.",vi:'Tôi muốn kiểm tra lịch trình.'}
];
const shadowRows=[
  {en:"I'd like to take a closer look.",vi:'Tôi muốn xem kỹ hơn.',lessonId:lesson.id,lessonTitle:lesson.title}
];

const env={
  lessons:[lesson],
  collectLessonSentences(){return lessonRows;},
  shadowChallengeItems(){return shadowRows;},
  state:{lessonVisitsByLesson:{[lesson.id]:1},vocabHubLessonId:lesson.id}
};

const items=challenge.collect(env);
assert.ok(items.length>500,'Challenge should aggregate a large cross-module sentence bank');

const byEn=new Map(items.map(item=>[
  String(item.en).toLowerCase().replace(/[’]/g,"'"),
  item
]));

for(const row of lessonRows){
  const item=byEn.get(row.en.toLowerCase().replace(/[’]/g,"'"));
  assert.ok(item,'Pattern example must be present: '+row.en);
  assert.ok(item.modules.includes('patterns'),'Pattern source tag must be preserved');
  assert.ok(item.modules.includes('practice'),'Practice source tag must be preserved');
}
const shadow=byEn.get("i'd like to take a closer look.");
assert.ok(shadow?.modules.includes('shadowing'),'Shadowing example must be present');

const usage=context.window.CHUNK_USAGE_EXAMPLES||{};
let usageCount=0;
for(const examples of Object.values(usage)){
  for(const en of examples){
    usageCount++;
    const item=byEn.get(String(en).toLowerCase().replace(/[’]/g,"'"));
    assert.ok(item,'Every five-use chunk example must be in Challenge: '+en);
    assert.ok(item.modules.includes('chunks'),'Chunk source tag missing: '+en);
  }
}
assert.equal(usageCount,470,'Expected all 470 practical chunk examples');

const guide=context.window.TENSES_GUIDE||{};
const tensePairs=[];
for(const tense of guide.tenses||[]) for(const row of tense.examples||[]) tensePairs.push(row);
for(const group of guide.keyContrasts||[]) for(const row of group.examples||[]) tensePairs.push(row);
for(const row of guide.practice||[]) tensePairs.push([row.answer,row.prompt]);
assert.equal(tensePairs.length,54,'Expected all 54 structured tense examples/practice answers');
for(const [en] of tensePairs){
  const item=byEn.get(String(en).toLowerCase().replace(/[’]/g,"'"));
  assert.ok(item,'Tense example must be in Challenge: '+en);
  assert.ok(item.modules.includes('tenses'),'Tenses source tag missing: '+en);
}

const current=challenge.scopedItems(env,items,{source:'all',lessonId:'all',scope:'current'});
assert.ok(current.some(item=>item.modules.includes('patterns')),'Current lesson scope includes pattern examples');
assert.ok(current.some(item=>item.modules.includes('practice')),'Current lesson scope includes Practice examples');
assert.ok(current.some(item=>item.modules.includes('shadowing')),'Current lesson scope includes Shadowing examples');
assert.ok(!current.some(item=>item.modules.includes('tenses')&&item.lessonIds.length===0),'Current pattern scope does not pull unrelated tense-only examples');

const pattern1=challenge.scopedItems(env,items,{source:'all',lessonId:'en-pattern-001',scope:'all'});
assert.ok(pattern1.length>0,'Pattern #1 filter returns content');
assert.ok(pattern1.every(item=>item.lessonIds.includes('en-pattern-001')),'Pattern #1 filter keeps only lesson #1 content');
assert.ok(pattern1.some(item=>item.modules.includes('chunks')),'Pattern #1 filter includes Active Chunk examples');

const pattern2Chunks=challenge.scopedItems(env,items,{source:'chunks',lessonId:'en-pattern-002',scope:'all'});
assert.ok(pattern2Chunks.length>0,'Pattern #2 chunk filter returns content');
assert.ok(pattern2Chunks.every(item=>item.modules.includes('chunks')),'Pattern #2 + chunks keeps chunk source only');
assert.ok(pattern2Chunks.every(item=>item.lessonIds.includes('en-pattern-002')),'Pattern #2 + chunks keeps lesson #2 only');

const tenseIgnoresPattern=challenge.scopedItems(env,items,{source:'tenses',lessonId:'en-pattern-002',scope:'all'});
assert.ok(tenseIgnoresPattern.length>0,'Tenses remains available when a pattern filter was previously selected');
assert.ok(tenseIgnoresPattern.every(item=>item.modules.includes('tenses')),'Tenses source remains independent of pattern lessons');

console.log('PASS: Challenge aggregates all module examples and supports exact pattern filters such as I\'d like to… / I\'m going to….');
