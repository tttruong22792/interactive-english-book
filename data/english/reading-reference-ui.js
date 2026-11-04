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
 if(isWords&&st.vocabView==="write")return writingPractice(story,st,words);
 return '<section class="reading-reference-panel reading-vocab-panel"><header>'+
 '<span class="reading-eyebrow">HỌC TRƯỚC KHI NGHE</span>'+
 '<h2>Từ vựng & cụm từ · Day '+String(story.day).padStart(2,"0")+'</h2>'+
 '<p>'+words.length+' từ đáng học và '+phrases.length+
 ' cụm lấy từ câu gốc. Có thể học trước và tự kiểm tra bằng cách viết tiếng Anh từ nghĩa Việt.</p></header>'+
 '<div class="reading-reference-controls"><div class="reading-vocab-kind" role="group" aria-label="Từ vựng hay cụm từ">'+
 '<button type="button" data-reading-kind="words" class="'+(isWords?'selected':'')+'">Từ vựng ('+words.length+')</button>'+
 '<button type="button" data-reading-kind="phrases" class="'+(!isWords?'selected':'')+'">Cụm từ ('+phrases.length+')</button></div>'+controls(st)+'</div>'+
 (isWords?'<div class="reading-write-entry"><button id="readingStartRecall" type="button">✍ Nhìn tiếng Việt → Viết tiếng Anh</button>'+
 '<small>Tự nhập đáp án, kiểm tra đúng/sai và ôn lại những từ chưa nhớ.</small></div>':'')+
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

/* VN → EN active recall sits INSIDE the vocabulary tab; it never changes
   the original listening player or the reader's local progress. */
