import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import vm from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const code=read("pattern-80-listening.js");
const source=read("pattern-80-round1-data.js");
const page=read("index.html"),sw=read("sw.js"),build=read("scripts/build-static.mjs");
const book=read("book-2100.js"),bg=read("book-2100-background.js");
new vm.Script(code,{filename:"pattern-80-listening.js"});
new vm.Script(source,{filename:"pattern-80-round1-data.js"});
const w={listeners:{}};
vm.runInNewContext(source,{window:w},{filename:"pattern-80-round1-data.js"});
const data=w.PATTERN80_ROUND1;
assert.equal(data.version,1);
assert.equal(data.items.length,80,"Exactly one first-round example per original structure");
assert.ok(data.items.every((x,i)=>x.n===i+1&&x.pattern&&x.en&&x.vi&&x.meaning));
assert.equal(new Set(data.items.map(x=>x.pattern)).size,80,"All 80 different patterns");
const full=data.items.map(x=>x.en.trim()).join(" ");
assert.ok(full.length<4000,"Single MP3 first-round lesson is within typical TTS character constraints");
assert.ok(full.includes("I'd like to ask you something."));
assert.ok(full.includes("As far as I know, the meeting is still on."));
// Source fidelity: examples are taken verbatim from existing 80-pattern lessons.
const specs={};
vm.runInNewContext(read("data/english/patterns/specs-13-80.js"),{window:specs});
for(let i=1;i<=12;i++){
 const lesson={};
 vm.runInNewContext(read("data/english/patterns/"+String(i).padStart(3,"0")+".js"),{window:lesson});
 const s=lesson.CONTENT_REGISTRY["en-pattern-"+String(i).padStart(3,"0")];
 const entry=data.items[i-1];
 assert.equal(entry.pattern,s.title,"Pattern title "+i+" must be unchanged");
 assert.ok(s.introExamples.some(ex=>ex[0]===entry.en&&ex[1]===entry.vi),
   "Pattern "+i+" example must be from the original lesson");
}
for(const spec of specs.PATTERN_SPECS_13_80){
 const entry=data.items[spec.n-1];
 assert.equal(entry.pattern,spec.t,"Source name "+spec.n);
 assert.equal(entry.en,spec.special[0][0],"Example EN "+spec.n);
 assert.equal(entry.vi,spec.special[0][1],"Example VI "+spec.n);
}
assert.ok(!book.includes("Thư viện nghe 2100"),"Mistaken extra 2100 library card must be removed");
assert.ok(book.includes("Thư viện nghe 80 mẫu câu"));
assert.ok(book.includes("window.Pattern80Listening?.open?.(listenCard)"));
assert.ok(book.includes("Sách 2100 từ Anh–Nhật"),"Original 2100 book entry must remain");
assert.ok(bg.includes('title:options.title ||'),"Existing native player must accept correct 80-pattern metadata");
assert.ok(bg.includes('artist:options.artist ||'));
assert.ok(build.includes('addManifestAudio(text,"patterns-80-round1-background-loop"'));
assert.ok(page.includes('src="pattern-80-round1-data.js?v=20261128-pattern80-r1"'));
assert.ok(page.includes('src="pattern-80-listening.js?v=20261128-pattern80-r1"'));
assert.ok(page.includes('href="pattern-80-listening.css?v=20261128-pattern80-r1"'));
assert.ok(page.indexOf('src="pattern-80-round1-data.js')<
          page.indexOf('src="pattern-80-listening.js'));
assert.ok(page.indexOf('src="book-2100-background.js')<
          page.indexOf('src="pattern-80-listening.js'));
