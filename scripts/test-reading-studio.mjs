import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const ctx={window:{SPEAKING_PROGRAM_RAW:[]},console};
for(let week=1;week<=14;week++){
 const file="../data/english/speaking-week-"+String(week).padStart(2,"0")+".js";
 runInNewContext(read(file),ctx,{filename:file});
}
runInNewContext(read("../data/english/speaking-program.js"),ctx,{filename:"speaking-program.js"});
runInNewContext(read("../reading-studio.js"),ctx,{filename:"reading-studio.js"});

const stories=ctx.window.SPEAKING_PROGRAM||[],reader=ctx.window.ReadingStudio;
assert.equal(stories.length,70,"Exactly 70 daily speaking passages");
assert.ok(reader?.render&&reader?.stop&&reader.isSpeakingProgram,"Speaking program is the active Read & Listen catalog");
assert.equal(reader.stories.length,70,"Only 70 new lessons are visible; old stories remain in source files");
let lines=0,words=0,chunks=0;
const ids=new Set(),titles=new Set();
for(let day=1;day<=70;day++){
 const story=stories[day-1],week=Math.ceil(day/5);
 assert.equal(story.day,day,"Consecutive day order "+day);
 assert.equal(story.week,week,"Exactly 5 lessons per week "+day);
 assert.equal(story.id,"speaking-"+String(day).padStart(2,"0"));
 assert.equal(story.level,"W"+String(week).padStart(2,"0"));
 assert.ok(story.weekTitle&&story.weekVi&&story.title&&story.viTitle,"Bilingual headings for "+day);
 assert.ok(!ids.has(story.id)&&!titles.has(story.title),"Unique day and topic");
 ids.add(story.id);titles.add(story.title);
 assert.ok(story.lines.length>=6&&story.lines.every(row=>Array.isArray(row)&&row.length===2),"Connected passage "+day);
 assert.ok(story.lines.every(([en,vi])=>en.length>=8&&vi===""),"Original English preserved; never invent Vietnamese sentence translations");
 const text=story.lines.map(row=>row[0]).join(" ").replace(/[’‘]/g,"'").toLowerCase();
 assert.ok(story.targetChunks.length>=2,"Useful phrases for every lesson "+day);
 for(const phrase of story.targetChunks){
  assert.ok(text.includes(phrase.replace(/[’‘]/g,"'").toLowerCase()),"Chunk must occur in user-provided passage: Day "+day+" "+phrase);
 }
 chunks+=story.targetChunks.length;
 lines+=story.lines.length;
 words+=story.lines.reduce((s,row)=>s+row[0].split(/\s+/).length,0);
 assert.equal(story.questions.length,0,"No invented multiple-choice question for user-supplied speech");
}
assert.equal(lines,545,"All 545 English spoken lines are present");
assert.ok(words>6500,"Full spoken texts, not short summaries");
assert.ok(chunks>=200,"Curated collocations across all 70 lessons");
assert.equal(stories[0].title,"Introducing My Work");
assert.equal(stories[35].title,"Asking a Colleague for Help");
assert.equal(stories[69].title,"My Work, My Progress, and My Future Goals");
assert.equal(stories[0].lines[0][0],"Hi everyone.");
assert.equal(stories[69].lines.at(-1)[0],"Thank you for listening.");

const ui=read("../reading-studio.js"),app=read("../app.js"),index=read("../index.html"),sw=read("../sw.js"),build=read("../scripts/build-static.mjs");
assert.ok(app.includes("r.name === 'reading'")&&app.includes("renderReadingStudio"),"Original reading route retained");
assert.ok(index.includes('data-route="reading"')&&index.includes("reading-studio.css"),"Phone navigation retained");
assert.ok(ui.includes("readingWeekSelect")&&ui.includes("WEEK ")&&ui.includes("reading-week-heading"),"Fourteen-week browsing");
assert.ok(ui.includes("readingPracticeListen")&&ui.includes("readingPracticeDone"),"Read, listen, shadow and retell");
assert.ok(ui.includes("beginAudioSequence")&&ui.includes("audioSequenceActive"),"Audio playback remains interruptible");
assert.ok(ui.includes('$$("[data-reading-speak]")')&&ui.includes('$$("[data-reading-save]")')&&ui.includes('$$("[data-reading-answer]")'),"All buttons and answers bind to collections");
assert.ok(ui.includes("story.lines.map(([en,vi],i)")&&ui.includes("hydrateReadingWords"),"Individual line playback and dictionary retained");
assert.ok(ui.includes("window.READING_STORIES"),"Older reader remains available for a rollback");
assert.ok(build.includes('readerWindow.SPEAKING_PROGRAM?.length!==70')&&build.includes('addManifestAudio(row[0],"reading-sentence",story.id)'),"Cloud TTS manifest includes 70 speeches");
assert.ok(!build.includes('"data/english/reading-stories-a1.js",'),"Old story bundle is no longer active");
const asset=index.match(/runtime-[0-9]{8}-[a-z0-9-]+\.js/)?.[0];
assert.equal(asset,"runtime-20261102-speaking70.js");
assert.ok(sw.includes(asset)&&sw.includes("reading-studio.css"),"PWA cache follows new release");
assert.ok(read("../data/english/reading-stories-a1.js").includes("A Busy Monday Morning"),"Legacy material preserved for rollback");
console.log("PASS Speaking Program: "+stories.length+" lessons, 14 weeks, "+lines+" playable sentences, "+chunks+" curated chunks, English originals preserved.");
