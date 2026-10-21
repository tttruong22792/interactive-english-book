/* Language Studio v59 · 60-day measurable study plan.
   A "pass" is earned only through independent typed VN -> EN recall.
   Browsing, listening, seeing answers and manual checks never unlock a day. */
(function(){
"use strict";
const DAYS=60,NEW_PER_DAY=12,EXPOSURE_PER_DAY=67,PASS=11;
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const normalize=s=>String(s??"").toLowerCase().replace(/[’‘]/g,"'").replace(/\b(i am)\b/g,"i'm").replace(/[^a-z0-9'\s]/g," ").replace(/\s+/g," ").trim();
const dayKey=d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),n=String(d.getDate()).padStart(2,"0");return y+"-"+m+"-"+n;};
const dateFromKey=k=>{const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d,12);};
const dayDifference=(a,b)=>Math.round((dateFromKey(b)-dateFromKey(a))/86400000);
const sortCards=()=>{const tr=window.VocabularyTrainer;return (tr?.packs?.()||[]).flatMap(p=>[
 ...tr.studyChunks(p).filter(c=>c.kind!=="building"),
 ...tr.usageSupplementChunks(p)
 ]);};
function course(){
 const packs=window.VocabularyTrainer?.packs?.()||[];
 const cards=sortCards();
 return {packs,cards,stories:window.READING_STORIES||[]};
}
function store(state){
 if(!state.sixtyDayPlan||typeof state.sixtyDayPlan!=="object"){
  state.sixtyDayPlan={startedAt:dayKey(new Date()),passed:{},attempts:{},readings:{},covered:{},lastDay:1};
 }
 const p=state.sixtyDayPlan;
 p.passed=p.passed||{};p.attempts=p.attempts||{};p.readings=p.readings||{};p.covered=p.covered||{};
 return p;
}
const range=(start,count,max)=>Array.from({length:count},(_,i)=>start+i).filter(x=>x<max);
function plan(day,content){
 const index=day-1,patterns=content.packs.filter(p=>p.order===index*2+1||p.order===index*2+2).map(p=>p.order);
 const exposure=range(index*EXPOSURE_PER_DAY,EXPOSURE_PER_DAY,content.cards.length);
 // 12 chunks typed without hints. After day 40 no new patterns, consolidate.
 const focused=range(index*NEW_PER_DAY,NEW_PER_DAY,content.cards.length);
 const storyIndex=(day%2===0)?day/2-1:null;
 return {day,patterns,exposure:exposure.map(i=>content.cards[i]),focus:focused.map(i=>content.cards[i]),story:storyIndex!==null?content.stories[storyIndex]:null};
}
function unlocked(p){
 for(let i=1;i<=DAYS;i++)if(!p.passed[i])return i;
 return DAYS;
}
function reviewDue(content,state){
 const now=Date.now(),tr=window.VocabularyTrainer;
 return content.cards.filter(c=>{
  const x=tr?.progressFor?.(c,state.saved||{})||{};
  return x.reviewCount>0&&Number(x.nextReviewAt||0)<=now;
 });
}
function summarize(state){
 const p=store(state),d=unlocked(p),passed=Object.keys(p.passed).filter(k=>p.passed[k]).length,now=dayKey(new Date());
 const calendar=Math.max(1,Math.min(DAYS,dayDifference(p.startedAt,now)+1));
 return {day:d,passed,calendar,missed:Math.max(0,calendar-passed-1)};
}
function assess(expected,answer){
 const left=normalize(expected),right=normalize(answer);
 return Boolean(left&&right&&left===right);
}
function saveAttempt(p,day,answers,focus){
 if(p.passed[day])return {at:p.passed[day],correct:focus.length,total:focus.length,passed:true,results:[]};
 let correct=0;const results=focus.map((card,i)=>{
  const valid=assess(card.baseEn,answers[i]||"");
  if(valid)correct++;
  return {term:card.baseEn,meaning:card.baseVi,answer:answers[i]||"",correct:valid};
 });
 const passed=correct>=PASS;
 const record={at:new Date().toISOString(),correct,total:focus.length,passed,results};
 (p.attempts[day]||(p.attempts[day]=[])).push(record);
 if(passed){p.passed[day]=record.at;p.lastDay=Math.max(day+1,Number(p.lastDay)||1);}
 return record;
}
let env=null,currentDay=0,view="plan",result=null,answers=[],promptIndex=0,showMeaning=false;
function openRoute(route){location.hash="#"+route;}
function countMastered(content,state){
 const tr=window.VocabularyTrainer,sv=state.saved||{};
 return content.cards.filter(c=>{
  const s=tr?.progressFor?.(c,sv)||{};
  return Number(s.skills?.recall||0)>=2&&Number(s.skills?.use||0)>=2;
 }).length;
}
function header(text){
 return '<div class="plan60-eyebrow">LỘ TRÌNH 60 NGÀY · KIỂM TRA NGHIÊM TÚC</div>'+
 '<div class="plan60-head"><div><h1>'+esc(text)+'</h1><p>Không tự tick hoàn thành. Chỉ đạt khi trả lời đúng mà không xem đáp án.</p></div>'+
 '<button type="button" id="plan60Back" class="plan60-outline">Lộ trình</button></div>';
}
function task(label,detail,action,icon,done){
 return '<div class="plan60-task '+(done?'is-done':'')+'"><span class="plan60-task-icon">'+icon+'</span><div><strong>'+esc(label)+'</strong><small>'+esc(detail)+'</small></div>'+
 (action?'<button type="button" data-plan-route="'+esc(action)+'">Mở ↗</button>':(done?'<b>✓</b>':'<span class="plan60-wait">Đã lên lịch</span>'))+'</div>';
}
function renderPlan(content,p,day,info){
 const spec=plan(day,content),past=Boolean(p.passed[day]),cur=info.day,locked=day>cur;
 const completion=p.attempts[day]||[],last=completion[completion.length-1];
 const other=content.cards.length>0?Math.min(content.cards.length,day*EXPOSURE_PER_DAY):0;
 let instructions='Với 4.000 cụm/60 ngày cần tiếp xúc khoảng 67 cụm/ngày. Tuy nhiên thuộc chắc cả 4.000 trong 2 tháng là mục tiêu rất nặng. '+
 'Lộ trình này bắt buộc kiểm tra sâu 12 cụm/ngày, đồng thời cho tiếp xúc 67 cụm/ngày; không đánh đồng đã xem với đã thuộc.';
 return '<div class="plan60-progress"><div class="plan60-progress-copy"><strong>'+info.passed+' / 60 ngày đã đạt</strong><small>Ngày lịch '+info.calendar+' · '+info.missed+' ngày chậm hơn lịch</small></div><span class="plan60-progress-line"><i style="width:'+(info.passed/60*100)+'%"></i></span></div>'+
 '<div class="plan60-counter"><span>Ngày '+day+' / 60</span><span>'+(locked?'🔒 Chưa mở':past?'✓ Đã vượt qua':'● Đang học')+'</span></div>'+
 '<div class="plan60-day-nav"><button id="plan60Prev" '+(day<=1?'disabled':'')+'>← Ngày trước</button><select id="plan60Select" aria-label="Chọn ngày">'+Array.from({length:DAYS},(_,i)=>'<option value="'+(i+1)+'" '+(day===i+1?'selected':'')+'>'+(i+1===cur?'● ':'')+'Ngày '+(i+1)+(p.passed[i+1]?' ✓':'')+'</option>').join('')+'</select><button id="plan60Next" '+(day>=DAYS?'disabled':'')+'>Ngày sau →</button></div>'+
 (locked?'<div class="plan60-lock">Ngày '+day+' chưa mở. Phải vượt bài kiểm tra ngày '+cur+' trước. Không có nút bỏ qua.</div>':
 '<div class="plan60-daily"><div class="plan60-title"><span>🎯</span><div><h2>Nhiệm vụ ngày '+day+'</h2><p>Học theo đúng thứ tự: nạp đầu vào → nhớ lại → kiểm tra → ôn.</p></div></div>'+
 task('01 · Học mẫu câu',spec.patterns.length?spec.patterns.map(n=>'Mẫu '+n).join(' và '):'Ôn toàn bộ mẫu câu đã học',
 spec.patterns.length?'lesson/'+spec.patterns[0]:'patterns','🧩',false)+
 task('02 · Tiếp xúc cụm từ',spec.exposure.length+' cụm / ngày · theo thứ tự toàn kho','vocab','📚',Boolean(p.covered[day]))+
 task('03 · Nghe & đọc','Một bài đọc vào ngày chẵn; xen kẽ ôn câu đã học',spec.story?'reading/'+spec.story.id:'reading','🎧',Boolean(p.readings[day]))+
 task('04 · Ôn đến hạn','Cụm đến lịch: '+reviewDue(content,env.state).length+' · phải luyện tự nhớ','vocab','🔁',false)+
 task('05 · Kiểm tra không gợi ý','12 cụm Việt → Anh; cần đúng ít nhất 11/12. Sai thì luyện và thi lại.',null,'🏁',past)+
 '<div class="plan60-actions"><button id="plan60Start" class="plan60-primary" '+(past?'disabled':'')+'>'+(past?'Đã vượt qua bài ngày này':'Bắt đầu kiểm tra nghiêm túc →')+'</button>'+
 '<button id="plan60Exposure" class="plan60-outline">Xem cụm hôm nay ('+spec.exposure.length+')</button></div>'+
 (last?'<p class="plan60-last">Lần kiểm tra gần nhất: '+last.correct+'/12 · '+(last.passed?'Đạt':'Chưa đạt')+'. '+completion.length+' lần thử</p>':'')+
 '</div>')+
 '<div class="plan60-notice">'+esc(instructions)+'</div>'+
 '<section class="plan60-timeline"><h2>60 ngày, không học lan man</h2><p>Ngày 1–40: hai mẫu câu mới/ngày; ngày 41–60: tổng ôn, củng cố phản xạ và hoàn tất bài đọc. Học theo ngày được mở khóa bằng kiểm tra. Các mức độ “đã xem”, “đạt bài ngày” và “thuộc chắc” là ba chỉ số riêng biệt.</p>'+
 '<div class="plan60-metrics"><div><b>'+content.packs.length+'</b><span>mẫu câu</span></div><div><b>'+content.cards.length+'</b><span>cụm trong kho</span></div><div><b>'+countMastered(content,env.state)+'</b><span>cụm đã vững (recall + sử dụng)</span></div><div><b>'+content.stories.length+'</b><span>bài đọc</span></div></div></section>';
}
function renderExposure(spec,p){
 const rows=spec.exposure.map((c,i)=>'<div class="plan60-vocab"><b>'+(i+1)+'. '+esc(c.baseEn)+'</b><span>'+esc(c.baseVi)+'</span><button data-speak-60="'+i+'">♫</button></div>').join('');
 return '<section class="plan60-study"><h2>67 cụm của ngày '+currentDay+'</h2><p>Đây là danh sách tiếp xúc, KHÔNG phải chứng nhận đã thuộc. Hãy đọc, nghe và tự đặt câu. Bài kiểm tra phía sau không hiện tiếng Anh.</p><div class="plan60-vocab-list">'+rows+'</div>'+
 '<button id="plan60Covered" class="plan60-primary">'+(p.covered[currentDay]?'✓ Đã xem toàn bộ danh sách':'Tôi đã xem xong danh sách (không tính là thuộc)')+'</button></section>';
}
function renderQuiz(spec){
 const card=spec.focus[promptIndex];
 if(!card)return '<p>Chưa đủ dữ liệu kiểm tra. Vui lòng tải lại trang.</p>';
 const entered=answers[promptIndex]||'';
 return '<section class="plan60-test"><div class="plan60-test-head"><strong>Câu '+(promptIndex+1)+' / '+spec.focus.length+'</strong><small>Không gợi ý · Không đáp án · Không đánh dấu tự do</small></div>'+
 '<div class="plan60-test-progress"><i style="width:'+Math.round(promptIndex/spec.focus.length*100)+'%"></i></div>'+
 '<article class="plan60-question"><span>ĐỌC TIẾNG VIỆT · VIẾT CHÍNH XÁC CỤM TIẾNG ANH</span><h2>'+esc(card.baseVi)+'</h2><label for="plan60Answer">Câu trả lời tiếng Anh</label>'+
 '<input id="plan60Answer" autocomplete="off" autocapitalize="off" spellcheck="false" value="'+esc(entered)+'" placeholder="Gõ cụm từ bằng tiếng Anh" />'+
 '<small>Không hiện chữ đúng hoặc sai cho đến khi kết thúc bài. Dấu câu, chữ hoa không tính lỗi.</small></article>'+
 '<button id="plan60SubmitAnswer" class="plan60-primary">'+(promptIndex===spec.focus.length-1?'Nộp bài kiểm tra':'Lưu câu trả lời & tiếp →')+'</button></section>';
}
function renderResult(rec){
 return '<div class="plan60-result '+(rec.passed?'passed':'failed')+'"><span>'+(rec.passed?'🏆':'📝')+'</span><h2>'+(rec.passed?'ĐẠT · Ngày đã mở khóa':'CHƯA ĐẠT · Cần học lại')+'</h2><strong>'+rec.correct+' / '+rec.total+'</strong><p>'+(rec.passed?'Đúng ít nhất 11/12 không xem gợi ý. Đây là kết quả bài kiểm tra ngày, không phải chứng nhận đã thuộc lâu dài.':'Bạn cần đúng tối thiểu 11/12. Hãy xem các câu sai, ôn lại rồi kiểm tra từ đầu.')+'</p></div>'+
 '<div class="plan60-results">'+rec.results.map((x,i)=>'<div class="'+(x.correct?'correct':'incorrect')+'"><b>'+(i+1)+'. '+(x.correct?'✓':'✕')+' '+esc(x.meaning)+'</b><span>Đáp án: '+esc(x.term)+'</span>'+(x.correct?'':'<small>Bạn đã viết: '+esc(x.answer||'(trống)')+'</small>')+'</div>').join('')+'</div>'+
 '<button id="plan60Again" class="plan60-primary">'+(rec.passed?'Tiếp tục lộ trình →':'Học lại và kiểm tra lại →')+'</button>';
}
function bind(content,p,info,spec){
 $('#plan60Back')?.addEventListener('click',()=>{view='plan';result=null;render();});
 const select=$('#plan60Select');
 if(select)select.onchange=()=>{currentDay=Number(select.value)||info.day;view='plan';result=null;render();};
 $('#plan60Prev')?.addEventListener('click',()=>{currentDay=Math.max(1,currentDay-1);render();});
 $('#plan60Next')?.addEventListener('click',()=>{currentDay=Math.min(DAYS,currentDay+1);render();});
 $$('[data-plan-route]').forEach(b=>b.onclick=()=>openRoute(b.dataset.planRoute));
 $('#plan60Exposure')?.addEventListener('click',()=>{view='exposure';render();});
 $('#plan60Covered')?.addEventListener('click',()=>{p.covered[currentDay]=dayKey(new Date());env.saveState();render();});
 $$('[data-speak-60]').forEach(b=>b.onclick=()=>env.speak?.(spec.exposure[Number(b.dataset.speak60)]?.baseEn));
 $('#plan60Start')?.addEventListener('click',()=>{
  if(currentDay>info.day||p.passed[currentDay])return;
  answers=Array(spec.focus.length).fill('');promptIndex=0;view='quiz';render();
 });
 const input=$('#plan60Answer');
 if(input){input.oninput=()=>{answers[promptIndex]=input.value;};input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#plan60SubmitAnswer')?.click();}});}
 $('#plan60SubmitAnswer')?.addEventListener('click',()=>{
  answers[promptIndex]=input?.value||'';
  if(promptIndex<spec.focus.length-1){promptIndex++;render();return;}
  result=saveAttempt(p,currentDay,answers,spec.focus);env.saveState();view='result';render();
 });
 $('#plan60Again')?.addEventListener('click',()=>{
  if(result?.passed){currentDay=Math.min(DAYS,currentDay+1);view='plan';}
  else{view='exposure';}result=null;render();
 });
}
function render(nextEnv){
 if(nextEnv)env=nextEnv;
 if(!env?.main||!env?.state)return;
 const content=course(),p=store(env.state),info=summarize(env.state);
 if(!currentDay||currentDay>info.day&&view!=='plan')currentDay=info.day;
 if(!currentDay)currentDay=info.day;
 env.setHeader?.('English › Lộ trình','60 ngày học thật');
 const spec=plan(currentDay,content);
 env.main.innerHTML='<section class="plan60-root">'+header('Lộ trình học tiếng Anh 60 ngày')+
 (view==='exposure'?renderExposure(spec,p):view==='quiz'?renderQuiz(spec):view==='result'&&result?renderResult(result):renderPlan(content,p,currentDay,info))+'</section>';
 bind(content,p,info,spec);
}
window.StudyPlan60={render,plan,assess,saveAttempt,summarize,course,version:59};
})();