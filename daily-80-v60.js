/* Language Studio v60: one learning path, 80 structures every day.
   Source examples come from the existing 80 published English lessons.
   Viewing a card never implies mastery. Only independent tested recall counts.
   Legacy screens, localStorage and older plans stay intact. */
(function(){
'use strict';
const TOTAL_DAYS=60,PER_DAY=80,TEST_SIZE=16,PASS_MIN=14;
const GROUPS=[
 {title:'Mong muốn & kế hoạch',subtitle:'Muốn, định làm, hy vọng, ưu tiên',icon:'🌱'},
 {title:'Trách nhiệm & lời khuyên',subtitle:'Điều cần làm, bắt buộc, gợi ý',icon:'🧭'},
 {title:'Xin phép & nhờ giúp',subtitle:'Hỏi lịch sự, khả năng và yêu cầu',icon:'🤝'},
 {title:'Đặt câu hỏi',subtitle:'Hỏi thông tin và xác nhận',icon:'🔎'},
 {title:'Trải nghiệm & quan điểm',subtitle:'Thói quen, suy nghĩ và cảm nhận',icon:'💭'},
 {title:'Thời gian & trình tự',subtitle:'Bao lâu, khi nào, trước và sau',icon:'⏰'},
 {title:'Nguyên nhân & điều kiện',subtitle:'Nếu, vì sao, mục đích, tương phản',icon:'🔀'},
 {title:'Giao tiếp nâng cao',subtitle:'Cảm ơn, xin lỗi, phụ trách, suy đoán',icon:'💬'}
];
const THEMES=[
 ['Gia đình','family|kids|children|dinner|home|school|parents|wife|husband|breakfast|bed|house'],
 ['Công việc','work|meeting|report|manager|deadline|team|client|customer|email|project|office'],
 ['Mua sắm & tiền bạc','store|shopping|budget|money|price|payment|bill|buy|cost|discount|order'],
 ['Sức khỏe','doctor|hospital|health|sleep|medicine|appointment|exercise|rest|clinic'],
 ['Du lịch & di chuyển','train|station|airport|hotel|ticket|trip|travel|bus|drive|flight'],
 ['Học tập & thói quen','english|practice|learn|study|lesson|habit|routine|improve|remember'],
 ['Công nghệ','system|computer|network|file|software|setting|data|error|server|app'],
 ['Quan hệ & giao tiếp','friend|talk|conversation|message|question|explain|understand|help'],
 ['Kế hoạch & quyết định','plan|decision|schedule|choice|option|prepare|decide|future'],
 ['Giải quyết vấn đề','problem|issue|solution|fix|mistake|change|handle|wrong']
];
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').trim().replace(/[’‘]/g,"'").toLowerCase().replace(/\b(i am)\b/g,"i'm")
 .replace(/\b(i would)\b/g,"i'd").replace(/\b(i will)\b/g,"i'll")
 .replace(/\b(you are)\b/g,"you're").replace(/\b(you would)\b/g,"you'd")
 .replace(/\b(we are)\b/g,"we're").replace(/\b(we will)\b/g,"we'll")
 .replace(/\b(they are)\b/g,"they're").replace(/\b(it is)\b/g,"it's")
 .replace(/\b(that is)\b/g,"that's").replace(/\b(there is)\b/g,"there's")
 .replace(/\b(do not)\b/g,"don't").replace(/\b(does not)\b/g,"doesn't")
 .replace(/\b(did not)\b/g,"didn't").replace(/\b(cannot|can not)\b/g,"can't")
 .replace(/\b(will not)\b/g,"won't").replace(/\b(would not)\b/g,"wouldn't")
 .replace(/\b(is not)\b/g,"isn't").replace(/\b(are not)\b/g,"aren't")
 .replace(/\b(let us)\b/g,"let's").replace(/[^a-z0-9'\s]/g,' ').replace(/\s+/g,' ').trim();
const dayStamp=when=>{const d=when||new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const diffDays=(a,b)=>{if(!a||!b)return 0;const parse=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d,12).getTime();};return Math.round((parse(b)-parse(a))/86400000);};
function sourcePool(order){
 const id='en-pattern-'+String(order).padStart(3,'0');
 const lesson=window.CONTENT_REGISTRY?.[id];
 if(!lesson)return [];
 const preferred=lesson.sections?.find(s=>['practical-sentences','forty'].includes(s.id))?.blocks?.find(b=>b.type==='sentences')?.items;
 const sources=[preferred,lesson.introExamples,lesson.sentences20,lesson.sections?.flatMap(s=>s.blocks||[]).filter(b=>b.type==='sentences').flatMap(b=>b.items||[])];
 const seen=new Set(),all=[];
 for(const rows of sources)for(const row of rows||[]){
  const en=String(row?.[0]||'').trim(),vi=String(row?.[1]||'').trim();
  if(!en||!vi||en.length<9||vi.length<5||seen.has(norm(en)))continue;
  seen.add(norm(en));all.push({en,vi});
 }
 // Each daily example must actually model its numbered structure; earlier
 // published lessons include contrast questions that do not use that structure.
 const pack=(window.VocabularyTrainer?.packs?.()||[]).find(p=>p.order===order);
 const stem=norm(pack?.pattern||lesson.title||"");
 const grammatical=all.filter(row=>norm(row.en).startsWith(stem));
 return grammatical.length>=2?grammatical:all;
}
function complexity(row){
 const s=row.en,words=s.match(/[a-zA-Z']+/g)||[];
 return words.length+(s.match(/\b(because|although|unless|however|whether|instead|while|which|that|before|after|when|if)\b/gi)||[]).length*3
  +(s.match(/[,;]/g)||[]).length*2 + Math.min(3,Math.max(0,Math.max(...words.map(w=>w.length),0)-7)/2);
}
function selectedExample(order,day){
 const pool=sourcePool(order).slice().sort((a,b)=>complexity(a)-complexity(b)||a.en.localeCompare(b.en));
 if(!pool.length)return null;
 if(pool.length===1)return pool[0];
 const band=day<=20?0:day<=40?1:2;
 const start=Math.floor(pool.length*band/3),end=band===2?pool.length:Math.max(start+1,Math.floor(pool.length*(band+1)/3));
 const section=pool.slice(start,end);
 const theme=THEMES[(day-1)%THEMES.length][1].split('|');
 const withTheme=section.map((r,i)=>({r,i,matching:theme.some(k=>r.en.toLowerCase().includes(k))}));
 // Vary the question daily, but only within the day's difficulty tier.
 const offset=(day-1+order*7)%section.length;
 const chosen=withTheme.filter(row=>row.matching);
 if(chosen.length && day%3===0)return chosen[(day+order)%chosen.length].r;
 return section[offset];
}
function lessonItems(day){
 const packs=window.VocabularyTrainer?.packs?.()||[];
 const byId=new Map(packs.map(p=>[p.order,p]));
 const list=[];
 for(let id=1;id<=80;id++){
  const pair=selectedExample(id,day),pack=byId.get(id);
  if(!pair||!pack)return [];
  const exampleChunks=[...(pack.activeChunks||[]),...(pack.recognitionChunks||[])].filter(c=>pair.en.toLowerCase().includes(String(c[0]).toLowerCase()));
  list.push({id,group:Math.floor((id-1)/10),pattern:pack.pattern,meaning:pack.meaning,en:pair.en,vi:pair.vi,chunk:exampleChunks[0]||null});
 }
 return list;
}
function stateFor(state){
 if(!state.daily80v60||typeof state.daily80v60!=='object')state.daily80v60={version:60,start:dayStamp(),days:{},skills:{}};
 const root=state.daily80v60;
 root.days=root.days||{};root.skills=root.skills||{};
 return root;
}
function dayData(root,day){
 if(!root.days[day])root.days[day]={seen:[],attempts:[],completedAt:null};
 const d=root.days[day];d.seen=Array.isArray(d.seen)?d.seen:[];d.attempts=Array.isArray(d.attempts)?d.attempts:[];
 return d;
}
function currentDay(root){for(let i=1;i<=TOTAL_DAYS;i++){if(!root.days[i]?.completedAt)return i;}return TOTAL_DAYS;}
function skill(root,id){
 if(!root.skills[id])root.skills[id]={successes:{},errors:0,lastSuccess:'',lastFail:''};
 const s=root.skills[id];s.successes=s.successes||{};return s;
}
function mastery(skill){
 const dates=Object.keys(skill.successes||{}).sort();
 if(dates.length===0)return 'seen';
 if(dates.length<2)return 'recalled';
 const examples=new Set(dates.map(d=>skill.successes[d]));
 if(dates.length>=3&&examples.size>=2&&diffDays(dates[0],dates[dates.length-1])>=7)return 'solid';
 return 'remembered';
}
function chooseQuiz(items,root,day){
 const selection=[];
 const old=root.days[day]?.attempts||[];
 const last=old[old.length-1],recentFailed=new Set(last?.results?.filter(r=>!r.correct).map(r=>r.id)||[]);
 for(let g=0;g<8;g++){
  const first=((day-1)*2)%10;
  const group=items.slice(g*10,g*10+10);
  const planned=group[first];
  const weak=group.filter(x=>x.id!==planned.id).sort((a,b)=>{
   const sa=skill(root,a.id),sb=skill(root,b.id);
   const score=s=>Object.keys(s.successes||{}).length*3-s.errors*2;
   return Number(recentFailed.has(b.id))-Number(recentFailed.has(a.id))||score(sa)-score(sb)||
     Math.abs((a.id-1)%10-((first+1)%10))-Math.abs((b.id-1)%10-((first+1)%10));
  })[0];
  selection.push(planned,weak);
 }
 return selection;
}
function grade(expected,answer){return !!norm(answer)&&norm(expected)===norm(answer);}
function examResult(root,day,quiz,answers,when){
 const date=when||dayStamp(),results=quiz.map((x,i)=>({id:x.id,correct:grade(x.en,answers[i]),expected:x.en,answer:String(answers[i]||''),vi:x.vi}));
 const correct=results.filter(x=>x.correct).length;
 const summary={date,correct,total:quiz.length,passed:correct>=14,results};
 const target=dayData(root,day);
 target.attempts.push(summary);
 for(let i=0;i<quiz.length;i++){
  const s=skill(root,quiz[i].id);
  if(results[i].correct){s.successes[date]=norm(quiz[i].en);s.lastSuccess=date;}
  else{s.errors++;s.lastFail=date;}
 }
 if(summary.passed&&target.seen.length===80)target.completedAt=date;
 return summary;
}
function stats(root){
 const day=currentDay(root),done=Object.values(root.days).filter(d=>d.completedAt).length;
 let recalled=0,remembered=0,solid=0;
 for(let i=1;i<=80;i++){
  const x=mastery(root.skills[i]||{successes:{}});
  if(x==='solid')solid++;
  if(x==='remembered'||x==='solid')remembered++;
  if(x!=='seen')recalled++;
 }
 return {day,done,recalled,remembered,solid};
}
function dashboardHTML(root,day){
 const data=dayData(root,day),info=stats(root),seen=data.seen.length;
 const last=data.attempts[data.attempts.length-1],complete=!!data.completedAt;
 return '<div class="day80-dash">'+
 '<header class="day80-hero"><div class="day80-kicker">MỘT LỘ TRÌNH DUY NHẤT · 60 NGÀY</div><h1>Hôm nay: 80 mẫu câu</h1>'+
 '<p>Ngày '+day+' · Chủ đề gợi ý: '+THEMES[(day-1)%THEMES.length][0]+' · '+(day<=20?'Nền tảng dễ':day<=40?'Tình huống thực tế':'Diễn đạt nâng cao')+'</p>'+
 '<div class="day80-hero-stats"><div><strong>'+seen+'/80</strong><span>Câu đã luyện hôm nay</span></div><div><strong>'+(last?last.correct+'/16':'—')+'</strong><span>Kiểm tra gần nhất</span></div><div><strong>'+info.solid+'/80</strong><span>Mẫu vững thật sự</span></div></div>'+
 '<div class="day80-meter"><i style="width:'+(seen/80*100)+'%"></i></div>'+
 '<button class="day80-mainbtn" id="day80Resume">'+(complete?'✓ Đã hoàn thành hôm nay':seen>=80?'Bắt đầu kiểm tra 16 câu →':'▶ Tiếp tục học câu '+Math.min(80,seen+1)+' / 80')+'</button></header>'+
 '<section class="day80-groups"><div class="day80-section-head"><h2>8 chặng · mỗi chặng 10 câu</h2><small>Học tuần tự hoặc chọn chặng để ôn</small></div>'+
 '<div class="day80-group-grid">'+GROUPS.map((g,i)=>{
 const n=data.seen.filter(x=>x>i*10&&x<=(i+1)*10).length;
 return '<button type="button" data-day80-group="'+i+'" class="day80-group g'+i+'"><span class="day80-group-icon">'+g.icon+'</span><div><strong>'+(i+1)+'. '+g.title+'</strong><small>'+g.subtitle+'</small></div><b>'+n+'/10</b><span class="day80-group-line"><i style="width:'+(n*10)+'%"></i></span></button>';
 }).join('')+'</div></section>'+
 '<section class="day80-bottom"><div><h2>Hôm nay đã đạt đến đâu?</h2><p><b>Đã học:</b> câu bạn đã thực sự đi qua · <b>Nhớ lại:</b> kiểm tra Việt → Anh đúng · <b>Vững:</b> trả lời đúng ít nhất 3 ngày khác nhau, trải tối thiểu 7 ngày và 2 ví dụ.</p></div>'+
 '<div class="day80-bottom-metrics"><span>'+info.done+'/60 ngày đạt</span><span>'+info.recalled+'/80 mẫu đã nhớ lại</span><span>'+info.remembered+'/80 mẫu nhớ nhiều ngày</span></div>'+
 '<button id="day80Calendar" class="day80-quiet">Xem lộ trình 60 ngày ↗</button>'+
 '<button id="day80Legacy" class="day80-link">Kho công cụ cũ · bài đọc · cụm từ · thử thách</button></section>'+
 (last?'<p class="day80-past">Bài kiểm tra gần nhất: '+last.correct+'/16 · '+(last.passed?'Đạt ngưỡng điểm':'Chưa đạt')+'. Ngày chỉ hoàn thành khi đã luyện đủ 80 câu và đạt ít nhất 14/16.</p>':'')+
 '</div>';
}
function studyHTML(items,root,day,index){
 const x=items[index],d=dayData(root,day),been=d.seen.includes(x.id),g=GROUPS[x.group];
 return '<section class="day80-focus"><header class="day80-focus-top"><button id="day80Exit" class="day80-quiet">← Nhiệm vụ</button><div><b>Ngày '+day+' · Chặng '+(x.group+1)+'/8</b><small>'+g.icon+' '+g.title+'</small></div><span>'+(index+1)+'/80</span></header>'+
 '<div class="day80-focus-progress"><i style="width:'+((index+1)/80*100)+'%"></i></div>'+
 '<div class="day80-focus-body"><span class="day80-step-label">MẪU #'+String(x.id).padStart(2,'0')+' · '+(been?'✓ Đã tiếp xúc':'CHƯA HỌC HÔM NAY')+'</span>'+
 '<h2>'+escape(x.pattern)+'</h2><p class="day80-pattern-meaning">'+escape(x.meaning)+'</p>'+
 '<article class="day80-sentence"><span>CÂU VÍ DỤ HÔM NAY</span><h3>'+escape(x.en)+'</h3><p id="day80Translation">'+escape(x.vi)+'</p>'+
 '<div class="day80-speakrow"><button id="day80Speak">♫ Nghe câu</button><button id="day80Translate">Ẩn/hiện nghĩa</button><button id="day80Slow">Nghe chậm</button></div></article>'+
 (x.chunk?'<p class="day80-chunk">Cụm đáng chú ý: <strong>'+escape(x.chunk[0])+'</strong> · '+escape(x.chunk[1])+'</p>':'')+
 '<div class="day80-method"><b>Cách luyện:</b> ① Nghe câu · ② Nói theo 2 lần · ③ Che bản dịch và nói lại. Bấm tiếp chỉ ghi nhận <b>đã tiếp xúc</b>, không tự công nhận đã thuộc.</div></div>'+
 '<footer class="day80-focus-actions"><button id="day80Previous" '+(index===0?'disabled':'')+'>← Câu trước</button><button id="day80Next" class="day80-mainbtn">Đã luyện · '+(index===79?'Về bảng tổng kết':'Câu tiếp →')+'</button></footer></section>';
}
function quizHTML(quiz,answers,i){
 const x=quiz[i],g=GROUPS[x.group];
 return '<section class="day80-quiz"><header><button id="day80QuizExit" class="day80-quiet">← Nhiệm vụ</button><div><b>Kiểm tra phản xạ</b><small>Câu '+(i+1)+'/16 · '+g.title+'</small></div></header>'+
 '<div class="day80-focus-progress"><i style="width:'+((i+1)/16*100)+'%"></i></div>'+
 '<article class="day80-question"><span>VIỆT → ANH · KHÔNG GỢI Ý · KHÔNG NHÌN ĐÁP ÁN</span><h2>'+escape(x.vi)+'</h2>'+
 '<label for="day80Input">Viết cả câu bằng tiếng Anh</label><textarea id="day80Input" rows="3" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Tự viết câu, không xem mẫu...">'+escape(answers[i]||'')+'</textarea>'+
 '<p>Chấm theo câu mẫu trong kho (chấp nhận khác biệt viết hoa, dấu câu và dạng rút gọn phổ biến). Câu đúng cách diễn đạt khác cần tự luyện thêm, không tự cộng điểm.</p></article>'+
 '<button id="day80QuizNext" class="day80-mainbtn">'+(i===15?'Nộp 16 câu & nhận kết quả':'Lưu câu trả lời · tiếp →')+'</button></section>';
}
function resultHTML(root,day,result){
 const seen=dayData(root,day).seen.length,completed=Boolean(root.days[day]?.completedAt);
 return '<section class="day80-results"><div class="day80-result-hero '+(result.passed?'pass':'fail')+'"><span>'+(completed?'🏆':result.passed?'⭐':'🔁')+'</span>'+
 '<h2>'+(completed?'NGÀY '+day+' ĐÃ HOÀN THÀNH':result.passed?'ĐẠT BÀI THI · CÒN CÂU CHƯA HỌC':'CHƯA ĐẠT · CẦN ÔN LẠI')+'</h2><strong>'+result.correct+'/16</strong>'+
 '<p>Đã tiếp xúc '+seen+'/80 câu. Điều kiện hoàn thành: đã đi qua 80 câu và đúng ít nhất 14/16 câu. Chấm tự động không thể đánh giá mọi cách diễn đạt tương đương.</p></div>'+
 '<div class="day80-result-list">'+result.results.map((r,i)=>'<div class="'+(r.correct?'ok':'wrong')+'"><b>'+(i+1)+'. '+(r.correct?'✓':'✕')+' '+escape(r.vi)+'</b><span>Đáp án: '+escape(r.expected)+'</span>'+(r.correct?'':'<small>Bạn viết: '+escape(r.answer||'(trống)')+'</small>')+'</div>').join('')+'</div>'+
 '<div class="day80-result-buttons"><button id="day80Return" class="day80-mainbtn">Về nhiệm vụ hôm nay</button><button id="day80Retry">Ôn & kiểm tra lại</button></div></section>';
}
function calendarHTML(root){
 const complete=Object.values(root.days).filter(d=>d.completedAt).length;
 return '<section class="day80-calendar"><button id="day80CalendarBack" class="day80-quiet">← Hôm nay</button><h2>Lộ trình 60 ngày</h2>'+
 '<p>Mỗi ngày đi qua 80 cấu trúc, một ví dụ mỗi mẫu. Ví dụ được lấy từ kho dữ liệu hiện tại và tăng độ khó theo ba giai đoạn. Các lần kiểm tra là thước đo; đã xem không đồng nghĩa đã nhớ.</p>'+
 '<div class="day80-stages"><div><strong>Ngày 1–20</strong><span>Ví dụ cơ bản · câu ngắn · sinh hoạt</span></div><div><strong>Ngày 21–40</strong><span>Vận dụng · công việc · cuộc sống</span></div><div><strong>Ngày 41–60</strong><span>Câu dài hơn · ngữ cảnh khó · phản xạ</span></div></div>'+
 '<div class="day80-calendar-grid">'+Array.from({length:60},(_,i)=>{const n=i+1,d=root.days[n];return '<span class="'+(d?.completedAt?'done':n===currentDay(root)?'current':'')+'">Ngày '+n+(d?.completedAt?' ✓':'')+'</span>';}).join('')+'</div>'+
 '<strong>'+complete+'/60 ngày hoàn thành</strong><p>Không bắt buộc học bù bằng cách bỏ qua bài; bạn có thể tiếp tục đúng ngày chưa đạt.</p></section>';
}
let env,mode='home',index=0,quizIndex=0,quiz=[],answers=[],result=null,viewDay=0;
function render(nextEnv){
 if(nextEnv)env=nextEnv;if(!env?.main||!env?.state)return;
 const root=stateFor(env.state),day=currentDay(root),today=viewDay||day,items=lessonItems(today);
 env.setHeader?.('Học hôm nay','80 mẫu câu · 1 lộ trình');
 if(items.length!==80){env.main.innerHTML='<div class="day80-error">Thiếu dữ liệu 80 mẫu câu. Vui lòng tải lại phiên bản mới. Các bài học cũ chưa bị thay đổi.</div>';return;}
 const active=dayData(root,today);
 if(mode==='learn'&&index>=80){mode='home';index=79;}
 const html=mode==='learn'?studyHTML(items,root,today,index):mode==='quiz'?quizHTML(quiz,answers,quizIndex):
 mode==='result'&&result?resultHTML(root,today,result):mode==='calendar'?calendarHTML(root):dashboardHTML(root,today);
 env.main.innerHTML='<div class="day80-app">'+html+'</div>';
 bind(root,today,items,active);
}
function beginQuiz(root,day,items){
 viewDay=day;
 quiz=chooseQuiz(items,root,day);answers=Array(TEST_SIZE).fill('');quizIndex=0;mode='quiz';result=null;render();
}
function bind(root,day,items,active){
 $('#day80Resume')?.addEventListener('click',()=>{
  if(active.completedAt){mode='calendar';render();return;}
  if(active.seen.length===80){beginQuiz(root,day,items);return;}
  index=items.findIndex(x=>!active.seen.includes(x.id));index=Math.max(0,index);mode='learn';render();
 });
 $$('[data-day80-group]').forEach(button=>button.onclick=()=>{index=Number(button.dataset.day80Group)*10;mode='learn';render();});
 $('#day80Calendar')?.addEventListener('click',()=>{mode='calendar';render();});
 $('#day80CalendarBack')?.addEventListener('click',()=>{mode='home';render();});
 $('#day80Legacy')?.addEventListener('click',()=>{location.hash='#home';});
 $('#day80Exit')?.addEventListener('click',()=>{viewDay=0;mode='home';render();});
 $('#day80Previous')?.addEventListener('click',()=>{index=Math.max(0,index-1);render();});
 $('#day80Speak')?.addEventListener('click',()=>{env.speak?.(items[index].en);});
 $('#day80Slow')?.addEventListener('click',()=>{env.speak?.(items[index].en);});
 $('#day80Translate')?.addEventListener('click',()=>{$('#day80Translation')?.classList.toggle('is-hidden');});
 $('#day80Next')?.addEventListener('click',()=>{
  const id=items[index].id;
  if(!active.seen.includes(id)){active.seen.push(id);active.seen.sort((a,b)=>a-b);env.saveState();}
  if(index>=79){mode='home';}else{index++;}
  render();
 });
 $('#day80QuizExit')?.addEventListener('click',()=>{viewDay=0;mode='home';render();});
 const field=$('#day80Input');
 if(field){field.oninput=()=>{answers[quizIndex]=field.value;};field.focus();}
 $('#day80QuizNext')?.addEventListener('click',()=>{
  answers[quizIndex]=field?.value||'';
  if(quizIndex<TEST_SIZE-1){quizIndex++;render();return;}
  result=examResult(root,day,quiz,answers);
  env.saveState();mode='result';render();
 });
 $('#day80Return')?.addEventListener('click',()=>{viewDay=0;mode='home';render();});
 $('#day80Retry')?.addEventListener('click',()=>{beginQuiz(root,day,items);});
}
window.Daily80V60={render,lessonItems,sourcePool,selectedExample,courseDays:TOTAL_DAYS,grade,examResult,stateFor,dayData,currentDay,mastery,stats,chooseQuiz,GROUPS};
})();