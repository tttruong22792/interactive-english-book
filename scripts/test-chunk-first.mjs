import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const context={window:{},console,Date,Math,Set,Map,Array,Object,String,Number,RegExp,JSON,performance:{now:()=>0}};
for(const file of [
  '../data/english/active-study-packs.js',
  '../data/english/chunk-usage-vi.js',
  '../vocabulary-trainer.js',
  '../data/english/pattern-frames-80.js',
  '../chunk-builder.js'
]){
  runInNewContext(readFileSync(new URL(file,import.meta.url),'utf8'),context,{filename:file});
}

const trainer=context.window.VocabularyTrainer;
const builder=context.window.ChunkBuilder;
const frames=context.window.PATTERN_FRAMES_80;

assert.equal(frames.length,80,'Canonical pattern library must contain all 80 frames');
assert.equal(frames[0].pattern,"I'd like to...");
assert.equal(frames[1].pattern,"I'm going to...");
assert.equal(frames[79].pattern,"As far as I know,...");

const packs=trainer.packs();
const core=builder.coreBank(packs);
assert.equal(core.length,94,'Core chunk bank should keep 94 unique core chunks');

const family=packs.flatMap(pack=>trainer.usageFamilyChunks(pack));
assert.ok(family.length>=400,'Chunk-family bank should expose hundreds of practical variants');
const familyText=new Set(family.map(card=>String(card.baseEn).toLowerCase()));
assert.ok(familyText.has('take a break for five minutes.'),'Family must include practical take-a-break variation');
assert.ok(familyText.has('take a closer look at the settings.'),'Family must include practical take-a-closer-look variation');

const takeBreak=core.find(item=>String(item.baseEn).toLowerCase()==='take a break');
assert.ok(takeBreak,'Core take a break exists');
const takeBreakFamily=builder.familyFor(takeBreak);
assert.ok(takeBreakFamily.length>=5,'Core chunk exposes multiple real-life family uses');

assert.equal(builder.combine("I'd like to...",'take a break'),"I'd like to take a break.");
assert.equal(builder.combine("I'm going to...",'make a reservation'),"I'm going to make a reservation.");
assert.equal(builder.combine("Could you...",'take a closer look'),"Could you take a closer look?");
assert.equal(builder.combine("Can you show me how to...",'make a reservation'),"Can you show me how to make a reservation?");

const productive=builder.frames();
assert.ok(productive.length>=25,'A substantial subset of the 80 frames must accept reusable verb chunks');
assert.ok(productive.some(frame=>frame.order===1));
assert.ok(productive.some(frame=>frame.order===6));
assert.ok(productive.some(frame=>frame.order===73));

console.log('PASS: Chunk-first system has 80 canonical frames, 94 core chunks, hundreds of family variants, and reusable sentence building.');
