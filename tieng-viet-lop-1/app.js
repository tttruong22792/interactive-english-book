(function(){
  'use strict';
  var L=window.TV1_LESSON;
  var $=function(s,r){return (r||document).querySelector(s);};
  var $$=function(s,r){return Array.from((r||document).querySelectorAll(s));};
  var STORE_KEY='vuiHocTiengViet:v1';
  var app=$('#app');
  var currentView='learn';
  var state=loadState();
  var trace=null;

  function defaultState(){
    return {
      stars:0,
      completed:{intro:false,a:false,c:false,blend:false,huntA:false,huntC:false,final:false},
      attempts:{},
      bestFinal:0,
      lessonFinishedAt:null,
      reviews:[],
      lastView:'learn'
    };
  }

  function loadState(){
    try{return Object.assign(defaultState(),JSON.parse(localStorage.getItem(STORE_KEY)||'{}'));}
    catch(e){return defaultState();}
  }

  function save(){
    localStorage.setItem(STORE_KEY,JSON.stringify(state));
    updateProgress();
  }

  function completionCount(){return Object.values(state.completed||{}).filter(Boolean).length;}
  function progress(){return Math.round(completionCount()/7*100);}
  function updateProgress(){
    $('#progressText').textContent=progress()+'%';
    $('#progressBar').style.width=progress()+'%';
    $('#starCount').textContent='⭐ '+Number(state.stars||0);
  }

  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
  function icon(name){
    var art={
      chicken:'🐓', fish:'🐟', eggplant:'🍆', house:'🏠', rabbit:'🐇', leaf:'🍃',
      flag:'🚩', owl:'🦉', stork:'🕊️', goat:'🐐', duck:'🦆'
    };
    return '<span class="picture-art" aria-hidden="true">'+(art[name]||'⭐')+'</span>';
  }

  function toast(text){
    var t=$('#toast'); t.textContent=text; t.classList.remove('hidden');
    clearTimeout(toast.timer); toast.timer=setTimeout(function(){t.classList.add('hidden');},1800);
  }

  function celebrate(){
    var layer=$('#confetti'); layer.innerHTML='';
    var chars=['⭐','🌟','✨','🎉','💛'];
    for(var i=0;i<18;i++){
      var s=document.createElement('span');
      s.textContent=chars[i%chars.length];
      s.style.left=(5+Math.random()*90)+'%';
      s.style.animationDelay=(Math.random()*.25)+'s';
      s.style.transform='rotate('+(Math.random()*70-35)+'deg)';
      layer.appendChild(s);
    }
    setTimeout(function(){layer.innerHTML='';},1500);
  }

  function award(key,stars){
    if(!state.completed[key]){
      state.completed[key]=true;
      state.stars+=stars||1;
      save(); celebrate();
    }
  }

  function speak(text,button){
    if(button) button.classList.add('speaking');
    return window.TV1Audio.speak(text,{rate:.92}).finally(function(){if(button)button.classList.remove('speaking');});
  }

  function audioButton(text,label){
    return '<button class="listen-btn" data-say="'+encodeURIComponent(text)+'" aria-label="'+esc(label||'Nghe')+'"><span>🔊</span><b>'+esc(label||'Nghe')+'</b></button>';
  }

  function stageRow(num,title,desc,key){
    var done=!!state.completed[key];
    return '<div class="stage-row '+(done?'done':'')+'"><span class="stage-num">'+(done?'✓':num)+'</span><div><strong>'+esc(title)+'</strong><small>'+esc(desc)+'</small></div></div>';
  }

  function renderLearn(){
    app.innerHTML=''
      +'<section class="hero-card">'
      +'<div class="hero-copy"><span class="eyebrow">TIẾNG VIỆT LỚP 1</span><h1>Bài 1 <span>a</span> · <span>c</span></h1><p>'+esc(L.goal)+'</p>'
      +'<div class="hero-actions"><button class="primary big" id="startLesson">▶ Bắt đầu học</button>'+audioButton(L.audio.welcome,'Cô giáo nói')+'</div></div>'
      +'<div class="hero-mascot"><div class="mascot-bubble">Mỗi lần chỉ học<br><b>một điều nhỏ</b> nhé!</div><div class="mascot">🐿️</div></div>'
      +'</section>'
      +'<section class="method-card"><div><span>🧠</span><strong>Học để hiểu, không học vẹt</strong><p>Nghe → tự đoán → thao tác → nói lại → ôn cách quãng.</p></div><div class="method-tags">'+L.principles.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div></section>'
      +'<section class="lesson-grid">'
      +'<div class="stage-list card"><h2>Lộ trình Bài 1</h2>'
      +stageRow(1,'Nghe âm a','Nghe và bắt chước khẩu hình','a')
      +stageRow(2,'Làm quen chữ c','Nghe âm cờ, nhìn và phân biệt hình chữ','c')
      +stageRow(3,'Ghép tiếng ca','Tự ghép c + a rồi mới nghe đáp án','blend')
      +stageRow(4,'Săn âm a','Nghe tiếng và tự tìm tiếng có âm a','huntA')
      +stageRow(5,'Săn chữ c','Nhận ra tiếng có âm c','huntC')
      +stageRow(6,'Viết bằng tay','Luyện nét bằng ngón tay hoặc chuột','intro')
      +stageRow(7,'Thử thách cuối','Nhớ lại không nhìn gợi ý','final')
      +'</div>'
      +'<div class="card lesson-panel" id="lessonPanel">'+renderIntroStep()+'</div>'
      +'</section>';
    bindCommon();
    $('#startLesson').onclick=function(){award('intro',1); showStep('a'); speak(L.audio.welcome,this);};
    bindLessonPanel();
  }

  function renderIntroStep(){
    return '<div class="step-head"><span class="step-chip">Khởi động</span><h2>Con đã sẵn sàng chưa?</h2><p>Không cần học thuộc ngay. Con chỉ cần <b>nghe thật kỹ</b>, <b>tự trả lời</b> và <b>thử lại</b> khi sai.</p></div>'
      +'<div class="mini-rule"><span>1</span> Nghe <b>1 lần</b></div><div class="mini-rule"><span>2</span> Tự đoán trước khi xem đáp án</div><div class="mini-rule"><span>3</span> Nói thành tiếng sau mỗi câu đúng</div>';
  }

  function showStep(which){
    var p=$('#lessonPanel');
    if(!p)return;
    if(which==='a') p.innerHTML=stepA();
    if(which==='c') p.innerHTML=stepC();
    if(which==='blend') p.innerHTML=stepBlend();
    if(which==='huntA') p.innerHTML=stepHunt('a');
    if(which==='huntC') p.innerHTML=stepHunt('c');
    if(which==='final') p.innerHTML=stepFinal();
    bindLessonPanel();
    p.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function stepA(){
    return '<div class="step-head"><span class="step-chip">Bước 1 · Nghe trước</span><h2>Khám phá âm <em class="letter red">a</em></h2><p>Con chưa cần đọc chữ ngay. Hãy nghe âm, nhìn miệng và bắt chước.</p></div>'
      +'<div class="sound-focus"><div class="mouth-card"><div class="mouth">◯</div><small>Miệng mở tự nhiên</small></div><button class="giant-letter red" data-say="'+encodeURIComponent(L.audio.a)+'">a<span>🔊 Chạm để nghe</span></button></div>'
      +'<div class="recall-box"><strong>Đến lượt con</strong><p>Nghe xong, con đọc <b>a</b> thành tiếng 3 lần. Không cần nhanh.</p><button class="primary" id="doneA">Con đọc xong rồi ✓</button></div>';
  }

  function stepC(){
    return '<div class="step-head"><span class="step-chip">Bước 2 · Âm và chữ</span><h2>Khám phá chữ <em class="letter green">c</em></h2><p>Trong bài này, con nghe âm của chữ <b>c</b> là <b>cờ</b>.</p></div>'
      +'<div class="sound-focus"><div class="shape-hint"><svg viewBox="0 0 140 140" role="img" aria-label="Chữ c"><path d="M106 34 C86 15 46 18 29 48 C10 82 32 119 70 119 C87 119 99 113 110 102" fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg><small>Hở bên phải</small></div><button class="giant-letter green" data-say="'+encodeURIComponent(L.audio.cName)+'">c<span>🔊 Nghe “cờ”</span></button></div>'
      +'<div class="choice-row"><button class="choice-card" data-cquiz="a">a</button><button class="choice-card" data-cquiz="c">c</button></div><p class="quiz-prompt">Chữ nào con vừa học có âm <b>cờ</b>?</p>';
  }

  function stepBlend(){
    return '<div class="step-head"><span class="step-chip">Bước 3 · Tự ghép</span><h2>Ghép <span class="green">c</span> + <span class="red">a</span></h2><p>Con hãy chạm <b>c</b> trước, rồi chạm <b>a</b>. Đừng xem đáp án vội.</p></div>'
      +'<div class="blend-board"><button class="blend-piece green" data-blend="c">c<small>cờ</small></button><span class="plus">+</span><button class="blend-piece red" data-blend="a">a<small>a</small></button><span class="arrow">→</span><div id="blendResult" class="blend-result">?</div></div>'
      +'<div id="blendCoach" class="coach-line">Bước 1: chạm vào <b>c</b>.</div>'
      +'<button id="hearBlend" class="primary hidden">🔊 Nghe cách đánh vần: cờ – a – ca</button>';
  }

  function pictureCard(item,mode){
    return '<button class="picture-card" data-pick="'+esc(item.id)+'" data-has="'+(item.has?'1':'0')+'" data-word="'+encodeURIComponent(item.audio)+'">'
      +icon(item.art)+'<span class="picture-label hidden">'+esc(item.label)+'</span><small>Chạm để nghe</small><span class="pick-mark"></span></button>';
  }

  function stepHunt(mode){
    var isA=mode==='a',items=isA?L.soundAItems:L.soundCItems;
    return '<div class="step-head"><span class="step-chip">Bước '+(isA?'4':'5')+' · Tìm bằng tai</span><h2>'+(isA?'Tiếng nào có âm <em class="red">a</em>?':'Tiếng nào có âm <em class="green">c</em>?')+'</h2><p>Chạm từng hình để nghe tên. Sau đó chọn các hình đúng. Con phải <b>nghe</b>, không đoán bằng màu hay vị trí.</p></div>'
      +'<div class="picture-grid" data-hunt="'+mode+'">'+items.map(function(x){return pictureCard(x,mode);}).join('')+'</div>'
      +'<div class="hunt-actions"><button id="checkHunt" class="primary">Kiểm tra</button><button id="resetHunt" class="secondary">Làm lại</button></div>'
      +'<div id="huntFeedback" class="feedback-line"></div>';
  }

  function stepFinal(){
    return '<div class="step-head"><span class="step-chip">Bước 7 · Không nhìn gợi ý</span><h2>Thử thách cuối Bài 1</h2><p>Phần này dùng để kiểm tra trí nhớ thật. Nếu sai, con được thử lại.</p></div>'
      +'<div id="finalQuiz" class="final-quiz"></div><button id="nextFinal" class="primary hidden">Câu tiếp theo →</button>';
  }

  function bindCommon(){
    $$('[data-say]').forEach(function(btn){btn.onclick=function(){speak(decodeURIComponent(btn.dataset.say),btn);};});
  }

  function bindLessonPanel(){
    bindCommon();
    var doneA=$('#doneA'); if(doneA)doneA.onclick=function(){award('a',1); toast('Đã nhớ bước 1 ⭐'); showStep('c');};
    $$('[data-cquiz]').forEach(function(btn){btn.onclick=function(){
      if(btn.dataset.cquiz==='c'){
        btn.classList.add('correct'); award('c',1); speak(L.audio.correct); setTimeout(function(){showStep('blend');},700);
      }else{btn.classList.add('wrong'); speak(L.audio.retry); setTimeout(function(){btn.classList.remove('wrong');},700);}
    };});

    var seq=[];
    $$('[data-blend]').forEach(function(btn){btn.onclick=function(){
      var x=btn.dataset.blend;
      if((seq.length===0&&x!=='c')||(seq.length===1&&x!=='a')){toast('Hãy chạm c trước, rồi đến a nhé.'); return;}
      if(!seq.includes(x)){seq.push(x);btn.classList.add('selected');speak(x==='c'?L.audio.cName:L.audio.a);}
      var coach=$('#blendCoach');
      if(seq.length===1) coach.innerHTML='Đúng rồi. Bước 2: chạm vào <b>a</b>.';
      if(seq.length===2){
        $('#blendResult').textContent='ca'; $('#blendResult').classList.add('revealed');
        coach.innerHTML='Con vừa tự ghép được <b>ca</b>!'; $('#hearBlend').classList.remove('hidden'); award('blend',2);
      }
    };});
    var hear=$('#hearBlend'); if(hear)hear.onclick=function(){speak(L.audio.blend,this).then(function(){setTimeout(function(){showStep('huntA');},500);});};

    $$('.picture-card').forEach(function(card){card.onclick=function(){
      card.classList.toggle('picked');
      card.querySelector('.picture-label').classList.remove('hidden');
      speak(decodeURIComponent(card.dataset.word),card);
    };});
    var check=$('#checkHunt'); if(check)check.onclick=function(){checkHunt();};
    var reset=$('#resetHunt'); if(reset)reset.onclick=function(){
      $$('.picture-card').forEach(function(c){c.classList.remove('picked','correct','wrong');c.querySelector('.picture-label').classList.add('hidden');});
      $('#huntFeedback').textContent='';
    };

    if($('#finalQuiz')) startFinalQuiz();
  }

  function checkHunt(){
    var grid=$('[data-hunt]'); if(!grid)return;
    var mode=grid.dataset.hunt;
    var cards=$$('.picture-card',grid); var correct=true;
    cards.forEach(function(card){
      var chosen=card.classList.contains('picked'); var has=card.dataset.has==='1';
      card.classList.remove('correct','wrong');
      if(chosen===has){if(chosen)card.classList.add('correct');}
      else{correct=false;card.classList.add('wrong');}
      card.querySelector('.picture-label').classList.remove('hidden');
    });
    var f=$('#huntFeedback');
    if(correct){
      f.innerHTML='✅ <b>Chính xác!</b> Bây giờ con đọc lại tên các hình đúng một lần.';
      award(mode==='a'?'huntA':'huntC',2); speak(L.audio.correct);
      setTimeout(function(){ if(mode==='a')showStep('huntC'); else {currentView='write';render();} },1100);
    }else{
      f.innerHTML='💡 Có vài hình chưa đúng. Hãy <b>nghe lại từng tiếng</b> rồi thử lại.'; speak(L.audio.retry);
    }
  }

  function renderPractice(){
    app.innerHTML='<section class="page-title"><span class="eyebrow">LUYỆN NHANH</span><h1>Chơi mà vẫn phải nhớ</h1><p>Mỗi lượt chỉ 2–3 phút. Câu hỏi trộn âm a, chữ c và tiếng ca.</p></section>'
      +'<section class="practice-deck card"><div id="practiceQuestion"></div></section>';
    bindPracticeQuestion();
  }

  function bindPracticeQuestion(){
    var q=$('#practiceQuestion');
    var items=[
      {prompt:'Âm nào con nghe thấy?',say:'a',choices:['a','c'],answer:'a'},
      {prompt:'Chữ nào có âm “cờ”?',say:'cờ',choices:['a','c'],answer:'c'},
      {prompt:'c + a ghép lại thành tiếng nào?',choices:['ca','ac'],answer:'ca'},
      {prompt:'Tiếng nào có âm a?',say:'gà',choices:['gà','thỏ'],answer:'gà'}
    ];
    var item=items[Math.floor(Math.random()*items.length)];
    q.innerHTML='<div class="practice-q"><span class="q-badge">Câu luyện</span><h2>'+esc(item.prompt)+'</h2>'+(item.say?audioButton(item.say,'Nghe đề'):'')+'<div class="choice-row">'+item.choices.map(function(x){return '<button class="choice-card practice-choice" data-answer="'+esc(x)+'">'+esc(x)+'</button>';}).join('')+'</div><div id="practiceFeedback" class="feedback-line"></div></div>';
    bindCommon();
    $$('.practice-choice').forEach(function(btn){btn.onclick=function(){
      if(btn.dataset.answer===item.answer){btn.classList.add('correct');state.stars+=1;save();$('#practiceFeedback').innerHTML='✅ Đúng rồi! <button id="againPractice" class="link-button">Câu khác →</button>';speak(L.audio.correct);$('#againPractice').onclick=bindPracticeQuestion;}
      else{btn.classList.add('wrong');$('#practiceFeedback').textContent='Nghe lại rồi thử thêm lần nữa nhé.';speak(L.audio.retry);}
    };});
  }

  function renderWrite(){
    app.innerHTML='<section class="page-title"><span class="eyebrow">TẬP VIẾT</span><h1>Dùng tay để nhớ hình chữ</h1><p>Viết chậm, đúng hướng nét quan trọng hơn viết đẹp.</p></section>'
      +'<section class="write-grid">'
      +writeCard('a','a')+writeCard('c','c')
      +'</section><section class="card write-tip"><span>👆</span><div><strong>Mẹo cho bé lớp 1</strong><p>Mỗi chữ chỉ viết 3–5 lần đẹp và có chú ý. Không bắt viết cả trang khi tay đã mỏi.</p></div></section>';
    setupCanvases();
  }

  function writeCard(letter,id){
    return '<div class="card write-card"><div class="write-head"><div><span class="step-chip">Chữ '+letter+'</span><h2>Tô rồi tự viết</h2></div>'+audioButton(letter==='c'?L.audio.cName:L.audio.a,'Nghe')+'</div><div class="canvas-wrap"><canvas id="canvas-'+id+'" width="640" height="420" data-letter="'+id+'"></canvas><div class="trace-letter '+(letter==='a'?'red':'green')+'">'+letter+'</div></div><div class="canvas-actions"><button class="secondary clear-canvas" data-canvas="'+id+'">Xóa</button><button class="primary done-write" data-canvas="'+id+'">Con viết xong ✓</button></div></div>';
  }

  function setupCanvases(){
    bindCommon();
    $$('canvas[data-letter]').forEach(function(canvas){
      var ctx=canvas.getContext('2d'); var drawing=false,last=null,strokes=0;
      function pos(e){var r=canvas.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return {x:(p.clientX-r.left)*(canvas.width/r.width),y:(p.clientY-r.top)*(canvas.height/r.height)};}
      function start(e){e.preventDefault();drawing=true;last=pos(e);strokes++;}
      function move(e){if(!drawing)return;e.preventDefault();var p=pos(e);ctx.strokeStyle='#29445e';ctx.lineWidth=18;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;}
      function end(){drawing=false;last=null;}
      canvas.addEventListener('mousedown',start);canvas.addEventListener('mousemove',move);window.addEventListener('mouseup',end);
      canvas.addEventListener('touchstart',start,{passive:false});canvas.addEventListener('touchmove',move,{passive:false});canvas.addEventListener('touchend',end);
      canvas._clear=function(){ctx.clearRect(0,0,canvas.width,canvas.height);strokes=0;};
      canvas._done=function(){return strokes>0;};
    });
    $$('.clear-canvas').forEach(function(btn){btn.onclick=function(){var c=$('#canvas-'+btn.dataset.canvas);c._clear();};});
    $$('.done-write').forEach(function(btn){btn.onclick=function(){var c=$('#canvas-'+btn.dataset.canvas);if(!c._done()){toast('Con hãy viết thử trước nhé.');return;}btn.textContent='Đã luyện ✓';btn.disabled=true;state.stars+=1;save();celebrate();};});
  }

  var finalSession=null;
  function finalQuestions(){return [
    {type:'choice',prompt:'Con nghe thấy âm nào?',say:'a',choices:['a','c'],answer:'a'},
    {type:'choice',prompt:'Chữ nào đọc âm “cờ”?',say:'cờ',choices:['a','c'],answer:'c'},
    {type:'choice',prompt:'Ghép c + a được tiếng nào?',choices:['ca','ac'],answer:'ca'},
    {type:'choice',prompt:'Tiếng nào có âm a?',say:'thỏ, gà',choices:['thỏ','gà'],answer:'gà'},
    {type:'choice',prompt:'Tiếng nào có âm c?',say:'vịt, cá',choices:['vịt','cá'],answer:'cá'}
  ];}
  function startFinalQuiz(){finalSession={i:0,score:0,answered:false,items:finalQuestions()};renderFinalQuestion();}
  function renderFinalQuestion(){
    var box=$('#finalQuiz'); if(!box)return;
    if(finalSession.i>=finalSession.items.length){finishFinal();return;}
    var item=finalSession.items[finalSession.i];
    box.innerHTML='<div class="q-badge">Câu '+(finalSession.i+1)+' / '+finalSession.items.length+'</div><h3>'+esc(item.prompt)+'</h3>'+(item.say?audioButton(item.say,'Nghe'):'')+'<div class="choice-row">'+item.choices.map(function(x){return '<button class="choice-card final-choice" data-answer="'+esc(x)+'">'+esc(x)+'</button>';}).join('')+'</div><div id="finalFeedback" class="feedback-line"></div>';
    bindCommon();
    $$('.final-choice').forEach(function(btn){btn.onclick=function(){if(finalSession.answered)return;finalSession.answered=true;var ok=btn.dataset.answer===item.answer;if(ok){finalSession.score++;btn.classList.add('correct');$('#finalFeedback').textContent='Đúng!';speak(L.audio.correct);}else{btn.classList.add('wrong');$('#finalFeedback').innerHTML='Chưa đúng. Đáp án là <b>'+esc(item.answer)+'</b>.';speak(L.audio.retry);}$('#nextFinal').classList.remove('hidden');};});
    $('#nextFinal').onclick=function(){finalSession.i++;finalSession.answered=false;$('#nextFinal').classList.add('hidden');renderFinalQuestion();};
  }
  function finishFinal(){
    var score=finalSession.score,total=finalSession.items.length,pct=Math.round(score/total*100);
    state.bestFinal=Math.max(state.bestFinal||0,score); award('final',3);
    if(!state.lessonFinishedAt)state.lessonFinishedAt=Date.now();
    scheduleReviews(); save();
    $('#finalQuiz').innerHTML='<div class="finish-card"><div class="finish-emoji">🏆</div><h2>Con hoàn thành Bài 1!</h2><div class="score-ring">'+score+'/'+total+'</div><p>'+(pct>=80?'Con đã nhớ khá chắc. Ngày mai mình ôn lại 2 phút nhé.':'Con đã đi hết bài. Mình nên luyện lại vài câu ngay bây giờ để nhớ chắc hơn.')+'</p><button class="primary" id="goReview">Ôn nhanh ngay →</button></div>';
    $('#nextFinal').classList.add('hidden'); speak(L.audio.final);
    $('#goReview').onclick=function(){currentView='review';render();};
  }

  function scheduleReviews(){
    if(state.reviews&&state.reviews.length)return;
    var now=Date.now();
    state.reviews=L.reviewIntervalsHours.map(function(h,i){return {level:i+1,due:now+h*3600000,done:false};});
  }

  function renderReview(){
    var now=Date.now(); var due=(state.reviews||[]).find(function(r){return !r.done&&r.due<=now;});
    var next=(state.reviews||[]).find(function(r){return !r.done;});
    app.innerHTML='<section class="page-title"><span class="eyebrow">ÔN NHỚ CÁCH QUÃNG</span><h1>Ôn ít nhưng đúng lúc</h1><p>Não nhớ tốt hơn khi phải tự gọi lại kiến thức sau một khoảng nghỉ.</p></section>'
      +'<section class="review-card card"><div class="brain">🧠</div><h2>'+(due?'Đến lượt ôn rồi!':state.lessonFinishedAt?'Chưa đến giờ ôn tiếp':'Hãy hoàn thành bài học trước')+'</h2>'
      +'<p>'+(due?'Chỉ 3 câu, khoảng 2 phút. Không xem lại bài trước khi trả lời.':next?'Lần ôn tiếp theo: <b>'+formatTime(next.due)+'</b>.':'Sau khi hoàn thành Bài 1, lịch ôn 1 ngày → 3 ngày → 7 ngày sẽ xuất hiện ở đây.')+'</p>'
      +(due?'<button id="startReview" class="primary big">Bắt đầu ôn 2 phút</button>':'<button class="secondary" data-view-jump="practice">Luyện tự do</button>')+'</section>'
      +'<section class="review-timeline card"><h2>Lịch nhớ lâu</h2>'+reviewTimeline()+'</section>';
    var b=$('#startReview'); if(b)b.onclick=function(){runDueReview(due);};
    $$('[data-view-jump]').forEach(function(x){x.onclick=function(){currentView=x.dataset.viewJump;render();};});
  }

  function reviewTimeline(){
    if(!(state.reviews||[]).length)return '<p class="muted">Chưa có lịch ôn.</p>';
    return state.reviews.map(function(r,i){return '<div class="review-row '+(r.done?'done':'')+'"><span>'+(r.done?'✓':i+1)+'</span><div><strong>Ôn lần '+(i+1)+'</strong><small>'+formatTime(r.due)+'</small></div><b>'+(r.done?'Đã xong':'Chờ')+'</b></div>';}).join('');
  }

  function runDueReview(review){
    app.innerHTML='<section class="page-title"><span class="eyebrow">ÔN LẠI · KHÔNG GỢI Ý</span><h1>3 câu thôi</h1></section><section class="card practice-deck"><div id="dueReviewBox"></div></section>';
    var items=finalQuestions().slice(0,3),i=0,score=0;
    function show(){
      if(i>=items.length){review.done=true;save();$('#dueReviewBox').innerHTML='<div class="finish-card"><div class="finish-emoji">🌟</div><h2>Ôn xong!</h2><p>Con đúng <b>'+score+'/3</b>. Việc phải cố nhớ lại chính là lúc trí nhớ được làm mạnh hơn.</p><button id="backReview" class="primary">Xem lịch ôn</button></div>';$('#backReview').onclick=function(){renderReview();};return;}
      var item=items[i],box=$('#dueReviewBox');box.innerHTML='<div class="q-badge">Câu '+(i+1)+' / 3</div><h2>'+esc(item.prompt)+'</h2>'+(item.say?audioButton(item.say,'Nghe'):'')+'<div class="choice-row">'+item.choices.map(function(x){return '<button class="choice-card due-choice" data-answer="'+esc(x)+'">'+esc(x)+'</button>';}).join('')+'</div>';
      bindCommon();$$('.due-choice').forEach(function(btn){btn.onclick=function(){if(btn.dataset.answer===item.answer){score++;btn.classList.add('correct');}else btn.classList.add('wrong');setTimeout(function(){i++;show();},550);};});
    }show();
  }

  function formatTime(ts){
    if(!ts)return '—';
    return new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(ts));
  }

  function renderParent(){
    var skills=[
      ['Nhận âm a',state.completed.a],['Nhận chữ c',state.completed.c],['Ghép tiếng ca',state.completed.blend],['Tìm âm a trong tiếng',state.completed.huntA],['Tìm âm c trong tiếng',state.completed.huntC],['Kiểm tra cuối bài',state.completed.final]
    ];
    app.innerHTML='<section class="page-title"><span class="eyebrow">DÀNH CHO PHỤ HUYNH</span><h1>Tiến độ Bài 1</h1><p>Không chỉ nhìn số lần học. Mục tiêu là xem con có thể <b>tự nhớ lại</b> mà không cần gợi ý hay không.</p></section>'
      +'<section class="parent-grid"><div class="card"><h2>Mức độ làm chủ</h2><div class="mastery-score">'+progress()+'<small>%</small></div><div class="skill-list">'+skills.map(function(s){return '<div><span>'+(s[1]?'✅':'○')+'</span><b>'+s[0]+'</b></div>';}).join('')+'</div></div>'
      +'<div class="card"><h2>Cách kèm con</h2><ol class="parent-tips"><li>Cho con <b>tự trả lời trước</b>, đừng đọc đáp án hộ.</li><li>Khi sai, cho nghe lại rồi hỏi: “Con nghe thấy âm gì?”</li><li>Mỗi buổi 10–15 phút là đủ. Dừng khi con còn hứng thú.</li><li>Ngày hôm sau ôn 2 phút trước khi học bài mới.</li></ol><button id="resetProgress" class="danger">Xóa tiến độ Bài 1</button></div></section>';
    $('#resetProgress').onclick=function(){if(confirm('Xóa toàn bộ tiến độ Bài 1 trên thiết bị này?')){state=defaultState();save();renderParent();}};
  }

  function render(){
    window.TV1Audio.stop();
    $$('.bottom-nav button').forEach(function(b){b.classList.toggle('active',b.dataset.view===currentView);});
    if(currentView==='learn')renderLearn();
    if(currentView==='practice')renderPractice();
    if(currentView==='write')renderWrite();
    if(currentView==='review')renderReview();
    if(currentView==='parent')renderParent();
    state.lastView=currentView;save();
    app.focus({preventScroll:true});window.scrollTo({top:0,behavior:'smooth'});
  }

  $$('.bottom-nav button').forEach(function(btn){btn.onclick=function(){currentView=btn.dataset.view;render();};});
  $('#homeBtn').onclick=function(){currentView='learn';render();};

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('../sw.js',{scope:'../'}).catch(function(){});
  }

  currentView=state.lastView||'learn';
  updateProgress(); render();
}());
