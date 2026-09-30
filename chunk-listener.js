(function ChunkListenerModule(){
  'use strict';

  var session={
    items:[],index:0,playing:false,paused:false,signature:'',
    repeatIndex:0,media:null,gapTimer:null,recovering:false,warmKey:''
  };
  var runtimeEnv=null;

  function q(selector){return document.querySelector(selector);}
  function qa(selector){return Array.prototype.slice.call(document.querySelectorAll(selector));}

  function settings(env){
    var first=(env.selected&&env.selected.lessonId)||(env.packs[0]&&env.packs[0].lessonId)||'';
    var defaults={
      lessonId:first,contentMode:'chunks',size:'all',repeat:3,rate:0.92,
      gap:1200,order:'sequential',loop:true,backgroundMode:true
    };
    var previous=env.state.vocabListenSettings||{};
    var hadContentMode=Object.prototype.hasOwnProperty.call(previous,'contentMode');
    env.state.vocabListenSettings=Object.assign({},defaults,previous);
    var s=env.state.vocabListenSettings;
    if(!hadContentMode) s.size='all';
    var valid=s.lessonId==='all'||env.packs.some(function(p){return p.lessonId===s.lessonId;});
    if(!valid) s.lessonId=first;
    if(['chunks','sentences','both'].indexOf(s.contentMode)<0) s.contentMode='chunks';
    return s;
  }

  function signature(s){
    return [s.lessonId,s.contentMode,s.size,s.repeat,s.rate,s.gap,s.order,s.loop?'1':'0',s.backgroundMode?'1':'0'].join('|');
  }

  function sourcePacks(env,s){
    return s.lessonId==='all'?env.packs:env.packs.filter(function(p){return p.lessonId===s.lessonId;});
  }

  function chunkCategory(card){
    if(card.kind==='building') return 'Khối bổ trợ';
    if(card.priority==='extra') return 'Cụm bổ sung';
    return 'Cụm chính';
  }

  function collectChunkItems(env,s){
    var items=[];
    sourcePacks(env,s).forEach(function(pack){
      var cards=window.VocabularyTrainer&&window.VocabularyTrainer.studyChunks?window.VocabularyTrainer.studyChunks(pack):[];
      cards.forEach(function(card){
        var text=String(card.baseEn||'').trim();
        if(!text) return;
        items.push({
          baseEn:text,baseVi:card.baseVi||'',lessonId:pack.lessonId,
          pattern:pack.pattern||'',order:pack.order||0,itemType:'chunk',category:chunkCategory(card)
        });
      });
    });
    return items;
  }

  function collectSentenceItems(env,s){
    var seen={};
    var items=[];
    sourcePacks(env,s).forEach(function(pack){
      var cards=window.VocabularyTrainer&&window.VocabularyTrainer.studyChunks?window.VocabularyTrainer.studyChunks(pack):[];
      cards.forEach(function(card){
        var examples=(card.examples&&card.examples.length)?card.examples:[{en:card.modelEn||'',vi:card.modelVi||''}];
        examples.forEach(function(example){
          var text=String(example.en||'').trim();
          var key=text.toLowerCase();
          if(!text||seen[key]) return;
          seen[key]=true;
          items.push({
            baseEn:text,baseVi:example.vi||'',lessonId:pack.lessonId,
            pattern:pack.pattern||'',order:pack.order||0,itemType:'sentence',
            category:'Câu hoàn chỉnh',sourceChunk:card.baseEn||''
          });
        });
      });
    });
    return items;
  }

  function collectMixedItems(env,s){
    var seenSentences={};
    var items=[];
    sourcePacks(env,s).forEach(function(pack){
      var cards=window.VocabularyTrainer&&window.VocabularyTrainer.studyChunks?window.VocabularyTrainer.studyChunks(pack):[];
      cards.forEach(function(card){
        var chunk=String(card.baseEn||'').trim();
        if(chunk){
          items.push({
            baseEn:chunk,baseVi:card.baseVi||'',lessonId:pack.lessonId,
            pattern:pack.pattern||'',order:pack.order||0,itemType:'chunk',category:chunkCategory(card)
          });
        }
        var examples=(card.examples&&card.examples.length)?card.examples:[{en:card.modelEn||'',vi:card.modelVi||''}];
        examples.forEach(function(example){
          var text=String(example.en||'').trim();
          var key=text.toLowerCase();
          if(!text||seenSentences[key]) return;
          seenSentences[key]=true;
          items.push({
            baseEn:text,baseVi:example.vi||'',lessonId:pack.lessonId,
            pattern:pack.pattern||'',order:pack.order||0,itemType:'sentence',
            category:'Câu hoàn chỉnh',sourceChunk:card.baseEn||''
          });
        });
      });
    });
    return items;
  }

  function itemsFor(env,s,shuffle){
    var items=s.contentMode==='sentences'
      ?collectSentenceItems(env,s)
      :s.contentMode==='both'?collectMixedItems(env,s):collectChunkItems(env,s);

    if(shuffle&&s.order==='random'){
      for(var i=items.length-1;i>0;i--){
        var j=Math.floor(Math.random()*(i+1));
        var tmp=items[i];items[i]=items[j];items[j]=tmp;
      }
    }
    var limit=s.size==='all'?items.length:Math.max(1,Number(s.size)||10);
    return items.slice(0,limit);
  }

  function counts(env,s){
    return {chunks:collectChunkItems(env,s).length,sentences:collectSentenceItems(env,s).length};
  }

  function icon(name){
    var body={
      play:'<path d="m7 4 13 8-13 8Z"/>',
      pause:'<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
      prev:'<path d="M19 20 9 12l10-8v16Z"/><path d="M5 19V5"/>',
      next:'<path d="m5 4 10 8-10 8V4Z"/><path d="M19 5v14"/>',
      repeat:'<path d="m17 1 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 23-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
      list:'<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>'
    }[name]||'';
    return '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+body+'</svg>';
  }

  function option(value,label,current){
    return '<option value="'+value+'" '+(String(current)===String(value)?'selected':'')+'>'+label+'</option>';
  }

  function itemNoun(mode){return mode==='sentences'?'câu':mode==='both'?'mục':'cụm';}

  function itemTypeLabel(item){
    if(!item) return 'NGHE';
    if(item.itemType==='sentence') return 'CÂU';
    if(item.category==='Cụm bổ sung') return 'BỔ SUNG';
    if(item.category==='Khối bổ trợ') return 'BỔ TRỢ';
    return 'CỤM';
  }

  function screen(env){
    var s=settings(env);
    var sig=signature(s);
    var preview=itemsFor(env,Object.assign({},s,{order:'sequential'}),false);
    if(!session.items.length||(!session.playing&&!session.paused&&session.signature!==sig)){
      session.items=preview;session.index=0;session.repeatIndex=0;session.signature=sig;
    }
    if(session.index>=session.items.length) session.index=0;
    var items=session.items.length?session.items:preview;
    var current=items[session.index]||null;
    var totalCounts=counts(env,s);

    var sourceOptions='<option value="all" '+(s.lessonId==='all'?'selected':'')+'>Tất cả mẫu câu</option>';
    sourceOptions+=env.packs.map(function(p){
      return '<option value="'+p.lessonId+'" '+(s.lessonId===p.lessonId?'selected':'')+'>#'+p.order+' · '+env.esc(p.pattern)+'</option>';
    }).join('');

    var queue=items.map(function(item,index){
      return '<button class="vocab-listen-queue-item '+(index===session.index?'active':'')+'" data-listen-index="'+index+'" type="button">'+
        '<span>'+String(index+1).padStart(2,'0')+'</span>'+
        '<div><b>'+env.esc(item.baseEn)+'</b><small>'+env.esc(item.baseVi)+'</small></div>'+
        '<em>'+itemTypeLabel(item)+'</em>'+
      '</button>';
    }).join('');
    if(!queue) queue='<div class="vocab-empty-state"><b>Chưa có nội dung để nghe</b><span>Hãy chọn một bài hoặc chế độ khác.</span></div>';

    var status=session.playing?'Đang phát':session.paused?'Đã tạm dừng':'Sẵn sàng';
    var playLabel=session.playing?'Tạm dừng':session.paused?'Tiếp tục':'Phát';
    var backgroundText=s.backgroundMode?'Phát nền':'Có khoảng nghỉ';

    var content=
      '<div class="vocab-listen-compact-head">'+
        '<div class="vocab-listen-mode-tabs">'+
          '<button data-listen-mode="chunks" class="'+(s.contentMode==='chunks'?'active':'')+'" type="button"><b>Cụm</b><small>'+totalCounts.chunks+'</small></button>'+
          '<button data-listen-mode="sentences" class="'+(s.contentMode==='sentences'?'active':'')+'" type="button"><b>Câu</b><small>'+totalCounts.sentences+'</small></button>'+
          '<button data-listen-mode="both" class="'+(s.contentMode==='both'?'active':'')+'" type="button"><b>Cụm + câu</b></button>'+
        '</div>'+
        '<span class="vocab-listen-bg-badge '+(s.backgroundMode?'is-on':'')+'">'+env.uiIcon('headphones')+backgroundText+'</span>'+
      '</div>'+

      '<section class="vocab-listen-player vocab-listen-player-compact">'+
        '<audio id="vocabListenMedia" preload="auto" playsinline></audio>'+
        '<div class="vocab-listen-player-top">'+
          '<div><span id="vocabListenStatus">'+status+'</span><small id="vocabListenCounter">'+(items.length?(session.index+1)+'/'+items.length:'0/0')+'</small></div>'+
          '<span id="vocabListenRepeatStatus" class="vocab-listen-repeat-status">'+(Math.max(1,Number(s.repeat)||3))+'×</span>'+
        '</div>'+
        '<div class="vocab-listen-now">'+
          '<span class="eyebrow" id="vocabListenType">'+itemTypeLabel(current)+'</span>'+
          '<h2 id="vocabListenPhrase">'+env.esc(current?current.baseEn:'Chưa có nội dung')+'</h2>'+
          '<p id="vocabListenMeaning">'+env.esc(current?current.baseVi:'')+'</p>'+
        '</div>'+
        '<div class="vocab-listen-controls">'+
          '<button id="vocabListenPrev" type="button" aria-label="Mục trước">'+icon('prev')+'</button>'+
          '<button id="vocabListenPlay" class="vocab-listen-play" type="button">'+icon(session.playing?'pause':'play')+'<span>'+playLabel+'</span></button>'+
          '<button id="vocabListenNext" type="button" aria-label="Mục sau">'+icon('next')+'</button>'+
        '</div>'+
        '<div class="vocab-listen-progress"><i id="vocabListenProgress" style="width:'+(items.length?Math.round(((session.index+1)/items.length)*100):0)+'%"></i></div>'+
        '<div class="vocab-listen-summary">'+
          '<span>'+icon('repeat')+' '+Math.max(1,Number(s.repeat)||3)+' lần</span>'+
          '<span>'+s.rate+'×</span>'+
          '<span>'+(s.backgroundMode?'Nền · nối liên tục':'Nghỉ '+((Number(s.gap)||0)/1000)+'s')+'</span>'+
        '</div>'+
      '</section>'+

      '<div class="vocab-listen-folds">'+
        '<details class="vocab-listen-settings">'+
          '<summary><span>'+env.uiIcon('settings')+'<b>Thiết lập</b></span><small>#'+(current?current.order:'')+' · '+(current?env.esc(current.pattern):'')+'</small></summary>'+
          '<div class="vocab-listen-settings-grid">'+
            '<label><span>Nguồn bài</span><select id="vocabListenLesson">'+sourceOptions+'</select></label>'+
            '<label><span>Số mục</span><select id="vocabListenSize">'+option('5','5',s.size)+option('10','10',s.size)+option('20','20',s.size)+option('30','30',s.size)+option('all','Toàn bộ',s.size)+'</select></label>'+
            '<label><span>Lặp</span><select id="vocabListenRepeat">'+option(1,'1 lần',s.repeat)+option(2,'2 lần',s.repeat)+option(3,'3 lần',s.repeat)+option(5,'5 lần',s.repeat)+'</select></label>'+
            '<label><span>Tốc độ</span><select id="vocabListenRate">'+option(0.78,'0.78×',s.rate)+option(0.88,'0.88×',s.rate)+option(0.92,'0.92×',s.rate)+option(1,'1.0×',s.rate)+'</select></label>'+
            '<label class="vocab-listen-gap-field '+(s.backgroundMode?'is-disabled':'')+'"><span>Khoảng nghỉ</span><select id="vocabListenGap" '+(s.backgroundMode?'disabled':'')+'>'+option(400,'0.4s',s.gap)+option(1200,'1.2s',s.gap)+option(2200,'2.2s',s.gap)+option(3500,'3.5s',s.gap)+'</select></label>'+
            '<label><span>Thứ tự</span><select id="vocabListenOrder">'+option('sequential','Theo thứ tự',s.order)+option('random','Ngẫu nhiên',s.order)+'</select></label>'+
            '<label class="vocab-listen-toggle"><span><b>Phát nền khi khóa màn hình</b><small>Dùng một audio player liên tục; bỏ khoảng nghỉ để iPhone không ngắt phiên phát.</small></span><input id="vocabListenBackground" type="checkbox" '+(s.backgroundMode?'checked':'')+'><i></i></label>'+
            '<label class="vocab-listen-toggle"><span><b>Lặp playlist</b><small>Quay lại từ đầu khi nghe hết.</small></span><input id="vocabListenLoop" type="checkbox" '+(s.loop?'checked':'')+'><i></i></label>'+
          '</div>'+
        '</details>'+

        '<details class="vocab-listen-queue-wrap">'+
          '<summary><span>'+icon('list')+'<b>Danh sách nghe</b></span><small>'+items.length+' '+itemNoun(s.contentMode)+'</small></summary>'+
          '<div class="vocab-listen-queue">'+queue+'</div>'+
        '</details>'+
      '</div>'+
      '<div class="vocab-listen-background-note">Trên iPhone, bật <b>Phát nền</b> để tiếp tục nghe khi tắt màn hình. Nút Play/Pause/Next cũng được nối với màn hình khóa khi iOS cho phép.</div>';

    return env.shell(content,'Nghe','Nghe lặp cụm và câu khi đi tàu/xe.');
  }

  function media(){
    if(session.media&&document.contains(session.media)) return session.media;
    session.media=q('#vocabListenMedia');
    return session.media;
  }

  function currentItem(){
    return session.items[session.index]||null;
  }

  function audioInfo(item){
    if(!item||!window.AITTS) return null;
    var language=window.AITTS.detectLanguage?window.AITTS.detectLanguage(item.baseEn):'en-US';
    var voice=window.AITTS.voiceFor?window.AITTS.voiceFor(language):'marin';
    var url=window.AITTS.staticAudioUrl?window.AITTS.staticAudioUrl(item.baseEn,language,voice):'';
    return {url:url,language:language,voice:voice,key:item.baseEn+'|'+language+'|'+voice};
  }

  function clearGap(){
    if(session.gapTimer){clearTimeout(session.gapTimer);session.gapTimer=null;}
  }

  function setMediaState(value){
    if('mediaSession' in navigator){
      try{navigator.mediaSession.playbackState=value;}catch(error){}
    }
  }

  function updateMediaMetadata(item){
    if(!item||!('mediaSession' in navigator)||!('MediaMetadata' in window)) return;
    try{
      navigator.mediaSession.metadata=new MediaMetadata({
        title:item.baseEn||'Language Studio',
        artist:item.baseVi||'English chunks',
        album:'Language Studio · '+(item.itemType==='sentence'?'Câu hoàn chỉnh':'Cụm chủ động')
      });
    }catch(error){}
  }

  function update(statusText){
    if(!runtimeEnv||!session.items.length) return;
    if(session.index>=session.items.length) session.index=0;
    var item=currentItem();
    var s=settings(runtimeEnv);
    var totalRepeat=Math.max(1,Number(s.repeat)||3);

    var el=q('#vocabListenPhrase');if(el) el.textContent=item.baseEn||'';
    el=q('#vocabListenMeaning');if(el) el.textContent=item.baseVi||'';
    el=q('#vocabListenType');if(el) el.textContent=itemTypeLabel(item);
    el=q('#vocabListenCounter');if(el) el.textContent=(session.index+1)+'/'+session.items.length;
    el=q('#vocabListenRepeatStatus');if(el) el.textContent=(session.repeatIndex+1)+'/'+totalRepeat;
    el=q('#vocabListenProgress');if(el) el.style.width=Math.round(((session.index+1)/session.items.length)*100)+'%';
    el=q('#vocabListenStatus');if(el) el.textContent=statusText||(session.playing?'Đang phát':session.paused?'Đã tạm dừng':'Sẵn sàng');

    var play=q('#vocabListenPlay');
    if(play) play.innerHTML=icon(session.playing?'pause':'play')+'<span>'+(session.playing?'Tạm dừng':session.paused?'Tiếp tục':'Phát')+'</span>';

    qa('[data-listen-index]').forEach(function(btn){
      btn.classList.toggle('active',Number(btn.dataset.listenIndex)===session.index);
    });
    updateMediaMetadata(item);
  }

  async function warmItem(item){
    if(!item||!window.AITTS) return;
    var info=audioInfo(item);
    if(!info||!info.url||session.warmKey===info.key) return;
    session.warmKey=info.key;
    try{
      if(window.AITTS.prepareAudioUrl){
        await window.AITTS.prepareAudioUrl(item.baseEn,{language:info.language,voice:info.voice});
      }else{
        await fetch(info.url,{cache:'force-cache'});
      }
    }catch(error){}
  }

  function warmAhead(){
    if(!session.items.length) return;
    var nextIndex=session.index+1;
    if(nextIndex>=session.items.length) nextIndex=0;
    warmItem(session.items[nextIndex]);
  }

  async function recoverAndPlay(){
    if(session.recovering||!session.playing) return;
    session.recovering=true;
    var item=currentItem();
    try{
      update('Đang chuẩn bị audio…');
      if(window.AITTS&&window.AITTS.prepareAudioUrl){
        var ready=await window.AITTS.prepareAudioUrl(item.baseEn,{language:'en-US',voice:'marin'});
        var m=media();
        if(!m||!session.playing) return;
        m.src=ready;
        m.load();
        m.playbackRate=Number(settings(runtimeEnv).rate)||0.92;
        await m.play();
        update('Đang phát · lần '+(session.repeatIndex+1));
      }else{
        throw new Error('No audio recovery');
      }
    }catch(error){
      session.playing=false;session.paused=true;
      update('Chạm Phát để thử lại');
      if(runtimeEnv) runtimeEnv.toast('Audio chưa sẵn sàng. Hãy bấm Phát lại.');
    }finally{
      session.recovering=false;
    }
  }

  function applySource(resetTime){
    var item=currentItem();
    var m=media();
    var info=audioInfo(item);
    if(!m||!info||!info.url) return false;

    var currentKey=m.dataset.listenKey||'';
    if(currentKey!==info.key){
      m.dataset.listenKey=info.key;
      m.autoplay=!!session.playing;
      m.src=info.url;
      m.load();
    }
    m.playbackRate=Number(settings(runtimeEnv).rate)||0.92;
    try{m.preservesPitch=true;}catch(error){}
    try{m.webkitPreservesPitch=true;}catch(error){}
    if(resetTime){
      try{m.currentTime=0;}catch(error){}
    }
    updateMediaMetadata(item);
    return true;
  }

  function playCurrent(resetTime){
    clearGap();
    var m=media();
    if(!m||!applySource(!!resetTime)) return;
    session.playing=true;session.paused=false;
    setMediaState('playing');
    update('Đang phát · lần '+(session.repeatIndex+1));
    var p=m.play();
    if(p&&typeof p.catch==='function') p.catch(function(){recoverAndPlay();});
    warmAhead();
  }

  function finishPlaylist(){
    session.playing=false;session.paused=false;session.repeatIndex=0;
    setMediaState('none');
    update('Đã nghe hết');
  }

  function advanceAfterItem(){
    var s=settings(runtimeEnv);
    session.repeatIndex=0;
    if(session.index<session.items.length-1){
      session.index++;
    }else if(s.loop){
      session.index=0;
    }else{
      finishPlaylist();return;
    }
    update('Đang chuyển…');

    if(s.backgroundMode){
      playCurrent(true);
    }else{
      var delay=Math.max(0,Number(s.gap)||0);
      if(delay){
        session.gapTimer=setTimeout(function(){
          session.gapTimer=null;
          if(session.playing) playCurrent(true);
        },delay);
      }else{
        playCurrent(true);
      }
    }
  }

  function onEnded(){
    if(!session.playing||!runtimeEnv) return;
    var s=settings(runtimeEnv);
    var total=Math.max(1,Number(s.repeat)||3);
    if(session.repeatIndex+1<total){
      session.repeatIndex++;
      playCurrent(true);
      return;
    }
    advanceAfterItem();
  }

  function pause(){
    clearGap();
    var m=media();
    if(m) m.pause();
    session.playing=false;session.paused=true;
    setMediaState('paused');
    update('Đã tạm dừng');
  }

  function buildQueue(shuffle){
    var s=settings(runtimeEnv);
    session.items=itemsFor(runtimeEnv,s,!!shuffle);
    session.index=0;session.repeatIndex=0;session.signature=signature(s);
    session.warmKey='';
  }

  function start(){
    if(!runtimeEnv) return;
    var s=settings(runtimeEnv);
    var sig=signature(s);
    if(!session.items.length||session.signature!==sig) buildQueue(true);
    if(!session.items.length){runtimeEnv.toast('Không có nội dung phù hợp để nghe.');return;}

    var m=media();
    var canResume=session.paused&&m&&m.src&&!m.ended&&m.currentTime>0;
    session.playing=true;session.paused=false;
    if(canResume){
      m.playbackRate=Number(s.rate)||0.92;
      setMediaState('playing');
      update('Đang phát · lần '+(session.repeatIndex+1));
      var p=m.play();
      if(p&&typeof p.catch==='function') p.catch(function(){playCurrent(false);});
      warmAhead();
    }else{
      playCurrent(true);
    }
  }

  function move(step){
    if(!runtimeEnv) return;
    if(!session.items.length) buildQueue(false);
    if(!session.items.length) return;
    var wasPlaying=session.playing;
    clearGap();
    var m=media();if(m) m.pause();
    session.index=(session.index+step+session.items.length)%session.items.length;
    session.repeatIndex=0;session.paused=!wasPlaying;session.playing=wasPlaying;
    if(wasPlaying) playCurrent(true);
    else{applySource(true);update('Sẵn sàng');}
  }

  function resetQueue(){
    clearGap();
    var m=media();
    if(m){m.pause();m.removeAttribute('src');m.load();}
    session.playing=false;session.paused=false;session.items=[];session.index=0;
    session.repeatIndex=0;session.signature='';session.warmKey='';
    setMediaState('none');
  }

  function bindMedia(){
    var m=media();
    if(!m||m.dataset.listenerBound==='1') return;
    m.dataset.listenerBound='1';
    m.addEventListener('ended',onEnded);
    m.addEventListener('error',function(){if(session.playing) recoverAndPlay();});
    m.addEventListener('playing',function(){setMediaState('playing');});
    m.addEventListener('pause',function(){if(session.paused) setMediaState('paused');});
  }

  function bind(env){
    runtimeEnv=env;
    var s=settings(env);
    bindMedia();

    qa('[data-listen-mode]').forEach(function(btn){
      btn.addEventListener('click',function(){
        env.state.vocabListenSettings=Object.assign({},env.state.vocabListenSettings,{contentMode:btn.dataset.listenMode,size:'all'});
        resetQueue();env.saveState();env.renderVocab();
      });
    });

    var play=q('#vocabListenPlay');
    if(play) play.addEventListener('click',function(){if(session.playing) pause();else start();});
    var prev=q('#vocabListenPrev');if(prev) prev.addEventListener('click',function(){move(-1);});
    var next=q('#vocabListenNext');if(next) next.addEventListener('click',function(){move(1);});

    qa('[data-listen-index]').forEach(function(btn){
      btn.addEventListener('click',function(){
        var wasPlaying=session.playing;
        clearGap();
        var m=media();if(m) m.pause();
        session.index=Math.max(0,Number(btn.dataset.listenIndex)||0);
        session.repeatIndex=0;session.playing=wasPlaying;session.paused=!wasPlaying;
        if(wasPlaying) playCurrent(true);
        else{applySource(true);update('Sẵn sàng');}
      });
    });

    [
      ['vocabListenLesson','lessonId',String],
      ['vocabListenSize','size',String],
      ['vocabListenRepeat','repeat',Number],
      ['vocabListenRate','rate',Number],
      ['vocabListenGap','gap',Number],
      ['vocabListenOrder','order',String]
    ].forEach(function(row){
      var node=q('#'+row[0]);if(!node) return;
      node.addEventListener('change',function(){
        env.state.vocabListenSettings=Object.assign({},env.state.vocabListenSettings);
        env.state.vocabListenSettings[row[1]]=row[2](node.value);
        resetQueue();env.saveState();env.renderVocab();
      });
    });

    var background=q('#vocabListenBackground');
    if(background) background.addEventListener('change',function(){
      env.state.vocabListenSettings=Object.assign({},env.state.vocabListenSettings,{backgroundMode:!!background.checked});
      resetQueue();env.saveState();env.renderVocab();
    });

    var loop=q('#vocabListenLoop');
    if(loop) loop.addEventListener('change',function(){
      env.state.vocabListenSettings=Object.assign({},env.state.vocabListenSettings,{loop:!!loop.checked});
      resetQueue();env.saveState();env.renderVocab();
    });

    if('mediaSession' in navigator){
      try{
        navigator.mediaSession.setActionHandler('play',function(){if(!session.playing) start();});
        navigator.mediaSession.setActionHandler('pause',pause);
        navigator.mediaSession.setActionHandler('previoustrack',function(){move(-1);});
        navigator.mediaSession.setActionHandler('nexttrack',function(){move(1);});
      }catch(error){}
    }

    if(session.items.length){
      applySource(false);warmItem(currentItem());warmAhead();
    }else{
      var preview=itemsFor(env,s,false);
      if(preview.length){session.items=preview;session.signature=signature(s);warmItem(preview[0]);}
    }
    update();
  }

  function stop(reset){
    clearGap();
    var m=media();if(m) m.pause();
    session.playing=false;session.paused=false;setMediaState('none');
    if(reset){
      if(m){m.removeAttribute('src');m.load();}
      session.items=[];session.index=0;session.repeatIndex=0;session.signature='';session.warmKey='';
    }
  }

  window.ChunkListener={
    screen:screen,bind:bind,stop:stop,
    setLesson:function(lessonId,state){
      if(!state) return;
      state.vocabListenSettings=Object.assign({},state.vocabListenSettings||{},{lessonId:lessonId,size:'all'});
      session.items=[];session.index=0;session.repeatIndex=0;session.signature='';session.paused=false;session.playing=false;
    }
  };
}());
