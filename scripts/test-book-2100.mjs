import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";

const read=(p)=>readFile(new URL("../"+p,import.meta.url),"utf8");
const ctx={window:{}};
vm.runInNewContext(await read("book-2100-data.js"),ctx,{filename:"book-2100-data.js"});
const book=ctx.window.BOOK_2100_DATA;
assert.equal(book?.steps?.length,2,"Only the photographed STEPs 1–2 may be released");
assert.deepEqual(Array.from(book.steps,step=>step.entries.length),[12,12],"Each page has 12 words");
let rows=Array.from(book.steps).flatMap(step=>Array.from(step.entries));
assert.deepEqual(rows.map(x=>x.n),Array.from({length:24},(_,i)=>i+1));
const expected1=["people","family","friend","school","student","teacher","homework","day","morning","afternoon","night","time"];
const expected2=["week","month","year","May","October","summer","winter","animal","dog","rabbit","book","movie"];
assert.deepEqual(rows.map(x=>x.en),[...expected1,...expected2],"Book word order must match photos");
for(const row of rows){
  for(const name of ["en","vi","ja","ipa","sentence","sentenceVi","sentenceJa"]){
    assert.equal(typeof row[name],"string",row.n+": missing "+name);
    assert.ok(row[name].trim(),row.n+": empty "+name);
  }
  assert.ok(Array.isArray(row.extra),row.n+": missing EN+VI explanation");
  for(const extra of row.extra){
    assert.ok(extra.length===2 && extra[0] && extra[1],row.n+": incomplete EN+VI explanation");
  }
  assert.ok(!/[ぁ-ん]{5,}\s*$/.test(row.ja),"Japanese word ruby must be inline");
}
assert.ok(rows.some(x=>/[\u4e00-\u9fff]+\{[^\}]+\}/u.test(x.sentenceJa)),"Furigana must be available");
const js=await read("book-2100.js");
new vm.Script(js,{filename:"book-2100.js"});
assert.match(js,/if\(!typed\)\{focusNext\(n,type\);return;\}/,"Empty Enter moves to the next item");
assert.match(js,/inputNode\.value="";/,"Correct answer clears input");
assert.match(js,/state\.doneWords/,"Word progress persists separately");
assert.match(js,/state\.doneSentences/,"Sentence progress persists separately");
assert.match(js,/state\.showJa/,"Japanese visibility independent");
assert.match(js,/root\.hidden=true/,"Exit restores the original shell");
assert.match(js,/window\.AITTS\.speak/,"English audio uses the existing engine");
const css=await read("book-2100.css");
assert.match(css,/position:fixed/,"Reader must be full screen");
assert.match(css,/@media\(max-width:760px\)/,"Phone portrait gets responsive layout");
const index=await read("index.html");
assert.match(index,/book-2100-data\.js/);
assert.match(index,/book-2100\.js/);
assert.match(index,/book-2100\.css/);
const build=await read("scripts/build-static.mjs");
assert.match(build,/book-2100-step-/,"New book entries must join the cloud TTS allowlist");
assert.match(build,/"book-2100\.css"/,"Book styles must ship in dist");
const sw=await read("sw.js");
assert.match(sw,/book-2100\.js/,"PWA must cache the book reader");
console.log("2100 book checks passed: 2 STEPs, 24 source words, 24 example sentences, bilingual meaning, furigana, isolated reader, Enter recall, audio and deployment assets.");
