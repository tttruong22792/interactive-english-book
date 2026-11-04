import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const ctx={window:{SPEAKING_PROGRAM_RAW:[]},console};
for(let week=1;week<=14;week++){
 const file="../data/english/speaking-week-"+String(week).padStart(2,"0")+".js";
 runInNewContext(read(file),ctx,{filename:file});
}
for(let first=1;first<=70;first+=10){
 const file="../data/english/speaking-vi-"+String(first).padStart(2,"0")+"-"+String(first+9).padStart(2,"0")+".js";
 runInNewContext(read(file),ctx,{filename:file});
}
runInNewContext(read("../data/english/speaking-program.js"),ctx,{filename:"speaking-program.js"});
for(const filename of ["core-dictionary.js","reading-phrase-meanings.js","speaking-vocab-01.js","speaking-vocab-02.js","speaking-vocab-03.js","speaking-reference.js","reading-reference-ui.js"]){
 runInNewContext(read("../data/english/"+filename),ctx,{filename});
}
runInNewContext(read("../data/content-index.js"),ctx,{filename:"content-index.js"});
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
 assert.ok(story.lines.every(([en,vi])=>en.length>=8&&vi.length>=8),"Each English line has meaningful Vietnamese translation, Day "+day);
 assert.equal(ctx.window.SPEAKING_PROGRAM_VI?.[day]?.length,story.lines.length,"Translations aligned one to one for Day "+day);
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
assert.ok(ui.includes('id="readingToggleVi"')&&ui.includes('st.showVi=!st.showVi;env.saveState();renderReader(story)'),'Restore native visible/hidden Vietnamese meaning control');
assert.ok(ui.includes('st.showVi&&vi?')&&ui.includes('class="reading-vi"'),'Translations displayed under respective English line only when enabled');
assert.ok(ui.includes('["vocab","Từ vựng & cụm từ"]')&&ui.includes('["patterns","Mẫu câu"]'),"Vocabulary and grammar tabs replace speaking practice");
assert.ok(!ui.includes('["practice","Luyện nói"]')&&!ui.includes("readingPracticeDone"),"Speaking tab removed without deleting user progress");
assert.ok(ui.includes("beginAudioSequence")&&ui.includes("audioSequenceActive"),"Audio playback remains interruptible");
assert.ok(ui.includes('$$("[data-reading-speak]")')&&ui.includes('$$("[data-reading-save]")')&&ui.includes('$$("[data-reading-answer]")'),"All buttons and answers bind to collections");
assert.ok(ui.includes("story.lines.map(([en,vi],i)")&&ui.includes("hydrateReadingWords"),"Individual line playback and dictionary retained");
assert.ok(ui.includes("window.READING_STORIES"),"Older reader remains available for a rollback");
assert.ok(build.includes('readerWindow.SPEAKING_PROGRAM?.length!==70')&&build.includes('addManifestAudio(row[0],"reading-sentence",story.id)'),"Cloud TTS manifest includes 70 speeches");
assert.ok(!build.includes('"data/english/reading-stories-a1.js",'),"Old story bundle is no longer active");
const asset=index.match(/runtime-[0-9]{8}-[a-z0-9-]+\.js/)?.[0];
assert.equal(asset,"runtime-20261104-vocab-writing-v73c.js");
assert.ok(sw.includes(asset)&&sw.includes("reading-studio.css"),"PWA cache follows new release");
assert.ok(read("../data/english/reading-stories-a1.js").includes("A Busy Monday Morning"),"Legacy material preserved for rollback");
assert.ok(ui.includes('id="readingLoop"')&&ui.includes('id="readingReplay"'),"Player has continuous repeat switch and replay-from-start action");
assert.ok(ui.includes('st.loop=!st.loop;env.saveState();updatePlayer()'),"Loop choice can be switched while listening and is saved");
assert.ok(ui.includes('if(!config.loop)break;')&&ui.includes('i=0;')&&ui.includes('position.completed=true;'),"The final sentence can loop to the first sentence in full-passage mode");
assert.ok(ui.includes('playFrom(0)')&&ui.includes('env.audioSequenceActive(playToken)'),"Replay restarts at first sentence and respects sequence cancellation");
assert.ok(ui.includes('data-reading-play-mode="whole"')&&ui.includes('data-reading-play-mode="sentence"'),"Switch between full passage and single sentence playback");
assert.ok(ui.includes('config.playMode==="sentence"')&&ui.includes('if(!config.loop)break;'),"Individual sentences repeat until switched or stopped");
assert.ok(ui.includes('st.playMode=selected')&&ui.includes('if(wasPlaying)void playFrom(at)'),"Changing modes persists and restarts without overlapping playback");
const ref=ctx.window.SPEAKING_REFERENCE;
assert.ok(ref?.wordsFor&&ref?.phrasesFor&&ref?.patternsFor,"Per-lesson vocabulary and grammar reference loads");
const uniqueWordForms=new Set(),studyWords=new Set();let expandedPhrases=0,grammarReferences=0;
for(const story of stories){
 const words=ref.wordsFor(story),full=ref.allWordsFor(story),phrases=ref.phrasesFor(story),patterns=ref.patternsFor(story);
 assert.ok(words.length>=10,"Day "+story.day+" needs a useful study list");
 for(const word of full){
  uniqueWordForms.add(word.term);
  assert.ok(word.meaning?.length>1,"Missing dictionary definition in Day "+story.day+": "+word.term);
 }
 for(const word of words){
  studyWords.add(word.term);
  assert.ok(word.meaning?.length>1,"Missing curated definition Day "+story.day+": "+word.term);
 }
 assert.ok(!words.some(word=>["hi","i'm","an","a","the","i","my"].includes(word.term)),"Do not show trivial isolated words in Day "+story.day);
 assert.ok(phrases.length>story.targetChunks.length,"Contextual chunks included beyond 3 curated phrases, Day "+story.day);
 for(const chunk of phrases){
  assert.ok(story.lines.some(([en])=>en.toLowerCase().replace(/[’‘]/g,"'").includes(chunk.name.toLowerCase().replace(/[’‘]/g,"'"))),"Chunk not found in reading Day "+story.day+": "+chunk.name);
  assert.ok(chunk.meaning||chunk.contextVi,"Chunk must have meaning or Vietnamese sentence context");
 }
 assert.ok(patterns.length>0,"Day "+story.day+" must provide actual grammar matches");
 for(const pattern of patterns){
  assert.ok(story.lines.some(([en])=>en===pattern.sentence),"Grammar example must originate from same reading");
  assert.ok(pattern.usage||pattern.description,"Grammar guide must explain usage");
 }
 expandedPhrases+=phrases.length;grammarReferences+=patterns.length;
}
assert.equal(uniqueWordForms.size,1170,"All 1,170 original word forms stay in tap-to-define dictionary");
assert.ok(studyWords.size<uniqueWordForms.size,"Curated learning list removes low-value function words");
assert.ok(ref.wordsFor(stories[0]).some(x=>x.term==="responsibilities"),"Day 01 retains useful workplace vocabulary");
assert.ok(ref.wordsFor(stories[0]).some(x=>x.term==="configuration"),"Day 01 retains technical vocabulary");
assert.ok(Object.keys(ctx.window.SPEAKING_VOCAB_EXTRA).length>=780,"Supplemental dictionary imported");
const refUI=read("../data/english/reading-reference-ui.js");
assert.ok(refUI.includes("data-reading-ref-toggle")&&refUI.includes("data-reading-reveal-en")&&refUI.includes("data-reading-reveal-vi"),"Bilingual English/Vietnamese hidden-reveal buttons exist");
assert.ok(refUI.includes("data-reading-word-lookup")&&app.includes("lookupReadingWord:async term")&&app.includes("SPEAKING_VOCAB_EXTRA"),"Single-word dictionary popup wired");
assert.ok(refUI.includes("data-reading-pattern")&&refUI.includes("Mở bài mẫu"),"Pattern cross-reference deep links");
assert.ok(build.includes('"data/english/speaking-reference.js"')&&build.includes('"data/english/reading-reference-ui.js"'),"All reference scripts included in runtime");
const writingUI=ctx.window.ReadingReferenceUI;
assert.ok(writingUI.answerMatches("Configuration ","configuration"),"Written answer comparison ignores case and surrounding spaces");
assert.ok(writingUI.answerMatches("  I've. ","i’ve"),"Written answer accepts straight/curly apostrophes and final punctuation");
assert.ok(!writingUI.answerMatches("configration","configuration"),"Incorrect spelling is not counted as mastered");
const writingState={vocabKind:"words",vocabView:"write",vocabRecall:{}};
const lesson=stories[0],wordList=ref.wordsFor(lesson);
const recallHtml=writingUI.vocabulary(lesson,writingState);
assert.ok(recallHtml.includes('id="readingRecallInput"')&&recallHtml.includes('id="readingRecallCheck"'),"VN-to-EN typed input and check control render");
assert.ok(recallHtml.includes(wordList[0].meaning),"The prompt is the Vietnamese translation of the current English word");
assert.ok(!recallHtml.includes('data-answer="'+wordList[0].term+'"'),"The English answer is never exposed in the initial prompt");
assert.ok(recallHtml.includes("Gợi ý")&&recallHtml.includes("Xem đáp án")&&recallHtml.includes("Bỏ qua"),"Learning aids do not automatically mark a word correct");
const referenceData=writingUI.recallData(lesson,writingState);
assert.equal(referenceData.done.length,0);
referenceData.done.push(wordList[0].term);
assert.equal(writingUI.recallCurrent(lesson,writingState,wordList).remaining.length,wordList.length-1,"Writing the correct English word advances the queue");
assert.equal(writingUI.recallCurrent(lesson,writingState,wordList).item.term,wordList[1].term,"Next prompt is a different unmastered word");
const otherDay=stories[1];
assert.equal(writingUI.recallData(otherDay,writingState).done.length,0,"Each lesson keeps independent writing progress");
assert.ok(!writingUI.vocabulary(lesson,{vocabKind:"phrases",vocabView:"list"}).includes('id="readingRecallForm"'),"Phrase list is not incorrectly graded against whole-sentence translations");
assert.ok(refUI.includes("bindWritingPractice")&&refUI.includes('form.onsubmit=event=>')&&refUI.includes('if(answerMatches(typed,item.term))'),"Input submission checks the actual English answer");
assert.ok(refUI.includes('if(!revealed){')&&refUI.includes('if(!accepted||revealed)'),"Looking at the answer does not count as mastered, even if copied correctly");
assert.ok(refUI.includes('env.saveState();rerender(story)')&&read("../reading-studio.js").includes('state.readingStudio.vocabRecall={}'),"Recall attempts and per-day progress are saved");

