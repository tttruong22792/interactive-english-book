import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Regression: changing the source lesson must update BOTH the select and the
// displayed/audio queue. This also catches duplicate DOM IDs.
const source=readFileSync(new URL('../chunk-listener.js',import.meta.url),'utf8');
const p1={lessonId:'en-pattern-001',order:1,pattern:"I'd like to…"};
const p2={lessonId:'en-pattern-002',order:2,pattern:"I'm going to…"};
const cards={
  [p1.lessonId]:[{baseEn:'take a break',baseVi:'nghỉ một chút',examples:[{en:"I'd like to take a break.",vi:'Tôi muốn nghỉ một chút.'}]}],
  [p2.lessonId]:[{baseEn:'stop by',baseVi:'ghé qua',examples:[{en:"I'm going to stop by the supermarket.",vi:'Tôi định ghé siêu thị.'}]}]
};
const select={
  value:p2.lessonId,
  handlers:{},
  addEventListener(event,callback){this.handlers[event]=callback;}
};
const fakePlayer={
  style:{},
  setAttribute(){},
  removeAttribute(){},
  addEventListener(){},
  pause(){},
  load(){}
};
const fakeDocument={
  querySelector(selector){return selector==='#vocabListenSourceLesson'?select:null;},
  querySelectorAll(){return [];},
  createElement(tag){assert.equal(tag,'audio');return fakePlayer;},
  body:{appendChild(){}},
  addEventListener(){}
};
const fakeWindow={
  VocabularyTrainer:{studyChunks(pack){return cards[pack.lessonId];}}
};
const sandbox={window:fakeWindow,document:fakeDocument,navigator:{},console};
runInNewContext(source,sandbox,{filename:'chunk-listener.js'});
const listener=fakeWindow.ChunkListener;
assert.ok(listener,'ChunkListener is available');

let rendered='';
let saveCount=0;
const env={
  selected:p1,packs:[p1,p2],
  state:{vocabListenSettings:{lessonId:p1.lessonId,contentMode:'sentences',size:'all',repeat:3,rate:1,gap:1200,order:'sequential',loop:true}},
  esc(value){return String(value??'');},
  uiIcon(){return '';},
  shell(content){return content;},
  saveState(){saveCount++;},
  renderVocab(){rendered=listener.screen(env);},
  toast(){}
};

rendered=listener.screen(env);
assert.match(rendered,/I'd like to take a break\./);
const ids=[...rendered.matchAll(/id="([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(ids).size,ids.length,'No duplicate HTML element IDs');
assert.equal(ids.filter(id=>id==='vocabListenSourceLesson').length,1,'Lesson selection has its own unique ID');
assert.equal(ids.filter(id=>id==='vocabListenCurrentLesson').length,1,'Player lesson label has a different unique ID');

listener.bind(env);
assert.equal(typeof select.handlers.change,'function','The lesson select has an active change handler');
select.handlers.change();
assert.equal(env.state.vocabListenSettings.lessonId,p2.lessonId,'Source lesson saved');
assert.equal(saveCount,1,'Selection persisted');
assert.match(rendered,/I'm going to stop by the supermarket\./,'Player rebuilt with lesson 2');
assert.doesNotMatch(rendered,/I'd like to take a break\./,'Lesson 1 removed from the new playlist');
assert.match(rendered,/<option value="en-pattern-002" selected>/,'Lesson 2 selected after rerender');

// External state changes should also invalidate any stale playlist.
env.state.vocabListenSettings.lessonId=p1.lessonId;
rendered=listener.screen(env);
assert.match(rendered,/I'd like to take a break\./);
assert.doesNotMatch(rendered,/I'm going to stop by the supermarket\./);
console.log('PASS: unique lesson IDs, selector binding, playlist refresh, and state synchronization');
