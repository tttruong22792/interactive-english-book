import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source=readFileSync(new URL('../data/english/active-study-packs.js',import.meta.url),'utf8');
const viSource=readFileSync(new URL('../data/english/chunk-usage-vi.js',import.meta.url),'utf8');
const context={window:{}};
runInNewContext(source,context,{filename:'data/english/active-study-packs.js'});
runInNewContext(viSource,context,{filename:'data/english/chunk-usage-vi.js'});

const packs=Object.values(context.window.ACTIVE_STUDY_PACKS||{});
const usage=context.window.CHUNK_USAGE_EXAMPLES||{};
const usageVi=context.window.CHUNK_USAGE_EXAMPLE_VI||{};
let important=0;

for(const pack of packs){
  for(const group of ['activeChunks','recognitionChunks']){
    for(const row of pack[group]||[]){
      important++;
      const key=String(row[0]||'').toLowerCase();
      assert.ok(Array.isArray(usage[key]),'Missing usage examples: '+row[0]);
      assert.equal(usage[key].length,5,'Expected exactly five examples: '+row[0]);
      assert.equal(new Set(usage[key].map(x=>String(x).toLowerCase())).size,5,'Examples must be unique: '+row[0]);
      assert.ok(Array.isArray(usageVi[key]),'Missing Vietnamese meanings: '+row[0]);
      assert.equal(usageVi[key].length,5,'Expected five Vietnamese meanings: '+row[0]);
      usage[key].forEach((example,index)=>{
        assert.ok(String(example).trim().split(/\s+/).length<=14,'Keep examples compact: '+example);
        assert.ok(String(usageVi[key][index]||'').trim().length>0,'Vietnamese meaning missing: '+row[0]+' #'+(index+1));
      });
    }
  }
}

assert.equal(important,110,'Expected 10 important chunks across 11 lessons');
assert.deepEqual(
  Array.from(usage['take a closer look']),
  [
    'Take a closer look at this.',
    'Take a closer look at the problem.',
    'Take a closer look at the data.',
    'Take a closer look at the screen.',
    'Take a closer look at the settings.'
  ]
);
assert.deepEqual(
  Array.from(usageVi['think it over']),
  [
    'suy nghĩ kỹ việc đó tối nay.',
    'suy nghĩ kỹ trước khi quyết định.',
    'dành một ngày để suy nghĩ kỹ.',
    'suy nghĩ thật kỹ.',
    'suy nghĩ kỹ rồi phản hồi lại cho tôi.'
  ]
);
console.log('PASS: 110 important chunk cards have five EN examples and five Vietnamese meanings');
