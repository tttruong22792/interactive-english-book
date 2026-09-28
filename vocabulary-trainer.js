(function VocabularyTrainerModule(){
  'use strict';

  const DAY=24*60*60*1000;
  const MINUTE=60*1000;
  let env=null;
  let session=null;
  let autoplayTimer=null;

  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));

  function esc(value=''){
    if(env?.esc) return env.esc(value);
    return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escAttr(value=''){return env?.escAttr?env.escAttr(value):esc(value);}

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
      updatedAt:0
    };
  }

  function ensureTrainer(item){
    if(!item.trainer||typeof item.trainer!=='object'||Array.isArray(item.trainer)){
      item.trainer=trainerDefaults();
    }else{
      item.trainer={...trainerDefaults(),...item.trainer};
    }
    return item.trainer;
  }

  function settings(){
    const defaults={
      direction:'vi-en',
      size:'10',
      filter:'all',
      order:'srs',
      starredOnly:false,
      shuffle:false,
      autoSpeak:false
    };
    env.state.vocabTrainerSettings={...defaults,...(env.state.vocabTrainerSettings||{})};
    return env.state.vocabTrainerSettings;
  }

  function saveSettings(){
    env.saveState();
  }

  function statusOf(item,now=Date.now()){
    const t=ensureTrainer(item);
    if(t.mastered) return 'mastered';
    if(!t.reviewCount) return 'new';
    if(t.nextReviewAt&&t.nextReviewAt<=now) return 'due';
    if(t.wrongCount>t.correctCount) return 'hard';
    return 'learning';
  }

  function summary(items){
    const now=Date.now();
    const out={total:items.length,new:0,due:0,learning:0,hard:0,mastered:0,starred:0,today:0};
    items.forEach(item=>{
      const t=ensureTrainer(item);
      if(t.starred) out.starred++;
      const s=statusOf(item,now);
      if(s==='new') out.new++;
      else if(s==='due') out.due++;
      else if(s==='learning') out.learning++;
      else if(s==='hard') out.hard++;
      else if(s==='mastered') out.mastered++;
      if(!t.mastered&&(!t.reviewCount||!t.nextReviewAt||t.nextReviewAt<=now)) out.today++;
    });
    return out;
  }

  function shuffled(input){
    const arr=input.slice();
    for(let i=arr.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }

  function dueRank(item){
    const t=ensureTrainer(item);
    if(!t.reviewCount) return 1;
    if(t.nextReviewAt&&t.nextReviewAt<=Date.now()) return 0;
    if(t.mastered) return 4;
    return 2;
  }

  function filteredItems(all,opts){
    const now=Date.now();
    let list=all.filter(Boolean);
    if(opts.starredOnly) list=list.filter(item=>ensureTrainer(item).starred);

    if(opts.filter==='today'){
      list=list.filter(item=>{
        const t=ensureTrainer(item);
        return !t.mastered&&(!t.reviewCount||!t.nextReviewAt||t.nextReviewAt<=now);
      });
    }else if(opts.filter==='new'){
      list=list.filter(item=>!ensureTrainer(item).reviewCount&&!ensureTrainer(item).mastered);
    }else if(opts.filter==='learning'){
      list=list.filter(item=>{
        const t=ensureTrainer(item);
        return !!t.reviewCount&&!t.mastered;
      });
    }else if(opts.filter==='hard'){
      list=list.filter(item=>{
        const t=ensureTrainer(item);
        return !t.mastered&&t.reviewCount>0&&t.wrongCount>=Math.max(1,t.correctCount);
      });
    }else if(opts.filter==='mastered'){
      list=list.filter(item=>ensureTrainer(item).mastered);
    }

    if(opts.order==='saved'){
      list.sort((a,b)=>Number(b.savedAt||0)-Number(a.savedAt||0));
    }else if(opts.order==='random'||opts.shuffle){
      list=shuffled(list);
    }else{
      list.sort((a,b)=>{
        const ar=dueRank(a),br=dueRank(b);
        if(ar!==br) return ar-br;
        const an=Number(ensureTrainer(a).nextReviewAt||0);
        const bn=Number(ensureTrainer(b).nextReviewAt||0);
        if(an!==bn) return an-bn;
        return Number(b.savedAt||0)-Number(a.savedAt||0);
      });
    }

    const n=opts.size==='all'?list.length:Math.max(1,Number(opts.size)||10);
    return list.slice(0,n);
  }

  function directionFor(index){
    const mode=session.options.direction;
    if(mode==='mixed') return index%2===0?'vi-en':'en-vi';
    return mode;
  }

  function currentCard(){
    return session.cards[session.index]||null;
  }

  function persistItem(item){
    const t=ensureTrainer(item);
    t.updatedAt=Date.now();
    env.state.saved[item.key]=item;
    env.saveState();
    env.queueVocabUpsert(item);
  }

  function reviewInterval(t,rating){
    const current=Math.max(0,Number(t.intervalDays)||0);
    if(rating==='again') return 0;
    if(rating==='hard') return current<1?1:Math.min(30,Math.max(1,Math.ceil(current*1.4)));
    if(rating==='good') return current<1?2:Math.min(90,Math.max(2,Math.ceil(current*2.2)));
    return current<1?4:Math.min(180,Math.max(4,Math.ceil(current*3)));
  }

  function rateCurrent(rating){
    const card=currentCard();
    if(!card) return;
    const item=card.item;
    const t=ensureTrainer(item);

    session.history.push({
      key:item.key,
      index:session.index,
      trainer:JSON.parse(JSON.stringify(t))
    });
    if(session.history.length>20) session.history.shift();

    t.reviewCount=Number(t.reviewCount||0)+1;
    t.lastReviewedAt=Date.now();
    t.lastRating=rating;

    if(rating==='again'){
      t.wrongCount=Number(t.wrongCount||0)+1;
      t.intervalDays=0;
      t.nextReviewAt=Date.now()+10*MINUTE;
      t.mastered=false;
      session.stats.again++;
    }else{
      t.correctCount=Number(t.correctCount||0)+1;
      t.intervalDays=reviewInterval(t,rating);
      t.nextReviewAt=Date.now()+t.intervalDays*DAY;
      if(rating==='hard') session.stats.hard++;
      if(rating==='good') session.stats.good++;
      if(rating==='easy') session.stats.easy++;
      if((rating==='easy'||rating==='good')&&t.correctCount>=5&&t.intervalDays>=30) t.mastered=true;
    }

    persistItem(item);
    nextCard(true);
  }

  function toggleStar(){
    const card=currentCard();
    if(!card) return;
    const t=ensureTrainer(card.item);
    t.starred=!t.starred;
    persistItem(card.item);
    renderCard();
  }

  function toggleMastered(){
    const card=currentCard();
    if(!card) return;
    const t=ensureTrainer(card.item);
    t.mastered=!t.mastered;
    if(t.mastered){
      t.nextReviewAt=Date.now()+60*DAY;
      t.intervalDays=Math.max(60,Number(t.intervalDays||0));
    }else{
      t.nextReviewAt=Date.now();
    }
    persistItem(card.item);
    renderCard();
  }

  function undoLast(){
    const last=session?.history?.pop();
    if(!last){env.toast('Chưa có thao tác đánh giá để hoàn tác.');return;}
    const item=env.state.saved[last.key];
    if(!item) return;
    item.trainer={...trainerDefaults(),...last.trainer};
    persistItem(item);
    session.index=Math.max(0,Math.min(last.index,session.cards.length-1));
    session.revealed=false;
    render();
    env.toast('Đã hoàn tác lần đánh giá gần nhất.');
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
    const direction=directionFor(session.index);
    session.revealed=direction==='en-vi';
    renderCard();

    if(direction==='en-vi'){
      await env.speak(card.item.speechText||card.item.term);
      if(!session?.autoplay) return;
      session.revealed=true;
      renderCard();
      autoplayTimer=setTimeout(()=>{nextCard(false);if(session) {session.autoplay=true;autoplayStep();}},3600);
    }else{
      autoplayTimer=setTimeout(async()=>{
        if(!session?.autoplay) return;
        session.revealed=true;
        renderCard();
        await env.speak(card.item.speechText||card.item.term);
        if(!session?.autoplay) return;
        autoplayTimer=setTimeout(()=>{nextCard(false);if(session){session.autoplay=true;autoplayStep();}},2600);
      },2800);
    }
  }

  function toggleAutoplay(){
    if(session.autoplay){
      stopAutoplay();
      renderCard();
      return;
    }
    session.autoplay=true;
    renderCard();
    autoplayStep();
  }

  function nextCard(){
    const wasAutoplay=!!session?.autoplay;
    clearTimeout(autoplayTimer);
    autoplayTimer=null;
    if(session.index>=session.cards.length-1){
      stopAutoplay();
      renderSummary();
      return;
    }
    session.index++;
    session.revealed=false;
    render();
    if(wasAutoplay){
      session.autoplay=true;
      autoplayStep();
      return;
    }
    if(settings().autoSpeak&&directionFor(session.index)==='en-vi'){
      setTimeout(()=>env.speak(currentCard().item.speechText||currentCard().item.term),120);
    }
  }

  function prevCard(){
    stopAutoplay();
    if(session.index<=0) return;
    session.index--;
    session.revealed=false;
    render();
  }

  function toggleReveal(){
    session.revealed=!session.revealed;
    renderCard();
    if(session.revealed&&directionFor(session.index)==='vi-en'&&settings().autoSpeak){
      env.speak(currentCard().item.speechText||currentCard().item.term);
    }
  }

  function progressPercent(){
    if(!session.cards.length) return 0;
    return Math.round(((session.index+1)/session.cards.length)*100);
  }

  function statusLabel(item){
    const status=statusOf(item);
    return {new:'Mới',due:'Đến hạn',learning:'Đang học',hard:'Khó',mastered:'Đã thuộc'}[status]||'Đang học';
  }

  function cardFaceHTML(card){
    const item=card.item;
    const t=ensureTrainer(item);
    const dir=directionFor(session.index);
    const frontIsVi=dir==='vi-en';
    const front=frontIsVi?(item.meaning||'Chưa có nghĩa tiếng Việt'):item.term;
    const backTitle=frontIsVi?item.term:(item.meaning||'Chưa có nghĩa tiếng Việt');
    const canSpeak=!frontIsVi||session.revealed;

    return `
      <div class="vocab-trainer-card ${session.revealed?'is-flipped':''}" id="vocabTrainerCard" role="button" tabindex="0" aria-label="Chạm để lật thẻ">
        <div class="vocab-trainer-card-top">
          <button id="vocabCardSpeak" class="vocab-card-icon" type="button" ${canSpeak?'':'disabled'} aria-label="Nghe tiếng Anh">${env.uiIcon('volume-2')}</button>
          <button id="vocabCardStar" class="vocab-card-icon ${t.starred?'active':''}" type="button" aria-label="Đánh dấu sao">
            <svg class="ui-icon" viewBox="0 0 24 24" fill="${t.starred?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
        </div>
        <div class="vocab-trainer-face">
          <span class="vocab-trainer-direction">${frontIsVi?'VI → EN':'EN → VI'} · ${esc(statusLabel(item))}</span>
          <div class="vocab-trainer-front">${esc(front)}</div>
          ${session.revealed?`
            <div class="vocab-trainer-divider"></div>
            <div class="vocab-trainer-answer">${esc(backTitle)}</div>
            ${item.ipa?`<div class="vocab-trainer-ipa">${esc(item.ipa)}</div>`:''}
            ${item.example?`<div class="vocab-trainer-example">${esc(item.example)}</div>`:''}
          `:`<small>Chạm vào thẻ để xem đáp án</small>`}
        </div>
        ${session.revealed?`
          <div class="vocab-trainer-mastered">
            <button id="vocabMastered" type="button" class="${t.mastered?'active':''}">${t.mastered?'✓ Đã thuộc':'Đánh dấu đã thuộc'}</button>
          </div>`:''}
      </div>`;
  }

  function ratingHTML(){
    if(!session.revealed) return `
      <div class="vocab-trainer-reveal-wrap">
        <button id="vocabReveal" class="vocab-trainer-reveal" type="button">Hiện đáp án</button>
      </div>`;
    return `
      <div class="vocab-trainer-ratings">
        <button data-vocab-rate="again" type="button"><b>Quên</b><span>10 phút</span></button>
        <button data-vocab-rate="hard" type="button"><b>Khó</b><span>~1 ngày</span></button>
        <button data-vocab-rate="good" type="button"><b>Nhớ</b><span>Giãn lịch</span></button>
        <button data-vocab-rate="easy" type="button"><b>Rất chắc</b><span>Giãn xa</span></button>
      </div>`;
  }

  function renderCard(){
    if(!session||!currentCard()) return;
    const card=currentCard();
    const all=Object.values(env.state.saved||{});
    const sum=summary(all);
    const root=$('#vocabTrainerRoot');
    if(!root) return;

    root.innerHTML=`
      <div class="vocab-trainer-topbar">
        <button id="vocabTrainerClose" class="vocab-trainer-round" type="button" aria-label="Đóng">×</button>
        <div class="vocab-trainer-counter"><strong>${session.index+1} / ${session.cards.length}</strong></div>
        <button id="vocabTrainerSettings" class="vocab-trainer-round" type="button" aria-label="Tùy chọn">
          <svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>
        </button>
      </div>
      <div class="vocab-trainer-progress"><i style="width:${progressPercent()}%"></i></div>
      <div class="vocab-trainer-mini-stats">
        <span class="need"><b>${sum.today}</b> cần ôn</span>
        <span class="known"><b>${sum.mastered}</b> đã thuộc</span>
      </div>
      <div class="vocab-trainer-stage">
        ${cardFaceHTML(card)}
        ${ratingHTML()}
      </div>
      <div class="vocab-trainer-bottom">
        <button id="vocabUndo" class="vocab-bottom-icon" type="button" ${session.history.length?'':'disabled'} aria-label="Hoàn tác">↶</button>
        <button id="vocabPrev" class="vocab-bottom-text" type="button" ${session.index<=0?'disabled':''}>← Trước</button>
        <button id="vocabAutoplay" class="vocab-bottom-icon ${session.autoplay?'active':''}" type="button" aria-label="Tự động">${session.autoplay?'■':'▶'}</button>
        <button id="vocabNext" class="vocab-bottom-text" type="button">Sau →</button>
      </div>
      <div id="vocabSettingsSheet"></div>`;

    bindCard();
  }

  function bindSwipe(cardEl){
    let startX=0,startY=0,dragging=false;
    cardEl.addEventListener('touchstart',e=>{
      if(!e.touches?.length) return;
      startX=e.touches[0].clientX;
      startY=e.touches[0].clientY;
      dragging=true;
    },{passive:true});
    cardEl.addEventListener('touchend',e=>{
      if(!dragging||!e.changedTouches?.length) return;
      dragging=false;
      const dx=e.changedTouches[0].clientX-startX;
      const dy=e.changedTouches[0].clientY-startY;
      if(Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.25) return;
      if(dx<0) nextCard(); else prevCard();
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
      card.onclick=e=>{
        if(e.target.closest('button')) return;
        toggleReveal();
      };
      card.onkeydown=e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleReveal();}
        if(e.key==='ArrowRight') nextCard();
        if(e.key==='ArrowLeft') prevCard();
      };
      bindSwipe(card);
    }

    const speak=$('#vocabCardSpeak');
    if(speak) speak.onclick=e=>{
      e.stopPropagation();
      env.speak(currentCard().item.speechText||currentCard().item.term);
    };
    const star=$('#vocabCardStar');
    if(star) star.onclick=e=>{e.stopPropagation();toggleStar();};
    const mastered=$('#vocabMastered');
    if(mastered) mastered.onclick=e=>{e.stopPropagation();toggleMastered();};
    const reveal=$('#vocabReveal');
    if(reveal) reveal.onclick=toggleReveal;
    $$('[data-vocab-rate]').forEach(btn=>btn.onclick=()=>rateCurrent(btn.dataset.vocabRate));
  }

  function settingsOptions(){
    const s=settings();
    return `
      <div class="vocab-settings-backdrop" id="vocabSettingsBackdrop">
        <section class="vocab-settings-sheet" role="dialog" aria-modal="true" aria-label="Tùy chọn flashcard">
          <div class="vocab-settings-head"><h2>Tùy chọn</h2><button id="vocabSettingsClose" type="button">×</button></div>

          <label class="vocab-settings-row">
            <span><b>Mặt trước</b><small>Chọn hướng nhớ chủ động</small></span>
            <select id="vocabDirection">
              <option value="vi-en" ${s.direction==='vi-en'?'selected':''}>Tiếng Việt → Tiếng Anh</option>
              <option value="en-vi" ${s.direction==='en-vi'?'selected':''}>Tiếng Anh → Tiếng Việt</option>
              <option value="mixed" ${s.direction==='mixed'?'selected':''}>Trộn hai hướng</option>
            </select>
          </label>

          <label class="vocab-settings-row">
            <span><b>Số thẻ trong buổi</b><small>Giữ buổi học ngắn và tập trung</small></span>
            <select id="vocabSize">
              ${['5','10','20','30','all'].map(x=>`<option value="${x}" ${s.size===x?'selected':''}>${x==='all'?'Tất cả':x+' thẻ'}</option>`).join('')}
            </select>
          </label>

          <label class="vocab-settings-row">
            <span><b>Bộ thẻ</b><small>Chọn nhóm từ muốn luyện</small></span>
            <select id="vocabFilter">
              <option value="all" ${s.filter==='all'?'selected':''}>Tất cả</option>
              <option value="today" ${s.filter==='today'?'selected':''}>Cần ôn hôm nay</option>
              <option value="new" ${s.filter==='new'?'selected':''}>Từ mới</option>
              <option value="learning" ${s.filter==='learning'?'selected':''}>Đang học</option>
              <option value="hard" ${s.filter==='hard'?'selected':''}>Từ khó</option>
              <option value="mastered" ${s.filter==='mastered'?'selected':''}>Đã thuộc</option>
            </select>
          </label>

          <label class="vocab-settings-row">
            <span><b>Sắp xếp thẻ ghi nhớ</b><small>Ưu tiên ôn đúng lúc hoặc học tự do</small></span>
            <select id="vocabOrder">
              <option value="srs" ${s.order==='srs'?'selected':''}>Ưu tiên SRS</option>
              <option value="random" ${s.order==='random'?'selected':''}>Ngẫu nhiên</option>
              <option value="saved" ${s.order==='saved'?'selected':''}>Mới lưu trước</option>
            </select>
          </label>

          <label class="vocab-settings-toggle"><span><b>Chỉ học từ có gắn sao</b><small>Tập trung vào danh sách quan trọng</small></span><input id="vocabStarredOnly" type="checkbox" ${s.starredOnly?'checked':''}><i></i></label>
          <label class="vocab-settings-toggle"><span><b>Tự phát âm tiếng Anh</b><small>Không phát đáp án trước ở chế độ VI → EN</small></span><input id="vocabAutoSpeak" type="checkbox" ${s.autoSpeak?'checked':''}><i></i></label>
          <label class="vocab-settings-toggle"><span><b>Trộn thẻ</b><small>Đổi thứ tự trong mỗi buổi</small></span><input id="vocabShuffle" type="checkbox" ${s.shuffle?'checked':''}><i></i></label>

          <div class="vocab-settings-actions">
            <button id="vocabApplySettings" class="primary-button" type="button">Áp dụng & tạo lại buổi học</button>
            <button id="vocabResetProgress" class="vocab-reset-button" type="button">Đặt lại tiến độ thẻ ghi nhớ</button>
            <small>Đặt lại chỉ xóa tiến độ ôn; giữ nguyên từ đã lưu và dấu sao.</small>
          </div>
        </section>
      </div>`;
  }

  function openSettings(){
    stopAutoplay();
    const holder=$('#vocabSettingsSheet');
    holder.innerHTML=settingsOptions();
    $('#vocabSettingsClose').onclick=()=>holder.innerHTML='';
    $('#vocabSettingsBackdrop').onclick=e=>{if(e.target.id==='vocabSettingsBackdrop') holder.innerHTML='';};

    $('#vocabApplySettings').onclick=()=>{
      const s=settings();
      s.direction=$('#vocabDirection').value;
      s.size=$('#vocabSize').value;
      s.filter=$('#vocabFilter').value;
      s.order=$('#vocabOrder').value;
      s.starredOnly=$('#vocabStarredOnly').checked;
      s.autoSpeak=$('#vocabAutoSpeak').checked;
      s.shuffle=$('#vocabShuffle').checked;
      saveSettings();
      buildSession();
      render();
    };

    $('#vocabResetProgress').onclick=()=>{
      if(!confirm('Đặt lại toàn bộ tiến độ ôn? Từ đã lưu và dấu sao sẽ được giữ nguyên.')) return;
      Object.values(env.state.saved||{}).forEach(item=>{
        const starred=!!ensureTrainer(item).starred;
        item.trainer={...trainerDefaults(),starred,updatedAt:Date.now()};
        persistItem(item);
      });
      env.toast('Đã đặt lại tiến độ ôn từ.');
      buildSession();
      render();
    };
  }

  function buildSession(overrides={}){
    const s=settings();
    Object.assign(s,overrides||{});
    saveSettings();
    const all=Object.values(env.state.saved||{}).filter(Boolean);
    const selected=filteredItems(all,s);

    session={
      options:{...s},
      cards:selected.map(item=>({item})),
      index:0,
      revealed:false,
      history:[],
      autoplay:false,
      stats:{again:0,hard:0,good:0,easy:0}
    };
  }

  function renderEmpty(){
    $('#vocabTrainerRoot').innerHTML=`
      <div class="vocab-trainer-empty">
        <button id="vocabTrainerClose" class="vocab-trainer-round" type="button">×</button>
        <div><span>VOCABULARY TRAINER</span><h2>Không có thẻ phù hợp với bộ lọc này.</h2><p>Hãy đổi bộ lọc, bỏ “chỉ từ có sao” hoặc chọn “Tất cả”.</p></div>
        <button id="vocabEmptySettings" class="primary-button" type="button">Mở tùy chọn</button>
        <div id="vocabSettingsSheet"></div>
      </div>`;
    $('#vocabTrainerClose').onclick=close;
    $('#vocabEmptySettings').onclick=openSettings;
  }

  function renderSummary(){
    stopAutoplay();
    const total=session.stats.again+session.stats.hard+session.stats.good+session.stats.easy;
    $('#vocabTrainerRoot').innerHTML=`
      <div class="vocab-trainer-summary">
        <span class="eyebrow">SESSION COMPLETE</span>
        <h1>Buổi ôn đã hoàn thành</h1>
        <p>${total?`Bạn đã đánh giá ${total} thẻ. Các thẻ sẽ tự quay lại theo lịch ôn.`:'Bạn đã xem hết bộ thẻ. Hãy đánh giá Quên / Khó / Nhớ / Rất chắc để tạo lịch ôn cá nhân.'}</p>
        <div class="vocab-trainer-summary-grid">
          <div><b>${session.stats.again}</b><span>Quên</span></div>
          <div><b>${session.stats.hard}</b><span>Khó</span></div>
          <div><b>${session.stats.good}</b><span>Nhớ</span></div>
          <div><b>${session.stats.easy}</b><span>Rất chắc</span></div>
        </div>
        <div class="vocab-trainer-summary-actions">
          <button id="vocabReviewAgain" class="primary-button" type="button">Ôn một buổi khác</button>
          <button id="vocabSummaryClose" class="secondary-button" type="button">Về Từ đã lưu</button>
        </div>
      </div>`;
    $('#vocabReviewAgain').onclick=()=>{buildSession();render();};
    $('#vocabSummaryClose').onclick=close;
  }

  function render(){
    if(!session?.cards?.length){renderEmpty();return;}
    renderCard();
  }

  function close(){
    stopAutoplay();
    document.documentElement.classList.remove('vocab-trainer-open');
    session=null;
    env.renderVocab();
  }

  function open(nextEnv,overrides={}){
    env=nextEnv;
    Object.values(env.state.saved||{}).forEach(ensureTrainer);
    buildSession(overrides);
    env.setHeader('Library › Vocabulary Trainer','Ôn từ');
    document.documentElement.classList.add('vocab-trainer-open');
    env.main.innerHTML='<section id="vocabTrainerRoot" class="vocab-trainer-root"></section>';
    render();

    if(settings().autoSpeak&&session.cards.length&&directionFor(0)==='en-vi'){
      setTimeout(()=>env.speak(currentCard().item.speechText||currentCard().item.term),150);
    }
  }

  window.VocabularyTrainer={open,summary,ensureTrainer};
})();