// Regression: opening Day 01 on mobile must bind a MULTI-element selector.
// querySelector() returns a single element and has no .forEach() method.
const domNodes=new Map();
const makeNode=()=>({
 dataset:{},style:{},classList:{toggle(){},add(){},remove(){}},
 value:"",innerHTML:"",textContent:"",hidden:false,
 setAttribute(){},addEventListener(){},focus(){},select(){},
 querySelector(){return null;}
});
const wordTab=makeNode(),phraseTab=makeNode(),vocabTab=makeNode(),readTab=makeNode(),patternsTab=makeNode();
wordTab.dataset.readingKind="words";phraseTab.dataset.readingKind="phrases";
vocabTab.dataset.readingTab="vocab";readTab.dataset.readingTab="read";patternsTab.dataset.readingTab="patterns";
ctx.document={
 querySelector(selector){
  if(!selector.startsWith("#"))return null;
  if(!domNodes.has(selector))domNodes.set(selector,makeNode());
  return domNodes.get(selector);
 },
 querySelectorAll(selector){
  if(selector==="[data-reading-kind]")return [wordTab,phraseTab];
  if(selector==="[data-reading-tab]")return [vocabTab,readTab,patternsTab];
  return [];
 }
};
let savedUpdates=0;
const lessonEnv={
 main:{innerHTML:""},state:{},
 setHeader(){},hydrateReadingWords(){},saveState(){savedUpdates++},
 stopSpeech(){},toast(){}
};
assert.doesNotThrow(()=>reader.render(lessonEnv,lesson.id),"Opening Day 01 should never show CONTENT ERROR");
assert.ok(lessonEnv.main.innerHTML.includes("Từ vựng & cụm từ"),"Vocabulary screen initially visible");
assert.equal(typeof phraseTab.onclick,"function","Phrase selector is bound with querySelectorAll");
phraseTab.onclick();
assert.equal(lessonEnv.state.readingStudio.vocabKind,"phrases","Phrase tab can be selected");
assert.ok(lessonEnv.main.innerHTML.includes("Cụm từ ("),"Phrase list renders after switching");
wordTab.onclick();
assert.equal(lessonEnv.state.readingStudio.vocabKind,"words","Word tab can be selected again");
const startRecall=domNodes.get("#readingStartRecall");
assert.equal(typeof startRecall?.onclick,"function","Active VN→EN write action wired");
startRecall.onclick();
assert.equal(lessonEnv.state.readingStudio.vocabView,"write");
assert.ok(lessonEnv.main.innerHTML.includes('id="readingRecallInput"'),"Writing exercise loads without a crash");
assert.ok(lessonEnv.main.innerHTML.includes("reading-writing-mode"),"Writing exercise has a focused layout instead of showing the audio player");
assert.ok(refUI.includes("syncRecallViewport")&&refUI.includes("clearRecallViewport"),"Keyboard focus and cleanup are wired");
const readingCss=read("../reading-studio.css");
assert.ok(readingCss.includes(".reading-detail.reading-writing-mode .reading-player{display:none}"),"Audio panel is hidden during written recall");
assert.ok(readingCss.includes("--reading-recall-height")&&readingCss.includes("position:fixed!important"),"iPhone typing view stays inside the visual viewport");

assert.ok(savedUpdates>=3,"Mode changes are persisted");
patternsTab.onclick();
assert.ok(lessonEnv.main.innerHTML.includes("reading-grammar-panel"),"Grammar tab still works");
readTab.onclick();
assert.ok(lessonEnv.main.innerHTML.includes("reading-text-panel"),"Read & Listen tab still works");
assert.ok(!/(?<!\$)\$\([^\n;]*?\)\.forEach\(/.test(refUI),"No single DOM query is treated as an array");

console.log("PASS Speaking Program: 70 bilingual lessons, "+uniqueWordForms.size+" words kept in dictionary, "+studyWords.size+" study terms, "+expandedPhrases+" phrases; VN-to-EN writing practice.");
