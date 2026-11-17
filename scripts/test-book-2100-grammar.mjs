import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";
const read=path=>readFile(new URL("../"+path,import.meta.url),"utf8");
const paths=[
  "book-2100-data.js","book-2100-steps-03-06.js","book-2100-steps-07-12.js",
  "book-2100-steps-13-18.js","book-2100-steps-19-23.js",
  "book-2100-steps-24-29.js","book-2100-steps-30-33.js"
];
const win={};
const ctx=vm.createContext({window:win});
for(const path of paths)vm.runInContext(await read(path),ctx,{filename:path});
vm.runInContext(await read("book-2100-grammar.js"),ctx,{filename:"book-2100-grammar.js"});
const book=win.BOOK_2100_DATA,api=win.Book2100GrammarHints;
const entries=book.steps.flatMap(step=>step.entries);
assert.equal(entries.length,400);
assert.equal(api.total,400);
assert.equal(api.codes.length,400);
assert.ok(new Set(entries.map(item=>item.n)).size===400);
for(const entry of entries){
  const hint=api.get(entry);
  assert.ok(hint,"Sentence "+entry.n+" has no grammar hint");
  assert.ok(hint.title&&hint.idea&&hint.apply);
  assert.ok(hint.patterns.length>=1&&hint.patterns.length<=2);
  const visible=[hint.title,hint.idea,...hint.patterns,hint.apply].join("\n").toLowerCase();
  assert.ok(!visible.includes(entry.sentence.toLowerCase()),"Grammar hint must not reveal full English answer "+entry.n);
  // Grammar explanations can naturally contain Vietnamese words appearing in
  // a vocabulary translation; check full English answer leakage instead.
}
const examples=new Map(entries.map(item=>[item.n,item]));
function expect(id,code,needle){
  const h=api.get(examples.get(id));
  assert.equal(h.code,code,"Wrong grammar category at entry "+id+": "+examples.get(id).sentence);
  assert.ok([h.title,h.idea,...h.patterns,h.apply].join(" ").includes(needle),
    "Missing grammar explanation for "+id+": "+needle);
}
for(const [id,code,needle] of [
  [10,"ti","There is"],[11,"neg","don't"],[12,"qt","What time"],
  [18,"tw","There was"],[23,"pc","V-ing"],[29,"tq","Is there"],
  [40,"impn","Don't"],[47,"ppc","were"],[48,"qdo","Do"],
  [54,"cani","Can I"],[88,"neg3","doesn't"],[103,"qdid","Did"],
  [132,"ti","There is"],[154,"ta","There are"],[166,"ti","There is"],
  [170,"double","người nhận"],[194,"hope","that"],[205,"negp","didn't"],
  [218,"couldq","Could you"],[219,"super","so sánh nhất"],
  [245,"mustn","Must not"],[250,"tww","There were"],
  [254,"tqp","Are there"],[255,"comparison","than"],
  [257,"super","the"],[278,"ta","There are"],
  [290,"purpose","to"],[301,"ti","There is"],
  [302,"neg3","doesn't"],[305,"sched","mở cửa"],
  [309,"tq","Is there"],[331,"will","will"],
  [338,"tww","There were"],[342,"tq","Is there"],
  [354,"qdid","Did"],[360,"going","going to"],
  [390,"oneof","one of the"],[392,"neg3","anything"],
  [393,"wantto","want"],[395,"would","would"],
  [396,"should","Should"],[399,"beforeafter","After"],
  [400,"beforeafter","Before"]
])expect(id,code,needle);
assert.equal(api.get({n:0}),null);
assert.equal(api.get({n:401}),null);
// The two example prompts are hand-authored, compact and grammar-only.
const there=api.get(examples.get(10)),negative=api.get(examples.get(11));
assert.match(there.apply,/một bài kiểm tra/);
assert.match(negative.apply,/chủ ngữ 'Tôi'/i);
assert.ok(negative.patterns.some(x=>x.includes("don't + V nguyên mẫu")));
assert.ok(!negative.patterns.some(x=>x.includes("drink coffee")));
assert.ok(!there.patterns.some(x=>x.includes("test tomorrow")));

