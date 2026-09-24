(() => {
  'use strict';
  window.__LS_APP_LOADED = true;
  let L = null;
  const CATALOG = window.PATTERN_CATALOG || [];
  const PLATFORM = window.PLATFORM_DATA || {};
  const STORE = window.ContentStore;
  const KEY = 'interactiveEnglishBook:v2';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  const CORE_LESSON_ID = 'en-pattern-001';
  const defaults = {
    hideVi:false, rate:0.88, learned:{}, saved:{}, meaningOverrides:{},
    quizBest:0, quizRuns:0,
    quizBestByLesson:{}, quizRunsByLesson:{},
    lessonVisits:0, lessonVisitsByLesson:{}
  };
  let state = loadState();
  let currentLookup = null;
  let currentSelection = '';
  let quiz = { index:0, correct:0, counted:new Set(), revealed:false, mode:'sequential', baseItems:[], items:[], scopeId:null, context:'lesson' };
  let flashIndex = 0;
  let installPrompt = null;
  let sequenceRun = 0;
  let practiceLessons = [];

  function loadState(){
    try {
      const raw=JSON.parse(localStorage.getItem(KEY) || '{}');
      const next={
        ...defaults,
        ...raw,
        learned:{...(raw.learned||{})},
        saved:{...(raw.saved||{})},
        meaningOverrides:{...(raw.meaningOverrides||{})},
        quizBestByLesson:{...(raw.quizBestByLesson||{})},
        quizRunsByLesson:{...(raw.quizRunsByLesson||{})},
        lessonVisitsByLesson:{...(raw.lessonVisitsByLesson||{})}
      };

      // Migrate V2 single-lesson progress to scoped lesson keys once.
      Object.keys(next.learned).forEach(key=>{
        if(!key.includes(':')){
          next.learned[`${CORE_LESSON_ID}:${key}`]=next.learned[key];
          delete next.learned[key];
        }
      });
      if(next.quizBest && next.quizBestByLesson[CORE_LESSON_ID]==null) next.quizBestByLesson[CORE_LESSON_ID]=next.quizBest;
      if(next.quizRuns && next.quizRunsByLesson[CORE_LESSON_ID]==null) next.quizRunsByLesson[CORE_LESSON_ID]=next.quizRuns;
      if(next.lessonVisits && next.lessonVisitsByLesson[CORE_LESSON_ID]==null) next.lessonVisitsByLesson[CORE_LESSON_ID]=next.lessonVisits;
      return next;
    } catch { return {...defaults}; }
  }
  function saveState(){ localStorage.setItem(KEY, JSON.stringify(state)); updateGlobalUI(); }
  function esc(s=''){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escAttr(s=''){ return esc(s); }
  function normalizeText(s=''){ return String(s).toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim(); }
  function keyFor(s=''){ return normalizeText(s).replace(/\s+/g,'-'); }
  function currentLessonId(){ return L?.id || CORE_LESSON_ID; }
  function scopedLearnKey(localKey,id=currentLessonId()){ return `${id}:${localKey}`; }
  function learnedCount(id=CORE_LESSON_ID){
    const prefix=`${id}:`;
    return Object.keys(state.learned||{}).filter(key=>key.startsWith(prefix)&&state.learned[key]).length;
  }
  function quizBestFor(id=CORE_LESSON_ID){ return Number(state.quizBestByLesson?.[id] || 0); }
  function quizRunsFor(id=CORE_LESSON_ID){ return Number(state.quizRunsByLesson?.[id] || 0); }
  function lessonPercent(id=CORE_LESSON_ID){
    const lesson=STORE?.get?.(id);
    const sentenceTotal=lesson?Math.max(1,collectLessonSentences(lesson).length):20;
    const quizTotal=lesson?Math.max(1,quizItemsFromLessons([lesson]).length):10;
    const learnedPart=Math.min(sentenceTotal,learnedCount(id))/sentenceTotal;
    const quizPart=Math.min(quizTotal,quizBestFor(id))/quizTotal;
    return Math.min(100,Math.round((learnedPart*0.7+quizPart*0.3)*100));
  }
  function savedCount(){ return Object.keys(state.saved || {}).length; }

  function normalizeMeaning(s=''){
    return String(s)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/đ/g,'d').replace(/Đ/g,'D')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function sentenceLearnKey(en=''){ return 'sentence-' + keyFor(en); }
  function meaningOverrideKey(en='',lessonId=currentLessonId()){ return `${lessonId}:${normalizeText(en)}`; }
  function meaningFor(en='',fallback='',lessonId=currentLessonId()){
    const key=meaningOverrideKey(en,lessonId);
    return Object.prototype.hasOwnProperty.call(state.meaningOverrides||{},key)
      ? state.meaningOverrides[key]
      : (fallback||'');
  }
  function originalMeaningFor(en='',fallback=''){ return fallback||''; }


  function collectLessonSentences(lesson){
    const out=[]; const seen=new Set();
    const add=(en,vi='',source='')=>{
      if(typeof en!=='string') return;
      en=en.trim();
      const originalVi=typeof vi==='string'?vi.trim():'';
      vi=meaningFor(en,originalVi,lesson?.id||currentLessonId());
      const key=normalizeText(en);
      if(!key || seen.has(key) || !/[a-z]/i.test(en) || /^\//.test(en)) return;
      seen.add(key);
      out.push({en,vi,originalVi,source});
    };
    const addPairs=(items,source='')=>(items||[]).forEach(x=>{
      if(Array.isArray(x) && typeof x[0]==='string') add(x[0],x[1]||'',source);
    });

    addPairs(lesson?.introExamples,'intro');

    if(lesson?.layout==='sectioned-pattern'){
      (lesson.sections||[]).forEach(section=>{
        (section.blocks||[]).forEach(block=>{
          if(block?.type==='sentences') addPairs(block.items,section.id||section.title||'section');
          if(block?.type==='dialogs'){
            (block.items||[]).forEach(dialog=>(dialog.rows||[]).forEach(row=>add(row[1],row[2]||'',section.id||'dialog')));
          }
        });
      });
    }else{
      const u=lesson?.ui||{},p=u.pronunciation||{},comp=u.comparison||{},q=u.questions||{};
      if(p.exampleSentence) add(p.exampleSentence,p.exampleMeaning||'','pronunciation');
      addPairs(p.contrastSentences,'pronunciation');
      addPairs(comp.examples,'comparison');
      if(Array.isArray(comp.homeSentence)) add(comp.homeSentence[0],comp.homeSentence[1]||'','comparison');
      if(Array.isArray(comp.publicSentence)) add(comp.publicSentence[0],comp.publicSentence[1]||'','comparison');
      addPairs(lesson?.sentences20,'master');
      addPairs(lesson?.work,'work');
      addPairs(lesson?.restaurantNouns,'restaurant');
      (lesson?.buildSteps||[]).forEach(x=>Array.isArray(x)&&add(x[1],x[2]||'','expansion'));
      (lesson?.dialogs||[]).forEach(dialog=>(dialog.rows||[]).forEach(row=>add(row[1],row[2]||'','dialog')));
      addPairs(lesson?.questions,'questions');
      addPairs(q.answers,'answers');
      if(u?.work?.calloutSentence) add(u.work.calloutSentence,u.work.calloutMeaning||'','work');
      if(u?.restaurant?.leftExample) add(u.restaurant.leftExample,'','restaurant');
      if(u?.restaurant?.rightExample) add(u.restaurant.rightExample,'','restaurant');
    }
    return out;
  }

  function quizItemsFromLessons(lessons){
    const grouped=new Map();
    (lessons||[]).forEach(lesson=>{
      collectLessonSentences(lesson).forEach(item=>{
        const vi=(item.vi||'').trim();
        if(!vi) return;
        if(/^(nói rõ|nói tự nhiên|đọc chậm|đọc tự nhiên|ipa\b)/i.test(vi)) return;
        if(vi.includes('→')) return;
        const meaningKey=normalizeMeaning(vi);
        if(!meaningKey) return;
        if(!grouped.has(meaningKey)){
          grouped.set(meaningKey,{
            prompt:vi,
            answers:[],
            lessonIds:[],
            lessonTitles:[]
          });
        }
        const group=grouped.get(meaningKey);
        if(!group.answers.some(answer=>normalizeText(answer)===normalizeText(item.en))) group.answers.push(item.en);
        if(!group.lessonIds.includes(lesson.id)) group.lessonIds.push(lesson.id);
        if(!group.lessonTitles.includes(lesson.title)) group.lessonTitles.push(lesson.title);
      });
    });
    return [...grouped.values()].filter(item=>item.answers.length);
  }

  function shuffled(items){
    const a=[...(items||[])];
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  function makeQuizSession(baseItems,mode='sequential',scopeId=null,context='lesson'){
    const clean=[...(baseItems||[])];
    return {
      index:0,correct:0,counted:new Set(),revealed:false,
      mode,
      baseItems:clean,
      items:mode==='random'?shuffled(clean):[...clean],
      scopeId,
      context
    };
  }

  function currentLessonSentenceTotal(id=currentLessonId()){
    const lesson=STORE?.get?.(id);
    return lesson?collectLessonSentences(lesson).length:20;
  }


  function updateGlobalUI(){
    const route=parseRoute();
    const lessonId=route.name==='lesson' && L?.id ? L.id : CORE_LESSON_ID;
    const pct=lessonPercent(lessonId);
    const meta=STORE?.meta?.(lessonId);
    if($('#sidebarProgressLabel')) $('#sidebarProgressLabel').textContent=`English · Pattern ${String(meta?.order||1).padStart(2,'0')}`;
    $('#sidebarProgressText').textContent=pct+'%';
    $('#sidebarProgressBar').style.width=pct+'%';
    const sentenceTotal=currentLessonSentenceTotal(lessonId);
    $('#sidebarProgressNote').textContent=pct>=100 ? `${meta?.title||'Bài học'} đã hoàn thành` : `${Math.min(sentenceTotal,learnedCount(lessonId))}/${sentenceTotal} câu đã đánh dấu thuộc`;
    $('#savedCountBadge').textContent = savedCount();
    $('#globalRateSelect').value = String(state.rate);
    $('#hideViBtn').textContent = state.hideVi ? 'Hiện tiếng Việt' : 'Ẩn tiếng Việt';
    document.body.classList.toggle('hide-vietnamese', !!state.hideVi);
  }

  function routeTo(route){
    location.hash = route === 'home' ? '#home' : '#' + route;
    closeSidebar();
  }
  function parseRoute(){
    const hash = (location.hash || '#home').slice(1);
    if (hash.startsWith('lesson/')){
      const parts=hash.split('/');
      return {name:'lesson', id:Number(parts[1])||1, view:parts[2]||'overview'};
    }
    return {name:hash || 'home'};
  }
  function setNavActive(name){
    $$('.nav-item,.bottom-nav button').forEach(b => b.classList.toggle('active', b.dataset.route === name));
  }
  function setHeader(crumb,title, lesson=false){
    $('#crumb').textContent = crumb;
    $('#pageTitle').textContent = title;
    $('#lessonControls').classList.toggle('hidden', !lesson);
  }
  async function render(){
    stopSpeech();
    closePopover();
    hideSelectionBar();
    const r = parseRoute();
    setNavActive(r.name === 'lesson' ? 'patterns' : r.name);
    try {
      if (r.name === 'home') renderHome();
      else if (r.name === 'patterns') renderPatterns();
      else if (r.name === 'japanese') await renderJapanese();
      else if (r.name === 'lesson') await renderLesson(r.id,r.view);
      else if (r.name === 'vocab') renderVocab();
      else if (r.name === 'practice') await renderPracticeHub();
      else if (r.name === 'progress') await renderProgress();
      else if (r.name === 'settings') renderSettings();
      else renderHome();
    } catch (error) {
      console.error(error);
      setHeader('Content','Không tải được nội dung');
      $('#mainView').innerHTML=`<section class="page-hero"><div class="eyebrow">CONTENT ERROR</div><h1>Không tải được bài học</h1><p>${esc(error?.message||'Unknown content error')}</p><div class="hero-actions"><button class="primary-button" data-go="home">Về trang chủ</button></div></section>`;
      bindGenericRoutes();
    }
    updateGlobalUI();
    $('#mainView').focus({preventScroll:true});
    window.scrollTo({top:0, behavior:'instant'});
  }

  async function ensureContent(id){
    if(!STORE) throw new Error('ContentStore is not available.');
    return STORE.load(id);
  }
  async function ensureCoreEnglish(){
    if(!L || L.id!==CORE_LESSON_ID) L=await ensureContent(CORE_LESSON_ID);
    return L;
  }

  function renderHome(){
    L=null;
    setHeader('Trang chủ','Language Studio');
    const pct=lessonPercent();
    const tracks=(PLATFORM.tracks||[]).map(trackCard).join('');
    const indexedModules=(STORE?.index||[]).filter(item=>item.featured).map(item=>({
      lang:item.language==='en'?'English':item.language==='ja'?'Japanese':item.language,
      tag:item.status==='available'?'Có bài':item.status==='next'?'Tiếp theo':'Chuẩn bị',
      title:item.title,desc:item.meaning||item.description||'',route:item.route||'home',accent:item.accent||'purple'
    }));
    const modules=[...indexedModules,...(PLATFORM.utilityModules||[])].map(moduleCard).join('');
    $('#mainView').innerHTML = `
      <section class="landing-hero">
        <div class="hero-copy-new">
          <div class="landing-kicker">ENGLISH · JAPANESE · VOCABULARY · SPEAKING</div>
          <h1 class="display-title">Một <span class="marker marker-purple">hệ thống</span> học ngôn ngữ<br>cho <span class="marker marker-green">cuộc sống thật</span>.</h1>
          <p class="hero-lead">Không còn là một website chỉ dành cho 80 mẫu câu. Đây là nền tảng để bạn học English, Japanese, từ vựng, nghe, nói và luyện phản xạ — tất cả trong cùng một nơi.</p>
          <div class="hero-actions">
            <button class="primary-button" data-go="lesson/1">Tiếp tục bài đang học →</button>
            <button class="secondary-button" data-go="patterns">Khám phá English</button>
          </div>
          <div class="hero-mini-stats">
            <div><strong>${pct}%</strong><span>Pattern 01</span></div>
            <div><strong>${savedCount()}</strong><span>Từ đã lưu</span></div>
            <div><strong>${quizBestFor()}/10</strong><span>Quiz tốt nhất</span></div>
          </div>
        </div>
        <div class="hero-showcase">
          <div class="showcase-window">
            <div class="window-top"><span></span><span></span><span></span><b>Today · English</b></div>
            <div class="showcase-body">
              <div class="showcase-side"><div class="tiny-logo">LS</div><span class="active"></span><span></span><span></span><span></span></div>
              <div class="showcase-main">
                <div class="tiny-label">CURRENT LESSON</div><h3>I’d like to…</h3><p>Tôi muốn… / Tôi muốn được…</p>
                <div class="mini-sentence">${sentenceRow("I'd like to go home.","Tôi muốn về nhà.")}</div>
                <div class="showcase-progress"><i style="width:${pct}%"></i></div>
                <div class="showcase-tags"><span>Listen</span><span>Words</span><span>Speak</span><span>Review</span></div>
              </div>
            </div>
          </div>
          <div class="float-shape shape-a"></div><div class="float-shape shape-b"></div>
          <div class="float-note">日<br><small>Japanese<br>next</small></div>
        </div>
      </section>

      <section class="big-statement">
        <h2>Bạn không cần thêm nhiều app học rời rạc.<br>Bạn cần <span class="marker marker-purple">một nơi</span> để học và <span class="marker marker-yellow">tiếp tục tiến bộ</span>.</h2>
        <p>Mỗi phần học dùng chung một hệ thống: nghe → hiểu → nói → lưu → ôn lại. Nội dung có thể mở rộng mà không phải làm lại website từ đầu.</p>
        <div class="scribble" aria-hidden="true">⌁⌁⌁  ↗  ⌁⌁⌁</div>
      </section>

      <section class="landing-section">
        <div class="landing-section-head"><div><span class="landing-kicker">LEARNING TRACKS</span><h2>Một hệ thống, nhiều hướng học</h2></div><p>English hôm nay, Japanese ngày mai — dữ liệu và trải nghiệm học vẫn nằm trong cùng một nền tảng.</p></div>
        <div class="track-grid-new">${tracks}</div>
      </section>

      <section class="purple-band">
        <div><span class="landing-kicker light">INTERACTIVE LEARNING</span><h2>Đọc như một cuốn sách.<br>Chạm vào là học.</h2></div>
        <div class="band-features">
          <div><b>01</b><strong>Nghe câu</strong><span>Click câu để phát âm và highlight từ.</span></div>
          <div><b>02</b><strong>Tra từ</strong><span>Click một từ để xem IPA, nghĩa và ví dụ.</span></div>
          <div><b>03</b><strong>Lưu & ôn</strong><span>Lưu từ rồi ôn lại bằng flashcard.</span></div>
          <div><b>04</b><strong>Nói lại</strong><span>Dùng micro trong bài luyện trên trình duyệt hỗ trợ.</span></div>
        </div>
      </section>

      <section class="landing-section">
        <div class="landing-section-head"><div><span class="landing-kicker">YOUR LIBRARY</span><h2>Nội dung đang phát triển</h2></div><p>Không khóa cấu trúc vào một khóa học duy nhất. Mỗi module là một khối có thể mở rộng.</p></div>
        <div class="module-grid-new">${modules}</div>
      </section>

      <section class="split-promo">
        <div class="promo-copy"><span class="landing-kicker">CURRENT LESSON</span><h2>I’d like to…</h2><p>Giữ nguyên bài học tương tác nhưng chuyển danh sách toàn bộ câu và phần luyện sang hai chế độ riêng để trang bài học gọn hơn.</p><button class="primary-button" data-go="lesson/1">Mở bài đầy đủ</button></div>
        <div class="promo-preview"><div class="preview-label">Tap to listen</div>
          ${sentenceRow("I'd like to buy this.","Tôi muốn mua cái này.")}
          ${sentenceRow("I'd like to ask you something.","Tôi muốn hỏi bạn một việc.")}
          ${sentenceRow("I'd like to check something.","Tôi muốn kiểm tra một việc.")}
        </div>
      </section>

      <section class="device-banner">
        <div><span class="landing-kicker">PHONE + PC</span><h2>Học trên nhiều thiết bị</h2><p>Tiến độ hiện được lưu riêng trên từng thiết bị. Bạn có thể xuất file dữ liệu học và nhập lại trên điện thoại hoặc máy khác. Khi site được đưa lên HTTPS, nút cài app cũng sẽ sẵn sàng.</p></div>
        <button class="primary-button" data-go="settings">Thiết bị & dữ liệu →</button>
      </section>
    `;
    bindGenericRoutes();
    hydrateSentences($('#mainView'));
  }

  function trackCard(item){
    const a=esc(item.accent||'purple');
    return `<article class="track-card-new accent-${a}"><div class="track-code">${esc(item.code||'')}</div><div><span class="track-sub">${esc(item.subtitle||'')}</span><h3>${esc(item.title||'')}</h3><p>${esc(item.description||'')}</p></div><button class="round-arrow" data-go="${escAttr(item.route||'home')}" aria-label="Mở ${escAttr(item.title||'')}">↗</button></article>`;
  }

  function moduleCard(item){
    return `<article class="module-card-new accent-${esc(item.accent||'purple')}"><div class="module-top"><span>${esc(item.lang||'')}</span><em>${esc(item.tag||'')}</em></div><h3>${esc(item.title||'')}</h3><p>${esc(item.desc||'')}</p><button class="secondary-button" data-go="${escAttr(item.route||'home')}">Mở module</button></article>`;
  }

  function feature(icon,title,text){ return `<article class="feature-card"><div class="feature-icon">${icon}</div><h3>${esc(title)}</h3><p>${esc(text)}</p></article>`; }

  function renderPatterns(){
    L=null;
    setHeader('English','English Learning');
    $('#mainView').innerHTML = `
      <section class="page-hero"><div class="eyebrow">ENGLISH LEARNING</div><h1>English cho giao tiếp thực tế</h1><p>80 mẫu câu chỉ là một track đầu tiên. Sau này khu vực English có thể mở rộng sang vocabulary, listening, speaking, reading và tình huống công việc.</p></section>
      <div class="search-row"><input id="patternSearch" class="search-input" placeholder="Tìm mẫu câu, ví dụ: I'd like to..." /><button class="filter-chip active" data-filter="all">Tất cả</button><button class="filter-chip" data-filter="available">Đã có bài</button></div>
      <section id="patternsGrid" class="card-grid"></section>`;
    let filter='all';
    const draw=()=>{
      const q=normalizeText($('#patternSearch').value);
      const items=CATALOG.filter(p => (filter==='all' || p.status==='available') && (!q || normalizeText(`${p.title} ${p.meaning}`).includes(q)));
      $('#patternsGrid').innerHTML = items.map(patternCard).join('');
      bindGenericRoutes();
      $$('.pattern-card button[data-disabled]').forEach(btn => btn.onclick=()=>toast(btn.dataset.status==='next'?'Mẫu 02 đã có tên và nghĩa; nội dung chi tiết chưa được nhập.':'Khung bài này đã sẵn sàng, nhưng chưa có nội dung.'));
    };
    $('#patternSearch').addEventListener('input',draw);
    $$('.filter-chip').forEach(b=>b.onclick=()=>{filter=b.dataset.filter; $$('.filter-chip').forEach(x=>x.classList.toggle('active',x===b)); draw();});
    draw();
  }
  function patternCard(p){
    if(!p) return '';
    const status=p.status==='available'?'Đã có bài':p.status==='next'?'Bài tiếp theo':'Đang chuẩn bị';
    const cls=p.status==='available'?'available':p.status==='next'?'next':'locked';
    return `<article class="pattern-card ${cls}"><span class="pattern-number">MẪU ${String(p.id).padStart(2,'0')}</span><span class="status-chip ${cls}">${status}</span><h3>${esc(p.title)}</h3><p>${esc(p.meaning)}</p><div class="card-action">${p.status==='available'?`<button class="primary-button" data-go="lesson/${p.id}">Mở bài học</button>`:`<button class="secondary-button" data-disabled="1" data-status="${p.status}">Chưa có nội dung</button>`}</div></article>`;
  }

  async function renderLesson(id,view='overview'){
    const meta=CATALOG.find(item=>item.id===id);
    if(!meta || meta.status!=='available' || !meta.contentId){toast('Bài này chưa có nội dung hoàn chỉnh.');routeTo('patterns');return;}
    const lesson=await ensureContent(meta.contentId);
    if(lesson.renderer!=='english-pattern') throw new Error(`Unsupported renderer: ${lesson.renderer}`);
    L=lesson;
    const lessonId=lesson.id||CORE_LESSON_ID;

    if(view==='sentences'){
      renderLessonSentencesPage(id,meta,lesson);
      return;
    }
    if(view==='practice'){
      renderLessonPracticePage(id,meta,lesson);
      return;
    }

    state.lessonVisitsByLesson[lessonId]=(state.lessonVisitsByLesson[lessonId]||0)+1;
    if(lessonId===CORE_LESSON_ID) state.lessonVisits=state.lessonVisitsByLesson[lessonId];
    saveState();
    setHeader(`English › Patterns › ${String(id).padStart(2,'0')}`,L.title||meta.title,true);
    $('#mainView').innerHTML=lessonHTML();
    bindGenericRoutes();
    hydrateSentences($('#mainView'));
    bindLessonEvents();
  }

  function lessonActionPanel(id){
    const all=collectLessonSentences(L);
    const quizCount=quizItemsFromLessons([L]).length;
    return `<div class="lesson-action-panel lesson-action-panel-top">
      <div class="lesson-action-copy">
        <h2>HỌC & LUYỆN TOÀN BỘ BÀI</h2>
      </div>
      <div class="lesson-action-buttons">
        <button class="lesson-action-card" data-go="lesson/${id}/sentences">
          <span class="lesson-action-icon">📚</span>
          <span><strong>Toàn bộ câu trong bài</strong><small>${all.length} câu · nghe từng câu hoặc nghe toàn bộ</small></span>
          <b>→</b>
        </button>
        <button class="lesson-action-card practice" data-go="lesson/${id}/practice">
          <span class="lesson-action-icon">✍️</span>
          <span><strong>Luyện toàn bộ câu</strong><small>${quizCount} ý/câu luyện · tuần tự hoặc random</small></span>
          <b>→</b>
        </button>
      </div>
    </div>`;
  }

  function renderLessonSentencesPage(id,meta,lesson){
    const items=collectLessonSentences(lesson);
    setHeader(`English › Pattern ${String(id).padStart(2,'0')} › Sentences`,`Toàn bộ câu · ${lesson.title}`,true);
    $('#mainView').innerHTML=`
      <section class="subpage-hero">
        <button class="text-button subpage-back" data-go="lesson/${id}">← Quay lại bài học</button>
        <div class="eyebrow">ALL SENTENCES</div>
        <h1>Toàn bộ câu trong bài</h1>
        <p>${items.length} câu không trùng hệt nhau. Bạn có thể sửa nghĩa tiếng Việt ngay trên từng câu.</p>
        <div class="study-toolbar">
          <button id="playAllLesson" class="primary-button">▶ Nghe toàn bộ 1 lần</button>
          <span class="muted">Bấm một câu bất kỳ để dừng danh sách và nghe câu đó ngay.</span>
        </div>
      </section>
      <section class="book-section compact-subpage">
        <div class="sentence-table" id="sectionLearnableSentences">
          <div class="sentence-table-head"><span>English</span><span>Nghĩa</span><span>Đã thuộc</span></div>
          ${items.map(x=>sentenceRow(x.en,x.originalVi??x.vi,sentenceLearnKey(x.en))).join('')}
        </div>
      </section>`;
    bindGenericRoutes();
    hydrateSentences($('#mainView'));
    $$('[data-learn]').forEach(cb=>cb.onchange=()=>{state.learned[cb.dataset.learn]=cb.checked;saveState();});
    const els=$$('#sectionLearnableSentences .english-text');
    const sequenceItems=items.map((x,i)=>[x.en,els[i]||null]);
    $('#playAllLesson').onclick=()=>speakSequence(sequenceItems,1);
  }

  function renderLessonPracticePage(id,meta,lesson){
    const items=quizItemsFromLessons([lesson]);
    quiz=makeQuizSession(items,'sequential',lesson.id||CORE_LESSON_ID,'lesson');
    setHeader(`English › Pattern ${String(id).padStart(2,'0')} › Practice`,`Luyện tập · ${lesson.title}`,true);
    $('#mainView').innerHTML=`
      <section class="subpage-hero">
        <button class="text-button subpage-back" data-go="lesson/${id}">← Quay lại bài học</button>
        <div class="eyebrow">FULL PRACTICE</div>
        <h1>Luyện toàn bộ câu trong bài</h1>
        <p>${items.length} ý/câu luyện. Có thể chọn tuần tự hoặc random. Nếu cùng một nghĩa có nhiều cách nói, chỉ cần nhập đúng một cách.</p>
      </section>
      <section id="lessonPracticeStandalone" class="book-section compact-subpage">${quizHTML('lesson')}</section>`;
    bindGenericRoutes();
    bindQuiz($('#lessonPracticeStandalone'));
  }

  function lessonHTML(){
    if(L.layout==='sectioned-pattern') return sectionedLessonHTML();
    const u=L.ui||{},p=u.pronunciation||{},c=u.comparison||{},m=u.masterList||{},w=u.work||{},r=u.restaurant||{},b=u.builder||{},q=u.questions||{},z=u.quiz||{},d=u.daily||{};
    const maybeSentence=pair=>Array.isArray(pair)&&pair[0]?sentenceRow(pair[0],pair[1]||''):'';
    return `
      <article class="book-header">
        <div class="eyebrow">${esc(u.eyebrow||'ENGLISH PATTERN')}</div><h1>${esc(L.title||'')}</h1>
        <div class="meaning">${esc(u.meaningTitle||L.meaning||'')}</div>
        ${lessonActionPanel(L.order||1)}
        ${u.leadHtml?`<div class="lead-box">${u.leadHtml}</div>`:''}
        ${u.formula?`<h3>Công thức</h3><div class="formula-box">${esc(u.formula)}</div>`:''}
        <div class="sentence-list">${(L.introExamples||[]).map(x=>sentenceRow(x[0],x[1])).join('')}</div>
        ${u.introNoteHtml?`<div class="green-box">${u.introNoteHtml}</div>`:''}
        ${u.sourceNote?`<div class="source-note">${esc(u.sourceNote)}</div>`:''}
      </article>

      ${p.title?`<section class="book-section" id="pronunciation"><h2>${p.title}</h2>
        <div class="read-box">${p.phrase?inlineSentence(p.phrase):''}<div style="text-align:center">${p.ipa?`<strong style="font-size:23px;color:var(--blue)">${esc(p.ipa)}</strong><br>`:''}${p.vnReadingHtml?`<span data-vi-only>${p.vnReadingHtml}</span>`:''}</div></div>
        ${p.naturalIntro?`<p>${esc(p.naturalIntro)}</p>`:''}
        ${p.naturalReading?`<div class="natural-box">${inlineSentence(p.phrase||L.title)}<strong>${esc(p.naturalReading)}</strong>${p.naturalVi?`<div data-vi-only>${esc(p.naturalVi)}</div>`:''}</div>`:''}
        ${p.exampleTitle?`<h3>${esc(p.exampleTitle)}</h3>`:''}${p.exampleSentence?sentenceRow(p.exampleSentence,p.exampleMeaning||''):''}
        ${p.contractionTitle?`<h2 style="margin-top:28px">${p.contractionTitle}</h2>`:''}${p.contractionIntroHtml?`<p>${p.contractionIntroHtml}</p>`:''}
        ${p.contractionCalloutHtml?`<div class="green-box" style="text-align:center">${p.contractionCalloutHtml}</div>`:''}
        <div class="sentence-list">${(p.contrastSentences||[]).map(x=>sentenceRow(x[0],x[1])).join('')}</div>${p.contrastNote?`<p>${esc(p.contrastNote)}</p>`:''}</section>`:''}

      ${c.title?`<section class="book-section"><h2>${c.title}</h2>${c.intro?`<p>${esc(c.intro)}</p>`:''}
        ${(c.examples||[]).map(x=>sentenceRow(x[0],x[1])).join('')}
        ${c.leftTitle||c.rightTitle?`<div class="compare-grid"><div class="head">${esc(c.leftTitle||'')}</div><div class="head">${esc(c.rightTitle||'')}</div><div>${esc(c.leftText||'')}</div><div>${esc(c.rightText||'')}</div></div>`:''}
        ${c.homeLabel?`<p>${esc(c.homeLabel)}</p>`:''}${maybeSentence(c.homeSentence)}
        ${c.publicLabel?`<p>${esc(c.publicLabel)}</p>`:''}${maybeSentence(c.publicSentence)}
        ${c.noteHtml?`<div class="amber-box">${c.noteHtml}</div>`:''}</section>`:''}

      <section class="book-section"><h2>${esc(w.title||'Trong công việc')}</h2>${w.intro?`<p>${esc(w.intro)}</p>`:''}
        <div class="sentence-list">${(L.work||[]).map(x=>sentenceRow(x[0],x[1])).join('')}</div>
        ${w.calloutSentence?`<div class="green-box"><div class="eyebrow">${esc(w.calloutEyebrow||'CÂU NÊN THUỘC')}</div>${sentenceRow(w.calloutSentence,w.calloutMeaning||'')}</div>`:''}
        ${r.title?`<h2 style="margin-top:28px">${esc(r.title)}</h2>`:''}${r.intro?`<p>${esc(r.intro)}</p>`:''}
        ${r.formula?`<div class="formula-box">${esc(r.formula)}${r.formulaNote?`<small>${esc(r.formulaNote)}</small>`:''}</div>`:''}
        <div class="sentence-list">${(L.restaurantNouns||[]).map(x=>sentenceRow(x[0],x[1])).join('')}</div>
        ${r.leftExample||r.rightExample?`<div class="compare-grid"><div class="head">${esc(r.leftTitle||'')}</div><div class="head">${esc(r.rightTitle||'')}</div><div>${r.leftExample?inlineSentence(r.leftExample):''}</div><div>${r.rightExample?inlineSentence(r.rightExample):''}</div></div>`:''}</section>

      <section class="book-section" id="builderSection"><h2>${esc(b.title||'Mở rộng câu')}</h2>${b.intro?`<p>${esc(b.intro)}</p>`:''}
        <div class="builder-steps">${(L.buildSteps||[]).map(s=>`<div class="builder-step"><small>${esc(s[0])}</small>${inlineSentence(s[1])}<div class="vi" data-vi-only>${esc(s[2])}</div></div>`).join('')}</div>
        ${b.summaryHtml?`<div class="amber-box" style="text-align:center">${b.summaryHtml}</div>`:''}${b.note?`<p>${esc(b.note)}</p>`:''}
        <h2 style="margin-top:30px">${esc(b.dialogTitle||'Hội thoại')}</h2>${(L.dialogs||[]).map((dialog,di)=>dialogCard(dialog,di)).join('')}</section>

      <section class="book-section"><h2>${esc(q.title||'Câu hỏi / biến thể')}</h2>
        ${q.formula?`<div class="formula-box">${esc(q.formula)}${q.formulaNote?`<small>${esc(q.formulaNote)}</small>`:''}</div>`:''}
        <div class="sentence-list">${(L.questions||[]).map(x=>sentenceRow(x[0],x[1])).join('')}</div>${q.answerIntro?`<p>${esc(q.answerIntro)}</p>`:''}
        <div class="green-box">${(q.answers||[]).map(x=>sentenceRow(x[0],x[1])).join('')}</div></section>

      <section class="book-section"><div class="eyebrow">${esc(d.eyebrow||'CÁCH HỌC HÔM NAY')}</div><h2>Luyện toàn bộ bài, không giới hạn 5 câu</h2>
        <p>Danh sách nghe ở mục 4 và phần luyện Việt → Anh đều dùng toàn bộ câu có trong bài học.</p>
        ${d.formula?`<div class="formula-box">${esc(d.formula)}</div>`:''}${d.goalHtml?`<div class="completion-box">${d.goalHtml}</div>`:''}
        <div class="footer-next"><div><span class="eyebrow">${esc(d.nextEyebrow||'BÀI TIẾP THEO')}</span><br><strong>${esc(d.nextTitle||'')}</strong><div>${esc(d.nextMeaning||'')}</div><small>${esc(d.nextNote||'')}</small></div><button class="secondary-button" id="nextPatternInfo">Xem trạng thái bài tiếp theo</button></div></section>`;
  }

  function sectionedLessonHTML(){
    const u=L.ui||{};
    L._learnableSentences=[];
    L._renderDialogs=[];
    L._builderBase=L.title||'';
    return `
      <article class="book-header">
        <div class="eyebrow">${esc(u.eyebrow||'ENGLISH PATTERN')}</div>
        <h1>${esc(L.title||'')}</h1>
        <div class="meaning">${esc(u.meaningTitle||L.meaning||'')}</div>
        ${lessonActionPanel(L.order||1)}
        ${u.leadHtml?`<div class="lead-box">${u.leadHtml}</div>`:''}
        ${u.formula?`<h3>Công thức</h3><div class="formula-box">${esc(u.formula)}</div>`:''}
        <div class="sentence-list">${(L.introExamples||[]).map(x=>sentenceRow(x[0],x[1])).join('')}</div>
        ${u.introNoteHtml?`<div class="green-box">${u.introNoteHtml}</div>`:''}
        ${u.sourceNote?`<div class="source-note">${esc(u.sourceNote)}</div>`:''}
      </article>
      ${(L.sections||[]).map(renderLessonSection).join('')}
    `;
  }

  function renderLessonSection(section,sectionIndex){
    const id=escAttr(section.id||`section-${sectionIndex+1}`);
    const hasLearnable=(section.blocks||[]).some(block=>block?.type==='sentences'&&block.learnable);
    const hasQuiz=(section.blocks||[]).some(block=>block?.type==='quiz');

    if(hasLearnable || hasQuiz) return '';

    return `<section class="book-section" id="${id}">
      <h2>${section.title||''}</h2>
      ${(section.blocks||[]).map((block,blockIndex)=>renderLessonBlock(block,section,blockIndex)).join('')}
    </section>`;
  }

  function renderLessonBlock(block,section,blockIndex){
    if(!block) return '';
    const type=block.type||'paragraph';

    if(type==='paragraph'){
      return block.html || (block.text?`<p>${esc(block.text)}</p>`:'');
    }

    if(type==='formula'){
      return `<div class="formula-box">${esc(block.text||'')}${block.note?`<small>${esc(block.note)}</small>`:''}</div>`;
    }

    if(type==='callout'){
      const cls=block.tone==='amber'?'amber-box':block.tone==='bad'?'bad-box':block.tone==='purple'?'purple-box':'green-box';
      return `<div class="${cls}">${block.html||esc(block.text||'')}</div>`;
    }

    if(type==='sentences'){
      const sourceItems=block.items||[];
      if(block.learnable){
        const allItems=collectLessonSentences(L);
        L._learnableSentences=allItems.map(x=>[x.en,x.vi]);
        const controls=`<div class="study-toolbar"><button id="playAllLesson" class="primary-button">▶ Nghe toàn bộ 1 lần</button><span class="muted">Bấm một câu khác để dừng danh sách và nghe câu đó ngay.</span></div>`;
        return `${controls}<div class="sentence-table" id="sectionLearnableSentences"><div class="sentence-table-head"><span>English</span><span>Nghĩa</span><span>Đã thuộc</span></div>${allItems.map(x=>sentenceRow(x.en,x.vi,sentenceLearnKey(x.en))).join('')}</div>`;
      }
      return `<div class="sentence-list">${sourceItems.map(x=>sentenceRow(x[0],x[1])).join('')}</div>`;
    }

    if(type==='chips'){
      return `<div class="meaning-chip-grid">${(block.items||[]).map(x=>`<div class="meaning-chip"><strong>${esc(x[0])}</strong><span data-vi-only>${esc(x[1]||'')}</span></div>`).join('')}</div>`;
    }

    if(type==='compare'){
      return `<div class="compare-grid"><div class="head">${esc(block.leftTitle||'')}</div><div class="head">${esc(block.rightTitle||'')}</div><div>${block.leftHtml||esc(block.leftText||'')}</div><div>${block.rightHtml||esc(block.rightText||'')}</div></div>`;
    }

    if(type==='builder') return '';
    if(type==='dialogs'){
      return (block.items||[]).map(dialog=>{
        const index=L._renderDialogs.push(dialog)-1;
        return dialogCard(dialog,index);
      }).join('');
    }

    if(type==='quiz'){
      return `<div data-lesson-quiz-wrap>${quizHTML('lesson')}</div>`;
    }

    return '';
  }

  function editableMeaningHTML(en,originalVi='',extraClass=''){
    const lessonId=currentLessonId();
    const key=meaningOverrideKey(en,lessonId);
    const shown=meaningFor(en,originalVi,lessonId);
    return `<div class="vi meaning-editor ${escAttr(extraClass)}" data-vi-only data-meaning-key="${escAttr(key)}" data-meaning-en="${escAttr(en)}" data-original-vi="${escAttr(originalVi||'')}">
      <div class="meaning-display-row">
        <span class="vi-text">${esc(shown)}</span>
        <button class="meaning-edit-button" type="button" data-edit-meaning aria-label="Sửa nghĩa tiếng Việt" title="Sửa nghĩa tiếng Việt">✎</button>
      </div>
      <div class="meaning-edit-panel hidden">
        <input class="meaning-edit-input" type="text" value="${escAttr(shown)}" autocomplete="off" />
        <div class="meaning-edit-actions">
          <button class="mini-button" type="button" data-save-meaning>Lưu</button>
          <button class="mini-button" type="button" data-cancel-meaning>Hủy</button>
          <button class="text-button" type="button" data-reset-meaning>Khôi phục gốc</button>
        </div>
      </div>
    </div>`;
  }

  function saveMeaningOverride(editor,value){
    const key=editor.dataset.meaningKey;
    const en=editor.dataset.meaningEn||'';
    const original=editor.dataset.originalVi||'';
    const next=String(value||'').trim();
    if(!next){toast('Nghĩa tiếng Việt không được để trống.');return false;}
    if(next===original) delete state.meaningOverrides[key];
    else state.meaningOverrides[key]=next;
    saveState();

    $$('[data-meaning-key]').filter(node=>node.dataset.meaningKey===key).forEach(node=>{
      const text=$('.vi-text',node);
      const input=$('.meaning-edit-input',node);
      if(text) text.textContent=next;
      if(input) input.value=next;
    });
    toast('Đã lưu nghĩa tiếng Việt.');
    return true;
  }

  function bindMeaningEditors(root){
    $$('[data-edit-meaning]',root).forEach(btn=>btn.onclick=e=>{
      e.stopPropagation();
      const editor=btn.closest('[data-meaning-key]');
      const panel=$('.meaning-edit-panel',editor);
      const input=$('.meaning-edit-input',editor);
      panel.classList.remove('hidden');
      input.value=$('.vi-text',editor)?.textContent||'';
      setTimeout(()=>{input.focus();input.select();},0);
    });
    $$('[data-cancel-meaning]',root).forEach(btn=>btn.onclick=e=>{
      e.stopPropagation();
      const editor=btn.closest('[data-meaning-key]');
      $('.meaning-edit-panel',editor).classList.add('hidden');
    });
    $$('[data-save-meaning]',root).forEach(btn=>btn.onclick=e=>{
      e.stopPropagation();
      const editor=btn.closest('[data-meaning-key]');
      if(saveMeaningOverride(editor,$('.meaning-edit-input',editor).value)){
        $('.meaning-edit-panel',editor).classList.add('hidden');
      }
    });
    $$('[data-reset-meaning]',root).forEach(btn=>btn.onclick=e=>{
      e.stopPropagation();
      const editor=btn.closest('[data-meaning-key]');
      const key=editor.dataset.meaningKey;
      const original=editor.dataset.originalVi||'';
      delete state.meaningOverrides[key];
      saveState();
      $$('[data-meaning-key]').filter(node=>node.dataset.meaningKey===key).forEach(node=>{
        const text=$('.vi-text',node);
        const input=$('.meaning-edit-input',node);
        if(text) text.textContent=original;
        if(input) input.value=original;
        $('.meaning-edit-panel',node)?.classList.add('hidden');
      });
      toast('Đã khôi phục nghĩa gốc.');
    });
    $$('.meaning-edit-input',root).forEach(input=>input.addEventListener('keydown',e=>{
      if(e.key==='Enter'){
        e.preventDefault();
        const editor=input.closest('[data-meaning-key]');
        if(saveMeaningOverride(editor,input.value)) $('.meaning-edit-panel',editor).classList.add('hidden');
      }else if(e.key==='Escape'){
        input.closest('.meaning-edit-panel')?.classList.add('hidden');
      }
    }));
  }

  function sentenceRow(en,vi,learnKey=''){
    const scoped=learnKey?scopedLearnKey(learnKey):'';
    const checked=scoped && state.learned[scoped] ? 'checked' : '';
    return `<div class="sentence-card" data-sentence-card="1" data-en-card="${escAttr(en)}"><div class="en-wrap"><button class="speaker" data-speak="${escAttr(en)}" aria-label="Nghe câu">🔊</button><div class="english-text" data-en="${escAttr(en)}"></div></div>${editableMeaningHTML(en,vi)}${scoped?`<label class="learn-toggle"><input type="checkbox" data-learn="${scoped}" ${checked}> Đã thuộc</label>`:''}</div>`;
  }
  function inlineSentence(en){ return `<span class="en-wrap" style="display:inline-flex"><button class="speaker" data-speak="${escAttr(en)}" aria-label="Nghe">🔊</button><span class="english-text" data-en="${escAttr(en)}"></span></span>`; }
  function dialogCard(d,di){ return `<div class="dialog-card"><div class="dialog-title"><span>${esc(d.place)}</span><button class="mini-button" data-dialog-play="${di}">▶ Nghe hội thoại</button></div>${d.rows.map(r=>`<div class="dialog-row"><span class="role">${esc(r[0])}</span><div class="english-text" data-en="${escAttr(r[1])}"></div>${editableMeaningHTML(r[1],r[2]||'','dialog-meaning')}</div>`).join('')}</div>`; }

  function hydrateSentences(root){
    $$('.english-text[data-en]',root).forEach(el=>buildWordSpans(el,el.dataset.en));
    bindMeaningEditors(root);
    $$('[data-speak]',root).forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation(); const card=btn.closest('[data-sentence-card]'); speak(btn.dataset.speak, card?$('.english-text',card):btn.parentElement); }));
    $$('[data-sentence-card]',root).forEach(card=>card.addEventListener('click',e=>{if(e.target.closest('button,input,label,.word-token')) return; speak(card.dataset.enCard,$('.english-text',card));}));
    $$('.word-token',root).forEach(w=>w.addEventListener('click',async e=>{e.stopPropagation();try{if(!L)await ensureCoreEnglish();openLookup(w.dataset.word,'word');}catch(error){toast(error.message);}}));
  }
  function buildWordSpans(el,text){
    el.innerHTML='';
    const re=/[A-Za-z]+(?:[’'][A-Za-z]+)?|[^A-Za-z’']+/g; let m;
    while((m=re.exec(text))){
      const token=m[0];
      if(/[A-Za-z]/.test(token)){
        const s=document.createElement('span'); s.className='word-token'; s.textContent=token; s.dataset.word=token; s.dataset.start=String(m.index); s.dataset.end=String(m.index+token.length); el.appendChild(s);
      } else el.appendChild(document.createTextNode(token));
    }
  }

  function detectSpeechLang(text=''){
    return /[\u3040-\u30ff\u3400-\u9fff]/.test(String(text)) ? 'ja-JP' : 'en-US';
  }
  function bestVoice(lang='en-US'){
    const voices=speechSynthesis.getVoices();
    if(/^ja/i.test(lang)) return voices.find(v=>/^ja-JP/i.test(v.lang) && /Nanami|Haruka|Google|Kyoko/i.test(v.name)) || voices.find(v=>/^ja/i.test(v.lang)) || null;
    return voices.find(v=>/^en-US/i.test(v.lang) && /Aria|Jenny|Google|Samantha|Ava/i.test(v.name)) || voices.find(v=>/^en-US/i.test(v.lang)) || voices.find(v=>/^en/i.test(v.lang)) || null;
  }
  function stopSpeech(cancelSequence=true){
    if(cancelSequence) sequenceRun++;
    if(window.AITTS) window.AITTS.stop();
    if('speechSynthesis' in window) speechSynthesis.cancel();
    $$('.speaking').forEach(x=>x.classList.remove('speaking'));
    $$('.playing').forEach(x=>x.classList.remove('playing'));
  }

  function browserSpeak(text,highlightEl=null,rate=state.rate){
    return new Promise(resolve=>{
      if(!('speechSynthesis' in window)){ toast('Trình duyệt này không hỗ trợ đọc văn bản.'); resolve(); return; }
      const u=new SpeechSynthesisUtterance(text);
      const lang=detectSpeechLang(text);
      u.lang=lang;
      u.rate=Number(rate)||.88;
      const v=bestVoice(lang);
      if(v) u.voice=v;
      const card=highlightEl?.closest?.('[data-sentence-card]');
      if(card) card.classList.add('playing');
      u.onboundary=e=>{
        if(!highlightEl || typeof e.charIndex!=='number') return;
        $$('.word-token',highlightEl).forEach(w=>{const a=+w.dataset.start,b=+w.dataset.end;w.classList.toggle('speaking',e.charIndex>=a && e.charIndex<b);});
      };
      const done=()=>{
        if(highlightEl) $$('.word-token',highlightEl).forEach(w=>w.classList.remove('speaking'));
        if(card) card.classList.remove('playing');
        resolve();
      };
      u.onend=done;
      u.onerror=done;
      speechSynthesis.speak(u);
    });
  }

  async function speak(text,highlightEl=null,rate=state.rate,sequenceToken=null){
    stopSpeech(sequenceToken===null);
    const card=highlightEl?.closest?.('[data-sentence-card]');
    if(card) card.classList.add('playing');

    if(window.AITTS){
      try{
        // AITTS checks the shared static MP3 cache first.
        // Only when the file is missing does it call the dynamic OpenAI backend.
        await window.AITTS.speak(text,{rate,language:detectSpeechLang(text),highlightEl});
        if(card) card.classList.remove('playing');
        return;
      }catch(error){
        if(sequenceToken!==null && sequenceToken!==sequenceRun){
          if(card) card.classList.remove('playing');
          return;
        }
        console.warn('Shared/AI voice unavailable; using browser voice.',error);
      }
    }

    if(sequenceToken!==null && sequenceToken!==sequenceRun){
      if(card) card.classList.remove('playing');
      return;
    }
    if(card) card.classList.remove('playing');
    return browserSpeak(text,highlightEl,rate);
  }
  async function speakSequence(items,repeats=1){
    const token=++sequenceRun;
    stopSpeech(false);
    for(let round=0;round<repeats;round++){
      for(const item of items){
        if(token!==sequenceRun) return;
        await speak(item[0],item[1]||null,state.rate,token);
        if(token!==sequenceRun) return;
        await wait(180);
      }
    }
  }
  const wait=ms=>new Promise(r=>setTimeout(r,ms));

  function bindLessonEvents(){
    $$('[data-learn]').forEach(cb=>cb.onchange=()=>{state.learned[cb.dataset.learn]=cb.checked;saveState();});
    const lessonItems=(L._learnableSentences?.length
      ? L._learnableSentences
      : collectLessonSentences(L).map(x=>[x.en,x.vi]));
    const lessonEls=$$('#sectionLearnableSentences .english-text');
    const sequenceItems=lessonItems.map((x,i)=>[x[0],lessonEls[i]||null]);
    if($('#playAllLesson')) $('#playAllLesson').onclick=()=>speakSequence(sequenceItems,1);
    $$('[data-dialog-play]').forEach(btn=>btn.onclick=()=>{
      const pool=(L._renderDialogs?.length?L._renderDialogs:(L.dialogs||[]));
      const dialog=pool[+btn.dataset.dialogPlay];
      if(!dialog)return;
      const card=btn.closest('.dialog-card');
      const els=$$('.english-text',card);
      speakSequence(dialog.rows.map((row,i)=>[row[1],els[i]]));
    });
    if($('#nextPatternInfo')) $('#nextPatternInfo').onclick=()=>{
      const next=CATALOG.find(item=>item.id===(L.order||1)+1);
      toast(next?`${next.title} = ${next.meaning}`:'Chưa có bài tiếp theo.');
      routeTo('patterns');
    };
    const lessonQuiz=$('[data-lesson-quiz-wrap]');
    if(lessonQuiz) bindQuiz(lessonQuiz);
    else if($('#lessonPractice')) bindQuiz($('#lessonPractice'));
  }

  function answerFeedbackHTML(item,primaryAnswer=''){
    const answers=item?.answers||[];
    const primary=primaryAnswer || answers[0] || '';
    const others=answers.filter(answer=>normalizeText(answer)!==normalizeText(primary));
    return `<div class="answer-primary"><b>${esc(primary)}</b> <button class="mini-button" data-answer-speak="${escAttr(primary)}">🔊 Nghe</button></div>
      ${others.length?`<div class="answer-alternatives"><strong>Cách khác cùng nghĩa:</strong><ul>${others.map(answer=>`<li>${esc(answer)} <button class="mini-button" data-answer-speak="${escAttr(answer)}">🔊</button></li>`).join('')}</ul></div>`:''}`;
  }

  function quizHTML(context){
    const items=quiz.items||[];
    if(!items.length) return '<div class="empty-state">Chưa có câu phù hợp để luyện.</div>';
    if(quiz.index>=items.length) quiz.index=0;
    const item=items[quiz.index];
    const total=items.length;
    return `<div class="quiz-config">
        <div><strong>Luyện toàn bộ nội dung</strong><span>${total} ý/câu luyện · chấp nhận mọi cách diễn đạt có cùng nghĩa trong các bài đã chọn.</span></div>
        <label>Thứ tự
          <select id="quizOrderSelect">
            <option value="sequential" ${quiz.mode==='sequential'?'selected':''}>Tuần tự</option>
            <option value="random" ${quiz.mode==='random'?'selected':''}>Random</option>
          </select>
        </label>
      </div>
      <div class="quiz-card" data-quiz="${context}">
        <div class="quiz-meta"><span id="quizProgress">Câu ${quiz.index+1}/${total}</span><span>Điểm lượt này: <b id="quizScore">${quiz.correct}</b>/${total}</span></div>
        <div id="quizPrompt" class="quiz-prompt" data-vi-only>${esc(item.prompt)}</div>
        <input id="quizInput" class="quiz-input" autocomplete="off" autocapitalize="sentences" placeholder="Nhập một cách nói đúng bằng tiếng Anh..."/>
        <div class="quiz-actions"><button id="quizCheck" class="primary-button">Kiểm tra</button><button id="quizMic" class="secondary-button">🎤 Nói</button><button id="quizShow" class="secondary-button">Xem đáp án</button><button id="quizNext" class="secondary-button hidden">Câu tiếp theo →</button></div>
        <div id="quizFeedback" class="quiz-feedback"></div>
      </div>
      <details class="all-answer-details" style="margin-top:12px"><summary style="cursor:pointer;color:var(--navy);font-weight:700">Xem toàn bộ đáp án</summary>
        <ol class="answer-list">${items.map(x=>`<li><span data-vi-only>${esc(x.prompt)}</span><br><b>${x.answers.map(esc).join(' / ')}</b></li>`).join('')}</ol>
      </details>`;
  }

  function bindAnswerSpeakers(root){
    $$('[data-answer-speak]',root).forEach(btn=>btn.onclick=()=>speak(btn.dataset.answerSpeak));
  }

  function bindQuiz(root){
    const q=$('[data-quiz]',root); if(!q) return;
    const items=quiz.items||[];
    if(!items.length) return;
    const item=items[quiz.index];
    const input=$('#quizInput',q),check=$('#quizCheck',q),show=$('#quizShow',q),next=$('#quizNext',q),mic=$('#quizMic',q),feedback=$('#quizFeedback',q);
    const order=$('#quizOrderSelect',root);

    if(order) order.onchange=()=>{
      quiz=makeQuizSession(quiz.baseItems,order.value,quiz.scopeId,quiz.context);
      rerenderQuiz(root);
    };

    const evaluate=()=>{
      const typed=input.value.trim();
      if(!typed){feedback.className='quiz-feedback bad';feedback.textContent='Hãy nhập hoặc nói câu trả lời trước.';return;}
      const matched=item.answers.find(answer=>normalizeText(answer)===normalizeText(typed));
      if(matched){
        feedback.className='quiz-feedback good';
        feedback.innerHTML='<strong>✓ Chính xác.</strong>'+answerFeedbackHTML(item,matched);
        bindAnswerSpeakers(feedback);
        if(!quiz.counted.has(quiz.index)){
          quiz.correct++;
          quiz.counted.add(quiz.index);
          $('#quizScore',q).textContent=quiz.correct;
        }
        next.classList.remove('hidden');
      }else{
        feedback.className='quiz-feedback bad';
        feedback.innerHTML='Chưa đúng. Bạn có thể thử lại hoặc bấm <b>Xem đáp án</b>.';
      }
    };

    check.onclick=evaluate;
    input.addEventListener('keydown',e=>{if(e.key==='Enter')evaluate();});
    show.onclick=()=>{
      feedback.className='quiz-feedback';
      feedback.innerHTML='<strong>Đáp án gợi ý:</strong>'+answerFeedbackHTML(item);
      bindAnswerSpeakers(feedback);
      next.classList.remove('hidden');
    };

    next.onclick=()=>{
      if(quiz.index<items.length-1){
        quiz.index++;
        rerenderQuiz(root);
        return;
      }

      if(quiz.scopeId && quiz.scopeId.startsWith('en-pattern-')){
        state.quizRunsByLesson[quiz.scopeId]=(state.quizRunsByLesson[quiz.scopeId]||0)+1;
        state.quizBestByLesson[quiz.scopeId]=Math.max(quizBestFor(quiz.scopeId),quiz.correct);
        if(quiz.scopeId===CORE_LESSON_ID){
          state.quizRuns=state.quizRunsByLesson[quiz.scopeId];
          state.quizBest=state.quizBestByLesson[quiz.scopeId];
        }
        saveState();
      }

      feedback.className='quiz-feedback good';
      feedback.innerHTML=`Hoàn thành: <b>${quiz.correct}/${items.length}</b>.`;
      next.textContent='Làm lại';
      next.classList.remove('hidden');
      next.onclick=()=>{
        quiz=makeQuizSession(quiz.baseItems,quiz.mode,quiz.scopeId,quiz.context);
        rerenderQuiz(root);
      };
    };

    mic.onclick=()=>startRecognition(input);
  }

  function rerenderQuiz(root){
    if(root.matches('[data-lesson-quiz-wrap]')){
      root.innerHTML=quizHTML('lesson');
      bindQuiz(root);
      return;
    }

    if(root.matches('.book-section')){
      root.innerHTML=`<h2>Luyện toàn bộ câu trong bài</h2><p>Không còn giới hạn 10 câu. Có thể chọn tuần tự hoặc random.</p>${quizHTML('lesson')}`;
      bindQuiz(root);
      return;
    }

    const holder=root.id==='practiceQuizWrap'?root:$('#practiceQuizWrap',root);
    if(holder){
      holder.innerHTML=quizHTML('hub');
      bindQuiz(holder);
    }
  }

  function startRecognition(input){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){toast('Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Hãy dùng Chrome hoặc Edge.');return;}
    const r=new SR();r.lang='en-US';r.interimResults=false;r.maxAlternatives=1;toast('Đang nghe... hãy nói câu tiếng Anh.');r.onresult=e=>{input.value=e.results[0][0].transcript;toast('Đã nhận giọng nói. Bấm Kiểm tra.');};r.onerror=()=>toast('Không nhận được giọng nói. Hãy thử lại.');r.start();
  }

  async function renderJapanese(){
    L=null;
    setHeader('Japanese','Japanese Learning');
    const modules=(STORE?.list({language:'ja'})||[]);
    const first=modules.find(item=>item.status==='available'&&item.source);
    const lesson=first?await ensureContent(first.id):{phrases:[]};
    const phrases=lesson.phrases||[];
    $('#mainView').innerHTML=`
      <section class="page-hero japanese-hero"><div class="eyebrow">JAPANESE · 日本語</div><h1>Tiếng Nhật cho cuộc sống tại Nhật</h1><p>Nội dung Japanese bây giờ được tách thành file riêng theo từng nhóm. Thêm lesson mới không cần nhét dữ liệu vào app.js.</p></section>
      <section class="jp-intro-grid">${modules.map((item,i)=>`<article class="jp-plan accent-${esc(item.accent||['green','purple','yellow'][i%3])}"><span>${String(item.order||i+1).padStart(2,'0')}</span><h3>${esc(item.title)}</h3><p>${esc(item.meaning||item.description||'')}</p><small>${esc(item.category||'')}</small></article>`).join('')}<article class="jp-plan accent-purple"><span>+</span><h3>Work / Service / School…</h3><p>Chỉ cần thêm file lesson + một dòng metadata vào content-index.</p></article></section>
      <section class="book-section"><div class="section-title-row"><div><h2>${esc(lesson.title||'Japanese starter')}</h2><p>Bấm loa để nghe bằng giọng ja-JP của thiết bị.</p></div></div><div class="jp-list">${phrases.map(x=>`<div class="jp-row"><button class="speaker" data-speak="${escAttr(x[0])}">🔊</button><div><strong class="jp-text">${esc(x[0])}</strong><span>${esc(x[1])}</span><small data-vi-only>${esc(x[2])}</small></div></div>`).join('')}</div><div class="green-box">Dữ liệu đến từ <code>data/japanese/daily-life/001.js</code>.</div></section>
    `;
    hydrateSentences($('#mainView'));
  }

  function renderSettings(){
    setHeader('Thiết bị','Thiết bị & dữ liệu');
    const secure=window.isSecureContext;
    const installed=window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    $('#mainView').innerHTML=`
      <section class="page-hero settings-hero">
        <div class="eyebrow">DEVICE & DATA</div>
        <h1>Dùng Language Studio trên PC và điện thoại</h1>
        <p>Tiến độ hiện lưu bằng localStorage nên mỗi thiết bị có dữ liệu riêng. Phần này giúp bạn sao lưu, chuyển dữ liệu, chia sẻ link và cài app khi chạy trên HTTPS.</p>
      </section>

      <section class="settings-grid">
        <article class="settings-card accent-purple">
          <span class="settings-step">01</span>
          <h3>Sao lưu dữ liệu học</h3>
          <p>Xuất tiến độ, từ đã lưu, điểm quiz và cài đặt hiện tại thành một file JSON.</p>
          <button id="exportDataBtn" class="primary-button">Xuất dữ liệu</button>
        </article>

        <article class="settings-card accent-green">
          <span class="settings-step">02</span>
          <h3>Chuyển sang thiết bị khác</h3>
          <p>Chọn file JSON đã xuất từ PC hoặc điện thoại để khôi phục tiến độ trên thiết bị này.</p>
          <button id="importDataBtn" class="primary-button">Nhập dữ liệu</button>
          <input id="importDataFile" type="file" accept="application/json,.json" class="hidden" />
        </article>

        <article class="settings-card accent-yellow">
          <span class="settings-step">03</span>
          <h3>Chia sẻ trang hiện tại</h3>
          <p>Gửi link cho chính bạn qua Messages, LINE, Mail hoặc ứng dụng khác khi website đã được deploy.</p>
          <button id="shareAppBtn" class="primary-button">Chia sẻ link</button>
        </article>

        <article class="settings-card accent-orange">
          <span class="settings-step">04</span>
          <h3>Cài như một app</h3>
          <p>${installed?'Ứng dụng đang chạy ở chế độ standalone.':secure?'Thiết bị đang ở secure context. Nếu trình duyệt hỗ trợ PWA, bạn có thể cài app.':'Local/LAN HTTP chỉ dùng để test. Cài PWA và microphone ổn định cần bản HTTPS.'}</p>
          <button id="installAppBtn" class="primary-button">${installed?'Đã cài':'Cài Language Studio'}</button>
        </article>
      </section>

      <section class="book-section data-summary">
        <div class="section-title-row"><div><h2>Dữ liệu hiện tại trên thiết bị này</h2><p>Không gửi lên server ở phiên bản hiện tại.</p></div></div>
        <div class="stats-grid">
          <div class="stat-card"><small>Câu đã thuộc</small><strong>${learnedCount()}</strong></div>
          <div class="stat-card"><small>Từ / cụm đã lưu</small><strong>${savedCount()}</strong></div>
          <div class="stat-card"><small>Quiz tốt nhất</small><strong>${quizBestFor()}/10</strong></div>
          <div class="stat-card"><small>Lượt quiz</small><strong>${quizRunsFor()}</strong></div>
        </div>
        <div class="data-note"><b>Bước sau:</b> khi cần đồng bộ tự động giữa PC và điện thoại, chúng ta sẽ thêm tài khoản + cloud sync thay vì phụ thuộc vào file JSON.</div>
      </section>
    `;

    $('#exportDataBtn').onclick=exportLearningData;
    $('#importDataBtn').onclick=()=>$('#importDataFile').click();
    $('#importDataFile').onchange=e=>{const file=e.target.files?.[0];if(file) importLearningData(file);e.target.value='';};
    $('#shareAppBtn').onclick=shareCurrentPage;
    $('#installAppBtn').onclick=installApp;
  }

  function exportLearningData(){
    const payload={app:'Language Studio',version:1,exportedAt:new Date().toISOString(),state};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    const stamp=new Date().toISOString().slice(0,10);
    a.href=url;a.download=`language-studio-backup-${stamp}.json`;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    toast('Đã tạo file sao lưu dữ liệu học.');
  }

  function importLearningData(file){
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const payload=JSON.parse(String(reader.result||''));
        const next=payload?.state;
        if(!next || typeof next!=='object' || Array.isArray(next)) throw new Error('invalid');
        state={
          ...defaults,...next,
          learned:{...(next.learned||{})},
          saved:{...(next.saved||{})},
          meaningOverrides:{...(next.meaningOverrides||{})},
          quizBestByLesson:{...(next.quizBestByLesson||{})},
          quizRunsByLesson:{...(next.quizRunsByLesson||{})},
          lessonVisitsByLesson:{...(next.lessonVisitsByLesson||{})}
        };
        Object.keys(state.learned).forEach(key=>{
          if(!key.includes(':')){
            state.learned[`${CORE_LESSON_ID}:${key}`]=state.learned[key];
            delete state.learned[key];
          }
        });
        if(state.quizBest && state.quizBestByLesson[CORE_LESSON_ID]==null) state.quizBestByLesson[CORE_LESSON_ID]=state.quizBest;
        if(state.quizRuns && state.quizRunsByLesson[CORE_LESSON_ID]==null) state.quizRunsByLesson[CORE_LESSON_ID]=state.quizRuns;
        saveState();
        toast('Đã khôi phục dữ liệu học.');
        renderSettings();
      }catch{
        toast('File sao lưu không hợp lệ.');
      }
    };
    reader.onerror=()=>toast('Không đọc được file.');
    reader.readAsText(file);
  }

  async function shareCurrentPage(){
    const data={title:'Language Studio',text:'Language Studio – English + Japanese',url:location.href};
    try{
      if(navigator.share){await navigator.share(data);return;}
      if(navigator.clipboard){await navigator.clipboard.writeText(location.href);toast('Đã copy link.');return;}
      toast('Hãy copy địa chỉ trên thanh trình duyệt.');
    }catch(e){
      if(e?.name!=='AbortError') toast('Chưa thể chia sẻ link trên trình duyệt này.');
    }
  }

  async function installApp(){
    if(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches){toast('Language Studio đã được cài trên thiết bị này.');return;}
    if(installPrompt){
      installPrompt.prompt();
      await installPrompt.userChoice.catch(()=>null);
      installPrompt=null;
      return;
    }
    const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
    if(isIOS) toast('Trên iPhone/iPad: mở bằng Safari → Share → Add to Home Screen.');
    else if(!window.isSecureContext) toast('Cần bản HTTPS để cài app ổn định. LAN HTTP chỉ dùng để thử giao diện.');
    else toast('Trình duyệt chưa hiện tùy chọn cài app. Hãy dùng menu trình duyệt → Install/Add to Home Screen.');
  }

  function renderVocab(){
    setHeader('Library','Từ đã lưu');
    const items=Object.values(state.saved||{}).sort((a,b)=>(b.savedAt||0)-(a.savedAt||0));
    $('#mainView').innerHTML=`<section class="page-hero"><div class="eyebrow">MY VOCABULARY</div><h1>Từ và cụm bạn đã lưu</h1><p>Chạm một từ trong bài học rồi bấm “Lưu”. Danh sách này nằm trên chính thiết bị của bạn.</p></section><div class="vocab-toolbar"><strong>${items.length} mục đã lưu</strong>${items.length?'<button id="startFlashcards" class="primary-button">Ôn bằng flashcard</button>':''}</div><section id="vocabArea">${items.length?vocabCards(items):emptyVocab()}</section>`;
    $$('[data-vocab-speak]').forEach(b=>b.onclick=()=>speak(b.dataset.vocabSpeak));
    $$('[data-vocab-remove]').forEach(b=>b.onclick=()=>{delete state.saved[b.dataset.vocabRemove];saveState();renderVocab();});
    if($('#startFlashcards')) $('#startFlashcards').onclick=()=>renderFlashcards(items);
  }
  function vocabCards(items){ return `<div class="vocab-list">${items.map(x=>`<article class="vocab-card"><div class="vocab-card-head"><div><h3>${esc(x.term)}</h3><span class="ipa">${esc(x.ipa||'')}</span></div><button class="mini-button" data-vocab-speak="${escAttr(x.term)}">🔊</button></div><p>${esc(x.meaning||'')}</p>${x.example?`<small>${esc(x.example)}</small>`:''}<div style="margin-top:10px"><button class="text-button" data-vocab-remove="${escAttr(x.key)}">Xóa khỏi danh sách</button></div></article>`).join('')}</div>`; }
  function emptyVocab(){ return `<div class="empty-state"><strong>Chưa có từ nào được lưu</strong>Vào Mẫu 01, chạm một từ tiếng Anh và bấm ☆ Lưu.<br><button class="primary-button" style="margin-top:14px" data-go="lesson/1">Mở Mẫu 01</button></div>`; }
  function renderFlashcards(items){
    flashIndex=0; const draw=()=>{const x=items[flashIndex%items.length];$('#vocabArea').innerHTML=`<div class="flashcard"><div><div class="front">${esc(x.term)}</div><div class="ipa">${esc(x.ipa||'')}</div><div id="flashBack" class="back hidden"><strong>${esc(x.meaning||'')}</strong>${x.example?`<p>${esc(x.example)}</p>`:''}</div><div class="quiz-actions" style="justify-content:center;margin-top:22px"><button id="flashSpeak" class="secondary-button">🔊 Nghe</button><button id="flashReveal" class="primary-button">Hiện nghĩa</button><button id="flashNext" class="secondary-button">Từ tiếp theo →</button></div></div></div>`;$('#flashSpeak').onclick=()=>speak(x.term);$('#flashReveal').onclick=()=>$('#flashBack').classList.toggle('hidden');$('#flashNext').onclick=()=>{flashIndex=(flashIndex+1)%items.length;draw();};};draw();
  }

  async function renderPracticeHub(){
    L=null;
    setHeader('Practice','Practice Center');

    const metas=(STORE?.list({language:'en',category:'patterns'})||[])
      .filter(item=>item.status==='available'&&item.source)
      .sort((a,b)=>(a.order||0)-(b.order||0));
    practiceLessons=await Promise.all(metas.map(item=>ensureContent(item.id)));

    const visited=practiceLessons.filter(lesson=>Number(state.lessonVisitsByLesson?.[lesson.id]||0)>0);
    const defaultLessons=visited.length?visited:practiceLessons;
    const defaultIds=new Set(defaultLessons.map(lesson=>lesson.id));

    const cards=practiceLessons.map(lesson=>{
      const count=collectLessonSentences(lesson).length;
      const visits=Number(state.lessonVisitsByLesson?.[lesson.id]||0);
      return `<label class="practice-lesson-card">
        <input type="checkbox" data-practice-lesson="${escAttr(lesson.id)}" ${defaultIds.has(lesson.id)?'checked':''}>
        <span class="practice-lesson-number">${String(lesson.order||'').padStart(2,'0')}</span>
        <span><strong>${esc(lesson.title||'')}</strong><small>${count} câu · đã mở ${visits} lần</small></span>
      </label>`;
    }).join('');

    const initialItems=quizItemsFromLessons(defaultLessons);
    quiz=makeQuizSession(initialItems,'random','mixed:'+defaultLessons.map(x=>x.id).join(','),'hub');

    $('#mainView').innerHTML=`
      <section class="page-hero">
        <div class="eyebrow">PRACTICE CENTER</div>
        <h1>Luyện toàn bộ nội dung đã học</h1>
        <p>Chọn một hoặc nhiều bài. Ví dụ chọn Mẫu 02 + Mẫu 03 thì hệ thống sẽ trộn câu của hai bài. Nếu cùng một nghĩa có nhiều cách diễn đạt, nhập đúng bất kỳ cách nào đều được tính đúng.</p>
      </section>

      <section class="practice-mixer">
        <div class="section-title-row"><div><h2>Chọn bài cần luyện</h2><p>Có thể chọn riêng một bài hoặc trộn nhiều bài với nhau.</p></div></div>
        <div class="practice-lesson-grid">${cards}</div>
        <div class="practice-mixer-actions">
          <label>Thứ tự
            <select id="practiceMixOrder">
              <option value="random" selected>Random</option>
              <option value="sequential">Tuần tự</option>
            </select>
          </label>
          <button id="startMixedPractice" class="primary-button">Bắt đầu luyện các bài đã chọn</button>
          <span id="practiceMixSummary" class="muted">${defaultLessons.length} bài · ${initialItems.length} ý/câu luyện</span>
        </div>
      </section>

      <section id="practiceQuizWrap" class="paper-card practice-main-quiz" style="padding:20px">${quizHTML('hub')}</section>
    `;

    const startSelectedPractice=()=>{
      const selectedIds=$$('[data-practice-lesson]:checked').map(input=>input.dataset.practiceLesson);
      if(!selectedIds.length){toast('Hãy chọn ít nhất một bài để luyện.');return;}
      const selectedLessons=practiceLessons.filter(lesson=>selectedIds.includes(lesson.id));
      const items=quizItemsFromLessons(selectedLessons);
      const mode=$('#practiceMixOrder').value;
      quiz=makeQuizSession(items,mode,'mixed:'+selectedIds.join(','),'hub');
      $('#practiceMixSummary').textContent=`${selectedLessons.length} bài · ${items.length} ý/câu luyện`;
      const holder=$('#practiceQuizWrap');
      holder.innerHTML=quizHTML('hub');
      bindQuiz(holder);
      holder.scrollIntoView({behavior:'smooth',block:'start'});
    };

    $('#startMixedPractice').onclick=startSelectedPractice;
    $$('[data-practice-lesson]').forEach(input=>input.onchange=()=>{
      const ids=$$('[data-practice-lesson]:checked').map(x=>x.dataset.practiceLesson);
      const lessons=practiceLessons.filter(lesson=>ids.includes(lesson.id));
      $('#practiceMixSummary').textContent=`${lessons.length} bài · ${quizItemsFromLessons(lessons).length} ý/câu luyện`;
    });
    bindQuiz($('#practiceQuizWrap'));
  }

  async function renderProgress(){
    await ensureCoreEnglish();
    setHeader('Progress','Tiến độ học');
    const all=collectLessonSentences(L);
    const quizTotal=quizItemsFromLessons([L]).length;
    const pct=lessonPercent();
    $('#mainView').innerHTML=`<section class="page-hero"><div class="eyebrow">PROGRESS</div><h1>Tiến độ Mẫu 01</h1><p>Tiến độ dùng toàn bộ câu trong bài và toàn bộ phần luyện Việt → Anh, không còn giới hạn 20/10.</p></section>
      <section class="stats-grid">
        <div class="stat-card"><small>Câu đã thuộc</small><strong>${Math.min(all.length,learnedCount())}/${all.length}</strong></div>
        <div class="stat-card"><small>Quiz tốt nhất</small><strong>${Math.min(quizTotal,quizBestFor())}/${quizTotal}</strong></div>
        <div class="stat-card"><small>Từ đã lưu</small><strong>${savedCount()}</strong></div>
        <div class="stat-card"><small>Số lượt làm quiz</small><strong>${quizRunsFor()}</strong></div>
      </section>
      <section class="progress-panel"><div class="progress-big"><div class="ring" style="--pct:${pct}%"><strong>${pct}%</strong></div><div><h2 style="margin:0;color:var(--navy)">I’d like to…</h2><p class="muted">Mục tiêu: khi nghĩ “Tôi muốn…”, miệng tự bật ra “I’d like to…”.</p><div class="progress-track" style="height:12px"><div class="progress-fill" style="width:${pct}%"></div></div><div class="hero-actions"><button class="primary-button" data-go="lesson/1">Tiếp tục học</button><button class="secondary-button" data-go="practice">Làm bài luyện</button></div></div></div>
      <div class="check-grid">${all.map(x=>{const key=scopedLearnKey(sentenceLearnKey(x.en),CORE_LESSON_ID);const done=!!state.learned[key];return `<div class="check-row ${done?'done':''}"><span>${done?'✓':'○'}</span><span>${esc(x.en)}</span></div>`;}).join('')}</div></section>`;
    bindGenericRoutes();
  }

  function bindGenericRoutes(){ $$('[data-go]').forEach(b=>b.onclick=()=>routeTo(b.dataset.go)); }

  function lookupData(term,type='word'){
    const normalized=normalizeText(term);
    if(!L) return {key:'w:'+normalized,term,ipa:'',meaning:'Từ điển bài học chưa được tải.',example:'',type:'word'};
    if(type==='phrase' || normalized.includes(' ')){
      const p=L.phrases[normalized]; if(p) return {key:'p:'+normalized,term,ipa:p[0],meaning:p[1],example:p[2],type:'phrase'};
      const words=normalized.split(' ').map(w=>lookupData(w,'word')).filter(Boolean);
      return {key:'p:'+normalized,term,ipa:'',meaning:'Cụm này chưa có nghĩa cố định trong từ điển của bài hiện tại.',example:'',type:'phrase',breakdown:words};
    }
    const w=L.dictionary[normalized]; if(!w) return {key:'w:'+normalized,term,ipa:'',meaning:'Từ này chưa có trong từ điển của bài hiện tại.',example:'',type:'word'};
    return {key:'w:'+normalized,term,ipa:w[0],meaning:w[1],example:w[2],type:'word'};
  }
  function openLookup(term,type='word'){
    currentLookup=lookupData(term,type); const p=currentLookup;
    $('#popoverWord').textContent=p.term;$('#popoverIpa').textContent=p.ipa||'';$('#popoverMeaning').textContent=p.meaning||'';$('#popoverExample').textContent=p.example?`Ví dụ: ${p.example}`:'';
    const bd=$('#popoverBreakdown'); if(p.breakdown?.length){bd.classList.remove('hidden');bd.innerHTML='<b>Nghĩa từng từ đã biết:</b><br>'+p.breakdown.map(x=>`${esc(x.term)} = ${esc(x.meaning)}`).join('<br>');}else{bd.classList.add('hidden');bd.innerHTML='';}
    const saved=!!state.saved[p.key];$('#saveWordBtn').textContent=saved?'★ Đã lưu':'☆ Lưu';$('#wordPopover').classList.remove('hidden');
  }
  function closePopover(){ $('#wordPopover').classList.add('hidden'); currentLookup=null; }
  function saveCurrentLookup(){ if(!currentLookup) return; const k=currentLookup.key;if(state.saved[k]){delete state.saved[k];toast('Đã bỏ khỏi từ đã lưu.');}else{state.saved[k]={...currentLookup,savedAt:Date.now(),breakdown:undefined};toast('Đã lưu vào My Vocabulary.');}saveState();$('#saveWordBtn').textContent=state.saved[k]?'★ Đã lưu':'☆ Lưu'; }

  function detectSelection(){
    const sel=window.getSelection(); if(!sel || sel.isCollapsed){hideSelectionBar();return;}
    const text=sel.toString().trim().replace(/\s+/g,' '); if(!text || text.length>90){hideSelectionBar();return;}
    const anchor=sel.anchorNode?.parentElement; const focus=sel.focusNode?.parentElement; if(!anchor?.closest('.english-text') && !focus?.closest('.english-text')){hideSelectionBar();return;}
    currentSelection=text;$('#selectionText').textContent=text;$('#selectionBar').classList.remove('hidden');
  }
  function hideSelectionBar(){ $('#selectionBar').classList.add('hidden'); currentSelection=''; }

  function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.add('hidden'),2600);}
  function openSidebar(){ $('#sidebar').classList.add('open');$('#drawerShade').classList.remove('hidden'); }
  function closeSidebar(){ $('#sidebar').classList.remove('open');$('#drawerShade').classList.add('hidden'); }

  document.addEventListener('click',e=>{
    const r=e.target.closest('[data-route]'); if(r){routeTo(r.dataset.route);return;}
    if(!e.target.closest('#wordPopover') && !e.target.closest('.word-token') && !e.target.closest('#selectionBar')) closePopover();
  });
  document.addEventListener('mouseup',()=>setTimeout(detectSelection,20));
  document.addEventListener('touchend',()=>setTimeout(detectSelection,120));
  $('#menuBtn').onclick=openSidebar;$('#drawerShade').onclick=closeSidebar;
  $('#closePopoverBtn').onclick=closePopover;$('#speakWordBtn').onclick=()=>currentLookup&&speak(currentLookup.term);$('#saveWordBtn').onclick=saveCurrentLookup;
  $('#selectionSpeakBtn').onclick=()=>currentSelection&&speak(currentSelection);$('#selectionLookupBtn').onclick=async()=>{if(currentSelection){try{if(!L)await ensureCoreEnglish();openLookup(currentSelection,'phrase');}catch(error){toast(error.message);}}hideSelectionBar();};$('#selectionCloseBtn').onclick=hideSelectionBar;
  $('#hideViBtn').onclick=()=>{state.hideVi=!state.hideVi;saveState();};$('#globalRateSelect').onchange=e=>{state.rate=Number(e.target.value);saveState();};
  $('#resetDataBtn').onclick=()=>{if(confirm('Xóa toàn bộ tiến độ, từ đã lưu và điểm luyện trên thiết bị này?')){localStorage.removeItem(KEY);state={...defaults};quiz=makeQuizSession([], 'sequential', null, 'lesson');render();toast('Đã xóa dữ liệu học.');}};
  window.addEventListener('hashchange',render);
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
  window.addEventListener('appinstalled',()=>{installPrompt=null;toast('Language Studio đã được cài.');});
  if('speechSynthesis' in window) speechSynthesis.onvoiceschanged=()=>speechSynthesis.getVoices();
  if('serviceWorker' in navigator){
    if(location.protocol==='https:'){
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
    }else{
      navigator.serviceWorker.getRegistrations().then(regs=>regs.forEach(reg=>reg.unregister())).catch(()=>{});
      if('caches' in window) caches.keys().then(keys=>keys.forEach(key=>caches.delete(key))).catch(()=>{});
    }
  }
  window.__LS_RENDERED=false;
  if(!location.hash) location.hash='#home';
  Promise.resolve(render())
    .then(()=>{window.__LS_RENDERED=true;})
    .catch(error=>{
      console.error('Language Studio boot failed:',error);
      window.__LS_BOOT_ERRORS = window.__LS_BOOT_ERRORS || [];
      window.__LS_BOOT_ERRORS.push(error?.message || String(error));
    });
})();
