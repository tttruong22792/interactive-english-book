(() => {
  'use strict';
  const L = window.LESSON;
  const CATALOG = window.PATTERN_CATALOG || [];
  const PLATFORM = window.PLATFORM_DATA || {};
  const KEY = 'interactiveEnglishBook:v2';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  const defaults = { hideVi:false, rate:0.88, learned:{}, saved:{}, quizBest:0, quizRuns:0, lessonVisits:0 };
  let state = loadState();
  let currentLookup = null;
  let currentSelection = '';
  let quiz = { index:0, correct:0, counted:new Set(), revealed:false };
  let flashIndex = 0;
  let builder = [];

  function loadState(){
    try { return {...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}')}; }
    catch { return {...defaults}; }
  }
  function saveState(){ localStorage.setItem(KEY, JSON.stringify(state)); updateGlobalUI(); }
  function esc(s=''){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escAttr(s=''){ return esc(s); }
  function normalizeText(s=''){ return String(s).toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim(); }
  function keyFor(s=''){ return normalizeText(s).replace(/\s+/g,'-'); }
  function learnedCount(){ return Object.keys(state.learned || {}).filter(k => state.learned[k]).length; }
  function lessonPercent(){ return Math.min(100, Math.round(((Math.min(20, learnedCount()) + Math.min(10, state.quizBest || 0)) / 30) * 100)); }
  function savedCount(){ return Object.keys(state.saved || {}).length; }

  function updateGlobalUI(){
    const pct = lessonPercent();
    $('#sidebarProgressText').textContent = pct + '%';
    $('#sidebarProgressBar').style.width = pct + '%';
    $('#sidebarProgressNote').textContent = pct >= 100 ? 'Mẫu 01 đã hoàn thành' : `${learnedCount()}/20 câu đã đánh dấu thuộc`;
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
    if (hash.startsWith('lesson/')) return {name:'lesson', id:Number(hash.split('/')[1]) || 1};
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
  function render(){
    stopSpeech();
    closePopover();
    hideSelectionBar();
    const r = parseRoute();
    setNavActive(r.name === 'lesson' ? 'patterns' : r.name);
    if (r.name === 'home') renderHome();
    else if (r.name === 'patterns') renderPatterns();
    else if (r.name === 'japanese') renderJapanese();
    else if (r.name === 'lesson') renderLesson(r.id);
    else if (r.name === 'vocab') renderVocab();
    else if (r.name === 'practice') renderPracticeHub();
    else if (r.name === 'progress') renderProgress();
    else renderHome();
    updateGlobalUI();
    $('#mainView').focus({preventScroll:true});
    window.scrollTo({top:0, behavior:'instant'});
  }

  function renderHome(){
    setHeader('Trang chủ','Language Studio');
    const pct=lessonPercent();
    const tracks=(PLATFORM.tracks||[]).map(trackCard).join('');
    const modules=(PLATFORM.modules||[]).map(moduleCard).join('');
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
            <div><strong>${state.quizBest||0}/10</strong><span>Quiz tốt nhất</span></div>
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
        <div class="promo-copy"><span class="landing-kicker">CURRENT LESSON</span><h2>I’d like to…</h2><p>Giữ nguyên toàn bộ bài học tương tác từ tài liệu của bạn: cách đọc, 20 câu, công việc, nhà hàng, sentence builder, hội thoại và quiz.</p><button class="primary-button" data-go="lesson/1">Mở bài đầy đủ</button></div>
        <div class="promo-preview"><div class="preview-label">Tap to listen</div>
          ${sentenceRow("I'd like to buy this.","Tôi muốn mua cái này.")}
          ${sentenceRow("I'd like to ask you something.","Tôi muốn hỏi bạn một việc.")}
          ${sentenceRow("I'd like to check something.","Tôi muốn kiểm tra một việc.")}
        </div>
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

  function feature(  function feature(icon,title,text){ return `<article class="feature-card"><div class="feature-icon">${icon}</div><h3>${esc(title)}</h3><p>${esc(text)}</p></article>`; }

  function renderPatterns(){
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

  function renderLesson(id){
    if(id!==1){ toast('Hiện tại chỉ Mẫu 01 có nội dung hoàn chỉnh.'); routeTo('patterns'); return; }
    state.lessonVisits=(state.lessonVisits||0)+1; saveState();
    setHeader('English › Patterns › 01','I’d like to…',true);
    builder=[];
    $('#mainView').innerHTML = lessonHTML();
    hydrateSentences($('#mainView'));
    bindLessonEvents();
  }
  function lessonHTML(){
    return `
      <article class="book-header">
        <div class="eyebrow">MẪU CÂU SỐ 1</div><h1>I’d like to…</h1>
        <div class="meaning">“Tôi muốn…” — một mẫu câu cực kỳ hữu ích trong giao tiếp hằng ngày</div>
        <div class="lead-box"><strong>I’d like to… = Tôi muốn… / Tôi muốn được…</strong><br>Đây là cách nói lịch sự, tự nhiên hơn so với <b>I want to...</b></div>
        <h3>Công thức</h3><div class="formula-box">I’d like to + động từ nguyên mẫu</div>
        <div class="sentence-list">${L.introExamples.map((x,i)=>sentenceRow(x[0],x[1])).join('')}</div>
        <div class="green-box">Hãy học cả cụm <b>“I’d like to…”</b> như một khối. Khi nghĩ “Tôi muốn…”, mục tiêu là miệng tự bật ra “I’d like to…”.</div>
        <div class="source-note">Nội dung bài học dựa trên Mẫu 01 trong tài liệu bạn đã cung cấp.</div>
      </article>

      <section class="book-section" id="pronunciation">
        <h2>1. Cách đọc</h2>
        <div class="read-box">${inlineSentence("I'd like to")}
          <div style="text-align:center"><strong style="font-size:23px;color:var(--blue)">/aɪd laɪk tə/</strong><br><span data-vi-only>Người Việt có thể đọc gần như: <b>“ai-đ lai-k tờ”</b></span></div>
        </div>
        <p>Khi nói tự nhiên, không cần tách từng từ:</p>
        <div class="natural-box">${inlineSentence("I'd like to")}<strong>I’d-like-to...</strong><div data-vi-only>aiđ-lai(k)-tờ...</div></div>
        <h3>Ví dụ</h3>${sentenceRow("I'd like to go home.","Đọc chậm: Aiđ lai-k tờ gâu hôum. · Đọc tự nhiên: Aiđ-lai(k)-tờ-gâu-hôum.")}
        <h2 style="margin-top:28px">2. <code>I’d</code> là gì?</h2>
        <p><b>I’d like to = I would like to</b></p><p><code>I’d</code> ở đây là dạng rút gọn của <b>I would</b>.</p>
        <div class="green-box" style="text-align:center">Bạn không cần suy nghĩ về “would” khi đang nói. Hãy học cả cụm:<br><strong style="font-size:20px;color:var(--blue)">I’d like to = tôi muốn</strong><br>Giống như học một khối duy nhất.</div>
        <div class="sentence-list">${sentenceRow('I like to buy this.','Tôi thích mua cái này.')}${sentenceRow("I'd like to buy this.",'Tôi muốn mua cái này.')}</div>
        <p>Chỉ khác chữ ’d, nhưng nghĩa thay đổi rất nhiều.</p>
      </section>

      <section class="book-section">
        <h2>3. So sánh với <code>I want to</code></h2><p>Cả hai đều có nghĩa là “tôi muốn…”.</p>
        ${sentenceRow('I want to go home.','Tôi muốn về nhà.')}${sentenceRow("I'd like to go home.",'Tôi muốn về nhà.')}
        <div class="compare-grid"><div class="head">I want to...</div><div class="head">I’d like to...</div><div>Trực tiếp, bình thường.</div><div>Mềm hơn, lịch sự hơn.</div></div>
        <p>Ví dụ ở nhà:</p>${sentenceRow('I want to sleep.','Tôi muốn ngủ. Hoàn toàn bình thường.')}
        <p>Nhưng nói với nhân viên cửa hàng:</p>${sentenceRow("I'd like to buy this.",'Tôi muốn mua cái này. Nghe tự nhiên hơn.')}
        <div class="amber-box">Với trình độ hiện tại, hãy ưu tiên dùng <b>I’d like to...</b> khi nói với người khác.</div>
      </section>

      <section class="book-section" id="sentences20">
        <h2>4. 20 câu đầu tiên cần thuộc</h2><p>Đừng cố học từ riêng lẻ. Hãy đọc nguyên cả câu.</p>
        <div class="study-toolbar"><button id="playAll20" class="primary-button">▶ Nghe toàn bộ</button><button id="repeatDaily5" class="secondary-button">🔁 Lặp 5 câu hôm nay</button><span class="muted">Đánh dấu ✓ khi câu đã bật ra tự nhiên.</span></div>
        <div class="sentence-table"><div class="sentence-table-head"><span>English</span><span>Nghĩa</span><span>Đã thuộc</span></div>${L.sentences20.map((x,i)=>sentenceRow(x[0],x[1],`s20-${i}`)).join('')}</div>
      </section>

      <section class="book-section">
        <h2>5. Đặc biệt hữu ích trong công việc</h2><p>Bạn có thể dùng mẫu này rất nhiều khi làm việc bằng tiếng Anh:</p>
        <div class="sentence-list">${L.work.map(x=>sentenceRow(x[0],x[1])).join('')}</div>
        <div class="green-box"><div class="eyebrow">CÂU NÊN THUỘC NGAY</div>${sentenceRow("I'd like to confirm one thing.",'Hãy coi câu này như một khối duy nhất, không cần dịch từng từ khi nói.')}</div>
        <h2 style="margin-top:28px">6. Dùng trong nhà hàng</h2><p>Bạn sẽ gặp dạng hơi khác:</p><div class="formula-box">I’d like + danh từ<small>Không có to.</small></div>
        <div class="sentence-list">${L.restaurantNouns.map(x=>sentenceRow(x[0],x[1])).join('')}</div>
        <div class="compare-grid"><div class="head">I’d like + danh từ</div><div class="head">I’d like to + động từ</div><div>${inlineSentence("I'd like a coffee.")}</div><div>${inlineSentence("I'd like to order a coffee.")}</div></div>
      </section>

      <section class="book-section" id="builderSection">
        <h2>7. Cách mở rộng câu</h2><p>Đây mới là phần quan trọng. Bạn không cần học một câu dài ngay từ đầu. Hãy xây câu từng lớp:</p>
        <div class="builder-steps">${L.buildSteps.map(s=>`<div class="builder-step"><small>${esc(s[0])}</small>${inlineSentence(s[1])}<div class="vi" data-vi-only>${esc(s[2])}</div></div>`).join('')}</div>
        <div class="amber-box" style="text-align:center">I’d like to… → I’d like to go… → I’d like to go there… → I’d like to go there tomorrow…</div><p>Đây là cách nên luyện trong 3 tháng tới.</p>
        <div class="builder-lab"><div class="builder-top"><div><div class="eyebrow">SENTENCE BUILDER</div><strong>Tự ghép phần phía sau</strong></div><button id="speakBuilder" class="speaker">🔊</button></div><div id="builderOutput" class="builder-output">I’d like to…</div><div id="builderGroups" class="builder-groups">${L.builderGroups.map((g,gi)=>`<div class="builder-group"><strong>${esc(g.label)}</strong><div class="chip-row">${g.options.map(o=>`<button class="word-chip" data-builder="${escAttr(o)}">${esc(o)}</button>`).join('')}</div></div>`).join('')}</div><div class="builder-actions"><button id="builderUndo" class="secondary-button">← Xóa phần cuối</button><button id="builderReset" class="secondary-button">Làm lại</button></div></div>
        <h2 style="margin-top:30px">8. Mẫu hội thoại cực ngắn</h2>${L.dialogs.map((d,di)=>dialogCard(d,di)).join('')}
      </section>

      <section class="book-section">
        <h2>9. Biến thành câu hỏi</h2><div class="formula-box">Would you like to…?<small>= Bạn có muốn… không?</small></div>
        <div class="sentence-list">${L.questions.map(x=>sentenceRow(x[0],x[1])).join('')}</div><p>Bạn có thể trả lời:</p><div class="green-box">${sentenceRow("Yes, I'd like to.",'Vâng, tôi muốn.')}${sentenceRow("I'd love to.",'Rất muốn.')}</div>
      </section>

      <section class="book-section" id="lessonPractice"><h2>10. Bài luyện hôm nay</h2><p>Tôi đưa tiếng Việt. Bạn cố nói tiếng Anh không nhìn đáp án trước.</p>${quizHTML('lesson')}</section>

      <section class="book-section"><div class="eyebrow">CÁCH HỌC MẪU NÀY HÔM NAY</div><h2>Không cần học 50 câu. Chỉ cần chọn 5 câu.</h2><div class="daily-list">${L.dailyFive.map(s=>`<div class="daily-item">${inlineSentence(s)}</div>`).join('')}</div><p>Mỗi câu nói 10 lần, sau đó tự thay phần phía sau:</p><div class="formula-box">I’d like to + ______.</div><div class="completion-box"><span>MỤC TIÊU</span><br>Không phải là nhớ ngữ pháp. Khi bạn nghĩ “Tôi muốn…”, miệng tự bật ra:<br><strong>I’d like to…</strong><br>Đó mới là giao tiếp thực tế.</div><div class="footer-next"><div><span class="eyebrow">MẪU TIẾP THEO</span><br><strong>Mẫu số 2: I need to...</strong><div>= Tôi cần phải…</div><small>Hai mẫu I’d like to... và I need to... kết hợp với nhau cực kỳ mạnh trong giao tiếp hằng ngày.</small></div><button class="secondary-button" id="nextPatternInfo">Xem trạng thái Mẫu 02</button></div></section>`;
  }

  function sentenceRow(en,vi,learnKey=''){
    const checked=learnKey && state.learned[learnKey] ? 'checked' : '';
    return `<div class="sentence-card" data-sentence-card="1" data-en-card="${escAttr(en)}"><div class="en-wrap"><button class="speaker" data-speak="${escAttr(en)}" aria-label="Nghe câu">🔊</button><div class="english-text" data-en="${escAttr(en)}"></div></div><div class="vi" data-vi-only>${esc(vi)}</div>${learnKey?`<label class="learn-toggle"><input type="checkbox" data-learn="${learnKey}" ${checked}> Đã thuộc</label>`:''}</div>`;
  }
  function inlineSentence(en){ return `<span class="en-wrap" style="display:inline-flex"><button class="speaker" data-speak="${escAttr(en)}" aria-label="Nghe">🔊</button><span class="english-text" data-en="${escAttr(en)}"></span></span>`; }
  function dialogCard(d,di){ return `<div class="dialog-card"><div class="dialog-title"><span>${esc(d.place)}</span><button class="mini-button" data-dialog-play="${di}">▶ Nghe hội thoại</button></div>${d.rows.map(r=>`<div class="dialog-row"><span class="role">${esc(r[0])}</span><div class="english-text" data-en="${escAttr(r[1])}"></div><div class="vi" data-vi-only>${esc(r[2])}</div></div>`).join('')}</div>`; }

  function hydrateSentences(root){
    $$('.english-text[data-en]',root).forEach(el=>buildWordSpans(el,el.dataset.en));
    $$('[data-speak]',root).forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation(); const card=btn.closest('[data-sentence-card]'); speak(btn.dataset.speak, card?$('.english-text',card):btn.parentElement); }));
    $$('[data-sentence-card]',root).forEach(card=>card.addEventListener('click',e=>{if(e.target.closest('button,input,label,.word-token')) return; speak(card.dataset.enCard,$('.english-text',card));}));
    $$('.word-token',root).forEach(w=>w.addEventListener('click',e=>{e.stopPropagation(); openLookup(w.dataset.word,'word');}));
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
  function stopSpeech(){ if('speechSynthesis' in window) speechSynthesis.cancel(); $$('.speaking').forEach(x=>x.classList.remove('speaking')); $$('.playing').forEach(x=>x.classList.remove('playing')); }
  function speak(text, highlightEl=null, rate=state.rate){
    return new Promise(resolve=>{
      if(!('speechSynthesis' in window)){ toast('Trình duyệt này không hỗ trợ đọc văn bản.'); resolve(); return; }
      stopSpeech();
      const u=new SpeechSynthesisUtterance(text); const lang=detectSpeechLang(text); u.lang=lang; u.rate=Number(rate)||.88; const v=bestVoice(lang); if(v) u.voice=v;
      const card=highlightEl?.closest?.('[data-sentence-card]'); if(card) card.classList.add('playing');
      u.onboundary=e=>{
        if(!highlightEl || typeof e.charIndex!=='number') return;
        $$('.word-token',highlightEl).forEach(w=>{const a=+w.dataset.start,b=+w.dataset.end;w.classList.toggle('speaking',e.charIndex>=a && e.charIndex<b);});
      };
      const done=()=>{if(highlightEl) $$('.word-token',highlightEl).forEach(w=>w.classList.remove('speaking')); if(card) card.classList.remove('playing'); resolve();};
      u.onend=done; u.onerror=done; speechSynthesis.speak(u);
    });
  }
  async function speakSequence(items){ for(const item of items){ await speak(item[0],item[1]||null); await wait(180); } }
  const wait=ms=>new Promise(r=>setTimeout(r,ms));

  function bindLessonEvents(){
    $$('[data-learn]').forEach(cb=>cb.onchange=()=>{state.learned[cb.dataset.learn]=cb.checked; saveState();});
    $('#playAll20').onclick=()=>speakSequence(L.sentences20.map((x,i)=>[x[0],$$('#sentences20 .english-text')[i]]));
    $('#repeatDaily5').onclick=()=>speakSequence(L.dailyFive.map(s=>[s,null]));
    $$('[data-builder]').forEach(b=>b.onclick=()=>{builder.push(b.dataset.builder);updateBuilder();});
    $('#builderUndo').onclick=()=>{builder.pop();updateBuilder();}; $('#builderReset').onclick=()=>{builder=[];updateBuilder();}; $('#speakBuilder').onclick=()=>speak(builderSentence());
    $$('[data-dialog-play]').forEach(b=>b.onclick=()=>{const d=L.dialogs[+b.dataset.dialogPlay]; const card=b.closest('.dialog-card'); const els=$$('.english-text',card); speakSequence(d.rows.map((r,i)=>[r[1],els[i]]));});
    $('#nextPatternInfo').onclick=()=>{toast('Mẫu 02: I need to... = Tôi cần phải… Nội dung chi tiết chưa được thêm.'); routeTo('patterns');};
    bindQuiz($('#lessonPractice'));
  }
  function builderSentence(){ return builder.length ? `I'd like to ${builder.join(' ')}.` : "I'd like to..."; }
  function updateBuilder(){ $('#builderOutput').textContent=builderSentence(); }

  function quizHTML(context){
    const item=L.practice[quiz.index] || L.practice[0];
    return `<div class="quiz-card" data-quiz="${context}"><div class="quiz-meta"><span id="quizProgress">Câu ${quiz.index+1}/10</span><span>Điểm lượt này: <b id="quizScore">${quiz.correct}</b>/10</span></div><div id="quizPrompt" class="quiz-prompt" data-vi-only>${esc(item[0])}</div><input id="quizInput" class="quiz-input" autocomplete="off" placeholder="Nhập câu tiếng Anh..."/><div class="quiz-actions"><button id="quizCheck" class="primary-button">Kiểm tra</button><button id="quizMic" class="secondary-button">🎤 Nói</button><button id="quizShow" class="secondary-button">Xem đáp án</button><button id="quizNext" class="secondary-button hidden">Câu tiếp theo →</button></div><div id="quizFeedback" class="quiz-feedback"></div></div><details style="margin-top:12px"><summary style="cursor:pointer;color:var(--navy);font-weight:700">Xem toàn bộ đáp án</summary><ol class="answer-list">${L.practice.map(x=>`<li>${esc(x[1])}</li>`).join('')}</ol></details>`;
  }
  function bindQuiz(root){
    const q=$('[data-quiz]',root); if(!q) return;
    const input=$('#quizInput',q), check=$('#quizCheck',q), show=$('#quizShow',q), next=$('#quizNext',q), mic=$('#quizMic',q), feedback=$('#quizFeedback',q);
    const answer=L.practice[quiz.index][1];
    const evaluate=()=>{
      if(!input.value.trim()){feedback.className='quiz-feedback bad';feedback.textContent='Hãy nhập hoặc nói câu trả lời trước.';return;}
      const good=normalizeText(input.value)===normalizeText(answer);
      if(good){
        feedback.className='quiz-feedback good';feedback.textContent='✓ Chính xác. ' + answer;
        if(!quiz.counted.has(quiz.index)){quiz.correct++;quiz.counted.add(quiz.index);$('#quizScore',q).textContent=quiz.correct;}
      }else{feedback.className='quiz-feedback bad';feedback.textContent='Chưa đúng. Bạn có thể thử lại hoặc xem đáp án.';}
      next.classList.remove('hidden');
    };
    check.onclick=evaluate; input.addEventListener('keydown',e=>{if(e.key==='Enter') evaluate();});
    show.onclick=()=>{feedback.className='quiz-feedback';feedback.innerHTML=`Đáp án: <b>${esc(answer)}</b> <button class="mini-button" id="quizAnswerSpeak">🔊 Nghe</button>`;$('#quizAnswerSpeak',feedback).onclick=()=>speak(answer);next.classList.remove('hidden');};
    next.onclick=()=>{
      if(quiz.index<9){quiz.index++; rerenderQuiz(root);}
      else{state.quizRuns=(state.quizRuns||0)+1;state.quizBest=Math.max(state.quizBest||0,quiz.correct);saveState();feedback.className='quiz-feedback good';feedback.innerHTML=`Hoàn thành: <b>${quiz.correct}/10</b>. Điểm tốt nhất: <b>${state.quizBest}/10</b>.`;next.textContent='Làm lại 10 câu';next.classList.remove('hidden');next.onclick=()=>{quiz={index:0,correct:0,counted:new Set(),revealed:false};rerenderQuiz(root);};}
    };
    mic.onclick=()=>startRecognition(input);
  }
  function rerenderQuiz(root){
    const holder=root.matches('.book-section')?root:$('#practiceQuizWrap',root);
    if(holder.matches('.book-section')){const details=$('details',holder);holder.innerHTML=`<h2>10. Bài luyện hôm nay</h2><p>Tôi đưa tiếng Việt. Bạn cố nói tiếng Anh không nhìn đáp án trước.</p>${quizHTML('lesson')}`;hydrateSentences(holder);bindQuiz(holder);}
    else{holder.innerHTML=quizHTML('hub');bindQuiz(holder);}
  }
  function startRecognition(input){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){toast('Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Hãy dùng Chrome hoặc Edge.');return;}
    const r=new SR();r.lang='en-US';r.interimResults=false;r.maxAlternatives=1;toast('Đang nghe... hãy nói câu tiếng Anh.');r.onresult=e=>{input.value=e.results[0][0].transcript;toast('Đã nhận giọng nói. Bấm Kiểm tra.');};r.onerror=()=>toast('Không nhận được giọng nói. Hãy thử lại.');r.start();
  }

  function renderJapanese(){
    setHeader('Japanese','Japanese Learning');
    const phrases=PLATFORM.japanesePhrases||[];
    $('#mainView').innerHTML=`
      <section class="page-hero japanese-hero"><div class="eyebrow">JAPANESE · 日本語</div><h1>Tiếng Nhật cho cuộc sống tại Nhật</h1><p>Khu vực này đã được tách thành một track riêng để sau này có thể thêm bài học sinh hoạt, công việc, trường học, bệnh viện, nhà hàng và giao tiếp với khách hàng.</p></section>
      <section class="jp-intro-grid">
        <article class="jp-plan accent-green"><span>01</span><h3>Daily Life</h3><p>Mua sắm, bệnh viện, hàng xóm, trường học và thủ tục.</p></article>
        <article class="jp-plan accent-purple"><span>02</span><h3>Work</h3><p>Công sở, báo cáo, xác nhận, hỏi lại và xử lý tình huống.</p></article>
        <article class="jp-plan accent-yellow"><span>03</span><h3>Service</h3><p>Nhà hàng, cửa hàng và các mẫu câu lịch sự thường dùng.</p></article>
      </section>
      <section class="book-section"><div class="section-title-row"><div><h2>5 câu Nhật thử nghiệm</h2><p>Bấm loa để nghe bằng giọng ja-JP của thiết bị.</p></div></div><div class="jp-list">${phrases.map(x=>`<div class="jp-row"><button class="speaker" data-speak="${escAttr(x[0])}">🔊</button><div><strong class="jp-text">${esc(x[0])}</strong><span>${esc(x[1])}</span><small data-vi-only>${esc(x[2])}</small></div></div>`).join('')}</div><div class="green-box">Đây mới là khung đầu tiên. Nội dung Japanese sẽ được thêm theo module, không làm chung lẫn vào 80 mẫu câu English.</div></section>
    `;
    hydrateSentences($('#mainView'));
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

  function renderPracticeHub(){
    setHeader('Practice','Practice Center'); quiz={index:0,correct:0,counted:new Set(),revealed:false};
    $('#mainView').innerHTML=`<section class="page-hero"><div class="eyebrow">PRACTICE CENTER</div><h1>Luyện nghe – bật câu – kiểm tra</h1><p>Tất cả bài luyện hiện tại dùng nội dung Mẫu 01, không thêm câu ngoài tài liệu gốc.</p><div class="hero-actions"><button id="playDaily5Hub" class="primary-button">🔊 Nghe 5 câu hôm nay</button><button class="secondary-button" data-go="lesson/1">Mở bài học đầy đủ</button></div></section><div class="section-title-row"><div><h2>Dịch Việt → Anh</h2><p>10 câu trong phần “Bài luyện hôm nay”.</p></div></div><section id="practiceQuizWrap" class="paper-card" style="padding:20px">${quizHTML('hub')}</section><div class="section-title-row"><div><h2>5 câu cần bật ra ngay</h2><p>Nghe và nói lại mỗi câu nhiều lần.</p></div></div><section class="paper-card" style="padding:16px"><div class="daily-list">${L.dailyFive.map(s=>`<div class="daily-item">${inlineSentence(s)}</div>`).join('')}</div></section>`;
    bindGenericRoutes();hydrateSentences($('#mainView'));bindQuiz($('#practiceQuizWrap'));$('#playDaily5Hub').onclick=()=>speakSequence(L.dailyFive.map(s=>[s,null]));
  }

  function renderProgress(){
    setHeader('Progress','Tiến độ học'); const pct=lessonPercent();
    $('#mainView').innerHTML=`<section class="page-hero"><div class="eyebrow">PROGRESS</div><h1>Tiến độ Mẫu 01</h1><p>Tiến độ được tính từ 20 câu bạn đánh dấu “đã thuộc” và điểm tốt nhất của bài luyện 10 câu.</p></section><section class="stats-grid"><div class="stat-card"><small>Câu đã thuộc</small><strong>${learnedCount()}/20</strong></div><div class="stat-card"><small>Quiz tốt nhất</small><strong>${state.quizBest||0}/10</strong></div><div class="stat-card"><small>Từ đã lưu</small><strong>${savedCount()}</strong></div><div class="stat-card"><small>Số lượt làm quiz</small><strong>${state.quizRuns||0}</strong></div></section><section class="progress-panel"><div class="progress-big"><div class="ring" style="--pct:${pct}%"><strong>${pct}%</strong></div><div><h2 style="margin:0;color:var(--navy)">I’d like to…</h2><p class="muted">Mục tiêu: khi nghĩ “Tôi muốn…”, miệng tự bật ra “I’d like to…”.</p><div class="progress-track" style="height:12px"><div class="progress-fill" style="width:${pct}%"></div></div><div class="hero-actions"><button class="primary-button" data-go="lesson/1">Tiếp tục học</button><button class="secondary-button" data-go="practice">Làm bài luyện</button></div></div></div><div class="check-grid">${L.sentences20.map((x,i)=>`<div class="check-row ${state.learned[`s20-${i}`]?'done':''}"><span>${state.learned[`s20-${i}`]?'✓':'○'}</span><span>${esc(x[0])}</span></div>`).join('')}</div></section>`;
    bindGenericRoutes();
  }

  function bindGenericRoutes(){ $$('[data-go]').forEach(b=>b.onclick=()=>routeTo(b.dataset.go)); }

  function lookupData(term,type='word'){
    const normalized=normalizeText(term);
    if(type==='phrase' || normalized.includes(' ')){
      const p=L.phrases[normalized]; if(p) return {key:'p:'+normalized,term,ipa:p[0],meaning:p[1],example:p[2],type:'phrase'};
      const words=normalized.split(' ').map(w=>lookupData(w,'word')).filter(Boolean);
      return {key:'p:'+normalized,term,ipa:'',meaning:'Cụm này chưa có nghĩa cố định trong từ điển của Mẫu 01.',example:'',type:'phrase',breakdown:words};
    }
    const w=L.dictionary[normalized]; if(!w) return {key:'w:'+normalized,term,ipa:'',meaning:'Từ này chưa có trong từ điển của Mẫu 01.',example:'',type:'word'};
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
  $('#selectionSpeakBtn').onclick=()=>currentSelection&&speak(currentSelection);$('#selectionLookupBtn').onclick=()=>{if(currentSelection)openLookup(currentSelection,'phrase');hideSelectionBar();};$('#selectionCloseBtn').onclick=hideSelectionBar;
  $('#hideViBtn').onclick=()=>{state.hideVi=!state.hideVi;saveState();};$('#globalRateSelect').onchange=e=>{state.rate=Number(e.target.value);saveState();};
  $('#resetDataBtn').onclick=()=>{if(confirm('Xóa toàn bộ tiến độ, từ đã lưu và điểm luyện trên thiết bị này?')){localStorage.removeItem(KEY);state={...defaults};quiz={index:0,correct:0,counted:new Set(),revealed:false};render();toast('Đã xóa dữ liệu học.');}};
  window.addEventListener('hashchange',render);
  if('speechSynthesis' in window) speechSynthesis.onvoiceschanged=()=>speechSynthesis.getVoices();
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
  if(!location.hash) location.hash='#home'; else render();
})();
