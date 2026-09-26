(function(){
  'use strict';
  var L=window.TV1_LESSON;
  var $=function(s,r){return (r||document).querySelector(s);};
  var $$=function(s,r){return Array.from((r||document).querySelectorAll(s));};
  var KEY='vuiHocTiengViet:hatGiongNho:v1';
  var app=$('#app');
  var view='learn';
  var state=load();
  var finalSession=null;

  function defaults(){
    return {
      stars:0,
      completed:{rimes:false,focus:false,sort:false,story:false,match:false,write:false,final:false},
      rimeHits:{},
      focusHits:{},
      sortHits:{},
      selfRead:{},
      storyAnswers:{},
      matchHits:{},
      writeDone:{},
      lessonFinishedAt:null,
      reviews:[],
      lastView:'learn'
    };
  }
  function load(){
    try{
      var raw=JSON.parse(localStorage.getItem(KEY)||'{}'),d=defaults();
      return Object.assign(d,raw,{
        completed:Object.assign(d.completed,raw.completed||{}),
        rimeHits:Object.assign({},raw.rimeHits||{}),
        focusHits:Object.assign({},raw.focusHits||{}),
        sortHits:Object.assign({},raw.sortHits||{}),
        selfRead:Object.assign({},raw.selfRead||{}),
        storyAnswers:Object.assign({},raw.storyAnswers||{}),
        matchHits:Object.assign({},raw.matchHits||{}),
        writeDone:Object.assign({},raw.writeDone||{})
      });
    }catch(e){return defaults();}
  }
  function save(){localStorage.setItem(KEY,JSON.stringify(state));updateProgress();}
  function progress(){return Math.round(Object.values(state.completed).filter(Boolean).length/7*100);}
  function updateProgress(){
    if($('#progressText'))$('#progressText').textContent=progress()+'%';
    if($('#progressBar'))$('#progressBar').style.width=progress()+'%';
    if($('#starCount'))$('#starCount').textContent='⭐ '+state.stars;
    updatePlant();
  }
  function updatePlant(){
    var p=$('#plantStage');if(!p)return;
    var n=Math.min(5,Math.floor(progress()/20));
    p.dataset.stage=String(n);
    p.innerHTML=plantSvg(n);
  }
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);});}
  function toast(t){var el=$('#toast');el.textContent=t;el.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.add('hidden');},1600);}
  function celebrate(){var layer=$('#confetti');layer.innerHTML='';for(var i=0;i<16;i++){var s=document.createElement('span');s.textContent=['⭐','🌱','✨','🌿'][i%4];s.style.left=(5+Math.random()*90)+'%';s.style.animationDelay=(Math.random()*.25)+'s';layer.appendChild(s);}setTimeout(function(){layer.innerHTML='';},1400);}
  function award(k,n){if(!state.completed[k]){state.completed[k]=true;state.stars+=n||1;save();celebrate();}}
  function speak(t,b){if(b)b.classList.add('speaking');return window.TV1Audio.speak(t,{rate:.9}).finally(function(){if(b)b.classList.remove('speaking');});}
  function audioBtn(text,label){return '<button class="listen-btn" data-say="'+encodeURIComponent(text)+'"><span>🔊</span><b>'+esc(label||'Nghe')+'</b></button>';}
  function bindAudio(){$$('[data-say]').forEach(function(b){b.onclick=function(){speak(decodeURIComponent(b.dataset.say),b);};});}
  function plantSvg(stage){
    var stem=stage>=2?'<path d="M60 86V48" stroke="#4c9b63" stroke-width="6" stroke-linecap="round"/>':'';
    var leaf1=stage>=3?'<ellipse cx="45" cy="58" rx="18" ry="10" transform="rotate(-28 45 58)" fill="#76bd72"/>':'';
    var leaf2=stage>=4?'<ellipse cx="76" cy="47" rx="19" ry="10" transform="rotate(28 76 47)" fill="#59a85d"/>':'';
    var top=stage>=5?'<ellipse cx="59" cy="35" rx="13" ry="18" fill="#8ccf7f"/>':'';
    var sprout=stage>=1?'<path d="M60 85c-3-16 6-29 18-35" stroke="#4c9b63" stroke-width="5" fill="none" stroke-linecap="round"/>':'';
    return '<svg viewBox="0 0 120 105" aria-hidden="true"><ellipse cx="60" cy="91" rx="42" ry="10" fill="#cfa277"/><path d="M21 90h78" stroke="#af7d54" stroke-width="4"/><ellipse cx="60" cy="82" rx="10" ry="6" fill="#8c5f3e"/>'+sprout+stem+leaf1+leaf2+top+'</svg>';
  }
  function sceneSvg(){
    return '<svg viewBox="0 0 460 220" role="img" aria-label="Bé chăm mầm cây trong vườn"><rect width="460" height="220" rx="24" fill="#dff1ff"/><path d="M0 139C80 115 150 135 225 123s150-6 235 12v85H0z" fill="#8cc77e"/><path d="M0 170c76-23 154-4 230-12 77-8 151 4 230 25v37H0z" fill="#c99c6b"/><g transform="translate(295 64)"><circle cx="32" cy="24" r="18" fill="#ffd2ab"/><path d="M15 21c3-22 35-25 39 0" fill="#243645"/><path d="M22 45h28l12 59H12z" fill="#f1ca3f"/><path d="M23 105l-3 44M49 105l9 44" stroke="#5a7da0" stroke-width="13" stroke-linecap="round"/><path d="M15 60L-4 91M54 59l25 16" stroke="#ffd2ab" stroke-width="9" stroke-linecap="round"/><path d="M-4 91l32 7" stroke="#77a8c5" stroke-width="6"/><path d="M28 98c-10 3-18 7-26 13" stroke="#7ec0db" stroke-width="3"/></g><g transform="translate(205 145)"><path d="M20 45V9" stroke="#4f9958" stroke-width="5"/><ellipse cx="7" cy="19" rx="15" ry="8" transform="rotate(-25 7 19)" fill="#72b86f"/><ellipse cx="33" cy="12" rx="15" ry="8" transform="rotate(25 33 12)" fill="#58a65f"/></g><g fill="#4e8c4e"><circle cx="80" cy="70" r="42"/><circle cx="120" cy="74" r="48"/><circle cx="40" cy="100" r="47"/></g></svg>';
  }

  function stageRow(n,title,desc,key,step){
    var done=!!state.completed[key];
    return '<button class="stage-row stage-jump '+(done?'done':'')+'" data-step="'+step+'"><span class="stage-num">'+(done?'✓':n)+'</span><span><strong>'+esc(title)+'</strong><small>'+esc(desc)+'</small></span></button>';
  }

  function renderLearn(){
    app.innerHTML='<section class="hero-card seed-hero"><div><span class="eyebrow">TIẾNG VIỆT LỚP 1</span><h1>Hạt giống nhỏ</h1><div class="rime-title"><span>uông</span><span>ương</span><span>ươc</span></div><p>'+esc(L.goal)+'</p><div class="hero-actions"><button id="startLesson" class="primary big">▶ Bắt đầu</button>'+audioBtn(L.audio.welcome,'Cô giáo nói')+'<a class="secondary lesson-link" href="./bai41.html">← Bài 41</a></div></div><div class="plant-card"><div id="plantStage"></div><b>Cây lớn lên theo tiến độ của con</b><small>Mỗi phần hiểu chắc, cây sẽ lớn thêm.</small></div></section>'
      +'<section class="method-card"><div><span>🧠</span><strong>Học theo “vần → tiếng → câu → ý”</strong><p>Không bắt con nhớ cả từ ngay từ đầu.</p></div><div class="method-tags">'+L.principles.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div></section>'
      +'<section class="lesson-grid"><div class="stage-list card"><h2>Lộ trình</h2>'
      +stageRow(1,'Tai nghe 3 vần','uông · ương · ươc','rimes','rimes')
      +stageRow(2,'Đánh vần 4 từ','uống · giường · ước · thước','focus','focus')
      +stageRow(3,'Xếp từ vào đúng nhà','Nghe rồi chọn vần','sort','sort')
      +stageRow(4,'Đọc “Hạt giống nhỏ”','Tự đọc trước, nghe sau','story','story')
      +stageRow(5,'Ghép đúng ý','Mầm non / Lá non','match','match')
      +stageRow(6,'Tập viết','4 từ trọng tâm','write','write')
      +stageRow(7,'Thử thách cuối','Nhớ lại không gợi ý','final','final')
      +'</div><div class="card lesson-panel" id="lessonPanel">'+stepIntro()+'</div></section>';
    bindAudio();updatePlant();
    $('#startLesson').onclick=function(){showStep('rimes');speak(L.audio.welcome,this);};
    $$('.stage-jump').forEach(function(b){b.onclick=function(){showStep(b.dataset.step);};});
  }

  function stepIntro(){
    return '<div class="step-head"><span class="step-chip">Khởi động</span><h2>Đừng học cả từ ngay</h2><p>Con chỉ cần nhớ ba “ngôi nhà vần”. Sau đó mọi từ sẽ được ghép vào đúng nhà.</p></div><div class="three-houses">'
      +'<div><strong>uông</strong><small>u + ô + ng</small></div><div><strong>ương</strong><small>ư + ơ + ng</small></div><div><strong>ươc</strong><small>ư + ơ + c</small></div></div>'
      +'<div class="recall-box"><b>Mẹo rất ngắn</b><p><b>uông</b> có “uô”; <b>ương</b> có “ươ”; <b>ươc</b> cũng có “ươ” nhưng kết thúc bằng <b>c</b>.</p></div>';
  }

  function stepRimes(){
    return '<div class="step-head"><span class="step-chip">Bước 1 · Tai nghe trước</span><h2>Ba vần, ba cảm giác</h2><p>Chạm từng vần để nghe. Sau đó bấm “Che chữ” và chọn bằng tai.</p></div>'
      +'<div class="rime-lab">'+L.rimes.map(function(r){return '<button class="rime-listen '+r.id+'" data-say="'+encodeURIComponent(r.text)+'"><strong>'+r.text+'</strong><small>'+esc(r.cue)+'</small><span>🔊</span></button>';}).join('')+'</div>'
      +'<div class="memory-test"><button id="playMystery" class="primary">🔊 Nghe vần bí mật</button><div id="mysteryChoices" class="choice-row hidden">'+L.rimes.map(function(r){return '<button class="choice-card mystery-choice" data-rime="'+r.text+'">'+r.text+'</button>';}).join('')+'</div><div id="mysteryFeedback" class="feedback-line">Làm đúng 3 lượt để mở bước tiếp theo.</div></div>';
  }

  function focusCard(w){
    return '<div class="focus-word-card" data-word="'+w.id+'"><div class="focus-top"><strong>'+esc(w.word)+'</strong>'+audioBtn(w.word,'Nghe từ')+'</div><p>'+esc(w.meaning)+'</p><div class="build-line hidden">'+esc(w.build)+'</div><div class="focus-actions"><button class="secondary reveal-build">Con đã tự đánh vần → xem cách ghép</button><button class="primary focus-done hidden">Con đọc được ✓</button></div></div>';
  }
  function stepFocus(){
    return '<div class="step-head"><span class="step-chip">Bước 2 · Đánh vần theo cụm</span><h2>4 từ trọng tâm</h2><p>Cách dễ nhất: <b>nhận vần trước</b>, ghép phụ âm đầu, rồi mới thêm thanh.</p></div><div class="focus-grid">'+L.focusWords.map(focusCard).join('')+'</div><div id="focusStatus" class="feedback-line">'+Object.keys(state.focusHits).length+'/4 từ đã tự đọc.</div>';
  }

  function stepSort(){
    return '<div class="step-head"><span class="step-chip">Bước 3 · Không nhìn chữ trước</span><h2>Đưa tiếng về đúng “nhà vần”</h2><p>Bấm nghe tiếng. Chọn uông, ương hay ươc. Chữ chỉ hiện rõ sau khi trả lời đúng.</p></div><div class="sort-grid">'+L.sortWords.map(function(w,i){
      var done=!!state.sortHits[w.word];
      return '<div class="sort-card '+(done?'solved':'')+'" data-i="'+i+'"><button class="listen-round" data-say="'+encodeURIComponent(w.word)+'">🔊</button><strong class="sort-label '+(done?'':'masked')+'">'+esc(w.word)+'</strong><div class="rime-toggle">'+['uông','ương','ươc'].map(function(r){return '<button data-r="'+r+'">'+r+'</button>';}).join('')+'</div></div>';
    }).join('')+'</div><div id="sortStatus" class="feedback-line">'+Object.keys(state.sortHits).length+'/'+L.sortWords.length+' tiếng đúng.</div>';
  }

  function highlightStory(s){
    return esc(s).replace(/(uống|xuống|đường|sương)/gi,'<mark>$1</mark>');
  }
  function stepStory(){
    var read=Object.keys(state.selfRead).length;
    return '<div class="step-head"><span class="step-chip">Bước 4 · Đọc hiểu</span><h2>'+esc(L.story.title)+'</h2><p><b>Con tự đọc trước.</b> Khi bấm “Con đọc xong”, nút nghe cô mới xuất hiện.</p></div><div class="story-scene">'+sceneSvg()+'</div><div class="reading-list">'+L.story.sentences.map(function(s,i){
      var done=!!state.selfRead[i];
      return '<div class="reading-line '+(done?'self-done':'')+'" data-line="'+i+'"><span class="line-no">'+(i+1)+'</span><p>'+highlightStory(s)+'</p><div class="reading-actions"><button class="secondary self-read">'+(done?'Đã tự đọc ✓':'Con đọc xong')+'</button><button class="listen-btn story-listen '+(done?'':'hidden')+'" data-say="'+encodeURIComponent(s)+'">🔊 <b>Nghe cô</b></button></div></div>';
    }).join('')+'</div><div class="reading-meter"><b>Đã tự đọc '+read+'/'+L.story.sentences.length+' câu</b><div class="progress-track"><div style="width:'+(read/L.story.sentences.length*100)+'%"></div></div></div><div id="storyQuestions">'+storyQuestions()+'</div>';
  }
  function storyQuestions(){
    if(Object.keys(state.selfRead).length<L.story.sentences.length)return '<div class="locked-box">🔒 Đọc hết 5 câu trước để mở câu hỏi.</div>';
    return '<div class="comprehension"><h3>Không nhìn lại bài – con nhớ gì?</h3>'+L.story.questions.map(function(q,i){
      var ans=state.storyAnswers[i];
      return '<div class="comp-q" data-q="'+i+'"><b>'+(i+1)+'. '+esc(q.prompt)+'</b><div class="choice-stack">'+q.choices.map(function(c){return '<button class="comp-choice '+(ans===c?'correct':'')+'" data-c="'+encodeURIComponent(c)+'">'+esc(c)+'</button>';}).join('')+'</div></div>';
    }).join('')+'</div>';
  }

  function stepMatch(){
    return '<div class="step-head"><span class="step-chip">Bước 5 · Ghép đúng ý</span><h2>Con nhớ chi tiết nào?</h2><p>Chọn một cụm bên trái rồi chọn phần đúng bên phải.</p></div><div class="match-board"><div class="match-col">'+L.matching.map(function(x,i){return '<button class="match-left" data-i="'+i+'">'+esc(x.left)+'</button>';}).join('')+'</div><div class="match-col">'+L.matching.slice().reverse().map(function(x){return '<button class="match-right" data-v="'+encodeURIComponent(x.right)+'">'+esc(x.right)+'</button>';}).join('')+'</div></div><div id="matchFeedback" class="feedback-line">Ghép đủ 2 cặp.</div>';
  }

  function stepWrite(){
    var count=Object.keys(state.writeDone).length;
    return '<div class="step-head"><span class="step-chip">Bước 6 · Viết để củng cố</span><h2>uống · giường · ước · thước</h2><p>Mỗi từ chỉ cần viết vài lần có chú ý. Chọn mẫu rồi viết lên ô.</p></div><div class="write-targets">'+L.writeTargets.map(function(w){return '<button class="write-target '+(state.writeDone[w]?'done':'')+'" data-w="'+encodeURIComponent(w)+'">'+esc(w)+(state.writeDone[w]?' ✓':'')+'</button>';}).join('')+'</div><div class="single-write"><div class="write-current"><span>Mẫu</span><strong id="writeWord">uống</strong></div><div class="canvas-wrap"><canvas id="writeCanvas" width="900" height="420"></canvas><div class="trace-word" id="traceWord">uống</div></div><div class="canvas-actions"><button id="clearCanvas" class="secondary">Xóa</button><button id="finishWrite" class="primary">Con viết xong ✓</button></div></div><div id="writeStatus" class="feedback-line">Đã luyện '+count+'/4 từ.</div>';
  }

  function stepFinal(){
    return '<div class="step-head"><span class="step-chip">Bước 7 · Không gợi ý</span><h2>Thử thách cuối</h2><p>Nghe – đánh vần – hiểu bài. Sai thì biết mình cần ôn phần nào.</p></div><div id="finalQuiz"></div><button id="nextFinal" class="primary hidden">Câu tiếp theo →</button>';
  }

  function showStep(step){
    var p=$('#lessonPanel');if(!p)return;
    var fn={rimes:stepRimes,focus:stepFocus,sort:stepSort,story:stepStory,match:stepMatch,write:stepWrite,final:stepFinal}[step]||stepIntro;
    p.innerHTML=fn();bindStep();p.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function bindStep(){
    bindAudio();

    var mysteryTarget='';
    if($('#playMystery'))$('#playMystery').onclick=function(){
      var remaining=L.rimes.filter(function(r){return !state.rimeHits[r.text];});
      var pick=(remaining.length?remaining:L.rimes)[Math.floor(Math.random()*(remaining.length||L.rimes.length))];
      mysteryTarget=pick.text;$('#mysteryChoices').classList.remove('hidden');speak(pick.text,this);
    };
    $$('.mystery-choice').forEach(function(b){b.onclick=function(){
      if(!mysteryTarget){toast('Bấm nghe vần bí mật trước nhé.');return;}
      if(b.dataset.rime===mysteryTarget){
        b.classList.add('correct');
        if(!state.rimeHits[mysteryTarget]){state.rimeHits[mysteryTarget]=true;state.stars++;save();}
        $('#mysteryFeedback').textContent='Đúng! '+Object.keys(state.rimeHits).length+'/3 vần.';
        if(Object.keys(state.rimeHits).length===3){award('rimes',2);setTimeout(function(){showStep('focus');},700);}
      }else{b.classList.add('wrong');speak(L.audio.retry);setTimeout(function(){b.classList.remove('wrong');},600);}
    };});

    $$('.reveal-build').forEach(function(b){b.onclick=function(){
      var card=b.closest('.focus-word-card');$('.build-line',card).classList.remove('hidden');$('.focus-done',card).classList.remove('hidden');b.classList.add('hidden');
    };});
    $$('.focus-done').forEach(function(b){b.onclick=function(){
      var id=b.closest('.focus-word-card').dataset.word;
      if(!state.focusHits[id]){state.focusHits[id]=true;state.stars++;save();}
      b.textContent='Đã đọc ✓';b.disabled=true;
      $('#focusStatus').textContent=Object.keys(state.focusHits).length+'/4 từ đã tự đọc.';
      if(Object.keys(state.focusHits).length===4){award('focus',2);setTimeout(function(){showStep('sort');},700);}
    };});

    $$('.sort-card').forEach(function(card){
      $$('[data-r]',card).forEach(function(b){b.onclick=function(){
        var item=L.sortWords[Number(card.dataset.i)];
        if(b.dataset.r===item.rime){
          if(!state.sortHits[item.word]){state.sortHits[item.word]=true;state.stars++;save();}
          card.classList.add('solved');$('.sort-label',card).classList.remove('masked');b.classList.add('correct');speak(item.word);
          $('#sortStatus').textContent=Object.keys(state.sortHits).length+'/'+L.sortWords.length+' tiếng đúng.';
          if(Object.keys(state.sortHits).length===L.sortWords.length){award('sort',3);setTimeout(function(){showStep('story');},800);}
        }else{b.classList.add('wrong');speak(L.audio.retry);setTimeout(function(){b.classList.remove('wrong');},500);}
      };});
    });

    $$('.self-read').forEach(function(b){b.onclick=function(){
      var line=b.closest('.reading-line'),i=line.dataset.line;
      if(!state.selfRead[i]){state.selfRead[i]=true;state.stars++;save();}
      showStep('story');
    };});
    $$('.comp-choice').forEach(function(b){b.onclick=function(){
      var box=b.closest('.comp-q'),i=Number(box.dataset.q),q=L.story.questions[i],c=decodeURIComponent(b.dataset.c);
      if(c===q.answer){
        if(!state.storyAnswers[i]){state.storyAnswers[i]=c;state.stars+=2;save();}
        b.classList.add('correct');speak(L.audio.correct);
        if(L.story.questions.every(function(_,idx){return !!state.storyAnswers[idx];})){award('story',3);toast('Con đã hiểu câu chuyện!');setTimeout(function(){showStep('match');},800);}
      }else{b.classList.add('wrong');speak(L.audio.retry);setTimeout(function(){b.classList.remove('wrong');},550);}
    };});

    var selectedLeft=null;
    $$('.match-left').forEach(function(b){b.onclick=function(){$$('.match-left').forEach(function(x){x.classList.remove('selected');});selectedLeft=Number(b.dataset.i);b.classList.add('selected');};});
    $$('.match-right').forEach(function(b){b.onclick=function(){
      if(selectedLeft===null){toast('Chọn bên trái trước nhé.');return;}
      var wanted=L.matching[selectedLeft].right,val=decodeURIComponent(b.dataset.v);
      if(val===wanted){
        state.matchHits[selectedLeft]=true;state.stars++;save();b.classList.add('correct');$$('.match-left')[selectedLeft].classList.add('correct');speak(val);selectedLeft=null;
        $('#matchFeedback').textContent=Object.keys(state.matchHits).length+'/2 cặp đúng.';
        if(Object.keys(state.matchHits).length===2){award('match',2);setTimeout(function(){showStep('write');},700);}
      }else{b.classList.add('wrong');speak(L.audio.retry);setTimeout(function(){b.classList.remove('wrong');},500);}
    };});

    if($('#writeCanvas'))setupCanvas();
    if($('#finalQuiz'))startFinal();
  }

  function setupCanvas(){
    var canvas=$('#writeCanvas'),ctx=canvas.getContext('2d'),drawing=false,last=null,strokes=0,target='uống';
    function pos(e){var r=canvas.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return {x:(p.clientX-r.left)*(canvas.width/r.width),y:(p.clientY-r.top)*(canvas.height/r.height)};}
    function start(e){e.preventDefault();drawing=true;last=pos(e);strokes++;}
    function move(e){if(!drawing)return;e.preventDefault();var p=pos(e);ctx.strokeStyle='#29445e';ctx.lineWidth=16;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;}
    function end(){drawing=false;last=null;}
    canvas.addEventListener('mousedown',start);canvas.addEventListener('mousemove',move);window.addEventListener('mouseup',end);
    canvas.addEventListener('touchstart',start,{passive:false});canvas.addEventListener('touchmove',move,{passive:false});canvas.addEventListener('touchend',end);
    function clear(){ctx.clearRect(0,0,canvas.width,canvas.height);strokes=0;}
    $$('.write-target').forEach(function(b){b.onclick=function(){target=decodeURIComponent(b.dataset.w);$('#writeWord').textContent=target;$('#traceWord').textContent=target;clear();};});
    $('#clearCanvas').onclick=clear;
    $('#finishWrite').onclick=function(){
      if(!strokes){toast('Con hãy viết thử trước nhé.');return;}
      if(!state.writeDone[target]){state.writeDone[target]=true;state.stars++;save();celebrate();}
      var n=Object.keys(state.writeDone).length;$('#writeStatus').textContent='Đã luyện '+n+'/4 từ.';clear();
      if(n===4){award('write',2);setTimeout(function(){showStep('final');},700);}else{showStep('write');}
    };
  }

  function finalItems(){
    return [
      {prompt:'Nghe rồi chọn vần',say:'uông',choices:['uông','ương','ươc'],answer:'uông'},
      {prompt:'Nghe rồi chọn vần',say:'ương',choices:['uông','ương','ươc'],answer:'ương'},
      {prompt:'Nghe rồi chọn vần',say:'ươc',choices:['uông','ương','ươc'],answer:'ươc'},
      {prompt:'“giường” có vần nào?',say:'giường',choices:['uông','ương','ươc'],answer:'ương'},
      {prompt:'“thước” có vần nào?',say:'thước',choices:['uông','ương','ươc'],answer:'ươc'},
      {prompt:'Sau ít hôm, mầm non thế nào?',choices:['Đã vươn lên.','Vẫn nằm im.'],answer:'Đã vươn lên.'},
      {prompt:'Lá non làm gì?',choices:['Khẽ rung rung.','Rơi xuống đất.'],answer:'Khẽ rung rung.'}
    ];
  }
  function startFinal(){finalSession={i:0,score:0,locked:false,items:finalItems()};renderFinal();}
  function renderFinal(){
    var box=$('#finalQuiz');if(!box)return;
    if(finalSession.i>=finalSession.items.length){finishFinal();return;}
    var q=finalSession.items[finalSession.i];
    box.innerHTML='<div class="q-badge">Câu '+(finalSession.i+1)+' / '+finalSession.items.length+'</div><h3>'+esc(q.prompt)+'</h3>'+(q.say?audioBtn(q.say,'Nghe đề'):'')+'<div class="choice-stack final-choices">'+q.choices.map(function(c){return '<button class="choice-card final-choice" data-c="'+encodeURIComponent(c)+'">'+esc(c)+'</button>';}).join('')+'</div><div id="finalFeedback" class="feedback-line"></div>';
    bindAudio();
    $$('.final-choice').forEach(function(b){b.onclick=function(){
      if(finalSession.locked)return;finalSession.locked=true;
      var c=decodeURIComponent(b.dataset.c),ok=c===q.answer;
      if(ok){finalSession.score++;b.classList.add('correct');$('#finalFeedback').textContent='✅ Đúng!';speak(L.audio.correct);}else{b.classList.add('wrong');$('#finalFeedback').innerHTML='Chưa đúng. Đáp án là <b>'+esc(q.answer)+'</b>.';speak(L.audio.retry);}
      $('#nextFinal').classList.remove('hidden');
    };});
    $('#nextFinal').onclick=function(){finalSession.i++;finalSession.locked=false;$('#nextFinal').classList.add('hidden');renderFinal();};
  }
  function finishFinal(){
    award('final',3);
    if(!state.lessonFinishedAt)state.lessonFinishedAt=Date.now();
    if(!state.reviews.length){var now=Date.now();state.reviews=L.reviewIntervalsHours.map(function(h,i){return {level:i+1,due:now+h*3600000,done:false};});}
    save();
    var total=finalSession.items.length;
    $('#finalQuiz').innerHTML='<div class="finish-card"><div class="finish-emoji">🌱</div><h2>Con đã làm cây lớn lên!</h2><div class="score-ring">'+finalSession.score+'/'+total+'</div><p>Ngày mai ôn lại vài phút để ba vần chuyển sang trí nhớ lâu dài.</p><button id="goReview" class="primary">Xem lịch ôn →</button></div>';
    $('#nextFinal').classList.add('hidden');speak(L.audio.final);$('#goReview').onclick=function(){view='review';render();};
  }

  function renderPractice(){
    var pool=L.sortWords.map(function(w){return {prompt:'Nghe tiếng rồi chọn nhà vần',say:w.word,choices:['uông','ương','ươc'],answer:w.rime};});
    var q=pool[Math.floor(Math.random()*pool.length)];
    app.innerHTML='<section class="page-title"><span class="eyebrow">LUYỆN NHANH</span><h1>1 phút – 1 tiếng</h1><p>Không nhìn chữ trước.</p></section><section class="card practice-deck"><div class="practice-q"><h2>'+esc(q.prompt)+'</h2>'+audioBtn(q.say,'Nghe')+'<div class="choice-row">'+q.choices.map(function(c){return '<button class="choice-card quick" data-c="'+c+'">'+c+'</button>';}).join('')+'</div><div id="quickFb" class="feedback-line"></div></div></section>';
    bindAudio();$$('.quick').forEach(function(b){b.onclick=function(){if(b.dataset.c===q.answer){b.classList.add('correct');state.stars++;save();$('#quickFb').innerHTML='✅ Đúng! <button id="more" class="link-button">Câu khác →</button>';speak(L.audio.correct);$('#more').onclick=renderPractice;}else{b.classList.add('wrong');speak(L.audio.retry);};};});
  }

  function fmt(ts){return new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(ts));}
  function renderReview(){
    var now=Date.now(),due=state.reviews.find(function(r){return !r.done&&r.due<=now;}),next=state.reviews.find(function(r){return !r.done;});
    app.innerHTML='<section class="page-title"><span class="eyebrow">ÔN CÁCH QUÃNG</span><h1>Ôn ít nhưng đúng lúc</h1></section><section class="card review-card"><div class="brain">🧠</div><h2>'+(due?'Đến lượt ôn rồi!':state.lessonFinishedAt?'Chưa đến lượt ôn tiếp':'Hãy hoàn thành bài trước')+'</h2><p>'+(due?'Chỉ 3 câu, không xem lại bài.':next?'Lần ôn tiếp: <b>'+fmt(next.due)+'</b>.':'Lịch 1 ngày → 3 ngày → 7 ngày sẽ xuất hiện sau khi hoàn thành.')+'</p>'+(due?'<button id="doReview" class="primary">Ôn 3 câu</button>':'')+'</section><section class="card review-timeline"><h2>Lịch ôn</h2>'+(state.reviews.length?state.reviews.map(function(r,i){return '<div class="review-row '+(r.done?'done':'')+'"><span>'+(r.done?'✓':i+1)+'</span><div><b>Ôn lần '+(i+1)+'</b><small>'+fmt(r.due)+'</small></div><strong>'+(r.done?'Đã xong':'Chờ')+'</strong></div>';}).join(''):'<p class="muted">Chưa có lịch ôn.</p>')+'</section>';
    if($('#doReview'))$('#doReview').onclick=function(){runReview(due);};
  }
  function runReview(review){
    var items=finalItems().slice().sort(function(){return Math.random()-.5;}).slice(0,3),i=0,score=0;
    function show(){
      if(i>=3){review.done=true;save();app.innerHTML='<section class="card finish-card review-finish"><div class="finish-emoji">🌟</div><h2>Ôn xong!</h2><p>Con đúng <b>'+score+'/3</b>.</p><button id="backReview" class="primary">Về lịch ôn</button></section>';$('#backReview').onclick=renderReview;return;}
      var q=items[i];app.innerHTML='<section class="page-title"><span class="eyebrow">ÔN · CÂU '+(i+1)+'/3</span><h1>'+esc(q.prompt)+'</h1></section><section class="card practice-deck">'+(q.say?audioBtn(q.say,'Nghe'):'')+'<div class="choice-row">'+q.choices.map(function(c){return '<button class="choice-card rv" data-c="'+encodeURIComponent(c)+'">'+esc(c)+'</button>';}).join('')+'</div></section>';bindAudio();$$('.rv').forEach(function(b){b.onclick=function(){if(decodeURIComponent(b.dataset.c)===q.answer)score++;i++;setTimeout(show,300);};});
    }show();
  }

  function renderParent(){
    var skills=[['Phân biệt 3 vần',state.completed.rimes],['Đánh vần 4 từ',state.completed.focus],['Phân loại theo vần',state.completed.sort],['Đọc hiểu bài',state.completed.story],['Ghép đúng chi tiết',state.completed.match],['Tập viết',state.completed.write],['Kiểm tra cuối',state.completed.final]];
    app.innerHTML='<section class="page-title"><span class="eyebrow">DÀNH CHO PHỤ HUYNH</span><h1>Tiến độ “Hạt giống nhỏ”</h1><p>Mục tiêu là con tự nhận vần, tự đánh vần và kể lại ý bài – không chỉ đọc theo.</p></section><section class="parent-grid"><div class="card"><h2>Mức độ làm chủ</h2><div class="mastery-score">'+progress()+'<small>%</small></div><div class="skill-list">'+skills.map(function(s){return '<div><span>'+(s[1]?'✅':'○')+'</span><b>'+s[0]+'</b></div>';}).join('')+'</div></div><div class="card"><h2>Cách kèm con hiệu quả</h2><ol class="parent-tips"><li>Che từ rồi hỏi: “Con nhớ vần nào?”</li><li>Với từ khó, tách thành <b>phụ âm đầu + vần + thanh</b>, không bắt đọc cả từ ngay.</li><li>Đọc mỗi câu theo cụm nghĩa, sau đó hỏi con kể lại bằng lời của mình.</li><li>Dừng sau 10–15 phút nếu con bắt đầu mệt.</li></ol><button id="resetProgress" class="danger">Xóa tiến độ bài này</button></div></section>';
    $('#resetProgress').onclick=function(){if(confirm('Xóa toàn bộ tiến độ bài này?')){state=defaults();save();renderParent();}};
  }

  function render(){
    window.TV1Audio.stop();$$('.bottom-nav button').forEach(function(b){b.classList.toggle('active',b.dataset.view===view);});
    if(view==='learn')renderLearn();
    if(view==='practice')renderPractice();
    if(view==='write'){renderLearn();setTimeout(function(){showStep('write');},0);}
    if(view==='review')renderReview();
    if(view==='parent')renderParent();
    state.lastView=view;save();app.focus({preventScroll:true});window.scrollTo({top:0,behavior:'smooth'});
  }

  $$('.bottom-nav button').forEach(function(b){b.onclick=function(){view=b.dataset.view;render();};});
  $('#homeBtn').onclick=function(){view='learn';render();};
  if('serviceWorker' in navigator)navigator.serviceWorker.register('../sw.js',{scope:'../'}).catch(function(){});
  view=state.lastView||'learn';updateProgress();render();
}());