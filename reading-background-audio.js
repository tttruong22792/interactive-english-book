/* Continuous reading audio for iOS background/lock-screen playback.
   A single HTMLMediaElement is essential; JS-per-sentence queues can suspend
   when the browser is backgrounded. No WebAudio or speechSynthesis here. */
(function(){
"use strict";
const prepared=new Map();
function wholeText(story){
 return (story?.lines||[]).map(row=>Array.isArray(row)?String(row[0]||"").trim():"").filter(Boolean).join(" ");
}
function prepare(text){
 if(!text||!window.AITTS?.prepareAudioUrl)return Promise.resolve(null);
 if(prepared.has(text))return prepared.get(text);
 const job=Promise.resolve().then(()=>window.AITTS.prepareAudioUrl(text,{language:"en-US",voice:"marin"}))
  .catch(error=>{prepared.delete(text);console.warn("Background audio preparation failed",error);return null;});
 prepared.set(text,job);
 return job;
}
function normalizeRate(value){
 const n=Number(value);
 return Number.isFinite(n)&&n>0?Math.min(1,Math.max(.6,n)):.7;
}
function create(config){
 const text=String(config?.text||"").trim();
 if(!text||!window.AITTS?.staticAudioUrl||typeof Audio!=="function")return null;
 const audio=new Audio();
 audio.preload="auto";
 audio.loop=!!config.loop;
 let selectedRate=normalizeRate(config.rate);
 audio.playbackRate=selectedRate;
 try{audio.defaultPlaybackRate=selectedRate;}catch(_){}
 try{audio.preservesPitch=true;audio.webkitPreservesPitch=true;}catch(_){}
 let active=true;
 const tell=(kind,payload)=>{
  if(!active)return;
  const fn=kind==="error"?config.onError:kind==="ended"?config.onEnded:config.onState;
  try{fn?.(kind==="state"?payload:payload);}catch(e){console.warn("Reading media callback",e)}
 };
 const session=(typeof navigator!=="undefined"&&navigator.mediaSession)||null;
 const action=(name,handler)=>{try{session?.setActionHandler?.(name,handler);}catch(_){}};
 const position=()=>{
  if(!session?.setPositionState)return;
  const duration=audio.duration;
  if(!Number.isFinite(duration)||duration<=0)return;
  try{session.setPositionState({
   duration,playbackRate:audio.playbackRate,
   position:Math.min(duration,Math.max(0,Number(audio.currentTime)||0))
  });}catch(_){}
 };
 const pause=()=>{if(!active)return;audio.pause();tell("state","paused");};
 const resume=()=>{
  if(!active)return;
  try{
   if(navigator?.audioSession)navigator.audioSession.type="playback";
  }catch(_){}
  try{
   const pending=audio.play();
   pending?.catch?.(error=>{if(active)tell("error",error);});
  }catch(error){tell("error",error);}
 };
 const restart=()=>{if(!active)return;try{audio.currentTime=0;}catch(_){}resume();};
 const seek=seconds=>{
  if(!active||!Number.isFinite(audio.duration))return;
  audio.currentTime=Math.max(0,Math.min(audio.duration,seconds));position();
 };
 const stopped=()=>{if(!active)return;pause();};
 const cleanup=()=>{
  if(!active)return;
  active=false;
  try{audio.pause();audio.removeAttribute("src");audio.load();}catch(_){}
  for(const name of ["play","pause","stop","seekto","seekbackward","seekforward","previoustrack","nexttrack"])
   action(name,null);
  try{if(session)session.playbackState="none";}catch(_){}
 };
 audio.addEventListener("playing",()=>{tell("state","playing");try{if(session)session.playbackState="playing";}catch(_){}position();});
 audio.addEventListener("pause",()=>{if(active){tell("state","paused");try{if(session)session.playbackState="paused";}catch(_){}}});
 audio.addEventListener("ended",()=>{if(active)tell("ended");});
 audio.addEventListener("error",()=>{
  if(!active)return;
  const cause=new Error("Không tải được bản ghi âm của bài.");
  tell("error",cause);
 });
 audio.addEventListener("loadedmetadata",()=>{
  // Preserve a deliberately slow listening rate even when iOS completes
  // a new media source load while the screen is locking.
  audio.playbackRate=selectedRate;
  position();
 });
 audio.addEventListener("timeupdate",position);
 try{
  if(navigator?.audioSession)navigator.audioSession.type="playback";
 }catch(_){}
 try{
  if(session && typeof MediaMetadata!=="undefined"){
   session.metadata=new MediaMetadata({
    title:String(config.title||"English reading"),
    artist:String(config.artist||"Language Studio · Đọc & Nghe"),
    album:"100-Day English Speaking Program"
   });
  }
  if(session)session.playbackState="paused";
 }catch(_){}
 action("play",resume);action("pause",pause);action("stop",stopped);
 action("seekto",detail=>seek(Number(detail.seekTime)||0));
 action("seekbackward",detail=>seek(audio.currentTime-(Number(detail.seekOffset)||10)));
 action("seekforward",detail=>seek(audio.currentTime+(Number(detail.seekOffset)||10)));
 action("previoustrack",restart);
 action("nexttrack",()=>seek(Number.isFinite(audio.duration)?audio.duration:audio.currentTime));
 let url;
 try{url=window.AITTS.staticAudioUrl(text,"en-US","marin");}
 catch(error){cleanup();throw error;}
 audio.src=url;
 return {
  play:resume,pause,resume,restart,stop:cleanup,
  isActive:()=>active,isPlaying:()=>active&&!audio.paused,
  setLoop(value){audio.loop=!!value;},
  setRate(value){
   selectedRate=normalizeRate(value);
   audio.playbackRate=selectedRate;
   try{audio.defaultPlaybackRate=selectedRate;}catch(_){}
   position();
  },
  get currentTime(){return audio.currentTime;},
  get duration(){return audio.duration;}
 };
}
window.ReadingBackgroundAudio={create,prepare,wholeText};
})();