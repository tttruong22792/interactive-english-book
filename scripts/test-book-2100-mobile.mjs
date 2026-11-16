import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";

const read=p=>readFile(new URL("../"+p,import.meta.url),"utf8");
const desktopCss=await read("book-2100.css");
const mobileCss=await read("book-2100-mobile.css");
const js=await read("book-2100.js");
const html=await read("index.html");
const build=await read("scripts/build-static.mjs");
const sw=await read("sw.js");

new vm.Script(js,{filename:"book-2100.js"});
assert.ok(mobileCss.includes("@media(max-width:1279px)"),"Phone and tablet layouts must both use cards");
assert.ok(mobileCss.includes("grid-template-columns:minmax(0,1fr)!important"),"A card is one column, not a squeezed eight-column table");
assert.ok(mobileCss.includes('grid-template-areas:"number" "word" "wordvi"'),"Cards must have logical vertical field order");
assert.ok(mobileCss.includes("overflow-x:hidden!important"),"The scroller must not scroll sideways");
assert.ok(mobileCss.includes("overflow-y:auto!important"),"Only vertical scrolling is allowed");
assert.ok(mobileCss.includes("touch-action:pan-y"),"Touch gestures should be vertical");
assert.ok(mobileCss.includes("min-width:0!important"),"Legacy 580/610px min-width restrictions must be overridden");
assert.ok(mobileCss.includes(".bk-head{display:none!important}"),"The desktop table header must be hidden in mobile");
assert.ok(mobileCss.includes(".bk-show-words .bk-row .bk-sentence"),"Word cards must not show the sentence page");
assert.ok(mobileCss.includes(".bk-show-sentences .bk-row .bk-word"),"Sentence cards must not show the vocabulary page");
assert.ok(mobileCss.includes(".bk-row:not(.bk-expanded) .bk-jword"),"Japanese explanation should be collapsed by default");
assert.ok(mobileCss.includes(".bk-row:not(.bk-expanded) .bk-extra"),"Chunk explanations should be collapsed by default");
assert.ok(mobileCss.includes(".bk-row:not(.bk-expanded) .bk-sja"),"Sentence Japanese should be collapsed by default");
assert.ok(mobileCss.includes(".bk-row .bk-mastery"),"Original per-word SRS controls remain in cards");
assert.ok(mobileCss.includes(".bk-mobile-options-trigger"),"Compact settings access should be available on phone");
assert.ok(mobileCss.includes(".bk-bottom>div:first-child{display:none!important}"),"Desktop keyboard help should be hidden on phones");
assert.ok(mobileCss.includes("max-width:720px"),"Tablet cards must remain readable without filling extreme widths");
assert.ok(mobileCss.includes(".bk-keyboard-open"),"The iOS keyboard adaptations must be retained");
assert.ok(mobileCss.includes(".bk-focus-banner"),"Vietnamese cue must be preserved during keyboard input");
assert.ok(!mobileCss.includes("min-width:610px"),"No reintroduction of old row minimum");
assert.ok(!mobileCss.includes("min-width:580px"),"No reintroduction of old page-title minimum");

// All new card actions are presentation-only: original learning models, audio,
// Enter behavior and spaced-repetition engine remain shared across devices.
for(const token of [
  "function mobileCardKey(n)","function mobileCardAction(n)","data-mobile-expand",
  "mobileOptionsOpen","data-mobile-options","bk-expanded","aria-expanded",
  "renderRow(item)","practiceMeaning(\"word\",item.vi)",
  "practiceMeaning(\"sentence\",item.sentenceVi)",
  "listenButton(n,\"word\")","listenButton(n,\"sentence\")",
  "renderExtra(item)","masteryButton(n)","line(n,\"doneWords\")",
  "line(n,\"doneSentences\")","data-review-launch",
  "if(!typed){focusNext(n,type);return;}","if(clean(typed)!==clean(answer))",
  "srs.record(n,type,false)","srs.record(n,type,true,{assisted:",
  'root.classList.add("bk-focused","bk-keyboard-open")'
]){
  assert.ok(js.includes(token),"Mobile cards must preserve: "+token);
}
assert.match(js,/row\.classList\.toggle\("bk-expanded",opening\)/,"Expand/collapse acts on a single card");
assert.match(js,/if\(opening\)expandedMobileCards\.add\(key\)/,"Expansion survives innocuous rerenders within a STEP");
assert.match(js,/mobileOptionsOpen=!mobileOptionsOpen/,"Settings are actually interactive");

