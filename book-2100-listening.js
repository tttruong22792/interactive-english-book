/* Independent 2100 listening library. Shares original STEP sentences and the
   SAME native background player as the book / Reading Studio. No second
   vocabulary database, no JavaScript-per-sentence queue. */
(function(global){
"use strict";
const DATA=global.BOOK_2100_DATA;
if(!DATA||!Array.isArray(DATA.steps))return;
const KEY="ls-book2100-listening-v1";
let view=null,sourceTrigger=null,player=null,preparing=false,needsTap=false;
let active=false,epoch=0,selected=1,rate=.75,showVietnamese=true,notice="";
const steps=DATA.steps,find=id=>steps.find(s=>s.id===Number(id))||steps[0];
const esc=value=>String(value??"").replace(/[&<>"']/g,
 c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
try{
 const old=JSON.parse(localStorage.getItem(KEY)||"{}");
 if(steps.some(s=>s.id===Number(old.step)))selected=Number(old.step);
 if([.65,.75,.85,1].includes(Number(old.rate)))rate=Number(old.rate);
 if(typeof old.showVietnamese==="boolean")showVietnamese=old.showVietnamese;
}catch(_){}
function save(){try{localStorage.setItem(KEY,JSON.stringify({step:selected,rate,showVietnamese}));}catch(_){}}
function status(s){notice=s;const node=view?.querySelector("[data-status]");if(node)node.textContent=s;}
function buttons(){
 const play=view?.querySelector("[data-play]"),stop=view?.querySelector("[data-stop]");
 if(!play)return;
 play.textContent=preparing?"⌛ Đang chuẩn bị...":needsTap?"▶ Chạm để phát":
   player&&active?"Ⅱ Tạm dừng":player?"▶ Tiếp tục nghe":"▶ Nghe "+find(selected).entries.length+" câu ↻";
 play.disabled=!!preparing;
 play.setAttribute("aria-pressed",active?"true":"false");
 play.setAttribute("aria-busy",preparing?"true":"false");
 if(stop)stop.disabled=!player&&!preparing;
 const indicator=view?.querySelector("[data-listening]");
 if(indicator)indicator.textContent=preparing?"Đang tải bản thu":active?"Đang phát lặp liên tục":player?"Đã tạm dừng":"Chưa phát";
}
function stop(){
 ++epoch;
 const old=player;player=null;preparing=false;needsTap=false;active=false;
 try{old?.stop?.();}catch(e){console.warn("2100 listening stop",e);}
 buttons();
}
function applyStep(id){
 stop();selected=find(id).id;save();render();warm();
}
function warm(){
 const step=find(selected),here=step.id;
 if(global.Book2100BackgroundAudio?.ready?.(step))return;
 const api=global.Book2100BackgroundAudio?.prepare;
 if(typeof api==="function")api(step).catch(e=>{
   if(view&&!view.hidden&&selected===here)
     status("Chưa chuẩn bị được âm thanh. Kiểm tra mạng rồi bấm Nghe.");
   console.warn("STEP listening warmup",e);
 });
}
function startPlayer(step,seq){
 let next=null;
 try{
   next=global.Book2100BackgroundAudio?.create?.(step,{
     rate:rate,
     onState:function(state){
       if(seq!==epoch||next!==player)return;
       if(state==="playing"){active=true;needsTap=false;status("Đang phát. Tự lặp khi đến câu cuối; có thể khóa màn hình.");}
       else if(state==="paused"){active=false;status("Đã tạm dừng. Bấm Tiếp tục để nghe lại.");}
       buttons();
     },
     onError:function(error){
       if(seq!==epoch||next!==player)return;
       active=false;
       if(error?.name==="NotAllowedError"){
         needsTap=true;status("iPhone yêu cầu chạm thêm một lần vào ▶ để phát âm thanh.");
       }else{
         status("Không phát được âm thanh của STEP này. Vui lòng thử lại.");
         const failed=player;player=null;
         try{failed?.stop?.();}catch(_){}
         console.warn("2100 listening playback",error);
       }
       buttons();
     },
     onEnded:function(){
       if(seq===epoch&&next===player&&view&&!view.hidden)next.restart();
     }
   });
 }catch(error){console.warn("2100 listening initialization",error);}
 if(!next)return false;
 player=next;active=false;preparing=false;needsTap=false;
 status("Đang mở bản ghi âm của STEP "+step.id+"…");
 buttons();
 next.play();return true;
}
async function play(){
 if(!view||view.hidden)return;
 if(preparing)return;
 if(player){
   if(active){player.pause();return;}
   needsTap=false;player.resume();buttons();return;
 }
 const step=find(selected),seq=++epoch;
 if(global.Book2100BackgroundAudio?.ready?.(step)){
   if(startPlayer(step,seq))return;
 }
 const prepare=global.Book2100BackgroundAudio?.prepare;
 if(typeof prepare!=="function"){
   status("Không tìm thấy bộ phát âm thanh. Hãy tải lại ứng dụng.");return;
 }
 preparing=true;status("Đang chuẩn bị âm thanh lần đầu cho STEP "+step.id+"…");buttons();
 try{
   await prepare(step);
   if(seq!==epoch||view.hidden||selected!==step.id)return;
   preparing=false;
   if(!startPlayer(step,seq))status("Không thể mở trình phát. Hãy tải lại ứng dụng.");
 }catch(error){
   if(seq!==epoch||view.hidden)return;
   preparing=false;
   console.warn("2100 listening preparation",error);
   status("Chưa tải được âm thanh. Kiểm tra kết nối Internet rồi bấm Nghe lại.");
   buttons();
 }
}
function render(){
 if(!view)return;
 const step=find(selected);
 view.innerHTML='<header class="bklisten-top">'+
 '<div><span class="bklisten-kicker">THƯ VIỆN NGHE · LEVEL 1</span>'+
 '<h1>Nghe 2100 câu</h1><p>Nghe tiếng Anh theo STEP · lặp liên tục · phát trong nền</p></div>'+
 '<button type="button" class="bklisten-exit" data-exit aria-label="Thoát thư viện nghe">✕ Thoát</button></header>'+
 '<div class="bklisten-panel">'+
 '<label for="bklistenStep">Chọn STEP</label>'+
 '<select id="bklistenStep" data-step aria-label="Chọn STEP để nghe">'+
 steps.map(s=>'<option value="'+s.id+'" '+(s.id===step.id?"selected":"")+'>STEP '+String(s.id).padStart(2,"0")+' · Câu '+s.start+'–'+s.end+'</option>').join('')+'</select>'+
 '<div class="bklisten-meta"><span>'+step.entries.length+' câu</span><span data-listening>Chưa phát</span></div>'+
 '<div class="bklisten-actions"><button class="bklisten-mainplay" data-play type="button">▶ Nghe '+step.entries.length+' câu ↻</button>'+
 '<button class="bklisten-stop" data-stop type="button" disabled>■ Dừng</button></div>'+
 '<div class="bklisten-options"><label>Tốc độ <select data-rate aria-label="Chọn tốc độ đọc">'+
 [[.65,"Chậm 0,65×"],[.75,"Chậm vừa 0,75×"],[.85,"Vừa 0,85×"],[1,"Tự nhiên 1×"]].map(t=>
 '<option value="'+t[0]+'" '+(rate===t[0]?"selected":"")+'>'+t[1]+'</option>').join('')+
 '</select></label>'+
 '<button type="button" data-vi aria-pressed="'+showVietnamese+'">'+
 (showVietnamese?"Ẩn nghĩa Việt":"Hiện nghĩa Việt")+'</button></div>'+
 '<p class="bklisten-status" data-status role="status" aria-live="polite">'+esc(notice||"Bấm Nghe để phát trọn STEP; bản ghi sẽ tự lặp khi hết.")+'</p>'+
 '</div><section class="bklisten-sentences" aria-label="Các câu trong STEP">'+
 step.entries.map(e=>'<article class="bklisten-sentence">'+
 '<span class="bklisten-number">'+e.n+'</span><div><strong>'+esc(e.sentence)+'</strong>'+
 (showVietnamese?'<p>'+esc(e.sentenceVi)+'</p>':"")+'</div></article>').join('')+
 '</section><footer class="bklisten-foot">'+
 '<button type="button" data-prev '+(step.id===steps[0].id?"disabled":"")+'>← STEP trước</button>'+
 '<span>'+step.id+' / '+steps.length+' STEP</span>'+
 '<button type="button" data-next '+(step.id===steps[steps.length-1].id?"disabled":"")+'>STEP tiếp →</button>'+
 '</footer>';
 buttons();
}
function open(trigger){
 sourceTrigger=trigger||document.activeElement;
 if(!view){
   view=document.createElement("section");
   view.className="bklisten-root";view.id="book2100ListeningRoot";
   view.setAttribute("role","dialog");view.setAttribute("aria-modal","true");
   view.setAttribute("aria-label","Thư viện nghe Sách 2100");
   document.body.appendChild(view);
   view.addEventListener("click",function(event){
     const b=event.target.closest("button");
     if(!b)return;
     if(b.hasAttribute("data-exit")){close();return;}
     if(b.hasAttribute("data-play")){void play();return;}
     if(b.hasAttribute("data-stop")){stop();status("Đã dừng nghe.");return;}
     if(b.hasAttribute("data-prev")){applyStep(selected-1);return;}
     if(b.hasAttribute("data-next")){applyStep(selected+1);return;}
     if(b.hasAttribute("data-vi")){
       showVietnamese=!showVietnamese;save();render();return;
     }
   });
   view.addEventListener("change",function(event){
     const el=event.target;
     if(el.hasAttribute("data-step"))applyStep(Number(el.value));
     if(el.hasAttribute("data-rate")){
       rate=Number(el.value);save();player?.setRate?.(rate);
     }
   });
 }
 if(!view.hidden&&view.dataset.open==="true")return;
 view.hidden=false;view.dataset.open="true";document.body.classList.add("bklisten-open");
 notice="Bấm Nghe để phát trọn STEP; bản ghi sẽ tự lặp khi hết.";
 render();warm();
 view.querySelector("[data-play]")?.focus({preventScroll:true});
}
function close(){
 if(!view||view.hidden)return;
 stop();view.hidden=true;view.dataset.open="false";
 document.body.classList.remove("bklisten-open");
 if(sourceTrigger?.isConnected)sourceTrigger.focus({preventScroll:true});
}
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"&&view&&!view.hidden){e.preventDefault();close();}
});
window.addEventListener("hashchange",close);
global.Book2100Listening={open:open,close:close,ready:()=>!!global.Book2100BackgroundAudio?.create};
})(window);
