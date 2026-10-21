import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const ctx={window:{},console};
for(const file of [
 "../data/english/reading-stories-a1.js",
 "../data/english/reading-stories-a2.js",
 "../data/english/reading-stories-b1-b2.js",
 "../reading-studio.js"
]){
 runInNewContext(readFileSync(new URL(file,import.meta.url),"utf8"),ctx,{filename:file});
}
const stories=ctx.window.READING_STORIES||[];
const reader=ctx.window.ReadingStudio;
assert.ok(reader?.render&&reader?.stop,"Reading and audio controls are available");
assert.equal(stories.length,30,"Exactly 30 graded reader lessons");
assert.deepEqual(Array.from(["A1","A2","B1","B2"].map(level=>stories.filter(s=>s.level===level).length)),[10,10,7,3]);
let sentences=0;
for(const [i,story] of stories.entries()){
 assert.ok(story.id&&story.title&&story.viTitle&&story.topic,"Story metadata "+i);
 assert.equal(story.id.match(/^([a-z][0-9])-(\d+)$/)?.[2],String(i+1).padStart(2,"0"),"Ordered story "+i);
 assert.ok(Array.isArray(story.lines)&&story.lines.length>=8,"Story is a real connected passage, not a one-line example "+story.id);
 assert.equal(story.questions.length,2,"Two comprehension questions "+story.id);
 for(const [en,vi] of story.lines){
  assert.ok(en.trim().length>=8&&vi.trim().length>=5,"Bilingual line present "+story.id);
  assert.ok(!en.includes("…"),"No placeholder sentences "+story.id);
  sentences++;
 }
 for(const q of story.questions){
  assert.ok(q.prompt&&q.choices.length===3,"Comprehension question format "+story.id);
  assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<3,"Correct answer selected "+story.id);
 }
 assert.ok(story.targetChunks.length>=3,"Contextual chunks "+story.id);
 assert.ok(story.patterns.length>=2&&story.patterns.every(n=>n>=1&&n<=80),"Crosslinks to existing 80 patterns "+story.id);
}
assert.ok(sentences>=250,"At least 250 individually playable bilingual lines");
const readerSource=readFileSync(new URL("../reading-studio.js",import.meta.url),"utf8");
const appSource=readFileSync(new URL("../app.js",import.meta.url),"utf8");
const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const builder=readFileSync(new URL("../scripts/build-static.mjs",import.meta.url),"utf8");
const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
assert.ok(appSource.includes("r.name === 'reading'")&&appSource.includes("renderReadingStudio"),"Reader route is integrated");
assert.ok(index.includes('data-route="reading"')&&index.includes("reading-studio.css"),"iOS and tablet navigation");
assert.ok(builder.includes('addManifestAudio(row[0],"reading-sentence",story.id)'),"Cloud TTS hash allowlist covers reader sentences");
assert.ok(sw.includes("runtime-20261021-reading-v56.js")&&sw.includes("reading-studio.css"),"Installed PWA cache refreshes");
assert.ok(readerSource.includes("beginAudioSequence")&&readerSource.includes("audioSequenceActive"),"Audio cannot leak between routes");
assert.ok(readerSource.includes("reader-line")&&readerSource.includes('data-reading-answer'),"Highlight and active comprehension");
console.log("PASS Reading Studio: 30 graded stories, "+sentences+" sentence clips, 60 comprehension checks, on-device progress and PWA wiring");