function normalizeWrittenAnswer(s){
 return String(s||"").trim().toLowerCase().replace(/[’‘]/g,"'")
  .replace(/\s+/g," ").replace(/[.!?;:,]+$/g,"").trim();
}
function answerMatches(typed,expected){
 return normalizeWrittenAnswer(typed)===normalizeWrittenAnswer(expected);
}
function recallData(story,st){
 if(!st.vocabRecall||typeof st.vocabRecall!=="object")st.vocabRecall={};
 let data=st.vocabRecall[story.id];
 if(!data||typeof data!=="object")data=st.vocabRecall[story.id]={done:[],missed:[],cursor:0,attempts:0};
 if(!Array.isArray(data.done))data.done=[];
 if(!Array.isArray(data.missed))data.missed=[];
 if(!Number.isFinite(data.cursor)||data.cursor<0)data.cursor=0;
 if(!Number.isFinite(data.attempts)||data.attempts<0)data.attempts=0;
 return data;
}
function recallCurrent(story,st,words){
 const data=recallData(story,st);
 const done=new Set(data.done);
 const remaining=words.filter(word=>!done.has(word.term));
 const index=remaining.length?Math.floor(data.cursor)%remaining.length:0;
 return {data,remaining,index,item:remaining[index]||null};
}
function writingPractice(story,st,words){
 const {data,remaining,item,index}=recallCurrent(story,st,words);
 const completed=words.length-remaining.length;
 const progress=words.length?Math.round(completed/words.length*100):100;
 return '<section class="reading-reference-panel reading-write-panel">'+
  '<div class="reading-write-top"><button id="readingRecallBack" type="button">← Danh sách từ</button>'+
  '<span>DAY '+String(story.day).padStart(2,"0")+' · VIỆT → ANH</span></div>'+
  '<h2>Nhìn nghĩa Việt, tự viết tiếng Anh</h2>'+
  '<p class="reading-write-intro">Chỉ khi tự viết đúng, từ mới được tính là đã nhớ. Từ sai hoặc bỏ qua sẽ xuất hiện lại.</p>'+
  '<div class="reading-write-progress"><div><strong>Đã viết đúng '+completed+'/'+words.length+' từ</strong>'+
  '<span>Còn '+remaining.length+' từ cần luyện</span></div>'+
  '<div class="reading-write-track" role="progressbar" aria-valuenow="'+completed+'" aria-valuemin="0" aria-valuemax="'+words.length+'">'+
  '<span style="width:'+progress+'%"></span></div></div>'+
  (!item?
   '<div class="reading-write-finished"><strong>✓ Bạn đã viết đúng toàn bộ từ vựng trong bài!</strong>'+
   '<p>Hãy chuyển sang phần Đọc & Nghe để thử nhận ra và sử dụng chúng trong ngữ cảnh.</p>'+
   '<button type="button" id="readingRecallRead">Sang Đọc & Nghe →</button>'+
   '<button type="button" id="readingRecallReset">↻ Luyện lại từ đầu</button></div>':
   '<div class="reading-write-card"><div class="reading-write-card-top"><span>TỪ CẦN NHỚ</span>'+
   '<span>'+String(index+1)+' / '+remaining.length+' chưa thuộc</span></div>'+
   '<div class="reading-write-vi" lang="vi">'+esc(item.meaning)+'</div>'+
   (item.contextVi?'<details class="reading-write-context"><summary>Xem câu tiếng Việt có chứa từ này</summary>'+
    '<p lang="vi">'+esc(item.contextVi)+'</p></details>':'')+
   '<form id="readingRecallForm" autocomplete="off"><label for="readingRecallInput">Viết từ tiếng Anh tương ứng</label>'+
   '<input id="readingRecallInput" type="text" placeholder="Nhập tiếng Anh..." autocapitalize="off" '+
   'autocorrect="off" autocomplete="off" spellcheck="false" enterkeyhint="done" required />'+
   '<button id="readingRecallCheck" type="submit">Kiểm tra</button></form>'+
   '<div id="readingRecallFeedback" class="reading-write-feedback" role="status" aria-live="polite"></div>'+
   '<div class="reading-write-actions"><button id="readingRecallHint" type="button">Gợi ý</button>'+
   '<button id="readingRecallReveal" type="button">Xem đáp án</button>'+
   '<button id="readingRecallSkip" type="button">Bỏ qua →</button>'+
   '<button id="readingRecallNext" type="button" hidden>Tiếp tục →</button></div></div>'+
   '<p class="reading-write-note">Ghi nhớ cách viết đúng. Xem đáp án hoặc bỏ qua không được tính là thuộc.</p>')+
  '</section>';
}
function bindWritingPractice(story,st,env,rerender){
 const words=ref()?.wordsFor(story)||[];
 const back=$("#readingRecallBack");
 if(back)back.onclick=()=>{st.vocabView="list";env.saveState();rerender(story);};
 const read=$("#readingRecallRead");
 if(read)read.onclick=()=>{st.tab="read";st.vocabView="list";env.saveState();rerender(story);};
 const reset=$("#readingRecallReset");
 if(reset)reset.onclick=()=>{
  st.vocabRecall[story.id]={done:[],missed:[],cursor:0,attempts:0};
  env.saveState();rerender(story);
 };
 const {data,item}=recallCurrent(story,st,words);
 if(!item)return;
 const form=$("#readingRecallForm"),input=$("#readingRecallInput"),feedback=$("#readingRecallFeedback"),
  check=$("#readingRecallCheck"),next=$("#readingRecallNext");
 if(!form||!input||!feedback||!check||!next)return;
 let accepted=false, revealed=false;
 const response=(message,kind)=>{
  feedback.className="reading-write-feedback "+kind;
  feedback.innerHTML=message;
 };
 const markMissed=()=>{
  if(!data.missed.includes(item.term))data.missed.push(item.term);
  data.attempts++;
  env.saveState();
 };
 const advance=()=>{
  if(!accepted)markMissed();
  if(!accepted||revealed){
   // Skipped words and answers viewed before writing remain in the recall queue.
   data.cursor+=1;
  }
  env.saveState();rerender(story);
 };
 form.onsubmit=event=>{
  event?.preventDefault?.();
  if(accepted){advance();return;}
  const typed=input.value.trim();
  if(!typed){response("Bạn cần viết tiếng Anh trước khi kiểm tra.","error");return;}
  if(answerMatches(typed,item.term)){
   accepted=true;
   if(!revealed){
    if(!data.done.includes(item.term))data.done.push(item.term);
    data.missed=data.missed.filter(word=>word!==item.term);
   }else if(!data.missed.includes(item.term))data.missed.push(item.term);
   data.attempts++;
   env.saveState();
   input.readOnly=true;
   check.disabled=true;
   check.textContent=revealed?"✓ Đã viết lại":"✓ Chính xác";
   const revealButton=$("#readingRecallReveal"),hintButton=$("#readingRecallHint");
   if(revealButton)revealButton.disabled=true;
   if(hintButton)hintButton.disabled=true;
   next.hidden=false;
   response(revealed?
    "✓ Đã viết lại theo đáp án. Từ này sẽ xuất hiện lại để kiểm tra trí nhớ.":
    "✓ Viết đúng! Bạn đã nhớ từ này.",revealed?"hint":"success");
  }else{
   markMissed();
   response("Chưa đúng. Hãy thử lại, dùng gợi ý hoặc xem đáp án.","error");
   input.focus();
   input.select?.();
  }
 };
 next.onclick=advance;
 $("#readingRecallSkip").onclick=advance;
 $("#readingRecallHint").onclick=()=>{
  const first=item.term.slice(0,Math.min(2,item.term.length));
  response('Gợi ý: bắt đầu bằng <strong>'+esc(first)+'…</strong> ('+item.term.length+' ký tự).',"hint");
  input.focus();
 };
 $("#readingRecallReveal").onclick=()=>{
  if(accepted)return;
  revealed=true;
  response('Đáp án của bài: <strong lang="en">'+esc(item.term)+'</strong> · Hãy thử viết lại. Mục này sẽ được kiểm tra thêm lần nữa.',"hint");
  input.focus();
 };
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
 if(st.vocabKind!=="phrases"&&st.vocabView==="write"){
  bindWritingPractice(story,st,env,rerender);
  return;
 }
 const start=$("#readingStartRecall");
 if(start)start.onclick=()=>{st.vocabKind="words";st.vocabView="write";env.saveState();rerender(story);};
 $("[data-reading-kind]").forEach(button=>button.onclick=()=>{
  st.vocabKind=button.dataset.readingKind;st.vocabView="list";env.saveState();rerender(story);
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
window.ReadingReferenceUI={vocabulary,grammar,bindVisibility,bindVocabulary,bindGrammar,answerMatches,recallData,recallCurrent};
})();