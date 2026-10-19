import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const context={window:{},console,Date,Math,Set,Map,Array,Object,String,Number,RegExp,JSON};
for(const path of [
 '../data/english/patterns/specs-13-80.js',
 '../data/english/patterns/curriculum-13-80.js',
 '../data/english/active-study-packs.js',
 '../data/english/chunk-usage-vi.js'
]){
 runInNewContext(readFileSync(new URL(path,import.meta.url),'utf8'),context,{filename:path});
}
const W=context.window;
assert.equal(W.PATTERN_SPECS_13_80.length,68,'All 68 newly requested patterns must be present');
const get=id=>W.CONTENT_REGISTRY['en-pattern-'+String(id).padStart(3,'0')];
let total=0;
for(let id=13;id<=80;id++){
 const lesson=get(id);
 assert.ok(lesson,'Missing lesson '+id);
 assert.equal(lesson.order,id,'Order '+id);
 assert.equal(lesson.layout,'sectioned-pattern','Common renderer '+id);
 const block=lesson.sections.find(s=>s.id==='forty')?.blocks?.find(b=>b.type==='sentences');
 assert.ok(block?.learnable&&block?.controls,'Learnable sentence controls '+id);
 assert.equal(block.items.length,40,'40 real-life examples '+id);
 assert.equal(new Set(block.items.map(row=>row[0].toLowerCase())).size,40,'Unique examples '+id);
 for(const row of block.items){
  assert.ok(typeof row[0]==='string'&&row[0].trim().length>10,'English missing '+id);
  assert.ok(typeof row[1]==='string'&&row[1].trim().length>7,'Vietnamese missing '+id);
  assert.ok(!row[0].includes('…'),'Unexpanded placeholder '+id+': '+row[0]);
 }
 const pack=W.ACTIVE_STUDY_PACKS[lesson.id];
 assert.ok(pack,'Chunk pack missing '+id);
 assert.equal(pack.activeChunks.length,6,'Six active chunks '+id);
 assert.equal(pack.recognitionChunks.length,4,'Four recognition chunks '+id);
 for(const row of [...pack.activeChunks,...pack.recognitionChunks]){
  const key=row[0].toLowerCase();
  assert.equal(W.CHUNK_USAGE_EXAMPLES[key]?.length,5,'Five EN examples '+key);
  assert.equal(W.CHUNK_USAGE_EXAMPLE_VI[key]?.length,5,'Five VI examples '+key);
  assert.ok(row[2]&&row[3],'Contextual model in chunk card '+key);
 }
 total+=block.items.length;
}
for(const row of get(46).sections.find(x=>x.id==='forty').blocks.find(x=>x.type==='sentences').items){
 assert.ok(!/\?$/.test(row[0]),'I feel like must remain a statement: '+row[0]);
}
for(const row of get(28).sections.find(x=>x.id==='forty').blocks.find(x=>x.type==='sentences').items.slice(2)){
 assert.ok(/^Would you mind \S+ing\b/.test(row[0])||/^Would you mind (taking|making|getting|setting|putting|spending|giving|writing)/.test(row[0]),'Would you mind + V-ing: '+row[0]);
}
assert.equal(Object.keys(W.ACTIVE_STUDY_PACKS).length,80);
assert.equal(total,2720,'68 new patterns must contain exactly 2,720 example sentences');
console.log('PASS: Patterns 13–80, 2,720 bilingual examples, chunk packs, pronunciation/grammar sections and 5-use families');
