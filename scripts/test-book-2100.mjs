import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";

const read=p=>readFile(new URL("../"+p,import.meta.url),"utf8");
const modules=["book-2100-data.js","book-2100-steps-03-06.js","book-2100-steps-07-12.js",
"book-2100-steps-13-18.js","book-2100-steps-19-23.js","book-2100-steps-24-29.js","book-2100-steps-30-33.js"];
const chunks=["book-2100-collocations-core.js","book-2100-collocations-001-073.js","book-2100-collocations-074-134.js","book-2100-collocations-135-194.js","book-2100-collocations-195-254.js","book-2100-collocations-255-316.js","book-2100-collocations-317-376.js","book-2100-collocations-377-400.js"];
const ctx=vm.createContext({window:{}});
for(const path of [...modules,...chunks]) vm.runInContext(await read(path),ctx,{filename:path});
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
    assert.ok(item.extra.length>=3,item.n+": must have at least 3 practical collocations");
    assert.equal(item.extraSource,"editorial-daily-chunks",item.n+": must contain editorial chunks");
    const unique=new Set();
    for(const [english,vietnamese] of item.extra){
      assert.ok(english.trim().length>=3,item.n+": missing English collocation");
      assert.ok(vietnamese.trim().length>=3,item.n+": missing Vietnamese meaning");
      assert.ok(!unique.has(english.toLowerCase()),item.n+": duplicate collocation "+english);
      unique.add(english.toLowerCase());
    }
    assert.ok(!item.sentence.includes("\n"),item.n+": English sentence must occupy one logical row");
  }
}
assert.ok(rows.some(x=>/[\u4e00-\u9fff]+\{[^\}]+\}/u.test(x.sentenceJa)),"Furigana annotations should be present");
assert.equal(rows.filter(x=>x.sentenceJaSource==="reconstructed").length,376,"Restored translations must be marked");
assert.ok(rows[0].extra.some(x=>x[0]==="a lot of people"),"Preserve original source book explanation");
assert.ok(rows[2].extra.some(x=>x[0]==="make friends"),"Preserve original source chunk");
assert.ok(rows[60].extra.some(x=>x[0]==="go through the details"),"Include workplace collocations");
assert.ok(rows[399].extra.some(x=>x[0]==="the day before yesterday"),"Include final word expansion");
const tourist=rows.find(row=>row.en==="tourist");
assert.ok(tourist,"tourist must still be present in source text");
assert.equal(tourist.wordAudio,"Tourist.","tourist must have a fresh audio identifier");
assert.ok(tourist.wordAudioMinSeconds>=0.5,"too-short tourist clips should be rejected");
const totalChunks=rows.reduce((n,row)=>n+row.extra.length,0);
assert.ok(totalChunks>=1200,"Expected at least 1,200 English/Vietnamese collocations");
const js=await read("book-2100.js");
new vm.Script(js,{filename:"book-2100.js"});
assert.match(js,/if\(!typed\)\{focusNext\(n,type\);return;\}/,"Enter on blank advances");
assert.match(js,/inputNode\.value="";/,"Correct answer clears entry");
assert.ok(js.includes("showAnswerMark(inputNode,\"correct\")"),"Correct words and sentences show green check");
assert.ok(js.includes("showAnswerMark(inputNode,\"wrong\")"),"Wrong words and sentences show red cross");
assert.ok(js.includes('mark.textContent=wrong?"✕":"✓"'),"Only symbols are shown on answer check");
assert.doesNotMatch(js,/Chính xác! Có thể nhập lại|Chưa đúng, hãy thử lại\./,"No inline feedback sentences");
assert.doesNotMatch(js,/class="bk-input-note"/,"No feedback message element");
assert.ok(js.includes("e.wordAudio||e.en"),"Use the corrected tourist word-only audio");
assert.ok(js.includes("e.wordAudioMinSeconds"),"Minimum audio duration must be enforced for affected words");
assert.match(js,/state\.doneWords/,"Word progress saved separately");
assert.match(js,/state\.doneSentences/,"Sentence progress saved separately");
assert.match(js,/state\.showJa/,"Japanese show/hide");
assert.match(js,/root\.hidden=true/,"Book exits cleanly");
assert.match(js,/window\.AITTS\.speak/,"English TTS integrated");
assert.match(js,/root\.classList\.toggle\("bk-fit"/,"Desktop fit selectable");
assert.match(js,/BOOK\.steps\.length/,"STEP count dynamic");
assert.match(js,/function showChunks\(n\)/,"Full collocation overlay");
assert.match(js,/data-chunks/,"Inline full-list buttons");
assert.match(js,/data-phrase-index/,"Each collocation has independent audio");
assert.match(js,/type==="chunk"/,"Collocation TTS dispatch");
assert.match(js,/showEnglish=state\.showEn&&state\.mode!=="word"/,"English hidden during word recall");
assert.match(js,/closeChunks\(\)/,"Overlay close handler");
const css=await read("book-2100.css");
assert.match(css,/\.book2100\.bk-fit \.bk-scroll/,"Desktop single-screen reader");
assert.match(css,/\.bk-chunk-layer/,"Overlay CSS present");
assert.match(css,/\.bk-done\.is-wrong/,"Red incorrect-answer icon");
assert.match(css,/\.bk-extra-line:nth-child\(n\+2\)/,"Compact visible preview in fit mode");
assert.match(css,/overflow:hidden/);
assert.match(css,/repeat\(var\(--bk-row-count,12\),minmax\(0,1fr\)\)/,"Rows fill available viewport height");
assert.match(css,/@media\(max-width:760px\)/,"Mobile responsive layout retained");
assert.ok(js.includes('practiceMeaning("word",item.vi)'),"Word recall shows Vietnamese meaning in the entry cell");
assert.ok(js.includes('practiceMeaning("sentence",item.sentenceVi)'),"Sentence recall shows Vietnamese meaning in the entry cell");
assert.ok(js.includes('state.mode==="read"?\'<small>\'+esc(item.ipa)'),"IPA must render only in reading mode");
assert.ok(js.includes('bk-focus-banner'),"Vietnamese focus banner must exist for iPhone keyboard");
assert.ok(js.includes('root.classList.add("bk-focused","bk-keyboard-open")'),"Focused keyboard must keep Vietnamese visible");
assert.ok(js.includes('if(state.mode==="word")state.showWordVi=true;'),"Word practice must always start with Vietnamese meaning");
assert.ok(js.includes('if(state.mode==="sentence")state.showSentenceVi=true;'),"Sentence practice must always start with Vietnamese meaning");
assert.ok(css.includes('bk-study-word .bk-show-words .bk-row'),"Mobile word drill must collapse to single focus column");
assert.ok(css.includes('bk-study-sentence .bk-show-sentences .bk-row'),"Mobile sentence drill must collapse to single focus column");
assert.ok(css.includes('grid-template-columns:36px minmax(0,1fr)'),"Mobile recall must fit without horizontal scrolling");
assert.ok(css.includes('.bk-practice-meaning'),"Vietnamese cue must sit before the input");
assert.ok(css.includes('.bk-keyboard-open .bk-bottom'),"Keyboard must release vertical room");
const index=await read("index.html");
let last=-1;
for(const file of [...modules,...chunks,"book-2100.js"]){
  const idx=index.indexOf('src="'+file+'?');
  assert.ok(idx>last,file+" should load after previous book script");
  last=idx;
}
assert.match(index,/book-2100\.css\?/);
const sw=await read("sw.js");
const build=await read("scripts/build-static.mjs");
for(const file of [...modules,...chunks,"book-2100.js","book-2100.css"]){
  assert.ok(sw.includes(file),"PWA must cache "+file);
  assert.ok(build.includes(file),"Production build must copy or load "+file);
}
assert.match(build,/flat\.length!==400/);
assert.match(build,/"book-collocation"/,"TTS manifest includes all English chunks");
assert.ok(build.includes('addManifestAudio(item.wordAudio'),"Production TTS manifest must include alternate tourist audio");
const player=await read("ai-tts.js");
assert.ok(player.includes("options.minDuration"),"Short and silent playback must trigger fallback");
console.log("PASS — Book 2100: 33 STEPs, 400 entries, "+totalChunks+" unduplicated EN/VI chunks, overlay playback, hidden English recall, desktop fit, offline cache and TTS allowlist.");
