/* Mission 60 — one focused daily workspace, with objectively graded tasks. */
(function(){
"use strict";
const Core=window.Mission60Core;
let env=null,view="dashboard",session=null,lastResult=null,showRoadmap=false;
const $=s=>env.main.querySelector(s);
const $$=s=>Array.from(env.main.querySelectorAll(s));
const esc=s=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const percent=(n,tot)=>tot?Math.round(n/tot*100):0;
const localeDate=iso=>{const d=new Date(iso+"T12:00:00");return d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'});};
const bar=(n,total)=>'<div class="m60-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+percent(n,total)+'"><span style="width:'+percent(n,total)+'%"></span></div>';
const goto=route=>{location.hash="#"+route;};
function save(){env.saveState();}
function wrapper(markup,title){
 env.setHeader('Lộ trình 60 ngày',title||'Hôm nay');
 env.main.innerHTML='<section class="m60-root">'+markup+'</section>';
}
function badge(done,word="Đạt"){
 return '<span class="m60-pill '+(done?'is-pass':'is-wait')+'">'+(done?'✓ '+word:'● Chưa đạt')+'</span>';
}
function metric(n,label){return '<div class="m60-metric"><strong>'+n+'</strong><span>'+esc(label)+'</span></div>';}
function task(type,number,icon,title,description,progress,total,action,done,note){
 return '<article class="m60-task '+(done?'done':'')+'"><div class="m60-task-symbol">'+esc(icon)+'</div>'+
  '<div class="m60-task-body"><div class="m60-task-heading"><span class="m60-task-number">'+number+'</span><h3>'+esc(title)+'</h3>'+badge(done)+'</div>'+
  '<p>'+esc(description)+'</p>'+bar(progress,total)+
  '<div class="m60-task-meta"><strong>'+progress+'/'+total+' đạt</strong><span>'+esc(note||'')+'</span></div></div>'+
  '<button class="m60-task-action" type="button" data-m60-start="'+type+'">'+esc(action)+' →</button></article>';
}
function dayCard(viewModel){
 const c=viewModel,day=c.shownDay,remaining=Math.max(0,60-day),
   quota=c.cfg.chunkCount,back=c.backlog.length;
 const currentDate=localeDate(c.today);
 const tasks=[
   task('review','01','🔁','Ôn cụm đến hạn','Tự nhớ lại, không mở đáp án trước.',
      Math.min(c.reviews.length,25)-c.reviewRemaining.length,c.reviews.length,
      c.reviews.length?'Ôn ngay':'Đã ôn xong',c.reviewCompleted,
      c.dueTotal>25?'Có '+(c.dueTotal-25)+' cụm đến hạn đang chờ':'Ôn ngắt quãng'),
   task('chunks','02','🧠','Kiểm tra cụm mới','Đọc nghĩa tiếng Việt rồi tự nhập cả cụm tiếng Anh.',
      c.chunkTodayDone,quota,c.chunkTodayDone===quota?'Đã xong':'Kiểm tra 10 cụm',
      c.chunkTodayDone===quota,back?'Còn '+back+' cụm của các ngày trước':'Theo phân bổ 60 ngày'),
   task('patterns','03','🧩',c.cfg.patternReview?'Kiểm tra lại mẫu câu':'Mẫu câu mới',
      'Tự viết chính xác 2 câu từ ý tiếng Việt cho mỗi mẫu.',
      c.patternTodayDone,c.todaysPacks.length,
      c.patternTodayDone===c.todaysPacks.length?'Đã kiểm tra':'Kiểm tra mẫu câu',
      c.patternTodayDone===c.todaysPacks.length,
      c.todaysPacks.map(x=>'#'+String(x.order).padStart(2,'0')+' '+x.pattern).join(' · ')),
   ...(c.readingToday?[task('reading','04','📖','Đọc hiểu & kiểm tra',
      'Đọc–nghe bài, sau đó trả lời câu hỏi độc lập, không nhìn đáp án.',
      c.mission.readingProof[c.readingToday.id]?.passed?1:0,1,
      c.mission.readingProof[c.readingToday.id]?.passed?'Đã đạt':'Làm kiểm tra',
      !!c.mission.readingProof[c.readingToday.id]?.passed,c.readingToday.title)]:[
     '<article class="m60-rest"><span>📖</span><div><strong>Hôm nay không có bài đọc mới</strong><small>Ngày chẵn sẽ có một bài. Bạn có thể mở thư viện để nghe lại bài cũ.</small></div><button data-m60-route="reading" type="button">Mở thư viện →</button></article>'
   ])
 ].join('');
 const track=Core.planDay(day),flag=day>60?'Đã hết hạn 60 ngày':c.dayPassed?'ĐÃ ĐẠT CHỈ TIÊU':'CHƯA ĐẠT';
 const grade=c.accuracy==null?'Chưa chấm':c.accuracy+'%';
 return '<header class="m60-hero">'+
  '<div class="m60-hero-main"><span class="m60-eyebrow">KẾ HOẠCH CÁ NHÂN · 60 NGÀY</span>'+
  '<h1>Hôm nay, chỉ tập trung <em>4 việc.</em></h1>'+
  '<p>Ngày <b>'+day+'/60</b> · '+currentDate+' · Mục tiêu: học đủ nội dung, kiểm tra nhớ lại và ôn theo lịch.</p>'+
  '<div class="m60-hero-pills">'+badge(c.dayPassed,'Ngày này đạt')+
  '<span class="m60-status">'+flag+'</span><span class="m60-status">Độ chính xác hôm nay: '+grade+'</span></div>'+
  '</div><div class="m60-day-circle"><strong>'+String(day).padStart(2,'0')+'</strong><span>/ 60 ngày</span></div>'+
 '</header>'+
 '<section class="m60-scoreboard">'+
 metric(c.certified+' / 4.000','Cụm kiểm tra đạt')+
 metric(c.mastered+' / 4.000','Cụm thuộc vững')+
 metric(c.patternSuccess+' / 80','Mẫu đã đạt lần đầu')+
 metric(c.readSuccess+' / 30','Bài đọc hiểu đạt')+
 '</section>'+
 '<section class="m60-today"><div class="m60-section-head"><div><span class="m60-eyebrow">VIỆC CẦN LÀM</span><h2>Nhiệm vụ ngày '+day+'</h2></div>'+
 '<button class="m60-outline" data-m60-roadmap type="button">'+(showRoadmap?'Thu gọn kế hoạch':'Xem cả 60 ngày')+' ⌄</button></div>'+
 '<p class="m60-today-intro">Thứ tự ưu tiên: <b>ôn cũ → kiểm tra cụm mới → mẫu câu → đọc hiểu</b>. Không tính việc chỉ xem bài là đã đạt.</p>'+
 (showRoadmap?roadmap(c):'')+
 '<div class="m60-task-list">'+tasks+'</div></section>'+
 '<section class="m60-truth"><div><span class="m60-truth-icon">⚖️</span><div><h3>Đánh giá không nới tay</h3>'+
 '<p><b>Đã học</b> = đã tiếp xúc. <b>Đạt</b> = nhập đúng trọn câu/cụm không gợi ý. <b>Thuộc vững</b> = nhớ đúng ≥3 ngày, cách nhau tổng cộng ≥7 ngày. Đọc hiểu cần trả lời đúng toàn bộ câu hỏi.</p></div></div>'+
 '<div class="m60-truth-data">'+badge(c.dayPassed,'Ngày đạt')+
 '<span>Chưa đạt thì nhiệm vụ sẽ tiếp tục xuất hiện.</span></div></section>'+
 '<footer class="m60-foot"><span>Khối lượng này rất nặng: ~67 cụm/ngày, cộng ôn cũ và bài đọc. Có thể cần từ 2–3 giờ mỗi ngày hoặc hơn. Kết quả kiểm tra của lộ trình hiện lưu trên thiết bị này; chưa phải điểm chấm kỹ năng nói/phát âm.</span>'+
 '<button type="button" data-m60-route="coach">Luyện AI 25 phút (bổ sung) →</button></footer>';
}
function roadmap(c){
 const rows=Array.from({length:60},(_,i)=>{
  const d=Core.planDay(i+1),assigned=c.cards.slice(d.chunkStart,d.chunkEnd),done=assigned.filter(x=>Core.proofStatus(c.mission.chunkProof[x.key],c.today).passed).length;
  const packs=d.patterns.map(n=>c.all.find(p=>p.order===n)).filter(Boolean);
  const patternDone=packs.filter(p=>d.patternReview?c.mission.patternProof[p.lessonId]?.reviewPassed:c.mission.patternProof[p.lessonId]?.passed).length;
  const st=d.reading?c.stories[d.reading-1]:null;
  const ok=done===assigned.length&&patternDone===packs.length&&(!st||c.mission.readingProof[st.id]?.passed);
  return '<div class="m60-road-day '+(i+1===c.shownDay?'now':'')+'" title="Ngày '+(i+1)+'">'+
   '<span>Ngày '+String(i+1).padStart(2,'0')+'</span><b>'+d.chunkCount+' cụm · '+d.patterns.length+' mẫu'+(st?' · Đọc':'')+'</b>'+
   '<em>'+(ok?'✓ Đạt':i+1<c.shownDay?'Cần bù':i+1===c.shownDay?'Hôm nay':'Sắp tới')+'</em></div>';
 }).join('');
 return '<div class="m60-roadmap"><div class="m60-road-header"><b>60 ngày · Phân bổ cố định</b><span>Ngày 1–40: 2 mẫu mới/ngày · Ngày 41–60: kiểm tra lại 4 mẫu/ngày</span></div>'+
 '<div class="m60-road-grid">'+rows+'</div><p>Ngày chẵn có 1 bài đọc mới. Chỉ tiêu không tự được cộng khi hết ngày.</p></div>';
}
function dashboard(){
 const d=Core.daily(env.state);
 wrapper(dayCard(d),'Hôm nay · Ngày '+d.shownDay+'/60');
 $$('[data-m60-start]').forEach(btn=>btn.onclick=()=>start(btn.dataset.m60Start));
 $$('[data-m60-route]').forEach(btn=>btn.onclick=()=>goto(btn.dataset.m60Route));
 $('[data-m60-roadmap]').onclick=()=>{showRoadmap=!showRoadmap;dashboard();};
}
function start(type){
 const d=Core.daily(env.state),state=d.mission;
 if(type==='chunks'){
  const items=d.pending.slice(0,10);
  if(!items.length){env.toast('Bạn đã kiểm tra xong các cụm được phân bổ đến hôm nay.');return;}
  session={type:'chunks',cards:items,index:0,results:[]};
 }else if(type==='review'){
  const items=d.reviews.filter(c=>Core.proofStatus(state.chunkProof[c.key],d.today).due).slice(0,10);
  if(!items.length){env.toast('Không có cụm đến hạn trong lượt này.');return;}
  session={type:'review',cards:items,index:0,results:[]};
 }else if(type==='patterns'){
  const items=d.pendingPatterns.slice(0,2).flatMap(({order,review})=>{
   const pack=d.all.find(p=>p.order===order);
   return Core.probes(pack,review).filter(probe=>{
    const pr=state.patternProof[pack.lessonId];
    const old=(review?pr?.reviewAttempts:pr?.attempts)?.[String(probe.index)];
    return !old?.correct;
   }).map(q=>({...q,pack}));
  });
  if(!items.length){env.toast('Các bài được phân bổ đến hôm nay đã kiểm tra đạt.');return;}
  session={type:'patterns',cards:items,index:0,results:[]};
 }else if(type==='reading'){
  const story=d.pendingReading[0]||d.readingToday;
  if(!story){env.toast('Hôm nay chưa có bài đọc mới.');return;}
  session={type:'reading',story,answers:{},result:null};
 }else return;
 view=type;lastResult=null;renderSession();
}
function answerText(card){
 if(session.type==='patterns')return {vi:card.vi,en:card.en,description:'Viết lại câu tiếng Anh hoàn chỉnh theo nội dung mục tiêu.'};
 return {vi:card.baseVi,en:card.baseEn,description:session.type==='review'?'Ôn không nhìn đáp án, không gợi ý.':'Nhập đúng cả cụm, không chỉ một vài từ khóa.'};
}
function renderSession(){
 if(!session){view='dashboard';return dashboard();}
 if(session.type==='reading')return readingQuiz();
 const i=session.index;
 if(i>=session.cards.length)return sessionFinished();
 const card=session.cards[i],data=answerText(card),feedback=lastResult,cap=session.cards.length;
 const section=session.type==='patterns'?'KIỂM TRA MẪU CÂU':session.type==='review'?'ÔN TẬP ĐẾN HẠN':'CỤM TỪ MỚI';
 wrapper('<header class="m60-session-head"><button class="m60-outline" id="m60Exit" type="button">← Nhiệm vụ hôm nay</button><span>'+section+' · '+(i+1)+'/'+cap+'</span></header>'+
 bar(i,cap)+
 '<article class="m60-test-card"><span class="m60-eyebrow">TỪ TIẾNG VIỆT → TIẾNG ANH</span>'+
 (session.type==='patterns'?'<small class="m60-test-tag">Mẫu '+card.pack.order+' · '+esc(card.pack.pattern)+(card.review?' · Kiểm tra lại':'')+'</small>':'')+
 '<h2>'+esc(data.vi)+'</h2><p>'+esc(data.description)+'</p>'+
 (!feedback?'<label for="m60Answer">Câu trả lời của bạn</label>'+
 '<textarea id="m60Answer" rows="3" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="Tự nhớ rồi nhập đầy đủ câu hoặc cụm từ…"></textarea>'+
 '<div class="m60-test-controls"><button id="m60Check" class="m60-primary" type="button">Kiểm tra nghiêm túc →</button>'+
 '<button id="m60Reveal" class="m60-outline" type="button">Xem đáp án (tính sai)</button></div>'+
 '<small class="m60-warning">Chỉ đúng toàn bộ mới đạt. Viết một phần, bấm xem đáp án hoặc để trống đều không được tính đúng.</small>':
 '<div class="m60-grade '+(feedback.correct?'ok':'fail')+'"><strong>'+(feedback.correct?'✓ Chính xác':'✕ Chưa đạt')+'</strong>'+
 '<span>Đáp án mục tiêu</span><h3>'+esc(data.en)+'</h3>'+
 (feedback.answer?'<p>Đã nhập: '+esc(feedback.answer)+'</p>':'<p>Bạn đã chọn xem đáp án.</p>')+
 '<small>'+(feedback.correct?'Được tính là một lần nhớ đúng.':'Không cộng điểm. Mục này sẽ trở lại trong lượt luyện sau.')+'</small>'+
 '</div><div class="m60-test-controls"><button id="m60Next" class="m60-primary" type="button">'+(i===cap-1?'Xem kết quả lượt này':'Mục tiếp theo')+' →</button>'+
 '<button id="m60Listen" class="m60-outline" type="button">♫ Nghe đáp án</button></div>')+
 '</article>',section);
 $('#m60Exit').onclick=()=>{session=null;view='dashboard';dashboard();};
 if(!feedback){
  const answer=$('#m60Answer');
  $('#m60Check').onclick=()=>submitTest(answer.value,false);
  $('#m60Reveal').onclick=()=>submitTest('',true);
  answer.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submitTest(answer.value,false);}});
 }else{
  $('#m60Next').onclick=()=>{session.index++;lastResult=null;renderSession();};
  $('#m60Listen').onclick=()=>env.speak(data.en);
 }
}
function submitTest(answer,reveal){
 if(!session||lastResult)return;
 const card=session.cards[session.index];
 if(!reveal&&!String(answer||'').trim()){env.toast('Hãy nhập câu trả lời, hoặc chọn xem đáp án và tính sai.');return;}
 const m=Core.ensure(env.state),day=Core.localDay();
 let correct=false;
 if(session.type==='patterns'){
  correct=Core.recordPattern(m,card.packId,card.index,card.en,answer,card.review,day,reveal);
 }else correct=Core.recordChunk(m,card.key,card.baseEn,answer,day,reveal);
 session.results.push(correct);lastResult={correct,answer,reveal};
 save();renderSession();
}
function sessionFinished(){
 const total=session.results.length,correct=session.results.filter(Boolean).length,type=session.type;
 wrapper('<section class="m60-finish"><span>🎯</span><h2>Đã kiểm tra '+total+' mục</h2>'+
 '<p><strong>'+correct+'/'+total+' đúng</strong> · '+(total-correct)+' mục chưa đạt. Kết quả đã ghi nhận riêng từng cụm/câu.</p>'+
 '<p>Không có nút “đã thuộc” thủ công. Các mục sai vẫn nằm trong phần chưa đạt, sẽ xuất hiện ở lượt tiếp theo.</p>'+
 '<button id="m60FinishBack" class="m60-primary" type="button">Về nhiệm vụ hôm nay →</button></section>','Kết quả kiểm tra');
 $('#m60FinishBack').onclick=()=>{session=null;view='dashboard';lastResult=null;dashboard();};
}
function readingQuiz(){
 const st=session.story;
 if(session.result){
  const r=session.result;
  wrapper('<header class="m60-session-head"><button id="m60ReadExit" type="button" class="m60-outline">← Hôm nay</button><span>ĐỌC HIỂU · '+esc(st.level)+'</span></header>'+
  '<section class="m60-reading-result"><span>'+(r.passed?'🎉':'📚')+'</span><h2>'+(r.passed?'Đọc hiểu đạt':'Chưa đạt phần đọc hiểu')+'</h2>'+
  '<p>Đúng <b>'+r.correct+'/'+r.total+'</b> câu. '+(r.passed?'Bài này đã được tính vào tiến độ đọc hiểu.':'Chưa được cộng thành tích. Hãy đọc lại và làm bài kiểm tra lần nữa.')+'</p>'+
  '<button type="button" id="m60ReadAgain" class="m60-primary">'+(r.passed?'Về nhiệm vụ hôm nay':'Làm lại bài kiểm tra')+'</button>'+
  (!r.passed?'<button id="m60ReadStory" class="m60-outline" type="button">Mở lại bài đọc →</button>':'')+
  '</section>','Kết quả đọc hiểu');
  $('#m60ReadExit').onclick=()=>{session=null;view='dashboard';dashboard();};
  $('#m60ReadAgain').onclick=()=>{if(r.passed){session=null;view='dashboard';dashboard();}else{session.answers={};session.result=null;readingQuiz();}};
  if(!r.passed)$('#m60ReadStory').onclick=()=>goto('reading/'+st.id);
  return;
 }
 const questions=st.questions||[];
 const rows=questions.map((q,i)=>'<fieldset class="m60-question"><legend>'+(i+1)+'. '+esc(q.prompt)+'</legend>'+
  q.choices.map((choice,j)=>'<label class="m60-choice"><input type="radio" name="m60q'+i+'" value="'+j+'" data-question="'+i+'" '+(session.answers[i]===j?'checked':'')+'/>'+
  '<span>'+esc(choice)+'</span></label>').join('')+'</fieldset>').join('');
 wrapper('<header class="m60-session-head"><button id="m60ReadExit" type="button" class="m60-outline">← Nhiệm vụ hôm nay</button><span>KIỂM TRA ĐỌC HIỂU</span></header>'+
 '<section class="m60-reading-exam"><span class="m60-eyebrow">BÀI ĐỌC '+esc(st.level)+'</span><h2>'+esc(st.title)+'</h2>'+
 '<p>Đọc/nghe trước, sau đó quay lại trả lời. Trong bài kiểm tra không hiển thị đáp án cho đến khi nộp hết.</p>'+
 '<div class="m60-reading-actions"><button id="m60OpenStory" class="m60-outline" type="button">📖 Đọc & Nghe bài này ↗</button></div>'+
 '<div class="m60-reading-questions">'+rows+'</div>'+
 '<button id="m60SubmitReading" class="m60-primary" type="button">Nộp bài kiểm tra '+questions.length+' câu</button>'+
 '<small>Phải đúng tất cả mới tính đạt. Đánh dấu “đã đọc” ở thư viện không thay thế bài kiểm tra này.</small>'+
 '</section>','Đọc hiểu · '+st.title);
 $('#m60ReadExit').onclick=()=>{session=null;view='dashboard';dashboard();};
 $('#m60OpenStory').onclick=()=>goto('reading/'+st.id);
 $$('[data-question]').forEach(el=>el.onchange=()=>{session.answers[el.dataset.question]=Number(el.value);});
 $('#m60SubmitReading').onclick=()=>{
  if(Object.keys(session.answers).length!==questions.length){env.toast('Hãy trả lời tất cả câu hỏi trước khi nộp.');return;}
  session.result=Core.recordReading(Core.ensure(env.state),st,session.answers);
  save();readingQuiz();
 };
}
function render(nextEnv){
 if(nextEnv)env=nextEnv;
 if(!env||!Core)return;
 const hadStart=!!env.state.mission60?.startDate;
 Core.ensure(env.state);
 if(!hadStart)save();
 if(view==="dashboard"||!session)dashboard();else renderSession();
}
function resetUI(){view="dashboard";session=null;lastResult=null;showRoadmap=false;}
window.Mission60UI={render,resetUI};
})();