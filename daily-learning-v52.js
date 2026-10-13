/* Language Studio v52 — daily orchestration. Keeps v51 Chunk Trainer and progress keys intact. */
(function(){
'use strict';
const V=52, CLOUD='https://aypyeqwbespobiwoaefe.supabase.co', KEY='sb_publishable_qENy8oNhPwOOL9fWnotYBg_we0Trwsr';
const AI='https://npkekrjzebsjfaizfcyb.supabase.co/functions/v1/language-studio-daily-conversation';
const STAGES=[{title:'Chuẩn bị',min:0},{title:'Ôn cụm cũ',min:5},{title:'Học chunk & mẫu câu',min:7},{title:'Tự tạo câu',min:5},{title:'Hội thoại',min:6},{title:'Tổng kết',min:2}];
const PREFIX={1:"I'd like to",2:"I'm going to",3:"I want to",4:"I plan to",5:"I hope to",6:"Would you like to",7:"Do you want to",8:"I'd rather",9:"I look forward to",10:"I intend to",11:"I need to"};
const TOPICS=[
  {id:'daily',name:'Sinh hoạt',goal:'Discuss how to handle a small problem with a friend.',open:'Something is not going as planned today. What would you like to do?'},
  {id:'work',name:'Công việc',goal:'Discuss an unfinished task and decide on a sensible next step with a colleague.',open:"We're not quite ready yet. What should we do next?"},
  {id:'shopping',name:'Mua sắm',goal:'Ask questions and compare options before making a purchase.',open:'Welcome! What are you looking for today?'},
  {id:'family',name:'Gia đình',goal:'Talk about arranging family activities and solving a daily problem.',open:'We need to plan our weekend. What do you want to do?'},
  {id:'travel',name:'Du lịch',goal:'Ask for help and make a practical plan while traveling.',open:'How can I help you with your travel plans?'}
];
let env=null, busy=false, loadingCloud=false, syncedKey='', pendingSave=null;
const $=(s)=>document.querySelector(s);
const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=(v)=>String(v||'').toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim();
const dateKey=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const cloudUser=()=>window.VocabCloudSync?.status?.()||{};
const accountKey=()=>cloudUser().userId||'guest';
const sessionKey=()=>accountKey()+':'+dateKey();
const catalog=()=>window.VocabularyTrainer?.packs?.()||[];
const allCards=()=>catalog().flatMap(p=>window.VocabularyTrainer?.studyChunks?.(p)||[]).filter(c=>c.kind!=='building');
function cardByKey(key){return allCards().find(x=>x.key===key)||null;}
function weakCounts(){return env.state.dailyV52Weak||{};}
function snapshot(){return env?.state?.dailyV52Sessions?.[sessionKey()]||null;}
function remember(s){
  if(!env.state.dailyV52Sessions)env.state.dailyV52Sessions={};
  s.updatedAt=Date.now();
  env.state.dailyV52Sessions[sessionKey()]=s;
  const keys=Object.keys(env.state.dailyV52Sessions).sort((a,b)=>(env.state.dailyV52Sessions[b]?.updatedAt||0)-(env.state.dailyV52Sessions[a]?.updatedAt||0));
  keys.slice(40).forEach(k=>delete env.state.dailyV52Sessions[k]);
  env.saveState();
  uploadSoon(s);
}
function uploadSoon(s){
  if(!cloudUser().signedIn)return;
  clearTimeout(pendingSave);
  const user=cloudUser().userId,day=dateKey();
  const safe=JSON.parse(JSON.stringify(s));
  if(safe.conversation){safe.conversation.history=[];safe.conversation.transcriptLocalOnly=true;}
  safe.drafts={};
  pendingSave=setTimeout(async()=>{
    try{
      const token=await window.VocabCloudSync?.getAccessToken?.();
      if(!token)return;
      const response=await fetch(CLOUD+'/rest/v1/language_studio_daily_sessions?on_conflict=user_id,study_date',{
        method:'POST',headers:{Authorization:'Bearer '+token,apikey:KEY,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},
        body:JSON.stringify({user_id:user,study_date:day,snapshot:safe,updated_at:new Date(s.updatedAt).toISOString()})
      });
      if(!response.ok)console.warn('Daily cloud save pending',response.status);
    }catch(e){console.warn('Daily cloud unavailable; saved locally',e);}
  },650);
}
async function loadCloud(){
  if(loadingCloud||!cloudUser().signedIn||syncedKey===sessionKey())return;
  const key=sessionKey();loadingCloud=true;
  try{
    const token=await window.VocabCloudSync.getAccessToken();
    if(!token)return;
    const res=await fetch(CLOUD+'/rest/v1/language_studio_daily_sessions?select=snapshot,updated_at&study_date=eq.'+dateKey()+'&limit=1',
      {headers:{Authorization:'Bearer '+token,apikey:KEY,Accept:'application/json'}});
    if(!res.ok)throw new Error('Daily sync '+res.status);
    const rows=await res.json();
    const remote=rows?.[0]?.snapshot;
    const local=snapshot();
    if(remote?.version===V&&Number(remote.updatedAt||0)>Number(local?.updatedAt||0)){
      env.state.dailyV52Sessions={...(env.state.dailyV52Sessions||{}),[key]:remote};
      env.saveState();
      if(location.hash==='#daily')render();
    }
    syncedKey=key;
  }catch(error){console.warn('Daily progress kept locally',error);}
  finally{loadingCloud=false;}
}
function plan(){
  const cards=allCards(),saved=env.state.saved||{},weak=weakCounts(),now=Date.now();
  const ranked=cards.map(c=>({card:c,p:saved[c.key]?.trainer||{},weight:Number(weak[c.key]||0)}));
  const already=ranked.filter(x=>Number(x.p.reviewCount||0)>0);
  const due=already.filter(x=>Number(x.p.nextReviewAt||0)<=now).sort((a,b)=>{
    const aValue=(a.weight*86400000)+Math.max(0,now-Number(a.p.nextReviewAt||0));
    const bValue=(b.weight*86400000)+Math.max(0,now-Number(b.p.nextReviewAt||0));
    return bValue-aValue;
  });
  const extra=already.filter(x=>!due.includes(x)).sort((a,b)=>(b.weight-a.weight)||(Number(a.p.lastReviewedAt||0)-Number(b.p.lastReviewedAt||0)));
  const review=due.concat(extra.filter(x=>x.weight>0)).slice(0,6).map(x=>x.card.key);
  let focus=window.VocabularyTrainer?.packById?.(env.state.vocabHubLessonId||env.state.vocabTrainerSettings?.lessonId);
  if(!focus)focus=catalog()[0];
  const preferred=ranked.filter(x=>x.card.pack?.lessonId===focus?.lessonId);
  const novel=ranked.filter(x=>!Number(x.p.reviewCount||0));
  const limit=due.length>=15?0:due.length>=8?1:3;
  const news=preferred.filter(x=>novel.includes(x)).concat(novel.filter(x=>x.card.pack?.lessonId!==focus?.lessonId)).slice(0,limit).map(x=>x.card.key);
  const tasks=[...new Set([...news,...review])].slice(0,3);
  if(!tasks.length)tasks.push(...ranked.slice(0,3).map(x=>x.card.key));
  const seed=Number(dateKey().replace(/-/g,''))||0;
  const topic=TOPICS[seed%TOPICS.length];
  return {review,newCards:news,tasks,focusLessonId:focus?.lessonId||'',pattern:PREFIX[focus?.order]||focus?.pattern||"I'd like to",topicId:topic.id};
}
function createSession(){
  const p=plan();
  return {version:V,day:dateKey(),stage:0,index:0,startedAt:Date.now(),updatedAt:Date.now(),plan:p,
    reviewResults:{},learned:[],recallResults:{},drafts:{},
    conversation:{history:[],turns:0,feedback:[],used:[],weak:[],fallback:false,done:false,transcriptLocalOnly:true},
    completedAt:0
  };
}
function current(){let s=snapshot();if(!s||s.version!==V){s=createSession();remember(s);}return s;}
function progress(s){
  const pct=Math.round((s.stage/5)*100);
  return '<div class="daily-v52-progress" role="progressbar" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100" aria-label="Tiến độ buổi học"><div style="width:'+pct+'%"></div></div>';
}
function shell(s,body){
  env.setHeader('English › Hôm nay','Hôm nay · 25 phút');
  const root=$('#mainView');if(!root)return;
  root.innerHTML='<section class="daily-v52"><header class="daily-v52-head"><div><span class="daily-v52-kicker">LANGUAGE STUDIO · V52</span><h1>'+esc(STAGES[s.stage].title)+'</h1></div><span class="daily-v52-time">'+(s.stage===0?'25 phút':STAGES[s.stage].min+' phút')+'</span></header>'+
    progress(s)+'<div class="daily-v52-stage"><span>Bước '+Math.min(s.stage,5)+'/5</span><button type="button" id="dailyExit">Các bài học khác ↗</button></div>'+
    '<div class="daily-v52-card">'+body+'</div>'+
    '<p class="daily-v52-small">Tiến độ tự lưu trên thiết bị. '+(cloudUser().signedIn?'Đồng bộ tài khoản khi có mạng.':'Đăng nhập để đồng bộ giữa các thiết bị.')+'</p></section>';
  $('#dailyExit').onclick=()=>{location.hash='#patterns';};
}
function go(s,stage){s.stage=stage;s.index=0;if(stage===5&&!s.completedAt)s.completedAt=Date.now();remember(s);render();}
function stageButton(label,id='dailyNext'){return '<button type="button" id="'+id+'" class="daily-v52-primary">'+esc(label)+' <span aria-hidden="true">→</span></button>';}
function microphone(fieldId){
  const input=$('#'+fieldId);
  if(!input)return;
  env.startRecognition(input,()=>{ input.dispatchEvent(new Event('input',{bubbles:true}));});
}
function audioBinder(){
  document.querySelectorAll('[data-daily-audio]').forEach(el=>el.onclick=()=>env.speak(el.dataset.dailyAudio));
}
function inputTools(id){
  return '<div class="daily-v52-input-tools"><button type="button" id="dailyMic" class="daily-v52-outline">🎙 Nói</button><button type="button" id="dailyHint" class="daily-v52-outline">Gợi ý</button></div><p class="daily-v52-small">Có thể sửa lại chữ nhận dạng trước khi kiểm tra.</p>';
}
function home(s){
  const p=s.plan;const t=TOPICS.find(x=>x.id===p.topicId)||TOPICS[0];
  shell(s,'<span class="daily-v52-eyebrow">BUỔI HỌC CỦA BẠN</span><h2>25 phút để dùng được tiếng Anh</h2>'+
    '<p>'+(s.completedAt?'Bạn đã hoàn thành buổi học hôm nay. Có thể xem kết quả hoặc vào Chunk Trainer để luyện thêm.':'Mỗi ngày chỉ cần bắt đầu. Ứng dụng tự chọn cụm cần ôn, cụm mới và tình huống giao tiếp.')+'</p>'+
    '<div class="daily-v52-metrics"><div><strong>'+p.review.length+'</strong><small>Cụm cần ôn</small></div><div><strong>'+p.newCards.length+'</strong><small>Cụm mới</small></div><div><strong>1</strong><small>Hội thoại</small></div></div>'+
    '<div class="daily-v52-focus"><b>Mẫu câu trọng tâm</b><span>'+esc(p.pattern)+'</span><b>Chủ đề hội thoại</b><span>'+esc(t.name)+'</span></div>'+
    '<div class="daily-v52-agenda">'+STAGES.slice(1).map((x,i)=>'<div><span>0'+(i+1)+'</span><strong>'+esc(x.title)+'</strong><small>'+x.min+' phút</small></div>').join('')+'</div>'+
    stageButton(s.completedAt?'Xem lại kết quả':'Bắt đầu 25 phút')+
    '<p class="daily-v52-small">Không giới hạn thời gian trả lời; các mốc phút chỉ là mục tiêu.</p>');
  $('#dailyNext').onclick=()=>go(s,s.completedAt?5:p.review.length?1:p.newCards.length?2:3);
}
function review(s){
  const keys=s.plan.review;if(s.index>=keys.length){go(s,s.plan.newCards.length?2:3);return;}
  const c=cardByKey(keys[s.index]);if(!c){s.index++;remember(s);render();return;}
  const result=s.reviewResults[c.key],n=s.index+1;
  shell(s,'<span class="daily-v52-eyebrow">ÔN TẬP '+n+'/'+keys.length+'</span>'+
    '<p class="daily-v52-label">Hãy nhớ cả cụm từ từ ý tiếng Việt. Không nhìn đáp án trước.</p>'+
    '<h2>'+esc(c.baseVi||c.modelVi||'Hãy nói cụm tiếng Anh')+'</h2>'+
    (!result?'<label class="daily-v52-label" for="dailyAnswer">Cụm tiếng Anh của bạn</label><textarea id="dailyAnswer" rows="2" placeholder="Tự nói hoặc nhập câu trả lời...">'+esc(s.drafts?.['review:'+c.key]||'')+'</textarea>'+inputTools('dailyAnswer')+stageButton('Kiểm tra'):'<div class="daily-v52-result '+(result.ok?'is-good':'is-hard')+'"><b>'+(result.ok?'Đã nhớ đúng cụm':'Cần ôn thêm')+'</b><div>'+esc(c.baseEn)+'</div><small>'+esc(c.modelEn||'')+'</small></div>'+stageButton(n===keys.length?'Tiếp tục học':'Cụm tiếp theo'))+
    '<button class="daily-v52-listen" type="button" data-daily-audio="'+esc(c.baseEn)+'">♫ Nghe cụm tiếng Anh</button>');
  audioBinder();
  if(!result){
    $('#dailyMic').onclick=()=>microphone('dailyAnswer');
    $('#dailyAnswer').oninput=e=>{s.drafts['review:'+c.key]=e.target.value;env.saveState();};
    $('#dailyHint').onclick=()=>env.toast('Gợi ý: '+(c.baseEn||'').split(' ')[0]+' ...');
    $('#dailyNext').onclick=()=>{
      const attempt=$('#dailyAnswer').value.trim();if(!attempt){env.toast('Hãy thử tự nhớ trước khi xem đáp án.');return;}
      const expected=norm(c.baseEn),actual=norm(attempt);
      const ok=actual===expected||(actual.startsWith(expected+' '))||(actual.endsWith(' '+expected))||(actual.includes(' '+expected+' '));
      s.reviewResults[c.key]={ok,attempt};
      delete s.drafts['review:'+c.key];
      window.VocabularyTrainer?.recordMemory?.(env,c,ok);
      remember(s);render();
    };
  }else $('#dailyNext').onclick=()=>{s.index++;remember(s);render();};
}
function learning(s){
  const keys=s.plan.newCards;
  if(s.index>=keys.length){go(s,3);return;}
  const c=cardByKey(keys[s.index]);if(!c){s.index++;remember(s);render();return;}
  const examples=(c.usageExamples||c.examples||[]).slice(0,3).map((x,i)=>{
    const en=typeof x==='string'?x:String(x.en||'');
    const vi=typeof x==='string'?'':String(x.vi||'');
    return '<div class="daily-v52-example"><b>'+esc(en)+'</b>'+(vi?'<span>'+esc(vi)+'</span>':'')+
      '<button type="button" data-daily-audio="'+esc(en)+'" aria-label="Nghe ví dụ">♫</button></div>';
  }).join('');
  shell(s,'<span class="daily-v52-eyebrow">CHUNK MỚI '+(s.index+1)+'/'+keys.length+'</span>'+
    '<h2>'+esc(c.baseEn)+'</h2><p class="daily-v52-meaning">'+esc(c.baseVi)+'</p>'+
    '<button class="daily-v52-listen" type="button" data-daily-audio="'+esc(c.baseEn)+'">♫ Nghe phát âm</button>'+
    '<h3>Ứng dụng trong câu</h3><div class="daily-v52-example"><b>'+esc(c.modelEn)+'</b><span>'+esc(c.modelVi)+'</span></div>'+
    (examples?'<h3>Biến đổi theo tình huống</h3>'+examples:'')+
    '<p class="daily-v52-small">Hãy thử nói lại 1 câu mới bằng cụm này. Mới xem và nghe chưa được tính là đã thành thạo.</p>'+
    stageButton(s.index===keys.length-1?'Luyện tự tạo câu':'Học cụm tiếp theo')+
    '<button id="dailyOpenTrainer" type="button" class="daily-v52-outline daily-v52-extend">Luyện sâu trong Chunk Trainer ↗</button>');
  audioBinder();
  $('#dailyNext').onclick=()=>{if(!s.learned.includes(c.key))s.learned.push(c.key);s.index++;remember(s);render();};
  $('#dailyOpenTrainer').onclick=()=>env.openTrainer({mode:'guided',lessonId:c.pack.lessonId,size:'3'});
}
function recall(s){
  const keys=s.plan.tasks;
  if(s.index>=keys.length){go(s,4);return;}
  const c=cardByKey(keys[s.index]);if(!c){s.index++;remember(s);render();return;}
  const result=s.recallResults[c.key];
  shell(s,'<span class="daily-v52-eyebrow">TỰ TẠO CÂU '+(s.index+1)+'/'+keys.length+'</span>'+
    '<p class="daily-v52-label">Diễn đạt ý sau bằng tiếng Anh, không nhìn câu mẫu:</p><h2>'+esc(c.modelVi||c.baseVi)+'</h2>'+
    (!result?'<textarea id="dailyAnswer" rows="3" placeholder="Nhập hoặc nói một câu hoàn chỉnh...">'+esc(s.drafts?.['recall:'+c.key]||'')+'</textarea>'+inputTools('dailyAnswer')+stageButton('Kiểm tra cách dùng cụm'):'<div class="daily-v52-result '+(result.found?'is-good':'is-hard')+'"><b>'+(result.found?'Đã sử dụng đúng cụm về mặt từ ngữ':'Chưa có cụm mục tiêu trong câu')+'</b><p>'+esc(result.attempt)+'</p><small>Đối chiếu mẫu: '+esc(c.modelEn)+'</small><p class="daily-v52-small">Đây chỉ là kiểm tra cụm theo từ ngữ. Ngữ pháp và ý nghĩa cần phản hồi của AI.</p></div>'+stageButton(s.index===keys.length-1?'Chuyển sang hội thoại':'Câu tiếp theo'))+
    '<button id="dailyDeepPractice" class="daily-v52-outline daily-v52-extend" type="button">Luyện biến đổi / phân biệt trong Chunk Trainer ↗</button>');
  if(!result){
    $('#dailyMic').onclick=()=>microphone('dailyAnswer');
    $('#dailyAnswer').oninput=e=>{s.drafts['recall:'+c.key]=e.target.value;env.saveState();};
    $('#dailyHint').onclick=()=>env.toast('Cụm gợi ý: '+c.baseEn);
    $('#dailyNext').onclick=()=>{
      const attempt=$('#dailyAnswer').value.trim();if(!attempt){env.toast('Hãy thử tạo một câu trước.');return;}
      const found=norm(attempt).includes(norm(c.baseEn));
      s.recallResults[c.key]={attempt,found};
      delete s.drafts['recall:'+c.key];
      // Only a genuine recall attempt enters SRS. This does not credit the Use skill.
      window.VocabularyTrainer?.recordMemory?.(env,c,found);
      remember(s);render();
    };
  }else $('#dailyNext').onclick=()=>{s.index++;remember(s);render();};
  $('#dailyDeepPractice').onclick=()=>env.openTrainer({autoPath:true,lessonId:c.pack.lessonId});
}
function conversation(s){
  const convo=s.conversation,t=TOPICS.find(x=>x.id===s.plan.topicId)||TOPICS[0];
  const targets=s.plan.tasks.map(cardByKey).filter(Boolean).map(c=>c.baseEn).slice(0,4);
  const history=convo.history.length?convo.history:[{speaker:'ai',text:t.open}];
  const messages=history.map((m,i)=>'<div class="daily-v52-bubble '+(m.speaker==='learner'?'mine':'ai')+'"><small>'+(m.speaker==='learner'?'Bạn':'AI / tình huống')+'</small><div>'+esc(m.text)+'</div>'+(m.vi?'<small>'+esc(m.vi)+'</small>':'')+'</div>').join('');
  let body='<span class="daily-v52-eyebrow">AI PARTNER · '+esc(t.name.toUpperCase())+'</span>'+
    '<p class="daily-v52-label">'+esc(t.goal)+'</p>'+
    '<div class="daily-v52-bubbles" aria-live="polite">'+messages+'</div>'+
    '<div class="daily-v52-convo-note"><strong>Cụm cần vận dụng:</strong> '+esc(targets.join(' · ')||s.plan.pattern)+'</div>';
  if(convo.feedback.length){
    const note=convo.feedback[convo.feedback.length-1];
    body+='<div class="daily-v52-feedback"><b>Nhận xét gần nhất</b><p>'+esc(note.text)+'</p>'+(note.corrected?'<p><b>Câu tự nhiên hơn:</b> '+esc(note.corrected)+'</p>':'')+'</div>';
  }
  if(convo.done || convo.turns>=5){
    body+='<p>Đã hoàn thành phần hội thoại. Các cụm cần luyện thêm được đưa vào mục tổng kết.</p>'+stageButton('Xem tổng kết');
  }else{
    body+='<label for="dailyMessage" class="daily-v52-label">Bạn trả lời bằng tiếng Anh</label>'+
      '<textarea id="dailyMessage" rows="3" placeholder="Nói hoặc nhập câu trả lời...">'+esc(s.drafts?.conversation||'')+'</textarea>'+
      inputTools('dailyMessage')+
      '<p id="dailyConversationHint" class="daily-v52-hint" hidden></p>'+
      stageButton(convo.fallback?'Gửi câu (luyện tình huống)':'Gửi câu cho AI')+
      '<button id="dailyFallback" type="button" class="daily-v52-outline daily-v52-extend">'+(convo.fallback?'Đang dùng bài luyện không AI':'Dùng tình huống không AI')+'</button>'+
      '<button id="dailyFinishConversation" type="button" class="daily-v52-text">Kết thúc hội thoại và xem tổng kết</button>';
  }
  if(convo.error)body+='<p class="daily-v52-error" role="alert">'+esc(convo.error)+'</p>';
  shell(s,body);
  audioBinder();
  document.querySelectorAll('.daily-v52-bubble.ai').forEach(box=>{
    const text=box.querySelector('div')?.textContent||'';
    const btn=document.createElement('button');btn.type='button';btn.className='daily-v52-listen';btn.textContent='♫ Nghe câu';btn.onclick=()=>env.speak(text);box.appendChild(btn);
  });
  if(convo.done||convo.turns>=5){$('#dailyNext').onclick=()=>go(s,5);return;}
  $('#dailyMic').onclick=()=>microphone('dailyMessage');
  $('#dailyMessage').oninput=e=>{s.drafts.conversation=e.target.value;env.saveState();};
  $('#dailyHint').onclick=()=>{
    const hint=$('#dailyConversationHint');
    hint.hidden=false;
    hint.textContent=convo.hint||'Bạn có thể trình bày ý định hoặc đề xuất một bước tiếp theo. Thử dùng một cụm đã học.';
  };
  $('#dailyFallback').onclick=()=>{convo.fallback=true;convo.error='';remember(s);render();};
  $('#dailyFinishConversation').onclick=()=>{convo.done=true;remember(s);go(s,5);};
  $('#dailyNext').onclick=async()=>{
    if(busy)return;
    const text=$('#dailyMessage').value.trim();if(!text){env.toast('Hãy thử nói hoặc nhập câu trả lời.');return;}
    busy=true;$('#dailyNext').disabled=true;$('#dailyNext').textContent='Đang xử lý…';
    const recent=(convo.history.length?convo.history:[{speaker:'ai',text:t.open}]).slice(-8);
    try{
      if(convo.fallback){
        convo.history.push({speaker:'learner',text});
        const next=[
          'Could you tell me a little more?',
          'That sounds reasonable. What would you do first?',
          'Who could help with that?',
          'When would you like to do it?',
          'Thanks for explaining your plan.'
        ][Math.min(4,convo.turns)];
        convo.history.push({speaker:'ai',text:next,vi:'Hãy trả lời tiếp bằng một câu của bạn.'});
        convo.feedback.push({text:'Bài luyện tình huống không AI: hệ thống chưa đánh giá ngữ pháp hoặc sự tự nhiên.',corrected:''});
      }else{
        const token=await window.VocabCloudSync?.getAccessToken?.();
        if(!token){convo.error='Bạn cần đăng nhập trong Tài khoản & dữ liệu để dùng AI. Có thể chọn tình huống không AI.';remember(s);return;}
        const response=await fetch(AI,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
          body:JSON.stringify({sessionId:accountKey()+'-'+s.day,answer:text,level:'beginner',
            pattern:s.plan.pattern,objective:t.goal,opener:t.open,chunks:targets,history:recent})});
        const data=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(data.message||'AI tạm thời không khả dụng. Bạn có thể dùng bài luyện không AI.');
        convo.history.push({speaker:'learner',text});
        convo.history.push({speaker:'ai',text:data.reply_en||'Could you tell me more?',vi:data.reply_vi||''});
        convo.feedback.push({text:data.feedback_vi||'Bạn đã hoàn thành lượt này.',corrected:data.corrected_en===text?'':data.corrected_en});
        const validated=(list)=>Array.isArray(list)?list.filter(phrase=>targets.includes(phrase)&&norm(text).includes(norm(phrase))):[];
        const good=validated(data.used_chunks),bad=validated(data.weak_chunks);
        good.forEach(phrase=>{const c=s.plan.tasks.map(cardByKey).find(x=>x?.baseEn===phrase);if(c&&!convo.used.includes(c.key))convo.used.push(c.key);});
        bad.forEach(phrase=>{const c=s.plan.tasks.map(cardByKey).find(x=>x?.baseEn===phrase);if(c){
          if(!convo.weak.includes(c.key))convo.weak.push(c.key);
          env.state.dailyV52Weak={...(env.state.dailyV52Weak||{}),[c.key]:Math.min(5,Number(weakCounts()[c.key]||0)+1)};
        }});
        convo.hint=data.hint_vi||'';
      }
      convo.turns++;
      delete s.drafts.conversation;
      convo.error='';
      if(convo.turns>=5)convo.done=true;
      remember(s);
    }catch(error){convo.error=String(error?.message||error);remember(s);}
    finally{busy=false;render();}
  };
}
function summary(s){
  const review=Object.values(s.reviewResults||{});
  const correct=review.filter(x=>x.ok).length;
  const convo=s.conversation||{};
  const unused=[...new Set(s.plan.tasks)].filter(k=>!(convo.used||[]).includes(k));
  const weak=[...new Set([...(convo.weak||[]),...Object.keys(s.reviewResults||{}).filter(k=>!s.reviewResults[k].ok)])].map(cardByKey).filter(Boolean);
  const body='<div class="daily-v52-congrat">✓</div><h2>Buổi học đã hoàn thành</h2>'+
    '<p>Mỗi câu bạn tự tạo ra đều là một bước tiến. Hãy ưu tiên khả năng nhớ lại và sử dụng được sau vài ngày.</p>'+
    '<div class="daily-v52-metrics"><div><strong>'+correct+'/'+review.length+'</strong><small>Ôn đúng</small></div><div><strong>'+s.learned.length+'</strong><small>Cụm đã xem</small></div><div><strong>'+Number(convo.turns||0)+'</strong><small>Lượt hội thoại</small></div></div>'+
    '<div class="daily-v52-focus"><b>Đã dùng đúng trong AI</b><span>'+esc((convo.used||[]).map(k=>cardByKey(k)?.baseEn).filter(Boolean).join(', ')||'Chưa có dữ liệu xác nhận')+'</span>'+
    '<b>Cần tiếp tục củng cố</b><span>'+esc(weak.map(x=>x.baseEn).join(', ')||'Ôn duy trì theo lịch SRS')+'</span></div>'+
    (convo.fallback?'<p class="daily-v52-small">Phần hội thoại vừa rồi là bài luyện không AI; không chấm ngữ pháp hoặc ghi nhận Automatic.</p>':'')+
    stageButton('Quay về Hôm nay')+
    '<button type="button" class="daily-v52-outline daily-v52-extend" id="dailyMore">Mở Chunk Trainer để ôn thêm ↗</button>';
  shell(s,body);
  $('#dailyNext').onclick=()=>{s.stage=0;remember(s);render();};
  $('#dailyMore').onclick=()=>env.openTrainer({autoPath:true,lessonId:s.plan.focusLessonId});
}
function render(nextEnv){
  if(nextEnv)env=nextEnv;
  if(!env)return;
  const s=current();
  switch(s.stage){case 0:home(s);break;case 1:review(s);break;case 2:learning(s);break;case 3:recall(s);break;case 4:conversation(s);break;case 5:summary(s);break;default:s.stage=0;remember(s);home(s);}
  if(cloudUser().signedIn && syncedKey!==sessionKey())void loadCloud();
}
window.DailyLearningV52={render,plan,cardByKey,version:V};
})();