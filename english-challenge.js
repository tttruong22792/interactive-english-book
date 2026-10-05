(function(){
  'use strict';

  var session=null;

  var MODULES={
    all:{label:'Tất cả English',short:'ALL'},
    patterns:{label:'Mẫu câu',short:'MẪU CÂU'},
    chunks:{label:'Cụm chủ động',short:'CHUNK'},
    tenses:{label:'Các thì',short:'TENSES'},
    shadowing:{label:'Shadowing',short:'SHADOWING'},
    practice:{label:'Luyện tập',short:'PRACTICE'}
  };

  function esc(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function escAttr(value){return esc(value);}
  function norm(value){
    return String(value||'')
      .toLowerCase()
      .replace(/[’]/g,"'")
      .replace(/[^a-z0-9' ]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }
  function normVi(value){
    return String(value||'')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/đ/g,'d')
      .replace(/[^a-z0-9 ]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }
  function words(value){
    return String(value||'').replace(/[’]/g,"'").match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g)||[];
  }
  function validMeaning(vi){
    var text=String(vi||'').trim();
    if(!text) return false;
    if(/^(nói rõ|nói tự nhiên|đọc chậm|đọc tự nhiên|đọc|ipa\b)/i.test(text)) return false;
    if(text.indexOf('→')>=0) return false;
    return true;
  }
  function stateFor(env){
    if(!env.state.englishChallenge || typeof env.state.englishChallenge!=='object'){
      env.state.englishChallenge={
        version:1,
        settings:{source:'all',scope:'all',size:'20',order:'weak'},
        progress:{},
        runs:[]
      };
    }
    var s=env.state.englishChallenge;
    s.settings=Object.assign({source:'all',scope:'all',size:'20',order:'weak'},s.settings||{});
    s.progress=s.progress||{};
    s.runs=Array.isArray(s.runs)?s.runs:[];
    return s;
  }
  function save(env){
    if(typeof env.saveState==='function') env.saveState();
  }

  function collect(env){
    var map=new Map();

    function add(en,vi,module,meta){
      en=String(en||'').trim();
      vi=String(vi||'').trim();
      if(!en||!validMeaning(vi)) return;
      var key=norm(en);
      if(!key) return;

      if(!map.has(key)){
        map.set(key,{
          id:'challenge:'+key,
          en:en,
          vi:vi,
          viAlternatives:[vi],
          modules:[],
          lessonIds:[],
          details:[],
          answers:[en]
        });
      }
      var item=map.get(key);
      if(module && item.modules.indexOf(module)<0) item.modules.push(module);
      if(meta&&meta.lessonId && item.lessonIds.indexOf(meta.lessonId)<0) item.lessonIds.push(meta.lessonId);
      if(meta&&meta.detail && item.details.indexOf(meta.detail)<0) item.details.push(meta.detail);
      if(vi && item.viAlternatives.indexOf(vi)<0) item.viAlternatives.push(vi);
      if(en && item.answers.indexOf(en)<0) item.answers.push(en);
    }

    var lessons=env.lessons||[];

    // 1) Pattern lessons: exactly the sentences the lesson module exposes.
    lessons.forEach(function(lesson){
      var rows=env.collectLessonSentences?env.collectLessonSentences(lesson):[];
      rows.forEach(function(row){
        add(
          row.en,
          row.originalVi||row.vi,
          'patterns',
          {lessonId:lesson.id,detail:'Mẫu '+String(lesson.order||'').padStart(2,'0')+' · '+(lesson.title||'')}
        );
      });
    });

    // 2) Practice Center reuses all viable pattern lesson sentences.
    lessons.forEach(function(lesson){
      var rows=env.collectLessonSentences?env.collectLessonSentences(lesson):[];
      rows.forEach(function(row){
        add(
          row.en,
          row.originalVi||row.vi,
          'practice',
          {lessonId:lesson.id,detail:'Luyện tập · '+(lesson.title||'')}
        );
      });
    });

    // 3) Active chunks: model/deep sentences + every one of the five usage examples.
    var packs=window.ACTIVE_STUDY_PACK_LIST||[];
    packs.forEach(function(pack){
      var cards=window.VocabularyTrainer&&window.VocabularyTrainer.studyChunks
        ? window.VocabularyTrainer.studyChunks(pack)
        : [];
      cards.forEach(function(card){
        (card.examples||[]).forEach(function(example){
          add(example.en,example.vi,'chunks',{
            lessonId:pack.lessonId,
            detail:'Cụm chủ động · #'+String(pack.order||'').padStart(2,'0')+' · '+(card.baseEn||'')
          });
        });
        (card.usageExamples||[]).forEach(function(example){
          var en=typeof example==='string'?example:example&&example.en;
          var vi=typeof example==='string'?'':example&&example.vi;
          add(en,vi,'chunks',{
            lessonId:pack.lessonId,
            detail:'5 cách dùng · '+(card.baseEn||'')
          });
        });
      });

      // Keep every deep sentence in the module source, even if it is not one
      // of the three variants selected for a specific card.
      (pack.deepSentences||[]).forEach(function(row){
        if(Array.isArray(row)) add(row[0],row[1],'chunks',{
          lessonId:pack.lessonId,
          detail:'Câu mở rộng · #'+String(pack.order||'').padStart(2,'0')
        });
      });
    });

    // 4) Tenses: every structured example, contrast example and practice answer.
    var guide=window.TENSES_GUIDE||{};
    (guide.tenses||[]).forEach(function(tense){
      (tense.examples||[]).forEach(function(row){
        if(Array.isArray(row)) add(row[0],row[1],'tenses',{detail:tense.vi||tense.name||'Các thì'});
      });
    });
    (guide.keyContrasts||[]).forEach(function(group){
      (group.examples||[]).forEach(function(row){
        if(Array.isArray(row)) add(row[0],row[1],'tenses',{detail:'Đối chiếu · '+(group.title||'')});
      });
    });
    (guide.practice||[]).forEach(function(row){
      add(row.answer,row.prompt,'tenses',{detail:'Bài luyện thì · '+(row.tense||'')});
    });

    // 5) Shadowing: use the exact pool generated by the Shadowing module when
    // possible. Fallback to the legacy collector only if needed.
    lessons.forEach(function(lesson){
      var rows=[];
      if(typeof env.shadowChallengeItems==='function'){
        rows=env.shadowChallengeItems(lesson)||[];
      }else if(typeof env.shadowItemsFromLessons==='function'){
        rows=env.shadowItemsFromLessons([lesson])||[];
      }
      rows.forEach(function(row){
        add(row.en,row.originalVi||row.vi,'shadowing',{
          lessonId:lesson.id,
          detail:'Shadowing · '+(lesson.title||'')
        });
      });
    });

    // Static demonstration sentences that are part of the Shadowing guide.
    [
      ["I'd like to improve my English so that I can communicate better at work.","Tôi muốn cải thiện tiếng Anh để có thể giao tiếp tốt hơn ở nơi làm việc."],
      ["I'd like to learn more about SCADA.","Tôi muốn tìm hiểu thêm về SCADA."],
      ["I'd like to improve my English so that I can understand meetings better.","Tôi muốn cải thiện tiếng Anh để có thể hiểu các cuộc họp tốt hơn."]
    ].forEach(function(row){
      add(row[0],row[1],'shadowing',{detail:'Shadowing · ví dụ hướng dẫn'});
    });

    var items=Array.from(map.values());

    // A Vietnamese prompt can legitimately map to more than one natural English
    // sentence. Accept those alternatives without deleting any example item.
    var byMeaning=new Map();
    items.forEach(function(item){
      item.viAlternatives.forEach(function(vi){
        var key=normVi(vi);
        if(!key) return;
        if(!byMeaning.has(key)) byMeaning.set(key,[]);
        var arr=byMeaning.get(key);
        if(arr.indexOf(item.en)<0) arr.push(item.en);
      });
    });
    items.forEach(function(item){
      var answers=[];
      item.viAlternatives.forEach(function(vi){
        var arr=byMeaning.get(normVi(vi))||[];
        arr.forEach(function(en){if(answers.indexOf(en)<0) answers.push(en);});
      });
      item.answers=answers.length?answers:[item.en];
    });

    return items;
  }

  function countByModule(items,module){
    return items.filter(function(item){return item.modules.indexOf(module)>=0;}).length;
  }

  function currentLessonId(env){
    return String(
      env.state.vocabHubLessonId||
      env.state.vocabTrainerSettings&&env.state.vocabTrainerSettings.lessonId||
      ''
    );
  }

  function scopedItems(env,all,settings){
    var out=all.slice();

    if(settings.source!=='all'){
      out=out.filter(function(item){return item.modules.indexOf(settings.source)>=0;});
    }

    if(settings.scope==='current'){
      var id=currentLessonId(env);
      out=out.filter(function(item){return id && item.lessonIds.indexOf(id)>=0;});
    }else if(settings.scope==='opened'){
      var opened=new Set(
        Object.keys(env.state.lessonVisitsByLesson||{})
          .filter(function(id){return Number(env.state.lessonVisitsByLesson[id]||0)>0;})
      );
      out=out.filter(function(item){
        if(!item.lessonIds.length) return false;
        return item.lessonIds.some(function(id){return opened.has(id);});
      });
    }

    return out;
  }

  function progressFor(env,item){
    var root=stateFor(env);
    var p=root.progress[item.id]||{};
    return {
      seen:Number(p.seen||0),
      correct:Number(p.correct||0),
      firstTry:Number(p.firstTry||0),
      wrong:Number(p.wrong||0),
      hints:Number(p.hints||0),
      totalMs:Number(p.totalMs||0),
      bestMs:Number(p.bestMs||0),
      lastMs:Number(p.lastMs||0),
      streak:Number(p.streak||0),
      lastSeenAt:Number(p.lastSeenAt||0)
    };
  }

  function weakScore(env,item){
    var p=progressFor(env,item);
    var now=Date.now();
    var age=p.lastSeenAt?Math.min(90,(now-p.lastSeenAt)/86400000):90;
    var avg=p.correct?p.totalMs/p.correct:0;
    return (p.seen?0:1000)
      +p.wrong*90
      +p.hints*80
      +(avg>5000?90:avg>3000?45:0)
      +age*2
      -p.streak*18;
  }

  function shuffle(items){
    var a=items.slice();
    for(var i=a.length-1;i>0;i--){
      var j=Math.floor(Math.random()*(i+1));
      var t=a[i];a[i]=a[j];a[j]=t;
    }
    return a;
  }

  function selectItems(env,all,settings){
    var pool=scopedItems(env,all,settings);
    if(settings.order==='random') pool=shuffle(pool);
    else if(settings.order==='weak'){
      pool=pool.slice().sort(function(a,b){return weakScore(env,b)-weakScore(env,a);});
    }
    var n=settings.size==='all'?pool.length:Math.max(1,Number(settings.size)||20);
    return pool.slice(0,n);
  }

  function moduleChips(item){
    return item.modules.map(function(id){
      return '<span>'+esc(MODULES[id]&&MODULES[id].short||id)+'</span>';
    }).join('');
  }

  function updateProgress(env,item,kind,ms){
    var root=stateFor(env);
    var p=root.progress[item.id]||{
      seen:0,correct:0,firstTry:0,wrong:0,hints:0,totalMs:0,bestMs:0,lastMs:0,streak:0,lastSeenAt:0
    };
    if(kind==='wrong'){
      p.seen++;
      p.wrong++;
      p.streak=0;
    }else if(kind==='hint'){
      p.hints++;
    }else if(kind==='reveal'){
      p.seen++;
      p.wrong++;
      p.hints++;
      p.streak=0;
      p.lastSeenAt=Date.now();
    }else if(kind==='correct'){
      p.seen++;
      p.correct++;
      p.totalMs+=Math.max(0,Number(ms)||0);
      p.lastMs=Math.max(0,Number(ms)||0);
      p.bestMs=p.bestMs?Math.min(p.bestMs,p.lastMs):p.lastMs;
      p.streak++;
    }else if(kind==='first'){
      p.firstTry++;
    }
    p.lastSeenAt=Date.now();
    root.progress[item.id]=p;
    save(env);
  }

  function formatMs(ms){
    if(!Number.isFinite(ms)||ms<=0) return '—';
    return (ms/1000).toFixed(ms<10000?1:0)+'s';
  }

  function renderSetup(env,all){
    var store=stateFor(env);
    var s=store.settings;
    var current=currentLessonId(env);
    var currentLabel=(env.lessons||[]).find(function(x){return x.id===current;});
    var available=scopedItems(env,all,s).length;

    return '<section class="challenge-setup">'+
      '<div class="challenge-setup-head"><div><span class="eyebrow">CHALLENGE SETUP</span><h2>Chọn phạm vi kiểm tra</h2><p>Mặc định ưu tiên các câu chưa gặp, từng sai, dùng gợi ý hoặc phản hồi chậm.</p></div><strong>'+available+' câu phù hợp</strong></div>'+
      '<div class="challenge-config-grid">'+
        '<label><span>Nguồn câu</span><select id="challengeSource">'+
          Object.keys(MODULES).map(function(id){return '<option value="'+id+'" '+(s.source===id?'selected':'')+'>'+esc(MODULES[id].label)+' · '+countByModule(all,id)+'</option>';}).join('')+
        '</select></label>'+
        '<label><span>Phạm vi</span><select id="challengeScope">'+
          '<option value="all" '+(s.scope==='all'?'selected':'')+'>Toàn bộ English</option>'+
          '<option value="opened" '+(s.scope==='opened'?'selected':'')+'>Các mẫu câu đã mở</option>'+
          '<option value="current" '+(s.scope==='current'?'selected':'')+'>Bài hiện tại'+(currentLabel?' · '+esc(currentLabel.title||''):'')+'</option>'+
        '</select></label>'+
        '<label><span>Số câu</span><select id="challengeSize">'+
          ['10','20','50','all'].map(function(x){return '<option value="'+x+'" '+(s.size===x?'selected':'')+'>'+(x==='all'?'Toàn bộ':x+' câu')+'</option>';}).join('')+
        '</select></label>'+
        '<label><span>Thứ tự</span><select id="challengeOrder">'+
          '<option value="weak" '+(s.order==='weak'?'selected':'')+'>Ưu tiên câu yếu</option>'+
          '<option value="random" '+(s.order==='random'?'selected':'')+'>Ngẫu nhiên</option>'+
          '<option value="sequential" '+(s.order==='sequential'?'selected':'')+'>Theo dữ liệu gốc</option>'+
        '</select></label>'+
      '</div>'+
      '<button id="challengeStart" class="primary-button challenge-start" type="button">Bắt đầu thử thách →</button>'+
    '</section>';
  }

  function renderCoverage(all){
    var ids=['patterns','chunks','tenses','shadowing','practice'];
    return '<section class="challenge-coverage">'+
      '<div class="section-title-row"><div><span class="eyebrow">COVERAGE</span><h2>Toàn bộ ví dụ đang dùng trong từng module</h2><p>Câu trùng được gộp trong tổng English nhưng vẫn giữ đủ nhãn nguồn.</p></div><b>'+all.length+' câu English không trùng</b></div>'+
      '<div class="challenge-coverage-grid">'+ids.map(function(id){
        return '<article><span>'+esc(MODULES[id].short)+'</span><strong>'+countByModule(all,id)+'</strong><small>câu</small></article>';
      }).join('')+'</div>'+
    '</section>';
  }

  function currentResult(){
    if(!session) return null;
    if(!session.results[session.index]){
      session.results[session.index]={firstTry:true,wrong:false,hint:false,revealed:false,correct:false,ms:0};
    }
    return session.results[session.index];
  }

  function answerDiff(env,typed,answers){
    if(typeof env.bestQuizAnswerDiff!=='function'||typeof env.quizWordDiffHTML!=='function') return '';
    try{
      var best=env.bestQuizAnswerDiff(typed,answers);
      return env.quizWordDiffHTML(best.result.parts,false);
    }catch(error){
      return '';
    }
  }

  function renderCard(env){
    var holder=document.querySelector('#challengeWorkspace');
    if(!holder||!session) return;

    if(session.index>=session.items.length){
      renderSummary(env,holder);
      return;
    }

    var item=session.items[session.index];
    var result=currentResult();
    var progress=Math.round(((session.index+1)/Math.max(1,session.items.length))*100);

    holder.innerHTML=
      '<section class="challenge-card">'+
        '<div class="challenge-card-top"><div class="challenge-source-chips">'+moduleChips(item)+'</div><strong>'+(session.index+1)+'/'+session.items.length+'</strong></div>'+
        '<div class="challenge-progress"><i style="width:'+progress+'%"></i></div>'+
        '<div class="challenge-prompt-wrap"><span class="eyebrow">VIỆT → ENGLISH</span><h2>'+esc(item.vi)+'</h2>'+(item.details.length?'<small>'+esc(item.details[0])+'</small>':'')+'</div>'+
        '<div class="challenge-answer-wrap">'+
          '<input id="challengeInput" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="Viết câu tiếng Anh...">'+
          '<button id="challengeCheck" class="primary-button" type="button">Kiểm tra</button>'+
        '</div>'+
        '<div id="challengeDiff" class="quiz-word-diff"></div>'+
        '<div id="challengeFeedback" class="challenge-feedback"></div>'+
        '<div class="challenge-tools">'+
          '<button id="challengeHint" class="secondary-button" type="button">Gợi ý 1</button>'+
          '<button id="challengeReveal" class="text-button" type="button">Hiện đáp án</button>'+
          '<button id="challengeNext" class="primary-button hidden" type="button">Câu tiếp theo →</button>'+
        '</div>'+
      '</section>';

    var input=document.querySelector('#challengeInput');
    var check=document.querySelector('#challengeCheck');
    var hint=document.querySelector('#challengeHint');
    var reveal=document.querySelector('#challengeReveal');
    var next=document.querySelector('#challengeNext');
    var feedback=document.querySelector('#challengeFeedback');
    var diff=document.querySelector('#challengeDiff');

    function showCorrect(answer,ms){
      result.correct=true;
      result.ms=ms;
      updateProgress(env,item,'correct',ms);
      if(result.firstTry) updateProgress(env,item,'first',ms);
      input.classList.add('answer-correct');
      feedback.className='challenge-feedback good';
      feedback.innerHTML='<div><strong>✓ Chính xác</strong><span>'+formatMs(ms)+'</span></div>'+
        '<p>'+esc(answer)+'</p>'+
        '<button data-challenge-speak="'+escAttr(answer)+'" type="button">'+(env.uiIcon?env.uiIcon('volume-2'):'')+' Nghe câu</button>';
      next.classList.remove('hidden');
      check.classList.add('hidden');
      hint.classList.add('hidden');
      reveal.classList.add('hidden');
      var speakBtn=feedback.querySelector('[data-challenge-speak]');
      if(speakBtn) speakBtn.onclick=function(){if(env.speak) env.speak(answer);};
    }

    function evaluate(){
      if(result.correct||result.revealed){
        next.click();
        return;
      }
      var typed=String(input.value||'').trim();
      if(!typed) return;
      var matched=item.answers.find(function(answer){return norm(answer)===norm(typed);});
      var ms=Math.max(0,Date.now()-session.shownAt);
      if(matched){
        showCorrect(matched,ms);
      }else{
        result.firstTry=false;
        result.wrong=true;
        updateProgress(env,item,'wrong',ms);
        input.classList.remove('answer-correct');
        input.classList.add('answer-wrong');
        diff.innerHTML=answerDiff(env,typed,item.answers);
        feedback.className='challenge-feedback bad';
        feedback.textContent='Chưa đúng. Sửa lại rồi thử lần nữa.';
      }
    }

    check.onclick=evaluate;
    input.addEventListener('keydown',function(e){
      if(e.key!=='Enter') return;
      e.preventDefault();
      if(result.correct||result.revealed) next.click();
      else evaluate();
    });
    input.addEventListener('input',function(){
      input.classList.remove('answer-wrong');
      diff.innerHTML='';
      if(!result.correct&&!result.revealed){
        feedback.className='challenge-feedback';
        feedback.innerHTML='';
      }
    });

    hint.onclick=function(){
      if(result.correct||result.revealed) return;
      if(!result.hint){
        result.hint=true;
        result.firstTry=false;
        updateProgress(env,item,'hint',0);
      }
      var first=words(item.en)[0]||'';
      feedback.className='challenge-feedback hint';
      feedback.innerHTML='<strong>Gợi ý:</strong> '+esc(first)+'…';
      input.focus();
    };

    reveal.onclick=function(){
      if(result.correct||result.revealed) return;
      result.revealed=true;
      result.firstTry=false;
      updateProgress(env,item,'reveal',0);
      feedback.className='challenge-feedback reveal';
      feedback.innerHTML='<strong>Đáp án gợi ý</strong><p>'+item.answers.map(esc).join(' / ')+'</p>'+
        '<button data-challenge-speak="'+escAttr(item.answers[0])+'" type="button">'+(env.uiIcon?env.uiIcon('volume-2'):'')+' Nghe câu</button>';
      next.classList.remove('hidden');
      check.classList.add('hidden');
      hint.classList.add('hidden');
      reveal.classList.add('hidden');
      var speakBtn=feedback.querySelector('[data-challenge-speak]');
      if(speakBtn) speakBtn.onclick=function(){if(env.speak) env.speak(item.answers[0]);};
    };

    next.onclick=function(){
      session.index++;
      session.shownAt=Date.now();
      renderCard(env);
    };

    setTimeout(function(){input.focus({preventScroll:true});},30);
  }

  function renderSummary(env,holder){
    var results=session.results;
    var total=session.items.length;
    var first=results.filter(function(r){return r&&r.correct&&r.firstTry;}).length;
    var correct=results.filter(function(r){return r&&r.correct;}).length;
    var times=results.filter(function(r){return r&&r.correct&&r.ms>0;}).map(function(r){return r.ms;});
    var avg=times.length?times.reduce(function(a,b){return a+b;},0)/times.length:0;
    var weak=results.filter(function(r){return r&&(r.wrong||r.hint||r.revealed||r.ms>3000);}).length;
    var store=stateFor(env);
    store.runs.push({at:Date.now(),total:total,correct:correct,firstTry:first,avgMs:Math.round(avg),weak:weak});
    store.runs=store.runs.slice(-30);
    save(env);

    holder.innerHTML=
      '<section class="challenge-summary">'+
        '<span class="eyebrow">CHALLENGE COMPLETE</span>'+
        '<h2>Hoàn thành '+total+' câu</h2>'+
        '<div class="challenge-summary-grid">'+
          '<div><b>'+correct+'/'+total+'</b><span>đúng</span></div>'+
          '<div><b>'+Math.round((first/Math.max(1,total))*100)+'%</b><span>đúng ngay lần đầu</span></div>'+
          '<div><b>'+formatMs(avg)+'</b><span>phản hồi trung bình</span></div>'+
          '<div><b>'+weak+'</b><span>câu cần ôn lại</span></div>'+
        '</div>'+
        '<div class="challenge-summary-actions">'+
          '<button id="challengeWeakAgain" class="primary-button" type="button">Ôn lại câu yếu →</button>'+
          '<button id="challengeRestart" class="secondary-button" type="button">Làm lại</button>'+
        '</div>'+
      '</section>';

    document.querySelector('#challengeRestart').onclick=function(){
      start(env,session.all,session.settings);
    };
    document.querySelector('#challengeWeakAgain').onclick=function(){
      var weakItems=session.items.filter(function(item,index){
        var r=results[index];
        return r&&(r.wrong||r.hint||r.revealed||r.ms>3000);
      });
      if(!weakItems.length) weakItems=session.items.slice();
      session={
        all:session.all,
        settings:Object.assign({},session.settings,{order:'weak'}),
        items:weakItems,
        index:0,
        results:[],
        shownAt:Date.now()
      };
      renderCard(env);
    };
  }

  function start(env,all,settings){
    var items=selectItems(env,all,settings);
    if(!items.length){
      if(env.toast) env.toast('Không có câu phù hợp với phạm vi đã chọn.');
      return;
    }
    session={all:all,settings:Object.assign({},settings),items:items,index:0,results:[],shownAt:Date.now()};
    renderCard(env);
  }

  function bindSetup(env,all){
    var root=stateFor(env);
    [
      ['challengeSource','source'],
      ['challengeScope','scope'],
      ['challengeSize','size'],
      ['challengeOrder','order']
    ].forEach(function(pair){
      var node=document.querySelector('#'+pair[0]);
      if(!node) return;
      node.onchange=function(){
        root.settings[pair[1]]=node.value;
        save(env);
        render(env);
      };
    });

    var startBtn=document.querySelector('#challengeStart');
    if(startBtn) startBtn.onclick=function(){start(env,all,root.settings);};
  }

  function render(env){
    session=null;
    var all=collect(env);
    stateFor(env);
    if(env.setHeader) env.setHeader('English › Thử thách','Thử thách');
    env.main.innerHTML=
      '<section class="challenge-hero">'+
        '<div><span class="eyebrow">FINAL RETRIEVAL</span><h1>Thử thách Việt → English</h1><p>Tổng hợp toàn bộ câu ví dụ đang dùng trong các module English. Chỉ nhìn ý tiếng Việt, tự gọi câu tiếng Anh rồi mới kiểm tra.</p></div>'+
        '<div class="challenge-total"><b>'+all.length+'</b><span>câu English không trùng</span></div>'+
      '</section>'+
      renderCoverage(all)+
      renderSetup(env,all)+
      '<div id="challengeWorkspace"></div>';

    bindSetup(env,all);
  }

  window.EnglishChallenge={
    render:render,
    collect:collect,
    scopedItems:scopedItems,
    modules:MODULES
  };
})();