/* Focused vocabulary and grammar reference screens for the 70 speaking lessons. */
(function(){
"use strict";
const esc=text=>String(text??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
const ref=()=>window.SPEAKING_REFERENCE;
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
function reveal(value,visible,attr,label){
 return '<button type="button" class="reading-recall-reveal '+(visible?'visible':'masked')+'" '+attr+
   ' data-answer="'+esc(value)+'" data-masked="'+String(!visible)+'">'+
   (visible?esc(value):label)+'</button>';
}
function controls(st){
 return '<div class="reading-reference-visibility" role="group" aria-label="Ẩn hiện ngôn ngữ">'+
 '<button type="button" data-reading-ref-toggle="en" aria-pressed="'+String(st.refShowEn)+'">'+
 (st.refShowEn?'Ẩn tiếng Anh':'Hiện tiếng Anh')+'</button>'+
 '<button type="button" data-reading-ref-toggle="vi" aria-pressed="'+String(st.refShowVi)+'">'+
 (st.refShowVi?'Ẩn tiếng Việt':'Hiện tiếng Việt')+'</button></div>';
}
function vocabulary(story,st){
 const words=ref()?.wordsFor(story)||[],phrases=ref()?.phrasesFor(story)||[];
 const isWords=st.vocabKind!=="phrases",items=isWords?words:phrases;
 return '<section class="reading-reference-panel reading-vocab-panel"><header>'+
 '<span class="reading-eyebrow">HỌC TRƯỚC KHI NGHE</span>'+
 '<h2>Từ vựng & cụm từ · Day '+String(story.day).padStart(2,"0")+'</h2>'+
 '<p>Đầy đủ '+words.length+' từ khác nhau của bài và '+phrases.length+
 ' cụm lấy từ câu gốc. Ẩn tiếng Anh hoặc nghĩa Việt để tự nhớ.</p></header>'+
 '<div class="reading-reference-controls"><div class="reading-vocab-kind" role="group" aria-label="Từ vựng hay cụm từ">'+
 '<button type="button" data-reading-kind="words" class="'+(isWords?'selected':'')+'">Từ vựng ('+words.length+')</button>'+
 '<button type="button" data-reading-kind="phrases" class="'+(!isWords?'selected':'')+'">Cụm từ ('+phrases.length+')</button></div>'+controls(st)+'</div>'+
 '<label class="reading-reference-search"><span>Tìm '+(isWords?'từ':'cụm từ')+'</span>'+
 '<input id="readingReferenceSearch" type="search" placeholder="Tìm bằng tiếng Anh hoặc nghĩa Việt..." autocomplete="off"></label>'+
 '<p class="reading-reference-count" id="readingReferenceCount">Hiển thị '+items.length+'/'+items.length+' mục</p>'+
 '<div class="reading-reference-list">'+items.map((item,i)=>{
  const term=isWords?item.term:item.name,meaning=item.meaning||"",context=item.contextVi||"";
  return '<article class="reading-reference-card" data-reading-search="'+esc((term+" "+meaning+" "+context).toLowerCase())+'">'+
  '<div class="reading-reference-main"><div class="reading-reference-term"><small>'+
  (isWords?'TỪ '+String(i+1).padStart(2,"0")+' · Gặp '+item.frequency+' lần':
   item.kind==="selected"?'CỤM ĐÁNG NHỚ':'CỤM TRONG BÀI')+'</small>'+
  reveal(term,st.refShowEn,'data-reading-reveal-en','Chạm để xem tiếng Anh')+'</div>'+
  (isWords?reveal(meaning,st.refShowVi,'data-reading-reveal-vi','Chạm để xem nghĩa Việt'):
   '<div class="reading-reference-meaning"><span>'+(meaning?'Nghĩa cụm':'Nghĩa câu gốc (ngữ cảnh)')+'</span>'+
   reveal(meaning||context,st.refShowVi,'data-reading-reveal-vi','Chạm để xem nghĩa Việt')+'</div>')+
  (!isWords&&st.refShowEn?'<p class="reading-reference-example">Trong câu: '+esc(item.sentence)+'</p>':'')+
  '</div><div class="reading-reference-actions"><button type="button" data-reading-pronounce="'+esc(term)+'">♫ Nghe</button>'+
  (isWords?'<button type="button" data-reading-word-lookup="'+esc(term)+'">Tra từ</button>':
   meaning?'<button type="button" data-reading-save-phrase="'+esc(term)+'">☆ Lưu</button>':'')+
  '</div></article>';
 }).join('')+'</div>'+
 '<p class="reading-reference-footnote">Với cụm chưa có nghĩa riêng, phần tiếng Việt là bản dịch của câu chứa cụm; không phải bản dịch từng chữ của cụm.</p>'+
 '<button type="button" class="reading-inline-next" id="readingVocabToText">Học xong từ mới · Sang Đọc & Nghe →</button></section>';
}
function grammar(story,st){
 const patterns=ref()?.patternsFor(story)||[];
 return '<section class="reading-reference-panel reading-grammar-panel"><header>'+
 '<span class="reading-eyebrow">TRA CỨU CẤU TRÚC</span>'+
 '<h2>Các mẫu câu xuất hiện trong Day '+String(story.day).padStart(2,"0")+'</h2>'+
 '<p>'+patterns.length+' mẫu câu và điểm ngữ pháp được tìm thấy từ chính bài đọc. Mở từng mẫu để xem công thức, cách dùng và ví dụ gốc.'+
 ' Các mẫu trong bộ 80 cấu trúc có liên kết đến bài chuyên sâu.</p></header>'+
 '<div class="reading-reference-controls">'+controls(st)+'</div>'+
 '<div class="reading-grammar-list">'+patterns.map((pat,i)=>
  '<details class="reading-grammar-card"><summary>'+
  '<span class="reading-grammar-index">'+String(i+1).padStart(2,"0")+'</span>'+
  '<div><small>'+esc(pat.linkedId?'MẪU '+String(pat.linkedId).padStart(2,"0")+' TRONG BỘ 80':'NGỮ PHÁP THƯỜNG DÙNG')+'</small>'+
  '<strong>'+(st.refShowEn?esc(pat.title):'Cấu trúc tiếng Anh đang ẩn')+'</strong>'+
  (st.refShowVi?'<span>'+esc(pat.meaning)+'</span>':'')+'</div><span class="reading-grammar-expand">⌄</span></summary>'+
  '<div class="reading-grammar-detail">'+
   '<p><b>Công thức:</b> '+(st.refShowEn?esc(pat.formula||pat.title):'Tiếng Anh đang ẩn')+'</p>'+
   '<p><b>Cách dùng:</b> '+(st.refShowVi?esc(pat.usage||pat.description):'Tiếng Việt đang ẩn')+'</p>'+
   '<div class="reading-grammar-example"><span>Ví dụ ngay trong bài đọc</span>'+
   (st.refShowEn?'<p lang="en">'+esc(pat.sentence)+'</p>':'<p>Tiếng Anh đang ẩn để tự nhớ.</p>')+
   (st.refShowVi?'<small lang="vi">'+esc(pat.contextVi)+'</small>':'')+'</div>'+
   '<div class="reading-reference-actions"><button type="button" data-reading-pronounce="'+esc(pat.sentence)+'">♫ Nghe ví dụ</button>'+
   (pat.linkedId?'<button type="button" data-reading-pattern="'+pat.linkedId+'">Mở bài mẫu '+String(pat.linkedId).padStart(2,"0")+' →</button>':'')+
   '</div></div></details>').join('')+'</div>'+
 '<button type="button" class="reading-inline-next" id="readingGrammarToText">Quay về Đọc & Nghe →</button></section>';
}
function bindVisibility(story,st,env,rerender){
 $$("[data-reading-ref-toggle]").forEach(button=>button.onclick=()=>{
  const key=button.dataset.readingRefToggle==="en"?"refShowEn":"refShowVi";
  st[key]=!st[key];env.saveState();rerender(story);
 });
}
function bindSpeak(env,stop){
 $$("[data-reading-pronounce]").forEach(button=>button.onclick=()=>{stop();void env.speak(button.dataset.readingPronounce);});
}
function bindVocabulary(story,st,env,rerender,stop){
 $$("[data-reading-kind]").forEach(button=>button.onclick=()=>{
  st.vocabKind=button.dataset.readingKind;env.saveState();rerender(story);
 });
 const search=$("#readingReferenceSearch"),counter=$("#readingReferenceCount");
 if(search)search.oninput=()=>{
  const q=norm(search.value),cards=$$(".reading-reference-card");
  const visible=cards.filter(card=>{
   const match=norm(card.dataset.readingSearch).includes(q);
   card.hidden=!match;return match;
  }).length;
  if(counter)counter.textContent='Hiển thị '+visible+'/'+cards.length+' mục';
 };
 $$("[data-reading-reveal-en], [data-reading-reveal-vi]").forEach(button=>button.onclick=()=>{
  const masked=button.dataset.masked==="true";
  button.dataset.masked=String(!masked);
  button.textContent=masked?button.dataset.answer:
   (button.hasAttribute("data-reading-reveal-en")?"Chạm để xem tiếng Anh":"Chạm để xem nghĩa Việt");
  button.classList.toggle("masked",!masked);
 });
 $$("[data-reading-word-lookup]").forEach(button=>button.onclick=()=>void env.lookupReadingWord?.(button.dataset.readingWordLookup));
 $$("[data-reading-save-phrase]").forEach(button=>button.onclick=()=>{
  const match=ref()?.phrasesFor(story).find(p=>p.name===button.dataset.readingSavePhrase);
  if(match?.meaning&&env.saveReadingPhrase?.(match.name,match.meaning,story))button.textContent="★ Đã lưu";
 });
 $("#readingVocabToText")?.addEventListener("click",()=>{st.tab="read";env.saveState();rerender(story);});
 bindSpeak(env,stop);
}
function bindGrammar(story,st,env,rerender,stop){
 $$("[data-reading-pattern]").forEach(button=>button.onclick=()=>{stop();location.hash="#lesson/"+button.dataset.readingPattern;});
 $("#readingGrammarToText")?.addEventListener("click",()=>{st.tab="read";env.saveState();rerender(story);});
 bindSpeak(env,stop);
}
window.ReadingReferenceUI={vocabulary,grammar,bindVisibility,bindVocabulary,bindGrammar};
})();