(function(){
  'use strict';

  var L=window.TV1_LESSON;
  var $=function(s,r){return (r||document).querySelector(s);};
  var $$=function(s,r){return Array.from((r||document).querySelectorAll(s));};
  var KEY='vuiHocTiengViet:hatGiongNho:v3';
  var app=$('#app');

  var steps=[
    {id:'warmup',icon:'🌱',title:'Khởi động'},
    {id:'map',icon:'🗺️',title:'Bản đồ độ khó'},
    {id:'unlock',icon:'🔐',title:'Phá khóa tiếng khó'},
    {id:'rimes',icon:'🧩',title:'Củng cố vần'},
    {id:'game',icon:'🎯',title:'Luyện nhanh'},
    {id:'sentences',icon:'⭐',title:'Đọc từng câu'},
    {id:'full',icon:'📖',title:'Đọc toàn bài'},
    {id:'comprehension',icon:'💡',title:'Đọc hiểu'},
    {id:'final',icon:'🏆',title:'Thử thách cuối'},
    {id:'review',icon:'🧠',title:'Ôn cách quãng'}
  ];

  var state=load();

  function defaults(){
    return {
      step:'warmup',
      completed:{},
      wordStatus:{},
      hintLevel:{},
      rimeDone:{},
      gameAnswered:{},
      sentenceStatus:{},
      fullPass1:false,
      fullPass2:false,
      comprehension:{},
      matching:{},
      finalStatus:{},
      selfWins:0
    };
  }

  function load(){
    try{
      var raw=JSON.parse(localStorage.getItem(KEY)||'{}');
      var d=defaults();
      return Object.assign(d,raw,{
        completed:Object.assign({},d.completed,raw.completed||{}),
        wordStatus:Object.assign({},d.wordStatus,raw.wordStatus||{}),
        hintLevel:Object.assign({},d.hintLevel,raw.hintLevel||{}),
        rimeDone:Object.assign({},d.rimeDone,raw.rimeDone||{}),
        gameAnswered:Object.assign({},d.gameAnswered,raw.gameAnswered||{}),
        sentenceStatus:Object.assign({},d.sentenceStatus,raw.sentenceStatus||{}),
        comprehension:Object.assign({},d.comprehension,raw.comprehension||{}),
        matching:Object.assign({},d.matching,raw.matching||{}),
        finalStatus:Object.assign({},d.finalStatus,raw.finalStatus||{})
      });
    }catch(e){return defaults();}
  }

  function save(){
    localStorage.setItem(KEY,JSON.stringify(state));
    updateHeader();
  }

  function esc(s){
    return String(s).replace(/[&<>"']/g,function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);
    });
  }

  function progress(){
    var n=Object.keys(state.completed).filter(function(k){return state.completed[k];}).length;
    return Math.round(n/steps.length*100);
  }

  function updateHeader(){
    if($('#progressText'))$('#progressText').textContent=progress()+'%';
    if($('#progressBar'))$('#progressBar').style.width=progress()+'%';
    if($('#selfWinCount'))$('#selfWinCount').textContent='🌟 '+Number(state.selfWins||0);
  }

  function toast(text){
    var el=$('#toast');
    if(!el)return;
    el.textContent=text;
    el.classList.remove('hidden');
    clearTimeout(toast.timer);
    toast.timer=setTimeout(function(){el.classList.add('hidden');},1600);
  }

  function confetti(){
    var layer=$('#confetti'); if(!layer)return;
    layer.innerHTML='';
    var chars=['🌟','✨','🌱','💚'];
    for(var i=0;i<16;i++){
      var span=document.createElement('span');
      span.textContent=chars[i%chars.length];
      span.style.left=(4+Math.random()*92)+'%';
      span.style.animationDelay=(Math.random()*.22)+'s';
      layer.appendChild(span);
    }
    setTimeout(function(){layer.innerHTML='';},1400);
  }

  function finishStep(id){
    if(!state.completed[id]){
      state.completed[id]=true;
      confetti();
    }
    save();
  }

  function go(id){
    state.step=id;
    save();
    render();
  }

  function nextStep(){
    var index=steps.findIndex(function(s){return s.id===state.step;});
    if(index>=0 && index<steps.length-1)go(steps[index+1].id);
  }

  function nav(){
    return '<aside class="lesson-rail card"><div class="rail-head"><span class="eyebrow">LỘ TRÌNH '+esc(L.duration)+'</span><h2>'+esc(L.title)+'</h2><p>Không chạy đua tốc độ. Mỗi bước chỉ cần con tự tìm ra.</p></div><div class="rail-steps">'
      +steps.map(function(s,i){
        var active=s.id===state.step,done=!!state.completed[s.id];
        return '<button class="rail-step '+(active?'active ':'')+(done?'done':'')+'" data-go="'+s.id+'"><span class="rail-icon">'+(done?'✓':s.icon)+'</span><span><b>'+(i+1)+'. '+esc(s.title)+'</b><small>'+(done?'Đã xong':'Chạm để mở')+'</small></span></button>';
      }).join('')
      +'</div><div class="rail-rule"><b>Phản xạ cần tạo</b><span>Không biết → tách → ghép → tự đọc</span></div></aside>';
  }

  function goalStrip(){
    return '<section class="goal-strip card"><div><span class="eyebrow">MỤC TIÊU CUỐI BUỔI</span><h1>'+esc(L.title)+'</h1></div><div class="goal-pills">'
      +L.goal.map(function(x){return '<span>✓ '+esc(x)+'</span>';}).join('')
      +'</div></section>';
  }

  function shell(content){
    app.innerHTML=goalStrip()+'<section class="lesson-layout">'+nav()+'<div class="mission card">'+content+'</div></section>';
    $$('[data-go]').forEach(function(b){b.onclick=function(){go(b.dataset.go);};});
    updateHeader();
  }

  function actionBar(primaryText,canNext){
    return '<div class="mission-actions"><button class="secondary" id="backHome">↺ Xem lại đầu bài</button>'
      +(canNext?'<button class="primary" id="nextMission">'+esc(primaryText||'Nhiệm vụ tiếp theo →')+'</button>':'')
      +'</div>';
  }

  function bindActionBar(){
    var b=$('#backHome'); if(b)b.onclick=function(){go('warmup');};
    var n=$('#nextMission'); if(n)n.onclick=function(){finishStep(state.step);nextStep();};
  }

  function sceneSvg(){
    return '<svg viewBox="0 0 520 250" role="img" aria-label="Bạn nhỏ chăm mầm cây trong vườn"><rect width="520" height="250" rx="28" fill="#e9f7ff"/><path d="M0 155C110 115 210 150 315 133s145-4 205 13v104H0z" fill="#88c77c"/><path d="M0 194c105-28 206-5 315-16 80-8 148 7 205 30v42H0z" fill="#c99b68"/><g transform="translate(330 56)"><circle cx="36" cy="26" r="20" fill="#ffd5b1"/><path d="M18 22c4-24 37-27 43 0" fill="#293b48"/><path d="M23 48h29l14 64H10z" fill="#f4cc42"/><path d="M23 112l-4 54M52 112l10 54" stroke="#6082a1" stroke-width="14" stroke-linecap="round"/><path d="M14 62l-31 36M57 62l25 13" stroke="#ffd5b1" stroke-width="9" stroke-linecap="round"/></g><g transform="translate(230 159)"><path d="M22 49V11" stroke="#4c9857" stroke-width="6"/><ellipse cx="7" cy="23" rx="16" ry="9" transform="rotate(-25 7 23)" fill="#76ba70"/><ellipse cx="37" cy="15" rx="17" ry="9" transform="rotate(25 37 15)" fill="#58a55e"/></g><g fill="#4d904c"><circle cx="70" cy="93" r="51"/><circle cx="125" cy="88" r="45"/><circle cx="170" cy="105" r="48"/></g></svg>';
  }

  function renderWarmup(){
    shell('<div class="mission-head"><span class="mission-kicker">⑤ KHỞI ĐỘNG · 2 PHÚT</span><h2>Nhìn tranh trước, chưa đọc bài</h2><p>Mục tiêu là làm con tò mò về câu chuyện trước khi nhìn vào đoạn chữ.</p></div>'
      +'<div class="warmup-grid"><div class="warmup-scene"><img src="./assets/hat-giong-nho.jpg?v=20260926" alt="Bạn nhỏ tưới mầm cây trong khu vườn xanh"></div><div class="warmup-questions">'
      +L.warmup.prompts.map(function(q,i){return '<div><span>'+(i+1)+'</span><b>'+esc(q)+'</b></div>';}).join('')
      +'</div></div>'
      +'<div class="parent-coach"><b>👨‍👩‍👧 Bố/mẹ làm gì?</b><p>Chỉ hỏi, không sửa câu trả lời. Sau 2–3 câu, nói: <b>“Mình đọc xem chuyện thật sự xảy ra thế nào nhé.”</b></p></div>'
      +actionBar('Xem bản đồ độ khó →',true));
    bindActionBar();
  }

  function chips(words,cls){
    return '<div class="word-chips">'+words.map(function(w){return '<span class="'+cls+'">'+esc(w)+'</span>';}).join('')+'</div>';
  }

  function renderMap(){
    shell('<div class="mission-head"><span class="mission-kicker">② BẢN ĐỒ ĐỘ KHÓ · DÀNH CHO BỐ/MẸ</span><h2>Không luyện tất cả như nhau</h2><p>Chỉ tập trung vào những chỗ có khả năng làm con dừng lại hoặc đoán.</p></div>'
      +'<div class="difficulty-map"><section><h3>🟢 Dễ</h3>'+chips(L.difficulty.easy,'easy')+'<small>Cho con tự đọc, không luyện trước.</small></section>'
      +'<section><h3>🟡 Cần chú ý</h3>'+chips(L.difficulty.attention,'attention')+'<small>Nếu con vấp thì mới xử lý.</small></section>'
      +'<section class="key-zone"><h3>🔴 Tiếng khóa</h3>'+chips(L.difficulty.key,'key')+'<small>Phá khóa trước khi đọc đoạn.</small></section></div>'
      +'<div class="gap-card"><b>Lỗ hổng chính cần nhắm tới</b><div class="gap-flow"><span>ương / ường</span><span>ươn / ườn</span><span>uông / uống</span><span>ươc / ược</span></div><p>Không học thuộc từng từ riêng lẻ. Con cần nhận ra <b>cấu trúc vần</b> để gặp từ mới vẫn tự đọc được.</p></div>'
      +actionBar('Phá khóa 8 tiếng khó →',true));
    bindActionBar();
  }

  function statusText(s){
    return s==='self'?'✅ Tự đọc':s==='help'?'⚠️ Cần gợi ý':s==='wrong'?'❌ Đọc sai':s==='slow'?'🐢 Đọc chậm':'Chưa thử';
  }

  function keyCard(item,index){
    var level=Number(state.hintLevel[item.word]||0);
    var status=state.wordStatus[item.word]||'';
    var hints=item.hints.slice(0,level);
    return '<article class="key-card '+(status?'has-status':'')+'" data-word="'+esc(item.word)+'">'
      +'<div class="key-card-top"><span class="key-no">'+(index+1)+'</span><div><strong>'+esc(item.word)+'</strong><small>'+esc(item.family)+'</small></div><span class="status-pill '+status+'">'+esc(statusText(status))+'</span></div>'
      +'<div class="hint-stack">'+(hints.length?hints.map(function(h,i){return '<div><span>B'+(i+1)+'</span>'+esc(h)+'</div>';}).join(''):'<p>Cho con 5 giây tự đọc trước. Chưa bấm gợi ý.</p>')+'</div>'
      +'<div class="hint-actions"><button class="secondary next-hint" '+(level>=item.hints.length?'disabled':'')+'>'+(level>=item.hints.length?'Đã mở hết gợi ý':'Mở gợi ý tiếp theo')+'</button></div>'
      +'<div class="status-actions"><button data-status="self">✅ Tự đọc được</button><button data-status="help">⚠️ Cần trợ giúp</button><button data-status="wrong">❌ Đọc sai</button><button data-status="slow">🐢 Rất chậm</button></div>'
      +(status?'<div class="return-to-text"><b>Đưa trở lại ngữ cảnh:</b><span>'+esc(item.phrase)+'</span><span>'+esc(item.sentence)+'</span><small>Kiểm tra khái quát: '+item.transfer.map(esc).join(' · ')+'</small></div>':'')
      +'</article>';
  }

  function renderUnlock(){
    var tried=L.keyWords.filter(function(w){return !!state.wordStatus[w.word];}).length;
    shell('<div class="mission-head"><span class="mission-kicker">③ PHÁ KHÓA · 6–8 PHÚT</span><h2>8 tiếng khóa – gợi ý tăng dần</h2><p><b>Dừng trợ giúp ngay</b> khi con tự tìm ra đáp án ở bất kỳ bước nào.</p></div>'
      +'<div class="unlock-rule"><span>1</span>Tự đọc <b>→</b><span>2</span>Tìm vần <b>→</b><span>3</span>Tách <b>→</b><span>4</span>Ghép <b>→</b><span>5</span>Đưa lại vào câu</div>'
      +'<div class="key-grid">'+L.keyWords.map(keyCard).join('')+'</div>'
      +'<div class="mission-summary"><b>Đã thử '+tried+'/'+L.keyWords.length+' tiếng.</b><span>Không cần tất cả đều hoàn hảo mới sang bước tiếp theo. Hãy ghi lại những tiếng còn vấp.</span></div>'
      +actionBar('Luyện đúng vần đang yếu →',tried>=5));
    $$('.key-card').forEach(function(card){
      var word=card.dataset.word;
      var item=L.keyWords.find(function(x){return x.word===word;});
      $('.next-hint',card).onclick=function(){
        state.hintLevel[word]=Math.min(item.hints.length,Number(state.hintLevel[word]||0)+1);
        save();renderUnlock();
      };
      $$('[data-status]',card).forEach(function(b){
        b.onclick=function(){
          var old=state.wordStatus[word];
          state.wordStatus[word]=b.dataset.status;
          if(b.dataset.status==='self' && old!=='self')state.selfWins++;
          save();renderUnlock();
        };
      });
    });
    bindActionBar();
  }

  function renderRimes(){
    shell('<div class="mission-head"><span class="mission-kicker">④ VẦN CẦN CỦNG CỐ · 2–3 PHÚT</span><h2>Sửa lỗ hổng rồi quay lại bài ngay</h2><p>Mỗi “nhà vần” chỉ đọc một lượt. Không biến thành tiết học vần dài.</p></div>'
      +'<div class="rime-drill-grid">'+L.rimeDrills.map(function(g,i){
        var done=!!state.rimeDone[i];
        return '<section class="rime-family '+(done?'done':'')+'" data-rime-index="'+i+'"><div class="rime-family-top"><span>🧩</span><div><b>'+esc(g.title)+'</b><small>Vần gốc: '+esc(g.pattern)+'</small></div></div><div class="rime-word-row">'+g.words.map(function(w){return '<span>'+esc(w)+'</span>';}).join('')+'</div><p>Cho con đọc từ trái sang phải. Nếu sai, quay về vần gốc rồi ghép lại.</p><button class="secondary mark-rime">'+(done?'✓ Đã luyện':'Đã luyện xong')+'</button></section>';
      }).join('')+'</div>'
      +'<div class="contrast-note"><b>Điểm dễ nhầm nhất:</b> <span><b>ươn</b> kết thúc bằng <b>n</b>; <b>ương</b> kết thúc bằng <b>ng</b>.</span></div>'
      +actionBar('Chơi 4 câu luyện nhanh →',true));
    $$('.rime-family').forEach(function(card){
      $('.mark-rime',card).onclick=function(){
        state.rimeDone[card.dataset.rimeIndex]=true;save();renderRimes();
      };
    });
    bindActionBar();
  }

  function renderGame(){
    shell('<div class="mission-head"><span class="mission-kicker">⑥ TRÒ CHƠI LUYỆN NHANH · 2 PHÚT</span><h2>🔎 Săn họ vần</h2><p>Mục tiêu: nhìn một từ mới và nhận ra cấu trúc quen.</p></div>'
      +'<div class="quiz-list">'+L.quickGame.map(function(q,i){
        var chosen=state.gameAnswered[i];
        return '<div class="quiz-card" data-q="'+i+'"><b>'+esc(q.prompt)+'</b><div class="choice-row">'+q.choices.map(function(c){var cls=chosen===c?(c===q.answer?'correct':'wrong'):'';return '<button class="game-choice '+cls+'" data-choice="'+encodeURIComponent(c)+'">'+esc(c)+'</button>';}).join('')+'</div></div>';
      }).join('')+'</div>'
      +actionBar('Vượt qua từng câu →',true));
    $$('.quiz-card').forEach(function(card){
      var i=Number(card.dataset.q),q=L.quickGame[i];
      $$('.game-choice',card).forEach(function(b){b.onclick=function(){
        var c=decodeURIComponent(b.dataset.choice);
        state.gameAnswered[i]=c;
        if(c===q.answer && state.gameAnswered['win'+i]!==true){state.gameAnswered['win'+i]=true;state.selfWins++;}
        save();renderGame();
      };});
    });
    bindActionBar();
  }

  function watchWords(text){
    var found=[];
    L.keyWords.forEach(function(k){if(text.toLowerCase().indexOf(k.word.toLowerCase())>=0)found.push(k.word);});
    L.difficulty.attention.forEach(function(w){if(text.toLowerCase().indexOf(w.toLowerCase())>=0 && found.indexOf(w)<0)found.push(w);});
    return found;
  }

  function sentenceCard(item,index){
    var status=state.sentenceStatus[index]||'';
    var watches=watchWords(item.text);
    return '<article class="sentence-card '+status+'"><div class="sentence-head"><span>Câu '+(index+1)+'</span><div class="sentence-status">'+esc(status==='ok'?'✅ Đọc được':status==='help'?'⚠️ Có vấp':'Chưa đọc')+'</div></div>'
      +'<div class="chunk-line">'+item.chunks.map(function(c){return '<span>'+esc(c)+'</span>';}).join('<b>/</b>')+'</div>'
      +(watches.length?'<div class="watch-row"><small>Canh các tiếng:</small>'+watches.map(function(w){return '<button class="watch-word" data-watch="'+esc(w)+'">'+esc(w)+'</button>';}).join('')+'</div>':'')
      +'<div class="sentence-actions"><button data-sentence-status="ok">✅ Con đọc được câu</button><button data-sentence-status="help">⚠️ Con bị vấp</button></div>'
      +(status?'<div class="micro-understand"><b>'+esc(item.check)+'</b><button class="show-answer secondary">Xem câu trả lời sau khi con nói</button><p class="answer hidden">'+esc(item.answer)+'</p></div>':'')
      +'</article>';
  }

  function renderSentences(){
    shell('<div class="mission-head"><span class="mission-kicker">⑦ ĐỌC TỪNG CÂU · 5–7 PHÚT</span><h2>Đúng → liền mạch → tự nhiên</h2><p>Nếu con vấp, <b>không đọc hộ</b>. Quay lại đúng tiếng đó: tìm vần → tách → ghép → rồi đọc lại cả cụm.</p></div>'
      +'<div class="sentence-list">'+L.story.sentences.map(sentenceCard).join('')+'</div>'
      +actionBar('Ghép thành toàn bài →',true));
    $$('.sentence-card').forEach(function(card,i){
      $$('[data-sentence-status]',card).forEach(function(b){b.onclick=function(){
        state.sentenceStatus[i]=b.dataset.sentenceStatus;save();renderSentences();
      };});
      var show=$('.show-answer',card);if(show)show.onclick=function(){$('.answer',card).classList.remove('hidden');};
      $$('.watch-word',card).forEach(function(b){b.onclick=function(){
        var w=b.dataset.watch;
        var key=L.keyWords.find(function(k){return k.word===w;});
        if(key){
          toast(key.hints[Math.min(Number(state.hintLevel[w]||0),key.hints.length-1)]||('Tìm vần trong “'+w+'” trước.'));
        }else{
          toast('Cho con tìm vần trong “'+w+'” trước, rồi mới ghép lại.');
        }
      };});
    });
    bindActionBar();
  }

  function fullText(){
    return L.fullText.map(function(s){return '<p>'+esc(s)+'</p>';}).join('');
  }

  function renderFull(){
    shell('<div class="mission-head"><span class="mission-kicker">⑧ ĐỌC TOÀN BÀI · 1–2 LƯỢT</span><h2>Chinh phục bài đọc</h2><p>Không cần đọc 5–10 lần. Mỗi lượt có một mục đích rõ ràng.</p></div>'
      +'<div class="full-reading">'+fullText()+'</div>'
      +'<div class="purpose-grid"><button id="pass1" class="'+(state.fullPass1?'done':'')+'"><span>1</span><b>Lượt 1: Đọc đúng</b><small>Tự giải mã khi gặp tiếng lạ.</small></button><button id="pass2" class="'+(state.fullPass2?'done':'')+'"><span>2</span><b>Lượt 2: Đọc liền mạch</b><small>Chỉ làm nếu con vẫn còn tập trung.</small></button></div>'
      +'<div class="stop-note">Nếu con mệt sau lượt 1: <b>dừng tại đây vẫn hoàn toàn ổn.</b></div>'
      +actionBar('Kiểm tra con hiểu gì →',true));
    $('#pass1').onclick=function(){state.fullPass1=true;save();renderFull();};
    $('#pass2').onclick=function(){state.fullPass2=true;save();renderFull();};
    bindActionBar();
  }

  function renderComprehension(){
    var answered=Object.keys(state.comprehension).filter(function(k){return !String(k).startsWith('m');}).length;
    shell('<div class="mission-head"><span class="mission-kicker">⑨ ĐỌC HIỂU · 3 PHÚT</span><h2>Đọc → hình dung → hiểu</h2><p>Hỏi nhẹ như trò chuyện. Không yêu cầu con trả lời nguyên câu giống sách.</p></div>'
      +'<div class="comprehension-list">'+L.comprehension.map(function(q,i){
        var chosen=state.comprehension[i];
        return '<section class="comp-card" data-comp="'+i+'"><b>'+(i+1)+'. '+esc(q.prompt)+'</b><div class="choice-stack">'+q.choices.map(function(c){var cls=chosen===c?(c===q.answer?'correct':'wrong'):'';return '<button class="comp-choice '+cls+'" data-c="'+encodeURIComponent(c)+'">'+esc(c)+'</button>';}).join('')+'</div></section>';
      }).join('')+'</div>'
      +'<div class="book-exercise"><h3>Ghép đúng như trong sách</h3><div class="match-board"><div>'+L.matching.map(function(x,i){return '<button class="match-left" data-i="'+i+'">'+esc(x.left)+'</button>';}).join('')+'</div><div>'+L.matching.slice().reverse().map(function(x){return '<button class="match-right" data-v="'+encodeURIComponent(x.right)+'">'+esc(x.right)+'</button>';}).join('')+'</div></div></div>'
      +actionBar('Kiểm tra trong ngữ cảnh mới →',answered>=2));
    $$('.comp-card').forEach(function(card){
      var i=Number(card.dataset.comp),q=L.comprehension[i];
      $$('.comp-choice',card).forEach(function(b){b.onclick=function(){
        state.comprehension[i]=decodeURIComponent(b.dataset.c);save();renderComprehension();
      };});
    });
    var selected=null;
    $$('.match-left').forEach(function(b){b.onclick=function(){$$('.match-left').forEach(function(x){x.classList.remove('selected');});selected=Number(b.dataset.i);b.classList.add('selected');};});
    $$('.match-right').forEach(function(b){b.onclick=function(){
      if(selected===null){toast('Chọn bên trái trước nhé.');return;}
      var val=decodeURIComponent(b.dataset.v),want=L.matching[selected].right;
      if(val===want){state.matching[selected]=true;save();b.classList.add('correct');$$('.match-left')[selected].classList.add('correct');selected=null;}
      else{b.classList.add('wrong');setTimeout(function(){b.classList.remove('wrong');},450);}
    };});
    bindActionBar();
  }

  function renderFinal(){
    shell('<div class="mission-head"><span class="mission-kicker">⑩ THỬ THÁCH CUỐI · 3 PHÚT</span><h2>Không hỏi lại đúng chỗ cũ</h2><p>Đây là lúc kiểm tra con có <b>khái quát cách đọc</b> sang ngữ cảnh mới hay không.</p></div>'
      +'<div class="final-list">'+L.finalChallenge.map(function(s,i){
        var st=state.finalStatus[i]||'';
        return '<article class="final-card '+st+'"><span>'+(i+1)+'</span><b>'+esc(s)+'</b><div><button data-final="self">✅ Tự đọc</button><button data-final="help">⚠️ Cần gợi ý</button></div></article>';
      }).join('')+'</div>'
      +'<div class="writing-bonus"><span>✍️</span><div><b>Tập viết trong sách – tùy chọn 2 phút</b><p>'+L.writing.map(function(w){return '<strong>'+esc(w)+'</strong>';}).join(' · ')+'</p><small>Mỗi từ 1–2 lần có chú ý là đủ. Không cần chép cả dòng.</small></div></div>'
      +actionBar('Xem danh sách ôn →',true));
    $$('.final-card').forEach(function(card,i){
      $$('[data-final]',card).forEach(function(b){b.onclick=function(){
        var old=state.finalStatus[i];state.finalStatus[i]=b.dataset.final;
        if(b.dataset.final==='self'&&old!=='self')state.selfWins++;
        save();renderFinal();
      };});
    });
    bindActionBar();
  }

  function errorWords(){
    var items=[];
    L.keyWords.forEach(function(k){
      var s=state.wordStatus[k.word];
      if(s==='help'||s==='wrong'||s==='slow')items.push({word:k.word,status:s,family:k.family});
    });
    return items;
  }

  function renderReview(){
    var errors=errorWords();
    shell('<div class="mission-head"><span class="mission-kicker">⑪ DANH SÁCH ÔN</span><h2>Ôn đúng chỗ, không học lại cả bài</h2><p>Những tiếng từng vấp sẽ xuất hiện lại trong <b>câu mới</b>.</p></div>'
      +(errors.length?'<div class="error-hunt"><h3>🔎 Săn lại lỗi cuối buổi</h3>'+errors.map(function(e){return '<span><b>'+esc(e.word)+'</b><small>'+esc(e.family)+' · '+esc(statusText(e.status))+'</small></span>';}).join('')+'</div>':'<div class="error-hunt clean"><h3>🌟 Chưa có tiếng nào được đánh dấu là lỗi</h3><p>Nếu con vấp khi đọc lại, quay về “Phá khóa” và ghi lại.</p></div>')
      +'<div class="review-grid"><section><span>CUỐI BUỔI</span><h3>8 tiếng khóa</h3>'+chips(L.review.end,'review-chip')+'</section>'
      +'<section><span>NGÀY 1</span><h3>Câu ngắn mới</h3>'+L.review.day1.map(function(s){return '<p>'+esc(s)+'</p>';}).join('')+'</section>'
      +'<section><span>NGÀY 3</span><h3>Đổi từ cùng cấu trúc</h3>'+L.review.day3.map(function(s){return '<p>'+esc(s)+'</p>';}).join('')+'</section>'
      +'<section><span>NGÀY 7</span><h3>Đọc trong ngữ cảnh mới</h3>'+L.review.day7.map(function(s){return '<p>'+esc(s)+'</p>';}).join('')+'</section></div>'
      +'<div class="finish-banner"><div>🏆</div><h2>Đích không phải nhớ bài này.</h2><p>Đích là: <b>gặp một từ chưa từng thấy, con biết cách tự tìm ra cách đọc.</b></p><button id="finishLesson" class="primary">Hoàn thành buổi học ✓</button></div>');
    $('#finishLesson').onclick=function(){finishStep('review');state.completed.warmup=true;state.completed.map=true;state.completed.unlock=true;state.completed.rimes=true;state.completed.game=true;state.completed.sentences=true;state.completed.full=true;state.completed.comprehension=true;state.completed.final=true;save();confetti();toast('Hoàn thành! Ngày mai chỉ ôn 2–3 phút.');};
  }

  function render(){
    if(state.step==='warmup')renderWarmup();
    else if(state.step==='map')renderMap();
    else if(state.step==='unlock')renderUnlock();
    else if(state.step==='rimes')renderRimes();
    else if(state.step==='game')renderGame();
    else if(state.step==='sentences')renderSentences();
    else if(state.step==='full')renderFull();
    else if(state.step==='comprehension')renderComprehension();
    else if(state.step==='final')renderFinal();
    else renderReview();
  }

  $('#homeBtn').onclick=function(){go('warmup');};
  $('#resetBtn').onclick=function(){
    if(confirm('Xóa toàn bộ tiến độ của bài Hạt giống nhỏ trên thiết bị này?')){
      localStorage.removeItem(KEY);state=defaults();render();
    }
  };

  updateHeader();
  render();
}());