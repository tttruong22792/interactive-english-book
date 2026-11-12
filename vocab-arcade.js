(function VocabArcadeModule(){
  'use strict';
  const NOISE_WORDS = new Set('the a an and but or with from into onto over under for of to in on at by as is are was were be been being my your our their this that these those some any it i we you they he she me us them something someone somebody one ones can will would should could not do does did have has had'.split(' '));
  const FEATURED = 'appointment reschedule available convenient deadline confirm receipt refund urgent update improve prevent prepare borrow deliver estimate explain discuss choose decide consider arrange contact recommend describe request replace compare repair purchase payment interview reservation cancel postpone schedule invoice equipment instruction requirement solution mistake opportunity responsibility comfortable confident reliable efficient necessary especially eventually immediately regularly frequently carefully probably actually completely usually instead however although therefore meanwhile improve achieve manage handle avoid maintain clarify troubleshooting'.split(' ');
  let env = null, game = null, frame = 0, lastTime = 0, sound = null, viewportListener = null;
  const timers = new Set();
  const $ = (selector) => env && env.root.querySelector(selector);
  function safe(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c];}); }
  function norm(value) {return String(value||'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim();}
  function escapeKey(value) {return encodeURIComponent(value).replace(/%/g,'_');}
  function shuffle(items) {
    const a=items.slice();
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  function store() {
    const s=env.state;
    if(!s.vocabArcade || typeof s.vocabArcade!=='object') s.vocabArcade={best:0,runs:0,hits:0,misses:0,records:{},settings:{type:'chunks',lesson:'en-pattern-001',mode:'meaning',level:'calm',count:12,audio:true}};
    if(!s.vocabArcade.records) s.vocabArcade.records={};
    if(!s.vocabArcade.settings) s.vocabArcade.settings={type:'chunks',lesson:'en-pattern-001',mode:'meaning',level:'calm',count:12,audio:true};
    return s.vocabArcade;
  }
  function packs() {return window.ACTIVE_STUDY_PACK_LIST||[];}
  function dictionary() {return window.CORE_DICTIONARY||{};}
  function chunks(lesson) {
    const selected=packs().filter(p=>lesson==='all'||lesson==='review'||p.lessonId===lesson);
    const out=[], seen=new Set();
    for(const pack of selected){
      const cards=window.VocabularyTrainer && window.VocabularyTrainer.studyChunks ? window.VocabularyTrainer.studyChunks(pack) : [];
      for(const card of cards){
        if(card.kind==='building'||!card.baseEn||!card.baseVi) continue;
        const en=String(card.baseEn).trim(), vi=String(card.baseVi).trim();
        if(!/^[a-z][a-z'’ -]+$/i.test(en)||en.length>45||vi.length>70) continue;
        const k=norm(en);
        if(seen.has(k)) continue;
        seen.add(k);
        out.push({id:'chunk:'+escapeKey(k),en,vi,kind:'chunk',lessonId:pack.lessonId});
      }
    }
    return out;
  }
  function words(lesson){
    const d=dictionary(), out=[], seen=new Set();
    let candidates;
    if(lesson==='all'||lesson==='review') {
      candidates=FEATURED.concat(packs().flatMap(p=>(p.activeChunks||[]).flatMap(c=>String(c[0]||'').toLowerCase().split(/[^a-z]+/))));
    } else {
      const one=packs().find(p=>p.lessonId===lesson);
      candidates=(one ? [...(one.activeChunks||[]),...(one.recognitionChunks||[])].flatMap(row=>String(row[0]||'').toLowerCase().split(/[^a-z]+/)) : []).concat(FEATURED);
    }
    for(const word of candidates){
      if(seen.has(word)||NOISE_WORDS.has(word)||word.length<3||word.length>18||!/^[a-z]+$/.test(word)) continue;
      const row=d[word]; if(!Array.isArray(row)||!row[1]) continue;
      const vi=String(row[1]).split(/[;；]/)[0].replace(/\([^)]*\)/g,'').trim();
      if(vi.length<2||vi.length>54||/^[a-z0-9 /]+$/i.test(vi)) continue;
      seen.add(word);
      out.push({id:'word:'+word,en:word,vi,kind:'word',lessonId:lesson});
    }
    return out;
  }
  function available(type,lesson){
    let list=type==='words'?words(lesson):chunks(lesson);
    if(lesson==='review'){
      const records=store().records;
      list=list.filter(item=>{const rec=records[item.id];return rec && (rec.wrong>0 || rec.due<=Date.now()) && rec.correct<Math.max(2,rec.wrong*2);});
    }
    return list;
  }
  function schedule(fn,ms){const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);}
  function cancelTimers(){for(const id of timers)clearTimeout(id);timers.clear();}
  function stopFrame(){if(frame)cancelAnimationFrame(frame);frame=0;}
  function speak(text){if(!text)return;try{env.speak(text);}catch(e){}}
  function beep(ok){
    if(!game || !game.settings.audio)return;
    try {
      const Ctx=window.AudioContext||window.webkitAudioContext;
      if(!Ctx)return;
      sound=sound||new Ctx();
      if(sound.state==='suspended')sound.resume().catch(()=>{});
      const osc=sound.createOscillator(),gain=sound.createGain(),now=sound.currentTime;
      osc.type=ok?'sine':'triangle';
      osc.frequency.setValueAtTime(ok?650:195,now);
      osc.frequency.exponentialRampToValueAtTime(ok?1100:100,now+.12);
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(.11,now+.014);
      gain.gain.exponentialRampToValueAtTime(.0001,now+.18);
      osc.connect(gain).connect(sound.destination);osc.start(now);osc.stop(now+.2);
    }catch(e){}
  }
  function rank(items){
    const records=store().records;
    const due=items.filter(item=>records[item.id]&&records[item.id].due<=Date.now());
    const fresh=items.filter(item=>!records[item.id]);
    const practiced=items.filter(item=>records[item.id]&&records[item.id].due>Date.now());
    return shuffle(due).concat(shuffle(fresh),shuffle(practiced));
  }
  function settingsHTML(){
    const opts=store().settings, ps=packs();
    const stats=store();
    const options=['<option value="all">Tất cả 80 mẫu câu</option>','<option value="review">Ôn những từ còn yếu</option>'].concat(ps.map(p=>'<option value="'+safe(p.lessonId)+'">Day '+String(p.order||1).padStart(2,'0')+' · '+safe(p.pattern||'')+'</option>')).join('');
    return '<section class="va-app va-menu">'+
      '<div class="va-topline"><span class="va-chip">LANGUAGE STUDIO / ARCADE</span><a href="#vocab" class="va-back">← Về Cụm chủ động</a></div>'+
      '<div class="va-intro"><div><span class="va-overline">LEARN • RECALL • REPEAT</span><h1>Word <em>Blaster.</em></h1><p>Biến từ vựng thành phản xạ. Nhìn nghĩa, gõ đáp án, bắn mục tiêu — sau mỗi lượt, game tự nhớ những từ bạn cần ôn.</p></div><div class="va-preview" aria-hidden="true"><div class="va-planet"></div><span class="va-preview-target">make a reservation</span><div class="va-preview-ship">▲</div><i></i></div></div>'+
      '<div class="va-stats-strip"><div><strong>'+Number(stats.runs||0)+'</strong><span>Lượt đã chơi</span></div><div><strong>'+Number(stats.hits||0)+'</strong><span>Mục tiêu trúng</span></div><div><strong>'+Number(stats.best||0)+'</strong><span>Điểm cao nhất</span></div></div>'+
      '<div class="va-panel"><div class="va-section-head"><span>01 / THIẾT LẬP</span><h2>Chuẩn bị nhiệm vụ</h2></div>'+
      '<div class="va-fieldgrid"><label class="va-field">Nội dung<select id="va-type"><option value="chunks">Cụm từ thực tế (Chunk)</option><option value="words">Từ vựng riêng lẻ</option></select></label>'+
      '<label class="va-field">Nguồn học<select id="va-lesson">'+options+'</select></label>'+
      '<label class="va-field">Cách chơi<select id="va-mode"><option value="meaning">Nhìn tiếng Việt → gõ tiếng Anh</option><option value="copy">Nhìn tiếng Anh → gõ nhanh</option></select></label>'+
      '<label class="va-field">Tốc độ<select id="va-level"><option value="calm">Thư giãn · dễ</option><option value="normal">Thử thách · vừa</option><option value="fast">Phản xạ · nhanh</option></select></label>'+
      '<label class="va-field">Số mục tiêu<select id="va-count"><option value="8">8 mục tiêu</option><option value="12">12 mục tiêu</option><option value="20">20 mục tiêu</option></select></label>'+
      '<label class="va-check"><input id="va-audio" type="checkbox"><span>Hiệu ứng âm thanh</span></label></div>'+
      '<div id="va-availability" class="va-availability" aria-live="polite"></div>'+
      '<button class="va-start" id="va-start" type="button">Bắt đầu nhiệm vụ <span>↗</span></button>'+
      '<p class="va-note">Có thể chơi bằng bàn phím hoặc điện thoại. Game lưu kết quả trong tiến độ học trên thiết bị; không tự đánh dấu một từ đã thuộc chỉ vì bắn trúng một lần.</p></div></section>';
  }
  function menu(){
    stopFrame();cancelTimers();game=null;
    env.setHeader('English › Vocabulary Arcade','Game từ vựng');
    env.root.innerHTML=settingsHTML();
    const opt=store().settings;
    $('#va-type').value=opt.type||'chunks';
    $('#va-lesson').value=opt.lesson||'en-pattern-001';
    $('#va-mode').value=opt.mode||'meaning';
    $('#va-level').value=opt.level||'calm';
    $('#va-count').value=String(opt.count||12);
    $('#va-audio').checked=opt.audio!==false;
    function refresh(){
      const type=$('#va-type').value,lesson=$('#va-lesson').value,count=available(type,lesson).length;
      const enough=count>0;
      $('#va-availability').textContent=enough?'Đã tìm thấy '+count+' mục tiêu từ kho dữ liệu hiện tại.':'Chưa có từ cần ôn trong bộ lọc này. Hãy chọn bài khác hoặc chơi Tất cả.';
      $('#va-start').disabled=!enough;
    }
    ['va-type','va-lesson'].forEach(id=>$('#'+id).addEventListener('change',refresh));
    refresh();
    $('#va-start').addEventListener('click',function(){
      const st={type:$('#va-type').value,lesson:$('#va-lesson').value,mode:$('#va-mode').value,level:$('#va-level').value,count:Number($('#va-count').value),audio:$('#va-audio').checked};
      store().settings=st;env.saveState();start(st);
    });
  }
  function iconShip(){
    return '<svg viewBox="0 0 92 100" aria-hidden="true"><defs><linearGradient id="vaShipG" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b1f8ff"/><stop offset="1" stop-color="#5685ff"/></linearGradient></defs><path d="M46 4 15 81 46 66 77 81Z" fill="url(#vaShipG)" stroke="#d8ffff" stroke-width="2"/><path d="M46 9v53" stroke="#fff" stroke-width="4" opacity=".5"/><path d="M35 75 46 97 57 75" fill="#ffa358"/></svg>';
  }
  function stage(){
    env.root.innerHTML='<section class="va-app va-in-game">'+
      '<div class="va-topline"><span class="va-chip">WORD BLASTER / MISSION</span><button id="va-exit" type="button" class="va-back">✕ Thoát</button></div>'+
      '<div class="va-hud"><div><span>SCORE</span><strong id="va-score">0000</strong></div><div><span>COMBO</span><strong id="va-combo">×1</strong></div><div><span>ĐÃ BẮN</span><strong id="va-progress">0/'+game.total+'</strong></div><div><span>GIÁP</span><strong id="va-life">♥ ♥ ♥ ♥</strong></div></div>'+
      '<div class="va-stage" id="va-stage" aria-label="Chiến trường từ vựng"><div class="va-stars va-stars-a"></div><div class="va-stars va-stars-b"></div><div class="va-stage-planet"></div><div id="va-targets"></div><div class="va-ship" aria-hidden="true">'+iconShip()+'</div><div id="va-fx"></div><div id="va-overlay" class="va-overlay" hidden></div></div>'+
      '<div class="va-transport"><span id="va-feedback" aria-live="polite">Gõ từ hoặc cụm tiếng Anh của mục tiêu để bắn.</span><button type="button" id="va-pause">Ⅱ Tạm dừng</button></div>'+
      '<form id="va-form" class="va-console"><div class="va-console-input"><span aria-hidden="true">⌨</span><input id="va-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" aria-label="Nhập tiếng Anh" placeholder="Nhập đáp án tiếng Anh…" maxlength="80"></div><button id="va-fire" type="submit">BẮN <span>➜</span></button></form>'+
      '<div class="va-game-help"><span>Gõ đúng sẽ tự bắn · Enter để kiểm tra · Chạm mục tiêu để nghe</span><button type="button" id="va-hint">Gợi ý</button></div></section>';
    $('#va-form').addEventListener('submit',function(e){e.preventDefault();submit(true);});
    $('#va-input').addEventListener('input',function(){submit(false);});
    $('#va-pause').onclick=togglePause;
    $('#va-exit').onclick=function(){if(game && game.hits>0 && !window.confirm('Thoát lượt chơi? Điểm và tiến độ của lượt đang chơi sẽ được lưu.'))return;finish(true);};
    $('#va-hint').onclick=function(){
      if(!game || game.phase!=='running')return;
      const first=game.active[0];if(!first)return;
      first.hinted=true;
      $('#va-feedback').textContent='Gợi ý: '+first.item.en.slice(0,Math.min(3,first.item.en.length))+'… ('+first.item.en.length+' ký tự)';
      first.node.classList.add('va-glow');
    };
    viewportListener=function(){
      if(!env)return;
      const limited=window.visualViewport && window.visualViewport.height < window.innerHeight*0.72;
      env.root.classList.toggle('va-keyboard',!!limited);
    };
    if(window.visualViewport)window.visualViewport.addEventListener('resize',viewportListener);
    updateHud();
  }
  function start(settings){
    const selected=rank(available(settings.type,settings.lesson)).slice(0,settings.count);
    if(!selected.length){menu();return;}
    stopFrame();cancelTimers();
    game={settings,queue:selected.slice(),active:[],total:selected.length,shots:0,hits:0,misses:0,mistypes:0,combo:0,score:0,lives:4,phase:'running',errors:[],serial:0,started:Date.now()};
    stage();
    for(let i=0;i<Math.min(3,selected.length);i++)spawn(-i*.2);
    lastTime=0;frame=requestAnimationFrame(tick);
    $('#va-input').focus({preventScroll:true});
  }
  function spawn(offset){
    if(!game||!game.queue.length)return;
    const item=game.queue.shift(), id=++game.serial;
    const lane=(id+game.total)%3;
    const el=document.createElement('button');
    el.type='button';el.className='va-target';el.dataset.id=String(id);
    const label=game.settings.mode==='copy'?item.en:item.vi;
    el.innerHTML='<small>'+(item.kind==='chunk'?'CHUNK':'WORD')+' <span aria-hidden="true">●</span> '+(game.settings.mode==='copy'?'TYPE':'DỊCH')+'</small><strong>'+safe(label)+'</strong><span class="va-target-sound">◖))</span>';
    el.addEventListener('click',function(){speak(item.en);$('#va-input')?.focus({preventScroll:true});});
    $('#va-targets').appendChild(el);
    const target={id,item,node:el,progress:offset,x:[.17,.5,.83][lane],lane,hinted:false};
    game.active.push(target);
    updatePositions();
  }
  function updatePositions(){
    if(!game)return;
    for(const t of game.active){
      const wave=Math.sin(t.progress*6+t.id*2)*.018;
      t.node.style.left=((t.x+wave)*100)+'%';
      t.node.style.top=(8+t.progress*82)+'%';
    }
  }
  function tick(time){
    if(!game||game.phase!=='running')return;
    if(lastTime===0)lastTime=time;
    const dt=Math.min(65,time-lastTime);lastTime=time;
    const duration={calm:26000,normal:18500,fast:12500}[game.settings.level]||26000;
    const factor=1+Math.min(.5,game.hits*.025);
    const expired=[];
    for(const t of game.active){
      t.progress += dt/duration*factor;
      if(t.progress>.92)expired.push(t);
    }
    updatePositions();
    for(const t of expired)miss(t);
    if(game.phase==='running')frame=requestAnimationFrame(tick);
  }
  function record(item,correct){
    const s=store(), r=s.records[item.id]||{correct:0,wrong:0,due:0};
    if(correct){r.correct++;r.due=Date.now()+(r.correct>2?3:1)*86400000;s.hits++;}
    else {r.wrong++;r.due=Date.now();s.misses++;}
    r.last=Date.now();s.records[item.id]=r;
    env.saveState();
  }
  function updateHud(){
    if(!game)return;
    $('#va-score').textContent=String(game.score).padStart(4,'0');
    $('#va-combo').textContent='×'+Math.max(1,game.combo);
    $('#va-progress').textContent=game.shots+'/'+game.total;
    $('#va-life').textContent='♥ '.repeat(game.lives).trim()+' ♡'.repeat(Math.max(0,4-game.lives));
  }
  function laser(target){
    const fx=$('#va-fx'),stageEl=$('#va-stage');if(!fx||!stageEl)return;
    const root=stageEl.getBoundingClientRect(),hit=target.node.getBoundingClientRect();
    const x1=root.width*.5,y1=root.height*.83,x2=hit.left-root.left+hit.width*.5,y2=hit.top-root.top+hit.height*.5;
    const line=document.createElement('div');
    line.className='va-beam';line.style.left=x1+'px';line.style.top=y1+'px';
    line.style.width=Math.hypot(x2-x1,y2-y1)+'px';
    line.style.transform='rotate('+Math.atan2(y2-y1,x2-x1)+'rad)';
    fx.appendChild(line);schedule(()=>line.remove(),230);
  }
  function consume(target,correct){
    if(!game||game.phase!=='running'||!game.active.includes(target))return;
    const current=game.active.indexOf(target);game.active.splice(current,1);
    game.shots++;if(correct){
      game.hits++;game.combo++;
      const bonus=Math.min(150,game.combo*12)+Math.floor((1-Math.max(0,target.progress)) *45);
      game.score+=100+bonus-(target.hinted?45:0);
      target.node.classList.add('va-hit');laser(target);beep(true);
      $('#va-feedback').textContent='Chính xác! '+target.item.en+' — '+target.item.vi;
      record(target.item,true);
    } else {
      game.misses++;game.combo=0;game.lives=Math.max(0,game.lives-1);beep(false);
      game.errors.push(target.item);
      target.node.classList.add('va-lost');
      $('#va-feedback').textContent='Cần ôn lại: '+target.item.en+' — '+target.item.vi;
      record(target.item,false);
    }
    schedule(()=>target.node.remove(),310);
    updateHud();
    if(game.lives===0){finish(false);return;}
    if(game.queue.length)spawn(-.22);
    if(!game.queue.length && !game.active.length){finish(false);return;}
    if(game.settings.mode==='meaning' && !correct){} 
  }
  function miss(target){consume(target,false);}
  function shoot(target){
    if(!game||game.phase!=='running')return;
    consume(target,true);
    const input=$('#va-input');if(input){input.value='';input.classList.remove('va-wrong');}
  }
  function submit(isEnter){
    if(!game||game.phase!=='running')return;
    const input=$('#va-input');if(!input)return;
    const value=norm(input.value);input.classList.remove('va-wrong');
    if(!value)return;
    const hits=game.active.filter(t=>norm(t.item.en)===value);
    if(hits.length){shoot(hits[0]);return;}
    const starts=game.active.filter(t=>norm(t.item.en).startsWith(value));
    for(const t of game.active)t.node.classList.toggle('va-glow',starts.includes(t));
    if(isEnter){
      game.mistypes++;game.combo=0;beep(false);input.classList.add('va-wrong');
      $('#va-feedback').textContent='Chưa đúng. Thử lại hoặc nhấn Gợi ý.';
      updateHud();
    }
  }
  function togglePause(){
    if(!game||game.phase==='finished')return;
    const overlay=$('#va-overlay'),input=$('#va-input');
    if(game.phase==='running'){
      game.phase='paused';stopFrame();lastTime=0;
      overlay.hidden=false;overlay.innerHTML='<div class="va-pause-card"><span>ĐÃ TẠM DỪNG</span><h2>Giữ nhịp học của bạn.</h2><p>Bạn có thể tiếp tục bất cứ lúc nào.</p><button type="button" id="va-resume">Tiếp tục chơi →</button></div>';
      $('#va-resume').onclick=togglePause;$('#va-pause').textContent='▶ Tiếp tục';if(input)input.blur();
    }else{
      game.phase='running';overlay.hidden=true;overlay.innerHTML='';$('#va-pause').textContent='Ⅱ Tạm dừng';lastTime=0;frame=requestAnimationFrame(tick);input?.focus({preventScroll:true});
    }
  }
  function finish(abandoned){
    if(!game){menu();return;}
    stopFrame();cancelTimers();lastTime=0;
    const result=game,stats=store();
    stats.runs++;stats.best=Math.max(stats.best||0,result.score);
    stats.last={date:Date.now(),score:result.score,hits:result.hits,misses:result.misses,mistypes:result.mistypes,total:result.total,level:result.settings.level,type:result.settings.type};
    env.saveState();
    game.phase='finished';
    if(window.visualViewport && viewportListener)window.visualViewport.removeEventListener('resize',viewportListener);
    viewportListener=null;env.root.classList.remove('va-keyboard');
    const uniq=[...new Map(result.errors.map(e=>[e.id,e])).values()];
    const accuracy=result.shots?Math.round(result.hits/result.shots*100):0;
    env.root.innerHTML='<section class="va-app va-results"><div class="va-topline"><span class="va-chip">MISSION / COMPLETE</span><a href="#vocab" class="va-back">← Cụm chủ động</a></div>'+
      '<div class="va-result-head"><span>MISSION '+(abandoned?'STOPPED':'COMPLETED')+'</span><h1>'+(abandoned?'Đã lưu lượt chơi.':'Nhiệm vụ hoàn tất!')+'</h1><p>Trò chơi là một phần luyện nhớ chủ động. Hãy ôn lại các mục tiêu bỏ lỡ trước khi tăng tốc.</p></div>'+
      '<div class="va-result-metrics"><div><span>ĐIỂM SỐ</span><strong>'+result.score+'</strong></div><div><span>CHÍNH XÁC</span><strong>'+accuracy+'%</strong></div><div><span>BẮN TRÚNG</span><strong>'+result.hits+'/'+result.shots+'</strong></div><div><span>ĐÁNH MÁY SAI</span><strong>'+result.mistypes+'</strong></div></div>'+
      '<div class="va-panel"><div class="va-section-head"><span>REVIEW</span><h2>'+(uniq.length?'Những mục tiêu cần ôn lại':'Không có mục tiêu nào bị bỏ lỡ')+'</h2></div>'+
      (uniq.length?'<div class="va-review-list">'+uniq.map(x=>'<div class="va-review-row"><div><strong>'+safe(x.en)+'</strong><span>'+safe(x.vi)+'</span></div><button type="button" data-review="'+safe(x.en)+'" aria-label="Nghe '+safe(x.en)+'">◖)) Nghe</button></div>').join('')+'</div>':'<p class="va-note">Tốt! Hãy thử mức khó hơn hoặc chuyển sang nhìn nghĩa tiếng Việt.</p>')+
      '<div class="va-result-actions"><button type="button" id="va-replay" class="va-start">Chơi lại <span>↗</span></button><button type="button" id="va-settings" class="va-secondary">Đổi chế độ</button></div></div></section>';
    $('#va-replay').onclick=function(){start(result.settings);};
    $('#va-settings').onclick=menu;
    env.root.querySelectorAll('[data-review]').forEach(el=>el.onclick=()=>speak(el.dataset.review));
  }
  function mount(options){
    destroy();
    env=options;
    menu();
    document.addEventListener('visibilitychange',onVisibility);
  }
  function onVisibility(){
    if(document.hidden && game&&game.phase==='running')togglePause();
  }
  function destroy(){
    stopFrame();cancelTimers();
    if(window.visualViewport && viewportListener)window.visualViewport.removeEventListener('resize',viewportListener);
    viewportListener=null;document.removeEventListener('visibilitychange',onVisibility);
    if(env)env.root.classList.remove('va-keyboard');
    game=null;env=null;
  }
  window.VocabArcade={mount,destroy,available};
})();