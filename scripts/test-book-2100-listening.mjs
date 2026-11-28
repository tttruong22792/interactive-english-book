import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const source=read("book-2100-listening.js");
const css=read("book-2100-listening.css");
const bookSource=read("book-2100.js");
const html=read("index.html");
const sw=read("sw.js");
const build=read("scripts/build-static.mjs");
new vm.Script(source,{filename:"book-2100-listening.js"});

const dataFiles=[
 "book-2100-data.js","book-2100-steps-03-06.js","book-2100-steps-07-12.js",
 "book-2100-steps-13-18.js","book-2100-steps-19-23.js",
 "book-2100-steps-24-29.js","book-2100-steps-30-33.js"
];
const win={listeners:{}};
for(const file of dataFiles)vm.runInNewContext(read(file),{window:win});
assert.equal(win.BOOK_2100_DATA.steps.length,33);
const root={
 hidden:false,dataset:{},attributes:{},listeners:{},innerHTML:"",
 setAttribute(k,v){this.attributes[k]=v;},
 addEventListener(k,cb){this.listeners[k]=cb;},
 querySelector(k){
  const selectors=["[data-play]","[data-stop]","[data-listening]","[data-status]"];
  if(!selectors.includes(k))return null;
  if(!this.nodes)this.nodes={};
  return this.nodes[k]??=( {textContent:"",disabled:false,attributes:{},
    setAttribute(k,v){this.attributes[k]=v;},
    focus(){this.focused=true;}} );
 }
};
let body={classes:new Set(),classList:{add(x){body.classes.add(x);},remove(x){body.classes.delete(x);}},
 appendChild(x){body.appended=x;}};
const document={
 body,activeElement:null,listeners:{},
 createElement:k=>{assert.equal(k,"section");return root;},
 addEventListener(k,cb){this.listeners[k]=cb;}
};
const storage={items:{},getItem(k){return this.items[k]||null;},setItem(k,v){this.items[k]=v;}};
let activePlayer=null,created=0,prepareCount=0,stopCount=0,rateValue=null,playCount=0;
const bg={
 ready:()=>true,
 prepare:async()=>{prepareCount++;return "https://audio.test/ready.mp3";},
 create:(step,opts)=>{
  created++;rateValue=opts.rate;
  const p={step,options:opts,play(){playCount++;opts.onState("playing");},
    pause(){opts.onState("paused");},resume(){this.play();},
    stop(){stopCount++;},setRate(x){rateValue=x;},restart(){this.play();}};
  activePlayer=p;return p;
 }
};
win.Book2100BackgroundAudio=bg;
win.addEventListener=(k,cb)=>{win.listeners[k]=cb;};
vm.runInNewContext(source,{window:win,document,localStorage:storage,console});
assert.ok(win.Book2100Listening?.open,"Library API must be registered");
const trigger={isConnected:true,focus(){this.focused=true;}};
win.Book2100Listening.open(trigger);
assert.equal(body.appended,root);
assert.equal(root.attributes.role,"dialog");
assert.equal(root.attributes["aria-modal"],"true");
assert.ok(body.classes.has("bklisten-open"));
assert.ok(root.innerHTML.includes("STEP 01"));
assert.ok(root.innerHTML.includes("STEP 33"),"All 33 STEPs are selectable");
assert.ok(root.innerHTML.includes("Many people visit the park."),"Source sentences appear without copying content");
assert.ok(root.innerHTML.includes("Nghe 2100 câu"));
assert.equal(root.querySelector("[data-play]").textContent,"▶ Nghe 12 câu ↻");
const click=(attr)=>root.listeners.click({target:{closest:()=>({hasAttribute:x=>x===attr})}});
click("data-play");
assert.equal(created,1,"Start uses the shared native background player");
assert.equal(playCount,1);
assert.equal(rateValue,.75);
assert.equal(activePlayer.step.id,1);
assert.equal(root.querySelector("[data-play]").textContent,"Ⅱ Tạm dừng");
click("data-play");
assert.equal(root.querySelector("[data-play]").textContent,"▶ Tiếp tục nghe");
click("data-play");
assert.equal(playCount,2,"Resume reuses the existing player");
const change=(attr,value)=>root.listeners.change({target:{hasAttribute:x=>x===attr,value}});
change("data-rate","0.85");
assert.equal(rateValue,.85,"Speed changes the native player without rebuilding audio");
change("data-step","2");
assert.equal(stopCount,1,"Switching STEP releases old player");
assert.equal(root.querySelector("[data-play]").textContent,"▶ Nghe 12 câu ↻");
click("data-play");
assert.equal(activePlayer.step.id,2);
assert.equal(rateValue,.85,"Speed preference persists across STEPs");
click("data-vi");
assert.ok(!root.innerHTML.includes("Hẹn gặp bạn tuần sau!"),"Vietnamese display can be hidden");
click("data-stop");
assert.ok(stopCount>=2);
click("data-exit");
assert.equal(root.hidden,true);
assert.ok(!body.classes.has("bklisten-open"));
assert.ok(trigger.focused,"Exiting returns focus to library card");
assert.ok(storage.items["ls-book2100-listening-v1"],"STEP and rate choices persist locally");

for(const k of ["#bkLibraryLaunch","Book2100?.open","pattern80ListeningLaunch"])
 assert.ok(bookSource.includes(k),"Separate Library card must exist: "+k);
assert.ok(!source.includes("BOOK_2100_DATA="),"No duplicate 2100 corpus in listening feature");
assert.ok(source.includes("Book2100BackgroundAudio?.create"));
assert.ok(css.includes("env(safe-area-inset-top"),"iPhone safe-area margins");
assert.ok(css.includes("@media(max-width:359px)"),"Narrow iPhones must fit");
assert.ok(html.includes('href="book-2100-listening.css?v=20261128-listening-v1"'));
assert.ok(html.includes('src="book-2100-listening.js?v=20261128-listening-v1"'));
assert.ok(html.indexOf('src="book-2100-background.js')<html.indexOf('src="book-2100-listening.js'));
assert.ok(sw.includes("'./book-2100-listening.js'"));
assert.ok(sw.includes("'./book-2100-listening.css'"));
assert.ok(sw.includes("language-studio-v143-pattern80-round1-listening"));
assert.ok(build.includes('"book-2100-listening.js"'));
assert.ok(build.includes('"book-2100-listening.css"'));
console.log("PASS — Library card, 33-step source reuse, native background loop, controls, step/rate/translation state, safe-area mobile UI, PWA assets.");
