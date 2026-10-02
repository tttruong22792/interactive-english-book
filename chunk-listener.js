(function ChunkListenerModule(){
  'use strict';

  var session={
    items:[],
    index:0,
    playing:false,
    paused:false,
    signature:'',
    round:0,
    phase:'idle',
    gapAction:'',
    recovering:false,
    recoverCount:0
  };
  var runtimeEnv=null;
  var audio=null;
  var silenceUrls={};
  var warmKeys={};

  function q(selector){ return document.querySelector(selector); }
  function qa(selector){ return Array.prototype.slice.call(document.querySelectorAll(selector)); }

  function settings(env){
    var first=(env.selected&&env.selected.lessonId)||(env.packs[0]&&env.packs[0].lessonId)||'';
    var defaults={
      lessonId:first,
      contentMode:'chunks',
      size:'all',
      repeat:3,
      rate:0.92,
      gap:1200,
      order:'sequential',
      loop:true
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
    return [s.lessonId,s.contentMode,s.size,s.repeat,s.rate,s.gap,s.order,s.loop?'1':'0'].join('|');
  }

  function sourcePacks(env,s){
    return s.lessonId==='all'
      ? env.packs
      : env.packs.filter(function(p){return p.lessonId===s.lessonId;});
  }

  function chunkCategory(card){
    if(card.kind==='building') return 'Khối bổ trợ';
    if(card.priority==='extra') return 'Cụm bổ sung';
    return 'Cụm chính';
  }

  function collectChunkItems(env,s){
    var items=[];
    sourcePacks(env,s).forEach(function(pack){
      var cards=window.VocabularyTrainer&&window.VocabularyTrainer.studyChunks
        ? window.VocabularyTrainer.studyChunks(pack)
        : [];
      cards.forEach(function(card){
        var text=String(card.baseEn||'').trim();
        if(!text) return;
        items.push({
          baseEn:text,
          baseVi:card.baseVi||'',
          lessonId:pack.lessonId,
          pattern:pack.pattern||'',
          order:pack.order||0,
          itemType:'chunk',
          category:chunkCategory(card)
        });
      });
    });
    return items;
  }

  function collectSentenceItems(env,s){
    var seen={};
    var items=[];
    sourcePacks(env,s).forEach(function(pack){
      var cards=window.VocabularyTrainer&&window.VocabularyTrainer.studyChunks
        ? window.VocabularyTrainer.studyChunks(pack)
        : [];
      cards.forEach(function(card){
        var examples=(card.examples&&card.examples.length)
          ? card.examples
          : [{en:card.modelEn||'',vi:card.modelVi||''}];
        examples.forEach(function(example){
          var text=String(example.en||'').trim();
          var key=text.toLowerCase();
          if(!text||seen[key]) return;
          seen[key]=true;
          items.push({
            baseEn:text,
            baseVi:example.vi||'',
            lessonId:pack.lessonId,
            pattern:pack.pattern||'',
            order:pack.order||0,
            itemType:'sentence',
            category:'Câu hoàn chỉnh',
            sourceChunk:card.baseEn||''
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
      var cards=window.VocabularyTrainer&&window.VocabularyTrainer.studyChunks
        ? window.VocabularyTrainer.studyChunks(pack)
        : [];
      cards.forEach(function(card){
        var chunk=String(card.baseEn||'').trim();
        if(chunk){
          items.push({
            baseEn:chunk,
            baseVi:card.baseVi||'',
            lessonId:pack.lessonId,
            pattern:pack.pattern||'',
            order:pack.order||0,
            itemType:'chunk',
            category:chunkCategory(card)
          });
        }
        var examples=(card.examples&&card.examples.length)
          ? card.examples
          : [{en:card.modelEn||'',vi:card.modelVi||''}];
        examples.forEach(function(example){
          var text=String(example.en||'').trim();
          var key=text.toLowerCase();
          if(!text||seenSentences[key]) return;
          seenSentences[key]=true;
          items.push({
            baseEn:text,
            baseVi:example.vi||'',
            lessonId:pack.lessonId,
            pattern:pack.pattern||'',
            order:pack.order||0,
            itemType:'sentence',
            category:'Câu hoàn chỉnh',
            sourceChunk:card.baseEn||''
          });
        });
      });
    });
    return items;
  }

  function itemsFor(env,s,shuffle){
    var items=s.contentMode==='sentences'
      ? collectSentenceItems(env,s)
      : s.contentMode==='both'
        ? collectMixedItems(env,s)
        : collectChunkItems(env,s);

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
    return {
      chunks:collectChunkItems(env,s).length,
      sentences:collectSentenceItems(env,s).length
    };
  }

  function icon(name){
    var body={
      play:'<path d="m7 4 13 8-13 8Z"/>',
      pause:'<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
      prev:'<path d="M19 20 9 12l10-8v16Z"/><path d="M5 19V5"/>',
      next:'<path d="m5 4 10 8-10 8V4Z"/><path d="M19 5v14"/>',
      repeat:'<path d="m17 1 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 23-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'
    }[name]||'';
    return '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+body+'</svg>';
  }

  function option(value,label,current){
    return '<option value="'+value+'" '+(String(current)===String(value)?'selected':'')+'>'+label+'</option>';
  }

  function modeLabel(mode){
    if(mode==='sentences') return 'Câu hoàn chỉnh';
    if(mode==='both') return 'Cụm + câu';
    return 'Cụm Flashcard';
  }

  function itemNoun(mode){
    return mode==='sentences'?'câu':mode==='both'?'mục':'cụm';
  }

  function silenceUrl(ms){
    var duration=Math.max(60,Math.round(Number(ms)||60));
    var key=String(duration);
    if(silenceUrls[key]) return silenceUrls[key];

    var sampleRate=8000;
    var samples=Math.max(1,Math.round(sampleRate*duration/1000));
    var bytes=new Uint8Array(44+samples);
    var view=new DataView(bytes.buffer);
    function writeText(offset,text){
      for(var i=0;i<text.length;i++) bytes[offset+i]=text.charCodeAt(i);
    }
    writeText(0,'RIFF');
    view.setUint32(4,36+samples,true);
    writeText(8,'WAVE');
    writeText(12,'fmt ');
    view.setUint32(16,16,true);
    view.setUint16(20,1,true);
    view.setUint16(22,1,true);
    view.setUint32(24,sampleRate,true);
    view.setUint32(28,sampleRate,true);
    view.setUint16(32,1,true);
    view.setUint16(34,8,true);
    writeText(36,'data');
    view.setUint32(40,samples,true);
    for(var j=44;j<bytes.length;j++) bytes[j]=128;
    var blob=new Blob([bytes],{type:'audio/wav'});
    silenceUrls[key]=URL.createObjectURL(blob);
    return silenceUrls[key];
  }

  function ensureAudio(){
    if(audio) return audio;
    audio=document.createElement('audio');
    audio.id='languageStudioBackgroundAudio';
    audio.preload='auto';
    audio.setAttribute('playsinline','');
    audio.setAttribute('webkit-playsinline','');
    audio.style.position='fixed';
    audio.style.width='1px';
    audio.style.height='1px';
    audio.style.opacity='0.001';
    audio.style.pointerEvents='none';
    audio.style.left='-10px';
    audio.style.bottom='-10px';
    document.body.appendChild(audio);

    audio.addEventListener('ended',handleEnded);
    audio.addEventListener('error',handleAudioError);
    audio.addEventListener('playing',function(){
      setMediaPlaybackState('playing');
    });
    audio.addEventListener('pause',function(){
      if(!session.playing) setMediaPlaybackState('paused');
    });

    try{
      if(navigator.audioSession && 'type' in navigator.audioSession){
        navigator.audioSession.type='playback';
      }
    }catch(error){}

    return audio;
  }

  function setMediaPlaybackState(state){
    try{
      if('mediaSession' in navigator) navigator.mediaSession.playbackState=state;
    }catch(error){}
  }

  function updateMediaMetadata(item){
    if(!item||!('mediaSession' in navigator)||!('MediaMetadata' in window)) return;
    try{
      navigator.mediaSession.metadata=new MediaMetadata({
        title:item.baseEn||'Language Studio',
        artist:item.baseVi||'Cụm chủ động',
        album:'Language Studio · '+(item.itemType==='sentence'?'Câu hoàn chỉnh':item.category||'Flashcard')
      });
    }catch(error){}
  }

  function audioUrlFor(item){
    if(!item||!window.AITTS||!window.AITTS.staticAudioUrl) return '';
    var language=window.AITTS.detectLanguage?window.AITTS.detectLanguage(item.baseEn):'en-US';
    var voice=window.AITTS.voiceFor?window.AITTS.voiceFor(language):'marin';
    return window.AITTS.staticAudioUrl(item.baseEn,language,voice);
  }

  function playSource(src,rate){
    var player=ensureAudio();
    try{player.pause();}catch(error){}
    player.src=src;
    player.preload='auto';
    player.playbackRate=Math.max(0.65,Math.min(1.05,Number(rate)||1));
    try{player.preservesPitch=true;}catch(error){}
    try{player.webkitPreservesPitch=true;}catch(error){}
    try{player.currentTime=0;}catch(error){}
    player.load();
    var p=player.play();
    if(p&&typeof p.catch==='function'){
      p.catch(function(error){
        if(session.playing) handleAudioError(error);
      });
    }
  }

  function warmKey(item){
    return String(item&&item.baseEn||'').toLowerCase().trim();
  }

  function warmAhead(count){
    if(!runtimeEnv||!window.AITTS||!window.AITTS.prepareAudioUrl||!session.items.length) return;
    var total=session.items.length;
    var max=Math.min(total,Math.max(1,Number(count)||4));
    for(var offset=0;offset<max;offset++){
      var idx=(session.index+offset)%total;
      var item=session.items[idx];
      var key=warmKey(item);
      if(!key||warmKeys[key]) continue;
      warmKeys[key]=true;
      window.AITTS.prepareAudioUrl(item.baseEn,{language:'en-US'})
        .catch(function(){});
    }
  }

  function playCurrentContent(){
    if(!runtimeEnv||!session.playing||!session.items.length) return;
    var item=session.items[session.index];
    if(!item) return;
    session.phase='content';
    session.gapAction='';
    session.recovering=false;
    session.recoverCount=0;
    updateMediaMetadata(item);
    update('Đang nghe · lần '+(session.round+1)+'/'+Math.max(1,Number(settings(runtimeEnv).repeat)||3));
    warmAhead(5);

    var url=audioUrlFor(item);
    if(url){
      playSource(url,Number(settings(runtimeEnv).rate)||0.92);
      return;
    }

    // Fallback for environments without the shared MP3 player.
    runtimeEnv.speak(item.baseEn,null,Number(settings(runtimeEnv).rate)||0.92)
      .then(function(){ if(session.playing) handleEnded(); })
      .catch(function(){ handleAudioError(); });
  }

  function playGap(action){
    if(!runtimeEnv||!session.playing) return;
    var gap=Math.max(60,Number(settings(runtimeEnv).gap)||400);
    session.phase='gap';
    session.gapAction=action;
    update(action==='repeat'?'Nghỉ một nhịp rồi lặp lại':'Nghỉ một nhịp');
    playSource(silenceUrl(gap),1);
  }

  function finishPlaylist(){
    session.playing=false;
    session.paused=false;
    session.phase='idle';
    session.round=0;
    session.gapAction='';
    try{if(audio) audio.pause();}catch(error){}
    setMediaPlaybackState('none');
    update('Đã nghe hết playlist');
  }

  function advanceIndex(step){
    if(!session.items.length) return;
    var total=session.items.length;
    session.index=(session.index+step+total)%total;
    session.round=0;
    session.recoverCount=0;
  }

  function handleEnded(){
    if(!session.playing||!runtimeEnv) return;
    var s=settings(runtimeEnv);
    var repeat=Math.max(1,Number(s.repeat)||3);

    if(session.phase==='unlock'){
      session.round=0;
      playCurrentContent();
      return;
    }

    if(session.phase==='content'){
      session.round++;
      if(session.round<repeat){
        playGap('repeat');
        return;
      }

      var atLast=session.index>=session.items.length-1;
      if(atLast&&!s.loop){
        finishPlaylist();
        return;
      }

      playGap('advance');
      return;
    }

    if(session.phase==='gap'){
      if(session.gapAction==='repeat'){
        playCurrentContent();
        return;
      }
      if(session.gapAction==='advance'){
        advanceIndex(1);
        playCurrentContent();
      }
    }
  }

  function handleAudioError(){
    if(!session.playing||!runtimeEnv||session.phase!=='content'||session.recovering) return;
    var item=session.items[session.index];
    if(!item) return;

    session.recoverCount++;
    if(session.recoverCount>2){
      session.playing=false;
      session.paused=true;
      session.phase='content';
      setMediaPlaybackState('paused');
      update('Mất kết nối audio · chạm Tiếp tục');
      runtimeEnv.toast('Audio bị gián đoạn. Hãy chạm Tiếp tục; web sẽ thử lại từ cụm hiện tại.');
      return;
    }

    session.recovering=true;
    update('Đang nối lại audio…');
    if(window.AITTS&&window.AITTS.prepareAudioUrl){
      window.AITTS.prepareAudioUrl(item.baseEn,{language:'en-US'})
        .then(function(url){
          session.recovering=false;
          if(!session.playing) return;
          playSource(url,Number(settings(runtimeEnv).rate)||0.92);
        })
        .catch(function(){
          session.recovering=false;
          if(session.playing) playSource(audioUrlFor(item),Number(settings(runtimeEnv).rate)||0.92);
        });
      return;
    }

    session.recovering=false;
    playSource(audioUrlFor(item),Number(settings(runtimeEnv).rate)||0.92);
  }

  function screen(env){
    var s=settings(env);
    var sig=signature(s);
    var preview=itemsFor(env,Object.assign({},s,{order:'sequential'}),false);
    // A source/content change must invalidate any previous playlist, even when
    // the previous audio session was playing or paused.
    if(session.signature&&session.signature!==sig) resetQueue();
    if(!session.items.length){
      session.items=preview;
      session.index=0;
      session.signature=sig;
    }
    if(session.index>=session.items.length) session.index=0;
    var items=session.items.length?session.items:preview;
    var current=items[session.index]||null;
    var totalCounts=counts(env,s);
    var gapNumber=Number(s.gap)||0;
    var gapLabel=gapNumber>=1000?(gapNumber/1000).toFixed(gapNumber%1000?1:0)+' giây':gapNumber+' ms';

    var sourceOptions='<option value="all" '+(s.lessonId==='all'?'selected':'')+'>Tất cả mẫu câu</option>';
    sourceOptions+=env.packs.map(function(p){
      return '<option value="'+p.lessonId+'" '+(s.lessonId===p.lessonId?'selected':'')+'>#'+p.order+' · '+env.esc(p.pattern)+'</option>';
    }).join('');

    var queue=items.map(function(item,index){
      var badge=item.itemType==='sentence'?'CÂU':(item.category==='Cụm bổ sung'?'BỔ SUNG':item.category==='Khối bổ trợ'?'BỔ TRỢ':'CỤM');
      return '<button class="vocab-listen-queue-item '+(index===session.index?'active':'')+'" data-listen-index="'+index+'" type="button">'+
        '<span>'+String(index+1).padStart(2,'0')+'</span>'+
        '<div><b>'+env.esc(item.baseEn)+'</b><small>'+env.esc(item.baseVi)+'</small></div>'+
        '<em class="listen-type-badge">'+badge+'</em>'+
      '</button>';
    }).join('');
    if(!queue) queue='<div class="vocab-empty-state"><b>Chưa có nội dung để nghe</b><span>Hãy chọn một bài hoặc chế độ khác.</span></div>';

    var status=session.playing?'Đang phát nền':session.paused?'Đã tạm dừng':'Sẵn sàng';
    var playLabel=session.playing?'Tạm dừng':session.paused?'Tiếp tục':'Bắt đầu nghe';
    var currentType=current?(current.itemType==='sentence'?'CÂU HOÀN CHỈNH':current.category.toUpperCase()):'ĐANG NGHE';

    var content=
      '<div class="vocab-screen-title vocab-listen-title"><div><span class="eyebrow">BACKGROUND AUDIO</span><h2>Nghe liên tục, kể cả khi khóa màn hình</h2><p>Player dùng một luồng audio duy nhất, không dùng timer giữa các cụm nên ổn định hơn khi Safari/PWA chạy nền.</p></div></div>'+
      '<div class="vocab-background-status"><span class="dot"></span><div><b>Nghe nền đã bật</b><small>Sau khi bấm Bắt đầu nghe, bạn có thể khóa màn hình. Play/Pause/Next/Previous sẽ hiện trên màn hình khóa nếu iPhone hỗ trợ.</small></div></div>'+
      '<div class="vocab-listen-mode-tabs">'+
        '<button data-listen-mode="chunks" class="'+(s.contentMode==='chunks'?'active':'')+'" type="button"><b>Cụm Flashcard</b><small>'+totalCounts.chunks+' cụm</small></button>'+
        '<button data-listen-mode="sentences" class="'+(s.contentMode==='sentences'?'active':'')+'" type="button"><b>Câu hoàn chỉnh</b><small>'+totalCounts.sentences+' câu</small></button>'+
        '<button data-listen-mode="both" class="'+(s.contentMode==='both'?'active':'')+'" type="button"><b>Cụm + câu</b><small>Học theo cặp</small></button>'+
      '</div>'+
      '<section class="vocab-listen-player">'+
        '<div class="vocab-listen-player-top"><span class="vocab-listen-headphone">'+env.uiIcon('headphones')+'</span><div><span id="vocabListenStatus">'+status+'</span><small id="vocabListenCounter">'+(items.length?(session.index+1)+'/'+items.length:'0/0')+'</small></div></div>'+
        '<div class="vocab-listen-now"><span class="eyebrow" id="vocabListenType">'+currentType+'</span><h2 id="vocabListenPhrase">'+env.esc(current?current.baseEn:'Chưa có nội dung để nghe')+'</h2><p id="vocabListenMeaning">'+env.esc(current?current.baseVi:'')+'</p><small id="vocabListenCurrentLesson">'+(current?'Mẫu '+String(current.order).padStart(2,'0')+' · '+env.esc(current.pattern):'')+'</small></div>'+
        '<div class="vocab-listen-progress"><i id="vocabListenProgress" style="width:'+(items.length?Math.round(((session.index+1)/items.length)*100):0)+'%"></i></div>'+
        '<div class="vocab-listen-controls"><button id="vocabListenPrev" type="button" aria-label="Mục trước">'+icon('prev')+'</button><button id="vocabListenPlay" class="vocab-listen-play" type="button">'+icon(session.playing?'pause':'play')+'<span>'+playLabel+'</span></button><button id="vocabListenNext" type="button" aria-label="Mục sau">'+icon('next')+'</button></div>'+
        '<div class="vocab-listen-summary"><span>'+modeLabel(s.contentMode)+'</span><span>'+icon('repeat')+' '+Math.max(1,Number(s.repeat)||3)+' lần/'+itemNoun(s.contentMode)+'</span><span>'+s.rate+'×</span><span>Nghỉ '+gapLabel+'</span><span>'+(s.loop?'Lặp danh sách':'Dừng cuối danh sách')+'</span></div>'+
      '</section>'+
      '<details class="vocab-listen-settings"><summary><span>'+env.uiIcon('settings')+'<b>Thiết lập playlist</b></span><small>Chọn bài, số lượng, tốc độ và số lần lặp</small></summary>'+
        '<div class="vocab-listen-settings-grid">'+
          '<label><span>Nguồn bài</span><select id="vocabListenSourceLesson">'+sourceOptions+'</select></label>'+
          '<label><span>Số mục mỗi lượt</span><select id="vocabListenSize">'+option('5','5 mục',s.size)+option('10','10 mục',s.size)+option('20','20 mục',s.size)+option('30','30 mục',s.size)+option('all','Toàn bộ',s.size)+'</select></label>'+
          '<label><span>Lặp mỗi mục</span><select id="vocabListenRepeat">'+option(1,'1 lần',s.repeat)+option(2,'2 lần',s.repeat)+option(3,'3 lần',s.repeat)+option(5,'5 lần',s.repeat)+'</select></label>'+
          '<label><span>Tốc độ</span><select id="vocabListenRate">'+option(0.78,'Chậm · 0.78×',s.rate)+option(0.88,'Vừa · 0.88×',s.rate)+option(0.92,'Tự nhiên · 0.92×',s.rate)+option(1,'Nhanh · 1.0×',s.rate)+'</select></label>'+
          '<label><span>Khoảng nghỉ</span><select id="vocabListenGap">'+option(400,'Nghe liên tục · 0.4s',s.gap)+option(1200,'Vừa đủ · 1.2s',s.gap)+option(2200,'Có thời gian nhại · 2.2s',s.gap)+option(3500,'Nhại chậm · 3.5s',s.gap)+'</select></label>'+
          '<label><span>Thứ tự</span><select id="vocabListenOrder">'+option('sequential','Theo thứ tự',s.order)+option('random','Trộn ngẫu nhiên',s.order)+'</select></label>'+
          '<label class="vocab-listen-toggle"><span><b>Lặp lại toàn bộ playlist</b><small>Tiếp tục nghe cho đến khi bạn bấm dừng.</small></span><input id="vocabListenLoop" type="checkbox" '+(s.loop?'checked':'')+'><i></i></label>'+
        '</div>'+
      '</details>'+
      '<section class="vocab-listen-queue-wrap"><div class="vocab-section-heading"><div><span class="eyebrow">PLAYLIST</span><h3>'+items.length+' '+itemNoun(s.contentMode)+' đang nghe</h3><p>Chạm vào một mục để bắt đầu lại từ vị trí đó.</p></div></div><div class="vocab-listen-queue">'+queue+'</div></section>'+
      '<div class="vocab-listen-tip"><b>Để nghe nền ổn định:</b> bấm <b>Bắt đầu nghe</b> khi màn hình đang mở, đợi câu đầu tiên phát rồi mới khóa màn hình. Web sẽ tải trước vài mục tiếp theo để hạn chế dừng khi 4G chập chờn.</div>';

    return env.shell(content,'Nghe','Player liên tục cho Flashcard và câu hoàn chỉnh, tối ưu cho nghe nền trên điện thoại.');
  }

  function update(statusText){
    if(!runtimeEnv||!session.items.length) return;
    if(session.index>=session.items.length) session.index=0;
    var item=session.items[session.index];
    var el=q('#vocabListenPhrase');if(el) el.textContent=item.baseEn||'';
    el=q('#vocabListenMeaning');if(el) el.textContent=item.baseVi||'';
    el=q('#vocabListenCurrentLesson');if(el) el.textContent='Mẫu '+String(item.order).padStart(2,'0')+' · '+(item.pattern||'');
    el=q('#vocabListenType');if(el) el.textContent=item.itemType==='sentence'?'CÂU HOÀN CHỈNH':String(item.category||'CỤM').toUpperCase();
    el=q('#vocabListenCounter');if(el) el.textContent=(session.index+1)+'/'+session.items.length;
    el=q('#vocabListenProgress');if(el) el.style.width=Math.round(((session.index+1)/session.items.length)*100)+'%';
    el=q('#vocabListenStatus');if(el) el.textContent=statusText||(session.playing?'Đang phát nền':session.paused?'Đã tạm dừng':'Sẵn sàng');
    var play=q('#vocabListenPlay');
    if(play) play.innerHTML=icon(session.playing?'pause':'play')+'<span>'+(session.playing?'Tạm dừng':session.paused?'Tiếp tục':'Bắt đầu nghe')+'</span>';
    qa('[data-listen-index]').forEach(function(btn){btn.classList.toggle('active',Number(btn.dataset.listenIndex)===session.index);});
    updateMediaMetadata(item);
  }

  function resetQueue(){
    session.playing=false;
    session.paused=false;
    session.items=[];
    session.index=0;
    session.signature='';
    session.round=0;
    session.phase='idle';
    session.gapAction='';
    session.recoverCount=0;
    session.recovering=false;
    try{if(audio){audio.pause();audio.removeAttribute('src');audio.load();}}catch(error){}
    setMediaPlaybackState('none');
  }

  function pause(){
    if(!session.playing) return;
    session.playing=false;
    session.paused=true;
    try{if(audio) audio.pause();}catch(error){}
    setMediaPlaybackState('paused');
    update('Đã tạm dừng');
  }

  function resume(){
    if(!session.paused||!audio) return start();
    session.playing=true;
    session.paused=false;
    setMediaPlaybackState('playing');
    update('Đang phát nền');
    var p=audio.play();
    if(p&&typeof p.catch==='function') p.catch(function(){ start(true); });
  }

  function move(step){
    if(!runtimeEnv) return;
    var s=settings(runtimeEnv);
    if(!session.items.length){
      session.items=itemsFor(runtimeEnv,s,false);
      session.signature=signature(s);
    }
    if(!session.items.length) return;

    session.playing=true;
    session.paused=false;
    advanceIndex(step);
    session.phase='content';
    playCurrentContent();
  }

  function start(forceRestart){
    if(!runtimeEnv) return;
    var s=settings(runtimeEnv);
    var sig=signature(s);

    if(session.paused&&!forceRestart&&session.signature===sig&&session.items.length){
      resume();
      return;
    }

    session.items=itemsFor(runtimeEnv,s,true);
    session.index=Math.min(session.index,Math.max(0,session.items.length-1));
    if(!session.items.length){
      runtimeEnv.toast('Không có nội dung phù hợp để nghe.');
      return;
    }

    session.signature=sig;
    session.playing=true;
    session.paused=false;
    session.round=0;
    session.phase='unlock';
    session.gapAction='';
    session.recoverCount=0;
    session.recovering=false;

    ensureAudio();
    setMediaPlaybackState('playing');
    update('Đang khởi động audio nền…');

    // Start a real media element synchronously from the user's tap.
    // The short silent WAV keeps the iOS media session alive while the first MP3 is requested.
    playSource(silenceUrl(90),1);
    warmAhead(5);
  }

  function bind(env){
    runtimeEnv=env;
    settings(env);
    ensureAudio();

    qa('[data-listen-mode]').forEach(function(btn){
      btn.addEventListener('click',function(){
        env.state.vocabListenSettings=Object.assign({},env.state.vocabListenSettings,{contentMode:btn.dataset.listenMode,size:'all'});
        resetQueue();
        env.saveState();
        env.renderVocab();
      });
    });

    var play=q('#vocabListenPlay');
    if(play) play.addEventListener('click',function(){if(session.playing) pause();else start();});
    var prev=q('#vocabListenPrev');if(prev) prev.addEventListener('click',function(){move(-1);});
    var next=q('#vocabListenNext');if(next) next.addEventListener('click',function(){move(1);});
    qa('[data-listen-index]').forEach(function(btn){
      btn.addEventListener('click',function(){
        if(!session.items.length) session.items=itemsFor(env,settings(env),false);
        session.index=Math.max(0,Number(btn.dataset.listenIndex)||0);
        session.round=0;
        session.playing=true;
        session.paused=false;
        playCurrentContent();
      });
    });

    [
      ['vocabListenSourceLesson','lessonId',String],
      ['vocabListenSize','size',String],
      ['vocabListenRepeat','repeat',Number],
      ['vocabListenRate','rate',Number],
      ['vocabListenGap','gap',Number],
      ['vocabListenOrder','order',String]
    ].forEach(function(row){
      var node=q('#'+row[0]);
      if(!node) return;
      node.addEventListener('change',function(){
        env.state.vocabListenSettings=Object.assign({},env.state.vocabListenSettings);
        env.state.vocabListenSettings[row[1]]=row[2](node.value);
        resetQueue();
        env.saveState();
        env.renderVocab();
      });
    });

    var loop=q('#vocabListenLoop');
    if(loop) loop.addEventListener('change',function(){
      env.state.vocabListenSettings=Object.assign({},env.state.vocabListenSettings,{loop:!!loop.checked});
      resetQueue();
      env.saveState();
      env.renderVocab();
    });

    if('mediaSession' in navigator){
      try{
        navigator.mediaSession.setActionHandler('play',function(){ if(session.paused) resume(); else start(); });
        navigator.mediaSession.setActionHandler('pause',pause);
        navigator.mediaSession.setActionHandler('previoustrack',function(){move(-1);});
        navigator.mediaSession.setActionHandler('nexttrack',function(){move(1);});
        navigator.mediaSession.setActionHandler('stop',function(){stop(false);});
      }catch(error){}
    }

    document.addEventListener('visibilitychange',function(){
      if(document.visibilityState==='visible'&&session.playing&&audio&&audio.paused&&session.phase!=='idle'){
        var p=audio.play();
        if(p&&typeof p.catch==='function') p.catch(function(){});
      }
    });

    update();
  }

  function stop(reset){
    session.playing=false;
    session.paused=false;
    session.phase='idle';
    session.round=0;
    session.gapAction='';
    session.recoverCount=0;
    session.recovering=false;
    try{if(audio) audio.pause();}catch(error){}
    setMediaPlaybackState('none');

    if(reset){
      session.items=[];
      session.index=0;
      session.signature='';
    }
  }

  window.ChunkListener={
    screen:screen,
    bind:bind,
    stop:stop,
    setLesson:function(lessonId,state){
      if(!state) return;
      state.vocabListenSettings=Object.assign({},state.vocabListenSettings||{},{lessonId:lessonId,size:'all'});
      stop(true);
    }
  };
}());
