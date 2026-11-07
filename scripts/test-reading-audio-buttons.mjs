import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const source=readFileSync(new URL("../data/english/reading-reference-ui.js",import.meta.url),"utf8");
const deepSource=readFileSync(new URL("../data/english/speaking-deep-ui.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../reading-studio.css",import.meta.url),"utf8");
const word={term:"responsibilities",meaning:"trách nhiệm",frequency:1,contextVi:"Trách nhiệm của tôi thay đổi."};
const phrase={name:"run into unexpected issues",meaning:"gặp vấn đề bất ngờ",sentence:"Sometimes we run into unexpected issues.",kind:"selected"};
const story={id:"speaking-01",day:1};
const state={vocabKind:"words",vocabView:"list",refShowEn:true,refShowVi:true};
function button(text){
 const attributes={},classes=new Set();
 return {dataset:{readingPronounce:text},textContent:"♫ Nghe",
  classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},
  setAttribute:(key,value)=>attributes[key]=value,
  getAttribute:key=>attributes[key]
 };
}
const listWord=button(word.term),listPhrase=button(phrase.name);
let buttons=[listWord];
const dom={
 documentElement:{classList:{remove(){}},style:{setProperty(){}}},
 querySelector(){return null;},
 querySelectorAll(selector){return selector==="[data-reading-pronounce]"?buttons:[];}
};
const win={SPEAKING_REFERENCE:{wordsFor:()=>[word],phrasesFor:()=>[phrase]}};
const context={window:win,document:dom};
runInNewContext(source,context,{filename:"reading-reference-ui.js"});
const ui=win.ReadingReferenceUI;
const wordsHtml=ui.vocabulary(story,state);
assert.ok(wordsHtml.includes('class="reading-audio-button"'),"Word list uses shared audio button");
assert.ok(!source.includes('$("[data-reading-pronounce]").forEach'),"No forEach on querySelector single element");
assert.ok(source.includes('Array.from(document.querySelectorAll("[data-reading-pronounce]"))'),"Bind every speaker via querySelectorAll");
assert.ok(css.includes("background:#fff;color:#6553b8"),"Speaker matches approved white purple-outline buttons");
assert.ok(wordsHtml.includes("♫ Nghe"),"Word list displays standard label");
const phrasesHtml=ui.vocabulary(story,{...state,vocabKind:"phrases"});
assert.ok(phrasesHtml.includes('class="reading-audio-button"'),"Phrase list uses shared button");
assert.ok(ui.vocabulary(story,{...state,vocabView:"write"}).includes('class="reading-audio-button"'),"Writing uses the same shared control");
assert.ok(css.includes(".reading-reference-panel .reading-audio-button"),"One CSS style for each pronunciation action");
assert.ok(deepSource.includes('class="reading-audio-button"'),"Day 01 explanation uses shared control");
assert.ok(deepSource.includes("ReadingReferenceUI?.playPronunciation"),"Deep explanations use shared audio handler");

const spoken=[],pending=[];
let stops=0;
const env={
 speak(text){spoken.push(text);return new Promise(resolve=>pending.push(resolve));},
 saveState(){},toast(message){throw Error("Unexpected audio error: "+message);}
};
const stop=()=>{stops++;};
ui.bindVocabulary(story,state,env,()=>{},stop);
assert.equal(typeof listWord.onclick,"function","Word button is bound");
listWord.onclick();
assert.equal(spoken.at(-1),word.term,"Word audio begins synchronously on tap");
assert.equal(listWord.getAttribute("aria-pressed"),"true","Playing state is visible");
assert.equal(listWord.textContent,"♫ Đang nghe","Playing label is shared");
buttons=[listPhrase];
ui.bindVocabulary(story,{...state,vocabKind:"phrases"},env,()=>{},stop);
listPhrase.onclick();
assert.equal(spoken.at(-1),phrase.name,"Phrase uses exact listed audio text");
assert.equal(listWord.textContent,"♫ Nghe","Previous speaker button is reset");
assert.equal(listPhrase.getAttribute("aria-pressed"),"true","Phrase has active state");
const writing=button(word.term);
ui.playPronunciation(writing,word.term,env,stop);
assert.equal(spoken.at(-1),word.term,"Written recall uses the same audio engine");
assert.equal(listPhrase.textContent,"♫ Nghe","Switching audio resets the previous button");
const deep=button("Hi everyone.");
ui.playPronunciation(deep,"Hi everyone.",env,stop);
assert.equal(spoken.at(-1),"Hi everyone.","Deep explanation uses shared engine");
assert.equal(writing.textContent,"♫ Nghe","Previous view's button resets");
pending.at(-1)();
await Promise.resolve();
await Promise.resolve();
assert.equal(deep.textContent,"♫ Nghe","Button resets after playback completion");
assert.ok(stops>=4,"All playback cancels any active reading loop before starting");
console.log("PASS vocabulary/phrase/writing/deep Listen buttons, playback and styling are unified.");
