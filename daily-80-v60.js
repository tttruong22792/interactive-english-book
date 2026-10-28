/* Language Studio v61 (v60 curriculum core): one learning path, 80 structures every day.
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
  const tr=window.VocabularyTrainer;
  const chunks=[...tr.studyChunks(pack).filter(c=>c.kind!=="building"),...tr.usageSupplementChunks(pack)];
  const chunk=chunks[(day-1)%chunks.length];
  list.push({id,group:Math.floor((id-1)/10),pattern:pack.pattern,meaning:pack.meaning,en:pair.en,vi:pair.vi,chunk:chunk?[chunk.baseEn,chunk.baseVi]:null,chunkKey:chunk?.key||null});
 }
 return list;
}
function stateFor(state){
 if(!state.daily80v60||typeof state.daily80v60!=='object')state.daily80v60={version:60,start:dayStamp(),days:{},skills:{},chunkSeen:{}};
 const root=state.daily80v60;
 root.days=root.days||{};root.skills=root.skills||{};root.chunkSeen=root.chunkSeen||{};
 return root;
}
function dayData(root,day){
 if(!root.days[day])root.days[day]={seen:[],attempts:[],completedAt:null,checkpoints:{}};
 const d=root.days[day];d.seen=Array.isArray(d.seen)?d.seen:[];d.attempts=Array.isArray(d.attempts)?d.attempts:[];
 return d;
}

function checkpoint(day,stage){
 if(!day.checkpoints||typeof day.checkpoints!=='object')day.checkpoints={};
 if(!day.checkpoints[stage]||typeof day.checkpoints[stage]!=='object')day.checkpoints[stage]={sentence:{},chunk:{},tries:{}};
 const c=day.checkpoints[stage];
 c.sentence=c.sentence||{};c.chunk=c.chunk||{};c.tries=c.tries||{};
 return c;
}
function stageItems(items,stage){return items.slice(stage*10,stage*10+10);}
function stageProgress(day,stage,kind,items){
 const saved=checkpoint(day,stage)[kind]||{};
 return stageItems(items,stage).filter(item=>{
  const english=kind==='sentence'?item.en:item.chunk?.[0];
  return english&&saved[item.id]?.en===norm(english);
 }).length;
}
function stageComplete(day,stage,items){
 return stageProgress(day,stage,'sentence',items)===10&&stageProgress(day,stage,'chunk',items)===10;
}
function firstBlockedStage(day,items){
 for(let stage=0;stage<8;stage++){
  if(stageItems(items,stage).some(item=>!day.seen.includes(item.id))||!stageComplete(day,stage,items))return stage;
 }
 return 8;
}
function pendingIndex(day,stage,kind,items,start=0){
 const cards=stageItems(items,stage),saved=checkpoint(day,stage)[kind]||{};
 for(let offset=0;offset<cards.length;offset++){
  const at=(start+offset)%cards.length,card=cards[at];
  if(saved[card.id]?.en!==norm(kind==='sentence'?card.en:card.chunk?.[0]))return at;
 }
 return -1;
}
function recordCheckpoint(root,day,stage,kind,item,answer,method='write',when){
 if(stage<0||stage>7||!['sentence','chunk'].includes(kind)||item.group!==stage)throw Error('Invalid checkpoint card');
 const expected=kind==='sentence'?item.en:item.chunk?.[0];
 if(!expected)throw Error('Missing checkpoint content');
 const stored=checkpoint(dayData(root,day),stage);
 const success=grade(expected,answer),date=when||dayStamp();
 stored.tries[kind+':'+item.id]=(stored.tries[kind+':'+item.id]||0)+1;
 if(success)stored[kind][item.id]={en:norm(expected),date,method};
 else delete stored[kind][item.id];
 // A successfully recalled complete sentence is genuine retrieval practice,
 // whereas merely seeing a card or revealing an answer is not.
 if(kind==='sentence'){
  const s=skill(root,item.id);
  if(success){s.successes[date]=norm(expected);s.lastSuccess=date;}
  else{delete s.successes[date];s.errors++;s.lastFail=date;}
 }
 return {correct:success,expected,answer:String(answer||''),method};
}
function gateStudyHTML(stage,items,kind,position){
 const card=stageItems(items,stage)[position],sentence=kind==='sentence';
 const en=sentence?card.en:card.chunk?.[0],vi=sentence?card.vi:card.chunk?.[1];
 return '<section class="day80-gate day80-gate-study"><header class="day80-gate-head"><button id="day80GateStudyBack" type="button" class="day80-quiet">← Quay lại luyện nhớ</button>'+
 '<div><strong>Học lại chặng '+(stage+1)+'/8</strong><small>'+(sentence?'Câu hoàn chỉnh':'Cụm bổ sung')+' · '+(position+1)+'/10</small></div></header>'+
 '<div class="day80-gate-study-progress"><i style="width:'+((position+1)*10)+'%"></i></div>'+
 '<article class="day80-gate-study-card"><span>'+(sentence?'ÔN LẠI CÂU TIẾNG ANH':'ÔN LẠI CỤM TỪ TIẾNG ANH')+'</span>'+
 (sentence?'<small>Mẫu '+card.id+' · '+escape(card.pattern)+'</small>':'')+
 '<h2>'+escape(en||'')+'</h2><p>'+escape(vi||'')+'</p>'+
 '<div class="day80-gate-study-audio"><button id="day80GateStudySpeak" type="button">♫ Nghe</button><button id="day80GateStudySlow" type="button">♫ Nghe chậm</button></div>'+
 '<p class="day80-gate-study-hint">Đọc thành tiếng hai lần, che tiếng Anh và tự nói lại. Xem lại chưa được tính là đã thuộc.</p></article>'+
 '<footer class="day80-gate-study-actions"><button id="day80GateStudyPrevious" type="button" '+(position===0?'disabled':'')+'>← Câu trước</button>'+
 '<button id="day80GateStudyNext" type="button" '+(position===9?'disabled':'')+'>Câu tiếp →</button></footer>'+
 '<button id="day80GateStudyDone" type="button" class="day80-mainbtn">Đã ôn · Quay lại tự nhớ →</button></section>';
}

function checkpointHTML(day,stage,items,kind='overview',position=0,feedback=null,inputMode='write'){
 const part=stageItems(items,stage),g=GROUPS[stage];
 const sc=stageProgress(day,stage,'sentence',items),cc=stageProgress(day,stage,'chunk',items);
 const completed=sc===10&&cc===10;
 const heading='<header class="day80-gate-head"><button type="button" id="day80GateBack" class="day80-quiet">← Hôm nay</button><div><strong>Chặng '+(stage+1)+'/8</strong><small>'+g.icon+' '+g.title+'</small></div></header>';
 if(kind==='overview'){
  return '<section class="day80-gate">'+heading+
   '<div class="day80-gate-intro"><span>NHỚ CHỦ ĐỘNG · VIỆT → ANH</span><h2>Đã xem chưa phải là đã thuộc</h2><p>Hai phần luyện độc lập. Hãy tự viết hoặc nói tiếng Anh; phần nào chưa đúng sẽ quay lại để luyện tiếp.</p></div>'+
   '<div class="day80-gate-choices"><article><span class="day80-gate-type">01 · CÂU HOÀN CHỈNH</span><h3>Nhớ lại 10 câu</h3><p>Diễn đạt trọn vẹn từ tiếng Việt</p><strong>'+sc+'/10 đúng</strong><button type="button" data-day80-gate-review="sentence" class="day80-gate-review-link">↶ Học lại 10 câu</button><button type="button" data-day80-gate-kind="sentence">'+(sc===10?'✓ Đã đạt':'Luyện câu →')+'</button></article>'+
   '<article><span class="day80-gate-type">02 · CỤM TỪ</span><h3>Nhớ lại 10 cụm</h3><p>Nhớ riêng cụm bổ sung hôm nay</p><strong>'+cc+'/10 đúng</strong><button type="button" data-day80-gate-review="chunk" class="day80-gate-review-link">↶ Học lại 10 cụm</button><button type="button" data-day80-gate-kind="chunk">'+(cc===10?'✓ Đã đạt':'Luyện cụm →')+'</button></article></div>'+
   '<p class="day80-gate-note">Chỉ câu/cụm trả lời đúng mà không xem đáp án mới được tính. Nhận dạng giọng nói có thể sai; hãy kiểm tra chữ máy nghe được.</p>'+
   '<button type="button" id="day80GateContinue" class="day80-mainbtn" '+(completed?'':'disabled')+'>'+(stage===7?'Hoàn thành 8 chặng · Về bài kiểm tra':'Tiếp tục chặng '+(stage+2)+' →')+'</button></section>';
 }
 const card=part[position],isSentence=kind==='sentence';
 const expected=isSentence?card.en:card.chunk[0],vietnamese=isSentence?card.vi:card.chunk[1];
 const passed=stageProgress(day,stage,kind,items);
 const srAvailable=!!(window.SpeechRecognition||window.webkitSpeechRecognition);
 return '<section class="day80-gate day80-gate-practice">'+heading+
  '<div class="day80-gate-strip"><span>'+(isSentence?'PHẦN 1 · CÂU HOÀN CHỈNH':'PHẦN 2 · CỤM BỔ SUNG')+'</span><b>'+passed+'/10 đã nhớ</b></div>'+
  '<div class="day80-gate-progress"><i style="width:'+(passed*10)+'%"></i></div>'+
  '<article class="day80-gate-question"><span>NHÌN TIẾNG VIỆT · TỰ NHỚ TIẾNG ANH</span><h2>'+escape(vietnamese)+'</h2>'+
  '<div class="day80-gate-switch"><button type="button" data-day80-gate-input="write" class="'+(inputMode==='write'?'selected':'')+'">✎ Viết</button>'+
  '<button type="button" data-day80-gate-input="speak" '+(srAvailable?'':'disabled')+' class="'+(inputMode==='speak'?'selected':'')+'">♫ Nói</button></div>'+
  (feedback?'<div class="day80-gate-feedback '+(feedback.correct?'correct':'incorrect')+'" role="status"><b>'+(feedback.correct?'✓ Chính xác':'Chưa đúng · cần nhớ lại')+'</b>'+
  '<p>Đáp án: <strong>'+escape(feedback.expected)+'</strong></p>'+
  (!feedback.correct?'<small>Bạn trả lời: '+escape(feedback.answer||'(trống)')+'</small>':'')+'</div>'+
  '<button type="button" id="day80GateNext" class="day80-mainbtn">'+(feedback.correct?'Đã nhớ · Tiếp →':'Đã xem đáp án · Luyện lại sau →')+'</button>':
  inputMode==='write'?'<label for="day80GateInput">Viết '+(isSentence?'cả câu':'cụm từ')+' bằng tiếng Anh</label>'+
  '<textarea id="day80GateInput" rows="'+(isSentence?3:2)+'" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Tự nhớ rồi nhập câu trả lời..."></textarea>'+
  '<button type="button" id="day80GateCheck" class="day80-mainbtn">Kiểm tra câu trả lời</button>':
  '<button type="button" id="day80GateMic" class="day80-mainbtn">● Bấm để nói tiếng Anh</button><p id="day80GateSpeechStatus" class="day80-gate-speech-status" role="status">Nói rõ '+(isSentence?'cả câu':'cụm từ')+'. Hệ thống tự kiểm tra khi nhận được giọng nói.</p>')+
  '</article><footer class="day80-gate-footer"><button id="day80GateOverview" class="day80-quiet">← Hai phần luyện</button><button id="day80GateStudyOpen" type="button" class="day80-gate-forgot">↶ Quên rồi · Xem lại '+(isSentence?'câu':'cụm')+'</button><span>Mục '+(position+1)+'/10 · '+(isSentence?'Câu':'Cụm')+'</span></footer></section>';
}

function currentDay(root){for(let i=1;i<=TOTAL_DAYS;i++){if(!root.days[i]?.completedAt)return i;}return TOTAL_DAYS;}
function skill(root,id){
 if(!root.skills[id])root.skills[id]={successes:{},errors:0,lastSuccess:'',lastFail:''};
 const s=root.skills[id];s.successes=s.successes||{};return s;
}
function mastery(skill){
 // An incorrect answer invalidates the verified recall streak.
 const dates=Object.keys(skill.successes||{}).filter(d=>!skill.lastFail||d>=skill.lastFail).sort();
 if(!dates.length)return skill.lastFail?'weak':'seen';
 if(dates.length<2)return 'recalled';
 const examples=new Set(dates.map(d=>skill.successes[d]));
 if(dates.length>=3&&examples.size>=2&&diffDays(dates[0],dates[dates.length-1])>=7)return 'solid';
 return 'remembered';
}
function chooseQuiz(items,root,day){
 const selection=[];
 // Eight groups, two different patterns from each group per day.
 // Every group of ten is fully assessed every five days.
 for(let g=0;g<8;g++){
  const group=items.slice(g*10,g*10+10),first=((day-1)*2)%10;
  selection.push(group[first],group[(first+1)%10]);
 }
 return selection;
}
function grade(expected,answer){return !!norm(answer)&&norm(expected)===norm(answer);}
function examResult(root,day,quiz,answers,when,allItems){
 const date=when||dayStamp(),results=quiz.map((x,i)=>({id:x.id,correct:grade(x.en,answers[i]),expected:x.en,answer:String(answers[i]||''),vi:x.vi}));
 const correct=results.filter(x=>x.correct).length;
 const summary={date,correct,total:quiz.length,passed:correct>=PASS_MIN,results};
 const target=dayData(root,day);
 target.attempts.push(summary);
 for(let i=0;i<quiz.length;i++){
  const s=skill(root,quiz[i].id);
  if(results[i].correct){s.successes[date]=norm(quiz[i].en);s.lastSuccess=date;}
  else{delete s.successes[date];s.errors++;s.lastFail=date;}
 }
 if(summary.passed&&target.seen.length===80&&Array.from({length:8},(_,stage)=>stageComplete(target,stage,allItems||[])).every(Boolean))target.completedAt=date;
 return summary;
}
function stats(root){
 const day=currentDay(root),done=Object.values(root.days).filter(d=>d.completedAt).length;
 let recalled=0,remembered=0,solid=0,weak=0;
 for(let i=1;i<=80;i++){
  const x=mastery(root.skills[i]||{successes:{}});
  if(x==='solid')solid++;
  if(x==='weak')weak++;
  if(x==='remembered'||x==='solid')remembered++;
  if(x!=='seen'&&x!=='weak')recalled++;
 }
 return {day,done,recalled,remembered,solid,weak};
}
function masteryMapHTML(root,items){
 const labels={seen:'Chưa kiểm tra',weak:'Cần ôn lại',recalled:'Đã nhớ lại một lần',remembered:'Đang củng cố',solid:'Đã vững'};
 return '<details class="day80-mastery-map"><summary><strong>Chi tiết năng lực 80 mẫu câu</strong><small>Chạm để xem mẫu nào cần ôn</small></summary>'+
 '<div class="day80-mastery-legend"><span>○ Chưa kiểm tra</span><span>! Cần ôn</span><span>● Nhớ một lần</span><span>● Đang củng cố</span><span>★ Vững</span></div>'+
 GROUPS.map((group,g)=>'<div class="day80-mastery-group"><b>'+group.icon+' '+group.title+'</b><div class="day80-mastery-cells">'+items.slice(g*10,g*10+10).map(item=>{
  const status=mastery(root.skills[item.id]||{successes:{}});
  return '<button type="button" data-day80-pattern="'+item.id+'" class="day80-skill '+status+'" title="'+escape(item.pattern)+' — '+labels[status]+'" aria-label="Mẫu '+item.id+': '+escape(item.pattern)+'. '+labels[status]+'">'+item.id+'</button>';
 }).join('')+'</div></div>').join('')+'</details>';
}
function dashboardHTML(root,day,items){
 const data=dayData(root,day),info=stats(root),seen=data.seen.length,chunkSeen=Object.keys(root.chunkSeen||{}).length;
 const last=data.attempts[data.attempts.length-1],complete=!!data.completedAt,blocked=firstBlockedStage(data,items);
 return '<div class="day80-dash">'+
 '<header class="day80-hero"><div class="day80-kicker">MỘT LỘ TRÌNH DUY NHẤT · 60 NGÀY</div><h1>Hôm nay: 80 mẫu câu</h1>'+
 '<p>Ngày '+day+' · Chủ đề gợi ý: '+THEMES[(day-1)%THEMES.length][0]+' · '+(day<=20?'Nền tảng dễ':day<=40?'Tình huống thực tế':'Diễn đạt nâng cao')+'</p><p class="day80-session-hint">Đề xuất: 4 lượt học × 20 phút. Mỗi lượt hoàn thành 2 chặng, sau đó làm bài kiểm tra 16 câu.</p>'+
 '<div class="day80-hero-stats"><div><strong>'+seen+'/80</strong><span>Câu đã luyện hôm nay</span></div><div><strong>'+(last?last.correct+'/16':'—')+'</strong><span>Kiểm tra gần nhất</span></div><div><strong>'+info.solid+'/80</strong><span>Mẫu vững thật sự</span></div></div>'+
 '<div class="day80-meter"><i style="width:'+(seen/80*100)+'%"></i></div>'+
 '<button class="day80-mainbtn" id="day80Resume">'+(complete?'✓ Đã hoàn thành hôm nay':blocked===8?'Bắt đầu kiểm tra 16 câu →':seen>=80?'▶ Luyện nhớ chủ động theo chặng':'▶ Tiếp tục học câu '+Math.min(80,seen+1)+' / 80')+'</button></header>'+
 '<section class="day80-groups"><div class="day80-section-head"><h2>8 chặng · mỗi chặng 10 câu</h2><small>Học tuần tự hoặc chọn chặng để ôn</small></div>'+
 '<div class="day80-group-grid">'+GROUPS.map((g,i)=>{
 const n=data.seen.filter(x=>x>i*10&&x<=(i+1)*10).length,sc=stageProgress(data,i,'sentence',items),cc=stageProgress(data,i,'chunk',items);
 return '<button type="button" data-day80-group="'+i+'" class="day80-group g'+i+'"><span class="day80-group-icon">'+g.icon+'</span><div><strong>'+(i+1)+'. '+g.title+'</strong><small>'+g.subtitle+'</small></div><b>'+n+'/10</b>'+(n===10||sc||cc?'<small class="day80-stage-memory">Nhớ: câu '+sc+'/10 · cụm '+cc+'/10</small>':'')+'<span class="day80-group-line"><i style="width:'+(n*10)+'%"></i></span></button>';
 }).join('')+'</div></section>'+
 '<section class="day80-bottom"><div><h2>Hôm nay đã đạt đến đâu?</h2><p><b>Đã học:</b> câu bạn đã thực sự đi qua · <b>Nhớ lại:</b> kiểm tra Việt → Anh đúng · <b>Vững:</b> trả lời đúng ít nhất 3 ngày khác nhau, trải tối thiểu 7 ngày và 2 ví dụ.</p></div>'+
 '<div class="day80-bottom-metrics"><span>'+info.done+'/60 ngày đạt</span><span>'+info.recalled+'/80 mẫu đã nhớ lại</span><span>'+info.weak+' mẫu cần ôn</span><span>'+chunkSeen+'/4000 cụm đã tiếp xúc</span></div>'+
 '<button id="day80Calendar" class="day80-quiet">Xem lộ trình 60 ngày ↗</button>'+
 '<button id="day80Legacy" class="day80-link">Kho công cụ cũ · bài đọc · cụm từ · thử thách</button>'+
 (last?.results?.some(x=>!x.correct)?'<button id="day80ReviewSaved" class="day80-quiet">Ôn '+last.results.filter(x=>!x.correct).length+' câu sai của bài kiểm tra gần nhất</button>':'')+
 '</section>'+masteryMapHTML(root,items)+
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
 (x.chunk?'<p class="day80-chunk">Cụm bổ sung hôm nay: <strong>'+escape(x.chunk[0])+'</strong> · '+escape(x.chunk[1])+
 ' <button id="day80SpeakChunk" type="button">♫ Nghe cụm</button></p>':'')+
 '<div class="day80-method"><b>Cách luyện:</b> ① Nghe câu · ② Nói theo 2 lần · ③ Che bản dịch và nói lại. Bấm tiếp chỉ ghi nhận <b>đã tiếp xúc</b>, không tự công nhận đã thuộc.</div></div>'+
 '<footer class="day80-focus-actions"><button id="day80Previous" '+(index===0?'disabled':'')+'>← Câu trước</button><button id="day80Next" class="day80-mainbtn">Đã luyện · '+((index+1)%10===0?'Luyện nhớ chặng này →':'Câu tiếp →')+'</button></footer></section>';
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
 '<div class="day80-result-buttons"><button id="day80Return" class="day80-mainbtn">Về nhiệm vụ hôm nay</button>'+
 (result.results.some(x=>!x.correct)?'<button type="button" id="day80ReviewWrong">Ôn ngay '+result.results.filter(x=>!x.correct).length+' câu sai</button>':'')+
 '<button id="day80Retry">Kiểm tra lại 16 câu</button></div></section>';
}
function reviewHTML(day,items,failures,at){
 const fail=failures[at],card=fail&&items.find(x=>x.id===fail.id);
 if(!fail||!card)return '<section class="day80-error">Không tìm thấy câu cần ôn. Vui lòng quay lại kết quả.</section>';
 return '<section class="day80-review"><header class="day80-focus-top"><button id="day80ReviewExit" class="day80-quiet">← Kết quả kiểm tra</button>'+
 '<div><b>Ôn những câu chưa nhớ</b><small>Ngày '+day+' · Mẫu '+fail.id+' · '+escape(card.pattern)+'</small></div><span>'+(at+1)+'/'+failures.length+'</span></header>'+
 '<div class="day80-focus-progress"><i style="width:'+((at+1)/failures.length*100)+'%"></i></div>'+
 '<div class="day80-review-body"><span class="day80-step-label">TỰ NHỚ LẠI · VIỆT → ANH</span>'+
 '<h2>'+escape(fail.vi)+'</h2><p>Thử tự nói hoặc viết toàn bộ câu tiếng Anh trước khi xem đáp án.</p>'+
 '<button type="button" id="day80ReviewReveal" class="day80-mainbtn">Xem đáp án sau khi tự nhớ</button>'+
 '<div id="day80ReviewAnswer" class="day80-review-answer is-hidden"><span>ĐÁP ÁN CẦN GHI NHỚ</span><h3>'+escape(fail.expected)+'</h3>'+
 '<p><b>Mẫu câu:</b> '+escape(card.pattern)+'</p>'+
 (card.chunk?'<p><b>Cụm bổ sung:</b> '+escape(card.chunk[0])+' — '+escape(card.chunk[1])+'</p>':'')+
 '<button type="button" id="day80ReviewSpeak">♫ Nghe lại câu</button></div></div>'+
 '<footer class="day80-focus-actions"><button type="button" id="day80ReviewPrevious" '+(at===0?'disabled':'')+'>← Câu sai trước</button>'+
 '<button type="button" id="day80ReviewNext" class="day80-mainbtn" disabled>'+(at===failures.length-1?'Đã ôn · Về kết quả':'Đã ôn · Câu tiếp →')+'</button></footer></section>';
}
function calendarHTML(root){
 const complete=Object.values(root.days).filter(d=>d.completedAt).length;
 return '<section class="day80-calendar"><button id="day80CalendarBack" class="day80-quiet">← Hôm nay</button><h2>Lộ trình 60 ngày</h2>'+
 '<p>Mỗi ngày đi qua 80 cấu trúc, một ví dụ mỗi mẫu. Ví dụ được lấy từ kho dữ liệu hiện tại và tăng độ khó theo ba giai đoạn. Các lần kiểm tra là thước đo; đã xem không đồng nghĩa đã nhớ.</p>'+
 '<div class="day80-stages"><div><strong>Ngày 1–20</strong><span>Ví dụ cơ bản · câu ngắn · sinh hoạt</span></div><div><strong>Ngày 21–40</strong><span>Vận dụng · công việc · cuộc sống</span></div><div><strong>Ngày 41–60</strong><span>Câu dài hơn · ngữ cảnh khó · phản xạ</span></div></div>'+
 '<div class="day80-calendar-grid">'+Array.from({length:60},(_,i)=>{const n=i+1,d=root.days[n];return '<span class="'+(d?.completedAt?'done':n===currentDay(root)?'current':'')+'">Ngày '+n+(d?.completedAt?' ✓':'')+'</span>';}).join('')+'</div>'+
 '<strong>'+complete+'/60 ngày hoàn thành</strong><p>Không bắt buộc học bù bằng cách bỏ qua bài; bạn có thể tiếp tục đúng ngày chưa đạt.</p></section>';
}
let env,mode='home',index=0,quizIndex=0,quiz=[],answers=[],result=null,viewDay=0,examDay=0,reviewFailures=[],reviewIndex=0,gateStage=0,gateType='overview',gatePosition=0,gateFeedback=null,gateInputMode='write',gateRecognizer=null,gateStudyMode=false;
function render(nextEnv){
 if(nextEnv)env=nextEnv;if(!env?.main||!env?.state)return;
 const root=stateFor(env.state),day=currentDay(root),today=viewDay||((mode==='result'||mode==='quiz'||mode==='review')&&examDay?examDay:day),items=lessonItems(today);
 env.setHeader?.('Học hôm nay','80 mẫu câu · 1 lộ trình');
 if(items.length!==80){env.main.innerHTML='<div class="day80-error">Thiếu dữ liệu 80 mẫu câu. Vui lòng tải lại phiên bản mới. Các bài học cũ chưa bị thay đổi.</div>';return;}
 const active=dayData(root,today);
 if(mode==='learn'&&index>=80){mode='home';index=79;}
 const html=mode==='learn'?studyHTML(items,root,today,index):mode==='checkpoint'?(gateStudyMode?gateStudyHTML(gateStage,items,gateType,gatePosition):checkpointHTML(active,gateStage,items,gateType,gatePosition,gateFeedback,gateInputMode)):mode==='quiz'?quizHTML(quiz,answers,quizIndex):
 mode==='result'&&result?resultHTML(root,today,result):mode==='review'&&reviewFailures.length?reviewHTML(today,items,reviewFailures,reviewIndex):mode==='calendar'?calendarHTML(root):dashboardHTML(root,today,items);
 env.main.innerHTML='<div class="day80-app">'+html+'</div>';
 bind(root,today,items,active);
}
function stopGateSpeech(){
 if(gateRecognizer){const r=gateRecognizer;gateRecognizer=null;r.onresult=null;r.onerror=null;r.onend=null;try{r.abort();}catch(e){}}
}
function openCheckpoint(stage){
 stopGateSpeech();gateStage=stage;gateType='overview';gatePosition=0;gateFeedback=null;gateInputMode='write';gateStudyMode=false;mode='checkpoint';render();
}
function openGateKind(day,items,kind){
 stopGateSpeech();gateType=kind;gateFeedback=null;gateInputMode='write';gateStudyMode=false;
 gatePosition=pendingIndex(day,gateStage,kind,items,0);
 if(gatePosition<0){gateType='overview';gatePosition=0;}
 render();
}
function openGateStudy(kind,fromStart=false){
 stopGateSpeech();
 if(kind!=='sentence'&&kind!=='chunk')return;
 gateType=kind;
 if(fromStart)gatePosition=0;
 gateFeedback=null;gateStudyMode=true;render();
}
function returnFromGateStudy(){
 gateStudyMode=false;gateFeedback=null;gateInputMode='write';render();
}
function gateAnswer(root,day,items,answer,method){
 if(gateFeedback)return;
 const card=stageItems(items,gateStage)[gatePosition];
 if(!card||!norm(answer))return;
 gateFeedback=recordCheckpoint(root,day,gateStage,gateType,card,answer,method);
 env.saveState();render();
}
function beginQuiz(root,day,items){
 viewDay=day;
 quiz=chooseQuiz(items,root,day);answers=Array(TEST_SIZE).fill('');quizIndex=0;examDay=day;mode='quiz';result=null;reviewFailures=[];reviewIndex=0;render();
}
function bind(root,day,items,active){
 $('#day80Resume')?.addEventListener('click',()=>{
  if(active.completedAt){mode='calendar';render();return;}
  const blocked=firstBlockedStage(active,items);
  if(blocked===8){beginQuiz(root,day,items);return;}
  const cards=stageItems(items,blocked);
  if(cards.every(x=>active.seen.includes(x.id))){openCheckpoint(blocked);return;}
  index=items.findIndex(x=>x.group===blocked&&!active.seen.includes(x.id));
  index=Math.max(0,index);mode='learn';render();
 });
 $$('[data-day80-group]').forEach(button=>button.onclick=()=>{
  const chosen=Number(button.dataset.day80Group),blocked=firstBlockedStage(active,items);
  if(chosen>blocked&&blocked<8){if(stageItems(items,blocked).every(x=>active.seen.includes(x.id)))openCheckpoint(blocked);else{index=blocked*10;mode='learn';render();}return;}
  if(stageItems(items,chosen).every(x=>active.seen.includes(x.id))){openCheckpoint(chosen);return;}
  index=chosen*10;mode='learn';render();
 });
 $$('[data-day80-pattern]').forEach(button=>button.onclick=()=>{
  const wanted=Number(button.dataset.day80Pattern)-1,blocked=firstBlockedStage(active,items);
  if(Math.floor(wanted/10)>blocked&&blocked<8){if(stageItems(items,blocked).every(x=>active.seen.includes(x.id)))openCheckpoint(blocked);else{index=blocked*10;mode='learn';render();}return;}
  index=wanted;mode='learn';render();
 });
 $('#day80Calendar')?.addEventListener('click',()=>{mode='calendar';render();});
 $('#day80CalendarBack')?.addEventListener('click',()=>{mode='home';render();});
 $('#day80Legacy')?.addEventListener('click',()=>{location.hash='#home';});
 $('#day80ReviewSaved')?.addEventListener('click',()=>{
  const last=active.attempts[active.attempts.length-1];
  if(!last?.results?.some(x=>!x.correct))return;
  result=last;reviewFailures=last.results.filter(x=>!x.correct);reviewIndex=0;
  examDay=day;viewDay=day;mode='review';render();
 });
 $('#day80Exit')?.addEventListener('click',()=>{viewDay=0;mode='home';render();});
 $('#day80Previous')?.addEventListener('click',()=>{index=Math.max(0,index-1);render();});
 $('#day80Speak')?.addEventListener('click',()=>{env.speak?.(items[index].en);});
 $('#day80Slow')?.addEventListener('click',()=>{env.speak?.(items[index].en,null,0.7);});
 $('#day80SpeakChunk')?.addEventListener('click',()=>{env.speak?.(items[index].chunk?.[0]);});
 $('#day80Translate')?.addEventListener('click',()=>{$('#day80Translation')?.classList.toggle('is-hidden');});
 $('#day80Next')?.addEventListener('click',()=>{
  const id=items[index].id;
  if(!active.seen.includes(id)){active.seen.push(id);active.seen.sort((a,b)=>a-b);}
  const chunkKey=items[index].chunkKey;if(chunkKey&&!root.chunkSeen[chunkKey])root.chunkSeen[chunkKey]=dayStamp();
  env.saveState();
  if((index+1)%10===0){openCheckpoint(Math.floor(index/10));return;}
  index++;
  render();
  // Play in the originating tap for iOS Safari/PWA audio permission.
  // The existing speak() cancels any previous utterance first.
  env.speak?.(items[index].en,null,0.7);
 });

 $('#day80GateBack')?.addEventListener('click',()=>{stopGateSpeech();gateStudyMode=false;gateType='overview';mode='home';render();});
 $$('[data-day80-gate-kind]').forEach(button=>button.onclick=()=>openGateKind(active,items,button.dataset.day80GateKind));
 $$('[data-day80-gate-review]').forEach(button=>button.onclick=()=>openGateStudy(button.dataset.day80GateReview,true));
 $('#day80GateStudyOpen')?.addEventListener('click',()=>openGateStudy(gateType));
 $('#day80GateStudyBack')?.addEventListener('click',returnFromGateStudy);
 $('#day80GateStudyDone')?.addEventListener('click',returnFromGateStudy);
 $('#day80GateStudyPrevious')?.addEventListener('click',()=>{gatePosition=Math.max(0,gatePosition-1);render();});
 $('#day80GateStudyNext')?.addEventListener('click',()=>{gatePosition=Math.min(9,gatePosition+1);render();});
 $('#day80GateStudySpeak')?.addEventListener('click',()=>{
  const card=stageItems(items,gateStage)[gatePosition];
  env.speak?.(gateType==='sentence'?card.en:card.chunk?.[0]);
 });
 $('#day80GateStudySlow')?.addEventListener('click',()=>{
  const card=stageItems(items,gateStage)[gatePosition];
  env.speak?.(gateType==='sentence'?card.en:card.chunk?.[0],null,0.7);
 });
 $('#day80GateOverview')?.addEventListener('click',()=>{stopGateSpeech();gateStudyMode=false;gateType='overview';gateFeedback=null;render();});
 $('#day80GateContinue')?.addEventListener('click',()=>{
  if(!stageComplete(active,gateStage,items))return;
  if(gateStage===7){mode='home';render();return;}
  index=(gateStage+1)*10;mode='learn';render();
  env.speak?.(items[index].en,null,0.7);
 });
 $$('[data-day80-gate-input]').forEach(button=>button.onclick=()=>{
  if(gateFeedback)return;
  const selected=button.dataset.day80GateInput;
  if(selected==='speak'&&!(window.SpeechRecognition||window.webkitSpeechRecognition))return;
  stopGateSpeech();gateInputMode=selected;render();
 });
 $('#day80GateCheck')?.addEventListener('click',()=>{
  const value=$('#day80GateInput')?.value||'';
  if(!norm(value)){const el=$('#day80GateInput');if(el){el.placeholder='Hãy nhập tiếng Anh trước khi kiểm tra';el.focus?.();}return;}
  gateAnswer(root,day,items,value,'write');
 });
 $('#day80GateNext')?.addEventListener('click',()=>{
  gateFeedback=null;
  const next=pendingIndex(active,gateStage,gateType,items,(gatePosition+1)%10);
  if(next<0){gateType='overview';gatePosition=0;}
  else gatePosition=next;
  render();
 });
 $('#day80GateMic')?.addEventListener('click',()=>{
  if(gateRecognizer)return;
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition,tip=$('#day80GateSpeechStatus');
  if(!SR){gateInputMode='write';render();return;}
  let heard=false;
  try{
   const rec=new SR();gateRecognizer=rec;rec.lang='en-US';rec.continuous=false;rec.interimResults=false;rec.maxAlternatives=1;
   if(tip)tip.textContent='Đang nghe… nói câu tiếng Anh bây giờ.';
   rec.onresult=event=>{
    if(rec!==gateRecognizer)return;
    const transcript=String(event.results?.[0]?.[0]?.transcript||'').trim();
    if(transcript){heard=true;stopGateSpeech();gateAnswer(root,day,items,transcript,'speech');}
   };
   rec.onerror=event=>{
    if(rec!==gateRecognizer)return;
    stopGateSpeech();
    if(tip)tip.textContent=event.error==='not-allowed'?'Micro bị từ chối quyền. Hãy cho phép micro hoặc chọn Viết.':'Chưa nhận được giọng nói ('+(event.error||'lỗi')+'). Hãy thử lại hoặc chọn Viết.';
   };
   rec.onend=()=>{if(rec!==gateRecognizer)return;gateRecognizer=null;if(!heard&&tip)tip.textContent='Chưa nghe được câu trả lời. Bấm Nói để thử lại.';};
   rec.start();
  }catch(e){stopGateSpeech();if(tip)tip.textContent='Không mở được micro. Hãy chọn chế độ Viết.';}
 });

 $('#day80QuizExit')?.addEventListener('click',()=>{viewDay=0;mode='home';render();});
 const field=$('#day80Input');
 if(field){field.oninput=()=>{answers[quizIndex]=field.value;};}
 $('#day80QuizNext')?.addEventListener('click',()=>{
  answers[quizIndex]=field?.value||'';
  if(quizIndex<TEST_SIZE-1){quizIndex++;render();return;}
  result=examResult(root,day,quiz,answers,undefined,items);
  env.saveState();mode='result';render();
 });
 $('#day80Return')?.addEventListener('click',()=>{viewDay=0;examDay=0;mode='home';render();});
 $('#day80Retry')?.addEventListener('click',()=>{beginQuiz(root,day,items);});
 $('#day80ReviewWrong')?.addEventListener('click',()=>{
  if(!result?.results?.some(x=>!x.correct))return;
  reviewFailures=result.results.filter(x=>!x.correct);reviewIndex=0;viewDay=day;mode='review';render();
 });
 $('#day80ReviewExit')?.addEventListener('click',()=>{mode='result';render();});
 $('#day80ReviewReveal')?.addEventListener('click',()=>{
  $('#day80ReviewAnswer')?.classList.remove('is-hidden');
  const next=$('#day80ReviewNext'),btn=$('#day80ReviewReveal');
  if(next)next.disabled=false;
  if(btn)btn.hidden=true;
 });
 $('#day80ReviewSpeak')?.addEventListener('click',()=>{
  const card=items.find(x=>x.id===reviewFailures[reviewIndex]?.id);
  if(card)env.speak?.(card.en);
 });
 $('#day80ReviewPrevious')?.addEventListener('click',()=>{reviewIndex=Math.max(0,reviewIndex-1);render();});
 $('#day80ReviewNext')?.addEventListener('click',()=>{
  if(reviewIndex<reviewFailures.length-1)reviewIndex++;
  else mode='result';
  render();
 });
}
window.Daily80V60={render,lessonItems,sourcePool,selectedExample,courseDays:TOTAL_DAYS,grade,examResult,stateFor,dayData,currentDay,mastery,stats,chooseQuiz,GROUPS,checkpoint,stageProgress,stageComplete,firstBlockedStage,pendingIndex,recordCheckpoint,checkpointHTML,gateStudyHTML};
})();