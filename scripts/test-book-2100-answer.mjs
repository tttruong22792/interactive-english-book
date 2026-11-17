import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";
const read=x=>readFile(new URL("../"+x,import.meta.url),"utf8");
const js=await read("book-2100.js");
const desktop=await read("book-2100.css");
const mobile=await read("book-2100-mobile.css");
const html=await read("index.html"), sw=await read("sw.js");
new vm.Script(js,{filename:"book-2100.js"});
const begin=js.indexOf("  function answerButton(n,type){");
const end=js.indexOf("  function practiceMeaning(type,meaning){",begin);
assert.ok(begin>=0&&end>begin,"Answer functions must be present");
const section=js.slice(begin,end);
let popup=null,buttonAttributes=new Map(),created=[];
const button={
  dataset:{answerN:"12",revealAnswer:"sentence"},
  getAttribute:k=>buttonAttributes.get(k)||null,
  setAttribute:(k,v)=>{buttonAttributes.set(k,String(v));},
  getBoundingClientRect:()=>({left:50,top:480,bottom:510,width:65,height:30}),
  isConnected:true,
  title:""
};
const root={
  querySelector(sel){
    if(sel===".bk-answer-popover")return popup;
    if(sel==='[data-reveal-answer][aria-pressed="true"]')
      return buttonAttributes.get("aria-pressed")==="true"?button:null;
    return null;
  },
  appendChild(panel){
    popup=panel;
    panel.isConnected=true;
    panel.remove=()=>{if(popup===panel)popup=null;};
  }
};
const document={
  createElement(){const p={
    className:"",id:"",style:{},
    isConnected:false,
    setAttribute(){},
    getBoundingClientRect(){return {height:96};}
  };created.push(p);return p;}
};
const state={mode:"sentence"};
const assistedInputs=new Set();
const item={n:12,en:"time",sentence:"What time do you get up?"};
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const w={visualViewport:{offsetLeft:0,offsetTop:0,width:390,height:650},innerWidth:390,innerHeight:650};
const helpers=new Function("root","document","state","currentStep","assistedInputs","esc","window",
  section+"\nreturn {answerButton,togglePracticeAnswer,closePracticeAnswer,positionPracticeAnswer};")
  (root,document,state,()=>({entries:[item]}),assistedInputs,esc,w);
const wordButton=helpers.answerButton(12,"word");
const sentenceButton=helpers.answerButton(12,"sentence");
assert.ok(wordButton.includes('data-reveal-answer="word"'));
assert.ok(sentenceButton.includes('data-reveal-answer="sentence"'));
assert.ok(sentenceButton.includes('type="button"'),"Reveal must not submit a form");
assert.ok(sentenceButton.includes('aria-pressed="false"'),"Starts hidden");
helpers.togglePracticeAnswer(button);
assert.ok(popup,"Tapping reveal creates answer display");
assert.ok(popup.innerHTML.includes("What time do you get up?"),"Full sentence should be visible");
assert.equal(buttonAttributes.get("aria-pressed"),"true");
assert.ok(assistedInputs.has("sentence:12"),"Revealing answer must mark recall as assisted");
assert.ok(Number.parseFloat(popup.style.top)>=0,"Answer must fit viewport");
assert.ok(Number.parseFloat(popup.style.left)>=0,"Answer must fit horizontally");
helpers.togglePracticeAnswer(button);
assert.equal(popup,null,"Tapping again hides the same answer");
assert.equal(buttonAttributes.get("aria-pressed"),"false");
state.mode="word";button.dataset.revealAnswer="word";
helpers.togglePracticeAnswer(button);
assert.ok(popup.innerHTML.includes("time"),"Vocabulary answer reveals source word");
assert.ok(assistedInputs.has("word:12"),"Word answer counts as assisted too");
helpers.closePracticeAnswer();
assert.equal(popup,null);
// Different learning mode must never reveal an unrelated answer.
state.mode="sentence";button.dataset.revealAnswer="word";
helpers.togglePracticeAnswer(button);
assert.equal(popup,null,"Wrong-mode response must not appear");
for(const token of [
  '(word?answerButton(n,"word"):"")',
  '(sentence?\'<div class="bk-practice-actions">\'+grammarHintButton(n)+answerButton(n,"sentence")',
  'if(button.hasAttribute("data-reveal-answer")){togglePracticeAnswer(button);return;}',
  'if(button.hasAttribute("data-answer-close")){closePracticeAnswer();return;}',
  'closePracticeAnswer();stopAudio();',
  'assistedInputs.add(type+":"+n)',
  'if(root.querySelector(".bk-answer-popover"))closePracticeAnswer();',
  'showAnswerMark(inputNode,"correct");',
  'if(!typed){focusNext(n,type);return;}',
  'if(srs)srs.record(n,type,true,{assisted:assistedInputs.has(type+":"+n)})'
])assert.ok(js.includes(token),"Regression guard: "+token);
assert.ok(desktop.includes(".book2100 .bk-answer-popover"),"Popover styling must exist");
assert.ok(desktop.includes("position:fixed;z-index:10050"),"Desktop popup must not increase the table height");
assert.ok(mobile.includes(".book2100 .bk-row .bk-answer-toggle"),"Mobile cards must show answer toggle");
assert.ok(mobile.includes("max-width:calc(100vw - 24px)"),"Answer must not overflow phone width");
assert.ok(html.includes('book-2100.js?v=20261117-grammar-hints-v1'));
assert.ok(sw.includes("language-studio-v138-book2100-grammar-hints"));
console.log("PASS — Reveal answer for word/sentence, dismiss, a11y, hint-protected SRS, no desktop row growth or mobile horizontal overflow.");
