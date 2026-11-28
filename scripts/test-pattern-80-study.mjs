import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import vm from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const names=[
 "pattern-80-round1-data.js","pattern-80-hints.js","book-2100-srs.js",
 "pattern-80-cloud.js","pattern-80-study.js","pattern-80-study.css",
 "index.html","sw.js","scripts/build-static.mjs",
 "supabase/migrations/202611280001_pattern80_events.sql"
];
const source=Object.fromEntries(names.map(name=>[name,read(name)]));
for(const p of names.filter(n=>n.endsWith(".js")))
 new vm.Script(source[p],{filename:p});
const win={};
vm.runInNewContext(source["pattern-80-round1-data.js"],{window:win});
vm.runInNewContext(source["pattern-80-hints.js"],{window:win});
const data=win.PATTERN80_ROUND1,hints=win.PATTERN80_HINTS;
assert.equal(data.items.length,80,"Lượt 1 must contain 80 structures");
assert.equal(hints.length,80,"One deep grammar hint per original structure");
assert.equal(new Set(hints.map(h=>h.context)).size,80);
assert.equal(new Set(hints.map(h=>h.pitfall)).size,80);
for(let i=0;i<80;i++){
 assert.equal(data.items[i].n,i+1,"Sequential original patterns");
 assert.equal(hints[i].n,i+1,"Sequential sourced grammar hints");
 assert.ok(hints[i].context.length>=60,"Rich structural reasoning for "+(i+1));
 assert.ok(hints[i].pitfall.length>=55,"Concrete error for "+(i+1));
 const fullEnglish=data.items[i].en.toLowerCase();
 assert.ok(![hints[i].context,hints[i].pitfall].join(" ").toLowerCase().includes(fullEnglish),
   "Grammar hint cannot reveal full answer "+(i+1));
}
assert.equal(data.items[0].pattern,"I’d like to…");
assert.equal(data.items[79].pattern,"As far as I know,…");
assert.match(hints[8].pitfall,/V-ing/,"Look forward to must contrast -ing");
assert.match(hints[27].pitfall,/V-ing/,"Would you mind requires gerund");
assert.match(hints[41].pitfall,/V-ing/,"Be used to requires gerund");
assert.match(hints[54].pitfall,/will/,"As soon as future time clause advice");
assert.match(hints[77].context,/There is no need to/);

const srsWindow={};
const storage={items:{},getItem(k){return this.items[k]||null;},
 setItem(k,v){this.items[k]=String(v);},removeItem(k){delete this.items[k];}};
vm.runInNewContext(source["book-2100-srs.js"],{window:srsWindow,console,Date});
const srs=srsWindow.Book2100SRS.createStore({key:"languageStudio:pattern80Srs:v1",storage});
assert.equal(srs.get(1,"sentence").status,"new");
srs.record(1,"sentence",true);
assert.equal(srs.get(1,"sentence").status,"weak");
assert.equal(srs.get(1,"sentence").successes,1);
srs.record(2,"sentence",true,{assisted:true});
assert.equal(srs.get(2,"sentence").stage,0,"Using hints cannot award independent mastery");
srs.record(3,"sentence",false);
assert.equal(srs.get(3,"sentence").mistakes,1,"Wrong Enter schedules review");
assert.ok(storage.items["languageStudio:pattern80Srs:v1"],"Separate local progress key");
assert.ok(!storage.items["language-studio-book-2100-srs-v1"],"2100 progress must not change");

