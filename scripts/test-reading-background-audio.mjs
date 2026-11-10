import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const playerSource=readFileSync(new URL("../reading-background-audio.js",import.meta.url),"utf8");
const readerSource=readFileSync(new URL("../reading-studio.js",import.meta.url),"utf8");
const swSource=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
const buildSource=readFileSync(new URL("../scripts/build-static.mjs",import.meta.url),"utf8");
const css=readFileSync(new URL("../reading-studio.css",import.meta.url),"utf8");

const actions={};
const mediaSession={
 setActionHandler(name,fn){actions[name]=fn;},
 setPositionState(data){this.position=data;},
 playbackState:"none",metadata:null
};
const navigator={
 mediaSession,audioSession:{type:"auto"}
};
let currentAudio=null,plays=0;
class FakeAudio{
 constructor(){this.events={};this.paused=true;this.duration=72;this.currentTime=0;this.loop=false;this.playbackRate=1;currentAudio=this;}
 addEventListener(type,fn){this.events[type]=fn;}
 removeAttribute(name){if(name==="src")this.src="";}
 load(){}
 pause(){this.paused=true;this.events.pause?.();}
 play(){this.paused=false;plays++;this.events.playing?.();return Promise.resolve();}
 emit(type){this.events[type]?.();}
}
class FakeMetadata{constructor(data){Object.assign(this,data)}}
const prepared=[];
const win={AITTS:{
 staticAudioUrl(text,lang,voice){assert.equal(lang,"en-US");assert.equal(voice,"marin");return "/audio-cloud/"+text.length+".mp3";},
 prepareAudioUrl(text){prepared.push(text);return Promise.resolve("/audio-cloud/"+text.length+".mp3");}
}};
const ctx={window:win,navigator,Audio:FakeAudio,MediaMetadata:FakeMetadata,console};
runInNewContext(playerSource,ctx,{filename:"reading-background-audio.js"});
const api=win.ReadingBackgroundAudio;
assert.ok(api?.create&&api?.prepare&&api?.wholeText,"Background player exports required methods");
const story={id:"speaking-01",day:1,lines:[["Hi everyone.","Chào mọi người."],["I'm an engineer.","Tôi là kỹ sư."]]};
const passage=api.wholeText(story);
assert.equal(passage,"Hi everyone. I'm an engineer.","Full passage contains ordered English only");
await api.prepare(passage);
await api.prepare(passage);
assert.equal(prepared.length,1,"Prepare is memoized per passage");
const events=[],errors=[];
const session=api.create({
 text:passage,title:"Introducing My Work",artist:"Day 01",
 rate:.75,loop:true,
 onState:status=>events.push(status),
 onEnded:()=>events.push("ended"),
 onError:error=>errors.push(error)
});
assert.ok(session,"Creates one HTMLAudio-backed session");
assert.equal(currentAudio.src,"/audio-cloud/"+passage.length+".mp3","One continuous audio source is used");
assert.equal(currentAudio.playbackRate,.75,"User's reading speed is preserved");
assert.equal(currentAudio.loop,true,"Looping is native audio looping, not JS timers");
assert.equal(mediaSession.metadata.title,"Introducing My Work","Lock screen shows passage title");
assert.equal(navigator.audioSession.type,"playback","iPhone is given media playback session type");
assert.equal(typeof actions.play,"function","Lock screen play action installed");
assert.equal(typeof actions.pause,"function","Lock screen pause action installed");
assert.equal(typeof actions.seekbackward,"function","Lock screen seeking action installed");
session.play();
assert.equal(plays,1,"Audio starts directly on tap");
assert.equal(session.isPlaying(),true,"Playing status exposed");
assert.equal(mediaSession.playbackState,"playing","Lock-screen transport shows playing");
actions.pause();
assert.equal(session.isPlaying(),false,"Lock-screen pause works");
actions.play();
assert.equal(session.isPlaying(),true,"Lock-screen resume works");
session.setLoop(false);
assert.equal(currentAudio.loop,false,"Loop switch updates native HTMLMediaElement");
session.setRate(.6);
assert.equal(currentAudio.playbackRate,.6,"Very slow 0.60x works without restarting");
assert.equal(currentAudio.defaultPlaybackRate,.6,"Slow rate persists as media default");
currentAudio.emit("loadedmetadata");
assert.equal(currentAudio.playbackRate,.6,"iOS metadata reload must not reset slow playback");
session.setRate(.7);
assert.equal(currentAudio.playbackRate,.7,"Recommended 0.70x speed works live");
session.setRate(.88);
assert.equal(currentAudio.playbackRate,.88,"Older playback values stay supported");
currentAudio.currentTime=20;
actions.seekbackward({seekOffset:5});
assert.equal(currentAudio.currentTime,15,"Lock-screen back seek works");
session.restart();
assert.equal(currentAudio.currentTime,0,"Replay begins at the start");
assert.equal(plays,3,"Resume and replay use the same audio element");
currentAudio.emit("ended");
assert.ok(events.includes("ended"),"Completion handler signals the lesson");
assert.equal(errors.length,0,"No playback error in normal run");
session.stop();
assert.equal(session.isActive(),false,"Stopping releases audio session");
assert.equal(actions.play,null,"Media session handler is removed on stop");
assert.equal(mediaSession.playbackState,"none","Lock screen status is released");

