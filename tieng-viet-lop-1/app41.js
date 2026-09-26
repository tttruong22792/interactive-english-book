(function(){
  'use strict';
  var L=window.TV1_LESSON;
  var $=function(s,r){return (r||document).querySelector(s);};
  var $$=function(s,r){return Array.from((r||document).querySelectorAll(s));};
  var KEY='vuiHocTiengViet:bai41:v1';
  var app=$('#app');
  var currentView='learn';
  var currentStep='intro';
  var state=load();
  var finalSession=null;

  function defaults(){
    return {
      stars:0,
      completed:{soundEm:false,soundEp:false,model:false,sort:false,reading:false,write:false,final:false},
      sortDone:{},
      readingSelf:{},
      readingAnswers:{},
      writeDone:{},
      bestFinal:0,
      reviews:[],
      lessonFinishedAt:null,
      lastView:'learn'
    };
  }
  function load(){
    try{
      var raw=JSON.parse(localStorage.getItem(KEY)||'{}');
      var d=defaults();
      return Object.assign(d,raw,{
        completed:Object.assign(d.completed,raw.completed||{}),
        sortDone:Object.assign({},raw.sortDone||{}),
        readingSelf:Object.assign({},raw.readingSelf||{}),
        readingAnswers:Object.assign({},raw.readingAnswers||{}),
        writeDone:Object.assign({},raw.writeDone||{})
      });
    }catch(e){return defaults();}
  }
  function save(){
    localStorage.setItem(KEY,JSON.stringify(state));
    updateProgress();
  }
  function progress(){
    return Math.round(Object.values(state.completed).filter(Boolean).length/7*100);
  }
  function updateProgress(){
    var p=$('#progressText'),b=$('#progressBar'),s=$('#starCount');
    if(p)p.textContent=progress()+'%';
    if(b)b.style.width=progress()+'%';
    if(s)s.textContent='⭐ '+state.stars;
  }
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);});}
  function toast(t){
    var el=$('#toast');el.textContent=t;el.classList.remove('hidden');
    clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.add('hidden');},1700);
  }
  function celebrate(){
    var layer=$('#confetti');layer.innerHTML='';
    ['⭐','✨','🌟','🎉','💛','💚'].forEach(function(ch,i){
      for(var n=0;n<3;n++){
        var sp=document.createElement('span');sp.textContent=ch;sp.style.left=(6+Math.random()*88)+'%';sp.style.animationDelay=(Math.random()*.28)+'s';layer.appendChild(sp);
      }
    });
    setTimeout(function(){layer.innerHTML='';},1500);
  }
  function award(key,stars){
    if(!state.completed[key]){
      state.completed[key]=true;
      state.stars+=stars||1;
      save();celebrate();
    }
  }
  function speak(text,btn){
    if(btn)btn.classList.add('speaking');
    return window.TV1Audio.speak(text,{rate:.9}).finally(function(){if(btn)btn.classList.remove('speaking');});
  }
  function audioBtn(text,label,cls){
    return '<button class="listen-btn '+(cls||'')+'" data-say="'+encodeURIComponent(text)+'"><span>🔊</span><b>'+esc(label||'Nghe')+'</b></button>';
  }
  function bindAudio(){
    $$('[data-say]').forEach(function(btn){btn.onclick=function(){speak(decodeURIComponent(btn.dataset.say),btn);};});
  }
  function stageRow(n,title,desc,key,step){
    var done=!!state.completed[key];
    return '<button class="stage-row stage-jump '+(done?'done':'')+'" data-step="'+step+'"><span class="stage-num">'+(done?'✓':n)+'</span><span><strong>'+esc(title)+'</strong><small>'+esc(desc)+'</small></span></button>';
  }
  function art(kind){
    var svgs={
      icecream:'<svg viewBox="0 0 120 100" aria-hidden="true"><path d="M44 42h32L61 91z" fill="#d9a464"/><path d="M48 48l23 31M72 48L52 78" stroke="#b67e45" stroke-width="3"/><circle cx="51" cy="34" r="19" fill="#ff8fa3"/><circle cx="68" cy="31" r="21" fill="#f7a9bf"/><circle cx="61" cy="18" r="17" fill="#ffb7c7"/><rect x="88" y="23" width="14" height="58" rx="7" fill="#77bf75"/><rect x="93" y="78" width="4" height="14" rx="2" fill="#b77b48"/></svg>',
      sandals:'<svg viewBox="0 0 120 100" aria-hidden="true"><g transform="rotate(-12 42 55)"><rect x="15" y="36" width="45" height="50" rx="19" fill="#7cc8ef"/><path d="M23 47c12 3 21 10 29 24M51 45c-10 6-18 14-24 25" fill="none" stroke="#428db9" stroke-width="8" stroke-linecap="round"/></g><g transform="rotate(10 79 48)"><rect x="61" y="21" width="43" height="51" rx="18" fill="#9ad9f5"/><path d="M69 33c12 3 19 10 27 23M96 31c-9 7-17 15-22 24" fill="none" stroke="#428db9" stroke-width="8" stroke-linecap="round"/></g></svg>',
      polite:'<svg viewBox="0 0 120 100" aria-hidden="true"><circle cx="60" cy="24" r="15" fill="#ffd5ad"/><path d="M47 22c5-14 24-14 29 0" fill="#394b58"/><path d="M45 46c10-9 20-11 30 0l8 29H37z" fill="#e66f8f"/><path d="M45 51L28 68M75 51l17 15" stroke="#ffd5ad" stroke-width="8" stroke-linecap="round"/><path d="M30 69l12 4M90 67l-12 5" stroke="#ffd5ad" stroke-width="7" stroke-linecap="round"/><path d="M48 82l-8 12M72 82l9 12" stroke="#40556b" stroke-width="8" stroke-linecap="round"/></svg>',
      stamp:'<svg viewBox="0 0 120 100" aria-hidden="true"><rect x="18" y="29" width="84" height="55" rx="8" fill="#f4f0d7" stroke="#c8b987" stroke-width="3"/><path d="M20 34l40 28 40-28M20 80l31-27M100 80L69 53" fill="none" stroke="#c8b987" stroke-width="3"/><rect x="73" y="18" width="28" height="27" rx="3" fill="#8bd1b2" stroke="#3f8d70" stroke-width="3"/><path d="M79 35c8-10 12-10 17 0" fill="none" stroke="#fff" stroke-width="3"/></svg>',
      carp:'<svg viewBox="0 0 120 100" aria-hidden="true"><ellipse cx="57" cy="53" rx="35" ry="22" fill="#d8a13c"/><path d="M88 53l24-20v40z" fill="#c57d31"/><path d="M50 34l-7-13 20 10M51 72l-7 13 20-10" fill="#bd6f30"/><circle cx="35" cy="49" r="4" fill="#20313e"/><path d="M27 59c12 5 20 5 29 0M55 37c8 8 8 24 0 32M69 36c7 9 7 24 0 33" fill="none" stroke="#8f6329" stroke-width="2.5" opacity=".7"/></svg>',
      tv:'<svg viewBox="0 0 120 100" aria-hidden="true"><rect x="19" y="20" width="82" height="58" rx="10" fill="#30485d"/><rect x="27" y="28" width="58" height="40" rx="6" fill="#8bd0c7"/><circle cx="93" cy="38" r="4" fill="#ffd86a"/><circle cx="93" cy="52" r="4" fill="#ef8b76"/><path d="M37 79l-8 12M84 79l8 12M50 15l10 8 12-10" fill="none" stroke="#30485d" stroke-width="5" stroke-linecap="round"/></svg>',
      curtain:'<svg viewBox="0 0 120 100" aria-hidden="true"><rect x="26" y="16" width="68" height="70" rx="3" fill="#d9eef7" stroke="#8cb8ca" stroke-width="3"/><path d="M60 17v69M27 50h66" stroke="#8cb8ca" stroke-width="3"/><path d="M19 13h82" stroke="#72594e" stroke-width="5" stroke-linecap="round"/><path d="M23 16c4 19 2 49-4 72 13-4 22-13 27-25V16zM97 16c-4 19-2 49 4 72-13-4-22-13-27-25V16z" fill="#df8f9f"/><path d="M35 53l-13 7M85 53l13 7" stroke="#9f586a" stroke-width="4"/></svg>',
      alley:'<svg viewBox="0 0 120 100" aria-hidden="true"><path d="M15 18h32v60H15z" fill="#e5c25a"/><path d="M73 12h32v66H73z" fill="#8abf8f"/><path d="M47 78l13-58 13 58 18 17H29z" fill="#e8dfcb"/><path d="M47 78h26" stroke="#ab9f8b" stroke-width="3"/><rect x="20" y="31" width="13" height="17" fill="#86b5ce"/><rect x="82" y="26" width="13" height="18" fill="#7f9cad"/><path d="M15 18l16-10 16 10M73 12L89 5l16 7" fill="none" stroke="#7e6955" stroke-width="4"/></svg>'
    };
    var fallback='<svg viewBox="0 0 120 100" aria-hidden="true"><circle cx="60" cy="50" r="34" fill="#ffe8a8"/><path d="M60 23l7 17 18 1-14 11 5 18-16-10-16 10 5-18-14-11 18-1z" fill="#f2b63d"/></svg>';
    return '<span class="lesson-art art-'+kind+'" aria-hidden="true">'+(svgs[kind]||fallback)+'</span>';
  }

  function renderLearn(){
    app.innerHTML=''
      +'<section class="hero-card lesson41-hero"><div class="hero-copy"><span class="eyebrow">TIẾNG VIỆT LỚP 1 · BÀI 41</span>'
      +'<h1><span class="rime-em">em</span> · <span class="rime-ep">ep</span></h1><p>'+esc(L.goal)+'</p>'
      +'<div class="hero-actions"><button id="startLesson" class="primary big">▶ Bắt đầu bài 41</button>'+audioBtn(L.audio.welcome,'Cô giáo nói')+'<a class="secondary lesson-link" href="./index.html">Bài 1</a><a class="secondary lesson-link" href="./hat-giong-nho.html">Hạt giống nhỏ →</a></div></div>'
      +'<div class="hero-mascot lesson41-mascot"><div class="mascot-bubble">Nghe phần cuối của tiếng<br><b>em khác ep thế nào?</b></div><div class="rime-orbit"><span>em</span><span>ep</span></div></div></section>'
      +'<section class="method-card"><div><span>🧠</span><strong>Không học vẹt</strong><p>Nghe → phân biệt → đọc trong từ → hiểu câu → tự nhớ lại.</p></div><div class="method-tags">'+L.principles.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div></section>'
      +'<section class="lesson-grid"><div class="stage-list card"><h2>Lộ trình Bài 41</h2>'
      +stageRow(1,'Nghe vần em','Nhận âm cuối m','soundEm','em')
      +stageRow(2,'So sánh ep','Nghe điểm khác ở âm cuối p','soundEp','ep')
      +stageRow(3,'Từ mẫu kem · dép','Tìm vần trong từ có nghĩa','model','model')
      +stageRow(4,'Phân loại 6 tiếng','lễ phép, tem thư, cá chép...','sort','sort')
      +stageRow(5,'Đọc hiểu: Thi vẽ','Đọc trước, nghe sau, trả lời bằng hiểu biết','reading','reading')
      +stageRow(6,'Tập viết','em · kem · ep · dép','write','write')
      +stageRow(7,'Thử thách cuối','Nhớ lại không nhìn gợi ý','final','final')
      +'</div><div class="card lesson-panel" id="lessonPanel">'+stepIntro()+'</div></section>';
    bindAudio();
    $('#startLesson').onclick=function(){showStep('em');speak(L.audio.welcome,this);};
    $$('.stage-jump').forEach(function(b){b.onclick=function(){showStep(b.dataset.step);};});
    bindStep();
  }

  function stepIntro(){
    return '<div class="step-head"><span class="step-chip">Khởi động</span><h2>Con nghe trước, mắt nhìn sau</h2><p>Hai vần <b>em</b> và <b>ep</b> đều bắt đầu bằng <b>e</b>. Điều quan trọng là nghe phần cuối: <b>m</b> hay <b>p</b>.</p></div>'
      +'<div class="contrast-preview"><div class="rime-card em"><b>e</b><strong>m</strong><small>kết thúc êm, còn ngân</small></div><div class="versus">≠</div><div class="rime-card ep"><b>e</b><strong>p</strong><small>khép môi nhanh, dừng lại</small></div></div>'
      +'<div class="recall-box"><strong>Mục tiêu hôm nay</strong><p>Sau bài học, con không chỉ đọc được mà còn phải <b>nghe một tiếng và tự biết nó có em hay ep</b>.</p></div>';
  }
  function stepEm(){
    return '<div class="step-head"><span class="step-chip">Bước 1 · Nghe và cảm nhận</span><h2>Vần <em class="rime-em">em</em></h2><p>Chạm nghe. Sau đó đọc lại và để ý lúc kết thúc, hai môi khép nhẹ ở âm <b>m</b>.</p></div>'
      +'<div class="sound-lab"><button class="giant-rime em" data-say="'+encodeURIComponent(L.audio.em)+'"><span>e</span><strong>m</strong><small>🔊 chạm để nghe</small></button>'
      +'<div class="mouth-clue"><div class="mouth-icon">🙂 → 😌</div><b>Cuối tiếng: m</b><p>Âm có thể ngân rất ngắn khi hai môi đã khép.</p>'+audioBtn(L.audio.emGuide,'Nghe cô giải thích')+'</div></div>'
      +'<div class="recall-box"><strong>Không nhìn chữ 3 giây</strong><p>Con nhắm mắt, nghe lại rồi nói: “Đây là vần gì?”</p><button id="doneEm" class="primary">Con trả lời: em ✓</button></div>';
  }
  function stepEp(){
    return '<div class="step-head"><span class="step-chip">Bước 2 · So sánh</span><h2>Vần <em class="rime-ep">ep</em></h2><p>Vần ep cũng bắt đầu bằng e, nhưng cuối tiếng dừng nhanh ở <b>p</b>.</p></div>'
      +'<div class="sound-lab"><button class="giant-rime ep" data-say="'+encodeURIComponent(L.audio.ep)+'"><span>e</span><strong>p</strong><small>🔊 chạm để nghe</small></button>'
      +'<div class="mouth-clue"><div class="mouth-icon">🙂 → 🤐</div><b>Cuối tiếng: p</b><p>Hai môi khép nhanh và tiếng dừng lại, không ngân như m.</p>'+audioBtn(L.audio.epGuide,'Nghe cô giải thích')+'</div></div>'
      +'<div class="listen-choice"><h3>Nghe rồi chọn</h3>'+audioBtn(L.audio.compare,'Nghe 4 vần')+'<p>Thứ tự cô vừa đọc là gì?</p><div class="choice-row"><button class="choice-card ep-check" data-a="1">em · ep · em · ep</button><button class="choice-card ep-check" data-a="0">ep · em · ep · em</button></div></div>';
  }
  function modelCard(item){
    return '<div class="model-word">'+art(item.art)+'<button class="word-big" data-say="'+encodeURIComponent(item.word)+'">'+esc(item.word)+' <span>🔊</span></button><div class="word-split">'
      +item.word.split('').map(function(ch,i){
        var inRime=i>=item.word.length-item.rime.length;
        return '<span class="'+(inRime?'focus-'+item.rime:'')+'">'+esc(ch)+'</span>';
      }).join('')+'</div><small>'+esc(item.hint)+'</small><div class="choice-row mini"><button class="rime-pick" data-word="'+item.id+'" data-rime="em">em</button><button class="rime-pick" data-word="'+item.id+'" data-rime="ep">ep</button></div></div>';
  }
  function stepModel(){
    return '<div class="step-head"><span class="step-chip">Bước 3 · Đọc trong từ thật</span><h2><span class="rime-em">kem</span> và <span class="rime-ep">dép</span></h2><p>Con nghe từ, đọc lại, rồi tự chỉ ra phần vần. Màu chỉ xuất hiện sau khi con đã nghe.</p></div>'
      +'<div class="model-grid">'+L.modelWords.map(modelCard).join('')+'</div><div id="modelFeedback" class="feedback-line">Hãy chọn vần cho cả hai từ.</div>';
  }
  function sortCard(item){
    var done=state.sortDone[item.id];
    return '<div class="sort-card '+(done?'solved':'')+'" data-sort-id="'+item.id+'">'+art(item.art)
      +'<button class="listen-round" data-say="'+encodeURIComponent(item.audio)+'">🔊</button>'
      +'<strong class="sort-word '+(done?'':'hidden')+'">'+esc(item.label)+'</strong>'
      +'<small>Nghe tiếng rồi chọn vần</small>'
      +'<div class="rime-toggle"><button data-sort-answer="em">em</button><button data-sort-answer="ep">ep</button></div></div>';
  }
  function stepSort(){
    return '<div class="step-head"><span class="step-chip">Bước 4 · Phân loại bằng tai</span><h2>Tiếng nào có <span class="rime-em">em</span>? Tiếng nào có <span class="rime-ep">ep</span>?</h2><p>Không hiện chữ trước. Con phải <b>nghe tiếng</b>, chọn vần rồi mới nhìn đáp án.</p></div>'
      +'<div class="sort-grid">'+L.sortItems.map(sortCard).join('')+'</div><div id="sortStatus" class="feedback-line">'+Object.keys(state.sortDone).length+' / '+L.sortItems.length+' tiếng đã làm đúng.</div>';
  }
  function stepReading(){
    var selfCount=Object.keys(state.readingSelf).length;
    return '<div class="step-head"><span class="step-chip">Bước 5 · Đọc hiểu</span><h2>'+esc(L.reading.title)+'</h2><p><b>Quy tắc:</b> con tự đọc câu trước. Bấm “Con đọc xong” rồi mới nghe cô đọc để kiểm tra.</p></div>'
      +'<div class="story-scene"><div class="scene-characters"><span>🐟🎨</span><span>🐥🖍️</span><span>🪽</span></div><small>Cá chép và gà nhí cùng thi vẽ.</small></div>'
      +'<div class="reading-list">'+L.reading.sentences.map(function(s,i){
        var done=!!state.readingSelf[i];
        return '<div class="reading-line '+(done?'self-done':'')+'" data-line="'+i+'"><span class="line-no">'+(i+1)+'</span><p>'+highlightRimes(s)+'</p><div class="reading-actions"><button class="secondary self-read">'+(done?'Đã tự đọc ✓':'Con đọc xong')+'</button><button class="listen-btn story-listen '+(done?'':'hidden')+'" data-say="'+encodeURIComponent(s)+'">🔊 <b>Nghe cô</b></button></div></div>';
      }).join('')+'</div>'
      +'<div class="reading-meter"><b>Đã tự đọc '+selfCount+'/'+L.reading.sentences.length+' câu</b><div class="progress-track"><div style="width:'+(selfCount/L.reading.sentences.length*100)+'%"></div></div></div>'
      +'<div id="comprehensionBox">'+renderComprehension()+'</div>';
  }
  function highlightRimes(s){
    return esc(s)
      .replace(/(em)/gi,'<mark class="mark-em">$1</mark>')
      .replace(/(ép|ẹp|ep)/gi,'<mark class="mark-ep">$1</mark>');
  }
  function renderComprehension(){
    if(Object.keys(state.readingSelf).length<L.reading.sentences.length){
      return '<div class="locked-box">🔒 Đọc hết 5 câu trước rồi mới mở câu hỏi hiểu bài.</div>';
    }
    return '<div class="comprehension"><h3>Con hiểu gì từ bài đọc?</h3>'
      +L.reading.questions.map(function(q,i){
        var answered=state.readingAnswers[i];
        return '<div class="comp-q" data-q="'+i+'"><b>'+(i+1)+'. '+esc(q.prompt)+'</b><div class="choice-stack">'
          +q.choices.map(function(c){return '<button class="comp-choice '+(answered===c?'correct':'')+'" data-choice="'+encodeURIComponent(c)+'">'+esc(c)+'</button>';}).join('')
          +'</div><div class="comp-explain">'+(answered?esc(q.explain):'Con hãy chọn câu trả lời trước.')+'</div></div>';
      }).join('')+'</div>';
  }
  function stepWrite(){
    var doneCount=Object.keys(state.writeDone).length;
    return '<div class="step-head"><span class="step-chip">Bước 6 · Tập viết</span><h2>em · kem · ep · dép</h2><p>Chọn một mẫu, tô theo chữ mờ rồi tự viết thêm một lần. Mỗi mẫu chỉ cần vài nét có chú ý.</p></div>'
      +'<div class="write-targets">'+L.writeTargets.map(function(w){return '<button class="write-target '+(state.writeDone[w]?'done':'')+'" data-target="'+encodeURIComponent(w)+'">'+esc(w)+(state.writeDone[w]?' ✓':'')+'</button>';}).join('')+'</div>'
      +'<div class="single-write"><div class="write-current"><span>Mẫu đang luyện</span><strong id="writeWord">em</strong></div><div class="canvas-wrap"><canvas id="writeCanvas" width="900" height="420"></canvas><div class="trace-word" id="traceWord">em</div></div><div class="canvas-actions"><button id="clearCanvas" class="secondary">Xóa</button><button id="finishWrite" class="primary">Con viết xong mẫu này ✓</button></div></div>'
      +'<div id="writeStatus" class="feedback-line">Đã luyện '+doneCount+'/'+L.writeTargets.length+' mẫu.</div>';
  }
  function stepFinal(){
    return '<div class="step-head"><span class="step-chip">Bước 7 · Nhớ thật</span><h2>Thử thách cuối Bài 41</h2><p>Không xem lại phần trên. Câu nào sai sẽ được giải thích, rồi con có thể luyện lại sau.</p></div><div id="finalQuiz"></div><button id="nextFinal" class="primary hidden">Câu tiếp theo →</button>';
  }

  function showStep(step){
    currentStep=step;
    var p=$('#lessonPanel');if(!p)return;
    var fn={intro:stepIntro,em:stepEm,ep:stepEp,model:stepModel,sort:stepSort,reading:stepReading,write:stepWrite,final:stepFinal}[step]||stepIntro;
    p.innerHTML=fn();
    bindStep();
    p.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function bindStep(){
    bindAudio();
    var doneEm=$('#doneEm');
    if(doneEm)doneEm.onclick=function(){award('soundEm',1);toast('Đúng: em ⭐');showStep('ep');};

    $$('.ep-check').forEach(function(b){b.onclick=function(){
      if(b.dataset.a==='1'){b.classList.add('correct');award('soundEp',1);speak(L.audio.correct);setTimeout(function(){showStep('model');},700);}
      else{b.classList.add('wrong');speak(L.audio.retry);setTimeout(function(){b.classList.remove('wrong');},700);}
    };});

    var modelSolved={};
    $$('.rime-pick').forEach(function(b){b.onclick=function(){
      var word=L.modelWords.find(function(x){return x.id===b.dataset.word;});
      if(word.rime===b.dataset.rime){
        b.classList.add('correct');modelSolved[word.id]=true;speak(L.audio.correct);
        if(Object.keys(modelSolved).length===L.modelWords.length){award('model',2);$('#modelFeedback').innerHTML='✅ Con đã tìm đúng vần trong cả <b>kem</b> và <b>dép</b>.';setTimeout(function(){showStep('sort');},800);}
      }else{b.classList.add('wrong');speak(L.audio.retry);setTimeout(function(){b.classList.remove('wrong');},600);}
    };});

    $$('.sort-card').forEach(function(card){
      $$('[data-sort-answer]',card).forEach(function(b){b.onclick=function(){
        var item=L.sortItems.find(function(x){return x.id===card.dataset.sortId;});
        if(item.rime===b.dataset.sortAnswer){
          var firstSort=!state.sortDone[item.id];state.sortDone[item.id]=true;if(firstSort)state.stars++;
          card.classList.add('solved');$('.sort-word',card).classList.remove('hidden');b.classList.add('correct');save();speak(item.audio);
          var done=L.sortItems.filter(function(x){return state.sortDone[x.id];}).length;
          $('#sortStatus').textContent=done+' / '+L.sortItems.length+' tiếng đã làm đúng.';
          if(done===L.sortItems.length){award('sort',2);setTimeout(function(){showStep('reading');},900);}
        }else{b.classList.add('wrong');speak(L.audio.retry);setTimeout(function(){b.classList.remove('wrong');},550);}
      };});
    });

    $$('.self-read').forEach(function(b){b.onclick=function(){
      var line=b.closest('.reading-line'),i=line.dataset.line;
      if(!state.readingSelf[i]){state.readingSelf[i]=true;state.stars++;save();}
      b.textContent='Đã tự đọc ✓';line.classList.add('self-done');$('.story-listen',line).classList.remove('hidden');
      showStep('reading');
    };});

    $$('.comp-choice').forEach(function(b){b.onclick=function(){
      var box=b.closest('.comp-q'),i=Number(box.dataset.q),q=L.reading.questions[i],choice=decodeURIComponent(b.dataset.choice);
      if(choice===q.answer){
        var firstAnswer=!state.readingAnswers[i];state.readingAnswers[i]=choice;if(firstAnswer)state.stars+=2;save();b.classList.add('correct');speak(L.audio.correct);
        if(L.reading.questions.every(function(_,idx){return !!state.readingAnswers[idx];})){award('reading',3);toast('Con đã hiểu bài đọc!');}
        showStep('reading');
      }else{b.classList.add('wrong');speak(L.audio.retry);setTimeout(function(){b.classList.remove('wrong');},650);}
    };});

    if($('#writeCanvas'))setupCanvas();
    if($('#finalQuiz'))startFinal();
  }

  function setupCanvas(){
    var canvas=$('#writeCanvas'),ctx=canvas.getContext('2d'),drawing=false,last=null,strokes=0,target='em';
    function pos(e){var r=canvas.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return {x:(p.clientX-r.left)*(canvas.width/r.width),y:(p.clientY-r.top)*(canvas.height/r.height)};}
    function start(e){e.preventDefault();drawing=true;last=pos(e);strokes++;}
    function move(e){if(!drawing)return;e.preventDefault();var p=pos(e);ctx.strokeStyle='#274052';ctx.lineWidth=16;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;}
    function end(){drawing=false;last=null;}
    canvas.addEventListener('mousedown',start);canvas.addEventListener('mousemove',move);window.addEventListener('mouseup',end);
    canvas.addEventListener('touchstart',start,{passive:false});canvas.addEventListener('touchmove',move,{passive:false});canvas.addEventListener('touchend',end);
    function clear(){ctx.clearRect(0,0,canvas.width,canvas.height);strokes=0;}
    $$('.write-target').forEach(function(b){b.onclick=function(){target=decodeURIComponent(b.dataset.target);$('#writeWord').textContent=target;$('#traceWord').textContent=target;clear();};});
    $('#clearCanvas').onclick=clear;
    $('#finishWrite').onclick=function(){
      if(!strokes){toast('Con hãy viết thử trước nhé.');return;}
      if(!state.writeDone[target]){state.writeDone[target]=true;state.stars++;save();celebrate();}
      var done=L.writeTargets.filter(function(w){return state.writeDone[w];}).length;
      $('#writeStatus').textContent='Đã luyện '+done+'/'+L.writeTargets.length+' mẫu.';
      clear();
      if(done===L.writeTargets.length){award('write',2);toast('Xong phần viết!');setTimeout(function(){showStep('final');},800);}else{showStep('write');}
    };
  }

  function finalItems(){
    return [
      {prompt:'Con nghe thấy vần nào?',say:'em',choices:['em','ep'],answer:'em'},
      {prompt:'Con nghe thấy vần nào?',say:'ep',choices:['em','ep'],answer:'ep'},
      {prompt:'Từ nào có vần em?',say:'rèm, cá chép',choices:['rèm','cá chép'],answer:'rèm'},
      {prompt:'Từ nào có vần ep?',say:'tem thư, lễ phép',choices:['tem thư','lễ phép'],answer:'lễ phép'},
      {prompt:'Ai thắng trong cuộc thi vẽ?',choices:['Cá chép','Gà nhí'],answer:'Gà nhí'},
      {prompt:'Vì sao gà nhí thắng?',choices:['Vì tranh vừa đẹp vừa có ý nghĩa.','Vì gà nhí vẽ nhanh hơn.'],answer:'Vì tranh vừa đẹp vừa có ý nghĩa.'}
    ];
  }
  function startFinal(){finalSession={i:0,score:0,locked:false,items:finalItems()};renderFinal();}
  function renderFinal(){
    var box=$('#finalQuiz');if(!box)return;
    if(finalSession.i>=finalSession.items.length){finishFinal();return;}
    var q=finalSession.items[finalSession.i];
    box.innerHTML='<div class="q-badge">Câu '+(finalSession.i+1)+' / '+finalSession.items.length+'</div><h3>'+esc(q.prompt)+'</h3>'
      +(q.say?audioBtn(q.say,'Nghe đề'):'')
      +'<div class="choice-stack final-choices">'+q.choices.map(function(c){return '<button class="choice-card final-choice" data-choice="'+encodeURIComponent(c)+'">'+esc(c)+'</button>';}).join('')+'</div><div id="finalFeedback" class="feedback-line"></div>';
    bindAudio();
    $$('.final-choice').forEach(function(b){b.onclick=function(){
      if(finalSession.locked)return;finalSession.locked=true;
      var choice=decodeURIComponent(b.dataset.choice),ok=choice===q.answer;
      if(ok){finalSession.score++;b.classList.add('correct');$('#finalFeedback').textContent='✅ Đúng!';speak(L.audio.correct);}
      else{b.classList.add('wrong');$('#finalFeedback').innerHTML='Chưa đúng. Đáp án là <b>'+esc(q.answer)+'</b>.';speak(L.audio.retry);}
      $('#nextFinal').classList.remove('hidden');
    };});
    $('#nextFinal').onclick=function(){finalSession.i++;finalSession.locked=false;$('#nextFinal').classList.add('hidden');renderFinal();};
  }
  function finishFinal(){
    var total=finalSession.items.length,score=finalSession.score,pct=Math.round(score/total*100);
    state.bestFinal=Math.max(state.bestFinal,score);award('final',3);
    if(!state.lessonFinishedAt)state.lessonFinishedAt=Date.now();
    if(!state.reviews.length){var now=Date.now();state.reviews=L.reviewIntervalsHours.map(function(h,i){return {level:i+1,due:now+h*3600000,done:false};});}
    save();
    $('#finalQuiz').innerHTML='<div class="finish-card"><div class="finish-emoji">'+(pct>=80?'🏆':'🌟')+'</div><h2>Hoàn thành Bài 41!</h2><div class="score-ring">'+score+'/'+total+'</div><p>'+(pct>=80?'Con đã phân biệt em và ep khá chắc. Ngày mai chỉ cần ôn lại vài phút.':'Con đã đi hết bài. Hãy luyện nhanh thêm một lượt để hai vần chắc hơn.')+'</p><button id="goReview" class="primary">Xem lịch ôn →</button></div>';
    $('#nextFinal').classList.add('hidden');speak(L.audio.final);
    $('#goReview').onclick=function(){currentView='review';render();};
  }

  function renderPractice(){
    var pool=[
      {prompt:'Nghe rồi chọn vần',say:'kem',choices:['em','ep'],answer:'em'},
      {prompt:'Nghe rồi chọn vần',say:'dép',choices:['em','ep'],answer:'ep'},
      {prompt:'Tiếng nào có em?',say:'xem ti vi, ngõ hẹp',choices:['xem ti vi','ngõ hẹp'],answer:'xem ti vi'},
      {prompt:'Tiếng nào có ep?',say:'tem thư, cá chép',choices:['tem thư','cá chép'],answer:'cá chép'}
    ];
    var q=pool[Math.floor(Math.random()*pool.length)];
    app.innerHTML='<section class="page-title"><span class="eyebrow">LUYỆN NHANH BÀI 41</span><h1>2 phút phân biệt em · ep</h1><p>Mỗi câu bắt đầu bằng nghe. Không cần học lại toàn bài.</p></section><section class="card practice-deck"><div class="practice-q"><h2>'+esc(q.prompt)+'</h2>'+audioBtn(q.say,'Nghe đề')+'<div class="choice-row">'+q.choices.map(function(c){return '<button class="choice-card quick-choice" data-c="'+encodeURIComponent(c)+'">'+esc(c)+'</button>';}).join('')+'</div><div id="quickFeedback" class="feedback-line"></div></div></section>';
    bindAudio();
    $$('.quick-choice').forEach(function(b){b.onclick=function(){var c=decodeURIComponent(b.dataset.c);if(c===q.answer){b.classList.add('correct');state.stars++;save();$('#quickFeedback').innerHTML='✅ Đúng rồi! <button id="nextQuick" class="link-button">Câu khác →</button>';speak(L.audio.correct);$('#nextQuick').onclick=renderPractice;}else{b.classList.add('wrong');speak(L.audio.retry);};};});
  }

  function formatTime(ts){return new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(ts));}
  function renderReview(){
    var now=Date.now(),due=state.reviews.find(function(r){return !r.done&&r.due<=now;}),next=state.reviews.find(function(r){return !r.done;});
    app.innerHTML='<section class="page-title"><span class="eyebrow">ÔN CÁCH QUÃNG</span><h1>Ôn ít, nhưng phải tự nhớ</h1><p>Không xem lại bài trước khi làm câu hỏi ôn.</p></section>'
      +'<section class="card review-card"><div class="brain">🧠</div><h2>'+(due?'Đến lượt ôn Bài 41 rồi!':state.lessonFinishedAt?'Chưa đến lượt ôn tiếp':'Hoàn thành Bài 41 trước')+'</h2><p>'+(due?'Chỉ 3 câu.':next?'Lần ôn tiếp: <b>'+formatTime(next.due)+'</b>.':'Sau khi hoàn thành bài, lịch 1 ngày → 3 ngày → 7 ngày sẽ xuất hiện.')+'</p>'+(due?'<button id="doReview" class="primary big">Ôn 3 câu</button>':'')+'</section>'
      +'<section class="card review-timeline"><h2>Lịch ôn</h2>'+(state.reviews.length?state.reviews.map(function(r,i){return '<div class="review-row '+(r.done?'done':'')+'"><span>'+(r.done?'✓':i+1)+'</span><div><b>Ôn lần '+(i+1)+'</b><small>'+formatTime(r.due)+'</small></div><strong>'+(r.done?'Đã xong':'Chờ')+'</strong></div>';}).join(''):'<p class="muted">Chưa có lịch ôn.</p>')+'</section>';
    if($('#doReview'))$('#doReview').onclick=function(){runReview(due);};
  }
  function runReview(review){
    var items=finalItems().slice(0,4).sort(function(){return Math.random()-.5;}).slice(0,3),i=0,score=0;
    function show(){
      if(i>=items.length){review.done=true;save();app.innerHTML='<section class="card finish-card review-finish"><div class="finish-emoji">🌟</div><h2>Ôn xong!</h2><p>Con đúng <b>'+score+'/3</b>. Việc tự nhớ lại làm trí nhớ mạnh hơn.</p><button id="backReview" class="primary">Về lịch ôn</button></section>';$('#backReview').onclick=renderReview;return;}
      var q=items[i];
      app.innerHTML='<section class="page-title"><span class="eyebrow">ÔN BÀI 41 · CÂU '+(i+1)+'/3</span><h1>'+esc(q.prompt)+'</h1></section><section class="card practice-deck">'+(q.say?audioBtn(q.say,'Nghe'):'')+'<div class="choice-row">'+q.choices.map(function(c){return '<button class="choice-card review-choice" data-c="'+encodeURIComponent(c)+'">'+esc(c)+'</button>';}).join('')+'</div></section>';
      bindAudio();$$('.review-choice').forEach(function(b){b.onclick=function(){if(decodeURIComponent(b.dataset.c)===q.answer)score++;i++;setTimeout(show,350);};});
    }show();
  }

  function renderParent(){
    var skills=[
      ['Nghe và nhận vần em',state.completed.soundEm],
      ['Phân biệt ep với em',state.completed.soundEp],
      ['Tìm vần trong kem · dép',state.completed.model],
      ['Phân loại 6 tiếng',state.completed.sort],
      ['Đọc hiểu “Thi vẽ”',state.completed.reading],
      ['Tập viết 4 mẫu',state.completed.write],
      ['Kiểm tra cuối bài',state.completed.final]
    ];
    app.innerHTML='<section class="page-title"><span class="eyebrow">DÀNH CHO PHỤ HUYNH</span><h1>Tiến độ Bài 41</h1><p>Mục tiêu chính: con nghe được phần cuối của tiếng, tự phân biệt em/ep và hiểu nội dung bài đọc.</p></section><section class="parent-grid"><div class="card"><h2>Mức độ làm chủ</h2><div class="mastery-score">'+progress()+'<small>%</small></div><div class="skill-list">'+skills.map(function(s){return '<div><span>'+(s[1]?'✅':'○')+'</span><b>'+s[0]+'</b></div>';}).join('')+'</div></div><div class="card"><h2>Kèm con thế nào?</h2><ol class="parent-tips"><li>Đừng đọc đáp án ngay. Hỏi: “Con nghe cuối tiếng là m hay p?”</li><li>Phần đọc hiểu: để con tự kể lại bằng lời của mình.</li><li>Nếu con đọc sai, cho nghe một lần rồi yêu cầu tự sửa.</li><li>Mỗi buổi khoảng 10–15 phút, hôm sau ôn 2–3 phút.</li></ol><button id="resetProgress" class="danger">Xóa tiến độ Bài 41</button></div></section>';
    $('#resetProgress').onclick=function(){if(confirm('Xóa toàn bộ tiến độ Bài 41 trên thiết bị này?')){state=defaults();save();renderParent();}};
  }

  function render(){
    window.TV1Audio.stop();
    $$('.bottom-nav button').forEach(function(b){b.classList.toggle('active',b.dataset.view===currentView);});
    if(currentView==='learn')renderLearn();
    if(currentView==='practice')renderPractice();
    if(currentView==='write'){renderLearn();setTimeout(function(){showStep('write');},0);}
    if(currentView==='review')renderReview();
    if(currentView==='parent')renderParent();
    state.lastView=currentView;save();
    app.focus({preventScroll:true});window.scrollTo({top:0,behavior:'smooth'});
  }

  $$('.bottom-nav button').forEach(function(btn){btn.onclick=function(){currentView=btn.dataset.view;render();};});
  $('#homeBtn').onclick=function(){currentView='learn';render();};
  if('serviceWorker' in navigator)navigator.serviceWorker.register('../sw.js',{scope:'../'}).catch(function(){});
  currentView=state.lastView||'learn';
  updateProgress();render();
}());