
(function ChunkListenerModule(){
  'use strict';

  var session={items:[],index:0,playing:false,paused:false,signature:'',token:null};
  var runtimeEnv=null;

  function settings(env){
    var first=(env.selected&&env.selected.lessonId)||(env.packs[0]&&env.packs[0].lessonId)||'';
    var defaults={lessonId:first,size:'10',repeat:3,rate:0.92,gap:1200,order:'sequential',loop:true};
    env.state.vocabListenSettings=Object.assign({},defaults,env.state.vocabListenSettings||{});
    var valid=env.state.vocabListenSettings.lessonId==='all'||env.packs.some(function(p){return p.lessonId===env.state.vocabListenSettings.lessonId;});
    if(!valid) env.state.vocabListenSettings.lessonId=first;
    return env.state.vocabListenSettings;
  }

  function signature(s){
    return [s.lessonId,s.size,s.repeat,s.rate,s.gap,s.order,s.loop?'1':'0'].join('|');
  }

  function itemsFor(env,s,shuffle){
    var source=s.lessonId==='all'
      ? env.packs
      : env.packs.filter(function(p){return p.lessonId===s.lessonId;});
    var seen={};
    var items=[];
    source.forEach(function(pack){
      (window.VocabularyTrainer&&window.VocabularyTrainer.studyChunks?window.VocabularyTrainer.studyChunks(pack):[])
        .filter(function(card){return card.kind!=='building';})
        .forEach(function(card){
          var key=String(card.baseEn||'').trim().toLowerCase();
          if(!key||seen[key]) return;
          seen[key]=true;
          items.push({
            baseEn:card.baseEn||'',
            baseVi:card.baseVi||'',
            lessonId:pack.lessonId,
            pattern:pack.pattern||'',
            order:pack.order||0
          });
        });
    });
    if(shuffle&&s.order==='random'){
      for(var i=items.length-1;i>0;i--){
        var j=Math.floor(Math.random()*(i+1));
        var tmp=items[i];items[i]=items[j];items[j]=tmp;
      }
    }
    var limit=s.size==='all'?items.length:Math.max(1,Number(s.size)||10);
    return items.slice(0,limit);
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

  function screen(env){
    var s=settings(env);
    var sig=signature(s);
    var preview=itemsFor(env,Object.assign({},s,{order:'sequential'}),false);
    if(!session.items.length||(!session.playing&&!session.paused&&session.signature!==sig)){
      session.items=preview;
      session.index=0;
      session.signature=sig;
    }
    if(session.index>=session.items.length) session.index=0;
    var items=session.items.length?session.items:preview;
    var current=items[session.index]||null;
    var gapNumber=Number(s.gap)||0;
    var gapLabel=gapNumber>=1000?(gapNumber/1000).toFixed(gapNumber%1000?1:0)+' giây':gapNumber+' ms';

    var sourceOptions='<option value="all" '+(s.lessonId==='all'?'selected':'')+'>Tất cả mẫu câu</option>';
    sourceOptions+=env.packs.map(function(p){
      return '<option value="'+p.lessonId+'" '+(s.lessonId===p.lessonId?'selected':'')+'>#'+p.order+' · '+env.esc(p.pattern)+'</option>';
    }).join('');

    var queue=items.map(function(item,index){
      return '<button class="vocab-listen-queue-item '+(index===session.index?'active':'')+'" data-listen-index="'+index+'" type="button">'+
        '<span>'+String(index+1).padStart(2,'0')+'</span>'+
        '<div><b>'+env.esc(item.baseEn)+'</b><small>'+env.esc(item.baseVi)+'</small></div>'+
        '<em>'+String(item.order).padStart(2,'0')+'</em>'+
      '</button>';
    }).join('');
    if(!queue) queue='<div class="vocab-empty-state"><b>Chưa có cụm để nghe</b><span>Hãy chọn một bài khác.</span></div>';

    var status=session.playing?'Đang phát':session.paused?'Đã tạm dừng':'Sẵn sàng';
    var playLabel=session.playing?'Tạm dừng':session.paused?'Tiếp tục':'Bắt đầu nghe';
    var content=
      '<div class="vocab-screen-title vocab-listen-title"><div><span class="eyebrow">AUDIO LOOP</span><h2>Nghe cụm khi đang di chuyển</h2><p>Bấm phát một lần rồi để web tự lặp từng cụm và chuyển sang cụm tiếp theo.</p></div></div>'+
      '<section class="vocab-listen-player">'+
        '<div class="vocab-listen-player-top"><span class="vocab-listen-headphone">'+env.uiIcon('headphones')+'</span><div><span id="vocabListenStatus">'+status+'</span><small id="vocabListenCounter">'+(items.length?(session.index+1)+'/'+items.length:'0/0')+'</small></div></div>'+
        '<div class="vocab-listen-now"><span class="eyebrow">ĐANG NGHE</span><h2 id="vocabListenPhrase">'+env.esc(current?current.baseEn:'Chưa có cụm để nghe')+'</h2><p id="vocabListenMeaning">'+env.esc(current?current.baseVi:'')+'</p><small id="vocabListenLesson">'+(current?'Mẫu '+String(current.order).padStart(2,'0')+' · '+env.esc(current.pattern):'')+'</small></div>'+
        '<div class="vocab-listen-progress"><i id="vocabListenProgress" style="width:'+(items.length?Math.round(((session.index+1)/items.length)*100):0)+'%"></i></div>'+
        '<div class="vocab-listen-controls"><button id="vocabListenPrev" type="button" aria-label="Cụm trước">'+icon('prev')+'</button><button id="vocabListenPlay" class="vocab-listen-play" type="button">'+icon(session.playing?'pause':'play')+'<span>'+playLabel+'</span></button><button id="vocabListenNext" type="button" aria-label="Cụm sau">'+icon('next')+'</button></div>'+
        '<div class="vocab-listen-summary"><span>'+icon('repeat')+' '+Math.max(1,Number(s.repeat)||3)+' lần/cụm</span><span>'+s.rate+'×</span><span>Nghỉ '+gapLabel+'</span><span>'+(s.loop?'Lặp danh sách':'Dừng cuối danh sách')+'</span></div>'+
      '</section>'+
      '<details class="vocab-listen-settings"><summary><span>'+env.uiIcon('settings')+'<b>Thiết lập playlist</b></span><small>Chọn bài, số cụm, tốc độ và số lần lặp</small></summary>'+
        '<div class="vocab-listen-settings-grid">'+
          '<label><span>Nguồn cụm</span><select id="vocabListenLesson">'+sourceOptions+'</select></label>'+
          '<label><span>Số cụm mỗi lượt</span><select id="vocabListenSize">'+option('5','5 cụm',s.size)+option('10','10 cụm',s.size)+option('20','20 cụm',s.size)+option('30','30 cụm',s.size)+option('all','Toàn bộ',s.size)+'</select></label>'+
          '<label><span>Lặp mỗi cụm</span><select id="vocabListenRepeat">'+option(1,'1 lần',s.repeat)+option(2,'2 lần',s.repeat)+option(3,'3 lần',s.repeat)+option(5,'5 lần',s.repeat)+'</select></label>'+
          '<label><span>Tốc độ</span><select id="vocabListenRate">'+option(0.78,'Chậm · 0.78×',s.rate)+option(0.88,'Vừa · 0.88×',s.rate)+option(0.92,'Tự nhiên · 0.92×',s.rate)+option(1,'Nhanh · 1.0×',s.rate)+'</select></label>'+
          '<label><span>Khoảng nghỉ</span><select id="vocabListenGap">'+option(400,'Nghe liên tục · 0.4s',s.gap)+option(1200,'Vừa đủ · 1.2s',s.gap)+option(2200,'Có thời gian nhại · 2.2s',s.gap)+option(3500,'Nhại chậm · 3.5s',s.gap)+'</select></label>'+
          '<label><span>Thứ tự</span><select id="vocabListenOrder">'+option('sequential','Theo thứ tự',s.order)+option('random','Trộn ngẫu nhiên',s.order)+'</select></label>'+
          '<label class="vocab-listen-toggle"><span><b>Lặp lại toàn bộ playlist</b><small>Tiếp tục nghe cho đến khi bạn bấm dừng.</small></span><input id="vocabListenLoop" type="checkbox" '+(s.loop?'checked':'')+'><i></i></label>'+
        '</div>'+
      '</details>'+
      '<section class="vocab-listen-queue-wrap"><div class="vocab-section-heading"><div><span class="eyebrow">PLAYLIST</span><h3>'+items.length+' cụm đáng học</h3><p>Chạm vào một cụm để bắt đầu lại từ vị trí đó.</p></div></div><div class="vocab-listen-queue">'+queue+'</div></section>'+
      '<div class="vocab-listen-tip"><b>Cách dùng khi đi tàu/xe:</b> để tốc độ <b>0.92×</b>, lặp <b>3 lần</b> và nghỉ <b>1.2 giây</b>. Lượt đầu chỉ nghe; từ lượt 2 hãy nhẩm hoặc nói nhỏ theo audio.</div>';

    return env.shell(content,'Nghe','Playlist cụm chủ động dành cho lúc không tiện nhìn màn hình.');
  }

  function update(statusText){
    if(!runtimeEnv||!session.items.length) return;
    if(session.index>=session.items.length) session.index=0;
    var item=session.items[session.index];
    var el=runtimeEnv.$('#vocabListenPhrase');if(el) el.textContent=item.baseEn||'';
    el=runtimeEnv.$('#vocabListenMeaning');if(el) el.textContent=item.baseVi||'';
    el=runtimeEnv.$('#vocabListenLesson');if(el) el.textContent='Mẫu '+String(item.order).padStart(2,'0')+' · '+(item.pattern||'');
    el=runtimeEnv.$('#vocabListenCounter');if(el) el.textContent=(session.index+1)+'/'+session.items.length;
    el=runtimeEnv.$('#vocabListenProgress');if(el) el.style.width=Math.round(((session.index+1)/session.items.length)*100)+'%';
    el=runtimeEnv.$('#vocabListenStatus');if(el) el.textContent=statusText||(session.playing?'Đang phát':session.paused?'Đã tạm dừng':'Sẵn sàng');
    var play=runtimeEnv.$('#vocabListenPlay');
    if(play) play.innerHTML=icon(session.playing?'pause':'play')+'<span>'+(session.playing?'Tạm dừng':session.paused?'Tiếp tục':'Bắt đầu nghe')+'</span>';
    runtimeEnv.$$('[data-listen-index]').forEach(function(btn){btn.classList.toggle('active',Number(btn.dataset.listenIndex)===session.index);});
    if('mediaSession' in navigator&&'MediaMetadata' in window){
      try{navigator.mediaSession.metadata=new MediaMetadata({title:item.baseEn||'Language Studio',artist:item.baseVi||'Cụm chủ động',album:'Language Studio · Audio Loop'});}catch(error){}
    }
  }

  function resetQueue(){
    session.playing=false;
    session.paused=false;
    session.items=[];
    session.index=0;
    session.signature='';
    session.token=null;
    if(runtimeEnv&&runtimeEnv.stopSpeech) runtimeEnv.stopSpeech(true);
  }

  function pause(){
    if(!session.playing) return;
    session.playing=false;
    session.paused=true;
    if(runtimeEnv) runtimeEnv.stopSpeech(true);
    update('Đã tạm dừng');
  }

  function move(step){
    if(!runtimeEnv) return;
    var s=settings(runtimeEnv);
    if(!session.items.length){
      session.items=itemsFor(runtimeEnv,s,false);
      session.signature=signature(s);
    }
    if(!session.items.length) return;
    if(session.playing) pause();
    session.index=(session.index+step+session.items.length)%session.items.length;
    session.paused=true;
    update('Sẵn sàng');
  }

  async function start(){
    if(!runtimeEnv) return;
    var s=settings(runtimeEnv);
    var sig=signature(s);
    if(!session.paused||!session.items.length||session.signature!==sig){
      session.items=itemsFor(runtimeEnv,s,true);
      session.index=0;
      session.signature=sig;
    }
    if(!session.items.length){runtimeEnv.toast('Không có cụm phù hợp để nghe.');return;}

    session.token=runtimeEnv.beginAudioSequence();
    var token=session.token;
    session.playing=true;
    session.paused=false;
    update('Đang phát');

    while(session.playing&&runtimeEnv.audioSequenceActive(token)){
      var item=session.items[session.index];
      if(!item) break;
      var repeat=Math.max(1,Number(s.repeat)||3);
      for(var round=0;round<repeat;round++){
        if(!session.playing||!runtimeEnv.audioSequenceActive(token)) return;
        update('Đang nghe · lần '+(round+1)+'/'+repeat);
        await runtimeEnv.speak(item.baseEn,null,Number(s.rate)||0.92,token);
        if(!session.playing||!runtimeEnv.audioSequenceActive(token)) return;
        var gap=Math.max(0,Number(s.gap)||0);
        if(gap) await runtimeEnv.wait(gap);
      }
      if(!session.playing||!runtimeEnv.audioSequenceActive(token)) return;
      if(session.index<session.items.length-1) session.index++;
      else if(s.loop) session.index=0;
      else break;
      update('Đang phát');
    }

    if(runtimeEnv.audioSequenceActive(token)){
      session.playing=false;
      session.paused=false;
      update('Đã nghe hết playlist');
    }
  }

  function bind(env){
    runtimeEnv=env;
    var s=settings(env);

    var play=env.$('#vocabListenPlay');
    if(play) play.addEventListener('click',function(){if(session.playing) pause();else start();});
    var prev=env.$('#vocabListenPrev');if(prev) prev.addEventListener('click',function(){move(-1);});
    var next=env.$('#vocabListenNext');if(next) next.addEventListener('click',function(){move(1);});
    env.$$('[data-listen-index]').forEach(function(btn){
      btn.addEventListener('click',function(){
        if(session.playing) pause();
        session.index=Math.max(0,Number(btn.dataset.listenIndex)||0);
        session.paused=true;
        update('Sẵn sàng');
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
      var node=env.$('#'+row[0]);
      if(!node) return;
      node.addEventListener('change',function(){
        env.state.vocabListenSettings=Object.assign({},env.state.vocabListenSettings);
        env.state.vocabListenSettings[row[1]]=row[2](node.value);
        resetQueue();
        env.saveState();
        env.renderVocab();
      });
    });
    var loop=env.$('#vocabListenLoop');
    if(loop) loop.addEventListener('change',function(){
      env.state.vocabListenSettings=Object.assign({},env.state.vocabListenSettings,{loop:!!loop.checked});
      resetQueue();
      env.saveState();
      env.renderVocab();
    });

    if('mediaSession' in navigator){
      try{
        navigator.mediaSession.setActionHandler('play',function(){if(!session.playing) start();});
        navigator.mediaSession.setActionHandler('pause',pause);
        navigator.mediaSession.setActionHandler('previoustrack',function(){move(-1);});
        navigator.mediaSession.setActionHandler('nexttrack',function(){move(1);});
      }catch(error){}
    }
    update();
  }

  function stop(reset){
    if(session.playing||session.paused){
      session.playing=false;
      session.paused=false;
      if(runtimeEnv&&runtimeEnv.stopSpeech) runtimeEnv.stopSpeech(true);
    }
    if(reset){
      session.items=[];
      session.index=0;
      session.signature='';
      session.token=null;
    }
  }

  window.ChunkListener={screen:screen,bind:bind,stop:stop,setLesson:function(lessonId,state){
    if(!state) return;
    state.vocabListenSettings=Object.assign({},state.vocabListenSettings||{},{lessonId:lessonId,size:'10'});
    session.items=[];session.index=0;session.signature='';session.paused=false;session.playing=false;
  }};
}());
