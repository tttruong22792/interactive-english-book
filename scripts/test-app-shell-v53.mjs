import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=(p)=>readFileSync(p,"utf8");
const html=read("index.html");
const app=read("app.js");
const css=read("app-shell-v53.css");
const sw=read("sw.js");
const builder=read("scripts/build-static.mjs");
const manifest=JSON.parse(read("manifest.webmanifest"));
const versionedRuntime=html.match(/runtime-[0-9]{8}-[a-z0-9-]+\.js/)?.[0]||"";

new vm.Script(app,{filename:"app.js"});
const tests=[
 ["One route for the primary chunk tab",html.includes('data-route="vocab"')],
 ["Daily and patterns remain accessible",html.includes('data-route="daily"')&&html.includes('data-route="patterns"')],
 ["One extra-menu button on mobile",/class="bottom-nav mobile-only"[\s\S]*?data-ui-menu/.test(html)],
 ["Old Japanese and settings modules remain in menu",html.includes('data-route="japanese"')&&html.includes('data-route="settings"')],
 ["App-sized viewport and scrollable internal workspace",css.includes("height:100dvh")&&css.includes("overflow-y:auto")&&css.includes("overscroll-behavior-y:contain")],
 ["Fixed safe-area mobile tabs",css.includes("env(safe-area-inset-bottom")&&css.includes("grid-template-columns:repeat(4,minmax(0,1fr))")],
 ["Short displays can scroll to hidden controls",css.includes("max-height:675px")&&css.includes("overflow-y:auto")],
 ["Legacy trainer keyboard protection kept",css.includes("html.vocab-keyboard-open")],
 ["Compact chunk dashboard and 4 core quick actions",app.includes('class="chunk-app-dashboard"')&&["Học chunk","Tự nhớ","Phản xạ","Nghe cụm"].every(v=>app.includes(v))],
 ["All previous chunk screens still have routes",["today","listen","learn","remember","lesson","automate","use","library"].every(v=>app.includes("normalizedView==='"+v+"'"))],
 ["Routing defaults to one daily study plan",app.includes("if(!location.hash) location.hash='#daily';")],
 ["Workspace scroll resets on route navigation",app.includes("$('#mainView').scrollTop=0;")],
 ["New CSS included in build and HTML",builder.includes('"app-shell-v53.css"')&&html.includes('app-shell-v53.css?v=20261019-app-v53')],
 ["Versioned runtime present in build and HTML",!!versionedRuntime&&builder.includes('"'+versionedRuntime+'"')],
 ["PWA pre-caches current CSS and JS",!!versionedRuntime&&sw.includes("'./app-shell-v53.css'")&&sw.includes("'./"+versionedRuntime+"'")],
 ["Installed PWA opens Hôm nay",manifest.start_url.endsWith("#daily")],
];
for(const [name,success] of tests){assert.ok(success,name);console.log("OK",name);}
console.log("v53 app shell:",tests.length,"static integration checks passed");