const js=await read("book-2100.js");
new vm.Script(js,{filename:"book-2100.js"});
for(const token of [
  'function grammarHintButton(n)',
  'function toggleGrammarHint(button)',
  'data-grammar-hint',
  '(sentence?\'<div class="bk-practice-actions">\'+grammarHintButton(n)+answerButton(n,"sentence")',
  'assistedInputs.add("sentence:"+n)',
  'window.Book2100GrammarHints?.get?.(entry)',
  'if(button.hasAttribute("data-grammar-hint")){toggleGrammarHint(button);return;}',
  'if(grammar){grammar.setAttribute("aria-pressed","false");grammar.title="Gợi ý cấu trúc";}',
  'if(srs)srs.record(n,type,true,{assisted:assistedInputs.has(type+":"+n)})',
  'if(root.querySelector(".bk-answer-popover"))closePracticeAnswer();'
]){
  assert.ok(js.includes(token),"Frontend grammar integration missing "+token);
}
const start=js.indexOf("  function grammarHintButton(n){");
const end=js.indexOf("  function closePracticeAnswer(){",start);
assert.ok(start>=0 && end>start,"Grammar hint functions must be isolated and testable");
let popup=null,positioned=false,closed=false;
const button={dataset:{grammarHint:"11"},isConnected:true,attributes:{},
  getAttribute(k){return this.attributes[k]||null;},
  setAttribute(k,v){this.attributes[k]=String(v);},title:""};
const root={
  appendChild(x){popup=x;x.isConnected=true;},
  querySelector(){return null;}
};
const document={createElement(){
  return {className:"",innerHTML:"",attributes:{},setAttribute(k,v){this.attributes[k]=v;}};
}};
const state={mode:"sentence"},assistedInputs=new Set();
const currentStep=()=>({entries:entries.slice(0,12)});
const closePracticeAnswer=()=>{closed=true;popup=null;button.attributes["aria-pressed"]="false";};
const positionPracticeAnswer=()=>{positioned=true;};
const esc=x=>String(x).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const tested=new Function("root","document","state","assistedInputs",
  "currentStep","closePracticeAnswer","positionPracticeAnswer","esc","window",
  js.slice(start,end)+"\nreturn {grammarHintButton,toggleGrammarHint};"
)(root,document,state,assistedInputs,currentStep,closePracticeAnswer,positionPracticeAnswer,esc,win);
const markup=tested.grammarHintButton(11);
assert.match(markup,/type="button"/);
assert.match(markup,/aria-pressed="false"/);
tested.toggleGrammarHint(button);
assert.ok(popup,"Click reveals a floating hint panel");
assert.ok(positioned && closed);
assert.equal(button.attributes["aria-pressed"],"true");
assert.ok(popup.innerHTML.includes("don't"));
assert.ok(!popup.innerHTML.includes("I don't drink coffee at night."));
assert.ok(assistedInputs.has("sentence:11"),"Grammar hint is an assisted recall");
assert.equal(popup.className,"bk-answer-popover bk-grammar-popover");
tested.toggleGrammarHint(button);
assert.equal(popup,null,"Second click closes the panel");
assert.equal(button.attributes["aria-pressed"],"false");
state.mode="word";
tested.toggleGrammarHint(button);
assert.equal(popup,null,"Grammar hint must not open in word mode");

const desktop=await read("book-2100.css");
const mobile=await read("book-2100-mobile.css");
const html=await read("index.html");
const sw=await read("sw.js");
const build=await read("scripts/build-static.mjs");
assert.ok(desktop.includes("position:fixed;z-index:10050"),"Grammar popover must not expand desktop textbook rows");
assert.ok(desktop.includes(".book2100.bk-fit .bk-rows"),"Full STEP desktop grid is preserved");
assert.ok(mobile.includes(".book2100.bk-study-sentence .bk-row .bk-sentence-wrap"),"Mobile actions move below keyboard input");
assert.ok(mobile.includes("grid-template-columns:34px minmax(0,1fr) 20px"));
assert.ok(mobile.includes("overflow-x:hidden!important"),"No horizontal scrolling");
assert.ok(sw.includes("language-studio-v138-book2100-grammar-hints"));
assert.ok(sw.includes("'./book-2100-grammar.js'"));
assert.ok(build.includes('"book-2100-grammar.js"'));
assert.ok(html.indexOf('src="book-2100-grammar.js')>0);
assert.ok(html.indexOf('src="book-2100-grammar.js')<html.indexOf('src="book-2100.js'));
console.log("PASS — 400 curated grammar hints (all 33 STEPs), no answer leakage, exact example rules, accessible hint interaction, assisted SRS and responsive layout.");
