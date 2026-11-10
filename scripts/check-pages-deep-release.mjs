import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {join} from "node:path";

// Release gate: test what GitHub Pages will actually upload, not only source files.
const root=new URL("../dist/",import.meta.url);
const fromDist=name=>readFileSync(new URL(name,root),"utf8");
const html=fromDist("index.html");
const assets=[...html.matchAll(/runtime-\d{8}-[a-z0-9-]+\.js/g)].map(x=>x[0]);
assert.ok(assets.length>0,"No versioned runtime referenced in index.html");
const runtimeName=assets[0];
assert.ok(runtimeName.includes("background-rate-v83"),"Old runtime linked in index.html: "+runtimeName);
assert.ok(existsSync(new URL(runtimeName,root)),"Missing runtime in Pages artifact: "+runtimeName);
const runtime=fromDist(runtimeName);
const css=fromDist("reading-studio.css");
const serviceWorker=fromDist("sw.js");
assert.ok(runtime.includes("window.SPEAKING_DAY01_DEEP_DIVE="),"Day 01 deep explanation data missing from runtime");
assert.ok(runtime.includes("window.SPEAKING_DEEP_UI="),"Day 01 interactive UI missing from runtime");
assert.ok(runtime.includes('deepReady?"Hiểu sâu từng câu":"Mẫu câu"'),"Deep tab label missing from bundled reading screen");
assert.ok(runtime.includes("reading-deep-panel")&&runtime.includes("data-reading-deep-index"),"Interactive nine-sentence screen missing");
assert.ok(css.includes(".reading-deep-panel"),"Day 01 styles missing from Pages artifact");
assert.ok(runtime.includes('id="readingRecallListen"')&&runtime.includes("input.blur?.();"),
  "Always-available pronunciation or completion keyboard cleanup missing from runtime");
assert.ok(runtime.includes('class="reading-write-dock"')&&runtime.includes('form="readingRecallForm"'),
  "The scroll-independent recall action dock is missing from runtime");
assert.ok(css.includes(".reading-write-dock{flex:0 0 auto;")&&css.includes(".reading-write-scroll{flex:1 1 auto;"),
  "Writing controls must remain visible while the question can scroll");
assert.ok(html.includes("background-rate-v83"),"Old version referenced in release index");
assert.ok(runtime.includes('Array.from(document.querySelectorAll("[data-reading-pronounce]"))'),
 "Word-list pronunciation buttons are not bound as a collection");
assert.ok(!runtime.includes('$("[data-reading-pronounce]").forEach'),
 "FATAL: querySelector().forEach() would break every vocabulary lesson");
assert.ok(runtime.includes('function bindSpeak(env,stop){')&&runtime.includes('for(const button of buttons)'),
 "Safe multi-button binding is absent from the published runtime");
assert.ok(runtime.includes('>♫ Nghe</button>')&&runtime.includes('button.textContent="♫ Nghe"'),
 "Published reading controls must use the approved ♫ Nghe label");
assert.ok(css.includes('background:#fff;color:#6553b8')&&css.includes('border:1px solid #e5def6'),
 "Published Listen button does not match the approved Tra từ design");
assert.ok(runtime.includes('window.ReadingReferenceUI={')&&runtime.includes('playPronunciation,answerMatches'),
 "Unified pronunciation handler is missing");
assert.ok(css.includes(".reading-reference-panel .reading-audio-button"),"Shared Listen button styles missing");
const manifest=JSON.parse(fromDist("tts-manifest.json"));
const allowed=Object.values(manifest.entries||{});
const fullTracks=allowed.filter(item=>(item.kinds||[]).includes("reading-full-passage"));
assert.equal(fullTracks.length,70,"Background audio manifest must include all 70 whole-passage tracks");
assert.ok(runtime.includes("window.ReadingBackgroundAudio={create,prepare,wholeText}"),
 "Continuous HTMLAudio playback module missing from runtime");
assert.ok(runtime.includes('id="readingBackground"')&&runtime.includes("function startBackground()"),
 "Read & Listen background playback control missing from runtime");
assert.ok(runtime.includes('navigator.audioSession.type="playback"'),
 "iOS background playback audio session is not configured");
assert.ok(runtime.includes("session.setPositionState")&&runtime.includes("setActionHandler"),
 "iPhone lock screen media controls are not configured");
assert.ok(css.includes(".reading-repeat-actions .reading-background-actions"),
 "Background audio player styling missing");
assert.ok(runtime.includes('st.backgroundRate=[.6,.7,.8,.9,1].includes(value)?value:.7;'),
 "Background speed must persist separately from normal reading speed");
assert.ok(runtime.includes('rate:st.backgroundRate,loop:st.loop')&&runtime.includes('id="readingBackgroundRate"'),
 "Default slower 0.70x background audio UI is missing");
assert.ok(runtime.includes('audio.playbackRate=selectedRate')&&
 runtime.includes('audio.addEventListener("loadedmetadata",()=>'),
 "Background playback speed must survive iPhone audio metadata loading");
assert.ok(css.includes(".reading-background-rate select"),
 "Slow background playback selector styling is missing");
assert.ok(serviceWorker.includes("async function mediaRange(request,response)")&&serviceWorker.includes("status:206"),
 "iPhone media byte-range support missing in service worker");
const day01Words=["scada","projects","responsibilities","vary","includes","unexpected"];
for(const word of day01Words){
 assert.ok(allowed.some(item=>item.text===word&&(item.kinds||[]).includes("reading-word")),
  "Cloud TTS allow-list missing Day 01 vocabulary word: "+word);
}
assert.ok(allowed.some(item=>(item.kinds||[]).includes("reading-vocab-phrase")),
 "Cloud TTS allow-list missing study phrases from reading lessons");
assert.ok(serviceWorker.includes(runtimeName),"PWA cache still references a different runtime");
const source=readFileSync(new URL("../data/english/speaking-week-01.js",import.meta.url),"utf8");
const explanations=readFileSync(new URL("../data/english/speaking-day01-deep-dive.js",import.meta.url),"utf8");
const sourceTexts=[...source.matchAll(/"lines":\s*\[([\s\S]*?)\]\s*\}/g)][0]?.[1];
assert.ok(sourceTexts,"Day 01 input not found");
for(const term of ["Hi everyone.","I’m an engineer at PcVue Japan.","That’s a quick overview of my work. Thank you."]){
 assert.ok(sourceTexts.includes(term)&&explanations.includes(term),"Missing original sentence in deep explanation: "+term);
}
console.log("PASS Pages artifact: Day 01 deep explanations, matching runtime, CSS and service worker. "+runtimeName);
