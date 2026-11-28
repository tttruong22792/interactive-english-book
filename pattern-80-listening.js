/* The original 80 patterns · first listening round (one example per pattern).
   Outside Book 2100. Same native/lock-screen audio engine, not a JS queue.
   The user can listen to all 80 in order or work through 20-pattern blocks. */
(function(global){
"use strict";
const DATA=global.PATTERN80_ROUND1;
if(!DATA||DATA.items?.length!==80)return;
const KEY="language-studio-pattern80-listening-round1";
const GROUPS=[{id:"all",name:"Toàn bộ 80 mẫu",from:1,to:80},
 ...[1,21,41,61].map(from=>({id:String(from),name:"Mẫu "+from+"–"+(from+19),from,to:from+19}))];
const $=(q,el)=>el?.querySelector(q);
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let view=null,trigger=null,player=null,active=false,preparing=false,needsTap=false,seq=0;
let groupId="all",rate=.75,showVi=true,showEn=true,notice="";
try{
 const old=JSON.parse(localStorage.getItem(KEY)||"{}");
 if(GROUPS.some(g=>g.id===String(old.group)))groupId=String(old.group);
 if([.65,.75,.85,1].includes(Number(old.rate)))rate=Number(old.rate);
 if(typeof old.showVi==="boolean")showVi=old.showVi;
 if(typeof old.showEn==="boolean")showEn=old.showEn;
}catch(_){}
function store(){
 try{localStorage.setItem(KEY,JSON.stringify({group:groupId,rate,showVi,showEn}));}catch(_){}
}
function selection(){
 const range=GROUPS.find(g=>g.id===groupId)||GROUPS[0];
 const items=DATA.items.filter(e=>e.n>=range.from&&e.n<=range.to);
 return {range,items,track:{
   id:range.id,
   entries:items.map(e=>({n:e.n,sentence:e.en}))
 }};
}
function announce(message){
 notice=message;
 const el=$( "[data-pattern80-status]",view);
 if(el)el.textContent=message;
}
function refresh(){
 if(!view||view.hidden)return;
 const button=$("[data-pattern80-play]",view),stopButton=$("[data-pattern80-stop]",view);
 const count=selection().items.length;
 if(button){
  button.textContent=preparing?"⌛ Đang chuẩn bị âm thanh…":needsTap?"▶ Chạm để phát":
    player&&active?"Ⅱ Tạm dừng":player?"▶ Tiếp tục nghe":
    "▶ Nghe "+count+" câu ↻";
  button.setAttribute("aria-busy",preparing?"true":"false");
  button.setAttribute("aria-pressed",active?"true":"false");
  button.disabled=preparing;
 }
 if(stopButton)stopButton.disabled=!player&&!preparing;
 const indicator=$("[data-pattern80-state]",view);
 if(indicator)indicator.textContent=preparing?"Đang chuẩn bị":active?"Đang phát · lặp liên tục":
   player?"Tạm dừng":"Chưa phát";
}
function stop(){
 seq++;
 const current=player;
 player=null;active=false;needsTap=false;preparing=false;
 try{current?.stop?.();}catch(error){console.warn("80-pattern audio stop",error);}
 refresh();
}
function prewarm(){
 const {track}=selection(),audio=global.Book2100BackgroundAudio;
 if(!audio?.prepare||audio.ready?.(track))return;
 const scope=groupId;
 audio.prepare(track).catch(error=>{
   if(view&&!view.hidden&&groupId===scope)
     announce("Chưa chuẩn bị được âm thanh. Hãy kiểm tra mạng rồi bấm Nghe.");
   console.warn("80-pattern audio prewarm",error);
 });
}
function start(track,epoch){
 const service=global.Book2100BackgroundAudio;
 let session=null;
 try{
  session=service?.create?.(track,{
   title:"80 mẫu câu · "+selection().range.name+" · Lượt 1",
   artist:"Language Studio · 80 mẫu câu tiếng Anh",
   rate:rate,
   onState:function(state){
    if(epoch!==seq||player!==session)return;
    if(state==="playing"){
      active=true;needsTap=false;
      announce("Đang nghe liên tục, hết lượt sẽ tự lặp lại. Có thể khóa màn hình.");
    }else if(state==="paused"){
      active=false;
      announce("Đã tạm dừng; bấm ▶ để nghe tiếp.");
    }
    refresh();
   },
   onError:function(error){
    if(epoch!==seq||player!==session)return;
    active=false;
    if(error?.name==="NotAllowedError"){
      needsTap=true;
      announce("iPhone cần bạn chạm thêm lần nữa vào nút ▶ để phát.");
    }else{
      const old=player;player=null;
      try{old?.stop?.();}catch(_){}
      announce("Không phát được bản âm thanh này. Hãy thử lại hoặc chọn nhóm 20 câu.");
      console.warn("80-pattern playback error",error);
    }
    refresh();
   },
   onEnded:function(){
    if(epoch===seq&&player===session&&!view.hidden)session.restart();
   }
  });
 }catch(error){console.warn("80-pattern audio initialization",error);}
 if(!session)return false;
 player=session;active=false;preparing=false;needsTap=false;
 announce("Đang mở bản thu âm…");
 refresh();
 session.play();
 return true;
}
async function play(){
 if(!view||view.hidden||preparing)return;
 if(player){
   if(active){player.pause();return;}
   needsTap=false;player.resume();return;
 }
 const {track}=selection(),epoch=++seq,audio=global.Book2100BackgroundAudio;
 if(audio?.ready?.(track)&&start(track,epoch))return;
 if(!audio?.prepare){
   announce("Bộ phát âm thanh chưa tải xong. Hãy mở lại ứng dụng.");return;
 }
 preparing=true;announce("Đang chuẩn bị bản thu cho "+selection().range.name+"…");refresh();
 try{
  await audio.prepare(track);
  if(epoch!==seq||view.hidden)return;
  preparing=false;
  if(!start(track,epoch))announce("Chưa mở được bản thu. Hãy tải lại trang.");
 }catch(error){
  if(epoch!==seq||view.hidden)return;
  preparing=false;
  announce("Không chuẩn bị được âm thanh. Hãy kiểm tra Internet và thử lại.");
  console.warn("80-pattern MP3 preparation",error);
  refresh();
 }
}
function render(){
 if(!view)return;
 const {items,range}=selection();
 view.innerHTML='<header class="bklisten-top">'+
 '<div><span class="bklisten-kicker">80 MẪU CÂU · LƯỢT 1</span>'+
 '<h1>Thư viện nghe 80 mẫu câu</h1>'+
 '<p>Mỗi mẫu một câu · nghe đủ lượt · lặp liên tục · phát trong nền</p></div>'+
 '<button type="button" data-pattern80-exit class="bklisten-exit">✕ Thoát</button></header>'+
 '<div class="bklisten-panel">'+
 '<label for="pattern80Select">Chọn danh sách nghe</label>'+
 '<select id="pattern80Select" data-pattern80-group aria-label="Chọn danh sách 80 mẫu">'+
 GROUPS.map(g=>'<option value="'+g.id+'" '+(g.id===groupId?"selected":"")+'>'
   +escape(g.name)+'</option>').join('')+'</select>'+
 '<div class="bklisten-meta"><span>'+items.length+' câu · '+(range.id==="all"?"đủ một lượt":"một nhóm")+'</span>'+
 '<span data-pattern80-state>Chưa phát</span></div>'+
 '<div class="bklisten-actions"><button type="button" class="bklisten-mainplay" data-pattern80-play>▶ Nghe '
 +items.length+' câu ↻</button><button type="button" class="bklisten-stop" data-pattern80-stop disabled>■ Dừng</button></div>'+
 '<div class="bklisten-options"><label>Tốc độ <select data-pattern80-rate aria-label="Chọn tốc độ đọc">'+
 [[.65,"Chậm 0,65×"],[.75,"Chậm vừa 0,75×"],[.85,"Vừa 0,85×"],[1,"Tự nhiên 1×"]].map(a=>
 '<option value="'+a[0]+'" '+(rate===a[0]?"selected":"")+'>'+a[1]+'</option>').join('')+
 '</select></label><div class="pattern80-visibility">'+
 '<button type="button" data-pattern80-en aria-pressed="'+showEn+'">'+(showEn?"Ẩn Anh":"Hiện Anh")+'</button>'+
 '<button type="button" data-pattern80-vi aria-pressed="'+showVi+'">'+(showVi?"Ẩn Việt":"Hiện Việt")+'</button>'+
 '</div></div><p class="bklisten-status" data-pattern80-status role="status" aria-live="polite">'+
 escape(notice||"Bấm Nghe để phát toàn bộ "+items.length+" câu. Hết sẽ tự lặp lại.")+'</p></div>'+
 '<section class="bklisten-sentences" aria-label="Danh sách 80 mẫu câu">'+items.map(e=>
 '<article class="bklisten-sentence pattern80-item"><span class="bklisten-number">'+e.n+'</span><div>'+
 '<div class="pattern80-label">'+escape(e.pattern)+'</div>'+
 (showEn?'<strong lang="en">'+escape(e.en)+'</strong>':'<strong class="pattern80-hidden">Tiếng Anh đang ẩn</strong>')+
 (showVi?'<p lang="vi">'+escape(e.vi)+'</p>':'')+
 '</div></article>').join('')+
 '</section><footer class="bklisten-foot pattern80-foot">'+
 '<button type="button" data-pattern80-previous '+(groupId==="all"||groupId==="1"?"disabled":"")+'>← Nhóm trước</button>'+
 '<span>'+items[0].n+'–'+items.at(-1).n+' / 80</span>'+
 '<button type="button" data-pattern80-next '+(groupId==="all"||groupId==="61"?"disabled":"")+'>Nhóm tiếp →</button></footer>';
 refresh();
}
function choose(id){
 if(!GROUPS.some(g=>g.id===String(id)))return;
 stop();groupId=String(id);store();render();prewarm();
}
function open(source){
 if(!view){
  view=document.createElement("section");
  view.id="pattern80ListeningRoot";
  view.className="bklisten-root pattern80-root";
  view.setAttribute("role","dialog");
  view.setAttribute("aria-modal","true");
  view.setAttribute("aria-label","Thư viện nghe 80 mẫu câu");
  view.hidden=true;
  document.body.appendChild(view);
  view.addEventListener("click",evt=>{
   const b=evt.target.closest("button");if(!b)return;
   if(b.hasAttribute("data-pattern80-exit")){close();return;}
   if(b.hasAttribute("data-pattern80-play")){void play();return;}
   if(b.hasAttribute("data-pattern80-stop")){stop();announce("Đã dừng nghe.");return;}
   if(b.hasAttribute("data-pattern80-en")){showEn=!showEn;store();render();return;}
   if(b.hasAttribute("data-pattern80-vi")){showVi=!showVi;store();render();return;}
   const idx=GROUPS.findIndex(g=>g.id===groupId);
   if(b.hasAttribute("data-pattern80-previous")&&idx>1){choose(GROUPS[idx-1].id);return;}
   if(b.hasAttribute("data-pattern80-next")&&idx>0&&idx<GROUPS.length-1)choose(GROUPS[idx+1].id);
  });
  view.addEventListener("change",evt=>{
   const el=evt.target;
   if(el.hasAttribute("data-pattern80-group")){choose(el.value);return;}
   if(el.hasAttribute("data-pattern80-rate")){
    rate=Number(el.value);store();player?.setRate?.(rate);
   }
  });
 }
 trigger=source||document.activeElement;
 view.hidden=false;document.body.classList.add("bklisten-open");
 notice="Bấm Nghe để phát cả lượt gồm "+selection().items.length+" câu; hết sẽ tự lặp.";
 render();prewarm();
 $("[data-pattern80-play]",view)?.focus({preventScroll:true});
}
function close(){
 if(!view||view.hidden)return;
 stop();view.hidden=true;document.body.classList.remove("bklisten-open");
 if(trigger?.isConnected)trigger.focus({preventScroll:true});
}
document.addEventListener("keydown",evt=>{
 if(evt.key==="Escape"&&view&&!view.hidden){evt.preventDefault();close();}
});
window.addEventListener("hashchange",close);
global.Pattern80Listening={open,close,getData:()=>DATA,selection};
})(window);