import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync('vocab-arcade.js','utf8');
new vm.Script(code,{filename:'vocab-arcade.js'});

const samplePack={
  lessonId:'en-pattern-001',order:1,pattern:"I'd like to…",
  activeChunks:[
    ['make a reservation','đặt chỗ'],
    ['take a break','nghỉ một chút']
  ]
};
const fakeWindow={
  ACTIVE_STUDY_PACK_LIST:[samplePack],
  VocabularyTrainer:{
    studyChunks:()=>[
      {baseEn:'make a reservation',baseVi:'đặt chỗ',kind:'main'},
      {baseEn:'take a break',baseVi:'nghỉ một chút',kind:'main'},
      {baseEn:'a practice slot',baseVi:'khối phụ trợ',kind:'building'},
      {baseEn:'make a reservation',baseVi:'đặt chỗ',kind:'main'}
    ]
  },
  CORE_DICTIONARY:{
    appointment:['/əˈpɔɪntmənt/','cuộc hẹn','I have an appointment.'],
    available:['/əˈveɪləbəl/','có sẵn','Are you available?'],
    deadline:['/ˈdedlaɪn/','hạn chót','We have a deadline.']
  }
};
vm.runInNewContext(code,{window:fakeWindow,document:{}},{filename:'vocab-arcade.js'});
assert.ok(fakeWindow.VocabArcade?.mount,'Game module must mount');
assert.ok(fakeWindow.VocabArcade?.destroy,'Game module must clean up');
const chunks=fakeWindow.VocabArcade.available('chunks','en-pattern-001');
assert.equal(chunks.length,2,'Must deduplicate and exclude building-block placeholders');
assert.equal(chunks[0].en,'make a reservation');
assert.equal(chunks[0].vi,'đặt chỗ');
const words=fakeWindow.VocabArcade.available('words','en-pattern-001');
assert.ok(words.some(w=>w.en==='appointment'),'Word bank should use central dictionary');
assert.ok(words.some(w=>w.en==='deadline'),'Word bank should have diverse daily vocabulary');
assert.ok(words.every(w=>w.vi && w.en),'All targets must be bilingual');
const app=fs.readFileSync('app.js','utf8');
assert.match(app,/r\.name === 'arcade'/,'Routing must open Arcade');
assert.match(app,/VocabArcade\?\.destroy\?\.\(\)/,'Routing must cancel active animation');
assert.match(app,/bindGenericRoutes\(\);\s*\}\s*function renderFlashcards/,'Chunk Hub must bind navigation');
const build=fs.readFileSync('scripts/build-static.mjs','utf8');
assert.match(build,/"vocab-arcade\.js"/,'Runtime must bundle game engine');
assert.match(build,/"vocab-arcade\.css"/,'Build must ship game CSS');
assert.match(build,/runtime-20261112-word-blaster-v1\.js/,'Versioned runtime must exist');
const index=fs.readFileSync('index.html','utf8');
assert.match(index,/vocab-arcade\.css\?v=20261112-v1/);
assert.match(index,/runtime-20261112-word-blaster-v1\.js/);
const css=fs.readFileSync('vocab-arcade.css','utf8');
assert.match(css,/\.va-keyboard \.va-stage/,'Must handle virtual keyboard on mobile');
assert.match(css,/prefers-reduced-motion/,'Must support motion accessibility');
console.log('Vocabulary Arcade: logic, routing, build, mobile layout checks PASS');