assert.ok(readerSource.includes('id="readingBackground"'),"Read tab shows a background audio control");
assert.ok(readerSource.includes("function startBackground()"),"Background media transport integrated");
assert.ok(readerSource.includes("backgroundSession.setLoop(st.loop)"),"Reading loop controls the media element");
assert.ok(readerSource.includes("rate:st.backgroundRate,loop:st.loop"),
 "Background playback must use its own saved speed rather than sentence rate");
assert.ok(readerSource.includes("backgroundSession.setRate(st.backgroundRate)"),
 "Background speed changes must update the current track immediately");
assert.ok(readerSource.includes('st.backgroundRate=[.6,.7,.8,.9,1].includes(value)?value:.7;'),
 "Background speed choices should persist, defaulting to 0.70x");
assert.ok(readerSource.includes('id="readingBackgroundRate"'),
 "A visible background-only speed selector is required");
assert.ok(readerSource.includes("if(backgroundSession){if(playing)backgroundSession.pause();else backgroundSession.resume();}"),
 "Normal Read & Listen play button can pause/resume background playback");
assert.ok(buildSource.includes('"reading-background-audio.js"'),"Player is bundled in versioned runtime");
assert.ok(buildSource.includes('addManifestAudio(passage,"reading-full-passage",story.id)'),
 "All 70 stories use one allowlisted full audio track");
assert.ok(css.includes(".reading-background-actions"),"Background controls have mobile styling");
assert.ok(css.includes(".reading-background-rate select"),"Background rate selector has responsive styling");

// iOS Safari commonly sends byte-range GETs for MP3 metadata and seeking.
const worker={registration:{scope:"https://example.org/app/"},addEventListener(){},__range:null};
runInNewContext(swSource+"\nself.__range=mediaRange;",{
 self:worker,Request,Response,Headers,URL,console
},{filename:"sw.js"});
const sourceBytes=new Uint8Array([0,1,2,3,4,5,6,7,8,9]);
const ranged=await worker.__range(
 new Request("https://example.org/app/audio-cloud/sample.mp3",{headers:{Range:"bytes=2-5"}}),
 new Response(sourceBytes,{status:200,headers:{"Content-Type":"audio/mpeg"}})
);
assert.equal(ranged.status,206,"iPhone byte range receives 206 Partial Content");
assert.equal(ranged.headers.get("Content-Range"),"bytes 2-5/10","Correct Content-Range");
assert.deepEqual(Array.from(new Uint8Array(await ranged.arrayBuffer())),[2,3,4,5],"Correct partial MP3 bytes");
const suffix=await worker.__range(
 new Request("https://example.org/app/audio-cloud/sample.mp3",{headers:{Range:"bytes=-3"}}),
 new Response(sourceBytes,{status:200})
);
assert.deepEqual(Array.from(new Uint8Array(await suffix.arrayBuffer())),[7,8,9],"Suffix range supported");
console.log("PASS iPhone background audio media session, native loop/rate, full-passage allowlist and 206 audio ranges.");
