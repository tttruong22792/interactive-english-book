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
assert.ok(runtimeName.includes("day01-deep-v78"),"Old runtime linked in index.html: "+runtimeName);
assert.ok(existsSync(new URL(runtimeName,root)),"Missing runtime in Pages artifact: "+runtimeName);
const runtime=fromDist(runtimeName);
const css=fromDist("reading-studio.css");
const serviceWorker=fromDist("sw.js");
assert.ok(runtime.includes("window.SPEAKING_DAY01_DEEP_DIVE="),"Day 01 deep explanation data missing from runtime");
assert.ok(runtime.includes("window.SPEAKING_DEEP_UI="),"Day 01 interactive UI missing from runtime");
assert.ok(runtime.includes('deepReady?"Hiểu sâu từng câu":"Mẫu câu"'),"Deep tab label missing from bundled reading screen");
assert.ok(runtime.includes("reading-deep-panel")&&runtime.includes("data-reading-deep-index"),"Interactive nine-sentence screen missing");
assert.ok(css.includes(".reading-deep-panel"),"Day 01 styles missing from Pages artifact");
assert.ok(serviceWorker.includes(runtimeName),"PWA cache still references a different runtime");
const source=readFileSync(new URL("../data/english/speaking-week-01.js",import.meta.url),"utf8");
const explanations=readFileSync(new URL("../data/english/speaking-day01-deep-dive.js",import.meta.url),"utf8");
const sourceTexts=[...source.matchAll(/"lines":\s*\[([\s\S]*?)\]\s*\}/g)][0]?.[1];
assert.ok(sourceTexts,"Day 01 input not found");
for(const term of ["Hi everyone.","I’m an engineer at PcVue Japan.","That’s a quick overview of my work. Thank you."]){
 assert.ok(sourceTexts.includes(term)&&explanations.includes(term),"Missing original sentence in deep explanation: "+term);
}
console.log("PASS Pages artifact: Day 01 deep explanations, matching runtime, CSS and service worker. "+runtimeName);