const boxStyle={setProperty(){},height:"",top:""};
const root={
 className:"",hidden:true,style:boxStyle,attrs:{},handlers:{},html:"",
 children:[],classes:new Set(),
 get innerHTML(){return this.html;},set innerHTML(v){this.html=String(v);},
 classList:{add(){},remove(){},toggle(){}},
 setAttribute(k,v){this.attrs[k]=String(v);},
 addEventListener(k,f){this.handlers[k]=f;},
 appendChild(el){this.children.push(el);el.isConnected=true;},
 contains(){return true;},
 querySelector(sel){
  if(sel===".p80popup")return this.children.find(c=>c.isConnected&&c.className?.startsWith("p80popup"))||null;
  if(sel===".p80message")return this.message??=( {textContent:""} );
  return null;
 },
 querySelectorAll(){return [];}
};
const pageClasses=new Set();
const document={
 readyState:"loading",handlers:{},body:{appendChild(el){this.child=el;},
 classList:{add(k){pageClasses.add(k);},remove(k){pageClasses.delete(k);}}},
 documentElement:{classList:{add(){},remove(){}}},
 activeElement:null,
 addEventListener(k,fn){this.handlers[k]=fn;},
 createElement(tag){
  if(tag==="section")return root;
  return {innerHTML:"",firstChild:null};
 },
 getElementById(){return null;},
 querySelector(){return null;}
};
let playSentence=[],connectCount=0;
const window={PATTERN80_ROUND1:data,PATTERN80_HINTS:hints,
 Book2100SRS:srsWindow.Book2100SRS,
 Pattern80CloudSync:{
  connect(store,cb){connectCount++;assert.ok(store);this.callback=cb;},
  status(){return {signedIn:false,revision:0};}
 },
 Book2100BackgroundAudio:{
  ready(){return true;},create(){return null;},prepare(){return Promise.resolve("https://audio.test/test.mp3");}
 },
 AITTS:{speak(s){playSentence.push(s);return Promise.resolve();},stop(){}},
 addEventListener(){},innerWidth:390,innerHeight:820,
 matchMedia(){return {matches:false}},
 location:{hash:"#home"}
};
const context={window,document,localStorage:storage,console,
 requestAnimationFrame:callback=>callback(),MutationObserver:function(){}};
vm.runInNewContext(source["pattern-80-study.js"],context,{filename:"pattern-80-study.js"});
assert.equal(connectCount,1,"The original account-SRS synchronization connection is reused");
assert.ok(window.Pattern80Book?.open);
const trigger={isConnected:true,focus(){this.focused=true;}};
window.Pattern80Book.open(trigger);
assert.equal(root.hidden,false);
assert.ok(pageClasses.has("p80book-open"));
assert.equal(root.attrs.role,"dialog");
assert.match(root.innerHTML,/80 MẪU CÂU TIẾNG ANH/);
assert.match(root.innerHTML,/TRANG 1 · 1–10/);
assert.match(root.innerHTML,/Đọc câu/);
assert.match(root.innerHTML,/Học câu/);
assert.match(root.innerHTML,/CÂU 01/);
assert.match(root.innerHTML,/CÂU 10/);
assert.ok(!root.innerHTML.includes('data-row="11"'),"The desktop page contains only 10 rows");
assert.ok(root.innerHTML.includes('data-next'),"Book pagination to 80");
assert.ok(root.innerHTML.includes('data-sequence'),"Play current page with native audio loop");
assert.ok(root.innerHTML.includes('data-review'),"Review-due counter");
assert.equal(window.Pattern80Book.getMode(),"read");
assert.equal(window.Pattern80Book.getPage(),1);
assert.equal(window.Pattern80Book.getProgress().done,0,"Prior test history used another storage instance");
// Read vs practice have DIFFERENT content visibility and active input.
const clickButton={dataset:{mode:"study"},hasAttribute:key=>key==="data-mode"};
root.handlers.click({target:{closest:()=>clickButton}});
assert.equal(window.Pattern80Book.getMode(),"study");
assert.match(root.innerHTML,/NGHĨA TIẾNG VIỆT/);
assert.match(root.innerHTML,/Nhập câu tiếng Anh/);
assert.match(root.innerHTML,/data-hint="1"/);
assert.match(root.innerHTML,/data-answer="1"/);
assert.ok(!root.innerHTML.includes("Học từ"),"80-pattern study must not add separate vocabulary mode");
// Verify the full 80-passage table never takes 2100 English/Japanese data.
assert.ok(!source["pattern-80-study.js"].includes("BOOK_2100_DATA"));
assert.ok(!source["pattern-80-study.js"].includes("book2100Root"));

// The exact breakpoint and layout must be intentionally different.
const css=source["pattern-80-study.css"];
assert.ok(css.includes("grid-template-rows:repeat(var(--p80-row-count,10),minmax(0,1fr))"),
 "Desktop has a full 10-row textbook page");
