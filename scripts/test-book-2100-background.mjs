import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {runInNewContext,Script} from "node:vm";
import {join} from "node:path";

const root=new URL("../",import.meta.url);
const read=file=>readFileSync(new URL(file,root),"utf8");
const dataFiles=[
 "book-2100-data.js","book-2100-steps-03-06.js",
 "book-2100-steps-07-12.js","book-2100-steps-13-18.js",
 "book-2100-steps-19-23.js","book-2100-steps-24-29.js",
 "book-2100-steps-30-33.js"
];
const bookWindow={};
for(const file of dataFiles)runInNewContext(read(file),{window:bookWindow},{filename:file});
const steps=bookWindow.BOOK_2100_DATA.steps;
assert.equal(steps.length,33,"The full English book has 33 STEPs.");
const source=read("book-2100-background.js");
const readingSource=read("reading-background-audio.js");
const bookSource=read("book-2100.js");
const manifestSource=read("scripts/build-static.mjs");
const sw=read("sw.js"),html=read("index.html");
new Script(source);new Script(bookSource);new Script(readingSource);

const actions={};
const session={playbackState:"none",metadata:null,
 setActionHandler(name,handler){actions[name]=handler;},
 setPositionState(value){this.position=value;}
};
const navigator={mediaSession:session,audioSession:{type:"auto"}};
let audio=null,playCalls=0,stopCalls=0;
class FakeAudio{
 constructor(){this.events={};this.loop=false;this.paused=true;this.playbackRate=1;this.duration=122;this.currentTime=0;audio=this;}
 addEventListener(name,cb){this.events[name]=cb;}
 play(){this.paused=false;playCalls++;this.events.playing?.();return Promise.resolve();}
 pause(){this.paused=true;this.events.pause?.();}
 removeAttribute(name){if(name==="src")this.src="";}
 load(){stopCalls++;}
 emit(name){this.events[name]?.();}
}
class FakeMetadata{constructor(data){Object.assign(this,data);}}
let prepareCalls=0,prepareFails=false;
const win={AITTS:{
 prepareAudioUrl:(text,opts)=>{
  assert.equal(opts.language,"en-US");
  assert.equal(opts.voice,"marin");
  prepareCalls++;
  if(prepareFails)return Promise.reject(new Error("TTS temporarily unavailable"));
  return Promise.resolve("https://npkekrjzebsjfaizfcyb.supabase.co/storage/v1/object/public/language-studio-audio/tts/"+createHash("sha256").update(text).digest("hex")+".mp3?ready=1");
 },
 staticAudioUrl:(text,lang,voice)=>{
 assert.equal(lang,"en-US");
 assert.equal(voice,"marin");
 return "/audio-cloud/"+createHash("sha256").update(text).digest("hex")+".mp3";
}}};
const browser={window:win,navigator,Audio:FakeAudio,MediaMetadata:FakeMetadata,
 console,Map,Promise,Number,Math};
runInNewContext(readingSource,browser,{filename:"reading-background-audio.js"});
const oldApi=win.ReadingBackgroundAudio;
runInNewContext(readingSource,browser,{filename:"reading-background-audio.js"});
assert.equal(win.ReadingBackgroundAudio,oldApi,"Standalone import must not replace runtime's media player");
runInNewContext(source,browser,{filename:"book-2100-background.js"});
const lib=win.Book2100BackgroundAudio;
assert.ok(lib&&typeof lib.create==="function"&&typeof lib.passage==="function"&&typeof lib.prepare==="function");
const allTexts=[];
for(const step of steps){
 const expected=step.entries.map(e=>e.sentence.trim()).join(" ");
 assert.equal(lib.passage(step),expected,"STEP "+step.id+" must include all sentences in source order");
 assert.ok(step.entries.every(e=>expected.includes(e.sentence.trim())),"STEP passage contains every source sentence, including quoted/interrupted punctuation");
 allTexts.push(expected);
}
assert.equal(new Set(allTexts).size,33,"Whole STEP passages must be distinct");
assert.equal(lib.passage({entries:[]}),"");
assert.equal(lib.create({entries:[]}),null,"Empty passage must not play");

const first=steps[0],events=[],errors=[];
assert.equal(lib.create(first),null,"Native audio must not point at a missing STEP MP3 before preparation");
assert.equal(await lib.prepare(first),"https://npkekrjzebsjfaizfcyb.supabase.co/storage/v1/object/public/language-studio-audio/tts/"+createHash("sha256").update(lib.passage(first)).digest("hex")+".mp3?ready=1");
assert.equal(prepareCalls,1,"Missing cloud MP3 must be generated/verified before playback");
assert.ok(lib.ready(first),"First STEP is prepared after cloud TTS finishes");
assert.ok(!lib.ready(steps[2]),"Other STEPs remain unprepared until selected");
await lib.prepare(first);
assert.equal(prepareCalls,1,"Preparation is deduplicated per full STEP");
const second=steps[1];
prepareFails=true;
await assert.rejects(()=>lib.prepare(second),/temporarily unavailable/);
prepareFails=false;
await lib.prepare(second);
assert.equal(prepareCalls,3,"Failed preparation must be retryable after connection recovers");
const player=lib.create(first,{
 onState:state=>events.push(state),
 onError:error=>errors.push(String(error))
});
assert.ok(player,"Native media session created for the current STEP");
assert.equal(audio.loop,true,"The browser's native audio.loop must be on, regardless of optional word repeat setting");
assert.equal(audio.playbackRate,.75,"The sentence listening player uses a comfortable 0.75x rate");
assert.equal(audio.defaultPlaybackRate,.75);
assert.match(session.metadata.title,/STEP 1/);
assert.ok(audio.src.startsWith("https://npkekrjzebsjfaizfcyb.supabase.co/storage/"),"Native iOS audio must use confirmed Storage MP3 directly, not virtual SW audio-cloud URL");
assert.equal(audio.src.endsWith("?ready=1"),true);
assert.equal(navigator.audioSession.type,"playback","iOS audio session explicitly allows lock-screen playback");
assert.equal(typeof actions.pause,"function");
assert.equal(typeof actions.play,"function");
player.play();
assert.equal(playCalls,1,"One user-gesture play starts the ENTIRE track");
assert.equal(audio.paused,false);
audio.currentTime=audio.duration;
audio.currentTime=0; // Browser loops natively; page timers are not needed.
assert.equal(audio.loop,true);
actions.pause();
assert.equal(audio.paused,true,"MediaSession pause works while screen locked");
actions.play();
assert.equal(audio.paused,false,"MediaSession resume works from lock-screen controls");
assert.deepEqual(errors,[]);
player.stop();
assert.ok(stopCalls>0,"Stop releases the audio src and MediaSession");
assert.equal(audio.src,"");
assert.equal(session.playbackState,"none");

