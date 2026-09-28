(function ActiveChunkTrainer(){
  'use strict';

  const DAY=24*60*60*1000;
  const MINUTE=60*1000;
  let env=null;
  let session=null;
  let autoplayTimer=null;
  let reflexTimer=null;
  let reflexStartedAt=0;

  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));

  function esc(value=''){
    if(env?.esc) return env.esc(value);
    return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function trainerDefaults(){
    return {
      starred:false,
      mastered:false,
      reviewCount:0,
      correctCount:0,
      wrongCount:0,
      lastReviewedAt:0,
      nextReviewAt:0,
      intervalDays:0,
      lastRating:'',
      updatedAt:0,
      fastestMs:0
    };
  }

  function packs(){
    return window.ACTIVE_STUDY_PACK_LIST||[];
  }

  function packById(id){
    return (window.ACTIVE_STUDY_PACKS||{})[id]||packs()[0]||null;
  }

  function settings(){
    const first=packs()[0]?.lessonId||'en-pattern-001';
    const defaults={
      lessonId:first,
      level:'1',
      size:'all',
      order:'srs',
      starredOnly:false,
      autoSpeak:false
    };
    env.state.vocabTrainerSettings={...defaults,...(env.state.vocabTrainerSettings||{})};
    if(!packById(env.state.vocabTrainerSettings.lessonId)) env.state.vocabTrainerSettings.lessonId=first;
    return env.state.vocabTrainerSettings;
  }

  function keyFor(packId,kind,id,level){
    return `study:${packId}:${kind}:${id}:l${level}`;
  }

  function cardIdFromText(prefix,text,index){
    const base=String(text||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,52);
    return `${prefix}-${base||index+1}`;
  }

  function chunkCards(pack,level){
    return (pack.activeChunks||[]).map((row,index)=>{
      const [en,vi,exampleEn,exampleVi]=row;
      const id=cardIdFromText('c',en,index);
      return {
        key:keyFor(pack.lessonId,'chunk',id,level),
        pack, level, kind:'chunk',
        en,vi,exampleEn,exampleVi,
        term:en,meaning:vi,speechText:en
      };
    });
  }

  function sentenceCards(pack){
    return (pack.deepSentences||[]).map((row,index)=>{
      const [en,vi]=row;
      const id=cardIdFromText('s',en,index);
      return {
        key:keyFor(pack.lessonId,'sentence',id,3),
        pack, level:3, kind:'sentence',
        en,vi,exampleEn:'',exampleVi:'',
        term:en,meaning:vi,speechText:en
      };
    });
  }

  function allCardsFor(pack,level){
    if(String(level)==='1') return chunkCards(pack,1);
    if(String(level)==='2') return chunkCards(pack,2);
    if(String(level)==='3') return sentenceCards(pack);
    return [...chunkCards(pack,1),...chunkCards(pack,2),...sentenceCards(pack)];
  }

  function progressFor(card){
    const saved=env.state.saved?.[card.key];
    return {...trainerDefaults(),...(saved?.trainer||{})};
  }

  function persist(card,progress){
    const item={
      key:card.key,
      term:card.en,
      speechText:card.en,
      ipa:'',
      meaning:card.vi,
      example:card.exampleEn||'',
      type:'study-card',
      lessonId:card.pack.lessonId,
      lessonOrder:card.pack.order,
      studyLevel:card.level,
      cardKind:card.kind,
      savedAt:Number(env.state.saved?.[card.key]?.savedAt||Date.now()),
      trainer:{...trainerDefaults(),...progress,updatedAt:Date.now()}
    };
    env.state.saved[card.key]=item;
    env.saveState();
    env.queueVocabUpsert(item);
  }

  function dueRank(card){
    const p=progressFor(card);
    if(!p.reviewCount) return 1;
    if(p.nextReviewAt&&p.nextReviewAt<=Date.now()) return 0;
    if(p.mastered) return 4;
    return 2;
  }

  function buildSession(overrides={}){
    const s=settings();
    Object.assign(s,overrides||{});
    env.saveState();

    const pack=packById(s.lessonId);
    let cards=pack?allCardsFor(pack,s.level):[];
    if(s.starredOnly) cards=cards.filter(card=>progressFor(card).starred);

    if(s.order==='random'){
      cards=[...cards].sort(()=>Math.random()-.5);
    }else if(s.order==='srs'){
      cards=[...cards].sort((a,b)=>{
        const ar=dueRank(a),br=dueRank(b);
        if(ar!==br) return ar-br;
        return Number(progressFor(a).nextReviewAt||0)-Number(progressFor(b).nextReviewAt||0);
      });
    }

    const size=s.size==='all'?cards.length:Math.max(1,Number(s.size)||cards.length);
    cards=cards.slice(0,size);

    session={
      pack,
      cards,
      index:0,
      revealed:false,
      history:[],
      autoplay:false,
      stats:{again:0,hard:0,good:0,easy:0},
      options:{...s},
      reflexMessage:'',
      level3Phase:'learn',
      level3Practice:{},
      level3HintVisible:false
    };
  }

  function reviewInterval(progress,rating){
    const current=Math.max(0,Number(progress.intervalDays)||0);
    if(rating==='again') return 0;
    if(rating==='hard') return current<1?1:Math.min(30,Math.max(1,Math.ceil(current*1.4)));
    if(rating==='good') return current<1?2:Math.min(90,Math.max(2,Math.ceil(current*2.2)));
    return current<1?4:Math.min(180,Math.max(4,Math.ceil(current*3)));
  }

  function currentCard(){
    return session?.cards?.[session.index]||null;
  }

  function rateCurrent(rating){
    const card=currentCard();
    if(!card) return;
    const old=progressFor(card);
    session.history.push({key:card.key,index:session.index,progress:old});
    if(session.history.length>20) session.history.shift();

    const p={...old};
    p.reviewCount++;
    p.lastReviewedAt=Date.now();
    p.lastRating=rating;

    if(reflexStartedAt&&card.level===3){
      const ms=Math.max(0,Date.now()-reflexStartedAt);
      if(!p.fastestMs||ms<p.fastestMs) p.fastestMs=ms;
    }

    if(rating==='again'){
      p.wrongCount++;
      p.intervalDays=0;
      p.nextReviewAt=Date.now()+10*MINUTE;
      p.mastered=false;
      session.stats.again++;
    }else{
      p.correctCount++;
      p.intervalDays=reviewInterval(p,rating);
      p.nextReviewAt=Date.now()+p.intervalDays*DAY;
      if(rating==='hard') session.stats.hard++;
      if(rating==='good') session.stats.good++;
      if(rating==='easy') session.stats.easy++;
      if((rating==='good'||rating==='easy')&&p.correctCount>=3&&p.intervalDays>=14) p.mastered=true;
    }

    persist(card,p);
    nextCard();
  }

  function toggleStar(){
    const card=currentCard();
    if(!card) return;
    const p=progressFor(card);
    p.starred=!p.starred;
    persist(card,p);
    renderCard();
  }

  function undoLast(){
    const last=session?.history?.pop();
    if(!last){env.toast('Chưa có lần đánh giá nào để hoàn tác.');return;}
    const card=session.cards.find(x=>x.key===last.key);
    if(card) persist(card,last.progress);
    session.index=Math.max(0,Math.min(last.index,session.cards.length-1));
    session.revealed=false;
    resetReflexTimer();
    render();
  }

  function resetReflexTimer(){
    clearInterval(reflexTimer);
    reflexTimer=null;
    reflexStartedAt=0;
    if(session) session.reflexMessage='';
  }

  function reflexSeconds(card){
    if(!card||Number(card.level)!==3) return 3;
    const p=progressFor(card);
    return Number(p.reviewCount||0)>=2?3:6;
  }

  function startReflexTimer(){
    const card=currentCard();
    if(!session||Number(card?.level)!==3||session.level3Phase==='learn') return;
    resetReflexTimer();
    reflexStartedAt=Date.now();
    const seconds=reflexSeconds(card);
    let left=seconds;
    const target=$('#vocabReflexTimer');
    if(target) target.textContent=left.toFixed(1);
    reflexTimer=setInterval(()=>{
      left=Math.max(0,left-.1);
      const el=$('#vocabReflexTimer');
      if(el) el.textContent=left.toFixed(1);
      if(left<=0){
        clearInterval(reflexTimer);
        reflexTimer=null;
        session.reflexMessage=seconds>3
          ? 'Hết thời gian gợi ý ban đầu. Không sao — bạn đang xây phản xạ. Hãy xem đáp án rồi thử lại.'
          : 'Hết 3 giây. Nếu chưa bật ra được, hãy đánh giá Chậm hoặc Chưa nói được.';
        const note=$('#vocabReflexNote');
        if(note) note.textContent=session.reflexMessage;
      }
    },100);
  }
  function stopAutoplay(){
    clearTimeout(autoplayTimer);
    autoplayTimer=null;
    if(session) session.autoplay=false;
  }

  async function autoplayStep(){
    if(!session?.autoplay) return;
    const card=currentCard();
    if(!card){stopAutoplay();return;}
    session.revealed=true;
    renderCard();
    await env.speak(card.en);
    if(!session?.autoplay) return;
    autoplayTimer=setTimeout(()=>{
      if(session.index>=session.cards.length-1){stopAutoplay();renderSummary();return;}
      session.index++;
      session.revealed=false;
      render();
      session.autoplay=true;
      autoplayStep();
    },2600);
  }

  function toggleAutoplay(){
    if(Number(currentCard()?.level)===3){
      env.toast('Tầng 3 cần học câu → gọi lại → biến đổi, nên không dùng autoplay.');
      return;
    }
    if(session.autoplay){stopAutoplay();renderCard();return;}
    session.autoplay=true;
    renderCard();
    autoplayStep();
  }

  function nextCard(){
    stopAutoplay();
    resetReflexTimer();
    if(session.index>=session.cards.length-1){renderSummary();return;}
    session.index++;
    session.revealed=false;
    session.level3Phase='learn';
    session.level3HintVisible=false;
    render();
  }

  function prevCard(){
    stopAutoplay();
    resetReflexTimer();
    if(session.index<=0) return;
    session.index--;
    session.revealed=false;
    session.level3Phase='learn';
    session.level3HintVisible=false;
    render();
  }

  function toggleReveal(){
    const card=currentCard();
    if(Number(card?.level)===3) return;
    session.revealed=!session.revealed;
    if(session.revealed) resetReflexTimer();
    renderCard();
    if(session.revealed&&settings().autoSpeak) env.speak(card.en);
  }

  function stageCopy(level){
    if(Number(level)===1) return {name:'TẦNG 1 · NHẬN RA',title:'Thấy cụm → hiểu ngay',desc:'Không dịch từng từ. Nhìn cả khối và nhận ra ý nghĩa lõi.'};
    if(Number(level)===2) return {name:'TẦNG 2 · GỌI RA',title:'Có ý tiếng Việt → bật ra cụm',desc:'Mục tiêu là nhớ ra cụm sau vài giây, không cần nhìn tiếng Anh trước.'};
    return {name:'TẦNG 3 · DÙNG TỰ ĐỘNG',title:'Học câu → gọi lại → biến đổi',desc:'Không bắt nói một câu chưa học. Bạn học câu mẫu trước, gọi lại chính câu đó, rồi mới tự biến đổi thành câu mới.'};
  }

  function level3StepperHTML(){
    const phase=session.level3Phase||'learn';
    const order=['learn','recall','transform'];
    const labels=[['3A','Học câu'],['3B','Gọi lại'],['3C','Biến đổi']];
    const current=order.indexOf(phase);
    return '<div class="level3-stepper">'+order.map((x,i)=>'<span class="'+(i<current?'done':i===current?'active':'')+'"><b>'+labels[i][0]+'</b>'+labels[i][1]+'</span>').join('<i></i>')+'</div>';
  }

  function level3CardHTML(card){
    const p=progressFor(card);
    const phase=session.level3Phase||'learn';
    const practiced=Number(session.level3Practice?.[card.key]||0);
    const seconds=reflexSeconds(card);

    if(phase==='learn'){
      return `
        <div class="vocab-trainer-card level-3 phase-learn" id="vocabTrainerCard">
          <div class="vocab-trainer-card-top">
            <button id="vocabCardSpeak" class="vocab-card-icon" type="button">${env.uiIcon('volume-2')}</button>
            <button id="vocabCardStar" class="vocab-card-icon ${p.starred?'active':''}" type="button">
              <svg class="ui-icon" viewBox="0 0 24 24" fill="${p.starred?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/></svg>
            </button>
          </div>
          <div class="vocab-trainer-face">
            ${level3StepperHTML()}
            <span class="vocab-trainer-direction">3A · HỌC CÂU MẪU</span>
            <div class="vocab-trainer-answer">${esc(card.en)}</div>
            <div class="level3-model-vi">${esc(card.vi)}</div>
            <div class="level3-study-note">Nghe và nói theo <b>ít nhất 2 lần</b>. Bước này chỉ để quen miệng với cả câu, chưa chấm tốc độ.</div>
          </div>
          <div class="level3-study-actions">
            <button id="level3PracticeModel" class="secondary-button" type="button">${env.uiIcon('volume-2')}<span>Nghe & nhại · ${practiced}/2+</span></button>
            <button id="level3ToRecall" class="primary-button" type="button" ${practiced<2?'disabled':''}>Đã luyện · sang 3B →</button>
          </div>
        </div>`;
    }

    if(phase==='recall'){
      return `
        <div class="vocab-trainer-card level-3 phase-recall" id="vocabTrainerCard">
          <div class="vocab-trainer-card-top">
            <button id="vocabCardSpeak" class="vocab-card-icon" type="button" ${session.revealed?'':'disabled'}>${env.uiIcon('volume-2')}</button>
            <button id="vocabCardStar" class="vocab-card-icon ${p.starred?'active':''}" type="button">
              <svg class="ui-icon" viewBox="0 0 24 24" fill="${p.starred?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/></svg>
            </button>
          </div>
          <div class="vocab-trainer-face">
            ${level3StepperHTML()}
            <span class="vocab-trainer-direction">3B · GỌI LẠI CÂU ĐÃ HỌC</span>
            <div class="vocab-trainer-front">${esc(card.vi)}</div>
            <div class="vocab-reflex-box">
              <button id="vocabStartReflex" type="button">Bắt đầu nhớ lại · ${seconds} giây</button>
              <b id="vocabReflexTimer">${seconds.toFixed(1)}</b>
              <small id="vocabReflexNote">${esc(session.reflexMessage||'Lần đầu chưa cần ép 3 giây. Hãy cố tự nói lại câu vừa luyện trước khi xem đáp án.')}</small>
            </div>
            ${session.revealed?`<div class="vocab-trainer-divider"></div><div class="vocab-trainer-answer">${esc(card.en)}</div>`:''}
          </div>
          ${session.revealed?
            `<div class="level3-recall-actions"><button id="level3BackToLearn" class="secondary-button" type="button">Chưa nhớ · học lại 3A</button><button id="level3ToTransform" class="primary-button" type="button">Nhớ được · sang 3C →</button></div>`
            :`<div class="vocab-trainer-reveal-wrap"><button id="vocabRevealLevel3" class="vocab-trainer-reveal" type="button">Xem đáp án sau khi tự nói</button></div>`}
        </div>`;
    }

    return `
      <div class="vocab-trainer-card level-3 phase-transform" id="vocabTrainerCard">
        <div class="vocab-trainer-card-top">
          <button id="vocabCardSpeak" class="vocab-card-icon" type="button" ${session.level3HintVisible?'':'disabled'}>${env.uiIcon('volume-2')}</button>
          <button id="vocabCardStar" class="vocab-card-icon ${p.starred?'active':''}" type="button">
            <svg class="ui-icon" viewBox="0 0 24 24" fill="${p.starred?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/></svg>
          </button>
        </div>
        <div class="vocab-trainer-face">
          ${level3StepperHTML()}
          <span class="vocab-trainer-direction">3C · BIẾN ĐỔI & DÙNG TỰ ĐỘNG</span>
          <div class="level3-transform-prompt"><strong>Giữ ý/cấu trúc chính của câu vừa học.</strong><span>Hãy đổi ít nhất một chi tiết thật: thời gian, người, địa điểm, lý do hoặc mục đích — rồi nói thành một câu mới.</span></div>
          <div class="vocab-reflex-box">
            <button id="vocabStartReflex" type="button">Bắt đầu phản xạ · ${seconds} giây</button>
            <b id="vocabReflexTimer">${seconds.toFixed(1)}</b>
            <small id="vocabReflexNote">${esc(session.reflexMessage||(seconds>3?'Bạn đang xây phản xạ nên được 6 giây. Khi đã gặp lại vài lần, hệ thống mới siết về 3 giây.':'Mục tiêu lúc này là bật ra câu mới trong khoảng 2–3 giây.'))}</small>
          </div>
          <button id="level3ShowHint" class="level3-hint-button" type="button">${session.level3HintVisible?'Câu gốc: '+esc(card.en):'Bí ý? xem lại câu gốc'}</button>
          ${session.revealed?`<div class="active-chunk-auto-tip">Không có một đáp án duy nhất. Hãy tự đánh giá: bạn có tạo được <b>một câu mới</b> từ câu vừa học, không chỉ đọc lại nguyên câu hay không?</div>`:''}
        </div>
        ${session.revealed?'':`<div class="vocab-trainer-reveal-wrap"><button id="vocabRevealLevel3" class="vocab-trainer-reveal" type="button">Tôi đã nói một câu mới</button></div>`}
      </div>`;
  }

  function cardFaceHTML(card){
    const p=progressFor(card);
    const level=Number(card.level);
    if(level===3) return level3CardHTML(card);
    let front='',answer='',sub='';
    if(level===1){
      front=card.en;
      answer=card.vi;
      sub=card.exampleEn?`${card.exampleEn}||${card.exampleVi||''}`:'';
    }else{
      front=card.vi;
      answer=card.en;
      sub=card.exampleEn?`${card.exampleEn}||${card.exampleVi||''}`:'';
    }
    const [exampleEn,exampleVi]=sub.split('||');
    return `
      <div class="vocab-trainer-card level-${level}" id="vocabTrainerCard" role="button" tabindex="0">
        <div class="vocab-trainer-card-top">
          <button id="vocabCardSpeak" class="vocab-card-icon" type="button" ${level>1&&!session.revealed?'disabled':''}>${env.uiIcon('volume-2')}</button>
          <button id="vocabCardStar" class="vocab-card-icon ${p.starred?'active':''}" type="button">
            <svg class="ui-icon" viewBox="0 0 24 24" fill="${p.starred?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/></svg>
          </button>
        </div>
        <div class="vocab-trainer-face">
          <span class="vocab-trainer-direction">${esc(stageCopy(level).name)}</span>
          <div class="vocab-trainer-front">${esc(front)}</div>
          ${session.revealed?`<div class="vocab-trainer-divider"></div><div class="vocab-trainer-answer">${esc(answer)}</div>${exampleEn?`<div class="active-chunk-example"><b>${esc(exampleEn)}</b>${exampleVi?`<span>${esc(exampleVi)}</span>`:''}</div>`:''}`:`<small>Chạm thẻ hoặc bấm “Hiện đáp án” sau khi bạn đã tự trả lời.</small>`}
        </div>
      </div>`;
  }
  function ratingHTML(card){
    const level=Number(card?.level);
    if(level===3){
      if((session.level3Phase||'learn')!=='transform'||!session.revealed) return '';
      const labels=[
        ['again','Chưa nói được','Cần học lại'],
        ['hard','Chậm','Còn phải nghĩ lâu'],
        ['good','Đạt','Bật ra được'],
        ['easy','Tự động','Bật ra rất nhanh']
      ];
      return '<div class="vocab-trainer-ratings">'+labels.map(([id,b,s])=>'<button data-vocab-rate="'+id+'" type="button"><b>'+b+'</b><span>'+s+'</span></button>').join('')+'</div>';
    }
    if(!session.revealed) return '<div class="vocab-trainer-reveal-wrap"><button id="vocabReveal" class="vocab-trainer-reveal" type="button">Hiện đáp án</button></div>';
    const labels=level===1
      ? [['again','Quên','Không nhận ra'],['hard','Nhận chậm','Phải nghĩ lâu'],['good','Nhận ra','Hiểu ngay'],['easy','Rất chắc','Gần tự động']]
      : [['again','Không nhớ','Không gọi ra'],['hard','Chậm','Trên 3 giây'],['good','Gọi ra','Khoảng 2–3 giây'],['easy','Bật ra ngay','Rất nhanh']];
    return '<div class="vocab-trainer-ratings">'+labels.map(([id,b,s])=>'<button data-vocab-rate="'+id+'" type="button"><b>'+b+'</b><span>'+s+'</span></button>').join('')+'</div>';
  }
  function renderCard(){
    const card=currentCard();
    if(!card){renderEmpty();return;}
    const root=$('#vocabTrainerRoot');
    if(!root) return;
    const copy=stageCopy(card.level);
    root.innerHTML=`
      <div class="vocab-trainer-topbar">
        <button id="vocabTrainerClose" class="vocab-trainer-round" type="button">×</button>
        <div class="vocab-trainer-counter"><strong>${session.index+1} / ${session.cards.length}</strong><span>${esc(session.pack.pattern)}</span></div>
        <button id="vocabTrainerSettings" class="vocab-trainer-round" type="button" aria-label="Tùy chọn">
          <svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>
        </button>
      </div>
      <div class="vocab-trainer-progress"><i style="width:${Math.round(((session.index+1)/session.cards.length)*100)}%"></i></div>
      <div class="active-chunk-stage-intro"><span>${esc(copy.name)}</span><strong>${esc(copy.title)}</strong><p>${esc(copy.desc)}</p></div>
      <div class="vocab-trainer-stage">
        ${cardFaceHTML(card)}
        ${ratingHTML(card)}
      </div>
      <div class="vocab-trainer-bottom">
        <button id="vocabUndo" class="vocab-bottom-icon" type="button" ${session.history.length?'':'disabled'}>↶</button>
        <button id="vocabPrev" class="vocab-bottom-text" type="button" ${session.index<=0?'disabled':''}>← Trước</button>
        <button id="vocabAutoplay" class="vocab-bottom-icon ${session.autoplay?'active':''}" type="button">${session.autoplay?'■':'▶'}</button>
        <button id="vocabNext" class="vocab-bottom-text" type="button">Sau →</button>
      </div>
      <div id="vocabSettingsSheet"></div>`;
    bindCard();
  }

  function bindSwipe(cardEl){
    let sx=0,sy=0;
    cardEl.addEventListener('touchstart',e=>{
      if(!e.touches?.length) return;
      sx=e.touches[0].clientX;sy=e.touches[0].clientY;
    },{passive:true});
    cardEl.addEventListener('touchend',e=>{
      if(!e.changedTouches?.length) return;
      const dx=e.changedTouches[0].clientX-sx;
      const dy=e.changedTouches[0].clientY-sy;
      if(Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.25) return;
      dx<0?nextCard():prevCard();
    },{passive:true});
  }

  function bindCard(){
    $('#vocabTrainerClose').onclick=close;
    $('#vocabTrainerSettings').onclick=openSettings;
    $('#vocabUndo').onclick=undoLast;
    $('#vocabPrev').onclick=prevCard;
    $('#vocabNext').onclick=nextCard;
    $('#vocabAutoplay').onclick=toggleAutoplay;

    const card=$('#vocabTrainerCard');
    if(card){
      card.onclick=e=>{if(!e.target.closest('button')) toggleReveal();};
      bindSwipe(card);
    }
    const speak=$('#vocabCardSpeak');
    if(speak) speak.onclick=e=>{e.stopPropagation();env.speak(currentCard().en);};
    const star=$('#vocabCardStar');
    if(star) star.onclick=e=>{e.stopPropagation();toggleStar();};
    const reveal=$('#vocabReveal');
    if(reveal) reveal.onclick=toggleReveal;
    const reflex=$('#vocabStartReflex');
    if(reflex) reflex.onclick=e=>{e.stopPropagation();startReflexTimer();};
    $$('[data-vocab-rate]').forEach(btn=>btn.onclick=()=>rateCurrent(btn.dataset.vocabRate));
  }

  function openSettings(){
    stopAutoplay();
    resetReflexTimer();
    const holder=$('#vocabSettingsSheet');
    const s=settings();
    holder.innerHTML=`
      <div class="vocab-settings-backdrop" id="vocabSettingsBackdrop">
        <section class="vocab-settings-sheet">
          <div class="vocab-settings-head"><h2>Tùy chọn buổi học</h2><button id="vocabSettingsClose" type="button">×</button></div>
          <label class="vocab-settings-row"><span><b>Mẫu câu</b><small>Mỗi buổi chỉ tập trung một bộ 1–5–10</small></span>
            <select id="vocabLessonSelect">${packs().map(p=>`<option value="${p.lessonId}" ${p.lessonId===s.lessonId?'selected':''}>#${p.order} · ${esc(p.pattern)}</option>`).join('')}</select>
          </label>
          <label class="vocab-settings-row"><span><b>Tầng học</b><small>Nhận ra → Gọi ra → Dùng tự động</small></span>
            <select id="vocabLevelSelect">
              <option value="1" ${s.level==='1'?'selected':''}>1 · Nhận ra</option>
              <option value="2" ${s.level==='2'?'selected':''}>2 · Gọi ra được</option>
              <option value="3" ${s.level==='3'?'selected':''}>3 · Dùng tự động</option>
            </select>
          </label>
          <label class="vocab-settings-row"><span><b>Số thẻ</b><small>Không cần nhồi quá nhiều trong một buổi</small></span>
            <select id="vocabSizeSelect">${['5','8','10','all'].map(x=>`<option value="${x}" ${String(s.size)===x?'selected':''}>${x==='all'?'Tất cả':x+' thẻ'}</option>`).join('')}</select>
          </label>
          <label class="vocab-settings-row"><span><b>Thứ tự</b><small>SRS ưu tiên thẻ đến hạn và thẻ chưa học</small></span>
            <select id="vocabOrderSelect"><option value="srs" ${s.order==='srs'?'selected':''}>Ưu tiên SRS</option><option value="random" ${s.order==='random'?'selected':''}>Ngẫu nhiên</option></select>
          </label>
          <label class="vocab-settings-toggle"><span><b>Chỉ thẻ có sao</b><small>Dùng khi muốn tập trung vào một số cụm khó</small></span><input id="vocabStarredOnly" type="checkbox" ${s.starredOnly?'checked':''}><i></i></label>
          <label class="vocab-settings-toggle"><span><b>Tự phát tiếng Anh sau khi lật</b><small>Không phát trước để tránh lộ đáp án ở tầng 2–3</small></span><input id="vocabAutoSpeak" type="checkbox" ${s.autoSpeak?'checked':''}><i></i></label>
          <div class="vocab-settings-actions"><button id="vocabApplySettings" class="primary-button" type="button">Áp dụng & bắt đầu lại</button></div>
        </section>
      </div>`;
    $('#vocabSettingsClose').onclick=()=>holder.innerHTML='';
    $('#vocabSettingsBackdrop').onclick=e=>{if(e.target.id==='vocabSettingsBackdrop') holder.innerHTML='';};
    $('#vocabApplySettings').onclick=()=>{
      const next=settings();
      next.lessonId=$('#vocabLessonSelect').value;
      next.level=$('#vocabLevelSelect').value;
      next.size=$('#vocabSizeSelect').value;
      next.order=$('#vocabOrderSelect').value;
      next.starredOnly=$('#vocabStarredOnly').checked;
      next.autoSpeak=$('#vocabAutoSpeak').checked;
      env.saveState();
      buildSession();
      render();
    };
  }

  function renderEmpty(){
    $('#vocabTrainerRoot').innerHTML=`
      <div class="vocab-trainer-empty">
        <button id="vocabTrainerClose" class="vocab-trainer-round" type="button">×</button>
        <span class="eyebrow">ACTIVE CHUNKS</span><h2>Không có thẻ phù hợp.</h2>
        <p>Hãy bỏ “chỉ thẻ có sao”, đổi tầng học hoặc chọn một mẫu câu khác.</p>
        <button id="vocabEmptySettings" class="primary-button" type="button">Mở tùy chọn</button>
        <div id="vocabSettingsSheet"></div>
      </div>`;
    $('#vocabTrainerClose').onclick=close;
    $('#vocabEmptySettings').onclick=openSettings;
  }

  function nextLevel(level){
    const n=Number(level);
    return n<3?String(n+1):'1';
  }

  function renderSummary(){
    stopAutoplay();
    resetReflexTimer();
    const total=session.stats.again+session.stats.hard+session.stats.good+session.stats.easy;
    const currentLevel=String(session.options.level);
    const next=nextLevel(currentLevel);
    $('#vocabTrainerRoot').innerHTML=`
      <div class="vocab-trainer-summary">
        <span class="eyebrow">SESSION COMPLETE</span>
        <h1>Hoàn thành ${esc(stageCopy(currentLevel).name.toLowerCase())}</h1>
        <p>${total?`Bạn đã tự đánh giá ${total} lượt. Đừng cố học hết một lúc; mục tiêu là gặp lại cụm nhiều lần trong các ngữ cảnh khác nhau.`:'Bạn đã xem hết bộ thẻ.'}</p>
        <div class="vocab-trainer-summary-grid">
          <div><b>${session.stats.again}</b><span>Quên</span></div>
          <div><b>${session.stats.hard}</b><span>Chậm</span></div>
          <div><b>${session.stats.good}</b><span>Đạt</span></div>
          <div><b>${session.stats.easy}</b><span>Tự động</span></div>
        </div>
        <div class="active-chunk-summary-note">Công thức của chương trình: <b>1 mẫu câu · 5–8 cụm chủ động · khoảng 10 câu luyện sâu.</b></div>
        <div class="vocab-trainer-summary-actions">
          ${Number(currentLevel)<3?`<button id="vocabNextLevel" class="primary-button" type="button">Sang tầng ${next} →</button>`:`<button id="vocabNextLevel" class="primary-button" type="button">Ôn lại từ tầng 1</button>`}
          <button id="vocabSummaryClose" class="secondary-button" type="button">Về Cụm chủ động</button>
        </div>
      </div>`;
    $('#vocabNextLevel').onclick=()=>{
      settings().level=next;
      env.saveState();
      buildSession();
      render();
    };
    $('#vocabSummaryClose').onclick=close;
  }

  function render(){
    if(!session?.cards?.length){renderEmpty();return;}
    renderCard();
  }

  function close(){
    stopAutoplay();
    resetReflexTimer();
    document.documentElement.classList.remove('vocab-trainer-open');
    session=null;
    env.renderVocab();
  }

  function curriculumSummary(saved={}){
    const data={packs:packs().length,active:0,deep:0,mastered1:0,mastered2:0,mastered3:0,due:0};
    packs().forEach(pack=>{
      data.active+=(pack.activeChunks||[]).length;
      data.deep+=(pack.deepSentences||[]).length;
      [1,2].forEach(level=>chunkCards(pack,level).forEach(card=>{
        const p={...trainerDefaults(),...(saved[card.key]?.trainer||{})};
        if(p.mastered) data[`mastered${level}`]++;
        if(p.reviewCount&&p.nextReviewAt<=Date.now()) data.due++;
      }));
      sentenceCards(pack).forEach(card=>{
        const p={...trainerDefaults(),...(saved[card.key]?.trainer||{})};
        if(p.mastered) data.mastered3++;
        if(p.reviewCount&&p.nextReviewAt<=Date.now()) data.due++;
      });
    });
    return data;
  }

  function packSummary(pack,saved={}){
    const result={level1:0,level2:0,level3:0,total1:(pack.activeChunks||[]).length,total2:(pack.activeChunks||[]).length,total3:(pack.deepSentences||[]).length};
    chunkCards(pack,1).forEach(card=>{if(saved[card.key]?.trainer?.mastered) result.level1++;});
    chunkCards(pack,2).forEach(card=>{if(saved[card.key]?.trainer?.mastered) result.level2++;});
    sentenceCards(pack).forEach(card=>{if(saved[card.key]?.trainer?.mastered) result.level3++;});
    return result;
  }

  function open(nextEnv,overrides={}){
    env=nextEnv;
    Object.keys(env.state.saved||{}).forEach(key=>{
      if(env.state.saved[key]?.type==='word') delete env.state.saved[key];
    });
    buildSession(overrides);
    env.setHeader('Learning › Active Chunks','Cụm chủ động');
    document.documentElement.classList.add('vocab-trainer-open');
    env.main.innerHTML='<section id="vocabTrainerRoot" class="vocab-trainer-root"></section>';
    render();
  }

  function isOpen(){
    return !!session && document.documentElement.classList.contains('vocab-trainer-open');
  }

  function onRemoteSync(){
    // Cloud/realtime may update env.state.saved while a study session is open.
    // Keep the current card/session intact; progressFor() reads env.state.saved
    // on the next render, so no destructive page rerender is needed here.
    return isOpen();
  }

  window.VocabularyTrainer={open,curriculumSummary,packSummary,packById,packs,isOpen,onRemoteSync};
})();