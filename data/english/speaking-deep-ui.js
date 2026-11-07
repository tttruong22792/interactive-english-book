/* Interactive per-sentence explanations. Day 01 is the quality pilot;
   other days continue using the existing grammar reference without changes. */
(function(){
"use strict";
const esc=text=>String(text??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=selector=>document.querySelector(selector);
const $$=selector=>Array.from(document.querySelectorAll(selector));
function entriesFor(story){
 if(story?.id!=="speaking-01")return null;
 const entries=window.SPEAKING_DAY01_DEEP_DIVE?.entries;
 if(!Array.isArray(entries)||entries.length!==story.lines.length)return null;
 return entries.every((entry,index)=>entry.en===story.lines[index][0])?entries:null;
}
function clamp(value,length){
 return Math.max(0,Math.min(length-1,Math.trunc(Number(value)||0)));
}
function render(story,state){
 const entries=entriesFor(story);
 if(!entries)return "";
 const index=clamp(state.deepSentenceIndex,entries.length),item=entries[index];
 const en=value=>state.refShowEn?esc(value):"Tiếng Anh đang ẩn";
 const vi=value=>state.refShowVi?'<p lang="vi">'+esc(value)+'</p>':"";
 const example=([source,meaning])=>
  '<div class="reading-deep-example"><strong lang="en">'+en(source)+'</strong>'+vi(meaning)+'</div>';
 const accordion=(name,content,opened=false)=>
  '<details class="reading-deep-disclosure" '+(opened?'open':'')+'><summary>'+
  '<span>'+name+'</span><span aria-hidden="true">⌄</span></summary>'+
  '<div class="reading-deep-disclosure-body">'+content+'</div></details>';
 const chunks='<div class="reading-deep-breakdown">'+item.parts.map(([part,explanation])=>
  '<div class="reading-deep-part"><strong lang="en">'+en(part)+'</strong><p>'+esc(explanation)+'</p></div>').join('')+'</div>';
 const related=item.patterns?.length?
  '<div class="reading-deep-related"><strong>Liên kết đến bộ 80 mẫu câu</strong>'+
  item.patterns.map(pattern=>'<button type="button" data-reading-pattern="'+Number(pattern.id)+'">'+
  'Mẫu '+String(pattern.id).padStart(2,"0")+' · '+esc(pattern.label)+' →</button>').join('')+'</div>':"";
 return '<section class="reading-reference-panel reading-deep-panel">'+
  '<header class="reading-deep-header"><span class="reading-eyebrow">DAY 01 · HIỂU ĐỂ TỰ NÓI</span>'+
  '<h2>Hiểu sâu từng câu</h2>'+
  '<p>Giải thích cả '+entries.length+' câu theo đúng thứ tự bài đọc. Chọn số câu hoặc dùng nút chuyển câu để học.</p></header>'+
  '<nav class="reading-deep-index" aria-label="Chọn câu cần giải thích">'+entries.map((entry,i)=>
   '<button type="button" data-reading-deep-index="'+i+'" aria-current="'+(index===i?'step':'false')+
   '" aria-label="Câu '+(i+1)+': '+esc(entry.en)+'" title="'+esc(entry.en)+
   '" class="'+(index===i?'selected':'')+'">'+String(i+1).padStart(2,"0")+'</button>').join('')+'</nav>'+
  '<article class="reading-deep-card">'+
  '<div class="reading-deep-meta"><span>CÂU '+String(index+1).padStart(2,"0")+' / '+String(entries.length).padStart(2,"0")+
  '</span><span>'+esc(item.label)+'</span></div>'+
  '<div class="reading-deep-original"><div><h3 lang="en">'+en(item.en)+'</h3>'+vi(item.vi)+'</div>'+
  '<button type="button" id="readingDeepSpeak" class="reading-audio-button" aria-pressed="false" aria-label="Nghe câu gốc">♫ Nghe</button></div>'+
  '<section class="reading-deep-situation"><span class="reading-deep-section-label">TÌNH HUỐNG SỬ DỤNG</span>'+
  '<p>'+esc(item.situation)+'</p><strong>Người nói muốn truyền đạt gì?</strong>'+
  '<p>'+esc(item.purpose)+'</p></section>'+
  '<div class="reading-reference-visibility reading-deep-visibility" role="group" aria-label="Ẩn hiện nội dung Anh Việt">'+
  '<button type="button" data-reading-ref-toggle="en" aria-pressed="'+String(state.refShowEn)+'">'+
  (state.refShowEn?'Ẩn tiếng Anh':'Hiện tiếng Anh')+'</button>'+
  '<button type="button" data-reading-ref-toggle="vi" aria-pressed="'+String(state.refShowVi)+'">'+
  (state.refShowVi?'Ẩn tiếng Việt':'Hiện tiếng Việt')+'</button></div>'+
  accordion('01 · Tại sao nói như vậy?', '<p class="reading-deep-why">'+esc(item.why)+'</p>'+chunks,true)+
  accordion('02 · So sánh cách diễn đạt','<p class="reading-deep-intro">Chọn cách nói phù hợp theo tình huống:</p>'+
   item.compare.map(example).join(''))+
  accordion('03 · Điểm dễ nói sai','<p class="reading-deep-pitfall">'+esc(item.mistake)+'</p>')+
  accordion('04 · Biến đổi để dùng thực tế','<p class="reading-deep-intro">Không cần học vẹt cả ba câu, hãy thử thay nội dung bằng tình huống của mình:</p>'+
   item.apply.map(example).join(''))+
  related+
  '<div class="reading-deep-takeaway"><span>ĐIỀU CẦN NHỚ</span><strong>'+esc(item.takeaway)+'</strong></div>'+
  '</article>'+
  '<nav class="reading-deep-navigation" aria-label="Chuyển giữa các câu">'+
  '<button type="button" data-reading-deep-step="-1" '+(index===0?'disabled':'')+'>← Câu trước</button>'+
  '<span>'+String(index+1)+' / '+entries.length+'</span>'+
  '<button type="button" data-reading-deep-step="1" '+(index===entries.length-1?'disabled':'')+'>Câu tiếp →</button>'+
  '</nav><button type="button" id="readingDeepToText" class="reading-inline-next">← Trở lại Đọc & Nghe</button>'+
  '</section>';
}
function bind(story,st,env,rerender,stop){
 const entries=entriesFor(story);
 if(!entries)return false;
 const change=next=>{
  const index=clamp(next,entries.length);
  if(index===clamp(st.deepSentenceIndex,entries.length))return;
  st.deepSentenceIndex=index;env.saveState();rerender(story);
 };
 $$("[data-reading-deep-index]").forEach(btn=>btn.onclick=()=>change(btn.dataset.readingDeepIndex));
 $$("[data-reading-deep-step]").forEach(btn=>btn.onclick=()=>change(clamp(st.deepSentenceIndex,entries.length)+Number(btn.dataset.readingDeepStep)));
 $("#readingDeepSpeak")?.addEventListener("click",()=>{
  const button=$("#readingDeepSpeak");
  window.ReadingReferenceUI?.playPronunciation?.(button,entries[clamp(st.deepSentenceIndex,entries.length)].en,env,stop);
 });
 $$("[data-reading-pattern]").forEach(btn=>btn.onclick=()=>{
  stop();location.hash="#lesson/"+btn.dataset.readingPattern;
 });
 $("#readingDeepToText")?.addEventListener("click",()=>{
  st.tab="read";env.saveState();rerender(story);
 });
 return true;
}
window.SPEAKING_DEEP_UI={entriesFor,render,bind};
})();
