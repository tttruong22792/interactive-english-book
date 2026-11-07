import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const refUI=readFileSync(new URL("../data/english/reading-reference-ui.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../reading-studio.css",import.meta.url),"utf8");
const word={term:"unexpected",meaning:"không ngờ tới; ngoài dự kiến",contextVi:"Chúng tôi gặp những vấn đề ngoài dự kiến."};
const story={id:"speaking-01",day:1};
const state={vocabKind:"words",vocabView:"write",vocabRecall:{}};
const listeners={};
let spoken=[],stopped=0,saved=0,blurred=0;
const htmlClass=new Set();
const doc={
 activeElement:null,
 documentElement:{
  classList:{add:s=>htmlClass.add(s),remove:s=>htmlClass.delete(s)},
  style:{setProperty(){}}
 },
 querySelector(selector){return elements[selector]||null;},
 querySelectorAll(){return [];}
};
function element(){
 const classes=new Set();
 return {hidden:false,disabled:false,readOnly:false,value:"",innerHTML:"",textContent:"",
  className:"",isConnected:true,
  classList:{add:s=>classes.add(s),contains:s=>classes.has(s),remove:s=>classes.delete(s)},
  addEventListener(type,callback){listeners[type]=callback;},
  focus(){doc.activeElement=this;},blur(){doc.activeElement=null;blurred++;},
  select(){},closest(){return null;},getBoundingClientRect(){return {top:0,bottom:40};}
 };
}
const ids=["readingRecallForm","readingRecallInput","readingRecallFeedback","readingRecallCheck","readingRecallNext",
 "readingRecallListen","readingRecallHint","readingRecallReveal","readingRecallSkip","readingRecallDock"];
const elements=Object.fromEntries(ids.map(id=>["#"+id,element()]));
elements["#readingRecallNext"].hidden=true;
const context={
 window:{SPEAKING_REFERENCE:{wordsFor:()=>[word]},addEventListener(){},innerHeight:730,innerWidth:390},
 document:doc,requestAnimationFrame:fn=>fn(),setTimeout:()=>0
};
runInNewContext(refUI,context,{filename:"reading-reference-ui.js"});
const ui=context.window.ReadingReferenceUI;
const html=ui.vocabulary(story,state);
assert.ok(html.includes('class="reading-write-dock"'),"Actions need a dedicated non-scrolling dock");
assert.ok(html.includes('class="reading-write-scroll"'),"Only question content may scroll");
assert.ok(html.includes('id="readingRecallListen"'),"Pronunciation available before checking");
assert.ok(html.includes('form="readingRecallForm" type="submit"'),"Docked check submits the answer form");
assert.ok(html.indexOf('class="reading-write-scroll"')<html.indexOf('class="reading-write-dock"'),"Dock is outside the scrollable question");
assert.ok(css.includes(".reading-write-panel{display:flex;flex-direction:column;overflow:hidden;min-height:0}"),"Viewport uses flex layout");
assert.ok(css.includes(".reading-write-scroll{flex:1 1 auto;min-height:0;overflow-x:hidden;overflow-y:auto"),"Question scrolls independently");
assert.ok(css.includes(".reading-write-dock{flex:0 0 auto;"),"Footer never scrolls away");
const env={speak:async text=>{spoken.push(text);},saveState(){saved++;}};
const stop=()=>{stopped++;};
const rerender=()=>{};
ui.bindVocabulary(story,state,env,rerender,stop);
assert.equal(typeof elements["#readingRecallListen"].onclick,"function","Listen button is wired");
elements["#readingRecallListen"].onclick();
assert.deepEqual(spoken,["unexpected"],"Listen plays the English word before checking");
const form=elements["#readingRecallForm"],input=elements["#readingRecallInput"],next=elements["#readingRecallNext"],check=elements["#readingRecallCheck"];
input.value="unexpexted";
form.onsubmit({preventDefault(){}});
assert.equal(next.hidden,true,"Next must remain hidden after a wrong answer");
assert.ok(elements["#readingRecallFeedback"].innerHTML.includes("Chưa đúng"),"Wrong answer has feedback");
elements["#readingRecallListen"].onclick();
assert.equal(spoken.length,2,"Listen remains functional after a wrong answer");
input.value="unexpected";
form.onsubmit({preventDefault(){}});
assert.equal(next.hidden,false,"Next becomes visible after the correct answer");
assert.equal(check.hidden,true,"Check is replaced by Next on completion");
assert.ok(elements["#readingRecallDock"].classList.contains("completed"),"Dock enters compact completed mode");
assert.equal(blurred,1,"Keyboard closes after a correct answer");
assert.ok(ui.recallData(story,state).done.includes("unexpected"),"Correct typed word counts as remembered");
elements["#readingRecallListen"].onclick();
assert.equal(spoken.length,3,"Pronunciation remains accessible after success");
next.onclick();
assert.ok(saved>=3,"Continuing preserves the result");
let advanced=0;
ui.bindVocabulary(story,{...state,vocabRecall:{[story.id]:{done:[],missed:[],cursor:0,attempts:0}}},env,()=>{advanced++;},stop);
const visibleListen=elements["#readingRecallListen"];
visibleListen.onclick();
assert.equal(spoken.length,4,"A new attempt keeps its pronunciation control");
assert.ok(stopped>=4&&saved>=2,"Audio interruptions and progress save handlers remain active");
console.log("PASS fixed Vietnamese-to-English recall dock, audio before/after wrong/correct, and progression.");