const deskHeader=desktopCss.indexOf(".book2100 .bk-head{");
const deskGrid=desktopCss.indexOf(".book2100 .bk-row{");
assert.ok(deskHeader>=0&&deskGrid>=0,"Original desktop book grid remains in its own stylesheet");
const indexDesktop=html.indexOf('href="book-2100.css?');
const indexMobile=html.indexOf('href="book-2100-mobile.css?');
assert.ok(indexDesktop>=0 && indexMobile>indexDesktop,"Mobile overrides must load after the desktop textbook CSS");
assert.ok(indexMobile<html.indexOf("</head>"),"Cards stylesheet must load in document head");
assert.ok(build.includes('"book-2100-mobile.css"'),"Production build must ship mobile CSS");
assert.ok(sw.includes("'./book-2100-mobile.css'"),"PWA must cache the mobile CSS");
assert.ok(sw.includes("language-studio-v136-book2100-continuous-cloud"),"Old PWA caches must be invalidated");


// iOS keyboard regression: the *last* card must be scrollable into the
// visual viewport, even when the main document cannot scroll.
for(const token of [
  "function keyboardScrollDelta(inputRect,scrollerRect,scrollTop,scrollHeight,clientHeight)",
  "function sizeToVisibleKeyboard()",
  "function alignPracticeAboveKeyboard()",
  "function queueKeyboardAlignment()",
  'window.visualViewport?.addEventListener("resize",onKeyboardViewportResize)',
  'window.addEventListener("resize",onKeyboardViewportResize)',
  'scroller.style.paddingBottom=Math.max(110,Math.round(scroller.clientHeight*.54))+"px"',
  'root.style.height=Math.max(200,Math.round(Math.min(window.innerHeight||viewport.height,viewport.height)))+"px"',
  "queueKeyboardAlignment();",
  "cancelKeyboardAlignment();restoreKeyboardViewport();",
  "if(compactBook())queueKeyboardAlignment()",
  'inputNode.focus({preventScroll:true})'
]){
  assert.ok(js.includes(token),"iOS last-input keyboard fix is missing: "+token);
}
assert.ok(!js.includes('inputNode.scrollIntoView({block:"center",behavior:"smooth"});}\n  }\n  function showAnswerMark'),"Mobile Next must not rely solely on scrollIntoView");
const deltaStart=js.indexOf("  function keyboardScrollDelta(");
const deltaEnd=js.indexOf("\n  function alignPracticeAboveKeyboard()",deltaStart);
assert.ok(deltaStart>=0 && deltaEnd>deltaStart,"Isolated scroll geometry helper is testable");
const computeDelta=new Function(js.slice(deltaStart,deltaEnd)+"\nreturn keyboardScrollDelta;")();
// The last word/cue is below the newly visible area after the iPhone
// keyboard appears. A scroll delta must put the input safely above it.
const scroller={top:75,bottom:410,height:335};
const lastInput={top:475,bottom:520,height:45};
const lastDelta=computeDelta(lastInput,scroller,1020,1860,335);
assert.ok(lastDelta>200,"Last-card focus must scroll upward substantially");
const movedBottom=lastInput.bottom-lastDelta;
assert.ok(movedBottom<scroller.bottom-55,"Last-card input must end above keyboard-edge safety margin");
// A field that is already comfortably visible must not jump.
assert.equal(computeDelta({top:183,bottom:228,height:45},scroller,500,1860,335),0);
// At the very start of a STEP, scrolling must clamp to zero.
assert.equal(computeDelta({top:80,bottom:125,height:45},scroller,0,1860,335),0);

console.log("PASS — Book 2100 responsive: one-column card display at phone/tablet widths; zero intentional x-scroll; desktop remains a book table; vocabulary/sentence modes, JP ruby, chunk expansions, English audio, Vietnamese recall, SRS and keyboard preserved.");
