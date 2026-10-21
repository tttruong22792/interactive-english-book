import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const html=read('index.html');
const css=read('easy-play-theme-v58.css');
const app=read('app.js');
const sw=read('sw.js');
const build=read('scripts/build-static.mjs');
const base=read('app-shell-v53.css');
const reading=read('reading-studio.css');
new vm.Script(app,{filename:'app.js'});

const style='easy-play-theme-v58.css';
const runtime='runtime-20261022-mission60-v59.js';
assert.ok(html.includes(style+'?v=20261022-v58'),'v58 styles must load in HTML');
assert.ok(html.indexOf(style)>html.indexOf('reading-studio.css'),'new theme must override earlier app CSS');
assert.ok(build.includes('"'+style+'"'),'new theme must be copied to published site');
assert.ok(build.includes('"'+runtime+'"'),'new bundle must be published');
assert.ok(sw.includes("'./"+style+"'")&&sw.includes("'./"+runtime+"'"),'new iPhone/iPad PWA caches theme and runtime');
assert.ok(html.includes(runtime),'index uses new versioned runtime');
assert.ok(!/@import\b|url\(\s*['"]?https?:/i.test(css),'theme does not depend on external fonts or imagery');
assert.ok(/--ls-canvas:#fffaf3/.test(css),'warm light canvas has stable design token');
for(const token of ['.easy-play-home-hero','.easy-play-activities','.easy-play-activity',
  '.chunk-app-focus','.chunk-app-quick','.chunk-memory-card',
  '.reading-library-head','.reading-story-card','.reading-detail-head',
  '.app-shell .pattern-card','.app-shell .daily-v52','.vocab-trainer-root .chunk-study-card',
  '.app-shell .bottom-nav']){
  assert.ok(css.includes(token),'all learning screens share new style: '+token);
}
assert.ok(/@media\(max-width:760px\)/.test(css),'phone layout');
assert.ok(/@media\(min-width:761px\) and \(max-width:1199px\)/.test(css),'tablet layout');
assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'phone has 2-column large activity tiles');
assert.ok(css.includes('grid-template-columns:repeat(5,minmax(0,1fr))'),'the five mobile tabs remain available');
assert.ok(base.includes('height:100dvh')&&base.includes('overscroll-behavior-y:contain'),'full-screen app shell remains intact');
assert.ok(reading.includes('.reading-player'),'reading controls remain installed');
assert.ok(app.includes("if(!location.hash) location.hash='#daily';"),'Daily mission is the default while chunks stay accessible');
for(const route of ['vocab','reading','daily','patterns','shadowing','challenge']){
 assert.ok(app.includes("route:'"+route+"'"),'card for existing '+route+' module is wired');
}
assert.ok(app.includes('bindGenericRoutes();'),'home cards attach click handlers');
assert.ok(html.includes('data-ui-menu')&&html.includes('data-route="settings"'),'all settings remain reachable');

console.log('PASS v58: pastel game-card shell, clickable home cards, core chunks, responsive iPad/iPhone styles and safe PWA update.');
