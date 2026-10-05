(function ChunkFlashcardTrainerV2(){
  'use strict';

  const DAY=24*60*60*1000;
  const MINUTE=60*1000;
  let env=null;
  let session=null;
  let viewportHandler=null;

  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));

  function esc(value=''){
    if(env?.esc) return env.esc(value);
    return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function slug(text=''){
    return String(text).toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
  }

  function normalize(text=''){
    return String(text)
      .toLowerCase()
      .replace(/[’‘]/g,"'")
      .replace(/\b(i am)\b/g,"i'm")
      .replace(/\b(cannot)\b/g,"can't")
      .replace(/[^a-z0-9'\s]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function tokens(text=''){
    return normalize(text).split(' ').filter(Boolean);
  }

  function stem(token=''){
    let t=String(token).toLowerCase();
    if(t.endsWith('ing')&&t.length>5){
      t=t.slice(0,-3);
      if(t.length>2&&t.at(-1)===t.at(-2)) t=t.slice(0,-1);
    }else if(t.endsWith('ed')&&t.length>4) t=t.slice(0,-2);
    else if(t.endsWith('s')&&t.length>4) t=t.slice(0,-1);
    return t;
  }

  function contentTokens(text=''){
    const stop=new Set(['a','an','the','to','of','on','with','for','something','someone','somebody','it','one','ones','my','your','this','that']);
    return tokens(text).filter(x=>!stop.has(x)).map(stem);
  }

  function wordDiff(expected,actual){
    const a=tokens(expected), b=tokens(actual);
    const m=a.length,n=b.length;
    const dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
    for(let i=m-1;i>=0;i--){
      for(let j=n-1;j>=0;j--) dp[i][j]=a[i]===b[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);
    }
    const out=[];
    let i=0,j=0;
    while(i<m||j<n){
      if(i<m&&j<n&&a[i]===b[j]){out.push({type:'ok',text:a[i]});i++;j++;continue;}
      if(j<n&&(i===m||dp[i][j+1]>=dp[i+1]?.[j])){out.push({type:'extra',text:b[j]});j++;continue;}
      if(i<m){out.push({type:'missing',text:a[i]});i++;}
    }
    return out;
  }

  function diffHTML(expected,actual){
    return `<div class="chunk-word-diff">${wordDiff(expected,actual).map(x=>`<span class="${x.type}">${esc(x.text)}</span>`).join(' ')}</div>`;
  }

  function packs(){
    return window.ACTIVE_STUDY_PACK_LIST||[];
  }

  function packById(id){
    return window.ACTIVE_STUDY_PACKS?.[id]||packs()[0]||null;
  }

  function settings(){
    const first=packs()[0]?.lessonId||'en-pattern-001';
    const defaults={
      lessonId:first,
      mode:'write',
      size:'10',
      order:'srs',
      priority:'all',
      autoSpeak:false
    };
    env.state.vocabTrainerSettings={...defaults,...(env.state.vocabTrainerSettings||{})};
    if(!packById(env.state.vocabTrainerSettings.lessonId)) env.state.vocabTrainerSettings.lessonId=first;
    if(!['learn','write','fast','variation','mix','cloze','situation','sentence','guided'].includes(env.state.vocabTrainerSettings.mode)){
      env.state.vocabTrainerSettings.mode='write';
    }
    return env.state.vocabTrainerSettings;
  }

  function prefixEn(pack){
    return {
      1:"I'd like to",
      2:"I'm going to",
      3:"I want to",
      4:"I plan to",
      5:"I hope to",
      6:"Would you like to",
      7:"Do you want to",
      8:"I'd rather",
      9:"I look forward to",
      10:"I intend to",
      11:"I need to"
    }[Number(pack?.order)]||String(pack?.pattern||'').replace(/[.…?]+$/g,'').trim();
  }

  function stripEnglish(pack,sentence=''){
    let s=String(sentence).trim();
    const patterns={
      1:/^i['’]d like to\s+/i,
      2:/^i['’]m going to\s+/i,
      3:/^i want to\s+/i,
      4:/^i plan to\s+/i,
      5:/^i hope to\s+/i,
      6:/^would you like to\s+/i,
      7:/^do you want to\s+/i,
      8:/^i['’]d rather\s+/i,
      9:/^(?:i look forward to|i['’]m looking forward to)\s+/i,
      10:/^i intend to\s+/i,
      11:/^i need to\s+/i
    };
    s=s.replace(patterns[Number(pack?.order)]||/^$/,'').replace(/[?.!]+$/,'').trim();
    return s||String(sentence).trim();
  }

  function stripVietnamese(pack,sentence=''){
    let s=String(sentence).trim().replace(/[?.!]+$/,'');
    const order=Number(pack?.order);
    const patterns={
      1:/^tôi muốn\s+/i,
      2:/^tôi sẽ\s+/i,
      3:/^tôi muốn\s+/i,
      4:/^(?:năm nay |tháng sau )?tôi dự định\s+/i,
      5:/^tôi hy vọng(?: sẽ)?\s+/i,
      6:/^bạn có muốn\s+/i,
      7:/^bạn có muốn\s+/i,
      8:/^tôi thà\s+/i,
      9:/^tôi (?:đang )?mong(?: được)?\s+/i,
      10:/^(?:năm nay )?tôi định\s+/i,
      11:/^tôi cần\s+/i
    };
    s=s.replace(patterns[order]||/^$/,'').replace(/\s+không$/i,'').trim();
    return s||String(sentence).trim();
  }

  function matchScore(base,sentence){
    const target=contentTokens(base);
    const hay=contentTokens(sentence);
    if(!target.length) return 0;
    const hits=target.filter(t=>hay.includes(t)).length;
    if(target.length<=2) return hits===target.length?1:0;
    const score=hits/target.length;
    return hits>=2&&score>=0.67?score:0;
  }

  function buildExamples(pack,row){
    const [baseEn,baseVi,modelEn='',modelVi='']=row;
    const seen=new Set();
    const examples=[];
    function add(en,vi){
      const key=normalize(en);
      if(!en||seen.has(key)) return;
      seen.add(key);
      examples.push({
        en:String(en),
        vi:String(vi||''),
        phraseEn:stripEnglish(pack,en),
        phraseVi:stripVietnamese(pack,vi||'')
      });
    }
    add(modelEn,modelVi);
    const ranked=(pack.deepSentences||[])
      .map(x=>({row:x,score:matchScore(baseEn,x[0])}))
      .filter(x=>x.score>=0.5)
      .sort((a,b)=>b.score-a.score);
    ranked.forEach(x=>add(x.row[0],x.row[1]));
    return examples.slice(0,3);
  }

  function studyChunks(pack){
    if(!pack) return [];
    const rows=[
      ...(pack.activeChunks||[]).map(row=>({row,priority:'core',kind:'main'})),
      ...(pack.buildingBlocks||[]).map(row=>({row,priority:'building',kind:'building'})),
      ...(pack.recognitionChunks||[]).map(row=>({row,priority:'extra',kind:'main'}))
    ];
    return rows.map(({row,priority,kind},index)=>{
      const [baseEn,baseVi,modelEn='',modelVi='']=row;
      const examples=buildExamples(pack,row);
      const primary=examples[0]||{
        en:modelEn||baseEn,
        vi:modelVi||baseVi,
        phraseEn:modelEn?stripEnglish(pack,modelEn):baseEn,
        phraseVi:modelVi?stripVietnamese(pack,modelVi):baseVi
      };
      return {
        id:`${pack.lessonId}:${slug(baseEn)}`,
        key:`chunk2:${pack.lessonId}:${slug(baseEn)}`,
        pack,
        index,
        priority,
        kind,
        baseEn,
        baseVi,
        modelEn:primary.en,
        modelVi:primary.vi,
        phraseEn:primary.phraseEn||baseEn,
        phraseVi:primary.phraseVi||baseVi,
        examples:examples.length?examples:[primary],
        usageExamples:kind==='building'
          ? []
          : [...(window.CHUNK_USAGE_EXAMPLES?.[String(baseEn||'').toLowerCase()]||[])]
      };
    });
  }

  function trainerDefaults(){
    return {
      starred:false,
      mastered:false,
      automatic:false,
      reviewCount:0,
      correctCount:0,
      wrongCount:0,
      lastReviewedAt:0,
      nextReviewAt:0,
      intervalDays:0,
      reviewStep:0,
      fastBestMs:0,
      fastLastMs:0,
      successDates:[],
      lastRating:'',
      lastMode:'',
      updatedAt:0,
      skills:{understand:0,recognize:0,recall:0,fast:0,vary:0,discriminate:0,situation:0,use:0,writing:0}
    };
  }

  function progressFor(card,saved=env?.state?.saved||{}){
    const raw=saved?.[card.key]?.trainer||{};
    const base=trainerDefaults();
    const next={
      ...base,
      ...raw,
      successDates:Array.isArray(raw.successDates)?raw.successDates.slice(-12):[],
      skills:{...base.skills,...(raw.skills||{})}
    };
    // Existing learners keep their old progress instead of being reset.
    if(next.skills.recognize>=2) next.skills.understand=Math.max(2,Number(next.skills.understand||0));
    if(next.skills.use>=2){
      next.skills.vary=Math.max(1,Number(next.skills.vary||0));
      next.skills.situation=Math.max(1,Number(next.skills.situation||0));
    }
    next.automatic=automaticStatus(next).automatic;
    next.mastered=next.skills.recognize>=2&&next.skills.recall>=2&&next.skills.use>=2;
    return next;
  }

  function dayStamp(ts=Date.now()){
    const d=new Date(ts);
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  }

  function automaticStatus(progress){
    const p={...trainerDefaults(),...(progress||{}),skills:{...trainerDefaults().skills,...(progress?.skills||{})}};
    const dates=new Set(Array.isArray(p.successDates)?p.successDates:[]);
    const conditions={
      understand:Number(p.skills.understand||0)>=2,
      recall:Number(p.skills.recall||0)>=2,
      fast:Number(p.skills.fast||0)>=2 && Number(p.fastBestMs||Infinity)<=1000,
      vary:Number(p.skills.vary||0)>=2,
      situation:Number(p.skills.situation||0)>=2,
      spaced:dates.size>=3
    };
    return {automatic:Object.values(conditions).every(Boolean),conditions,days:dates.size};
  }

  function skillForMode(mode){
    if(mode==='learn') return 'recognize';
    if(mode==='write'||mode==='cloze') return 'recall';
    if(mode==='fast') return 'fast';
    if(mode==='variation') return 'vary';
    if(mode==='mix') return 'discriminate';
    if(mode==='situation') return 'situation';
    return 'use';
  }

  function persist(card,p){
    const item={
      key:card.key,
      term:card.baseEn,
      speechText:card.baseEn,
      ipa:'',
      meaning:card.baseVi,
      example:card.modelEn,
      type:'study-card',
      lessonId:card.pack.lessonId,
      lessonOrder:card.pack.order,
      studyLevel:p.automatic?4:Math.min(3,Math.max(1,Number(p.skills?.use>=2?3:p.skills?.recall>=2?2:1))),
      cardKind:'chunk-v2',
      savedAt:Number(env.state.saved?.[card.key]?.savedAt||Date.now()),
      trainer:{...trainerDefaults(),...p,skills:{...trainerDefaults().skills,...(p.skills||{})},updatedAt:Date.now()}
    };
    env.state.saved[card.key]=item;
    env.saveState();
    env.queueVocabUpsert(item);
  }

  function nextReviewSchedule(p,rating){
    if(rating==='again') return {step:0,delay:10*MINUTE,days:0};
    if(rating==='hard') return {step:Math.max(0,Number(p.reviewStep||0)),delay:DAY,days:1};
    const ladder=[
      {delay:10*MINUTE,days:0},
      {delay:DAY,days:1},
      {delay:3*DAY,days:3},
      {delay:7*DAY,days:7},
      {delay:14*DAY,days:14},
      {delay:30*DAY,days:30}
    ];
    const step=Math.min(ladder.length-1,Math.max(0,Number(p.reviewStep||0)));
    const next=ladder[step];
    return {step:Math.min(ladder.length-1,step+1),delay:next.delay,days:next.days};
  }

  function record(card,{rating='good',skill=skillForMode(session.options.mode),writing=false,latencyMs=0}={}){
    const p=progressFor(card);
    const now=Date.now();
    p.reviewCount=Number(p.reviewCount||0)+1;
    p.lastReviewedAt=now;
    p.lastRating=rating;
    p.lastMode=session.options.mode;
    p.skills={...trainerDefaults().skills,...(p.skills||{})};

    if(rating==='again'){
      p.wrongCount=Number(p.wrongCount||0)+1;
      p.skills[skill]=Math.max(0,Number(p.skills[skill]||0)-1);
      p.reviewStep=Math.max(0,Number(p.reviewStep||0)-1);
      p.intervalDays=0;
      p.nextReviewAt=now+10*MINUTE;
      p.mastered=false;
      p.automatic=false;
      session.stats.wrong++;
      requeueCurrent(card);
    }else{
      p.correctCount=Number(p.correctCount||0)+1;
      const gain=rating==='easy'?2:1;
      p.skills[skill]=Math.min(3,Number(p.skills[skill]||0)+gain);
      if(skill==='recognize') p.skills.understand=Math.max(2,Number(p.skills.understand||0));
      if(writing) p.skills.writing=Math.min(3,Number(p.skills.writing||0)+gain);
      if(latencyMs>0){
        p.fastLastMs=Math.round(latencyMs);
        p.fastBestMs=p.fastBestMs?Math.min(Number(p.fastBestMs),Math.round(latencyMs)):Math.round(latencyMs);
        if(latencyMs<=1000) p.skills.fast=Math.max(2,Number(p.skills.fast||0));
        else if(latencyMs<=2000) p.skills.fast=Math.max(1,Number(p.skills.fast||0));
      }
      const stamp=dayStamp(now);
      p.successDates=[...new Set([...(p.successDates||[]),stamp])].slice(-12);
      const schedule=nextReviewSchedule(p,rating);
      p.reviewStep=schedule.step;
      p.intervalDays=schedule.days;
      p.nextReviewAt=now+schedule.delay;
      p.mastered=p.skills.recognize>=2&&p.skills.recall>=2&&p.skills.use>=2;
      p.automatic=automaticStatus(p).automatic;
      session.stats.correct++;
    }
    persist(card,p);
    return p;
  }

  function dueRank(card){
    const p=progressFor(card);
    if(p.reviewCount&&p.nextReviewAt&&p.nextReviewAt<=Date.now()) return 0;
    if(!p.reviewCount) return 1;
    if(p.mastered) return 4;
    return 2;
  }

  function allStudyChunks(){
    return packs().flatMap(pack=>studyChunks(pack));
  }

  function reviewCandidates(saved=env?.state?.saved||{}){
    const reviewed=allStudyChunks().filter(card=>progressFor(card,saved).reviewCount>0);
    const now=Date.now();
    const due=reviewed
      .filter(card=>Number(progressFor(card,saved).nextReviewAt||0)<=now)
      .sort((a,b)=>Number(progressFor(a,saved).nextReviewAt||0)-Number(progressFor(b,saved).nextReviewAt||0));
    if(due.length) return due;
    return reviewed
      .sort((a,b)=>Number(progressFor(a,saved).lastReviewedAt||0)-Number(progressFor(b,saved).lastReviewedAt||0))
      .slice(0,10);
  }

  function reviewCount(saved={}){
    return reviewCandidates(saved).length;
  }

  function requeueCurrent(card){
    if(!session||!card) return;
    session.retryCounts=session.retryCounts||{};
    const count=Number(session.retryCounts[card.key]||0);
    if(count>=2) return;
    session.retryCounts[card.key]=count+1;
    const insertAt=Math.min(session.cards.length,session.index+3);
    session.cards.splice(insertAt,0,card);
  }

  function chooseVariant(card){
    const p=progressFor(card);
    const list=card.examples?.length?card.examples:[{en:card.modelEn,vi:card.modelVi,phraseEn:card.phraseEn,phraseVi:card.phraseVi}];
    const idx=(Number(p.reviewCount||0)+card.index)%list.length;
    return list[idx]||list[0];
  }

  function buildSession(overrides={}){
    const stored=settings();
    const persistentOverrides={...(overrides||{})};
    delete persistentOverrides.reviewToday;
    Object.assign(stored,persistentOverrides);
    env.saveState();
    const s={...stored,...(overrides||{})};
    const isReview=!!s.reviewToday;
    const pack=packById(s.lessonId);
    let cards=isReview?reviewCandidates():studyChunks(pack);

    if(!isReview&&s.mode==='mix'){
      cards=allStudyChunks().filter(x=>x.kind!=='building');
    }else if(!isReview&&['guided','fast','variation','situation'].includes(s.mode)){
      cards=cards.filter(x=>x.kind!=='building');
    }

    if(!isReview&&s.priority==='core') cards=cards.filter(x=>x.priority==='core');

    if(s.order==='random') cards=[...cards].sort(()=>Math.random()-.5);
    else if(!isReview) cards=[...cards].sort((a,b)=>{
      const ar=dueRank(a),br=dueRank(b);
      if(ar!==br) return ar-br;
      return Number(progressFor(a).nextReviewAt||0)-Number(progressFor(b).nextReviewAt||0);
    });

    const n=s.size==='all'?cards.length:Math.max(1,Number(s.size)||10);
    cards=cards.slice(0,n);

    session={
      pack,
      cards,
      index:0,
      options:{...s,reviewToday:isReview},
      revealed:false,
      hintLevel:0,
      attempts:0,
      result:null,
      inputValue:'',
      variant:null,
      guidedStep:0,
      guidedAnswer:[],
      stats:{correct:0,wrong:0},
      history:[],
      retryCounts:{},
      cardStartedAt:0,
      fastStarted:false,
      fastListening:false,
      fastReactionMs:0,
      fastTranscript:'',
      fastResult:null
    };
    prepareCard();
  }

  function currentCard(){
    return session?.cards?.[session.index]||null;
  }

  function prepareCard(){
    const card=currentCard();
    if(!card) return;
    session.revealed=false;
    session.hintLevel=0;
    session.attempts=0;
    session.result=null;
    session.inputValue='';
    session.failureRecorded=false;
    session.guidedStep=0;
    session.guidedAnswer=[];
    session.variant=chooseVariant(card);
    session.cardStartedAt=performance.now();
    session.fastStarted=false;
    session.fastListening=false;
    session.fastReactionMs=0;
    session.fastTranscript='';
    session.fastResult=null;
  }

  function nextCard(){
    if(session.index>=session.cards.length-1){renderSummary();return;}
    session.index++;
    prepareCard();
    render();
  }

  function prevCard(){
    if(session.index<=0) return;
    session.index--;
    prepareCard();
    render();
  }

  function toggleStar(){
    const card=currentCard();
    if(!card) return;
    const p=progressFor(card);
    p.starred=!p.starred;
    persist(card,p);
    render();
  }

  function modeInfo(mode){
    return {
      learn:{name:'HIỂU & NHẬN RA',title:'Nghe · hiểu · 5 cách dùng',skill:'Learn'},
      write:{name:'ACTIVE RECALL',title:'Ý tiếng Việt → tự gọi chunk',skill:'Recall'},
      fast:{name:'FAST RECALL',title:'Bật chunk ra bằng giọng nói thật nhanh',skill:'Speed'},
      variation:{name:'BIẾN ĐỔI',title:'Giữ chunk cố định · thay phần có thể thay',skill:'Variation'},
      mix:{name:'CONFUSION TRAINING',title:'Trộn các cụm dễ nhầm trên toàn hệ thống',skill:'Discrimination'},
      cloze:{name:'ĐIỀN CỤM',title:'Điền chunk theo ngữ cảnh thật',skill:'Recall'},
      situation:{name:'TÌNH HUỐNG',title:'Từ ý định → tự tạo câu tiếng Anh',skill:'Transfer'},
      sentence:{name:'VIỆT → CÂU ANH',title:'Tự viết cả câu đã học',skill:'Use'},
      guided:{name:'GHÉP & DÙNG CỤM',title:'Chunk → biến đổi → câu → tình huống',skill:'Use'}
    }[mode]||{name:'ACTIVE CHUNK',title:'Luyện cụm',skill:'Review'};
  }

  function skillPills(card){
    const p=progressFor(card);
    const s=p.skills||{};
    const auto=automaticStatus(p).automatic;
    return `<div class="chunk-skill-pills">
      <span class="${s.recognize>=2?'done':''}">1 · Nhận ra</span>
      <span class="${s.recall>=2?'done':''}">2 · Gọi ra</span>
      <span class="${s.fast>=2?'done':''}">3 · Nhanh</span>
      <span class="${s.vary>=2&&s.situation>=2?'done':''}">4 · Linh hoạt</span>
      <span class="${auto?'done automatic':''}">5 · Automatic</span>
    </div>`;
  }

  function audioButtons(text){
    return `<div class="chunk-audio-row">
      <button data-chunk-speak="${esc(text)}" data-rate="0.68" type="button">${env.uiIcon('volume-2')}<span>Chậm</span></button>
      <button data-chunk-speak="${esc(text)}" data-rate="0.92" type="button">${env.uiIcon('volume-2')}<span>Tự nhiên</span></button>
    </div>`;
  }

  function usageExampleMarkup(card,text=''){
    const fixed=new Set(
      tokens(card?.baseEn||'')
        .filter(token=>!isGenericSlot(token))
        .map(stem)
    );
    return String(text||'').split(/\s+/).filter(Boolean).map(word=>{
      const key=stem(normalize(word));
      const html=esc(word);
      return key&&fixed.has(key)?`<span>${html}</span>`:`<strong>${html}</strong>`;
    }).join(' ');
  }

  function usageExamplesHTML(card){
    const list=card?.usageExamples||[];
    if(!list.length) return '';
    return `<section class="chunk-usage-examples">
      <div class="chunk-usage-head"><span>5 CÁCH DÙNG THƯỜNG GẶP</span><small>Giữ chunk cố định · thay phần in đậm</small></div>
      <div class="chunk-usage-list">${list.map((text,i)=>`
        <article>
          <em>${i+1}</em>
          <div>${usageExampleMarkup(card,text)}</div>
          <button data-chunk-speak="${esc(text)}" data-rate="0.92" type="button" aria-label="Nghe cách dùng ${i+1}">${env.uiIcon('volume-2')}</button>
        </article>`).join('')}</div>
    </section>`;
  }

  function learnHTML(card){
    return `<div class="chunk-study-card">
      <div class="chunk-card-head">${skillPills(card)}<button id="chunkStar" class="chunk-star ${progressFor(card).starred?'active':''}" type="button">★</button></div>
      <span class="chunk-priority">${card.kind==='building'?'KHỐI BỔ TRỢ':card.priority==='core'?'CHUNK CHÍNH · ƯU TIÊN':'CHUNK CHÍNH · MỞ RỘNG'}</span>
      <h2>${esc(card.baseEn)}</h2>
      ${audioButtons(card.baseEn)}
      ${session.revealed?`
        <div class="chunk-meaning"><strong>${esc(card.baseVi)}</strong></div>
        ${usageExamplesHTML(card)}
        <div class="chunk-in-context"><span>Ví dụ trong câu hoàn chỉnh</span><b>${esc(session.variant.en)}</b><small>${esc(session.variant.vi)}</small></div>
        <div class="chunk-rating-row">
          <button data-learn-rate="again" type="button"><b>Chưa nhớ</b><span>Đưa lại sớm</span></button>
          <button data-learn-rate="hard" type="button"><b>Nhận chậm</b><span>Phải nghĩ</span></button>
          <button data-learn-rate="good" type="button"><b>Hiểu ngay</b><span>Đã nhận ra</span></button>
        </div>
      `:`<button id="revealChunkMeaning" class="chunk-primary-action" type="button">Tôi đã thử nhớ · xem nghĩa</button>`}
    </div>`;
  }

  function hintText(card,expected,kind){
    const words=tokens(expected);
    if(session.hintLevel<=0) return '';
    if(session.hintLevel===1) return words.length?`${words[0]}…`:'';
    if(session.hintLevel===2) return kind==='sentence'?`Cụm chính: ${card.baseEn}`:`${card.baseEn}…`;
    const count=Math.max(1,Math.ceil(words.length*.6));
    return words.slice(0,count).join(' ')+' …';
  }

  function isGenericSlot(token=''){
    const t=String(token).toLowerCase().replace(/[’]/g,"'");
    return ['someone',"someone's",'somebody',"somebody's",'something','somewhere','somehow'].includes(t);
  }

  function contextualChunk(card,variant){
    const v=variant||session.variant||chooseVariant(card);
    const sentence=String(v?.en||card.modelEn||'').trim();
    const phrase=String(
      v?.phraseEn||
      (sentence?stripEnglish(card.pack,sentence):'')||
      card.phraseEn||
      card.baseEn||
      ''
    ).trim();

    const base=String(card.baseEn||'').trim();
    const baseTokens=tokens(base);
    const phraseTokens=tokens(phrase);
    const slotIndexes=baseTokens.map((token,index)=>isGenericSlot(token)?index:-1).filter(index=>index>=0);

    if(!slotIndexes.length){
      const at=phrase.toLowerCase().indexOf(base.toLowerCase());
      return at>=0?phrase.slice(at,at+base.length):base||phrase;
    }

    // A generic slot is a variable, not a literal answer:
    // get someone's opinion -> get your opinion
    // get something done -> get this done
    // go somewhere else -> go home / go somewhere else
    const lastSlot=slotIndexes[slotIndexes.length-1];
    const suffix=baseTokens.slice(lastSlot+1);

    if(suffix.length&&phraseTokens.length){
      const suffixStems=suffix.map(stem);
      for(let start=0;start<=phraseTokens.length-suffix.length;start++){
        const candidate=phraseTokens.slice(start,start+suffix.length).map(stem);
        if(candidate.every((token,index)=>token===suffixStems[index])){
          return phraseTokens.slice(0,start+suffix.length).join(' ');
        }
      }
    }

    // If the generic slot is at the end, the remaining contextual phrase is
    // the concrete realization used by the example sentence.
    return phrase||base;
  }

  function variablePart(card,text=''){
    const fixed=tokens(card?.baseEn||'').filter(token=>!isGenericSlot(token)).map(stem);
    const words=String(text||'').replace(/[?.!]+$/,'').split(/\s+/).filter(Boolean);
    let cursor=0;
    const variable=[];
    words.forEach(word=>{
      const key=stem(normalize(word));
      if(cursor<fixed.length&&key===fixed[cursor]) cursor++;
      else variable.push(word);
    });
    return variable.join(' ').trim();
  }

  function variationSpec(card){
    const list=card.usageExamples?.length?card.usageExamples:[card.modelEn||card.baseEn];
    const p=progressFor(card);
    const target=String(list[(Number(p.reviewCount||0)+card.index)%list.length]||list[0]||card.baseEn);
    const variable=variablePart(card,target);
    return {
      eyebrow:'BIẾN ĐỔI CHUNK',
      prompt:variable?('Ghép với: '+variable):card.baseVi,
      sub:card.baseVi,
      expected:target,
      context:target,
      contextVi:'',
      placeholder:'Gõ cả cụm đã biến đổi…',
      skill:'vary',
      writing:true
    };
  }

  function situationSpec(card){
    const v=session.variant||chooseVariant(card);
    return {
      eyebrow:'TÌNH HUỐNG → ENGLISH',
      prompt:v.vi||card.modelVi||card.baseVi,
      sub:'Không dịch từng chữ. Hãy bật ra một câu tự nhiên cho tình huống này.',
      expected:v.en||card.modelEn,
      context:v.en||card.modelEn,
      contextVi:v.vi||card.modelVi,
      placeholder:'Tự nói hoặc gõ câu tiếng Anh…',
      skill:'situation',
      writing:true
    };
  }

  function confusionPeers(card){
    const head=tokens(card.baseEn)[0]||'';
    const groups={
      take:['take','make','get'],
      make:['make','take','get'],
      get:['get','make','take'],
      go:['go','look','figure'],
      look:['look','go','figure'],
      figure:['figure','look','go'],
      follow:['follow','get'],
      work:['work','deal','take'],
      deal:['deal','work','take']
    };
    const heads=groups[head]||[head];
    return allStudyChunks()
      .filter(x=>x.kind!=='building'&&x.key!==card.key&&heads.includes(tokens(x.baseEn)[0]))
      .filter((x,i,arr)=>arr.findIndex(y=>normalize(y.baseEn)===normalize(x.baseEn))===i)
      .slice(0,4);
  }

  function confusionHTML(card){
    const peers=confusionPeers(card);
    if(!peers.length) return '';
    return `<div class="chunk-confusion-note">
      <span>PHÂN BIỆT NHANH</span>
      <div>${[card,...peers].slice(0,4).map(x=>`<b>${esc(x.baseEn)}</b>`).join('')}</div>
    </div>`;
  }

  function clozeSpec(card,variant){
    const v=variant||session.variant||chooseVariant(card);
    const sentence=String(v?.en||card.modelEn||'').trim();
    const expected=contextualChunk(card,v);
    const lower=sentence.toLowerCase();
    const needle=String(expected||'').toLowerCase();
    const at=needle?lower.indexOf(needle):-1;

    if(sentence&&at>=0){
      return {
        prompt:sentence.slice(0,at)+'______'+sentence.slice(at+expected.length),
        expected
      };
    }

    return {
      prompt:`${prefixEn(card.pack)} ______${[6,7].includes(Number(card.pack.order))?'?':'.'}`,
      expected:expected||card.baseEn
    };
  }

  function typingSpec(card,mode=session.options.mode){
    const v=session.variant||chooseVariant(card);
    if(mode==='write'||mode==='mix'){
      return {
        eyebrow:mode==='mix'?'CONFUSION TRAINING':card.kind==='building'?'VIỆT → KHỐI BỔ TRỢ':'Ý → CHUNK',
        prompt:card.baseVi,
        sub:mode==='mix'?'Các cụm được trộn trên toàn hệ thống. Không đoán động từ; hãy gọi cả chunk như một khối.':'',
        expected:card.baseEn,
        context:card.modelEn||v.en,
        contextVi:card.modelVi||v.vi,
        placeholder:'Gõ cụm tiếng Anh…',
        skill:mode==='mix'?'discriminate':'recall',
        writing:true
      };
    }
    if(mode==='variation') return variationSpec(card);
    if(mode==='situation') return situationSpec(card);
    if(mode==='cloze'){
      const cloze=clozeSpec(card,v);
      return {
        eyebrow:'ĐIỀN CHUNK VÀO CÂU',
        prompt:cloze.prompt,
        sub:v.vi||card.modelVi,
        expected:cloze.expected,
        context:v.en||card.modelEn,
        contextVi:v.vi||card.modelVi,
        placeholder:'Điền chunk còn thiếu…',
        skill:'recall',
        writing:true
      };
    }
    return {
      eyebrow:'VIỆT → CÂU ANH',
      prompt:v.vi||card.modelVi,
      expected:v.en||card.modelEn,
      context:v.en||card.modelEn,
      contextVi:v.vi||card.modelVi,
      placeholder:'Gõ cả câu tiếng Anh…',
      skill:'use',
      writing:true
    };
  }

  function typingHTML(card,mode=session.options.mode,specOverride=null){
    const spec=specOverride||typingSpec(card,mode);
    const hint=hintText(card,spec.expected,mode==='sentence'?'sentence':'phrase');
    const correct=!!session.result?.correct;
    return `<div class="chunk-study-card chunk-typing-card">
      <div class="chunk-card-head">${skillPills(card)}<button id="chunkStar" class="chunk-star ${progressFor(card).starred?'active':''}" type="button">★</button></div>
      <span class="chunk-priority">${esc(spec.eyebrow)}</span>
      <div class="chunk-writing-prompt">${esc(spec.prompt)}</div>
      ${spec.sub?`<div class="chunk-writing-sub">${esc(spec.sub)}</div>`:''}
      ${hint?`<div class="chunk-hint-box"><b>Gợi ý ${session.hintLevel}</b><span>${esc(hint)}</span></div>`:''}
      <div class="chunk-writing-box ${session.result?.correct?'is-correct':session.result?'is-wrong':''}">
        <input id="chunkAnswerInput" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(session.inputValue||'')}" placeholder="${esc(spec.placeholder)}" ${correct?'aria-readonly="true"':''}>
        ${!correct?`<button id="checkChunkAnswer" type="button">Kiểm tra</button>`:''}
      </div>
      ${session.result?`
        <div class="chunk-writing-feedback ${correct?'correct':'wrong'}">
          <strong>${correct?'✓ Đúng rồi':'Chưa đúng. Sửa lại rồi thử lần nữa.'}</strong>
          ${correct?`<div class="chunk-correct-answer">${esc(spec.expected)}</div>`:diffHTML(spec.expected,session.inputValue)}
          ${correct?`<div class="chunk-context-after"><b>${esc(spec.context)}</b><span>${esc(spec.contextVi)}</span>${audioButtons(spec.context)}</div>`:''}
          ${!correct&&mode==='mix'?confusionHTML(card):''}
        </div>`:''}
      <div class="chunk-writing-actions">
        ${!correct?`<button id="chunkHint" class="secondary-button" type="button" ${session.hintLevel>=3?'disabled':''}>Gợi ý ${Math.min(3,session.hintLevel+1)}</button>`:''}
        ${!correct&&session.attempts>0?`<button id="showChunkAnswer" class="text-button" type="button">Hiện đáp án</button>`:''}
        ${correct?`<button id="nextAfterWriting" class="primary-button" type="button">Tiếp tục →</button>`:''}
      </div>
      ${session.revealed&&!correct?`
        <div class="chunk-revealed-answer"><span>Đáp án</span><b>${esc(spec.expected)}</b>${audioButtons(spec.expected)}
          <button id="copyAnswerToInput" class="secondary-button" type="button">Gõ lại đáp án</button>
        </div>`:''}
    </div>`;
  }

  function fastLabel(ms){
    const n=Number(ms||0);
    if(!n) return '';
    if(n<800) return 'Candidate Automatic';
    if(n<=1000) return 'Rất nhanh';
    if(n<=2000) return 'Khá tốt';
    if(n<=3000) return 'Đang nhớ';
    return 'Chưa chủ động';
  }

  function fastHTML(card){
    const result=session.fastResult;
    const listening=session.fastListening;
    const started=session.fastStarted;
    const p=progressFor(card);
    return `<div class="chunk-study-card chunk-fast-card">
      <div class="chunk-card-head">${skillPills(card)}<button id="chunkStar" class="chunk-star ${p.starred?'active':''}" type="button">★</button></div>
      <span class="chunk-priority">FAST RECALL · Ý → ENGLISH</span>
      ${!started?`
        <div class="fast-recall-ready">
          <h2>Không nhìn English trước.</h2>
          <p>Khi bấm bắt đầu, ý tiếng Việt xuất hiện và mic mở ngay. Hãy nói chunk đầu tiên bật ra trong đầu.</p>
          <button id="startFastRecall" class="chunk-primary-action" type="button">Bắt đầu phản xạ</button>
        </div>
      `:`
        <div class="fast-recall-prompt">
          <span>Ý cần bật ra</span>
          <h2>${esc(card.baseVi)}</h2>
          <div class="fast-recall-live ${listening?'is-listening':''}">
            <i></i><b>${listening?'Đang nghe · nói ngay':'Đã nhận câu trả lời'}</b>
          </div>
        </div>
        ${result?`
          <div class="fast-recall-result ${result.correct?'correct':'wrong'}">
            <strong>${result.correct?'✓ Đúng chunk':'Chưa đúng chunk'}</strong>
            <div class="fast-recall-transcript">Bạn nói: <b>${esc(result.transcript||'—')}</b></div>
            ${result.correct?`
              <div class="fast-recall-speed"><b>${(Number(result.latencyMs||0)/1000).toFixed(2)}s</b><span>${fastLabel(result.latencyMs)}</span></div>
              <div class="chunk-correct-answer">${esc(card.baseEn)}</div>
              ${audioButtons(card.baseEn)}
            `:`
              ${diffHTML(card.baseEn,result.transcript||'')}
              ${session.revealed?`<div class="chunk-revealed-answer"><span>Đáp án</span><b>${esc(card.baseEn)}</b>${audioButtons(card.baseEn)}</div>`:''}
            `}
          </div>
          <div class="chunk-writing-actions">
            ${result.correct?'<button id="nextFastRecall" class="primary-button" type="button">Tiếp tục →</button>':'<button id="retryFastRecall" class="primary-button" type="button">Nói lại</button><button id="showFastAnswer" class="text-button" type="button">Hiện đáp án</button>'}
          </div>
        `:''}
      `}
    </div>`;
  }

  function startFastRecognition(card){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){
      env.toast('Thiết bị này chưa hỗ trợ Fast Recall bằng giọng nói. Chuyển sang Active Recall.');
      session.options.mode='write';
      renderCard();
      return;
    }
    session.fastStarted=true;
    session.fastListening=true;
    session.fastResult=null;
    session.revealed=false;
    session.failureRecorded=false;
    session.fastStartAt=performance.now();
    session.fastReactionMs=0;
    renderCard();

    const r=new SR();
    r.lang='en-US';
    r.interimResults=false;
    r.maxAlternatives=1;
    r.onspeechstart=()=>{
      session.fastReactionMs=Math.max(1,performance.now()-session.fastStartAt);
    };
    r.onresult=e=>{
      const transcript=String(e.results?.[0]?.[0]?.transcript||'').trim();
      const latency=Math.max(1,session.fastReactionMs||performance.now()-session.fastStartAt);
      const correct=normalize(transcript)===normalize(card.baseEn);
      session.fastListening=false;
      session.fastTranscript=transcript;
      session.fastReactionMs=latency;
      session.fastResult={correct,transcript,latencyMs:latency};
      if(correct){
        const rating=latency<=1000?'easy':latency<=3000?'good':'hard';
        record(card,{rating,skill:'fast',latencyMs:latency});
      }else if(!session.failureRecorded){
        record(card,{rating:'again',skill:'fast'});
        session.failureRecorded=true;
      }
      renderCard();
    };
    r.onerror=()=>{
      session.fastListening=false;
      session.fastResult={correct:false,transcript:'',latencyMs:0,error:true};
      renderCard();
      env.toast('Không nhận được giọng nói. Hãy thử lại.');
    };
    try{r.start();}catch(error){
      session.fastListening=false;
      session.fastResult={correct:false,transcript:'',latencyMs:0,error:true};
      renderCard();
    }
  }

  function bindFast(card){
    $('#startFastRecall')?.addEventListener('click',()=>startFastRecognition(card));
    $('#retryFastRecall')?.addEventListener('click',()=>startFastRecognition(card));
    $('#showFastAnswer')?.addEventListener('click',()=>{
      session.revealed=true;
      renderCard();
    });
    $('#nextFastRecall')?.addEventListener('click',nextCard);
  }

  function guidedSteps(){
    return [
      ['1','Chunk nhỏ'],
      ['2','Chunk mở rộng'],
      ['3','Ghép chunk'],
      ['4','Câu hoàn chỉnh'],
      ['5','Tình huống']
    ];
  }

  function extensionFor(card,variant){
    const sentence=String(variant?.en||card.modelEn||'').toLowerCase();
    const baseTokens=contentTokens(card.baseEn);
    const blocks=studyChunks(card.pack).filter(x=>{
      if(x.kind!=='building'||x.key===card.key) return false;
      const extTokens=contentTokens(x.baseEn);
      const overlap=baseTokens.length?baseTokens.filter(t=>extTokens.includes(t)).length/baseTokens.length:0;
      return overlap<0.6;
    });
    const exact=blocks
      .filter(x=>sentence.includes(String(x.baseEn||'').toLowerCase()))
      .sort((a,b)=>b.baseEn.length-a.baseEn.length);
    return exact[0]||blocks.find(x=>String(x.modelEn||'').toLowerCase()===String(card.modelEn||'').toLowerCase())||null;
  }

  function assemblyBlocks(card,variant,extension){
    const blocks=[prefixEn(card.pack),card.baseEn];
    if(extension){
      const phrase=stripEnglish(card.pack,variant?.en||card.modelEn||'');
      const baseAt=phrase.toLowerCase().indexOf(card.baseEn.toLowerCase());
      const extAt=phrase.toLowerCase().indexOf(extension.baseEn.toLowerCase());
      if(baseAt>=0&&extAt>baseAt){
        const between=phrase.slice(baseAt+card.baseEn.length,extAt).trim();
        if(between&&tokens(between).length<=3) blocks.push(between);
      }
      blocks.push(extension.baseEn);
    }
    return blocks.filter(Boolean);
  }

  function guidedStepper(){
    return `<div class="guided-stepper">${guidedSteps().map((x,i)=>`<span class="${i<session.guidedStep?'done':i===session.guidedStep?'active':''}"><b>${x[0]}</b>${x[1]}</span>`).join('<i></i>')}</div>`;
  }

  function alternativeVariant(card){
    return card.examples?.[1]||card.examples?.[0]||session.variant;
  }

  function choiceOptions(card){
    const all=studyChunks(card.pack);
    const others=all.filter(x=>x.key!==card.key).sort(()=>Math.random()-.5).slice(0,3);
    return [...others,card].sort(()=>Math.random()-.5);
  }

  function guidedSmallSpec(card){
    return {
      eyebrow:'1 · CHUNK NHỎ',
      prompt:card.baseVi,
      expected:card.baseEn,
      context:card.modelEn,
      contextVi:card.modelVi,
      placeholder:'Gõ chunk nhỏ…',
      skill:'recall',
      writing:true
    };
  }
  
  function guidedExtensionSpec(card,variant){
    const extension=extensionFor(card,variant);
    if(!extension) return null;
    return {
      eyebrow:'2 · CHUNK MỞ RỘNG',
      prompt:extension.baseVi,
      expected:extension.baseEn,
      context:extension.modelEn,
      contextVi:extension.modelVi,
      placeholder:'Gõ khối bổ trợ…',
      skill:'recall',
      writing:true,
      extension
    };
  }
  
  function guidedHTML(card){
    const step=session.guidedStep;
    const variant=session.variant;
    const extension=extensionFor(card,variant);
  
    if(step===0){
      return `<div class="guided-wrap">${guidedStepper()}${typingHTML(card,'write',guidedSmallSpec(card))}</div>`;
    }
  
    if(step===1){
      const spec=guidedExtensionSpec(card,variant);
      if(!spec){
        return `<div class="chunk-study-card guided-choice-card">
          <div class="chunk-card-head">${skillPills(card)}<button id="chunkStar" class="chunk-star ${progressFor(card).starred?'active':''}" type="button">★</button></div>
          ${guidedStepper()}
          <span class="chunk-priority">2 · CHUNK MỞ RỘNG</span>
          <div class="chunk-writing-prompt">${esc(card.baseEn)}</div>
          <div class="chunk-layer-note">Cụm này đã đủ ngắn và chưa cần tách thêm trong câu hiện tại. Không ép học một đoạn dài chỉ để đủ bước.</div>
          <button id="skipGuidedExtension" class="primary-button" type="button">Sang bước ghép chunk →</button>
        </div>`;
      }
      return `<div class="guided-wrap">${guidedStepper()}${typingHTML(card,'write',spec)}</div>`;
    }
  
    if(step===2){
      const ordered=assemblyBlocks(card,variant,extension);
      if(!session.guidedBlocks) session.guidedBlocks=[...ordered].sort(()=>Math.random()-.5);
      const assembled=session.guidedAnswer.join(' ');
      return `<div class="chunk-study-card guided-assemble-card">
        <div class="chunk-card-head">${skillPills(card)}<button id="chunkStar" class="chunk-star ${progressFor(card).starred?'active':''}" type="button">★</button></div>
        ${guidedStepper()}
        <span class="chunk-priority">3 · GHÉP CHUNK</span>
        <div class="chunk-writing-prompt">${esc(variant.vi||card.modelVi)}</div>
        <div class="chunk-layer-map">
          <span><b>Mẫu câu</b>${esc(prefixEn(card.pack))}</span>
          <span><b>Chunk chính</b>${esc(card.baseEn)}</span>
          ${extension?`<span><b>Khối bổ trợ</b>${esc(extension.baseEn)}</span>`:''}
        </div>
        <div class="guided-answer-slot">${assembled?esc(assembled):'Chạm từng khối theo thứ tự để ghép câu'}</div>
        <div class="guided-blocks">${session.guidedBlocks.map((x,i)=>`<button data-guided-block="${i}" type="button" ${session.guidedUsed?.includes(i)?'disabled':''}>${esc(x)}</button>`).join('')}</div>
        <div class="chunk-writing-actions"><button id="resetGuidedBlocks" class="secondary-button" type="button">Làm lại</button><button id="checkGuidedBlocks" class="primary-button" type="button">Kiểm tra</button></div>
        ${session.result?`<div class="chunk-writing-feedback ${session.result.correct?'correct':'wrong'}"><strong>${session.result.correct?'✓ Ghép đúng các khối':'Chưa đúng thứ tự. Hãy nhìn lại từng khối.'}</strong></div>`:''}
      </div>`;
    }
  
    if(step===3){
      const spec={
        eyebrow:'4 · CÂU HOÀN CHỈNH',
        prompt:variant.vi||card.modelVi,
        sub:`Bạn đã học riêng: ${card.baseEn}${extension?' + '+extension.baseEn:''}`,
        expected:variant.en||card.modelEn,
        context:variant.en||card.modelEn,
        contextVi:variant.vi||card.modelVi,
        placeholder:'Viết cả câu sau khi đã học các khối…',
        skill:'use',
        writing:true
      };
      return `<div class="guided-wrap">${guidedStepper()}${typingHTML(card,'sentence',spec)}</div>`;
    }
  
    return `<div class="chunk-study-card guided-situation-card">
      <div class="chunk-card-head">${skillPills(card)}<button id="chunkStar" class="chunk-star ${progressFor(card).starred?'active':''}" type="button">★</button></div>
      ${guidedStepper()}
      <span class="chunk-priority">5 · TÌNH HUỐNG</span>
      <div class="guided-situation">
        <b>Tình huống có kiểm soát</b>
        <p>Bạn cần diễn đạt ý: <strong>${esc(variant.vi||card.modelVi)}</strong></p>
        <small>Hãy lấy các khối đã học ra dùng. Bạn chưa phải tự sáng tác nội dung từ số 0.</small>
      </div>
      ${!session.revealed?`
        <button id="showSituationHint" class="secondary-button" type="button">Xem các khối gợi ý</button>
        ${session.hintLevel?`<div class="chunk-layer-map">
          <span><b>Mẫu</b>${esc(prefixEn(card.pack))}</span>
          <span><b>Chunk</b>${esc(card.baseEn)}</span>
          ${extension?`<span><b>Bổ trợ</b>${esc(extension.baseEn)}</span>`:''}
        </div>`:''}
        <button id="revealSituationAnswer" class="chunk-primary-action" type="button">Tôi đã thử nói · xem câu mẫu</button>
      `:`
        <div class="chunk-correct-answer">${esc(variant.en||card.modelEn)}</div>
        ${audioButtons(variant.en||card.modelEn)}
        <div class="chunk-rating-row">
          <button data-guided-rate="again" type="button"><b>Chưa nói được</b><span>Đưa lại sớm</span></button>
          <button data-guided-rate="good" type="button"><b>Nói được</b><span>Lấy các khối ra được</span></button>
          <button data-guided-rate="easy" type="button"><b>Tự động</b><span>Bật ra nhanh</span></button>
        </div>
      `}
    </div>`;
  }

  function renderCard(){
    const card=currentCard();
    if(!card){renderEmpty();return;}
    const mode=session.options.mode;
    const info=modeInfo(mode);
    const root=$('#vocabTrainerRoot');
    if(!root) return;

    root.innerHTML=`
      <div class="vocab-trainer-topbar">
        <button id="vocabTrainerClose" class="vocab-trainer-round" type="button" aria-label="Đóng">${env.uiIcon('x')}</button>
        <div class="vocab-trainer-counter"><strong>${session.index+1} / ${session.cards.length}</strong><span>${esc(session.options.reviewToday?'Ôn tổng hợp':session.pack.pattern)}</span></div>
        <button id="vocabTrainerSettings" class="vocab-trainer-round" type="button" aria-label="Tùy chọn">${env.uiIcon('settings')}</button>
      </div>
      <div class="vocab-trainer-progress"><i style="width:${Math.round(((session.index+1)/Math.max(1,session.cards.length))*100)}%"></i></div>
      <div class="chunk-mode-intro"><span>${esc(info.name)}</span><strong>${esc(info.title)}</strong><p>Mục tiêu hiện tại: ${esc(info.skill)}</p></div>
      <div class="vocab-trainer-stage">
        ${mode==='learn'?learnHTML(card):mode==='fast'?fastHTML(card):mode==='guided'?guidedHTML(card):typingHTML(card,mode)}
      </div>
      <div class="vocab-trainer-bottom">
        <button id="vocabPrev" class="vocab-bottom-text" type="button" ${session.index<=0?'disabled':''}>← Trước</button>
        <button id="vocabTrainerSettingsBottom" class="vocab-bottom-icon" type="button" aria-label="Tùy chọn">${env.uiIcon('settings')}</button>
        <button id="vocabNext" class="vocab-bottom-text" type="button">Sau →</button>
      </div>
      <div id="vocabSettingsSheet"></div>`;
    bindCard();
  }

  function bindAudio(){
    $$('[data-chunk-speak]').forEach(btn=>btn.onclick=()=>{
      const rate=Number(btn.dataset.rate||0.92);
      env.speak(btn.dataset.chunkSpeak,null,rate);
    });
  }

  function isMobileTypingDevice(){
    return !!(window.matchMedia?.('(max-width: 820px), (pointer: coarse)')?.matches);
  }

  function updateTypingViewport(){
    const vv=window.visualViewport;
    const height=Math.max(320,Math.round(vv?.height||window.innerHeight||document.documentElement.clientHeight||0));
    const offsetTop=Math.max(0,Math.round(vv?.offsetTop||0));
    const offsetLeft=Math.max(0,Math.round(vv?.offsetLeft||0));

    document.documentElement.style.setProperty('--vocab-visual-height',height+'px');
    document.documentElement.style.setProperty('--vocab-visual-top',offsetTop+'px');
    document.documentElement.style.setProperty('--vocab-visual-left',offsetLeft+'px');

    const base=Math.max(window.innerHeight||0,document.documentElement.clientHeight||0);
    const keyboardOpen=isMobileTypingDevice()&&!!vv&&(base-vv.height>120);
    document.documentElement.classList.toggle('vocab-keyboard-open',keyboardOpen);
  }

  function rememberTypingScroll(){
    if(!session||!isMobileTypingDevice()) return;
    const root=$('#vocabTrainerRoot');
    if(root) session.typingScrollTop=root.scrollTop;
  }

  function keepTypingInputVisible(input){
    if(!input||!isMobileTypingDevice()) return;
    updateTypingViewport();
    const root=$('#vocabTrainerRoot');
    if(!root) return;

    const startTop=Number.isFinite(Number(session?.typingScrollTop))
      ? Number(session.typingScrollTop)
      : root.scrollTop;

    const align=(restore=false)=>{
      if(!document.body.contains(input)) return;
      updateTypingViewport();

      // iOS may auto-scroll the fixed trainer when the keyboard opens.
      // Restore the position that the learner had before tapping the input,
      // then move only the minimum amount needed to keep the field visible.
      if(restore){
        const maxTop=Math.max(0,root.scrollHeight-root.clientHeight);
        root.scrollTop=Math.max(0,Math.min(maxTop,startTop));
      }

      const vv=window.visualViewport;
      const viewportTop=Number(vv?.offsetTop||0);
      const viewportBottom=viewportTop+Number(vv?.height||window.innerHeight||0);
      const rect=input.getBoundingClientRect();
      const safeTop=viewportTop+88;
      const safeBottom=viewportBottom-118;
      let delta=0;

      if(rect.bottom>safeBottom) delta=rect.bottom-safeBottom;
      else if(rect.top<safeTop) delta=rect.top-safeTop;

      // Never recenter the card. Move only the minimum amount necessary
      // to keep the input between the trainer header and keyboard.
      if(Math.abs(delta)>1) root.scrollTop+=delta;
    };

    requestAnimationFrame(()=>align(true));
    setTimeout(()=>align(true),220);
    setTimeout(()=>{
      align(false);
      if(session) delete session.typingScrollTop;
    },480);
  }

  function bindViewportTracking(){
    if(viewportHandler) return;
    viewportHandler=()=>updateTypingViewport();
    window.visualViewport?.addEventListener('resize',viewportHandler);
    window.visualViewport?.addEventListener('scroll',viewportHandler);
    window.addEventListener('resize',viewportHandler);
    updateTypingViewport();
  }

  function unbindViewportTracking(){
    if(viewportHandler){
      window.visualViewport?.removeEventListener('resize',viewportHandler);
      window.visualViewport?.removeEventListener('scroll',viewportHandler);
      window.removeEventListener('resize',viewportHandler);
      viewportHandler=null;
    }
    document.documentElement.classList.remove('vocab-keyboard-open');
    document.documentElement.style.removeProperty('--vocab-visual-height');
    document.documentElement.style.removeProperty('--vocab-visual-top');
    document.documentElement.style.removeProperty('--vocab-visual-left');
  }

  function submitTyping(card,specOverride=null,advanceGuided=false){
    const mode=session.options.mode;
    const spec=specOverride||typingSpec(card,mode);
    const input=$('#chunkAnswerInput');
    if(!input) return;
    session.inputValue=input.value;
    session.attempts++;
    const correct=normalize(session.inputValue)===normalize(spec.expected);
    session.result={correct,expected:spec.expected};

    if(correct){
      if(advanceGuided){
        session.result.correct=true;
      }else{
        record(card,{rating:session.attempts===1?'easy':'good',skill:spec.skill,writing:!!spec.writing});
      }
    }
    renderCard();
    if(correct && !advanceGuided && settings().autoSpeak){
      setTimeout(()=>env.speak(spec.expected,null,0.92),80);
    }
  }

  function bindTyping(card,specOverride=null,advanceGuided=false){
    const mode=session.options.mode;
    const spec=specOverride||typingSpec(card,mode);
    const input=$('#chunkAnswerInput');
    if(input){
      const mobile=isMobileTypingDevice();

      if(!mobile){
        input.focus({preventScroll:true});
      }else if(session.retainInputFocus){
        session.retainInputFocus=false;
        setTimeout(()=>{
          if(!document.body.contains(input)) return;
          rememberTypingScroll();
          input.focus({preventScroll:true});
          keepTypingInputVisible(input);
        },40);
      }

      const remember=()=>rememberTypingScroll();
      input.addEventListener('pointerdown',remember,{passive:true});
      input.addEventListener('touchstart',remember,{passive:true});

      input.addEventListener('focus',()=>{
        document.documentElement.classList.add('vocab-keyboard-open');
        keepTypingInputVisible(input);
      });
      input.addEventListener('blur',()=>{
        setTimeout(()=>{
          if(document.activeElement?.id!=='chunkAnswerInput'){
            document.documentElement.classList.remove('vocab-keyboard-open');
            updateTypingViewport();
          }
        },80);
      });
      input.oninput=()=>{
        if(session.result?.correct){
          input.value=session.inputValue;
          return;
        }
        session.inputValue=input.value;
      };
      input.addEventListener('beforeinput',e=>{
        if(session.result?.correct && e.inputType!=='insertLineBreak') e.preventDefault();
      });
      input.onkeydown=e=>{
        if(e.key==='Enter'){
          e.preventDefault();
          rememberTypingScroll();
          session.retainInputFocus=true;
          if(session.result?.correct){
            if(advanceGuided) advanceGuidedStep();
            else nextCard();
          }else submitTyping(card,specOverride,advanceGuided);
        }
      };
    }
    $('#checkChunkAnswer')?.addEventListener('click',()=>{
      rememberTypingScroll();
      session.retainInputFocus=isMobileTypingDevice();
      submitTyping(card,specOverride,advanceGuided);
    });
    $('#chunkHint')?.addEventListener('click',()=>{
      rememberTypingScroll();
      session.retainInputFocus=isMobileTypingDevice();
      session.hintLevel=Math.min(3,session.hintLevel+1);
      renderCard();
    });
    $('#showChunkAnswer')?.addEventListener('click',()=>{
      rememberTypingScroll();
      session.retainInputFocus=isMobileTypingDevice();
      if(!advanceGuided && !session.failureRecorded){
        record(card,{rating:'again',skill:spec.skill,writing:!!spec.writing});
        session.failureRecorded=true;
      }
      session.revealed=true;
      session.hintLevel=3;
      renderCard();
    });
    $('#copyAnswerToInput')?.addEventListener('click',()=>{
      session.inputValue=spec.expected;
      session.revealed=false;
      session.result=null;
      renderCard();
    });
    $('#nextAfterWriting')?.addEventListener('click',()=>{
      if(advanceGuided) advanceGuidedStep();
      else nextCard();
    });
  }

  function advanceGuidedStep(){
    session.guidedStep=Math.min(4,session.guidedStep+1);
    session.result=null;
    session.inputValue='';
    session.hintLevel=0;
    session.revealed=false;
    session.guidedAnswer=[];
    session.guidedBlocks=null;
    session.guidedUsed=[];
    session.guidedChoices=null;
    renderCard();
  }

  function bindGuided(card){
    const variant=session.variant;
  
    if(session.guidedStep===0){
      bindTyping(card,guidedSmallSpec(card),true);
      return;
    }
  
    if(session.guidedStep===1){
      const spec=guidedExtensionSpec(card,variant);
      if(spec){
        bindTyping(card,spec,true);
      }else{
        $('#skipGuidedExtension')?.addEventListener('click',advanceGuidedStep);
      }
      return;
    }
  
    if(session.guidedStep===2){
      const extension=extensionFor(card,variant);
      const ordered=assemblyBlocks(card,variant,extension);
      if(!session.guidedUsed) session.guidedUsed=[];
      $$('[data-guided-block]').forEach(btn=>btn.onclick=()=>{
        const i=Number(btn.dataset.guidedBlock);
        if(session.guidedUsed.includes(i)) return;
        session.guidedUsed.push(i);
        session.guidedAnswer.push(session.guidedBlocks[i]);
        renderCard();
      });
      $('#resetGuidedBlocks')?.addEventListener('click',()=>{
        session.guidedAnswer=[];
        session.guidedUsed=[];
        session.result=null;
        renderCard();
      });
      $('#checkGuidedBlocks')?.addEventListener('click',()=>{
        const expected=normalize(ordered.join(' '));
        const actual=normalize(session.guidedAnswer.join(' '));
        session.result={correct:expected===actual};
        if(session.result.correct) setTimeout(advanceGuidedStep,300);
        else renderCard();
      });
      return;
    }
  
    if(session.guidedStep===3){
      const extension=extensionFor(card,variant);
      const spec={
        eyebrow:'4 · CÂU HOÀN CHỈNH',
        prompt:variant.vi||card.modelVi,
        sub:`Bạn đã học riêng: ${card.baseEn}${extension?' + '+extension.baseEn:''}`,
        expected:variant.en||card.modelEn,
        context:variant.en||card.modelEn,
        contextVi:variant.vi||card.modelVi,
        placeholder:'Viết cả câu sau khi đã học các khối…',
        skill:'use',
        writing:true
      };
      bindTyping(card,spec,true);
      return;
    }
  
    $('#showSituationHint')?.addEventListener('click',()=>{
      session.hintLevel=1;
      renderCard();
    });
    $('#revealSituationAnswer')?.addEventListener('click',()=>{
      session.revealed=true;
      renderCard();
    });
    $$('[data-guided-rate]').forEach(btn=>btn.onclick=()=>{
      record(card,{rating:btn.dataset.guidedRate,skill:'use',writing:false});
      nextCard();
    });
  }

  function bindCard(){
    $('#vocabTrainerClose').onclick=close;
    $('#vocabTrainerSettings').onclick=openSettings;
    $('#vocabTrainerSettingsBottom').onclick=openSettings;
    $('#vocabPrev').onclick=prevCard;
    $('#vocabNext').onclick=nextCard;
    $('#chunkStar')?.addEventListener('click',toggleStar);

    bindAudio();

    const card=currentCard();
    const mode=session.options.mode;
    if(mode==='learn'){
      $('#revealChunkMeaning')?.addEventListener('click',()=>{
        session.revealed=true;
        renderCard();
      });
      $$('[data-learn-rate]').forEach(btn=>btn.onclick=()=>{
        record(card,{rating:btn.dataset.learnRate,skill:'recognize'});
        nextCard();
      });
    }else if(mode==='fast'){
      bindFast(card);
    }else if(mode==='guided'){
      bindGuided(card);
    }else{
      bindTyping(card);
    }
  }

  function settingsHTML(){
    const s=settings();
    return `<div class="vocab-settings-backdrop" id="vocabSettingsBackdrop">
      <section class="vocab-settings-sheet">
        <div class="vocab-settings-head"><h2>Tùy chọn buổi học</h2><button id="vocabSettingsClose" type="button" aria-label="Đóng">${env.uiIcon('x')}</button></div>
        <label class="vocab-settings-row"><span><b>Mẫu câu</b><small>10 cụm chính + các khối bổ trợ được web chọn sẵn</small></span>
          <select id="vocabLessonSelect">${packs().map(p=>`<option value="${p.lessonId}" ${p.lessonId===s.lessonId?'selected':''}>#${p.order} · ${esc(p.pattern)}</option>`).join('')}</select>
        </label>
        <label class="vocab-settings-row"><span><b>Cách luyện</b><small>Đổi giữa flashcard, viết và ứng dụng</small></span>
          <select id="vocabModeSelect">
            <option value="learn" ${s.mode==='learn'?'selected':''}>1 · Hiểu & Nhận ra</option>
            <option value="write" ${s.mode==='write'?'selected':''}>2 · Active Recall</option>
            <option value="fast" ${s.mode==='fast'?'selected':''}>3 · Fast Recall bằng giọng nói</option>
            <option value="variation" ${s.mode==='variation'?'selected':''}>4 · Biến đổi chunk</option>
            <option value="mix" ${s.mode==='mix'?'selected':''}>5 · Confusion Training</option>
            <option value="situation" ${s.mode==='situation'?'selected':''}>6 · Tình huống → English</option>
            <option value="cloze" ${s.mode==='cloze'?'selected':''}>Điền chunk vào câu</option>
            <option value="sentence" ${s.mode==='sentence'?'selected':''}>Việt → câu Anh</option>
            <option value="guided" ${s.mode==='guided'?'selected':''}>Use · Ghép → câu → tình huống</option>
          </select>
        </label>
        <label class="vocab-settings-row"><span><b>Số cụm</b><small>Phù hợp để tranh thủ học khi rảnh</small></span>
          <select id="vocabSizeSelect">${['5','10','all'].map(x=>`<option value="${x}" ${String(s.size)===x?'selected':''}>${x==='all'?'Tất cả':x+' cụm'}</option>`).join('')}</select>
        </label>
        <label class="vocab-settings-row"><span><b>Phạm vi</b><small>6 cụm ưu tiên hoặc toàn bộ cụm + khối bổ trợ</small></span>
          <select id="vocabPrioritySelect"><option value="all" ${s.priority==='all'?'selected':''}>Toàn bộ cụm + khối bổ trợ</option><option value="core" ${s.priority==='core'?'selected':''}>6 cụm ưu tiên</option></select>
        </label>
        <label class="vocab-settings-row"><span><b>Thứ tự</b><small>SRS ưu tiên cụm cần ôn</small></span>
          <select id="vocabOrderSelect"><option value="srs" ${s.order==='srs'?'selected':''}>Ưu tiên SRS</option><option value="random" ${s.order==='random'?'selected':''}>Ngẫu nhiên</option></select>
        </label>
        <label class="vocab-settings-toggle"><span><b>Tự phát đáp án sau khi viết đúng</b><small>Không phát trước khi bạn tự gọi lại</small></span><input id="vocabAutoSpeak" type="checkbox" ${s.autoSpeak?'checked':''}><i></i></label>
        <div class="vocab-settings-actions"><button id="vocabApplySettings" class="primary-button" type="button">Áp dụng & bắt đầu lại</button></div>
      </section>
    </div>`;
  }

  function openSettings(){
    const holder=$('#vocabSettingsSheet');
    if(!holder) return;
    holder.innerHTML=settingsHTML();
    $('#vocabSettingsClose').onclick=()=>holder.innerHTML='';
    $('#vocabSettingsBackdrop').onclick=e=>{if(e.target.id==='vocabSettingsBackdrop') holder.innerHTML='';};
    $('#vocabApplySettings').onclick=()=>{
      const s=settings();
      s.lessonId=$('#vocabLessonSelect').value;
      s.mode=$('#vocabModeSelect').value;
      s.size=$('#vocabSizeSelect').value;
      s.priority=$('#vocabPrioritySelect').value;
      s.order=$('#vocabOrderSelect').value;
      s.autoSpeak=$('#vocabAutoSpeak').checked;
      env.saveState();
      buildSession();
      render();
    };
  }

  function renderEmpty(){
    $('#vocabTrainerRoot').innerHTML=`<div class="vocab-trainer-empty">
      <button id="vocabTrainerClose" class="vocab-trainer-round" type="button" aria-label="Đóng">${env.uiIcon('x')}</button>
      <span class="eyebrow">CHUNK TRAINER</span>
      <h2>Không có cụm phù hợp.</h2>
      <p>Hãy đổi bài, số lượng hoặc phạm vi trong tùy chọn.</p>
      <button id="vocabEmptySettings" class="primary-button" type="button">Mở tùy chọn</button>
      <div id="vocabSettingsSheet"></div>
    </div>`;
    $('#vocabTrainerClose').onclick=close;
    $('#vocabEmptySettings').onclick=openSettings;
  }

  function renderSummary(){
    const total=session.cards.length;
    $('#vocabTrainerRoot').innerHTML=`<div class="vocab-trainer-summary">
      <span class="eyebrow">SESSION COMPLETE</span>
      <h1>Hoàn thành ${esc(modeInfo(session.options.mode).name.toLowerCase())}</h1>
      <p>Bạn vừa luyện ${total} cụm. Hệ thống sẽ tự đưa lại cụm chưa chắc sau 10 phút, rồi 1 → 3 → 7 → 14 → 30 ngày.</p>
      <div class="vocab-trainer-summary-grid">
        <div><b>${session.stats.correct}</b><span>Đạt</span></div>
        <div><b>${session.stats.wrong}</b><span>Cần ôn lại</span></div>
        <div><b>${(session.options.reviewToday?allStudyChunks():studyChunks(session.pack)).filter(x=>progressFor(x).skills?.fast>=2).length}</b><span>Gọi nhanh</span></div>
        <div><b>${(session.options.reviewToday?allStudyChunks():studyChunks(session.pack)).filter(x=>automaticStatus(progressFor(x)).automatic).length}</b><span>Automatic</span></div>
      </div>
      <div class="active-chunk-summary-note">Đường học chung: <b>Hiểu → Recall → Fast Recall → Biến đổi → Phân biệt → Tình huống → Use → Spaced Review.</b></div>
      <div class="vocab-trainer-summary-actions">
        <button id="repeatChunkSession" class="primary-button" type="button">Ôn tiếp</button>
        <button id="vocabSummaryClose" class="secondary-button" type="button">Về Cụm chủ động</button>
      </div>
    </div>`;
    $('#repeatChunkSession').onclick=()=>{buildSession();render();};
    $('#vocabSummaryClose').onclick=close;
  }

  function render(){
    if(!session?.cards?.length){renderEmpty();return;}
    renderCard();
  }

  function close(){
    document.documentElement.classList.remove('vocab-trainer-open');
    unbindViewportTracking();
    session=null;
    env.renderVocab();
  }

  function curriculumSummary(saved={}){
    const data={packs:packs().length,chunks:0,core:0,mastered1:0,mastered2:0,mastered3:0,fast:0,vary:0,situation:0,automatic:0,due:0};
    packs().forEach(pack=>{
      const chunks=studyChunks(pack);
      data.chunks+=chunks.length;
      data.core+=chunks.filter(x=>x.priority==='core').length;
      chunks.forEach(card=>{
        const p=progressFor(card,saved);
        if(p.skills.recognize>=2) data.mastered1++;
        if(p.skills.recall>=2) data.mastered2++;
        if(p.skills.use>=2) data.mastered3++;
        if(p.skills.fast>=2) data.fast++;
        if(p.skills.vary>=2) data.vary++;
        if(p.skills.situation>=2) data.situation++;
        if(automaticStatus(p).automatic) data.automatic++;
        if(p.reviewCount&&p.nextReviewAt<=Date.now()) data.due++;
      });
    });
    return data;
  }

  function packSummary(pack,saved={}){
    const chunks=studyChunks(pack);
    const result={level1:0,level2:0,level3:0,fast:0,vary:0,situation:0,automatic:0,total1:chunks.length,total2:chunks.length,total3:chunks.length};
    chunks.forEach(card=>{
      const p=progressFor(card,saved);
      if(p.skills.recognize>=2) result.level1++;
      if(p.skills.recall>=2) result.level2++;
      if(p.skills.use>=2) result.level3++;
      if(p.skills.fast>=2) result.fast++;
      if(p.skills.vary>=2) result.vary++;
      if(p.skills.situation>=2) result.situation++;
      if(automaticStatus(p).automatic) result.automatic++;
    });
    return result;
  }

  function open(nextEnv,overrides={}){
    env=nextEnv;
    buildSession(overrides);
    env.setHeader(overrides.reviewToday?'Learning › Ôn hôm nay':'Learning › Chunk Trainer','Cụm chủ động');
    document.documentElement.classList.add('vocab-trainer-open');
    bindViewportTracking();
    env.main.innerHTML='<section id="vocabTrainerRoot" class="vocab-trainer-root"></section>';
    render();
  }

  function isOpen(){
    return !!session&&document.documentElement.classList.contains('vocab-trainer-open');
  }

  function onRemoteSync(){
    return isOpen();
  }

  window.VocabularyTrainer={
    open,
    curriculumSummary,
    packSummary,
    packById,
    packs,
    studyChunks,
    usageExampleMarkup,
    automaticStatus,
    reviewCount,
    isOpen,
    onRemoteSync
  };
})();