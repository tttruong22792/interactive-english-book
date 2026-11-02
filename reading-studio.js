(function(){
  "use strict";
  const speakingProgram=(window.SPEAKING_PROGRAM||[]).slice();
  const isSpeakingProgram=speakingProgram.length===70;
  // Keep the old graded-reader source and progress untouched for rollback.
  const stories=isSpeakingProgram?speakingProgram:(window.READING_STORIES||[]).slice();
  const storyById=new Map(stories.map(s=>[s.id,s]));
  const LEVELS=isSpeakingProgram?["all",...Array.from({length:14},(_,i)=>"W"+String(i+1).padStart(2,"0"))]:["all","A1","A2","B1","B2"];
  let env=null,activeStory=null,playing=false,playRun=0,playToken=0;
  let levelFilter="all",searchQuery="";
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const esc=text=>String(text??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const safeId=id=>storyById.has(id)?id:"";
  const clean=text=>String(text||"").toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9'\s]/g," ").replace(/\s+/g," ").trim();
  function settings(){
    const state=env.state;
    if(!state.readingStudio||typeof state.readingStudio!=="object")state.readingStudio={};
    if(!state.readingStudio.items||typeof state.readingStudio.items!=="object")state.readingStudio.items={};
    state.readingStudio.rate=Number(state.readingStudio.rate)||.88;
    if(typeof state.readingStudio.showVi!=="boolean")state.readingStudio.showVi=false;
    if(!["read","chunks",isSpeakingProgram?"practice":"quiz"].includes(state.readingStudio.tab))state.readingStudio.tab="read";
    return state.readingStudio;
  }
  function progress(story){
    const state=settings();
    if(!state.items[story.id])state.items[story.id]={index:0,completed:false,answers:{},updatedAt:0};
    return state.items[story.id];
  }
  function remember(story){
    progress(story).updatedAt=Date.now();
    env.saveState();
  }
  function completedCount(){
    const item=settings().items;
    return stories.filter(story=>item[story.id]?.completed).length;
  }
  function stop(){
    playRun++;
    playing=false;
    if(env&&playToken)env.stopSpeech();
    playToken=0;
    updatePlayer();
  }
  function updatePlayer(){
    if(!env||!activeStory)return;
    const p=progress(activeStory);
    const start=$("#readingPlay");
    if(start){
      start.textContent=playing?"⏸ Tạm dừng":"▶ Nghe tiếp";
      start.setAttribute("aria-pressed",String(playing));
    }
    const counter=$("#readingPosition");
    if(counter)counter.textContent=(Math.min(activeStory.lines.length,Math.max(0,p.index+1)))+" / "+activeStory.lines.length;
    const bar=$("#readingPositionBar");
    if(bar)bar.style.width=Math.round((p.index+1)/Math.max(1,activeStory.lines.length)*100)+"%";
    $$(".reader-line").forEach((node,i)=>{
      const isActive=i===p.index;
      node.classList.toggle("active",isActive);
      node.setAttribute("aria-current",isActive?"true":"false");
    });
  }
  async function playFrom(first){
    if(!activeStory||!env)return;
    const story=activeStory,position=progress(story);
    stop();
    playing=true;const run=playRun;
    playToken=env.beginAudioSequence();
    updatePlayer();
    for(let i=first;i<story.lines.length;i++){
      if(run!==playRun||!env.audioSequenceActive(playToken)||activeStory!==story)return;
      position.index=i;
      remember(story);
      updatePlayer();
      const line=$(".reader-line[data-index='"+i+"']");
      if(line?.scrollIntoView)line.scrollIntoView({block:"nearest",behavior:"smooth"});
      const highlighted=line?.querySelector(".reading-en")||null;
      try{await env.speak(story.lines[i][0],highlighted,settings().rate,playToken);}
      catch(error){console.warn("Reading audio could not be played",error);env.toast("Chưa phát được âm thanh. Hãy thử lại hoặc dùng giọng trình duyệt.");break;}
      if(run!==playRun||!env.audioSequenceActive(playToken)||activeStory!==story)return;
      if(i===story.lines.length-1){
        position.completed=true;
        remember(story);
      }
    }
    if(run===playRun){playing=false;playToken=0;updatePlayer();if(progress(story).completed)env.toast("Đã hoàn thành phần nghe! Hãy thử trả lời câu hỏi.");}
  }
  function buildCorpus(){
    const t=window.VocabularyTrainer;if(!t?.packs)return new Map();
    const map=new Map();
    for(const pack of t.packs()){
      for(const card of [...t.studyChunks(pack).filter(c=>c.kind!=="building"),...t.usageSupplementChunks(pack)]){
        const key=clean(card.baseEn);
        if(key&&!map.has(key))map.set(key,{card,pack});
      }
    }
    return map;
  }
  let corpus=null;
  function findChunks(story){
    if(!corpus)corpus=buildCorpus();
    const phrases=story.targetChunks||[],sentences=story.lines.map(x=>x[0]).join(" ").toLowerCase();
    return phrases.map((name,index)=>{
      const lower=clean(name);
      const owned=corpus.get(lower)||null;
      const seen=sentences.includes(String(name).toLowerCase());
      const meaning=window.READING_STORY_CHUNK_VI?.[story.id]?.[index]||owned?.card?.baseVi||"";
      const savedKey="p:"+name.toLowerCase().replace(/\s+/g," ").trim();
      return {name,owned,seen,meaning,savedKey};
    });
  }
  function renderLibrary(){
    activeStory=null;
    env.setHeader(isSpeakingProgram?"100-Day English":"English › Đọc & Nghe",isSpeakingProgram?"70 bài nói theo ngày":"Thư viện bài đọc");
    const root=env.main;
    const filtered=stories.filter(story=>
      (levelFilter==="all"||story.level===levelFilter)&&
      (!searchQuery||[story.title,story.viTitle,story.topic,story.level,story.weekTitle,story.weekVi,"Day "+story.day].join(" ").toLowerCase().includes(searchQuery))
    );
    const grouped=settings().items;
    root.innerHTML='<section class="reading-shell reading-library">'+
      '<header class="reading-library-head"><div><span class="reading-eyebrow">READ · LISTEN · RECALL</span>'+
      '<h1>'+(isSpeakingProgram?'100-Day English Speaking Program':'Đọc & Nghe')+'</h1>'+
      '<p>'+(isSpeakingProgram?'70 bài nói thực tế · 14 tuần · 5 bài mới và 2 ngày ôn mỗi tuần. Đọc, nghe từng câu, luyện nói và học cụm từ.':'30 câu chuyện tiếng Anh thực tế. Nghe, chạm từ để hiểu, rồi tự trả lời câu hỏi.')+'</p></div>'+
      '<div class="reading-totals"><strong>'+completedCount()+'<small> / '+stories.length+'</small></strong><span>Bài hoàn thành</span></div></header>'+
      '<div class="reading-library-toolbar">'+
      (isSpeakingProgram?'<label class="reading-week-select"><span>Chọn tuần</span><select id="readingWeekSelect" aria-label="Lọc theo tuần">'+
       LEVELS.map(v=>'<option value="'+v+'" '+(levelFilter===v?'selected':'')+'>'+(v==='all'?'Tất cả 14 tuần':'Tuần '+Number(v.slice(1)))+'</option>').join('')+'</select></label>':
       '<div class="reading-levels" role="group" aria-label="Lọc trình độ">'+
       LEVELS.map(v=>'<button type="button" data-reading-level="'+v+'" class="'+(levelFilter===v?'active':'')+'">'+(v==="all"?"Tất cả":v)+'</button>').join('')+'</div>')+
      '<label class="reading-search"><span class="sr-only">Tìm bài đọc</span><input id="readingSearch" type="search" placeholder="Tìm Day 01, cuộc họp, SCADA..." value="'+esc(searchQuery)+'"></label></div>'+
      '<div class="reading-library-list" id="readingLibraryList">'+(filtered.length?filtered.map((story,idx)=>{
        const p=grouped[story.id]||{};
        const weekHeading=isSpeakingProgram&&(idx===0||filtered[idx-1].week!==story.week)?
          '<div class="reading-week-heading"><strong>WEEK '+String(story.week).padStart(2,"0")+' · '+esc(story.weekTitle)+'</strong>'+
          '<small>'+esc(story.weekVi)+' · 5 bài mới + 2 ngày ôn</small></div>':'';
        const length=story.lines.map(row=>row[0].split(/\s+/).length).reduce((a,b)=>a+b,0);
        return weekHeading+'<button type="button" class="reading-story-card" data-open-story="'+esc(story.id)+'">'+
          '<span class="reading-story-index">'+String(stories.indexOf(story)+1).padStart(2,"0")+'</span>'+
          '<span class="reading-story-main"><span class="reading-story-meta">'+(isSpeakingProgram?'Day '+String(story.day).padStart(2,"0")+' · ':esc(story.level)+' · ')+length+' từ</span>'+
          '<strong>'+esc(story.title)+'</strong><small>'+esc(story.viTitle)+'</small></span>'+
          '<span class="reading-story-status">'+(p.practiced&&isSpeakingProgram?'✓ Đã luyện nói':p.completed?'✓ Đã nghe':p.updatedAt?'↗ Tiếp tục':'Bắt đầu')+'</span></button>';
      }).join(''):'<div class="reading-empty">Chưa có bài nào phù hợp. Hãy chọn cấp độ khác.</div>')+'</div></section>';
    if(isSpeakingProgram){
      const picker=$("#readingWeekSelect",root);
      if(picker)picker.onchange=()=>{levelFilter=picker.value;renderLibrary();};
    }else $("[data-reading-level]",root).forEach(btn=>btn.onclick=()=>{levelFilter=btn.dataset.readingLevel;renderLibrary();});
    const search=$("#readingSearch",root);
    if(search)search.oninput=()=>{
      searchQuery=search.value.toLowerCase().trim();
      const focusPos=search.selectionStart;
      renderLibrary();
      const target=$("#readingSearch",root);
      target?.focus({preventScroll:true});
      try{target?.setSelectionRange(focusPos,focusPos);}catch(e){}
    };
    $$("[data-open-story]",root).forEach(btn=>btn.onclick=()=>{location.hash="#reading/"+btn.dataset.openStory;});
  }
  function renderReader(story){
    stop();activeStory=story;
    env.setHeader(isSpeakingProgram?"100-Day English › Day "+String(story.day).padStart(2,"0"):"Đọc & Nghe › "+story.level,story.title);
    const st=settings(),p=progress(story),root=env.main;
    const chunks=findChunks(story);
    const mode=st.tab||"read";
    const totalWords=story.lines.map(row=>row[0].split(/\s+/).length).reduce((a,b)=>a+b,0);
    const tabRows=isSpeakingProgram?[["read","Đọc & Nghe"],["chunks","Cụm đáng học"],["practice","Luyện nói"]]:
      [["read","Bài đọc"],["chunks","Cụm cần chú ý"],["quiz","Hiểu bài"]];
    root.innerHTML='<section class="reading-shell reading-detail" id="readingRoot">'+
      '<header class="reading-detail-head">'+
       '<button class="reading-back" type="button" id="readingBack">← Thư viện</button>'+
       '<div class="reading-detail-title"><span class="reading-eyebrow">'+(isSpeakingProgram?'DAY '+String(story.day).padStart(2,"0")+' · WEEK '+String(story.week).padStart(2,"0"):'BÀI '+String(stories.indexOf(story)+1).padStart(2,"0")+' · '+esc(story.level))+' · '+totalWords+' TỪ</span>'+
       '<h1>'+esc(story.title)+'</h1><p>'+esc(story.viTitle)+'</p></div>'+
       (isSpeakingProgram?'<span class="reading-language-note">Bài nói gốc · tiếng Anh</span>':
       '<button id="readingToggleVi" type="button" class="reading-vi-toggle" aria-pressed="'+st.showVi+'">'+(st.showVi?'Ẩn nghĩa Việt':'Hiện nghĩa Việt')+'</button>')+
      '</header>'+
      '<nav class="reading-subtabs" aria-label="Các bước đọc bài">'+tabRows.map(([id,label])=>
       '<button type="button" data-reading-tab="'+id+'" class="'+(mode===id?'active':'')+'" aria-current="'+(mode===id?'page':'false')+'">'+label+'</button>').join('')+'</nav>'+
      '<div class="reading-detail-body" id="readingBody">'+
      (mode==="read"?'<div class="reading-text-panel" id="readingTextPanel" role="list">'+
        story.lines.map(([en,vi],i)=>'<div class="reader-line '+(i===p.index?'active':'')+'" data-index="'+i+'" role="listitem" aria-current="'+(i===p.index?'true':'false')+'">'+
        '<span class="reader-line-number">'+String(i+1).padStart(2,"0")+'</span>'+
        '<div class="reader-line-copy"><div class="reading-en" lang="en" data-en="'+esc(en)+'"></div>'+
        (st.showVi&&vi?'<div class="reading-vi" lang="vi">'+esc(vi)+'</div>':'')+
        '</div><button class="reader-line-speak" type="button" data-speak-line="'+i+'" aria-label="Nghe câu '+(i+1)+'">♫</button></div>').join('')+
        '</div>'+
        '<aside class="reading-side-panel"><span class="reading-eyebrow">CÁCH LUYỆN</span><h2>'+(isSpeakingProgram?'Nghe → nói → dùng':'Nghe → hiểu → nhớ')+'</h2>'+
        '<p>'+(isSpeakingProgram?'Nghe cả đoạn ở 0.88×, đọc nhại theo từng câu, sau đó tự kể lại. Các câu gốc đang ở tiếng Anh; chạm từ để tra nghĩa.':'Chọn một câu để phát từ câu đó. Bản dịch có thể ẩn để luyện hiểu trực tiếp.')+'</p>'+
        '<div class="reading-tips"><span>① Nghe trọn đoạn và tập bắt nhịp</span><span>② Nhại từng câu, ghi nhớ những cụm mới</span><span>③ Che bản gốc và tự nói lại bằng lời của bạn</span></div>'+
        '<button type="button" class="reading-inline-next" id="readingGoChunks">Xem cụm trong bài →</button></aside>'
       :mode==="chunks"?'<div class="reading-chunk-panel"><h2>Những cụm xuất hiện trong câu chuyện</h2>'+
        '<p>Các cụm này giúp bạn nối kiến thức đã học với tình huống thực tế. Nếu đã có trong Cụm chủ động, chúng sẽ liên kết đúng bài học gốc.</p>'+
        '<div class="reading-chunk-list">'+chunks.map(ch=>'<article class="reading-chunk-card"><div><strong>'+esc(ch.name)+'</strong>'+
           (ch.meaning?'<p>'+esc(ch.meaning)+'</p>':'<p>Cụm dùng trong câu chuyện</p>')+
           '</div><div class="reading-chunk-actions"><button type="button" data-reading-speak="'+esc(ch.name)+'">♫ Nghe</button>'+
           (ch.owned?'<button type="button" data-reading-vocab="'+esc(ch.owned.pack.lessonId)+'">Học trong kho →</button>':
           '<button type="button" data-reading-save="'+esc(ch.name)+'">'+(env.state.saved?.[ch.savedKey]?'★ Đã lưu':'☆ Lưu cụm')+'</button>')+
           '</div></article>').join('')+'</div>'+
        ((story.patterns||[]).length?'<div class="reading-pattern-ref"><h3>Mẫu câu liên quan</h3><div>'+
        (story.patterns||[]).map(n=>'<button data-reading-pattern="'+n+'" type="button">Mẫu '+String(n).padStart(2,"0")+'</button>').join('')+'</div></div>':'')+'</div>'
       :mode==="practice"?'<div class="reading-quiz-panel reading-speaking-practice"><span class="reading-eyebrow">SPEAKING · RETRIEVAL</span>'+
        '<h2>Tự nói lại bài Day '+String(story.day).padStart(2,"0")+'</h2>'+
        '<p>Không cần thuộc từng chữ. Hãy nhớ ý chính và sử dụng lại những cách diễn đạt tự nhiên trong bài.</p>'+
        '<div class="reading-speaking-steps"><p><b>1.</b> Nghe bài trọn vẹn ít nhất một lần.</p>'+
        '<p><b>2.</b> Đọc nhại từng câu với tốc độ 0.75× hoặc 0.88×.</p>'+
        '<p><b>3.</b> Che bản tiếng Anh, tự trình bày lại nội dung trong khoảng 1–2 phút.</p></div>'+
        '<div class="reading-speaking-actions"><button id="readingPracticeListen" type="button">▶ Nghe từ đầu</button>'+
        '<button id="readingPracticeDone" type="button" class="'+(p.practiced?'completed':'')+'">'+(p.practiced?'✓ Đã luyện nói':'Tôi đã tự nói lại bài')+'</button></div>'+
        '<details class="reading-speaking-transcript"><summary>Xem lại nội dung để tự đối chiếu</summary>'+
        '<ol>'+story.lines.map(([en])=>'<li>'+esc(en)+'</li>').join('')+'</ol></details></div>'
       :'<div class="reading-quiz-panel"><span class="reading-eyebrow">COMPREHENSION</span><h2>Bạn hiểu câu chuyện đến đâu?</h2>'+
          '<p>Trả lời theo nội dung đã nghe hoặc đọc, không cần dịch từng từ.</p>'+
          story.questions.map((question,i)=>{
            const chosen=p.answers?.[i];
            return '<fieldset class="reading-question"><legend>'+(i+1)+'. '+esc(question.prompt)+'</legend>'+
              question.choices.map((choice,j)=>'<label class="reading-choice '+(chosen===j?'picked ':'')+(chosen!=null&&j===question.answer?'correct':'')+'">'+
                '<input type="radio" name="readingQuestion'+i+'" data-reading-answer="'+i+'" value="'+j+'" '+(chosen===j?'checked':'')+' />'+esc(choice)+'</label>').join('')+
              (chosen!=null?'<div class="reading-question-feedback">'+(chosen===question.answer?'✓ Chính xác':'Đáp án: '+esc(question.choices[question.answer]))+'</div>':'')+
              '</fieldset>';
          }).join('')+
          '<div class="reading-quiz-result">'+Object.keys(p.answers||{}).length+'/'+story.questions.length+' câu đã trả lời'+
          (Object.keys(p.answers||{}).length===story.questions.length?' · '+story.questions.filter((q,i)=>p.answers[i]===q.answer).length+' câu đúng':'')+'</div>'+
          '<button type="button" class="reading-inline-next" id="readingBackToText">← Đọc lại bài</button></div>')+
      '</div>'+
      '<div class="reading-player">'+
         '<div class="reading-player-meter"><div class="reading-player-progress"><span id="readingPositionBar" style="width:'+Math.round((p.index+1)/story.lines.length*100)+'%"></span></div>'+
         '<small id="readingPosition">'+(p.index+1)+' / '+story.lines.length+'</small></div>'+
         '<div class="reading-player-actions"><button id="readingPrev" type="button" aria-label="Câu trước">⟵</button>'+
         '<button id="readingPlay" type="button" class="reading-player-main" aria-pressed="false">▶ Nghe tiếp</button>'+
         '<button id="readingNext" type="button" aria-label="Câu sau">⟶</button>'+
         '<label class="reading-rate"><span>Tốc độ</span><select id="readingRate"><option value="0.75" '+(st.rate===.75?'selected':'')+'>0.75×</option>'+
         '<option value="0.88" '+(st.rate===.88?'selected':'')+'>0.88×</option>'+
         '<option value="1" '+(st.rate===1?'selected':'')+'>1×</option></select></label>'+
         '<button id="readingComplete" type="button" class="reading-mark-complete">'+(isSpeakingProgram?(p.completed?'✓ Đã nghe':'Đánh dấu đã nghe'):(p.completed?'✓ Đã đọc':'Đánh dấu đã đọc'))+'</button></div>'+
      '</div></section>';
    env.hydrateReadingWords?.(root);
    $("#readingBack").onclick=()=>{stop();location.hash="#reading";};
    if(!isSpeakingProgram)$("#readingToggleVi").onclick=()=>{st.showVi=!st.showVi;env.saveState();renderReader(story);};
    $$("[data-reading-tab]").forEach(btn=>btn.onclick=()=>{
      st.tab=btn.dataset.readingTab;env.saveState();renderReader(story);
    });
    if(mode==="read"){
      $$("[data-speak-line]").forEach(btn=>btn.onclick=()=>void playFrom(+btn.dataset.speakLine));
      $("#readingGoChunks").onclick=()=>{st.tab="chunks";env.saveState();renderReader(story);};
      // Tap a sentence's text (except word tokens) to play it from that point.
      $$(".reader-line-copy").forEach(node=>node.onclick=e=>{if(e.target.closest(".word-token"))return;void playFrom(+node.closest(".reader-line").dataset.index);});
    } else if(mode==="chunks"){
      $$("[data-reading-speak]").forEach(btn=>btn.onclick=()=>env.speak(btn.dataset.readingSpeak));
      $$("[data-reading-save]").forEach(btn=>btn.onclick=()=>{
        const ch=chunks.find(item=>item.name===btn.dataset.readingSave);
        if(!ch)return;
        const added=env.saveReadingPhrase?.(ch.name,ch.meaning,story);
        if(added)btn.textContent="★ Đã lưu";
      });
      $$("[data-reading-vocab]").forEach(btn=>btn.onclick=()=>{
        env.state.vocabHubLessonId=btn.dataset.readingVocab;env.state.vocabHubView="learn";
        env.saveState();location.hash="#vocab";
      });
      $$("[data-reading-pattern]").forEach(btn=>btn.onclick=()=>{location.hash="#lesson/"+btn.dataset.readingPattern;});
    }else if(mode==="practice"){
      $("#readingPracticeListen").onclick=()=>void playFrom(0);
      $("#readingPracticeDone").onclick=()=>{p.practiced=!p.practiced;remember(story);renderReader(story);};
    } else {
      $$("[data-reading-answer]").forEach(input=>input.onchange=()=>{
        p.answers=p.answers||{};p.answers[+input.dataset.readingAnswer]=+input.value;remember(story);
        renderReader(story);
      });
      $("#readingBackToText").onclick=()=>{st.tab="read";env.saveState();renderReader(story);};
    }
    $("#readingPrev").onclick=()=>{stop();p.index=Math.max(0,p.index-1);remember(story);updatePlayer();};
    $("#readingNext").onclick=()=>{stop();p.index=Math.min(story.lines.length-1,p.index+1);remember(story);updatePlayer();};
    $("#readingPlay").onclick=()=>{if(playing)stop();else void playFrom(p.index);};
    $("#readingRate").onchange=e=>{st.rate=Number(e.target.value)||.88;env.saveState();if(playing)stop();};
    $("#readingComplete").onclick=()=>{p.completed=!p.completed;remember(story);renderReader(story);};
    updatePlayer();
  }
  function render(environment,storyId){
    env=environment;
    if(!stories.length){env.setHeader("English","Đọc & Nghe");env.main.innerHTML='<p>Chưa có nội dung bài đọc.</p>';return;}
    if(safeId(storyId))renderReader(storyById.get(storyId));
    else{stop();renderLibrary();}
  }
  window.ReadingStudio={render,stop,stories,isSpeakingProgram,findChunks:(id)=>storyById.has(id)?findChunks(storyById.get(id)):[]};
})();
