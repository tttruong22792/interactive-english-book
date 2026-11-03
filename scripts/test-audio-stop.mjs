import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const source=readFileSync(new URL("../ai-tts.js",import.meta.url),"utf8");
const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");
const tick=async(n=6)=>{for(let i=0;i<n;i++)await Promise.resolve();};
class FakeAudio{
  static instances=[];
  constructor(src){this.src=src;this.events={};this.paused=false;FakeAudio.instances.push(this);}
  addEventListener(name,handler){(this.events[name]??=[]).push(handler);}
  emit(name){for(const fn of this.events[name]||[])fn();}
  play(){this.started=true;return Promise.resolve();}
  pause(){this.paused=true;}
}
function setup(fetchImpl=async()=>({ok:true,json:async()=>({ok:true})})){
 const window={LS_AUDIO_CACHE:null};
 const context={window,TextEncoder,AbortController,URL,Audio:FakeAudio,Date,console,
   setInterval:()=>1,clearInterval:()=>{},
   location:{hostname:"tttruong22792.github.io"},
   document:{baseURI:"https://tttruong22792.github.io/interactive-english-book/",querySelectorAll:()=>[]},
   navigator:{serviceWorker:{controller:null}},fetch:fetchImpl};
 vm.runInNewContext(source,context,{filename:"ai-tts.js"});
 return window.AITTS;
}
FakeAudio.instances=[];
{
 const tts=setup(),playback=tts.speak("First sentence.");
 await tick();
 assert.equal(FakeAudio.instances.length,1,"An HTML audio element is playing");
 tts.stop();
 assert.equal(FakeAudio.instances[0].paused,true,"Stop pauses the real audio element");
 await assert.rejects(playback,e=>e.name==="AbortError","Stop rejects the cancelled audio promise");
 await tick();
 assert.equal(FakeAudio.instances.length,1,"Cancelled audio cannot restart");
}
FakeAudio.instances=[];
{
 let finishRequest=null,signal=null;
 const tts=setup((_url,options)=>{
   signal=options.signal;
   return new Promise(resolve=>{finishRequest=resolve;});
 });
 const playback=tts.speak("Audio not yet cached.");
 await tick();
 assert.equal(FakeAudio.instances.length,1);
 FakeAudio.instances[0].emit("error"); // missing initial MP3; cloud generation begins
 await tick();
 assert.ok(finishRequest,"Fallback request is pending");
 tts.stop();
 assert.equal(signal?.aborted,true,"Stop aborts the pending audio synthesis request");
 finishRequest({ok:true,json:async()=>({ok:true})}); // a late response still arrives
 await assert.rejects(playback,e=>e.name==="AbortError");
 await tick();
 assert.equal(FakeAudio.instances.length,1,"Late response must not create another audio element");
}
FakeAudio.instances=[];
{
 const tts=setup(),old=tts.speak("Old sentence.");
 await tick();
 const current=tts.speak("New sentence.");
 await tick();
 assert.equal(FakeAudio.instances[0].paused,true,"Next sentence stops previous audio immediately");
 await assert.rejects(old,e=>e.name==="AbortError");
 assert.equal(FakeAudio.instances.length,2);
 FakeAudio.instances[1].emit("ended");
 await current;
}
assert.ok(app.includes("const requestToken=sequenceToken===null?sequenceRun:sequenceToken"),"App checks session generation even for independent speech");
assert.ok(app.includes("requestToken!==sequenceRun || error?.name==='AbortError'"),"A deliberate Stop must never trigger browser fallback speech");
assert.ok(app.includes("if(finish)finish();"),"Browser speech pending promise settles on Stop even if Safari omits onend");
console.log("PASS Stop: active audio silenced, pending AI retry aborted, fallback suppressed and concurrent audio prevented.");
