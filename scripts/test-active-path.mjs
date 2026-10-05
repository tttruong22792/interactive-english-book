import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const dataSource=readFileSync(new URL('../data/english/active-study-packs.js',import.meta.url),'utf8');
const trainerSource=readFileSync(new URL('../vocabulary-trainer.js',import.meta.url),'utf8');

const context={
  window:{},
  console,
  Date,
  performance:{now:()=>0}
};
runInNewContext(dataSource,context,{filename:'active-study-packs.js'});
runInNewContext(trainerSource,context,{filename:'vocabulary-trainer.js'});

const trainer=context.window.VocabularyTrainer;
assert.ok(trainer?.nextPathStep,'Active Path selector is exported');

const lessonId='en-pattern-001';
const cards=trainer.studyChunks(trainer.packById(lessonId)).filter(card=>card.kind!=='building');
assert.equal(cards.length,10,'Each lesson has 10 important chunks');

let saved={};
let step=trainer.nextPathStep(saved,lessonId);
assert.equal(step.mode,'learn');
assert.equal(step.count,5,'Only five new chunks are introduced at once');

function saveStage(skills,extra={}){
  saved={};
  for(const card of cards){
    saved[card.key]={
      type:'study-card',
      trainer:{
        reviewCount:2,
        nextReviewAt:Date.now()+86400000,
        lastReviewedAt:Date.now(),
        successDates:['2026-10-01','2026-10-03','2026-10-05'],
        fastBestMs:900,
        skills:{understand:2,recognize:2,recall:2,fast:2,vary:2,discriminate:1,situation:2,use:2,...skills},
        ...extra
      }
    };
  }
}

saveStage({recall:0,fast:0,vary:0,discriminate:0,situation:0,use:0},{fastBestMs:0});
step=trainer.nextPathStep(saved,lessonId);
assert.equal(step.mode,'write','Recall comes after recognition');

saveStage({fast:0,vary:0,discriminate:0,situation:0,use:0},{fastBestMs:2500});
step=trainer.nextPathStep(saved,lessonId);
assert.equal(step.mode,'fast','Fast Recall comes after productive recall');

saveStage({vary:0,discriminate:0,situation:0,use:0});
step=trainer.nextPathStep(saved,lessonId);
assert.equal(step.mode,'variation','Variation comes after speed');

saveStage({discriminate:0,situation:0,use:0});
step=trainer.nextPathStep(saved,lessonId);
assert.equal(step.mode,'mix','Discrimination is mandatory before Automatic');

saveStage({situation:0,use:0});
step=trainer.nextPathStep(saved,lessonId);
assert.equal(step.mode,'situation','Situation recall follows discrimination');

saveStage({use:0});
step=trainer.nextPathStep(saved,lessonId);
assert.equal(step.mode,'sentence','Use/full sentence follows situation transfer');

saveStage({});
const auto=trainer.automaticStatus(saved[cards[0].key].trainer);
assert.equal(auto.automatic,true,'Automatic requires all skills plus spaced success');
assert.equal(auto.conditions.discriminate,true,'Automatic includes discrimination');

console.log('PASS: Active Path = Learn → Recall → Fast → Variation → Mix → Situation → Use → Automatic');
