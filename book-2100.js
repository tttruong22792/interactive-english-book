/* Isolated book reader: does not mutate Language Studio routes, lessons or saved progress. */
(function(){
  "use strict";
  var BOOK=window.BOOK_2100_DATA;
  if(!BOOK || !Array.isArray(BOOK.steps)) return;
  var KEY="language-studio-book-2100-v1", root=null, trigger=null, observer=null, activeAudio=false;
  var state={step:1,mode:"read",page:"words",showEn:true,showJa:true,showWordVi:true,showSentenceVi:true,fitPage:true,doneWords:[],doneSentences:[]};
  try{
    var saved=JSON.parse(localStorage.getItem(KEY)||"{}");
    for(var key of Object.keys(state)) if(Object.prototype.hasOwnProperty.call(saved,key)) state[key]=saved[key];
  }catch(error){}
  if(!Array.isArray(state.doneWords)) state.doneWords=[];
  if(!Array.isArray(state.doneSentences)) state.doneSentences=[];
  if(!BOOK.steps.some(function(s){return s.id===Number(state.step);}))state.step=1;
  var srs=window.Book2100SRS?.createStore?.({storage:window.localStorage})||null;
  if(srs)srs.seedLegacy(state.doneWords,state.doneSentences);
  var reviewSession=null,overlayReturnFocus=null,assistedInputs=new Set();
  var byNumber=new Map();
  BOOK.steps.forEach(function(step){step.entries.forEach(function(item){
    byNumber.set(item.n,{item:item,step:step.id});
  });});
  function entryByNumber(n){return byNumber.get(Number(n))||null;}
  function dueCount(){return srs?srs.dueEntries(BOOK.steps,"word").length:0;}
  function masteryLabel(status){return srs?.levels?.[status]||"Mới";}
  function masteryButton(n){
    var rec=srs?.get(n,"word")||{status:"new",due:false};
    var label=masteryLabel(rec.status)+(rec.due?" · Đến hạn ôn":"");
    var glyph=rec.status==="mastered"?"✓":rec.status==="new"?"○":"◉";
    return '<button type="button" class="bk-mastery is-'+rec.status+(rec.due?' is-due':'')+
      '" data-mastery="'+n+'" title="'+esc(label)+'" aria-label="Từ '+n+': '+esc(label)+'">'+
      '<span class="bk-mastery-symbol" aria-hidden="true">'+glyph+'</span>'+
      (rec.due?'<span class="bk-due-dot" aria-hidden="true"></span>':'')+'</button>';
  }
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(error){}}
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function ruby(text){
    var src=String(text||""), re=/([々〆一-龯]+)\{([^{}]+)\}/gu, result="",cursor=0,match;
    while((match=re.exec(src))){
      result+=esc(src.slice(cursor,match.index));
      result+="<ruby><rb>"+esc(match[1])+"</rb><rt>"+esc(match[2])+"</rt></ruby>";
      cursor=match.index+match[0].length;
    }
    return result+esc(src.slice(cursor));
  }
  function currentStep(){return BOOK.steps.find(function(s){return s.id===Number(state.step);})||BOOK.steps[0];}
  function clean(s){
    return String(s||"").normalize("NFKC").toLowerCase().replace(/[‘’]/g,"'")
      .replace(/[.,!?;:。！？]+$/g,"").replace(/\s+/g," ").trim();
  }
  function highlight(sentence,word){
    var index=sentence.toLowerCase().indexOf(word.toLowerCase());
    if(index<0)return esc(sentence);
    return esc(sentence.slice(0,index))+"<em>"+esc(sentence.slice(index,index+word.length))+"</em>"+esc(sentence.slice(index+word.length));
  }
  function listenButton(n,type,index){
    return '<button type="button" class="bk-listen" data-listen="'+type+'" data-n="'+n+'" '+(type==="chunk"?'data-phrase-index="'+index+'" ':'')+'aria-label="Nghe '+(type==="word"?"từ":type==="chunk"?"cụm từ":"câu")+' tiếng Anh" title="Nghe tiếng Anh"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15 9a5 5 0 0 1 0 6"/><path d="M18 6a9 9 0 0 1 0 12"/></svg></button>';
  }
  function line(n,field){
    var passed=state[field].includes(n);
    return '<span class="bk-done '+(passed?"is-done":"")+'" data-done="'+field+'-'+n+'" title="'+(passed?"Đã trả lời đúng":"Chưa kiểm tra")+'" aria-label="'+(passed?"Đã trả lời đúng":"Chưa kiểm tra")+'">✓</span>';
  }
  function input(n,type){
    return '<input type="text" class="bk-entry-input" data-entry="'+type+'" data-n="'+n+'" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="next" aria-label="Nhập '+(type==="word"?"từ":"câu")+' tiếng Anh số '+n+'" placeholder="'+(type==="word"?"Nhập từ…":"Nhập câu tiếng Anh…")+'"/>';
  }
  function practiceMeaning(type,meaning){
    return '<div class="bk-practice-meaning" data-practice-meaning="'+type+'">'+
      '<small>NGHĨA TIẾNG VIỆT</small><strong>'+esc(meaning)+'</strong></div>';
  }
  function renderExtra(item){
    var entries=item.extra||[],visible=state.showEn&&state.mode!=="word";
    if(!entries.length)return '<span class="bk-subtle">—</span>';
    return entries.map(function(ex){
      return '<div class="bk-extra-line"><b>'+(visible?'• '+esc(ex[0]):'<span class="bk-masked">••••••</span>')+
        '</b><span>'+esc(ex[1])+'</span></div>';
    }).join('')+
    '<button class="bk-chunks-more" type="button" data-chunks="'+item.n+'" aria-label="Mở tất cả '+entries.length+' cụm từ cho '+esc(item.en)+'">↗ Xem '+entries.length+' cụm · nghe</button>';
  }
  function showChunks(n){
    var item=currentStep().entries.find(function(x){return x.n===n;});
    if(!item||!item.extra?.length)return;
    closeChunks();
    var showEnglish=state.showEn&&state.mode!=="word";
    var html='<div class="bk-chunk-layer" data-chunk-backdrop="true">'+
      '<section class="bk-chunk-dialog" role="dialog" aria-modal="true" aria-labelledby="bk-chunk-heading">'+
      '<div class="bk-chunk-header"><div><small>LEVEL 1 · STEP '+state.step+' · TỪ '+n+'</small>'+
      '<h2 id="bk-chunk-heading">'+(showEnglish?esc(item.en):'Từ số '+n)+' · Cụm từ thường dùng</h2>'+
      '<p>'+esc(item.vi)+'</p></div>'+
      '<button type="button" class="bk-chunk-close" data-close-chunks aria-label="Đóng danh sách cụm từ">✕</button></div>'+
      '<div class="bk-chunk-list">'+item.extra.map(function(ex,i){
        return '<div class="bk-chunk-item"><span class="bk-chunk-num">'+(i+1)+'</span>'+
          '<div class="bk-chunk-copy"><strong>'+(showEnglish?esc(ex[0]):'<span class="bk-masked">Ẩn tiếng Anh</span>')+
          '</strong><span>'+esc(ex[1])+'</span></div>'+listenButton(n,"chunk",i)+'</div>';
      }).join('')+'</div>'+
      '<div class="bk-chunk-foot">Cụm bổ sung cho giao tiếp thực tế; không phải nguyên văn sách. '+
        (showEnglish?'':'Bật “Hiện Anh” hoặc chuyển sang “Đọc sách” để xem chữ tiếng Anh.')+'</div>'+
      '</section></div>';
    root.insertAdjacentHTML("beforeend",html);
    root.__chunkReturnFocus=document.activeElement;
    root.querySelector("[data-close-chunks]")?.focus({preventScroll:true});
  }
  function closeChunks(){
    var dialog=root?.querySelector(".bk-chunk-layer");
    if(!dialog)return;
    dialog.remove();
    if(root.__chunkReturnFocus?.isConnected)root.__chunkReturnFocus.focus({preventScroll:true});
    root.__chunkReturnFocus=null;
  }


  function reviewDueText(rec){
    if(!rec || !rec.dueAt)return "Chưa có lịch";
    if(rec.dueAt<=Date.now())return "Đến hạn ôn";
    var d=new Date(rec.dueAt);
    return d.toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"});
  }
  function srsCountsHtml(stats){
    var labels=[["new","Mới"],["weak","Chưa vững"],["learning","Đang nhớ"],["mastered","Vững"]];
    return labels.map(function(p){
      return '<span class="bk-srs-count is-'+p[0]+'"><i aria-hidden="true"></i>'+
        p[1]+' <b>'+stats[p[0]]+'</b></span>';
    }).join("");
  }
  function closeSrsLayer(){
    var overlay=root?.querySelector(".bk-srs-layer");
    if(overlay)overlay.remove();
    reviewSession=null;
    if(overlayReturnFocus?.isConnected)overlayReturnFocus.focus({preventScroll:true});
    overlayReturnFocus=null;
    updateDueBadge();
  }
  function rememberSrsFocus(){
    if(!overlayReturnFocus)overlayReturnFocus=document.activeElement;
  }
  function showMasteryDetail(n){
    if(!srs||!root)return;
    var found=entryByNumber(n);if(!found)return;
    closeChunks();
    var active=root.querySelector(".bk-srs-layer");
    if(active){active.remove();reviewSession=null;}
    rememberSrsFocus();
    var item=found.item,word=srs.get(n,"word"),sentence=srs.get(n,"sentence");
    var counts=srs.summary(currentStep().entries,"word");
    var visible=state.showEn&&state.mode!=="word";
    var recent=word.history.slice(-5).reverse();
    var html='<div class="bk-srs-layer" data-srs-backdrop="true">'+
      '<section class="bk-srs-dialog" role="dialog" aria-modal="true" aria-labelledby="bk-srs-title">'+
      '<div class="bk-srs-header"><div><small>LEVEL 1 · STEP '+found.step+' · TỪ '+n+'</small>'+
      '<h2 id="bk-srs-title">'+(visible?esc(item.en):'Từ số '+n)+'</h2>'+
      '<p>'+esc(item.vi)+'</p></div>'+
      '<button type="button" class="bk-srs-close" data-srs-close aria-label="Đóng chi tiết">✕</button></div>'+
      '<div class="bk-srs-body">'+
      '<div class="bk-srs-key"><div><small>ĐỘ THÀNH THẠO TỪ</small>'+
      '<strong class="bk-srs-status is-'+word.status+'">'+masteryLabel(word.status)+'</strong></div>'+
      '<div><small>ÔN TỪ LẦN TỚI</small><strong>'+reviewDueText(word)+'</strong></div></div>'+
      '<div class="bk-srs-sentence-status">Viết câu: <b>'+masteryLabel(sentence.status)+'</b>'+
      (sentence.due?' · Đến hạn':'')+'</div>'+
      '<div class="bk-srs-history"><small>LỊCH SỬ GHI NHỚ · tối đa 5 ngày gần nhất</small>'+
      (recent.length?'<div class="bk-srs-history-events">'+recent.map(function(x){
        return '<span class="bk-srs-history-icon '+(x.result==="good"?'is-good':'is-again')+
          '" aria-label="'+(x.result==="good"?'Nhớ đúng':'Cần ôn')+' ngày '+esc(x.day)+'" title="'+esc(x.day)+'">'+
          (x.result==="good"?'✓':'✕')+'</span>';
      }).join('')+'</div>':'<p>Chưa có lần ôn cách ngày được ghi nhận.</p>')+
      '</div>'+
      '<div class="bk-srs-history-total">Đã luyện <b>'+word.attempts+'</b> lần · Đúng <b>'+word.successes+
      '</b> · Sai <b>'+word.mistakes+'</b></div>'+
      (word.source==="legacy"?'<p class="bk-srs-legacy">Dấu đúng cũ được giữ lại; cần ôn để xác nhận ghi nhớ lâu dài.</p>':'')+
      '<div class="bk-srs-step-counters"><small>TRẠNG THÁI STEP '+currentStep().id+'</small>'+
      '<div>'+srsCountsHtml(counts)+'</div></div>'+
      '</div><div class="bk-srs-actions">'+
      '<button type="button" data-srs-weak="'+n+'" class="bk-srs-secondary">Đánh dấu chưa vững</button>'+
      '<button type="button" data-srs-practice="'+n+'" class="bk-srs-primary">Ôn từ này</button></div>'+
      '<div class="bk-srs-footer">Độ vững tăng khi nhớ đúng qua nhiều ngày, không tính nhiều lần nhập lại trong một buổi.</div>'+
      '</section></div>';
    root.insertAdjacentHTML("beforeend",html);
    root.querySelector("[data-srs-close]")?.focus({preventScroll:true});
  }
  function reviewOverlay(body){
    var overlay=root.querySelector(".bk-srs-layer");
    if(overlay)overlay.remove();
    root.insertAdjacentHTML("beforeend",'<div class="bk-srs-layer" data-srs-backdrop="true">'+body+'</div>');
  }
  function renderReviewCard(){
    if(!reviewSession)return;
    var session=reviewSession;
    if(session.index>=session.ids.length){renderReviewDone();return;}
    var n=session.ids[session.index];
    var found=entryByNumber(n);
    if(!found){session.index++;renderReviewCard();return;}
    var item=found.item,position=session.index+1;
    var html='<section class="bk-review-dialog" role="dialog" aria-modal="true" aria-labelledby="bk-review-title">'+
      '<div class="bk-review-head"><div><small>ÔN NGẮT QUÃNG · LEVEL 1</small>'+
      '<h2 id="bk-review-title">Nhớ lại từ tiếng Anh</h2></div>'+
      '<button type="button" class="bk-srs-close" data-srs-close aria-label="Đóng ôn tập">✕</button></div>'+
      '<div class="bk-review-progress">Từ <b>'+position+'/'+session.ids.length+'</b>'+
      '<span>STEP '+found.step+' · Số '+n+'</span></div>'+
      '<div class="bk-review-progress-bar"><span style="width:'+(100*(position-1)/session.ids.length)+'%"></span></div>'+
      '<div class="bk-review-content"><small>NHÌN NGHĨA TIẾNG VIỆT, NHỚ LẠI TIẾNG ANH</small>'+
      '<strong class="bk-review-vi">'+esc(item.vi)+'</strong>'+
      '<div class="bk-review-input-line"><input type="text" class="bk-review-input" data-review-input="'+n+
      '" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="next"'+
      ' placeholder="Nhập từ tiếng Anh..." aria-label="Nhập từ tiếng Anh của '+esc(item.vi)+'"/>'+
      '<span class="bk-review-mark" aria-live="polite" aria-label="Chưa kiểm tra"></span></div>'+
      '<div class="bk-review-help">Enter: kiểm tra · Enter khi trống: sang từ tiếp theo</div>'+
      '<button type="button" class="bk-review-audio" data-review-audio="'+n+'"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15 9a5 5 0 0 1 0 6"/><path d="M18 6a9 9 0 0 1 0 12"/></svg> Nghe phát âm</button></div>'+
      '<div class="bk-review-actions"><button type="button" data-review-skip>Bỏ qua</button>'+
      '<button type="button" data-review-next class="bk-srs-primary">Tiếp theo →</button></div>'+
      '</section>';
    reviewOverlay(html);
    root.querySelector(".bk-review-input")?.focus({preventScroll:true});
  }
  function renderReviewDone(){
    if(!reviewSession)return;
    var session=reviewSession;
    var empty=session.ids.length===0;
    var html='<section class="bk-review-dialog bk-review-finished" role="dialog" aria-modal="true" aria-labelledby="bk-review-title">'+
      '<div class="bk-review-head"><div><small>ÔN NGẮT QUÃNG · LEVEL 1</small>'+
      '<h2 id="bk-review-title">'+(empty?"Không có từ đến hạn":"Hoàn thành phiên ôn")+'</h2></div>'+
      '<button type="button" class="bk-srs-close" data-srs-close aria-label="Đóng">✕</button></div>'+
      '<div class="bk-review-finished-body"><span class="bk-review-finished-icon" aria-hidden="true">✓</span>'+
      '<strong>'+(empty?"Đã ôn xong hôm nay":session.ids.length+" từ đã đi qua")+'</strong>'+
      (empty?"":'<p>Nhớ đúng: '+session.passed+' · Cần củng cố: '+session.missed+
      ' · Bỏ qua: '+session.skipped+'</p>')+
      '<small>Các từ chưa vững sẽ được xếp lịch ôn riêng. Nhập nhiều lần trong một ngày không làm tăng cấp độ nhớ.</small></div>'+
      '<div class="bk-review-actions"><button class="bk-srs-primary" type="button" data-srs-close>Trở lại sách</button></div></section>';
    reviewOverlay(html);
    root.querySelector("[data-srs-close]")?.focus({preventScroll:true});
    updateDueBadge();
  }
  function startReview(ids){
    if(!srs||!root)return;
    var candidates=(ids||srs.dueEntries(BOOK.steps,"word").map(function(x){return x.id;}));
    var unique=Array.from(new Set(candidates.filter(function(n){return !!entryByNumber(n);}))).slice(0,20);
    closeChunks();
    var existing=root.querySelector(".bk-srs-layer");
    if(existing)existing.remove();
    rememberSrsFocus();
    reviewSession={ids:unique,index:0,passed:0,missed:0,skipped:0,hadError:false,answered:false,counted:false,hintUsed:false};
    if(!unique.length){renderReviewDone();return;}
    renderReviewCard();
  }
  function nextReview(skipped){
    if(!reviewSession)return;
    if(skipped && !reviewSession.answered && !reviewSession.hadError)reviewSession.skipped++;
    else if(reviewSession.answered && !reviewSession.counted){
      if(reviewSession.hadError)reviewSession.missed++;else reviewSession.passed++;
    }else if(reviewSession.hadError && !reviewSession.counted)reviewSession.missed++;
    reviewSession.counted=true;
    reviewSession.index++;
    reviewSession.answered=false;
    reviewSession.hadError=false;
    reviewSession.hintUsed=false;
    reviewSession.counted=false;
    renderReviewCard();
  }
  function submitReview(input){
    if(!reviewSession)return;
    var n=Number(input.dataset.reviewInput),found=entryByNumber(n);
    if(!found)return;
    if(!input.value.trim()){nextReview(!reviewSession.answered);return;}
    var correct=clean(input.value)===clean(found.item.en);
    var mark=root.querySelector(".bk-review-mark");
    if(!correct)reviewSession.hadError=true;
    srs?.record(n,"word",correct,{assisted:!!reviewSession.hintUsed});
    refreshMastery(n);
    if(correct){
      reviewSession.answered=true;
      input.value="";
      input.classList.remove("is-wrong");input.classList.add("is-correct");
      input.removeAttribute("aria-invalid");
    }else{
      input.classList.remove("is-correct");input.classList.add("is-wrong");
      input.setAttribute("aria-invalid","true");
    }
    if(mark){
      mark.textContent=correct?"✓":"✕";
      mark.className="bk-review-mark "+(correct?"is-correct":"is-wrong");
      mark.setAttribute("aria-label",correct?"Đã nhập đúng":"Chưa đúng");
    }
    input.focus({preventScroll:true});
  }

  function renderRow(item){
    var n=item.n,word=state.mode==="word",sentence=state.mode==="sentence";
    return '<div class="bk-row" data-row="'+n+'">'+
      '<div class="bk-cell bk-number"><span>'+n+'</span>'+masteryButton(n)+'</div>'+
      '<div class="bk-cell bk-word">'+(word?practiceMeaning("word",item.vi):"")+'<div class="bk-word-line">'+
      (word?input(n,"word"):state.showEn?'<strong>'+esc(item.en)+'</strong>':'<span class="bk-masked">••••••</span>')+
      line(n,"doneWords")+'</div><div class="bk-word-sub">'+(state.mode==="read"?'<small>'+esc(item.ipa)+'</small>':"")+listenButton(n,"word")+'</div></div>'+
      '<div class="bk-cell bk-word-vi">'+(state.showWordVi?esc(item.vi):'<span class="bk-masked">••••</span>')+'</div>'+
      '<div class="bk-cell bk-jword">'+(state.showJa?ruby(item.ja):'<span class="bk-masked">••••</span>')+'</div>'+
      '<div class="bk-cell bk-extra">'+renderExtra(item)+'</div>'+
      '<div class="bk-cell bk-sentence">'+(sentence?practiceMeaning("sentence",item.sentenceVi):"")+'<div class="bk-sentence-wrap">'+listenButton(n,"sentence")+
      '<div class="bk-sentence-value">'+(sentence?input(n,"sentence"):state.showEn?highlight(item.sentence,item.en):'<span class="bk-masked">••••••••••</span>')+'</div>'+line(n,"doneSentences")+'</div></div>'+
      '<div class="bk-cell bk-svi">'+(state.showSentenceVi?esc(item.sentenceVi):'<span class="bk-masked">••••••</span>')+'</div>'+
      '<div class="bk-cell bk-sja">'+(state.showJa?ruby(item.sentenceJa):'<span class="bk-masked">••••••</span>')+'</div>'+
      '</div>';
  }
  function toolbar(){
    var step=currentStep();
    var countWords=step.entries.filter(function(x){return state.doneWords.includes(x.n);}).length;
    var countSent=step.entries.filter(function(x){return state.doneSentences.includes(x.n);}).length;
    return '<div class="bk-toolbar"><div class="bk-brand"><span class="bk-brand-icon">▣</span><div><strong>2100 TỪ VỰNG ANH–NHẬT</strong><small>LEVEL 1 · sách tương tác</small></div></div>'+
      '<div class="bk-toolbar-controls"><label class="bk-step-label">STEP <select id="bkStepSelect" aria-label="Chọn STEP">'+BOOK.steps.map(function(s){return '<option value="'+s.id+'" '+(s.id===step.id?"selected":"")+'>STEP '+s.id+' · '+s.start+'–'+s.end+'</option>';}).join('')+'</select></label>'+
      '<div class="bk-progress" id="bkProgress" aria-live="polite"><b>'+countWords+'/'+step.entries.length+'</b> từ · <b>'+countSent+'/'+step.entries.length+'</b> câu</div>'+
      '<button type="button" class="bk-review-launch" data-review-launch title="Ôn các từ đến hạn từ mọi STEP" aria-label="Ôn từ đến hạn">'+
      '<span aria-hidden="true">◷</span> <span id="bkReviewCount">Ôn '+dueCount()+' từ</span></button>'+
      '<button class="bk-toggle '+(!state.showEn?"is-off":"")+'" data-toggle="showEn" type="button">'+(state.showEn?"Ẩn":"Hiện")+' Anh</button>'+
      '<button class="bk-toggle '+(!state.showJa?"is-off":"")+'" data-toggle="showJa" type="button">'+(state.showJa?"Ẩn":"Hiện")+' Nhật</button>'+
      '<button class="bk-toggle bk-toggle-vi '+(!state.showWordVi?"is-off":"")+'" data-toggle="showWordVi" type="button">'+(state.showWordVi?"Ẩn":"Hiện")+' nghĩa từ</button>'+
      '<button class="bk-toggle bk-toggle-vi '+(!state.showSentenceVi?"is-off":"")+'" data-toggle="showSentenceVi" type="button">'+(state.showSentenceVi?"Ẩn":"Hiện")+' nghĩa câu</button>'+
      '<button class="bk-mode '+(state.mode==="read"?"is-active":"")+'" data-mode="read" type="button">Đọc sách</button>'+
      '<button class="bk-mode '+(state.mode==="word"?"is-active":"")+'" data-mode="word" type="button">Học từ</button>'+
      '<button class="bk-mode '+(state.mode==="sentence"?"is-active":"")+'" data-mode="sentence" type="button">Học câu</button>'+
      '<button class="bk-fit-toggle" data-fit type="button">'+(state.fitPage?"⛶ Toàn trang":"🔍 Thu vừa trang")+'</button><button class="bk-exit" data-exit type="button">✕ Thoát</button></div></div>';
  }
  function render(){
    if(!root)return;
    var step=currentStep();
    root.classList.toggle("bk-fit",!!state.fitPage);
    root.classList.toggle("bk-study-word",state.mode==="word");
    root.classList.toggle("bk-study-sentence",state.mode==="sentence");
    root.classList.remove("bk-focused","bk-keyboard-open");
    root.style.setProperty("--bk-row-count",String(step.entries.length));
    root.innerHTML=toolbar()+
      '<div class="bk-focus-banner" id="bkFocusBanner" role="status" aria-live="polite"><span>NGHĨA TIẾNG VIỆT</span><strong id="bkFocusMeaning"></strong></div>'+
      '<div class="bk-page-switch" role="group" aria-label="Chọn trang sách"><button data-page="words" class="'+(state.page==="words"?"is-active":"")+'">Trang từ vựng</button><button data-page="sentences" class="'+(state.page==="sentences"?"is-active":"")+'">Trang câu ví dụ</button></div>'+
      '<div class="bk-scroll"><div class="bk-book '+(state.page==="sentences"?"bk-show-sentences":"bk-show-words")+'">'+
      '<div class="bk-book-title"><div><span class="bk-level">LEVEL<br><b>1</b></span><span class="bk-stepflag">STEP '+step.id+'</span><strong>'+step.start+'–'+step.end+'</strong><small>中学1・2年生レベル</small></div><div class="bk-book-title-right"><strong>LEVEL 1</strong>　● ━━━━○ ━━━━　<span>GOAL 400</span></div></div>'+
      '<div class="bk-head bk-row">'+
      '<div class="bk-cell bk-number">No.</div><div class="bk-cell bk-word">TỪ TIẾNG ANH <small>(IPA · âm thanh)</small></div>'+
      '<div class="bk-cell bk-word-vi">NGHĨA TỪ <small>(VI)</small></div>'+
      '<div class="bk-cell bk-jword">TIẾNG NHẬT <small>(ふりがな)</small></div>'+
      '<div class="bk-cell bk-extra">CỤM TỪ THỰC TẾ <small>(EN + VI · bấm xem đủ)</small></div>'+
      '<div class="bk-cell bk-sentence">CÂU TIẾNG ANH <small>(nghe + nhập)</small></div>'+
      '<div class="bk-cell bk-svi">NGHĨA CÂU <small>(VI)</small></div>'+
      '<div class="bk-cell bk-sja">CÂU TIẾNG NHẬT <small>(ふりがな)</small></div></div>'+
      '<div class="bk-rows">'+step.entries.map(renderRow).join('')+'</div>'+
      '<div class="bk-book-end">Nguồn: STEP '+step.id+' · trang '+esc(step.pages)+' của ảnh sách đã cung cấp · '+step.entries.length+' từ / '+step.entries.length+' câu</div></div></div>'+
      '<div class="bk-bottom"><div><b>Enter</b> kiểm tra · <b>Enter khi trống</b> sang dòng kế · <b>Esc</b> thoát <span id="bkGlobalMessage" aria-live="polite"></span></div>'+
      '<div class="bk-pager"><button data-step="-1" '+(step.id===BOOK.steps[0].id?"disabled":"")+'>← STEP trước</button><strong>'+step.id+' / '+BOOK.steps.length+' STEP</strong><button data-step="1" '+(step.id===BOOK.steps[BOOK.steps.length-1].id?"disabled":"")+'>STEP tiếp →</button></div></div>';
  }
  function updateDueBadge(){
    if(!root||!srs)return;
    var badge=root.querySelector("#bkReviewCount");
    if(badge)badge.textContent=dueCount()?"Ôn "+dueCount()+" từ":"Đã ôn xong";
    var parent=root.querySelector("[data-review-launch]");
    if(parent){parent.classList.toggle("is-clear",dueCount()===0);parent.title=dueCount()?"Có "+dueCount()+" từ đến hạn trên toàn LEVEL 1":"Chưa có từ đến hạn ôn";}
  }
  function refreshMastery(n){
    if(!root)return;
    var current=root.querySelector('[data-mastery="'+n+'"]');
    if(current){
      var rec=srs?.get(n,"word")||{status:"new",due:false};
      var label=masteryLabel(rec.status)+(rec.due?" · Đến hạn ôn":"");
      current.className="bk-mastery is-"+rec.status+(rec.due?" is-due":"");
      current.title=label;
      current.setAttribute("aria-label","Từ "+n+": "+label);
      var symbol=current.querySelector(".bk-mastery-symbol");
      if(symbol)symbol.textContent=rec.status==="mastered"?"✓":rec.status==="new"?"○":"◉";
      var dot=current.querySelector(".bk-due-dot");
      if(rec.due&&!dot){current.insertAdjacentHTML("beforeend",'<span class="bk-due-dot" aria-hidden="true"></span>');}
      else if(!rec.due&&dot)dot.remove();
    }
    updateDueBadge();
  }
  function updateCounter(){
    var step=currentStep();
    var w=step.entries.filter(function(x){return state.doneWords.includes(x.n);}).length;
    var s=step.entries.filter(function(x){return state.doneSentences.includes(x.n);}).length;
    var output=root.querySelector("#bkProgress");
    if(output)output.innerHTML="<b>"+w+"/"+step.entries.length+"</b> từ · <b>"+s+"/"+step.entries.length+"</b> câu";
  }
  function message(s){var node=root.querySelector("#bkGlobalMessage");if(node)node.textContent=s||"";}
  function focusedMeaning(inputNode){
    if(!inputNode||!inputNode.matches(".bk-entry-input"))return;
    var n=Number(inputNode.dataset.n),type=inputNode.dataset.entry;
    var entry=currentStep().entries.find(function(item){return item.n===n;});
    if(!entry)return;
    var value=type==="word"?entry.vi:entry.sentenceVi;
    var banner=root.querySelector("#bkFocusMeaning");
    if(banner)banner.textContent=n+". "+value;
    root.classList.add("bk-focused","bk-keyboard-open");
    var cell=inputNode.closest(".bk-row");
    if(cell)cell.classList.add("bk-row-focused");
  }
  function clearFocusedMeaning(inputNode){
    if(!root)return;
    if(inputNode){
      var cell=inputNode.closest(".bk-row");
      if(cell)cell.classList.remove("bk-row-focused");
    }
    root.classList.remove("bk-focused","bk-keyboard-open");
  }
  function switchStep(delta){
    var idx=BOOK.steps.findIndex(function(x){return x.id===Number(state.step);});
    if(idx+delta<0||idx+delta>=BOOK.steps.length){message("Chưa có ảnh của STEP tiếp theo.");return false;}
    state.step=BOOK.steps[idx+delta].id;assistedInputs.clear();persist();render();return true;
  }
  function focusNext(n,type){
    var next=currentStep().entries.find(function(x){return x.n>n;});
    if(!next){
      if(!switchStep(1))return;
      next=currentStep().entries[0];
    }
    if(type==="sentence")state.page="sentences";
    else state.page="words";
    var inputNode=root.querySelector('[data-entry="'+type+'"][data-n="'+next.n+'"]');
    if(inputNode){inputNode.focus({preventScroll:true});inputNode.scrollIntoView({block:"center",behavior:"smooth"});}
  }
  function showAnswerMark(inputNode,result){
    var type=inputNode.dataset.entry,n=Number(inputNode.dataset.n);
    var field=type==="word"?"doneWords":"doneSentences";
    var mark=root.querySelector('[data-done="'+field+'-'+n+'"]');
    if(!mark)return;
    var correct=result==="correct",wrong=result==="wrong";
    var passed=state[field].includes(n);
    mark.classList.toggle("is-done",correct||(!wrong&&passed));
    mark.classList.toggle("is-wrong",wrong);
    mark.textContent=wrong?"✕":"✓";
    var label=wrong?"Chưa đúng":(correct||passed?"Đã trả lời đúng":"Chưa kiểm tra");
    mark.setAttribute("aria-label",label);
    mark.title=label;
  }
  function submitInput(inputNode){
    var type=inputNode.dataset.entry,n=Number(inputNode.dataset.n);
    var entry=currentStep().entries.find(function(x){return x.n===n;});
    if(!entry)return;
    var typed=inputNode.value.trim();
    if(!typed){focusNext(n,type);return;}
    var answer=type==="word"?entry.en:entry.sentence;
    if(clean(typed)!==clean(answer)){
      if(srs)srs.record(n,type,false);
      refreshMastery(n);
      inputNode.classList.add("is-wrong");
      inputNode.classList.remove("is-correct");
      showAnswerMark(inputNode,"wrong");
      inputNode.setAttribute("aria-invalid","true");
      return;
    }
    var field=type==="word"?"doneWords":"doneSentences";
    if(srs)srs.record(n,type,true,{assisted:assistedInputs.has(type+":"+n)});
    refreshMastery(n);
    if(!state[field].includes(n))state[field].push(n);
    persist();
    inputNode.value="";
    inputNode.classList.remove("is-wrong");
    inputNode.classList.add("is-correct");
    inputNode.removeAttribute("aria-invalid");
    showAnswerMark(inputNode,"correct");
    updateCounter();
    inputNode.focus({preventScroll:true});
  }
  function browserSpeak(s){
    if(!("speechSynthesis" in window)){message("Thiết bị không hỗ trợ đọc tiếng Anh.");return;}
    try{
      window.speechSynthesis.cancel();
      var u=new SpeechSynthesisUtterance(s);
      u.lang="en-US";u.rate=0.88;u.pitch=1;
      var voices=window.speechSynthesis.getVoices();
      var voice=voices.find(function(v){return /^en[-_]US/i.test(v.lang);})||voices.find(function(v){return /^en/i.test(v.lang);});
      if(voice)u.voice=voice;
      window.speechSynthesis.speak(u);
    }catch(error){message("Không thể phát âm thanh.");}
  }
  async function speak(n,type,index){
    var found=entryByNumber(n);
    var e=found?.item;if(!e)return;
    var value=type==="word"?(e.wordAudio||e.en):type==="chunk"?e.extra?.[index]?.[0]:e.sentence;
    if(!value)return;
    if(activeAudio&&window.AITTS?.stop)window.AITTS.stop();
    if("speechSynthesis" in window)window.speechSynthesis.cancel();
    activeAudio=true;
    if(window.AITTS&&typeof window.AITTS.speak==="function"){
      try{await window.AITTS.speak(value,{language:"en-US",rate:0.88,minDuration:type==="word"?Number(e.wordAudioMinSeconds||0):0});return;}
      catch(error){if(error&&error.name==="AbortError")return;}
    }
    if(!root.hidden)browserSpeak(value);
  }
  function stopAudio(){
    activeAudio=false;
    try{window.AITTS?.stop?.();}catch(error){}
    try{window.speechSynthesis?.cancel?.();}catch(error){}
  }
  function close(){
    if(!root||root.hidden)return;
    closeSrsLayer();closeChunks();stopAudio();root.hidden=true;document.body.classList.remove("book2100-open");
    document.documentElement.classList.remove("book2100-open");
    if(trigger&&trigger.isConnected)trigger.focus({preventScroll:true});
  }
  function open(launch){
    trigger=launch||document.activeElement;
    if(!root){
      root=document.createElement("section");
      root.id="book2100Root";root.className="book2100";root.setAttribute("aria-label","Sách học 2100 từ vựng Anh Nhật");
      root.hidden=true;document.body.appendChild(root);
      root.addEventListener("click",onClick);
      root.addEventListener("focusin",function(evt){
        if(evt.target.matches(".bk-entry-input"))focusedMeaning(evt.target);
      });
      root.addEventListener("focusout",function(evt){
        if(evt.target.matches(".bk-entry-input"))clearFocusedMeaning(evt.target);
      });
      root.addEventListener("change",function(evt){
        if(evt.target.id==="bkStepSelect"){state.step=Number(evt.target.value);assistedInputs.clear();persist();render();}
      });
      root.addEventListener("keydown",function(evt){
        if(evt.isComposing||evt.keyCode===229)return;
        if(evt.key==="Enter"&&evt.target.matches(".bk-entry-input")){
          evt.preventDefault();submitInput(evt.target);
        }
        if(evt.key==="Enter"&&evt.target.matches(".bk-review-input")){
          evt.preventDefault();submitReview(evt.target);
        }
        // Keep keyboard focus inside a review or mastery dialog.
        if(evt.key==="Tab"&&root.querySelector(".bk-srs-layer")){
          var dialog=root.querySelector(".bk-srs-layer");
          var targets=Array.prototype.slice.call(dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled])'));
          if(targets.length){
            var first=targets[0],last=targets[targets.length-1];
            if(evt.shiftKey&&document.activeElement===first){evt.preventDefault();last.focus();}
            else if(!evt.shiftKey&&document.activeElement===last){evt.preventDefault();first.focus();}
          }
        }
      });
      root.addEventListener("input",function(evt){
        if(evt.target.matches(".bk-entry-input")){
          evt.target.classList.remove("is-wrong");
          evt.target.classList.remove("is-correct");
          evt.target.removeAttribute("aria-invalid");
          showAnswerMark(evt.target,"reset");
        }
        if(evt.target.matches(".bk-review-input")){
          evt.target.classList.remove("is-wrong","is-correct");
          evt.target.removeAttribute("aria-invalid");
          var mark=root.querySelector(".bk-review-mark");
          if(mark){mark.textContent="";mark.className="bk-review-mark";mark.setAttribute("aria-label","Chưa kiểm tra");}
        }
      });
    }
    if(state.mode==="sentence")state.page="sentences";
    if(state.mode==="word")state.page="words";
    render();root.hidden=false;document.body.classList.add("book2100-open");
    document.documentElement.classList.add("book2100-open");
    var exit=root.querySelector("[data-exit]");if(exit)exit.focus({preventScroll:true});
  }
  function onClick(evt){
    if(evt.target.classList?.contains("bk-chunk-layer")){closeChunks();return;}
    if(evt.target.classList?.contains("bk-srs-layer")){closeSrsLayer();return;}
    var button=evt.target.closest("button");if(!button)return;
    if(button.hasAttribute("data-srs-close")){closeSrsLayer();return;}
    if(button.hasAttribute("data-review-skip")){nextReview(true);return;}
    if(button.hasAttribute("data-review-next")){nextReview(true);return;}
    if(button.dataset.reviewAudio){
      if(reviewSession&&!reviewSession.answered){
        reviewSession.hintUsed=true;
        reviewSession.hadError=true;
      }
      speak(Number(button.dataset.reviewAudio),"word");return;
    }
    if(button.dataset.srsWeak){
      var weakId=Number(button.dataset.srsWeak);
      srs?.markDue(weakId,"word");
      refreshMastery(weakId);
      showMasteryDetail(weakId);return;
    }
    if(button.dataset.srsPractice){startReview([Number(button.dataset.srsPractice)]);return;}
    if(button.dataset.mastery){showMasteryDetail(Number(button.dataset.mastery));return;}
    if(button.hasAttribute("data-review-launch")){startReview();return;}
    if(button.hasAttribute("data-close-chunks")){closeChunks();return;}
    if(button.dataset.chunks){showChunks(Number(button.dataset.chunks));return;}
    if(button.hasAttribute("data-exit")){close();return;}
    if(button.hasAttribute("data-fit")){state.fitPage=!state.fitPage;persist();render();return;}
    if(button.dataset.listen){
      var kind=button.dataset.listen,n=Number(button.dataset.n);
      if((state.mode==="word"&&kind==="word")||(state.mode==="sentence"&&kind==="sentence")){
        assistedInputs.add(kind+":"+n);
      }
      speak(n,kind,Number(button.dataset.phraseIndex));return;
    }
    if(button.dataset.mode){
      state.mode=button.dataset.mode;
      assistedInputs.clear();
      if(state.mode==="word")state.showWordVi=true;
      if(state.mode==="sentence")state.showSentenceVi=true;
      if(state.mode==="word")state.page="words";
      if(state.mode==="sentence")state.page="sentences";
      persist();render();return;
    }
    if(button.dataset.toggle){
      var key=button.dataset.toggle;if(typeof state[key]!=="boolean")return;
      state[key]=!state[key];persist();render();return;
    }
    if(button.dataset.page){state.page=button.dataset.page;persist();render();return;}
    if(button.dataset.step){switchStep(Number(button.dataset.step));}
  }
  function injectEntries(){
    var nav=document.querySelector(".nav-list");
    if(nav&&!nav.querySelector("#bkSidebarLaunch")){
      var button=document.createElement("button");
      button.id="bkSidebarLaunch";button.type="button";button.className="nav-item bk-sidebar-entry";
      button.innerHTML='<span aria-hidden="true">📖</span><b>Sách 2100 từ Anh–Nhật</b>';
      button.addEventListener("click",function(){open(button);});
      nav.appendChild(button);
    }
    var main=document.getElementById("mainView");
    var cards=main&&main.querySelector(".easy-play-activities");
    if(cards&&(location.hash==="#home"||!location.hash)&&!cards.querySelector("#bkLibraryLaunch")){
      var card=document.createElement("button");
      card.id="bkLibraryLaunch";card.type="button";card.className="easy-play-activity bk-library-entry";
      card.innerHTML='<span class="easy-play-activity-icon" aria-hidden="true">📖</span><span class="easy-play-arrow" aria-hidden="true">↗</span><strong>Sách 2100 từ Anh–Nhật</strong><small>LEVEL 1 · học theo sách gốc · nghe và luyện viết</small>';
      card.addEventListener("click",function(){open(card);});
      cards.appendChild(card);
    }
  }
  function init(){
    injectEntries();
    var main=document.getElementById("mainView");
    if(main&&"MutationObserver" in window){
      observer=new MutationObserver(injectEntries);
      observer.observe(main,{childList:true,subtree:false});
    }
  }
  document.addEventListener("keydown",function(evt){
    if(evt.key==="Escape"&&root&&!root.hidden){
      evt.preventDefault();
      if(root.querySelector(".bk-srs-layer"))closeSrsLayer();
      else if(root.querySelector(".bk-chunk-layer"))closeChunks();
      else close();
    }
  });
  function updateVisibleMastery(){
    if(!root||root.hidden||!srs)return;
    currentStep().entries.forEach(function(item){refreshMastery(item.n);});
  }
  window.addEventListener("storage",function(evt){
    if(srs && evt.key===srs.key){srs.reload();updateVisibleMastery();}
  });
  document.addEventListener("visibilitychange",function(){
    if(!document.hidden)updateVisibleMastery();
  });
  window.addEventListener("hashchange",function(){if(root&&!root.hidden)close();});
  window.Book2100={open:open,close:close,getData:function(){return BOOK;},getState:function(){return JSON.parse(JSON.stringify(state));}};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();