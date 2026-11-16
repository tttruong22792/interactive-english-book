import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";

const read=p=>readFile(new URL("../"+p,import.meta.url),"utf8");
const modules=["book-2100-data.js","book-2100-steps-03-06.js","book-2100-steps-07-12.js",
"book-2100-steps-13-18.js","book-2100-steps-19-23.js","book-2100-steps-24-29.js","book-2100-steps-30-33.js"];
const ctx=vm.createContext({window:{}});
for(const path of modules) vm.runInContext(await read(path),ctx,{filename:path});
const book=ctx.window.BOOK_2100_DATA;
assert.equal(book?.steps?.length,33,"All 33 STEPs should be loaded");
assert.deepEqual(Array.from(book.steps,x=>x.id),Array.from({length:33},(_,i)=>i+1),"STEP order must be 1–33");
const rows=Array.from(book.steps).flatMap(x=>Array.from(x.entries));
assert.equal(rows.length,400,"LEVEL 1 must contain 400 words");
assert.deepEqual(rows.map(x=>x.n),Array.from({length:400},(_,i)=>i+1),"Numbers must be unique, contiguous 1–400");
assert.deepEqual(rows.slice(0,3).map(x=>x.en),["people","family","friend"]);
assert.deepEqual(rows.slice(-3).map(x=>x.en),["around","after","before"]);
for(const step of book.steps){
  assert.equal(step.start,step.entries[0].n);
  assert.equal(step.end,step.entries[step.entries.length-1].n);
  assert.ok(step.entries.length===12||step.entries.length===13,"STEP "+step.id+" has invalid length");
  for(const item of step.entries){
    for(const key of ["en","vi","ja","sentence","sentenceVi","sentenceJa"]){
      assert.equal(typeof item[key],"string",item.n+": "+key+" must be a string");
      assert.ok(item[key].trim(),item.n+": "+key+" must not be empty");
    }
    assert.ok(Array.isArray(item.extra),item.n+": explanation list must be an array");
    assert.ok(!item.sentence.includes("\n"),item.n+": English sentence must occupy one logical row");
  }
}
assert.ok(rows.some(x=>/[\u4e00-\u9fff]+\{[^\}]+\}/u.test(x.sentenceJa)),"Furigana annotations should be present");
assert.equal(rows.filter(x=>x.sentenceJaSource==="reconstructed").length,376,"Restored translations must be marked");
const js=await read("book-2100.js");
new vm.Script(js,{filename:"book-2100.js"});
assert.match(js,/if\(!typed\)\{focusNext\(n,type\);return;\}/,"Enter on blank advances");
assert.match(js,/inputNode\.value="";/,"Correct answer clears entry");
assert.match(js,/state\.doneWords/,"Word progress saved separately");
assert.match(js,/state\.doneSentences/,"Sentence progress saved separately");
assert.match(js,/state\.showJa/,"Japanese show/hide");
assert.match(js,/root\.hidden=true/,"Book exits cleanly");
assert.match(js,/window\.AITTS\.speak/,"English TTS integrated");
assert.match(js,/root\.classList\.toggle\("bk-fit"/,"Desktop fit selectable");
assert.match(js,/BOOK\.steps\.length/,"STEP count dynamic");
const css=await read("book-2100.css");
assert.match(css,/\.book2100\.bk-fit \.bk-scroll/,"Desktop single-screen reader");
assert.match(css,/overflow:hidden/);
assert.match(css,/repeat\(var\(--bk-row-count,12\),minmax\(0,1fr\)\)/,"Rows fill available viewport height");
assert.match(css,/@media\(max-width:760px\)/,"Mobile responsive layout retained");
const index=await read("index.html");
let last=-1;
for(const file of [...modules,"book-2100.js"]){
  const idx=index.indexOf('src="'+file+'?');
  assert.ok(idx>last,file+" should load after previous book script");
  last=idx;
}
assert.match(index,/book-2100\.css\?/);
const sw=await read("sw.js");
const build=await read("scripts/build-static.mjs");
for(const file of [...modules,"book-2100.js","book-2100.css"]){
  assert.ok(sw.includes(file),"PWA must cache "+file);
  assert.ok(build.includes(file),"Production build must copy or load "+file);
}
assert.match(build,/flat\.length!==400/);
console.log("PASS — Book 2100: 33 STEPs, 400 numbered entries/sentences, VI/JA, ruby, Enter, desktop fit, TTS allowlist and PWA.");