assert.ok(sw.includes("'./pattern-80-round1-data.js'"));
assert.ok(sw.includes("'./pattern-80-listening.js'"));
assert.ok(sw.includes("'./pattern-80-listening.css'"));
assert.ok(sw.includes("language-studio-v143-pattern80-round1-listening"));
assert.ok(read("pattern-80-listening.css").includes("pattern80-root"));
// Simulate the actual listening-library flow without a real device.
const root={hidden:true,attributes:{},listeners:{},innerHTML:"",nodes:{},
 setAttribute(k,v){this.attributes[k]=v;},
 addEventListener(k,cb){this.listeners[k]=cb;},
 querySelector(q){
  if(!this.nodes[q]){
   this.nodes[q]={textContent:"",disabled:false,attributes:{},
     setAttribute(k,v){this.attributes[k]=String(v);},focus(){this.focused=true;}};
  }
  return this.nodes[q];
 }
};
const classes=new Set(),body={
 classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)},
 appendChild(el){this.child=el;}
};
const doc={body,events:{},activeElement:null,
 createElement(k){assert.equal(k,"section");return root;},
 addEventListener(k,cb){this.events[k]=cb;}
};
const localStorage={items:{},getItem(k){return this.items[k]??null;},setItem(k,v){this.items[k]=v;}};
let activePlayer=null,created=0,played=0,stopped=0,prepareCalls=0,currentRate;
w.Book2100BackgroundAudio={
 ready(){return true;},
 prepare(){prepareCalls++;return Promise.resolve("https://example.test/ready.mp3");},
 create(track,options){
  created++;currentRate=options.rate;
  activePlayer={track,options,play(){played++;options.onState("playing");},
   pause(){options.onState("paused");},resume(){this.play();},
   stop(){stopped++;},restart(){this.play();},
   setRate(x){currentRate=x;}};
  return activePlayer;
 }
};
w.addEventListener=(k,cb)=>{w.listeners[k]=cb;};
vm.runInNewContext(code,{window:w,document:doc,localStorage,console});
const api=w.Pattern80Listening;
assert.ok(api);
const sourceTrigger={isConnected:true,focus(){this.focused=true;}};
api.open(sourceTrigger);
assert.equal(root.hidden,false);
assert.ok(classes.has("bklisten-open"));
assert.equal(root.attributes.role,"dialog");
assert.ok(root.innerHTML.includes("Mẫu 1–20"));
assert.ok(root.innerHTML.includes("Mẫu 61–80"));
assert.ok(root.innerHTML.includes("Nghe 80 câu"));
assert.ok(root.innerHTML.includes("I look forward to seeing you."));
assert.equal(api.selection().items.length,80);
const click=k=>root.listeners.click({target:{closest:()=>({hasAttribute:x=>x===k})}});
const change=(k,value)=>root.listeners.change({target:{hasAttribute:x=>x===k,value}});
click("data-pattern80-play");
assert.equal(created,1);
assert.equal(played,1);
assert.equal(activePlayer.track.entries.length,80);
assert.ok(activePlayer.options.title.includes("80 mẫu câu"));
assert.ok(activePlayer.options.artist.includes("80 mẫu câu"));
assert.equal(currentRate,.75);
click("data-pattern80-play");
assert.equal(root.querySelector("[data-pattern80-play]").textContent,"▶ Tiếp tục nghe");
click("data-pattern80-play");
assert.equal(played,2);
change("data-pattern80-rate","0.85");
assert.equal(currentRate,.85);
change("data-pattern80-group","21");
assert.equal(api.selection().items.length,20);
assert.equal(api.selection().items[0].n,21);
assert.equal(api.selection().items.at(-1).n,40);
assert.ok(stopped>=1,"Group change stops previous track");
click("data-pattern80-play");
assert.equal(created,2);
assert.equal(activePlayer.track.entries.length,20);
assert.equal(currentRate,.85);
click("data-pattern80-en");
assert.ok(!root.innerHTML.includes("Could you give me a hand with this?"));
click("data-pattern80-vi");
assert.ok(!root.innerHTML.includes("Bạn giúp tôi một tay việc này được không?"));
click("data-pattern80-stop");
assert.equal(root.querySelector("[data-pattern80-play]").textContent,"▶ Nghe 20 câu ↻");
click("data-pattern80-exit");
assert.equal(root.hidden,true);
assert.ok(!classes.has("bklisten-open"));
assert.ok(sourceTrigger.focused);
assert.ok(localStorage.items["language-studio-pattern80-listening-round1"]);
assert.equal(prepareCalls,0,"Already prepared TTS must play directly");
if(process.argv.includes("--manifest")){
 const uri=new URL("../dist/tts-manifest.json",import.meta.url);
 assert.ok(existsSync(uri),"Built TTS manifest must be present");
 const m=JSON.parse(readFileSync(uri,"utf8"));
 const slices=[{id:"all",from:1,to:80},
  {id:"1",from:1,to:20},{id:"21",from:21,to:40},
  {id:"41",from:41,to:60},{id:"61",from:61,to:80}];
 for(const g of slices){
  const text=data.items.filter(e=>e.n>=g.from&&e.n<=g.to)
    .map(e=>e.en.trim()).join(" ");
  const hash=createHash("sha256").update(
    [m.modelIdentity,m.profile,"marin","en-US",m.masterPace,text].join("|")
    ,"utf8").digest("hex");
  const entry=m.entries[hash];
  assert.ok(entry,"Missing original 80-pattern MP3 allow-list "+g.id);
  assert.equal(entry.text,text,"Audio must match displayed example order");
  assert.ok(entry.lessonIds.includes("patterns-80-round1-"+g.id));
  assert.ok(entry.kinds.includes("patterns-80-round1-background-loop"));
 }
}
console.log("PASS — Original 80 examples grounded in 80 lessons; independent library plays all 80 or 4×20 through shared background audio; iPhone layout, UI controls, TTS manifest and original book protected"+(process.argv.includes("--manifest")?" (5 MP3 passages verified)":"")+".");