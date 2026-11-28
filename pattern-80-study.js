/* Original 80 English patterns — Round 1 interactive study book.
   Desktop: one complete 10-row book page, no scroll across rows.
   iPhone/tablet: tall, readable single-column cards (not a scaled table).
   Share source, SRS and audio with the existing Language Studio backend;
   never mutate the 2100 textbook or the 80-pattern reference lessons. */
(function(global){
"use strict";
const DATA=global.PATTERN80_ROUND1, HINTS=global.PATTERN80_HINTS;
if(!DATA||DATA.items?.length!==80||HINTS?.length!==80)return;
const PAGE_SIZE=10, PAGES=8, SETTINGS_KEY="languageStudio:pattern80BookView:v1";
const SRS_KEY="languageStudio:pattern80Srs:v1";
const cssEscape=s=>String(s??"").replace(/[&<>"']/g,c=>
  ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const items=DATA.items, hints=new Map(HINTS.map(h=>[h.n,h]));
const $=(s,el)=>el?.querySelector(s);
let root=null,trigger=null,observer=null,player=null,playbackEpoch=0;
let playing=false,preparing=false,needsTap=false,cloudRevision=-1;
const helped=new Set(),expanded=new Set();
const srs=global.Book2100SRS?.createStore?.({key:SRS_KEY})||null;
const state={page:1,mode:"read",showEn:true,showVi:true};
try{
 const saved=JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}");
 if(Number.isInteger(saved.page)&&saved.page>=1&&saved.page<=PAGES)state.page=saved.page;
 if(saved.mode==="read"||saved.mode==="study")state.mode=saved.mode;
 if(typeof saved.showEn==="boolean")state.showEn=saved.showEn;
 if(typeof saved.showVi==="boolean")state.showVi=saved.showVi;
}catch(_){}
function persist(){
 try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(state));}catch(_){}
}
function pageItems(page=state.page){
 return items.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
}
function track(){
 return {id:state.page,entries:pageItems().map(item=>({n:item.n,sentence:item.en}))};
}
function record(n){return srs?.get(n,"sentence")||{
 status:"new",due:false,successes:0,attempts:0,mistakes:0,stage:null};}
function counts(){
 const r={done:0,mastered:0,due:0,weak:0};
 for(const it of items){
  const rec=record(it.n);
  if(rec.successes>0)r.done++;
  if(rec.status==="mastered")r.mastered++;
  if(rec.status==="weak")r.weak++;
  if(rec.due)r.due++;
 }
 return r;
}
function statusText(rec){
 return {new:"Mới",weak:"Cần ôn",learning:"Đang nhớ",mastered:"Vững"}[rec.status]||"Mới";
}
function mastery(n){
 const rec=record(n);
 return '<button type="button" class="p80mastery is-'+rec.status+
  (rec.due?" is-due":"")+'" data-mastery="'+n+'" title="'+statusText(rec)+
  (rec.due?" · Đến hạn ôn":"")+'" aria-label="Mẫu '+n+': '+statusText(rec)+'">'+
  '<span aria-hidden="true">'+(rec.status==="mastered"?"✓":rec.status==="new"?"○":"◉")+'</span>'+
  (rec.due?'<i aria-hidden="true"></i>':"")+'</button>';
}
function listenButton(n){
 return '<button class="p80listen" data-listen="'+n+'" type="button" aria-label="Nghe câu '+n+
  '" title="Nghe câu tiếng Anh"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15 9a5 5 0 0 1 0 6"/><path d="M18 6a9 9 0 0 1 0 12"/></svg></button>';
}
function normalize(text){
 return String(text||"").normalize("NFKC").toLowerCase().replace(/[‘’]/g,"'")
  .replace(/[.,!?;:。！？]+$/g,"").replace(/\s+/g," ").trim();
}
function row(item){
 const n=item.n,study=state.mode==="study",expandedNow=expanded.has(n);
 return '<article class="p80row'+(expandedNow?" is-expanded":"")+'" data-row="'+n+'">'+
  '<div class="p80number"><span class="p80number-label">CÂU '+String(n).padStart(2,"0")+'</span>'+mastery(n)+'</div>'+
  '<div class="p80pattern"><small>MẪU CÂU</small><strong>'+cssEscape(item.pattern)+'</strong>'+
  '<span>'+cssEscape(item.meaning||"")+'</span></div>'+
  '<div class="p80main">'+(study?
    '<div class="p80prompt"><small>NGHĨA TIẾNG VIỆT</small><b>'+cssEscape(item.vi)+'</b></div>'+
    '<div class="p80entry">'+listenButton(n)+
      '<input type="text" data-entry="'+n+'" class="p80input" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="next" aria-label="Nhập câu tiếng Anh mẫu '+n+'" placeholder="Nhập câu tiếng Anh…"/>'+
      '<span class="p80check" data-check="'+n+'" aria-live="polite">✓</span></div>'+
    '<div class="p80practice-actions"><button type="button" data-hint="'+n+'" aria-pressed="false">♧ Gợi ý</button>'+
      '<button type="button" data-answer="'+n+'" aria-pressed="false">◉ Đáp án</button></div>'
    :'<div class="p80readline">'+listenButton(n)+
     (state.showEn?'<strong lang="en">'+cssEscape(item.en)+'</strong>':
       '<strong class="p80masked">Tiếng Anh đang ẩn</strong>')+'</div>')+
  '</div>'+
  '<div class="p80meaning">'+(study?'<span class="p80study-guide">Tự viết câu tiếng Anh từ nghĩa tiếng Việt. Nhấn Enter để kiểm tra.</span>':
    state.showVi?'<small>NGHĨA CÂU</small><span>'+cssEscape(item.vi)+'</span>':
      '<span class="p80masked">Nghĩa tiếng Việt đang ẩn</span>')+'</div>'+
  '<div class="p80action"><button type="button" data-more="'+n+'" aria-expanded="'+expandedNow+'">'+
  (expandedNow?"Thu gọn ⌃":"Xem thêm ⌄")+'</button></div>'+
  '<div class="p80details" data-details="'+n+'" '+(expandedNow?"":"hidden")+'><b>CÁCH DÙNG MẪU CÂU</b><p>'+
  cssEscape(item.tip||"Cấu trúc thường dùng trong giao tiếp hằng ngày.")+'</p></div>'+
  '</article>';
}
function header(){
 const c=counts(),min=(state.page-1)*PAGE_SIZE+1,max=state.page*PAGE_SIZE;
 return '<header class="p80toolbar">'+
  '<div class="p80toolbar-top"><div class="p80brand"><span class="p80brand-icon">▣</span>'+
  '<div><b>80 MẪU CÂU TIẾNG ANH</b><small>SÁCH 80 · LƯỢT 1</small></div></div>'+
  '<div class="p80top-actions"><button type="button" data-settings>⚙ Tùy chọn</button>'+
  '<button type="button" data-exit>✕ Thoát</button></div></div>'+
  '<div class="p80toolbar-bottom"><label class="p80page-select">TRANG <select data-page-select aria-label="Chọn trang học">'+
    Array.from({length:PAGES},(_,i)=>{
      const p=i+1;
      return '<option value="'+p+'" '+(p===state.page?"selected":"")+'>TRANG '+p+' · '+(i*10+1)+'–'+(p*10)+'</option>';
    }).join('')+'</select></label>'+
  '<button class="p80due" type="button" data-review>◷ Ôn '+c.due+' câu</button>'+
  '<div class="p80mode-group" role="group" aria-label="Chọn chế độ học">'+
   '<button class="'+(state.mode==="read"?"is-active":"")+'" type="button" data-mode="read">Đọc câu</button>'+
   '<button class="'+(state.mode==="study"?"is-active":"")+'" type="button" data-mode="study">Học câu</button></div>'+
  '<button class="p80sequence" type="button" data-sequence>▶ Nghe 10 câu ↻</button>'+
  '<button class="p80sync" type="button" data-cloud-status>☁ Máy này</button></div>'+
  '<div class="p80settings" data-settings-panel hidden>'+
   '<button type="button" data-toggle-en>'+(state.showEn?"Ẩn tiếng Anh":"Hiện tiếng Anh")+'</button>'+
   '<button type="button" data-toggle-vi>'+(state.showVi?"Ẩn nghĩa Việt":"Hiện nghĩa Việt")+'</button>'+
   '<span>Học câu luôn hiện nghĩa tiếng Việt để luyện nhớ chủ động.</span></div>'+
  '<div class="p80toolbar-progress"><span>PAGE '+state.page+' · MẪU '+min+'–'+max+'</span>'+
   '<span>'+c.done+'/80 đã luyện · '+c.mastered+' vững · '+c.due+' cần ôn</span></div>'+
  '</header>';
}
function render(){
 if(!root)return;
 closePopup();
 const rows=pageItems();
 root.className="p80book p80-mode-"+state.mode;
 root.style.setProperty("--p80-row-count",String(rows.length));
 root.innerHTML=header()+
  '<main class="p80scroll" tabindex="-1"><div class="p80book-paper">'+
  '<div class="p80page-title"><div><span class="p80level">LƯỢT<br><b>1</b></span>'+
   '<span class="p80stepflag">TRANG '+state.page+'</span>'+
   '<strong>'+(rows[0].n)+'–'+rows.at(-1).n+'</strong></div>'+
   '<span class="p80page-subtitle">80 MẪU · MỖI MẪU MỘT CÂU</span></div>'+
  '<div class="p80tablehead" aria-hidden="true"><span>NO.</span><span>MẪU CÂU</span>'+
   '<span>'+(state.mode==="study"?"LUYỆN VIẾT TIẾNG ANH":"CÂU TIẾNG ANH")+'</span>'+
   '<span>NGHĨA / HƯỚNG DẪN</span><span>THÔNG TIN</span></div>'+
  '<div class="p80rows">'+rows.map(row).join('')+'</div>'+
  '<div class="p80book-end">Lượt 1 · nguồn: bộ 80 mẫu câu đang học · '+rows.length+' câu / trang</div>'+
  '</div></main>'+
  '<footer class="p80footer"><span class="p80footer-info">Enter kiểm tra · Esc đóng gợi ý</span>'+
  '<div class="p80paging"><button type="button" data-prev '+(state.page===1?"disabled":"")+'>← TRANG trước</button>'+
   '<b>'+state.page+' / '+PAGES+' TRANG</b>'+
   '<button type="button" data-next '+(state.page===PAGES?"disabled":"")+'>TRANG tiếp →</button></div></footer>';
 syncStatus();
 updateSequence();
 if(!root.hidden)warmAudio();
}
function updateStats(){
 if(!root||root.hidden)return;
 const c=counts();
 const prog=$(".p80toolbar-progress",root);
 if(prog)prog.lastElementChild.textContent=c.done+"/80 đã luyện · "+c.mastered+" vững · "+c.due+" cần ôn";
 const due=$("[data-review]",root);
 if(due)due.textContent="◷ Ôn "+c.due+" câu";
 pageItems().forEach(it=>{
  const button=$('[data-mastery="'+it.n+'"]',root);
  if(!button)return;
  const rec=record(it.n),updated=document.createElement("div");
  updated.innerHTML=mastery(it.n);
  button.replaceWith(updated.firstChild);
 });
}
function syncStatus(info){
 if(!root||root.hidden)return;
 const el=$("[data-cloud-status]",root);
 if(!el)return;
 info=info||global.Pattern80CloudSync?.status?.()||{};
 el.textContent=!info.signedIn?"☁ Máy này":info.syncing?"☁ Đang lưu":
  info.lastError?"☁ Lỗi đồng bộ":info.lastSyncAt?"☁ Đã đồng bộ":"☁ Chờ đồng bộ";
 el.title=info.lastError?"Lỗi: "+info.lastError:
  info.signedIn?"Đăng nhập "+(info.email||"")+" · tiến độ được đồng bộ giữa các thiết bị":
  "Đăng nhập tại Cài đặt để đồng bộ 80 mẫu câu trên điện thoại và máy tính";
}
function cloudChange(info){
 syncStatus(info);
 if(info?.revision!==cloudRevision){
  cloudRevision=info?.revision;updateStats();
 }
}
function closePopup(){
 if(!root)return;
 const panel=$(".p80popup",root);
 if(panel)panel.remove();
 root.querySelectorAll('[data-hint][aria-pressed="true"],[data-answer][aria-pressed="true"]')
  .forEach(b=>b.setAttribute("aria-pressed","false"));
}
function placePopup(button,box){
 const v=global.visualViewport;
 const left=Number(v?.offsetLeft)||0,top=Number(v?.offsetTop)||0;
 const width=Number(v?.width)||global.innerWidth||375;
 const height=Number(v?.height)||global.innerHeight||700;
 const rect=button.getBoundingClientRect(),widthPop=Math.min(535,width-24);
 const x=Math.max(left+12,Math.min(rect.left,left+width-widthPop-12));
 box.style.width=widthPop+"px";box.style.left=x+"px";
 box.style.maxHeight=Math.max(170,height-24)+"px";
 const h=Math.min(box.getBoundingClientRect().height,height-24);
 const topCandidate=rect.top-h-8;
 const y=topCandidate>=top+8?topCandidate:rect.bottom+8;
 box.style.top=Math.max(top+8,Math.min(y,top+height-h-8))+"px";
}
function showPopup(button,type,n){
 if(!root||root.hidden)return;
 const same=button.getAttribute("aria-pressed")==="true";
 closePopup();
 if(same)return;
 const entry=items[n-1],hint=hints.get(n);
 if(!entry||!hint)return;
 const panel=document.createElement("section");
 panel.className="p80popup p80popup-"+type;
 panel.setAttribute("role","region");
 panel.setAttribute("aria-label",type==="hint"?"Gợi ý cấu trúc mẫu "+n:
  type==="answer"?"Đáp án mẫu "+n:"Chi tiết mẫu "+n);
 if(type==="hint"){
  helped.add(n);
  panel.innerHTML='<div class="p80popup-head"><b>GỢI Ý CẤU TRÚC · CÂU '+n+'</b>'+
   '<button type="button" data-popup-close aria-label="Đóng">×</button></div>'+
   '<h2>'+cssEscape(entry.pattern)+'</h2><p>'+cssEscape(entry.tip||"Dùng cấu trúc này trong giao tiếp.")+'</p>'+
   '<div class="p80formula"><b>CÔNG THỨC</b><strong>'+cssEscape(entry.pattern)+'</strong>'+
    '<small>'+cssEscape(entry.meaning)+'</small></div>'+
   '<div class="p80analysis"><b>PHÂN TÍCH CÂU ĐANG HỌC</b><p>'+cssEscape(hint.context)+'</p></div>'+
   '<div class="p80pitfall"><b>LỖI DỄ MẮC</b><p>'+cssEscape(hint.pitfall)+'</p></div>'+
   '<small class="p80popup-note">Chỉ hướng dẫn cấu trúc · không hiện đáp án · tính là có hỗ trợ</small>';
 }else if(type==="answer"){
  helped.add(n);
  panel.innerHTML='<div class="p80popup-head"><b>ĐÁP ÁN CÂU '+n+'</b>'+
   '<button type="button" data-popup-close aria-label="Đóng">×</button></div>'+
   '<strong class="p80answer-text" lang="en">'+cssEscape(entry.en)+'</strong>'+
   '<small class="p80popup-note">Đã xem đáp án · không tính là đã thuộc</small>';
 }else if(type==="more"){
  panel.innerHTML='<div class="p80popup-head"><b>MẪU '+n+' · GIẢI THÍCH</b>'+
   '<button type="button" data-popup-close aria-label="Đóng">×</button></div>'+
   '<h2>'+cssEscape(entry.pattern)+'</h2>'+
   '<p>'+cssEscape(entry.tip||"Cấu trúc thường gặp trong đời sống.")+'</p>';
 }else if(type==="mastery"){
  const rec=record(n);
  panel.innerHTML='<div class="p80popup-head"><b>ĐỘ THÀNH THẠO · MẪU '+n+'</b>'+
   '<button type="button" data-popup-close aria-label="Đóng">×</button></div>'+
   '<h2>'+statusText(rec)+(rec.due?" · Đến hạn ôn":"")+'</h2>'+
   '<p>Đã luyện đúng '+rec.successes+' lần, sai '+rec.mistakes+
     ' lần. Chỉ những lượt tự nhớ đúng, không dùng gợi ý, mới nâng cấp độ ghi nhớ theo lịch ôn.</p>'+
   '<button type="button" class="p80mark-weak" data-mark-weak="'+n+'">Đánh dấu cần ôn lại</button>';
 }
 root.appendChild(panel);
 if(type==="hint"||type==="answer")button.setAttribute("aria-pressed","true");
 placePopup(button,panel);
}
function toggleMore(n,button){
 if(global.matchMedia?.("(min-width: 960px)")?.matches){
  showPopup(button,"more",n);return;
 }
 const opening=!expanded.has(n);
 if(opening)expanded.add(n);else expanded.delete(n);
 const card=button.closest(".p80row");
 card?.classList.toggle("is-expanded",opening);
 const details=$('[data-details="'+n+'"]',card);
 if(details)details.hidden=!opening;
 button.textContent=opening?"Thu gọn ⌃":"Xem thêm ⌄";
 button.setAttribute("aria-expanded",opening?"true":"false");
}
function feedback(n,result){
 const input=$('[data-entry="'+n+'"]',root),check=$('[data-check="'+n+'"]',root);
 if(!input)return;
 input.classList.toggle("is-correct",result==="correct");
 input.classList.toggle("is-wrong",result==="wrong");
 input.setAttribute("aria-invalid",result==="wrong"?"true":"false");
 if(check){
  check.className="p80check "+(result==="correct"?"is-correct":result==="wrong"?"is-wrong":"");
  check.textContent=result==="correct"?"✓":result==="wrong"?"×":"✓";
 }
}
function nextInput(n){
 let input=$('[data-entry="'+(n+1)+'"]',root);
 if(!input && state.page<PAGES){state.page++;persist();render();input=$('[data-entry="'+(n+1)+'"]',root);}
 if(input){input.focus({preventScroll:true});alignInput(input);}
}
function submit(input){
 const n=Number(input.dataset.entry),entry=items[n-1],typed=normalize(input.value);
 if(!entry)return;
 if(!typed){nextInput(n);return;}
 const correct=typed===normalize(entry.en);
 if(!correct){
  srs?.record(n,"sentence",false);
  feedback(n,"wrong");updateStats();return;
 }
 srs?.record(n,"sentence",true,{assisted:helped.has(n)});
 helped.delete(n);
 input.value="";
 feedback(n,"correct");closePopup();updateStats();
 input.focus({preventScroll:true});
 void speak(n);
}
function stopLoop(){
 playbackEpoch++;
 const activePlayer=player;player=null;playing=false;preparing=false;needsTap=false;
 if(activePlayer)try{activePlayer.stop();}catch(e){console.warn("80-patterns stop",e);}
 updateSequence();
}
function updateSequence(){
 if(!root||root.hidden)return;
 const b=$("[data-sequence]",root);
 if(!b)return;
 b.textContent=preparing?"⌛ Đang chuẩn bị...":needsTap?"▶ Chạm để phát":
  player&&playing?"■ Dừng nghe":player?"▶ Tiếp tục nghe":"▶ Nghe 10 câu ↻";
 b.setAttribute("aria-busy",preparing?"true":"false");
 b.setAttribute("aria-pressed",player&&playing?"true":"false");
}
function warmAudio(){
 const audio=global.Book2100BackgroundAudio,ready=audio?.ready?.(track());
 if(ready||!audio?.prepare)return;
 const t=track(),page=state.page;
 audio.prepare(t).catch(err=>{
  if(!root?.hidden&&state.page===page)notify("Chưa chuẩn bị được âm thanh trang này.");
  console.warn("Pattern book MP3 warm-up",err);
 });
}
function notify(text){
 const el=$(".p80message",root);
 if(el)el.textContent=text;
}
function createLoop(t,epoch){
 let session=null;
 try{
  session=global.Book2100BackgroundAudio?.create?.(t,{
   title:"Sách 80 mẫu câu · Trang "+state.page+" · Lượt 1",
   artist:"Language Studio · 80 mẫu câu",
   loop:true,rate:0.75,
   onState:function(status){
    if(epoch!==playbackEpoch||session!==player)return;
    if(status==="playing"){playing=true;needsTap=false;}
    if(status==="paused"){playing=false;}
    updateSequence();
   },
   onError:function(error){
    if(epoch!==playbackEpoch||session!==player)return;
    if(error?.name==="NotAllowedError"){
      needsTap=true;notify("iPhone yêu cầu chạm lại vào ▶ để phát.");updateSequence();return;
    }
    stopLoop();notify("Không phát được âm thanh. Kiểm tra mạng và thử lại.");
   },
   onEnded:function(){if(epoch===playbackEpoch&&session===player)session.restart();}
  });
 }catch(error){console.warn("Pattern book loop init",error);}
 if(!session)return false;
 player=session;preparing=false;needsTap=false;playing=false;
 updateSequence();session.play();return true;
}
async function playPage(){
 if(!root||root.hidden)return;
 if(player){
  if(playing){stopLoop();return;}
  needsTap=false;player.resume();return;
 }
 const t=track(),epoch=++playbackEpoch;
 const audio=global.Book2100BackgroundAudio;
 if(audio?.ready?.(t)&&createLoop(t,epoch))return;
 if(!audio?.prepare){notify("Dịch vụ nghe nền chưa sẵn sàng.");return;}
 preparing=true;updateSequence();notify("Đang chuẩn bị bản thu âm của trang…");
 try{
  await audio.prepare(t);
  if(epoch!==playbackEpoch||root.hidden||state.page!==t.id)return;
  preparing=false;
  if(!createLoop(t,epoch))notify("Chưa mở được âm thanh. Hãy thử lại.");
 }catch(error){
  if(epoch!==playbackEpoch||root.hidden)return;
  preparing=false;updateSequence();
  notify("Không tải được âm thanh. Kiểm tra kết nối rồi thử lại.");
  console.warn("Pattern book audio",error);
 }
}
async function speak(n){
 const e=items[n-1];if(!e||root?.hidden)return;
 stopLoop();
 if(state.mode==="study")helped.add(n);
 if(global.AITTS?.speak){
  try{await global.AITTS.speak(e.en,{language:"en-US",rate:0.88});return;}
  catch(error){console.warn("Pattern book individual TTS",error);}
 }
 if(global.speechSynthesis&&global.SpeechSynthesisUtterance){
  const u=new global.SpeechSynthesisUtterance(e.en);
  u.lang="en-US";u.rate=.85;
  global.speechSynthesis.cancel();global.speechSynthesis.speak(u);
 }else notify("Chưa thể phát âm câu này.");
}
function navigate(page){
 if(page<1||page>PAGES)return;
 stopLoop();closePopup();helped.clear();
 state.page=page;persist();render();
 const sc=$(".p80scroll",root);if(sc)sc.scrollTop=0;
}
function review(){
 const due=items.find(it=>record(it.n).due);
 if(!due){notify("Chưa có câu nào đến hạn ôn. Hãy tiếp tục học các mẫu mới.");return;}
 state.mode="study";navigate(Math.ceil(due.n/PAGE_SIZE));
 const field=$('[data-entry="'+due.n+'"]',root);
 if(field){field.focus({preventScroll:true});alignInput(field);}
}
function alignInput(input){
 if(!input||!input.isConnected||!root||root.hidden)return;
 const scroll=$(".p80scroll",root),card=input.closest(".p80row");
 if(!scroll||!card)return;
 const rect=card.getBoundingClientRect(),area=scroll.getBoundingClientRect();
 if(rect.top<area.top+6)scroll.scrollTop+=rect.top-area.top-8;
 else if(input.getBoundingClientRect().bottom>area.bottom-12)
  scroll.scrollTop+=input.getBoundingClientRect().bottom-area.bottom+20;
}
function viewportChange(){
 if(!root||root.hidden)return;
 const view=global.visualViewport;
 const keyboard=!!(view&&view.height<global.innerHeight-130);
 root.classList.toggle("p80keyboard-open",keyboard);
 if(keyboard){
  root.style.height=view.height+"px";
  root.style.top=(view.offsetTop||0)+"px";
  const focused=root.querySelector("input:focus");
  if(focused)alignInput(focused);
 }else{
  root.style.height="";root.style.top="";
 }
 const p=$(".p80popup",root);
 const b=root.querySelector('[data-hint][aria-pressed="true"],[data-answer][aria-pressed="true"]');
 if(p&&b)placePopup(b,p);
}
function onClick(event){
 const b=event.target.closest("button");
 if(!b||!root?.contains(b))return;
 if(b.hasAttribute("data-popup-close")){closePopup();return;}
 if(b.hasAttribute("data-exit")){close();return;}
 if(b.hasAttribute("data-settings")){
  const panel=$("[data-settings-panel]",root);
  if(panel)panel.hidden=!panel.hidden;
  return;
 }
 if(b.hasAttribute("data-toggle-en")){state.showEn=!state.showEn;persist();render();return;}
 if(b.hasAttribute("data-toggle-vi")){state.showVi=!state.showVi;persist();render();return;}
 if(b.hasAttribute("data-mode")){
  stopLoop();helped.clear();
  state.mode=b.dataset.mode;persist();render();return;
 }
 if(b.hasAttribute("data-prev")){navigate(state.page-1);return;}
 if(b.hasAttribute("data-next")){navigate(state.page+1);return;}
 if(b.hasAttribute("data-review")){review();return;}
 if(b.hasAttribute("data-cloud-status")){
  const st=global.Pattern80CloudSync?.status?.();
  if(st?.signedIn)global.Pattern80CloudSync.syncNow();
  else{close();global.location.hash="#settings";}return;
 }
 if(b.hasAttribute("data-sequence")){void playPage();return;}
 if(b.hasAttribute("data-listen")){void speak(Number(b.dataset.listen));return;}
 if(b.hasAttribute("data-hint")){showPopup(b,"hint",Number(b.dataset.hint));return;}
 if(b.hasAttribute("data-answer")){showPopup(b,"answer",Number(b.dataset.answer));return;}
 if(b.hasAttribute("data-more")){toggleMore(Number(b.dataset.more),b);return;}
 if(b.hasAttribute("data-mastery")){showPopup(b,"mastery",Number(b.dataset.mastery));return;}
 if(b.hasAttribute("data-mark-weak")){
  srs?.markDue(Number(b.dataset.markWeak),"sentence");closePopup();updateStats();return;
 }
}
function onKey(event){
 if(event.key==="Escape"){
  if($(".p80popup",root)){event.preventDefault();closePopup();return;}
  if(!root.hidden){event.preventDefault();close();return;}
 }
 if(event.key==="Enter"&&!event.isComposing&&event.keyCode!==229 &&
  event.target.matches(".p80input")){
  event.preventDefault();submit(event.target);
 }
}
function close(){
 if(!root||root.hidden)return;
 stopLoop();closePopup();helped.clear();root.hidden=true;
 root.classList.remove("p80keyboard-open");
 root.style.height="";root.style.top="";
 document.body.classList.remove("p80book-open");
 document.documentElement.classList.remove("p80book-open");
 if(trigger?.isConnected)trigger.focus({preventScroll:true});
}
function open(source){
 trigger=source||document.activeElement;
 if(!root){
  root=document.createElement("section");
  root.className="p80book";root.id="pattern80BookRoot";
  root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");
  root.setAttribute("aria-label","Sách học 80 mẫu câu tiếng Anh · lượt 1");
  root.hidden=true;document.body.appendChild(root);
  root.addEventListener("click",onClick);
  root.addEventListener("keydown",onKey);
  root.addEventListener("change",e=>{
   if(e.target.matches("[data-page-select]"))navigate(Number(e.target.value));
  });
  root.addEventListener("input",e=>{
   if(e.target.matches(".p80input")){
    e.target.classList.remove("is-wrong","is-correct");
    const feedback=$('[data-check="'+e.target.dataset.entry+'"]',root);
    if(feedback)feedback.className="p80check";
   }
  });
  root.addEventListener("focusin",e=>{
   if(e.target.matches(".p80input")){
    closePopup();
    requestAnimationFrame(()=>alignInput(e.target));
  }
  });
  global.visualViewport?.addEventListener("resize",viewportChange);
  global.visualViewport?.addEventListener("scroll",viewportChange);
  global.addEventListener("resize",viewportChange);
 }
 root.hidden=false;
 document.body.classList.add("p80book-open");
 document.documentElement.classList.add("p80book-open");
 render();viewportChange();
}
function inject(){
 const main=document.getElementById("mainView"),
  cards=main?.querySelector(".easy-play-activities");
 if(cards&&!cards.querySelector("#pattern80BookLaunch")){
  const card=document.createElement("button");
  card.id="pattern80BookLaunch";card.type="button";
  card.className="easy-play-activity pattern80-study-library-entry";
  card.innerHTML='<span class="easy-play-activity-icon" aria-hidden="true">📕</span>'+
   '<span class="easy-play-arrow" aria-hidden="true">↗</span>'+
   '<strong>Sách 80 mẫu câu · Lượt 1</strong>'+
   '<small>80 mẫu · đọc và luyện viết · gợi ý cấu trúc · ôn tập</small>';
  card.addEventListener("click",()=>open(card));
  const reference=cards.querySelector("#pattern80ListeningLaunch");
  if(reference)cards.insertBefore(card,reference);
  else cards.appendChild(card);
 }
 const nav=document.querySelector(".nav-list");
 if(nav&&!nav.querySelector("#pattern80BookSidebarLaunch")){
  const card=document.createElement("button");
  card.type="button";card.id="pattern80BookSidebarLaunch";card.className="nav-item";
  card.innerHTML='<span aria-hidden="true">📕</span><b>Sách 80 mẫu câu</b>';
  card.addEventListener("click",()=>open(card));nav.appendChild(card);
 }
}
function init(){
 inject();
 const main=document.getElementById("mainView");
 if(main&&"MutationObserver" in global){
  observer=new MutationObserver(inject);
  observer.observe(main,{childList:true,subtree:false});
 }
}
document.addEventListener("keydown",event=>{
 if(event.key==="Escape"&&root&&!root.hidden &&!event.target.closest("#pattern80BookRoot"))
  onKey(event);
});
global.addEventListener("hashchange",()=>{if(root&&!root.hidden)close();});
if(srs&&global.Pattern80CloudSync)global.Pattern80CloudSync.connect(srs,cloudChange);
global.Pattern80Book={open,close,getData:()=>DATA,getPage:()=>state.page,getMode:()=>state.mode,
 getProgress:()=>counts(),getSyncStatus:()=>global.Pattern80CloudSync?.status?.()||null};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})(window);