assert.ok(bookSource.includes('window.Book2100BackgroundAudio?.create?.(step,'));
assert.ok(bookSource.includes('if(kind==="sentence"){'));
assert.ok(bookSource.includes('if(backgroundSession&&(backgroundPaused||backgroundNeedsTap)){'));
assert.ok(bookSource.includes('await prepare(step);'),"Audio cannot be played before cloud MP3 exists");
assert.ok(bookSource.includes('function warmStepAudio()'),"On-page prewarm avoids losing user activation for first tap");
assert.ok(bookSource.includes('backgroundPreparing=true;'));
assert.ok(bookSource.includes('if(error?.name==="NotAllowedError")'),"iOS blocked autoplay must show a user-gesture retry");
assert.ok(bookSource.includes('message("Chưa chuẩn bị được âm thanh nền; chuyển sang nghe từng câu.")'),"Cloud failure must not leave a silent button");
assert.ok(bookSource.includes('void playLegacyStep(step,kind,sequenceEpoch,entries)'),"Unplayable MP3 uses audible foreground fallback");
assert.ok(bookSource.includes('if(session){try{session.stop();}'),"Stop must release current background player");
assert.ok(bookSource.includes('backgroundSession=player;'));
assert.ok(bookSource.includes('player.play();'));
assert.ok(bookSource.includes('if(state.mode==="sentence")entries.forEach'),"Listening before a recall is assisted learning");
assert.ok(bookSource.includes('(kind==="sentence"||state.repeatAudio)'),"Legacy fallback must also repeat sentences");
assert.ok(bookSource.includes('audioMode()==="sentence"?"↻ Câu: tự lặp"'));
assert.ok(bookSource.includes('function focusNext(n,type)'),'Enter behavior must be preserved');
assert.ok(bookSource.includes('void speak(n,type);'),'Correct Enter pronunciation must be preserved');
assert.ok(!source.includes('setTimeout('),"Native background audio must not use a JS timer to advance between sentences");
assert.ok(readingSource.includes('config.audioUrl'),"Shared reading player must accept the prepared audio URL");
assert.ok(bookSource.includes('pattern80ListeningLaunch'),"Original 80-pattern listening library must be listed separately from Book 2100");

assert.ok(manifestSource.includes('addManifestAudio(wholeStep,"book-step-sentences-loop","book-2100-step-"+step.id)'));
assert.ok(sw.includes("'./book-2100-background.js'"));
assert.ok(sw.includes("'./reading-background-audio.js'"));
assert.ok(sw.includes("language-studio-v144-pattern80-responsive-study"));
assert.ok(html.indexOf('src="reading-background-audio.js')>=0);
assert.ok(html.indexOf('src="book-2100-background.js')>=0);
assert.ok(html.indexOf('src="book-2100-background.js')<html.indexOf('src="book-2100.js'));
assert.ok(html.includes('book-2100-background.js?v=20261128-pattern80-metadata-v1'));
assert.ok(html.includes('book-2100.js?v=20261128-pattern80-library-v1'));

if(process.argv.includes("--manifest")){
 const manifestPath=new URL("../dist/tts-manifest.json",import.meta.url);
 assert.ok(existsSync(manifestPath),"Built TTS allow-list must exist");
 const manifest=JSON.parse(readFileSync(manifestPath,"utf8"));
 for(const step of steps){
  const speech=lib.passage(step);
  const hash=createHash("sha256").update(
    ["gpt-4o-mini-tts-2025-12-15","teacher-v1","marin","en-US","natural",speech].join("|"),
    "utf8").digest("hex");
  const entry=manifest.entries[hash];
  assert.ok(entry,"Missing whole-STEP cloud TTS hash for STEP "+step.id);
  assert.equal(entry.text,speech,"Manifest speech must exactly match player text");
  assert.ok(entry.kinds.includes("book-step-sentences-loop"),"Whole passage type missing for STEP "+step.id);
  assert.ok(entry.lessonIds.includes("book-2100-step-"+step.id));
 }
}
console.log("PASS — 33 complete STEP sentence passages use native single-element looping, 0.75x rate, MediaSession pause/resume, active Stop and PWA/manifest integration"+(process.argv.includes("--manifest")?" (all 33 published audio hashes verified)":"")+".");