assert.ok(css.includes("@media(max-width:959px)"),"Mobile has separate card design");
assert.ok(css.includes("display:flex;flex-direction:column;gap:12px;overflow:visible"),
 "Mobile displays vertically stacked cards");
assert.ok(css.includes("overflow-x:hidden!important"),"No sideways scroll on iPhone");
assert.ok(css.includes(".p80book.p80keyboard-open .p80footer{display:none}"),
 "iPhone keyboard must not cover answer input");
assert.ok(css.includes(".p80book .p80popup{"),"Hint/answer windows float above textbook rows");
assert.ok(css.includes("position:fixed;z-index:1000"),"Popups must not expand desktop rows");
assert.ok(css.includes("env(safe-area-inset-bottom)"),"Respect iPhone home indicator");

// Client-side sync has its own table and owner-scoped store, never 2100's.
const cloud=source["pattern-80-cloud.js"],sql=source["supabase/migrations/202611280001_pattern80_events.sql"];
assert.ok(cloud.includes('TABLE="language_studio_pattern80_events"'));
assert.ok(cloud.includes('PREFIX="languageStudio:pattern80Events:v1:"'));
assert.ok(cloud.includes('global.Pattern80CloudSync='));
assert.ok(cloud.includes("<=80"),"Cloud restricts pattern IDs");
assert.ok(!cloud.includes("language_studio_book2100_events"));
assert.match(sql,/row level security/i);
assert.match(sql,/auth.uid\(\)/);
assert.match(sql,/create policy "80 patterns owner can read reviews"/);
assert.match(sql,/grant select,insert .* to authenticated/);

// Production must contain script dependencies in correct load order.
const page=source["index.html"],sw=source["sw.js"],build=source["scripts/build-static.mjs"];
for(const p of ["pattern-80-round1-data.js","pattern-80-hints.js","pattern-80-cloud.js",
 "pattern-80-study.js","pattern-80-study.css"]){
 assert.ok(page.includes(p),"HTML missing "+p);
 assert.ok(sw.includes("'./"+p+"'"),"PWA cache missing "+p);
 assert.ok(build.includes('"'+p+'"'),"Production bundle missing "+p);
}
assert.ok(page.indexOf('src="pattern-80-round1-data.js')<page.indexOf('src="pattern-80-study.js'));
assert.ok(page.indexOf('src="pattern-80-hints.js')<page.indexOf('src="pattern-80-study.js'));
assert.ok(page.indexOf('src="book-2100-srs.js')<page.indexOf('src="pattern-80-study.js'));
assert.ok(page.indexOf('src="pattern-80-cloud.js')<page.indexOf('src="pattern-80-study.js'));
assert.ok(sw.includes("language-studio-v144-pattern80-responsive-study"));
assert.ok(source["pattern-80-study.js"].includes("pattern80BookLaunch"),
 "New Book 80 card must be separate from old lesson reference and listening library");
assert.ok(source["pattern-80-study.js"].includes("pattern80BookSidebarLaunch"));
assert.ok(source["pattern-80-study.js"].includes("void speak(n,false)"),
 "Correct Enter audio must not turn next independent recall into assisted.");

if(process.argv.includes("--manifest")){
 const path=new URL("../dist/tts-manifest.json",import.meta.url);
 assert.ok(existsSync(path));
 const m=JSON.parse(readFileSync(path,"utf8"));
 for(let page=1;page<=8;page++){
  const text=data.items.slice((page-1)*10,page*10).map(e=>e.en.trim()).join(" ");
  const hash=createHash("sha256").update(
    [m.modelIdentity,m.profile,"marin","en-US",m.masterPace,text].join("|")
   ,"utf8").digest("hex");
  const entry=m.entries[hash];
  assert.ok(entry,"Missing native background audio page "+page);
  assert.equal(entry.text,text);
  assert.ok(entry.kinds.includes("patterns-80-round1-study-page"));
  assert.ok(entry.lessonIds.includes("patterns-80-page-"+page));
 }
}
console.log("PASS — 80 unique hints, original lesson data, independent 8×10 desktop book, iPhone cards/input/popups, Enter feedback, SRS, authenticated cloud and 8 native listening tracks"+(process.argv.includes("--manifest")?" (manifest verified)":"")+".");
