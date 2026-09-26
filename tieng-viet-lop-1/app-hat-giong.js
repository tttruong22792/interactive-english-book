(function(){
  'use strict';
  var L=window.TV1_LESSON;
  var $=function(s,r){return (r||document).querySelector(s);};
  var $$=function(s,r){return Array.from((r||document).querySelectorAll(s));};
  var KEY='vuiHocTiengViet:hatGiongNho:v2';
  var app=$('#app');
  var view='learn';
  var state=load();
  var finalSession=null;

  function defaults(){
    return {
      stars:0,
      completed:{rimes:false,focus:false,sort:false,story:false,match:false,write:false,final:false},
      rimeMastery:{},
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
        rimeMastery:Object.assign({},raw.rimeMastery||{}),
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
    p.innerHTML=plantSvg(n);
  }
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);});}
  function toast(t){var el=$('#toast');el.textContent=t;el.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.add('hidden');},1500);}
  function celebrate(){var layer=$('#confetti');layer.innerHTML='';for(var i=0;i<14;i++){var s=document.createElement('span');s.textContent=['⭐','🌱','✨','🌿'][i%4];s.style.left=(5+Math.random()*90)+'%';s.style.animationDelay=(Math.random()*.2)+'s';layer.appendChild(s);}setTimeout(function(){layer.innerHTML='';},1300);}
  function award(k,n){if(!state.completed[k]){state.completed[k]=true;state.stars+=n||1;save();celebrate();}}

  function plantSvg(stage){
    var stem=stage>=2?'<path d="M60 86V48" stroke="#4c9b63" stroke-width="6" stroke-linecap="round"/>':'';
    var leaf1=stage>=3?'<ellipse cx="45" cy="58" rx="18" ry="10" transform="rotate(-28 45 58)" fill="#76bd72"/>':'';
    var leaf2=stage>=4?'<ellipse cx="76" cy="47" rx="19" ry="10" transform="rotate(28 76 47)" fill="#59a85d"/>':'';
    var top=stage>=5?'<ellipse cx="59" cy="35" rx="13" ry="18" fill="#8ccf7f"/>':'';
    var sprout=stage>=1?'<path d="M60 85c-3-16 6-29 18-35" stroke="#4c9b63" stroke-width="5" fill="none" stroke-linecap="round"/>':'';
    return '<svg viewBox="0 0 120 105" aria-hidden="true"><ellipse cx="60" cy="91" rx="42" ry="10" fill="#cfa277"/><path d="M21 90h78" stroke="#af7d54" stroke-width="4"/><ellipse cx="60" cy="82" rx="10" ry="6" fill="#8c5f3e"/>'+sprout+stem+leaf1+leaf2+top+'</svg>';
  }
  function sceneSvg(){
    return '<svg viewBox="0 0 460 220" role="img" aria-label="Bé chăm mầm cây trong vườn"><rect width="460" height="220" rx="24" fill="#dff1ff"/><path d="M0 139C80 115 150 135 225 123s150-6 235 12v85H0z" fill="#8cc77e"/><path d="M0 170c76-23 154-4 230-12 77-8 151 4 230 25v37H0z" fill="#c99c6b"/><g transform="translate(295 64)"><circle cx="32" cy="24" r="18" fill="#ffd2ab"/><path d="M15 21c3-22 35-25 39 0" fill="#243645"/><path d="M22 45h28l12 59H12z" fill="#f1ca3f"/><path d="M23 105l-3 44M49 105l9 44" stroke="#5a7da0" stroke-width="13" stroke-linecap="round"/><path d="M15 60L-4 91M54 59l25 16" stroke="#ffd2ab" stroke-width="9" stroke-linecap="round"/></g><g transform="translate(205 145)"><path d="M20 45V9" stroke="#4f9958" stroke-width="5"/><ellipse cx="7" cy="19" rx="15" ry="8" transform="rotate(-25 7 19)" fill="#72b86f"/><ellipse cx="33" cy="12" rx="15" ry="8" transform="rotate(25 33 12)" fill="#58a65f"/></g></svg>';
  }

  function stageRow(n,title,desc,key,step){
    var done=!!state.completed[key];
    return '<button class="stage-row stage-jump '+(done?'done':'')+'" data-step="'+step+'"><span class="stage-num">'+(done?'✓':n)+'</span><span><strong>'+esc(title)+'</strong><small>'+esc(desc)+'</small></span></button>';
  }

  function teacherBox(title,body){
    return '<div class="teacher-box"><span>👨‍👧</span><div><strong>'+esc(title)+'</strong><p>'+body+'</p></div></div>';
  }

  function renderLearn(){
    app.innerHTML='<section class="hero-card seed-hero"><div><span class="eyebrow">TIẾNG VIỆT LỚP 1</span><h1>Hạt giống nhỏ</h1><div class="rime-title"><span>uông</span><span>ương</span><span>ươc</span></div><p>'+esc(L.goal)+'</p><div class="hero-actions"><button id="startLesson" class="primary big">▶ Bắt đầu</button><a class="secondary lesson-link" href="./bai41.html">← Bài 41</a></div></div><div class="plant-card"><div id="plantStage"></div><b>Cây lớn lên theo tiến độ của con</b><small>Chỉ đánh dấu khi con tự làm được.</small></div></section>'
      +'<section class="teacher-plan card"><div><span class="eyebrow">GIÁO TRÌNH 15 PHÚT</span><h2>Ít nhưng chắc</h2><p>'+esc(L.teacherPlan.rule)+'</p></div><div class="plan-grid">'+L.teacherPlan.phases.map(function(p){return '<div><b>'+p.minutes+' phút</b><strong>'+esc(p.title)+'</strong><small>'+esc(p.note)+'</small></div>';}).join('')+'</div></section>'
      +'<section class="method-card"><div><span>🧠</span><strong>Học theo “vần → tiếng → câu → ý”</strong><p>Không bắt con nhớ cả từ ngay từ đầu.</p></div><div class="method-tags">'+L.principles.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div></section>'
      +'<section class="lesson-grid"><div class="stage-list card"><h2>Lộ trình</h2>'
      +stageRow(1,'Nhận 3 vần','Nhìn cấu tạo và phân biệt','rimes','rimes')
      +stageRow(2,'Đánh vần 4 từ','uống · giường · ước · thước','focus','focus')
      +stageRow(3,'Xếp từ vào đúng nhà','Nhìn từ rồi tìm vần','sort','sort')
      +stageRow(4,'Đọc “Hạt giống nhỏ”','Con đọc, bố/mẹ sửa','story','story')
      +stageRow(5,'Ghép đúng ý','Kiểm tra có hiểu bài','match','match')
      +stageRow(6,'Tập viết','4 từ trọng tâm','write','write')
      +stageRow(7,'Thử thách cuối','Nhớ lại không gợi ý','final','final')
      +'</div><div class="card lesson-panel" id="lessonPanel">'+stepIntro()+'</div></section>';
    updatePlant();
    $('#startLesson').onclick=function(){showStep('rimes');};
    $$('.stage-jump').forEach(function(b){b.onclick=function(){showStep(b.dataset.step);};});
  }

  function stepIntro(){
    return '<div class="step-head"><span class="step-chip">Khởi động</span><h2>Đừng bắt con đọc cả từ ngay</h2><p>Trước hết, con phải nhìn ra <b>vần</b>. Sau đó mới ghép âm đầu và thanh.</p></div>'
      +'<div class="three-houses"><div><strong>uông</strong><small>uô + ng</small></div><div><strong>ương</strong><small>ươ + ng</small></div><div><strong>ươc</strong><small>ươ + c</small></div></div>'
      +teacherBox('Cách bố/mẹ hỏi','Chỉ vào một vần bất kỳ và hỏi: “Đây là vần gì?”. Nếu con bí, chỉ vào phần <b>uô / ươ</b> trước, rồi hỏi tiếp âm cuối <b>ng / c</b>.');
  }

  function stepRimes(){
    return '<div class="step-head"><span class="step-chip">Bước 1 · Nhận mặt vần</span><h2>Ba vần dễ nhầm</h2><p>Mục tiêu không phải đọc thật nhanh. Mục tiêu là nhìn ra <b>điểm khác nhau</b>.</p></div>'
      +'<div class="rime-lab">'+L.rimes.map(function(r){return '<div class="rime-listen '+r.id+'"><strong>'+r.text+'</strong><small>'+esc(r.cue)+'</small><div class="rime-parts"><span>'+esc(r.body)+'</span><b>'+esc(r.ending)+'</b></div></div>';}).join('')+'</div>'
      +teacherBox('Bài kiểm tra 2 lần liên tiếp','Bố/mẹ chỉ ngẫu nhiên từng thẻ. Con phải đọc đúng vần và nói được “kết thúc bằng ng hay c”. Chỉ bấm Đạt khi con làm đúng <b>2 lần liên tiếp</b>.')
      +'<div class="mastery-row">'+L.rimes.map(function(r){return '<button class="mastery-btn '+(state.rimeMastery[r.text]?'done':'')+'" data-rime="'+r.text+'">'+(state.rimeMastery[r.text]?'✓ ':'')+'Đạt '+r.text+'</button>';}).join('')+'</div>'
      +'<div id="rimeStatus" class="feedback-line">'+Object.keys(state.rimeMastery).length+'/3 vần đạt.</div>';
  }

  function buildVisual(w){
    var parts=w.build;
    if(w.onset){
      return '<div class="lego-line"><span class="lego onset">'+esc(parts[0])+'</span><b>+</b><span class="lego rime">'+esc(parts[1])+'</span><b>→</b><span class="lego blend">'+esc(parts[2])+'</span><b>+</b><span class="lego tone">'+esc(parts[3])+'</span><b>→</b><span class="lego result">'+esc(parts[4])+'</span></div>';
    }
    return '<div class="lego-line"><span class="lego rime">'+esc(parts[0])+'</span><b>+</b><span class="lego tone">'+esc(parts[1])+'</span><b>→</b><span class="lego result">'+esc(parts[2])+'</span></div>';
  }
  function focusCard(w){
    return '<div class="focus-word-card" data-word="'+w.id+'"><div class="focus-top"><strong>'+esc(w.word)+'</strong><span class="meaning-chip">'+esc(w.meaning)+'</span></div><ol class="decode-steps"><li>Khoanh vần <b>'+esc(w.rime)+'</b></li><li>'+(w.onset?'Ghép âm đầu <b>'+esc(w.onset)+'</b> với vần':'Đọc vần <b>'+esc(w.rime)+'</b>')+'</li><li>Thêm thanh <b>'+esc(w.tone)+'</b></li></ol><div class="build-line hidden">'+buildVisual(w)+'</div><div class="focus-actions"><button class="secondary reveal-build">Con tự đánh vần xong → xem cách ghép</button><button class="primary focus-done hidden">Con tự đọc được ✓</button></div></div>';
  }
  function stepFocus(){
    return '<div class="step-head"><span class="step-chip">Bước 2 · Đánh vần có công thức</span><h2>4 từ trọng tâm</h2><p>Luôn làm theo một thứ tự: <b>vần → âm đầu → thanh → đọc trơn</b>.</p></div>'
      +teacherBox('Đừng đọc hộ ngay','Cho con tối đa 5 giây. Nếu bí, chỉ hỏi: “Con thấy vần gì?”. Khi con nói đúng vần, để con tự ghép tiếp.')
      +'<div class="focus-grid">'+L.focusWords.map(focusCard).join('')+'</div><div id="focusStatus" class="feedback-line">'+Object.keys(state.focusHits).length+'/4 từ đã tự đọc.</div>';
  }

  function stepSort(){
    return '<div class="step-head"><span class="step-chip">Bước 3 · Tìm họ hàng của từ</span><h2>Từ này thuộc nhà nào?</h2><p>Con nhìn cả từ, nhưng chỉ cần tìm phần vần.</p></div>'
      +'<div class="house-legend"><span>🏠 uông</span><span>🏠 ương</span><span>🏠 ươc</span></div>'
      +'<div class="sort-grid">'+L.sortWords.map(function(w,i){var done=!!state.sortHits[w.word];return '<div class="sort-card '+(done?'solved':'')+'" data-i="'+i+'"><strong class="sort-label">'+esc(w.word)+'</strong><div class="rime-toggle">'+['uông','ương','ươc'].map(function(r){return '<button data-r="'+r+'">'+r+'</button>';}).join('')+'</div></div>';}).join('')+'</div>'
      +'<div id="sortStatus" class="feedback-line">'+Object.keys(state.sortHits).length+'/'+L.sortWords.length+' tiếng đúng.</div>';
  }

  function highlightHard(text,hard){
    var html=esc(text);
    (hard||[]).forEach(function(w){html=html.replace(new RegExp(esc(w),'gi'),'<mark>'+esc(w)+'</mark>');});
    return html;
  }
  function stepStory(){
    var read=Object.keys(state.selfRead).length;
    return '<div class="step-head"><span class="step-chip">Bước 4 · Đọc theo cụm nghĩa</span><h2>'+esc(L.story.title)+'</h2><p>Không cho con kéo từng tiếng quá lâu. Mỗi câu đã được chia thành các <b>cụm ngắn</b>.</p></div>'
      +'<div class="story-scene">'+sceneSvg()+'</div>'
      +teacherBox('Cách sửa khi con vấp','Chỉ sửa đúng từ đang vấp. Cho con đánh vần từ đó, sau đó yêu cầu <b>đọc lại cả cụm</b> cho liền mạch.')
      +'<div class="reading-list">'+L.story.sentences.map(function(item,i){var done=!!state.selfRead[i];return '<div class="reading-line '+(done?'self-done':'')+'" data-line="'+i+'"><span class="line-no">'+(i+1)+'</span><div class="story-copy"><p>'+highlightHard(item.text,item.hard)+'</p><div class="chunk-row">'+item.chunks.map(function(c){return '<span>'+esc(c)+'</span>';}).join('')+'</div></div><div class="reading-actions"><button class="secondary self-read">'+(done?'Bố/mẹ đã kiểm tra ✓':'Đọc xong với bố/mẹ')+'</button></div></div>';}).join('')+'</div>'
      +'<div class="reading-meter"><b>Đã đọc '+read+'/'+L.story.sentences.length+' câu</b><div class="progress-track"><div style="width:'+(read/L.story.sentences.length*100)+'%"></div></div></div><div id="storyQuestions">'+storyQuestions()+'</div>';
  }
  function storyQuestions(){
    if(Object.keys(state.selfRead).length<L.story.sentences.length)return '<div class="locked-box">🔒 Đọc hết 5 câu rồi mới trả lời câu hỏi. Không cho con nhìn lại bài nếu chưa cần.</div>';
    return '<div class="comprehension"><h3>Con hiểu gì?</h3>'+L.story.questions.map(function(q,i){var ans=state.storyAnswers[i];return '<div class="comp-q" data-q="'+i+'"><b>'+(i+1)+'. '+esc(q.prompt)+'</b><div class="choice-stack">'+q.choices.map(function(c){return '<button class="comp-choice '+(ans===c?'correct':'')+'" data-c="'+encodeURIComponent(c)+'">'+esc(c)+'</button>';}).join('')+'</div></div>';}).join('')+'</div>';
  }

  function stepMatch(){
    return '<div class="step-head"><span class="step-chip">Bước 5 · Nhớ chi tiết</span><h2>Ghép đúng ý</h2><p>Con phải nhớ nội dung, không chỉ nhìn chữ quen.</p></div><div class="match-board"><div class="match-col">'+L.matching.map(function(x,i){return '<button class="match-left" data-i="'+i+'">'+esc(x.left)+'</button>';}).join('')+'</div><div class="match-col">'+L.matching.slice().reverse().map(function(x){return '<button class="match-right" data-v="'+encodeURIComponent(x.right)+'">'+esc(x.right)+'</button>';}).join('')+'</div></div><div id="matchFeedback" class="feedback-line">Ghép đủ 2 cặp.</div>';
  }

  function stepWrite(){
    var count=Object.keys(state.writeDone).length;
    return '<div class="step-head"><span class="step-chip">Bước 6 · Viết để khóa trí nhớ</span><h2>uống · giường · ước · thước</h2><p>Trước khi viết, bố/mẹ đọc từ. Con nói vần trước rồi mới viết.</p></div>'
      +teacherBox('Mỗi từ chỉ 2 lượt','Lượt 1 nhìn mẫu. Lượt 2 che mẫu và viết lại. Không cần chép cả dòng.')
      +'<div class="write-targets">'+L.writeTargets.map(function(w){return '<button class="write-target '+(state.writeDone[w]?'done':'')+'" data-w="'+encodeURIComponent(w)+'">'+esc(w)+(state.writeDone[w]?' ✓':'')+'</button>';}).join('')+'</div><div class="single-write"><div class="write-current"><span>Mẫu</span><strong id="writeWord">uống</strong></div><div class="canvas-wrap"><canvas id="writeCanvas" width="900" height="420"></canvas><div class="trace-word" id="traceWord">uống</div></div><div class="canvas-actions"><button id="clearCanvas" class="secondary">Xóa</button><button id="finishWrite" class="primary">Đã viết 2 lượt ✓</button></div></div><div id="writeStatus" class="feedback-line">Đã luyện '+count+'/4 từ.</div>';
  }

  function stepFinal(){
    return '<div class="step-head"><span class="step-chip">Bước 7 · Nhớ thật</span><h2>Kiểm tra cuối bài</h2><p>Không đọc mẫu trước. Không gợi ý ngay. Đây là phần kiểm tra con có tự làm được không.</p></div><div id="finalQuiz"></div><button id="nextFinal" class="primary hidden">Câu tiếp theo →</button>';
  }

  function showStep(step){
    var p=$('#lessonPanel');if(!p)return;
    var fn={rimes:stepRimes,focus:stepFocus,sort:stepSort,story:stepStory,match:stepMatch,write:stepWrite,final:stepFinal}[step]||stepIntro;
    p.innerHTML=fn();bindStep();p.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function bindStep(){
    $$('.mastery-btn').forEach(function(b){b.onclick=function(){
      var r=b.dataset.rime;
      if(!state.rimeMastery[r]){state.rimeMastery[r]=true;state.stars++;save();}
      b.classList.add('done');b.textContent='✓ Đạt '+r;
      $('#rimeStatus').textContent=Object.keys(state.rimeMastery).length+'/3 vần đạt.';
      if(Object.keys(state.rimeMastery).length===3){award('rimes',2);setTimeout(function(){showStep('focus');},500);}
    };});

    $$('.reveal-build').forEach(function(b){b.onclick=function(){
      var card=b.closest('.focus-word-card');$('.build-line',card).classList.remove('hidden');$('.focus-done',card).classList.remove('hidden');b.classList.add('hidden');
    };});
    $$('.focus-done').forEach(function(b){b.onclick=function(){
      var id=b.closest('.focus-word-card').dataset.word;
      if(!state.focusHits[id]){state.focusHits[id]=true;state.stars++;save();}
      b.textContent='Đã tự đọc ✓';b.disabled=true;
      $('#focusStatus').textContent=Object.keys(state.focusHits).length+'/4 từ đã tự đọc.';
      if(Object.keys(state.focusHits).length===4){award('focus',2);setTimeout(function(){showStep('sort');},500);}
    };});

    $$('.sort-card').forEach(function(card){$$('[data-r]',card).forEach(function(b){b.onclick=function(){
      var item=L.sortWords[Number(card.dataset.i)];
      if(b.dataset.r===item.rime){
        if(!state.sortHits[item.word]){state.sortHits[item.word]=true;state.stars++;save();}
        card.classList.add('solved');b.classList.add('correct');
        $('#sortStatus').textContent=Object.keys(state.sortHits).length+'/'+L.sortWords.length+' tiếng đúng.';
        if(Object.keys(state.sortHits).length===L.sortWords.length){award('sort',3);setTimeout(function(){showStep('story');},600);}
      }else{b.classList.add('wrong');setTimeout(function(){b.classList.remove('wrong');},500);}
    };});});

    $$('.self-read').forEach(function(b){b.onclick=function(){
      var i=b.closest('.reading-line').dataset.line;
      if(!state.selfRead[i]){state.selfRead[i]=true;state.stars++;save();}
      showStep('story');
    };});
    $$('.comp-choice').forEach(function(b){b.onclick=function(){
      var box=b.closest('.comp-q'),i=Number(box.dataset.q),q=L.story.questions[i],c=decodeURIComponent(b.dataset.c);
      if(c===q.answer){
        if(!state.storyAnswers[i]){state.storyAnswers[i]=c;state.stars+=2;save();}
        b.classList.add('correct');
        if(L.story.questions.every(function(_,idx){return !!state.storyAnswers[idx];})){award('story',3);toast('Con đã hiểu bài!');setTimeout(function(){showStep('match');},600);}
      }else{b.classList.add('wrong');setTimeout(function(){b.classList.remove('wrong');},500);}
    };});

    var selectedLeft=null;
    $$('.match-left').forEach(function(b){b.onclick=function(){$$('.match-left').forEach(function(x){x.classList.remove('selected');});selectedLeft=Number(b.dataset.i);b.classList.add('selected');};});
    $$('.match-right').forEach(function(b){b.onclick=function(){
      if(selectedLeft===null){toast('Chọn bên trái trước nhé.');return;}
      var wanted=L.matching[selectedLeft].right,val=decodeURIComponent(b.dataset.v);
      if(val===wanted){
        if(!state.matchHits[selectedLeft]){state.matchHits[selectedLeft]=true;state.stars++;save();}
        b.classList.add('correct');$$('.match-left')[selectedLeft].classList.add('correct');selectedLeft=null;
        $('#matchFeedback').textContent=Object.keys(state.matchHits).length+'/2 cặp đúng.';
        if(Object.keys(state.matchHits).length===2){award('match',2);setTimeout(function(){showStep('write');},500);}
      }else{b.classList.add('wrong');setTimeout(function(){b.classList.remove('wrong');},500);}
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
      if(n===4){award('write',2);setTimeout(function(){showStep('final');},500);}else{showStep('write');}
    };
  }

  function finalItems(){
    return [
      {prompt:'Từ “chuông” có vần nào?',choices:['uông','ương','ươc'],answer:'uông'},
      {prompt:'Từ “đường” có vần nào?',choices:['uông','ương','ươc'],answer:'ương'},
      {prompt:'Từ “nước” có vần nào?',choices:['uông','ương','ươc'],answer:'ươc'},
      {prompt:'Đánh vần “thước”: phần vần là gì?',choices:['uông','ương','ươc'],answer:'ươc'},
      {prompt:'Sau ít hôm, mầm non thế nào?',choices:['Đã vươn lên.','Vẫn nằm im.'],answer:'Đã vươn lên.'},
      {prompt:'Lá non làm gì?',choices:['Khẽ rung rung.','Rơi xuống đất.'],answer:'Khẽ rung rung.'}
    ];
  }
  function startFinal(){finalSession={i:0,score:0,locked:false,items:finalItems()};renderFinal();}
  function renderFinal(){
    var box=$('#finalQuiz');if(!box)return;
    if(finalSession.i>=finalSession.items.length){finishFinal();return;}
    var q=finalSession.items[finalSession.i];
    box.innerHTML='<div class="q-badge">Câu '+(finalSession.i+1)+' / '+finalSession.items.length+'</div><h3>'+esc(q.prompt)+'</h3><div class="choice-stack final-choices">'+q.choices.map(function(c){return '<button class="choice-card final-choice" data-c="'+encodeURIComponent(c)+'">'+esc(c)+'</button>';}).join('')+'</div><div id="finalFeedback" class="feedback-line"></div>';
    $$('.final-choice').forEach(function(b){b.onclick=function(){
      if(finalSession.locked)return;finalSession.locked=true;
      var c=decodeURIComponent(b.dataset.c);
      if(c===q.answer){finalSession.score++;b.classList.add('correct');$('#finalFeedback').textContent='✅ Đúng!';}
      else{b.classList.add('wrong');$('#finalFeedback').innerHTML='Chưa đúng. Đáp án là <b>'+esc(q.answer)+'</b>.';}
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
    $('#finalQuiz').innerHTML='<div class="finish-card"><div class="finish-emoji">🌱</div><h2>Hoàn thành bài!</h2><div class="score-ring">'+finalSession.score+'/'+total+'</div><p>Ngày mai ôn lại 2–3 phút. Không cần học lại cả bài.</p><button id="goReview" class="primary">Xem lịch ôn →</button></div>';
    $('#nextFinal').classList.add('hidden');$('#goReview').onclick=function(){view='review';render();};
  }

  function renderPractice(){
    var pool=L.sortWords.map(function(w){return {word:w.word,answer:w.rime};});
    var q=pool[Math.floor(Math.random()*pool.length)];
    app.innerHTML='<section class="page-title"><span class="eyebrow">LUYỆN NHANH</span><h1>Nhìn từ → tìm vần</h1><p>Không cần đánh vần cả từ nếu con đã nhìn ra vần.</p></section><section class="card practice-deck"><div class="practice-q"><div class="practice-word">'+esc(q.word)+'</div><div class="choice-row">'+['uông','ương','ươc'].map(function(c){return '<button class="choice-card quick" data-c="'+c+'">'+c+'</button>';}).join('')+'</div><div id="quickFb" class="feedback-line"></div></div></section>';
    $$('.quick').forEach(function(b){b.onclick=function(){if(b.dataset.c===q.answer){b.classList.add('correct');state.stars++;save();$('#quickFb').innerHTML='✅ Đúng! <button id="more" class="link-button">Câu khác →</button>';$('#more').onclick=renderPractice;}else{b.classList.add('wrong');setTimeout(function(){b.classList.remove('wrong');},400);};};});
  }

  function fmt(ts){return new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(ts));}
  function renderReview(){
    var now=Date.now(),due=state.reviews.find(function(r){return !r.done&&r.due<=now;}),next=state.reviews.find(function(r){return !r.done;});
    app.innerHTML='<section class="page-title"><span class="eyebrow">ÔN CÁCH QUÃNG</span><h1>Ôn ngắn, nhớ lâu</h1><p>Bố/mẹ hỏi, con tự trả lời. Không cần AI đọc mẫu.</p></section><section class="card review-card"><div class="brain">🧠</div><h2>'+(due?'Đến lượt ôn rồi!':state.lessonFinishedAt?'Chưa đến lượt ôn tiếp':'Hãy hoàn thành bài trước')+'</h2><p>'+(due?'Chỉ 3 câu, không xem lại bài.':next?'Lần ôn tiếp: <b>'+fmt(next.due)+'</b>.':'Lịch 1 ngày → 3 ngày → 7 ngày sẽ xuất hiện sau khi hoàn thành.')+'</p>'+(due?'<button id="doReview" class="primary">Ôn 3 câu</button>':'')+'</section>';
    if($('#doReview'))$('#doReview').onclick=function(){runReview(due);};
  }
  function runReview(review){
    var items=finalItems().slice().sort(function(){return Math.random()-.5;}).slice(0,3),i=0,score=0;
    function show(){
      if(i>=3){review.done=true;save();app.innerHTML='<section class="card finish-card review-finish"><div class="finish-emoji">🌟</div><h2>Ôn xong!</h2><p>Con đúng <b>'+score+'/3</b>.</p><button id="backReview" class="primary">Về lịch ôn</button></section>';$('#backReview').onclick=renderReview;return;}
      var q=items[i];app.innerHTML='<section class="page-title"><span class="eyebrow">ÔN · CÂU '+(i+1)+'/3</span><h1>'+esc(q.prompt)+'</h1></section><section class="card practice-deck"><div class="choice-row">'+q.choices.map(function(c){return '<button class="choice-card rv" data-c="'+encodeURIComponent(c)+'">'+esc(c)+'</button>';}).join('')+'</div></section>';$$('.rv').forEach(function(b){b.onclick=function(){if(decodeURIComponent(b.dataset.c)===q.answer)score++;i++;setTimeout(show,250);};});
    }show();
  }

  function renderParent(){
    var skills=[['Phân biệt 3 vần',state.completed.rimes],['Đánh vần 4 từ',state.completed.focus],['Tìm vần trong từ',state.completed.sort],['Đọc hiểu bài',state.completed.story],['Ghép đúng chi tiết',state.completed.match],['Tập viết',state.completed.write],['Kiểm tra cuối',state.completed.final]];
    app.innerHTML='<section class="page-title"><span class="eyebrow">DÀNH CHO PHỤ HUYNH</span><h1>Tiến độ “Hạt giống nhỏ”</h1><p>Chỉ đánh dấu hoàn thành khi con <b>tự làm được</b>. Đừng tính câu làm đúng sau khi vừa được đọc đáp án.</p></section><section class="parent-grid"><div class="card"><h2>Mức độ làm chủ</h2><div class="mastery-score">'+progress()+'<small>%</small></div><div class="skill-list">'+skills.map(function(s){return '<div><span>'+(s[1]?'✅':'○')+'</span><b>'+s[0]+'</b></div>';}).join('')+'</div></div><div class="card"><h2>Nguyên tắc kèm con</h2><ol class="parent-tips"><li>Cho con <b>5 giây tự nghĩ</b> trước khi gợi ý.</li><li>Nếu bí, gợi ý từ nhỏ nhất: vần → âm đầu → thanh.</li><li>Không bắt đọc lại một từ sai 10 lần. Sửa đúng rồi dùng lại từ đó sau vài phút.</li><li>Mỗi buổi khoảng 15 phút. Dừng khi con vẫn còn muốn học thêm.</li></ol><button id="resetProgress" class="danger">Xóa tiến độ bài này</button></div></section>';
    $('#resetProgress').onclick=function(){if(confirm('Xóa toàn bộ tiến độ bài này?')){state=defaults();save();renderParent();}};
  }

  function render(){
    $$('.bottom-nav button').forEach(function(b){b.classList.toggle('active',b.dataset.view===view);});
    if(view==='learn')renderLearn();
    if(view==='practice')renderPractice();
    if(view==='write'){renderLearn();setTimeout(function(){showStep('write');},0);}
    if(view==='review')renderReview();
    if(view==='parent')renderParent();
    state.lastView=view;save();app.focus({preventScroll:true});window.scrollTo({top:0,behavior:'smooth'});
  }

  $$('.bottom-nav button').forEach(function(b){b.onclick=function(){view=b.dataset.view;render();};});
  $('#homeBtn').onclick=function(){view='learn';render();};
  view=state.lastView||'learn';updateProgress();render();
}());