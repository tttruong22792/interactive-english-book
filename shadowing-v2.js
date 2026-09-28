(function(){
  'use strict';

  function createRenderer(env){
    var q=function(s,root){return (root||document).querySelector(s);};
    var qa=function(s,root){return Array.prototype.slice.call((root||document).querySelectorAll(s));};
    var session=null;

    function esc(value){return env.esc ? env.esc(value) : String(value||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
    function escAttr(value){return env.escAttr ? env.escAttr(value) : esc(value);}
    function norm(value){return env.normalizeText ? env.normalizeText(value) : String(value||'').toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim();}
    function words(value){var m=String(value||'').replace(/[’]/g,"'").match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g);return m||[];}
    function todayStamp(){return new Date().toISOString().slice(0,10);}
    function icon(name){return env.uiIcon ? env.uiIcon(name) : '';}

    function store(){
      var state=env.state;
      if(!state.shadowingV2 || typeof state.shadowingV2!=='object'){
        state.shadowingV2={version:2,selectedLessonId:'',dayByLesson:{},dailyKeys:{},progress:{},testResults:{}};
      }
      var s=state.shadowingV2;
      s.dayByLesson=s.dayByLesson||{};
      s.dailyKeys=s.dailyKeys||{};
      s.progress=s.progress||{};
      s.testResults=s.testResults||{};
      return s;
    }

    function save(){
      if(env.saveState) env.saveState();
    }

    function patternStem(lesson){
      return String(lesson&&lesson.title||'')
        .replace(/[…]+/g,'')
        .replace(/[?]+$/g,'')
        .trim();
    }

    function frameText(lesson){
      var formula=lesson&&lesson.ui&&lesson.ui.formula;
      if(formula) return String(formula).replace(/<[^>]*>/g,'');
      return patternStem(lesson)+' + ...';
    }

    function keyOf(lessonId,item){
      return lessonId+'|'+norm(item&&item.en||'');
    }

    function getProgress(lesson,item){
      var s=store();
      var key=keyOf(lesson.id,item);
      if(!s.progress[key]){
        s.progress[key]={
          understood:false,
          chunks:false,
          shadowCount:0,
          speechScore:0,
          speechText:'',
          transforms:{},
          transformText:{},
          recallPassed:false,
          recallScore:0,
          recallText:'',
          personalDone:false,
          personalText:'',
          personalLocalAnalysis:null,
          personalAiAnalysis:null,
          personalAiRemaining:null,
          mastered:false,
          firstDay:0,
          lastDay:0,
          lastAt:0
        };
      }
      return s.progress[key];
    }

    function recalcMastery(progress){
      var transformPassed=Object.keys(progress.transforms||{}).filter(function(k){return Number(progress.transforms[k]||0)>=75;}).length;
      progress.mastered=Number(progress.shadowCount||0)>=3 && transformPassed>=2 && !!progress.recallPassed && !!progress.personalDone;
      return progress.mastered;
    }

    function lessonPool(lesson){
      var all=(env.collectLessonSentences?env.collectLessonSentences(lesson):[]).filter(function(item){
        var vi=String(item.vi||'').trim();
        if(!vi) return false;
        if(/^(đọc|ipa|nói chậm|nói tự nhiên)/i.test(vi)) return false;
        if(vi.indexOf('→')>=0) return false;
        return true;
      });
      var stem=norm(patternStem(lesson));
      var primary=all.filter(function(item){return norm(item.en).indexOf(stem)===0;});
      var base=primary.length>=8?primary:all;
      var seen={};
      return base.filter(function(item){
        var k=norm(item.en);
        if(!k||seen[k]) return false;
        seen[k]=true;
        return true;
      }).map(function(item,index){
        return {
          en:item.en,
          vi:item.vi||'',
          originalVi:item.originalVi||item.vi||'',
          source:item.source||'',
          lessonId:lesson.id,
          lessonTitle:lesson.title||'',
          lessonOrder:Number(lesson.order||0),
          index:index,
          complexity:words(item.en).length
        };
      });
    }

    function roleFor(item,pool){
      var sorted=pool.slice().sort(function(a,b){return a.complexity-b.complexity;});
      var pos=sorted.findIndex(function(x){return norm(x.en)===norm(item.en);});
      var ratio=sorted.length>1?pos/(sorted.length-1):0;
      if(/work|meeting|job|project|issue|customer|colleague/i.test(item.source+' '+item.en)) return 'Công việc';
      if(ratio<0.18) return 'Câu lõi';
      if(ratio<0.42) return 'Đời sống';
      if(ratio<0.65) return 'Giao tiếp';
      if(ratio<0.84) return 'Mở rộng';
      return 'Tự nhiên nâng cao';
    }

    function balancedPick(items,count){
      var list=items.slice().sort(function(a,b){
        if(a.complexity!==b.complexity) return a.complexity-b.complexity;
        return a.index-b.index;
      });
      if(list.length<=count) return list;
      var picked=[];
      for(var i=0;i<count;i++){
        var idx=count===1?Math.floor((list.length-1)/2):Math.round(i*(list.length-1)/(count-1));
        var item=list[idx];
        if(item && !picked.some(function(x){return norm(x.en)===norm(item.en);})) picked.push(item);
      }
      for(var j=0;j<list.length && picked.length<count;j++){
        if(!picked.some(function(x){return norm(x.en)===norm(list[j].en);})) picked.push(list[j]);
      }
      return picked.slice(0,count);
    }

    function dailyItems(lesson,pool){
      var s=store();
      var day=Number(s.dayByLesson[lesson.id]||1);
      if(!s.dayByLesson[lesson.id]) s.dayByLesson[lesson.id]=day;
      var savedKeys=Array.isArray(s.dailyKeys[lesson.id])?s.dailyKeys[lesson.id]:[];
      var restored=savedKeys.map(function(key){
        return pool.find(function(item){return keyOf(lesson.id,item)===key;});
      }).filter(Boolean);
      if(restored.length===5) return restored;

      var weak=pool.filter(function(item){
        var p=s.progress[keyOf(lesson.id,item)];
        return p && p.lastDay>0 && p.lastDay<day && !p.mastered;
      }).sort(function(a,b){
        var pa=s.progress[keyOf(lesson.id,a)]||{};
        var pb=s.progress[keyOf(lesson.id,b)]||{};
        var aa=(pa.recallPassed?1:0)+(Object.keys(pa.transforms||{}).filter(function(k){return Number(pa.transforms[k]||0)>=75;}).length/2);
        var bb=(pb.recallPassed?1:0)+(Object.keys(pb.transforms||{}).filter(function(k){return Number(pb.transforms[k]||0)>=75;}).length/2);
        if(aa!==bb) return aa-bb;
        return Number(pa.lastAt||0)-Number(pb.lastAt||0);
      }).slice(0,2);

      var used={};
      weak.forEach(function(item){used[keyOf(lesson.id,item)]=true;});
      var fresh=pool.filter(function(item){
        var k=keyOf(lesson.id,item);
        return !used[k] && !s.progress[k];
      });
      var picked=weak.concat(balancedPick(fresh,5-weak.length));
      picked.forEach(function(item){used[keyOf(lesson.id,item)]=true;});

      if(picked.length<5){
        var fallback=pool.filter(function(item){return !used[keyOf(lesson.id,item)];})
          .sort(function(a,b){
            var pa=s.progress[keyOf(lesson.id,a)]||{};
            var pb=s.progress[keyOf(lesson.id,b)]||{};
            return Number(pa.lastAt||0)-Number(pb.lastAt||0);
          });
        for(var i=0;i<fallback.length && picked.length<5;i++){
          picked.push(fallback[i]);
          used[keyOf(lesson.id,fallback[i])]=true;
        }
      }

      picked=picked.slice(0,5);
      s.dailyKeys[lesson.id]=picked.map(function(item){return keyOf(lesson.id,item);});
      save();
      return picked;
    }

    function normalizeVi(value){
      return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
    }

    function answersFor(item,pool){
      var vi=normalizeVi(item.vi);
      var answers=pool.filter(function(x){return normalizeVi(x.vi)===vi;}).map(function(x){return x.en;});
      if(!answers.length) answers=[item.en];
      return answers;
    }

    function bestScore(userText,answers){
      var best=env.bestQuizAnswerDiff?env.bestQuizAnswerDiff(userText,answers):null;
      if(!best){
        var exact=answers.some(function(a){return norm(a)===norm(userText);});
        return {score:exact?100:0,bestAnswer:answers[0]||'',parts:[]};
      }
      var expectedWords=words(best.answer).length;
      var userWords=words(userText).length;
      var denominator=Math.max(expectedWords,userWords,1);
      var score=Math.max(0,Math.round((1-(best.result.distance/denominator))*100));
      return {score:score,bestAnswer:best.answer,parts:best.result.parts||[]};
    }

    function scoreHtml(result){
      var good=result.score>=75;
      var diff=env.quizWordDiffHTML?env.quizWordDiffHTML(result.parts,good):'';
      return '<div class="shadow-v2-check '+(good?'good':'bad')+'"><strong>'+(good?'Đạt':'Chưa đạt')+' · '+result.score+'%</strong>'+diff+'</div>';
    }

    function chunkMeaning(chunk,lesson,index){
      if(index===0) return lesson.meaning||'Khung chính của mẫu câu.';
      var n=norm(chunk);
      var phrase=(lesson.phrases&&lesson.phrases[n])||(window.CORE_PHRASES&&window.CORE_PHRASES[n]);
      if(phrase && phrase[1]) return phrase[1];
      var dict=Object.assign({},window.CORE_DICTIONARY||{},lesson.dictionary||{});
      var bits=[];
      words(chunk).forEach(function(w){
        var entry=dict[norm(w)];
        if(entry&&entry[1]){
          var short=String(entry[1]).split(/[;；]/)[0].trim();
          if(short && !bits.some(function(x){return x.text===short;})) bits.push({word:w,text:short});
        }
      });
      if(bits.length){
        return bits.slice(0,4).map(function(x){return x.word+' = '+x.text;}).join(' · ');
      }
      return 'Phần nội dung thay đổi theo ý bạn muốn nói.';
    }

    function sentenceChunks(item,lesson){
      var enWords=words(item.en);
      var stemWords=words(patternStem(lesson));
      var stemCount=0;
      for(var i=0;i<stemWords.length && i<enWords.length;i++){
        if(norm(stemWords[i])===norm(enWords[i])) stemCount++;
        else break;
      }
      if(stemCount<2) stemCount=Math.min(Math.max(2,stemWords.length),enWords.length);
      var chunks=[];
      if(stemCount) chunks.push(enWords.slice(0,stemCount).join(' '));
      var rest=enWords.slice(stemCount);
      var connectors={so:1,because:1,before:1,after:1,when:1,while:1,with:1,for:1,at:1,in:1,on:1,but:1,and:1};
      var current=[];
      rest.forEach(function(w){
        var lw=norm(w);
        if(current.length && (connectors[lw]||current.length>=4)){
          chunks.push(current.join(' '));
          current=[];
        }
        current.push(w);
      });
      if(current.length) chunks.push(current.join(' '));
      return chunks.filter(Boolean);
    }

    function transformTargets(item,pool){
      var idx=pool.findIndex(function(x){return norm(x.en)===norm(item.en);});
      if(idx<0) idx=0;
      var candidates=[];
      var offsets=[1,Math.max(2,Math.floor(pool.length/2)),3,5,7];
      offsets.forEach(function(offset){
        if(!pool.length) return;
        var x=pool[(idx+offset)%pool.length];
        if(x && norm(x.en)!==norm(item.en) && !candidates.some(function(c){return norm(c.en)===norm(x.en);})) candidates.push(x);
      });
      return candidates.slice(0,2);
    }


    function expansionSuggestions(text,lesson,pool){
      var stem=norm(patternStem(lesson));
      var current=norm(text);
      var currentLen=words(text).length;
      var candidates=(pool||[]).filter(function(item){
        var n=norm(item.en);
        return n!==current && n.indexOf(stem)===0;
      }).map(function(item){
        var len=words(item.en).length;
        var richer=len>=currentLen?0:5;
        var distance=Math.abs(len-currentLen);
        var sourceBoost=/work|dialog|expansion|master/i.test(item.source||'')?-1:0;
        return {item:item,score:richer+distance+sourceBoost};
      }).sort(function(a,b){return a.score-b.score;});

      var picked=[];
      for(var i=0;i<candidates.length&&picked.length<3;i++){
        if(!picked.some(function(x){return norm(x)===norm(candidates[i].item.en);})) picked.push(candidates[i].item.en);
      }
      return picked;
    }

    function localCoach(text,lesson,pool){
      var sentence=String(text||'').trim();
      var normalized=norm(sentence);
      var stem=norm(patternStem(lesson));
      var sentenceWords=words(sentence);
      var stemWords=words(patternStem(lesson));
      var usesPattern=normalized.indexOf(stem)===0;
      var grammar=[];
      var vocabulary=[];
      var tips=[];
      var tail=sentenceWords.slice(stemWords.length);
      var firstTail=String(tail[0]||'').toLowerCase();
      var basePatterns=[
        "i'd like to","i'm going to","i want to","i plan to","i hope to",
        "would you like to","do you want to","i intend to","i need to"
      ];
      var basePattern=basePatterns.indexOf(stem)>=0;

      for(var i=1;i<sentenceWords.length;i++){
        if(norm(sentenceWords[i])===norm(sentenceWords[i-1])){
          grammar.push('Có một từ bị lặp liên tiếp: “'+sentenceWords[i]+'”.');
          break;
        }
      }

      if(basePattern && /ing$/i.test(firstTail) && firstTail.length>4){
        grammar.push('Sau mẫu này thường dùng động từ nguyên mẫu: '+patternStem(lesson)+' + V, không dùng V-ing ngay sau “to”.');
      }
      if(stem==="i'd rather" && /ing$/i.test(firstTail) && firstTail.length>4){
        grammar.push('Sau “I’d rather” thường dùng động từ nguyên mẫu không “to”: I’d rather + V.');
      }
      if(stem==='i look forward to'){
        var commonBase=['see','meet','hear','work','talk','visit','learn','start','go','come','join','discuss','receive'];
        if(commonBase.indexOf(firstTail)>=0){
          grammar.push('Sau “look forward to”, “to” là giới từ: thường dùng danh từ hoặc V-ing, ví dụ “I look forward to seeing…”.');
        }
      }

      if(/\bcan\s+to\b/i.test(sentence)) grammar.push('Sau “can” dùng động từ nguyên mẫu không “to”: can + V.');
      if(/\bcan\s+[a-z]+ing\b/i.test(sentence)) grammar.push('Sau “can” thường dùng động từ nguyên mẫu: can + V.');
      if(/\bfor\s+(talk|communicate|learn|improve|work|study|practice|buy|go|do|make|check|discuss|speak)\b/i.test(sentence)){
        grammar.push('Sau “for” không đặt trực tiếp động từ nguyên mẫu. Có thể dùng “for + V-ing” hoặc đổi sang “so that I can + V” tùy ý nghĩa.');
      }

      var phraseBank=Object.assign({},window.CORE_PHRASES||{},lesson.phrases||{});
      var phraseHits=Object.keys(phraseBank).filter(function(key){
        var n=norm(key);
        return n.split(' ').length>=2 && normalized.indexOf(n)>=0;
      }).sort(function(a,b){return words(b).length-words(a).length;});
      if(phraseHits.length){
        var best=phraseHits[0];
        var meaning=phraseBank[best]?.[1]||'';
        vocabulary.push('Bạn đã dùng cụm “'+best+'”'+(meaning?' = '+meaning:'')+'.');
      }else{
        vocabulary.push('Câu đã dùng đúng khung; hãy ưu tiên học thêm các cụm cố định thay vì ghép từng từ riêng lẻ.');
      }

      if(/\bimprove english\b/i.test(sentence) && !/\bimprove my english\b/i.test(sentence)){
        tips.push('Nếu nói về kỹ năng của chính bạn, “improve my English” thường tự nhiên và cụ thể hơn.');
      }
      if(sentenceWords.length<=stemWords.length+1){
        tips.push('Câu còn rất ngắn. Hãy thêm đối tượng, thời gian, lý do hoặc mục đích để biến nó thành câu giao tiếp thật.');
      }

      var ok=usesPattern && sentenceWords.length>stemWords.length && grammar.length===0;
      return {
        ok:ok,
        usesPattern:usesPattern,
        verdict:!usesPattern?'wrong_pattern':grammar.length?'needs_review':'basic_pass',
        grammarNotes:grammar,
        vocabularyNotes:vocabulary,
        tips:tips,
        expansions:expansionSuggestions(sentence,lesson,pool)
      };
    }

    function localCoachHTML(analysis){
      if(!analysis) return '';
      var verdict=analysis.verdict==='basic_pass'
        ? '<span class="shadow-v2-coach-badge good">Qua kiểm tra cơ bản</span>'
        : analysis.verdict==='wrong_pattern'
          ? '<span class="shadow-v2-coach-badge bad">Chưa dùng đúng mẫu</span>'
          : '<span class="shadow-v2-coach-badge warn">Có điểm cần xem lại</span>';

      var grammar=analysis.grammarNotes?.length
        ? '<ul>'+analysis.grammarNotes.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>'
        : '<p>Không phát hiện lỗi thuộc các quy tắc miễn phí hiện đang kiểm tra.</p>';
      var vocab=analysis.vocabularyNotes?.length
        ? '<ul>'+analysis.vocabularyNotes.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>'
        : '';
      var tips=analysis.tips?.length
        ? '<div class="shadow-v2-coach-tip"><strong>Gợi ý:</strong> '+analysis.tips.map(esc).join(' ')+'</div>'
        : '';
      var expansions=analysis.expansions?.length
        ? '<div class="shadow-v2-coach-expansions"><strong>Gợi ý mở rộng từ bài học</strong>'+analysis.expansions.map(function(x){return '<div><span>→</span><b>'+esc(x)+'</b></div>';}).join('')+'</div>'
        : '';

      return '<div class="shadow-v2-coach-card local">'+
        '<div class="shadow-v2-coach-head"><div><span>KIỂM TRA MIỄN PHÍ · TRÊN THIẾT BỊ</span><strong>Nhận xét nhanh</strong></div>'+verdict+'</div>'+
        '<div class="shadow-v2-coach-section"><b>Mẫu câu</b><p>'+(analysis.usesPattern?'✓ Bạn đang dùng đúng khung hôm nay.':'Hãy bắt đầu câu bằng đúng khung đang học.')+'</p></div>'+
        '<div class="shadow-v2-coach-section"><b>Ngữ pháp cơ bản</b>'+grammar+'</div>'+
        '<div class="shadow-v2-coach-section"><b>Từ vựng / cụm từ</b>'+vocab+'</div>'+
        tips+expansions+
        '<small class="shadow-v2-coach-limit">Bộ kiểm tra miễn phí chỉ dùng quy tắc và dữ liệu bài học, nên không thể đánh giá mọi sắc thái tự nhiên như AI/người bản xứ.</small>'+
      '</div>';
    }

    function aiCoachHTML(data,remaining){
      if(!data) return '';
      var label={
        natural:'Đúng & tự nhiên',
        correct_but_unnatural:'Đúng nhưng có cách tự nhiên hơn',
        needs_correction:'Cần sửa',
        wrong_pattern:'Đúng ý nhưng chưa luyện đúng mẫu'
      }[data.verdict]||'AI Coach';
      var tone=(data.verdict==='natural')?'good':(data.verdict==='correct_but_unnatural'?'warn':'bad');
      var grammar=(data.grammar_notes||[]).length
        ? '<ul>'+(data.grammar_notes||[]).map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>'
        : '<p>AI không thấy lỗi ngữ pháp đáng kể.</p>';
      var vocab=(data.vocabulary_notes||[]).length
        ? '<ul>'+(data.vocabulary_notes||[]).map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>'
        : '<p>Cách dùng từ phù hợp.</p>';
      var corrected=String(data.corrected_sentence||'').trim();
      var expansions=(data.expansions||[]).map(function(x){
        return '<div class="shadow-v2-ai-expansion"><span>→</span><b>'+esc(x)+'</b></div>';
      }).join('');

      return '<div class="shadow-v2-coach-card ai">'+
        '<div class="shadow-v2-coach-head"><div><span>AI COACH · PHÂN TÍCH SÂU</span><strong>'+esc(label)+'</strong></div><span class="shadow-v2-coach-badge '+tone+'">'+Math.max(0,Math.min(100,Number(data.naturalness_score||0)))+'% tự nhiên</span></div>'+
        '<div class="shadow-v2-coach-section"><b>Ngữ pháp</b>'+grammar+'</div>'+
        '<div class="shadow-v2-coach-section"><b>Từ vựng / độ tự nhiên</b>'+vocab+'</div>'+
        (corrected?'<div class="shadow-v2-ai-correction"><span>Câu đề xuất</span><strong>'+esc(corrected)+'</strong></div>':'')+
        (data.explanation_vi?'<p class="shadow-v2-ai-explain">'+esc(data.explanation_vi)+'</p>':'')+
        (expansions?'<div class="shadow-v2-coach-expansions"><strong>Mở rộng thêm</strong>'+expansions+'</div>':'')+
        (data.encouragement_vi?'<div class="shadow-v2-ai-encourage">'+esc(data.encouragement_vi)+'</div>':'')+
        (remaining!=null?'<small class="shadow-v2-coach-limit">Còn '+Number(remaining)+' lượt AI Coach trong giới hạn 24 giờ.</small>':'')+
      '</div>';
    }

    function maskedSentence(item,lesson,count){
      if(count<2) return esc(item.en);
      if(count>=3) return '<span class="shadow-v2-blind-line">Không nhìn chữ. Nghe và nói đuổi theo.</span>';
      var enWords=words(item.en);
      var stemCount=words(patternStem(lesson)).length;
      return enWords.map(function(w,index){
        if(index<stemCount) return esc(w);
        return index%2===0?'_____':esc(w);
      }).join(' ');
    }

    function markTouched(lesson,item,progress){
      var day=Number(store().dayByLesson[lesson.id]||1);
      if(!progress.firstDay) progress.firstDay=day;
      progress.lastDay=day;
      progress.lastAt=Date.now();
      recalcMastery(progress);
      save();
    }

    function stepUnlocked(progress){
      var transformPassed=Object.keys(progress.transforms||{}).filter(function(k){return Number(progress.transforms[k]||0)>=75;}).length;
      if(!progress.understood) return 0;
      if(!progress.chunks) return 1;
      if(Number(progress.shadowCount||0)<3) return 2;
      if(transformPassed<2) return 3;
      return 4;
    }

    function sessionShell(body,item,progress){
      var steps=['Hiểu','Tách cụm','Shadow','Biến đổi','Tự nói'];
      var unlocked=stepUnlocked(progress);
      var tabs=steps.map(function(label,index){
        var done=index<unlocked || (index===4&&progress.recallPassed&&progress.personalDone);
        var active=index===session.step;
        var disabled=index>unlocked;
        return '<button class="shadow-v2-step '+(active?'active ':'')+(done?'done ':'')+'" data-shadow-v2-step="'+index+'" '+(disabled?'disabled':'')+'><span>'+(index+1)+'</span><b>'+label+'</b></button>';
      }).join('');
      return '<section class="shadow-v2-session">'+
        '<div class="shadow-v2-session-head">'+
          '<div><span class="eyebrow">SHADOWING · DAY '+store().dayByLesson[session.lesson.id]+'</span><h1>'+esc(session.lesson.title)+'</h1><p>Không học thuộc nguyên câu. Mục tiêu là nghe được, hiểu khung, biến đổi và tự nói.</p></div>'+
          '<button id="shadowV2Exit" class="secondary-button" type="button">Về kế hoạch hôm nay</button>'+
        '</div>'+
        '<div class="shadow-v2-session-meter"><div><strong>Câu '+(session.index+1)+'/5</strong><span>'+esc(roleFor(item,session.pool))+'</span></div><div class="shadow-v2-meter-track"><i style="width:'+Math.round(((session.index+1)/5)*100)+'%"></i></div></div>'+
        '<div class="shadow-v2-steps">'+tabs+'</div>'+
        '<article class="shadow-v2-stage">'+body+'</article>'+
      '</section>';
    }

    function understandBody(item,progress){
      return '<div class="shadow-v2-stage-kicker">BƯỚC 1 · HIỂU</div>'+
        '<h2>Hiểu câu trước khi shadow</h2>'+
        '<div class="shadow-v2-sentence-card">'+
          '<button id="shadowV2Listen" class="shadow-v2-audio" type="button">'+icon('volume-2')+'<span>Nghe câu</span></button>'+
          '<div class="english-text shadow-v2-main-en" data-en="'+escAttr(item.en)+'"></div>'+
          '<p class="shadow-v2-main-vi">'+esc(item.vi)+'</p>'+
        '</div>'+
        '<div class="shadow-v2-rule"><span>Khung đang học</span><strong>'+esc(frameText(session.lesson))+'</strong><p>'+esc(session.lesson.meaning||'')+'</p></div>'+
        '<div class="shadow-v2-action-row"><button id="shadowV2Understand" class="primary-button" type="button">'+(progress.understood?'Tiếp tục →':'Tôi đã hiểu câu này →')+'</button></div>';
    }

    function chunksBody(item,progress){
      var chunks=sentenceChunks(item,session.lesson);
      return '<div class="shadow-v2-stage-kicker">BƯỚC 2 · TÁCH CỤM</div>'+
        '<h2>Học theo cụm có nghĩa, không dịch từng chữ</h2>'+
        '<p class="shadow-v2-explain">Nhìn cách câu được chia thành các khối. Khối đầu tiên là mẫu câu; các khối sau là phần bạn có thể thay đổi.</p>'+
        '<div class="shadow-v2-chunks">'+chunks.map(function(chunk,index){
          return '<div class="shadow-v2-chunk '+(index===0?'core':'')+'"><strong>'+esc(chunk)+'</strong><span>'+esc(chunkMeaning(chunk,session.lesson,index))+'</span></div>';
        }).join('')+'</div>'+
        '<div class="shadow-v2-full-meaning"><span>Cả câu</span><b>'+esc(item.vi)+'</b></div>'+
        '<div class="shadow-v2-action-row"><button id="shadowV2ChunksDone" class="primary-button" type="button">'+(progress.chunks?'Tiếp tục →':'Tôi hiểu cách ghép câu →')+'</button></div>';
    }

    function shadowBody(item,progress){
      var count=Math.min(5,Number(progress.shadowCount||0));
      var dots='';
      for(var i=1;i<=5;i++) dots+='<span class="'+(i<=count?'done':'')+'">'+i+'</span>';
      var score=Number(progress.speechScore||0);
      return '<div class="shadow-v2-stage-kicker">BƯỚC 3 · SHADOW</div>'+
        '<h2>3 lượt chất lượng là đủ</h2>'+
        '<p class="shadow-v2-explain">Lượt 1–2 nhìn chữ. Từ lượt 3, chữ bị ẩn để tai và miệng phải tự làm việc. Có thể luyện thêm đến 5 lượt.</p>'+
        '<div class="shadow-v2-shadow-box">'+
          '<div id="shadowV2ShadowText" class="shadow-v2-shadow-text">'+maskedSentence(item,session.lesson,count)+'</div>'+
          '<div class="shadow-v2-rounds">'+dots+'</div>'+
          '<button id="shadowV2ShadowPlay" class="primary-button" type="button">'+icon('headphones')+'<span>Nghe + shadow lượt '+Math.min(5,count+1)+'</span></button>'+
        '</div>'+
        '<div class="shadow-v2-speech-check">'+
          '<div><strong>Kiểm tra lời bạn nói</strong><span>Speech recognition chỉ đo độ khớp từ, không phải điểm phát âm tuyệt đối.</span></div>'+
          '<button id="shadowV2ShadowMic" class="secondary-button" type="button">Nói để kiểm tra</button>'+
          '<input id="shadowV2ShadowCapture" class="hidden" type="text">'+
          (score?'<div class="shadow-v2-score '+(score>=75?'good':'bad')+'"><b>'+score+'%</b><span>độ khớp nhận dạng tốt nhất</span></div>':'')+
        '</div>'+
        '<div class="shadow-v2-action-row"><button id="shadowV2ShadowNext" class="primary-button" type="button" '+(count<3?'disabled':'')+'>Đủ 3 lượt · sang Biến đổi →</button></div>';
    }

    function transformCard(target,index,progress){
      var key=norm(target.en);
      var score=Number((progress.transforms||{})[key]||0);
      var typed=(progress.transformText||{})[key]||'';
      return '<div class="shadow-v2-transform-card" data-transform-card="'+index+'">'+
        '<div class="shadow-v2-transform-number">'+(index+1)+'</div>'+
        '<div class="shadow-v2-transform-copy"><span>Giữ khung: <b>'+esc(patternStem(session.lesson))+'</b></span><h3>'+esc(target.vi)+'</h3>'+
          '<div class="shadow-v2-answer-row"><input id="shadowV2TransformInput'+index+'" type="text" value="'+escAttr(typed)+'" placeholder="Tự nói hoặc nhập câu tiếng Anh..."><button data-transform-mic="'+index+'" class="secondary-button" type="button">Nói</button><button data-transform-check="'+index+'" class="primary-button" type="button">Kiểm tra</button></div>'+
          '<div id="shadowV2TransformFeedback'+index+'">'+(score?'<div class="shadow-v2-mini-result '+(score>=75?'good':'bad')+'">'+score+'% '+(score>=75?'· Đạt':'· Thử lại')+'</div>':'')+'</div>'+
        '</div>'+
      '</div>';
    }

    function transformsBody(item,progress){
      var targets=transformTargets(item,session.pool);
      var passed=Object.keys(progress.transforms||{}).filter(function(k){return Number(progress.transforms[k]||0)>=75;}).length;
      return '<div class="shadow-v2-stage-kicker">BƯỚC 4 · BIẾN ĐỔI</div>'+
        '<h2>Dùng cùng một khung để nói 2 ý mới</h2>'+
        '<p class="shadow-v2-explain">Đây là bước chống học vẹt. Đừng nhại câu gốc; hãy tạo câu mới từ tiếng Việt.</p>'+
        '<div class="shadow-v2-transform-list">'+targets.map(function(t,i){return transformCard(t,i,progress);}).join('')+'</div>'+
        '<div class="shadow-v2-pass-line"><strong>'+Math.min(2,passed)+'/2</strong><span>câu biến đổi đã đạt</span></div>'+
        '<div class="shadow-v2-action-row"><button id="shadowV2TransformNext" class="primary-button" type="button" '+(passed<2?'disabled':'')+'>Đã biến đổi được · sang Tự nói →</button></div>';
    }

    function recallBody(item,progress){
      var recallScore=Number(progress.recallScore||0);
      var stem=patternStem(session.lesson);
      return '<div class="shadow-v2-stage-kicker">BƯỚC 5 · TỰ NÓI</div>'+
        '<h2>Không nghe trước. Không nhìn câu tiếng Anh.</h2>'+
        '<div class="shadow-v2-recall-box">'+
          '<span>NHÌN Ý TIẾNG VIỆT → TỰ TẠO TIẾNG ANH</span>'+
          '<h3>'+esc(item.vi)+'</h3>'+
          '<div class="shadow-v2-answer-row"><input id="shadowV2RecallInput" type="text" value="'+escAttr(progress.recallText||'')+'" placeholder="Nói hoặc nhập câu bạn tự tạo..."><button id="shadowV2RecallMic" class="secondary-button" type="button">Nói</button><button id="shadowV2RecallCheck" class="primary-button" type="button">Kiểm tra</button></div>'+
          '<div id="shadowV2RecallFeedback">'+(recallScore?'<div class="shadow-v2-mini-result '+(recallScore>=75?'good':'bad')+'">'+recallScore+'% '+(progress.recallPassed?'· Đạt':'· Thử lại')+'</div>':'')+'</div>'+
        '</div>'+
        '<div class="shadow-v2-personal-box">'+
          '<span>MAKE IT YOURS · NÓI VỀ BẠN</span>'+
          '<h3>Dùng <b>'+esc(stem)+'</b> để nói một điều thật về cuộc sống của bạn.</h3>'+
          '<p>Tự nói trước. Sau đó web kiểm tra miễn phí ngay trên thiết bị; nếu đã đăng nhập, bạn có thể nhờ AI Coach phân tích sâu hơn về ngữ pháp, từ vựng và độ tự nhiên.</p>'+
          '<div class="shadow-v2-answer-row"><input id="shadowV2PersonalInput" type="text" value="'+escAttr(progress.personalText||'')+'" placeholder="'+escAttr(stem)+' ..."><button id="shadowV2PersonalMic" class="secondary-button" type="button">Nói</button><button id="shadowV2PersonalCheck" class="primary-button" type="button">Phân tích câu của tôi</button></div>'+
          '<div id="shadowV2PersonalFeedback">'+
            localCoachHTML(progress.personalLocalAnalysis)+
            aiCoachHTML(progress.personalAiAnalysis,progress.personalAiRemaining)+
            (progress.personalLocalAnalysis?(
              window.LanguageStudioAICoach?.status?.().signedIn
                ? '<button id="shadowV2AiCoach" class="shadow-v2-ai-button" type="button">'+(progress.personalAiAnalysis?'Phân tích lại bằng AI':'AI Coach · phân tích sâu')+'</button>'
                : '<button id="shadowV2AiLogin" class="shadow-v2-ai-button is-login" type="button">Đăng nhập để dùng AI Coach</button>'
            ):'')+
          '</div>'+
        '</div>'+
        '<div class="shadow-v2-action-row"><button id="shadowV2FinishSentence" class="primary-button" type="button" '+(!(progress.recallPassed&&progress.personalDone)?'disabled':'')+'>'+(session.index===session.items.length-1?'Hoàn thành câu 5 →':'Hoàn thành · sang câu tiếp theo →')+'</button></div>';
    }

    function renderSession(){
      var item=session.items[session.index];
      var progress=getProgress(session.lesson,item);
      recalcMastery(progress);
      var body=session.step===0?understandBody(item,progress):session.step===1?chunksBody(item,progress):session.step===2?shadowBody(item,progress):session.step===3?transformsBody(item,progress):recallBody(item,progress);
      env.setLesson(session.lesson);
      env.main.innerHTML=sessionShell(body,item,progress);
      if(env.hydrateSentences) env.hydrateSentences(env.main);
      bindSession(item,progress);
      window.scrollTo({top:0,behavior:'instant'});
    }

    function speechInput(input,callback){
      if(!input) return;
      env.startRecognition(input,function(){callback(input.value||'');});
    }

    function evaluateInto(input,feedback,answers,onResult){
      var text=String(input.value||'').trim();
      if(!text){env.toast('Hãy nói hoặc nhập câu tiếng Anh trước.');return;}
      var result=bestScore(text,answers);
      feedback.innerHTML=scoreHtml(result);
      onResult(result,text);
    }

    function bindSession(item,progress){
      q('#shadowV2Exit').onclick=function(){session=null;render(env);};
      qa('[data-shadow-v2-step]').forEach(function(btn){
        btn.onclick=function(){session.step=Number(btn.getAttribute('data-shadow-v2-step'))||0;renderSession();};
      });

      if(session.step===0){
        q('#shadowV2Listen').onclick=function(){env.speak(item.en,q('.shadow-v2-main-en'),env.state.rate);};
        q('#shadowV2Understand').onclick=function(){progress.understood=true;markTouched(session.lesson,item,progress);session.step=1;renderSession();};
        return;
      }

      if(session.step===1){
        q('#shadowV2ChunksDone').onclick=function(){progress.chunks=true;markTouched(session.lesson,item,progress);session.step=2;renderSession();};
        return;
      }

      if(session.step===2){
        q('#shadowV2ShadowPlay').onclick=async function(){
          var btn=this;
          btn.disabled=true;
          btn.querySelector('span').textContent='Đang phát...';
          await env.speak(item.en,q('#shadowV2ShadowText'),env.state.rate);
          progress.shadowCount=Math.min(5,Number(progress.shadowCount||0)+1);
          markTouched(session.lesson,item,progress);
          renderSession();
        };
        q('#shadowV2ShadowMic').onclick=function(){
          var input=q('#shadowV2ShadowCapture');
          speechInput(input,function(text){
            var result=bestScore(text,answersFor(item,session.pool));
            progress.speechScore=Math.max(Number(progress.speechScore||0),result.score);
            progress.speechText=text;
            markTouched(session.lesson,item,progress);
            renderSession();
          });
        };
        q('#shadowV2ShadowNext').onclick=function(){session.step=3;renderSession();};
        return;
      }

      if(session.step===3){
        var targets=transformTargets(item,session.pool);
        targets.forEach(function(target,index){
          var input=q('#shadowV2TransformInput'+index);
          var feedback=q('#shadowV2TransformFeedback'+index);
          var check=function(){
            evaluateInto(input,feedback,answersFor(target,session.pool),function(result,text){
              var key=norm(target.en);
              progress.transforms=progress.transforms||{};
              progress.transformText=progress.transformText||{};
              progress.transforms[key]=Math.max(Number(progress.transforms[key]||0),result.score);
              progress.transformText[key]=text;
              markTouched(session.lesson,item,progress);
              setTimeout(renderSession,450);
            });
          };
          q('[data-transform-check="'+index+'"]').onclick=check;
          q('[data-transform-mic="'+index+'"]').onclick=function(){speechInput(input,function(){check();});};
          input.onkeydown=function(e){if(e.key==='Enter') check();};
        });
        q('#shadowV2TransformNext').onclick=function(){session.step=4;renderSession();};
        return;
      }

      var recallInput=q('#shadowV2RecallInput');
      var recallFeedback=q('#shadowV2RecallFeedback');
      var checkRecall=function(){
        evaluateInto(recallInput,recallFeedback,answersFor(item,session.pool),function(result,text){
          progress.recallScore=Math.max(Number(progress.recallScore||0),result.score);
          progress.recallText=text;
          if(result.score>=75) progress.recallPassed=true;
          markTouched(session.lesson,item,progress);
          setTimeout(renderSession,450);
        });
      };
      q('#shadowV2RecallCheck').onclick=checkRecall;
      q('#shadowV2RecallMic').onclick=function(){speechInput(recallInput,function(){checkRecall();});};
      recallInput.onkeydown=function(e){if(e.key==='Enter') checkRecall();};

      var personalInput=q('#shadowV2PersonalInput');
      var checkPersonal=function(){
        var text=String(personalInput.value||'').trim();
        if(!text){env.toast('Hãy nói hoặc nhập câu của bạn trước.');return;}
        var analysis=localCoach(text,session.lesson,session.pool);
        progress.personalText=text;
        progress.personalLocalAnalysis=analysis;
        progress.personalAiAnalysis=null;
        progress.personalAiRemaining=null;
        progress.personalDone=!!analysis.ok;
        markTouched(session.lesson,item,progress);
        setTimeout(renderSession,220);
      };
      q('#shadowV2PersonalCheck').onclick=checkPersonal;
      q('#shadowV2PersonalMic').onclick=function(){speechInput(personalInput,function(){checkPersonal();});};
      personalInput.onkeydown=function(e){if(e.key==='Enter') checkPersonal();};
      personalInput.oninput=function(){
        if(norm(personalInput.value)!==norm(progress.personalText||'')){
          progress.personalDone=false;
          progress.personalLocalAnalysis=null;
          progress.personalAiAnalysis=null;
          progress.personalAiRemaining=null;
          var finish=q('#shadowV2FinishSentence');
          if(finish) finish.disabled=true;
        }
      };

      var aiButton=q('#shadowV2AiCoach');
      if(aiButton){
        aiButton.onclick=async function(){
          if(!progress.personalText){env.toast('Hãy phân tích câu miễn phí trước.');return;}
          aiButton.disabled=true;
          aiButton.textContent='AI đang phân tích...';
          try{
            var result=await window.LanguageStudioAICoach.analyze({
              sentence:progress.personalText,
              targetPattern:patternStem(session.lesson),
              patternMeaning:session.lesson.meaning||'',
              lessonTitle:session.lesson.title||'',
              lessonId:session.lesson.id||''
            });
            progress.personalAiAnalysis=result.analysis||null;
            progress.personalAiRemaining=result.remaining;
            if(progress.personalAiAnalysis){
              var verdict=progress.personalAiAnalysis.verdict;
              progress.personalDone=verdict==='natural'||verdict==='correct_but_unnatural';
            }
            markTouched(session.lesson,item,progress);
            renderSession();
          }catch(error){
            aiButton.disabled=false;
            aiButton.textContent='AI Coach · thử lại';
            if(error?.code==='DAILY_LIMIT_REACHED') env.toast('Đã hết lượt AI Coach trong 24 giờ. Phần kiểm tra miễn phí vẫn dùng bình thường.');
            else if(error?.code==='AUTH_REQUIRED') env.toast('Hãy đăng nhập để dùng AI Coach.');
            else env.toast('AI Coach tạm thời chưa phản hồi. Kiểm tra miễn phí vẫn hoạt động.');
          }
        };
      }
      var aiLogin=q('#shadowV2AiLogin');
      if(aiLogin) aiLogin.onclick=function(){location.hash='#settings';};

      q('#shadowV2FinishSentence').onclick=function(){
        recalcMastery(progress);
        markTouched(session.lesson,item,progress);
        if(session.index<session.items.length-1){
          session.index++;
          var nextProgress=getProgress(session.lesson,session.items[session.index]);
          session.step=stepUnlocked(nextProgress);
          renderSession();
        }else{
          renderSummary();
        }
      };
    }

    function dimensionRow(item){
      var p=getProgress(session.lesson,item);
      var transforms=Object.keys(p.transforms||{}).filter(function(k){return Number(p.transforms[k]||0)>=75;}).length;
      recalcMastery(p);
      return '<div class="shadow-v2-result-row '+(p.mastered?'mastered':'')+'">'+
        '<div><strong>'+esc(item.en)+'</strong><span>'+esc(item.vi)+'</span></div>'+
        '<div class="shadow-v2-result-badges">'+
          '<span class="'+(Number(p.shadowCount||0)>=3?'ok':'')+'">Âm thanh '+Math.min(5,Number(p.shadowCount||0))+'/3</span>'+
          '<span class="'+(transforms>=2?'ok':'')+'">Biến đổi '+Math.min(2,transforms)+'/2</span>'+
          '<span class="'+(p.recallPassed&&p.personalDone?'ok':'')+'">Chủ động '+(p.recallPassed&&p.personalDone?'✓':'—')+'</span>'+
          '<b>'+(p.mastered?'MASTERED':'CẦN ÔN')+'</b>'+
        '</div>'+
      '</div>';
    }

    function renderSummary(){
      var mastered=session.items.filter(function(item){return getProgress(session.lesson,item).mastered;}).length;
      var active=session.items.filter(function(item){var p=getProgress(session.lesson,item);return p.recallPassed&&p.personalDone;}).length;
      env.main.innerHTML='<section class="shadow-v2-summary">'+
        '<div class="shadow-v2-summary-hero"><span class="eyebrow">HOÀN THÀNH 5 CÂU</span><h1>Hôm nay bạn không chỉ nhại lại.</h1><p>Bây giờ kiểm tra lần cuối: nhìn tiếng Việt và tự nói, không nghe mẫu trước.</p>'+
        '<div class="shadow-v2-summary-stats"><div><b>5/5</b><span>đã luyện</span></div><div><b>'+active+'/5</b><span>đã tự tạo</span></div><div><b>'+mastered+'</b><span>đã thành thạo</span></div><div><b>'+(5-mastered)+'</b><span>sẽ được ưu tiên ôn</span></div></div></div>'+
        '<div class="shadow-v2-results">'+session.items.map(dimensionRow).join('')+'</div>'+
        '<div class="shadow-v2-summary-actions"><button id="shadowV2ActiveTest" class="primary-button" type="button">Kiểm tra không nhìn đáp án</button><button id="shadowV2BackPlan" class="secondary-button" type="button">Về kế hoạch</button></div>'+
      '</section>';
      q('#shadowV2ActiveTest').onclick=startActiveTest;
      q('#shadowV2BackPlan').onclick=function(){session=null;render(env);};
      window.scrollTo({top:0,behavior:'instant'});
    }

    function shuffled(list){
      var out=list.slice();
      for(var i=out.length-1;i>0;i--){
        var j=Math.floor(Math.random()*(i+1));
        var tmp=out[i];out[i]=out[j];out[j]=tmp;
      }
      return out;
    }

    function startActiveTest(){
      session.test={items:shuffled(session.items),index:0,correct:0,results:[],checked:false,currentResult:null,currentText:''};
      renderActiveTest();
    }

    function renderActiveTest(){
      var test=session.test;
      if(test.index>=test.items.length){renderTestFinished();return;}
      var item=test.items[test.index];
      env.main.innerHTML='<section class="shadow-v2-test">'+
        '<div class="shadow-v2-test-head"><div><span class="eyebrow">ACTIVE SPEAKING TEST</span><h1>Không được nhại</h1><p>Chỉ nhìn ý tiếng Việt. Không audio, không câu tiếng Anh trước khi bạn trả lời.</p></div><strong>'+(test.index+1)+'/5</strong></div>'+
        '<div class="shadow-v2-test-card"><span>TÌNH HUỐNG / Ý CẦN NÓI</span><h2>'+esc(item.vi)+'</h2>'+
          '<div class="shadow-v2-answer-row"><input id="shadowV2TestInput" type="text" value="'+escAttr(test.currentText||'')+'" placeholder="Tự nói hoặc nhập câu tiếng Anh..."><button id="shadowV2TestMic" class="secondary-button" type="button">Nói</button><button id="shadowV2TestCheck" class="primary-button" type="button">Kiểm tra</button></div>'+
          '<div id="shadowV2TestFeedback">'+(test.currentResult?scoreHtml(test.currentResult):'')+'</div>'+
        '</div>'+
        '<div class="shadow-v2-action-row"><button id="shadowV2TestNext" class="primary-button" type="button" '+(!test.checked?'disabled':'')+'>'+(test.index===4?'Xem kết quả':'Câu tiếp theo →')+'</button></div>'+
      '</section>';
      var input=q('#shadowV2TestInput');
      var check=function(){
        var text=String(input.value||'').trim();
        if(!text){env.toast('Hãy tự nói câu tiếng Anh trước.');return;}
        var result=bestScore(text,answersFor(item,session.pool));
        test.currentText=text;
        test.currentResult=result;
        if(!test.checked){
          test.checked=true;
          test.results.push({key:keyOf(session.lesson.id,item),score:result.score,text:text});
          if(result.score>=75) test.correct++;
          else{
            var p=getProgress(session.lesson,item);
            p.recallPassed=false;
            p.mastered=false;
            p.lastAt=Date.now();
            save();
          }
        }
        renderActiveTest();
      };
      q('#shadowV2TestCheck').onclick=check;
      q('#shadowV2TestMic').onclick=function(){speechInput(input,function(){check();});};
      input.onkeydown=function(e){if(e.key==='Enter') check();};
      q('#shadowV2TestNext').onclick=function(){
        test.index++;
        test.checked=false;
        test.currentResult=null;
        test.currentText='';
        renderActiveTest();
      };
    }

    function renderTestFinished(){
      var test=session.test;
      var s=store();
      var day=Number(s.dayByLesson[session.lesson.id]||1);
      if(!s.testResults[session.lesson.id]) s.testResults[session.lesson.id]={};
      s.testResults[session.lesson.id][day]={score:test.correct,total:5,at:Date.now(),date:todayStamp()};
      save();
      var weak=5-test.correct;
      env.main.innerHTML='<section class="shadow-v2-test-finish">'+
        '<span class="eyebrow">DAY '+day+' · COMPLETE</span>'+
        '<h1>'+test.correct+'/5 câu bật ra chủ động</h1>'+
        '<p>'+(weak===0?'Cả 5 câu đã vượt qua bài kiểm tra không nhìn đáp án.':weak+' câu chưa bật ra chắc chắn sẽ được ưu tiên đưa lại vào các ngày sau.')+'</p>'+
        '<div class="shadow-v2-test-score"><strong>'+Math.round((test.correct/5)*100)+'%</strong><span>Active Speaking</span></div>'+
        '<div class="shadow-v2-summary-actions"><button id="shadowV2NextDay" class="primary-button" type="button">Mở 5 câu của Day '+(day+1)+'</button><button id="shadowV2RepeatDay" class="secondary-button" type="button">Xem lại kết quả hôm nay</button></div>'+
      '</section>';
      q('#shadowV2NextDay').onclick=function(){
        s.dayByLesson[session.lesson.id]=day+1;
        delete s.dailyKeys[session.lesson.id];
        save();
        session=null;
        render(env);
      };
      q('#shadowV2RepeatDay').onclick=renderSummary;
      window.scrollTo({top:0,behavior:'instant'});
    }

    function itemStatus(item,lesson){
      var p=getProgress(lesson,item);
      var transforms=Object.keys(p.transforms||{}).filter(function(k){return Number(p.transforms[k]||0)>=75;}).length;
      if(p.mastered) return 'Thành thạo';
      if(p.lastAt) return 'Đang luyện · '+Math.min(2,transforms)+'/2 biến đổi';
      return 'Mới';
    }

    function overallStats(lesson,pool){
      var mastered=0,started=0;
      pool.forEach(function(item){
        var p=store().progress[keyOf(lesson.id,item)];
        if(p){started++;if(p.mastered) mastered++;}
      });
      return {mastered:mastered,started:started,total:pool.length};
    }

    async function render(nextEnv){
      if(nextEnv) env=nextEnv;
      session=null;
      env.setHeader('English › Shadowing','Shadowing');
      var metas=(env.STORE&&env.STORE.list?env.STORE.list({language:'en',category:'patterns'}):[])
        .filter(function(item){return item.status==='available'&&item.source;})
        .sort(function(a,b){return (a.order||0)-(b.order||0);});
      var lessons=await Promise.all(metas.map(function(item){return env.ensureContent(item.id);}));
      if(!lessons.length){
        env.main.innerHTML='<section class="page-hero"><h1>Chưa có bài English để shadowing.</h1></section>';
        return;
      }

      var s=store();
      var selected=lessons.find(function(l){return l.id===s.selectedLessonId;});
      if(!selected){
        var visited=lessons.filter(function(l){return Number(env.state.lessonVisitsByLesson&&env.state.lessonVisitsByLesson[l.id]||0)>0;});
        selected=visited.length?visited[visited.length-1]:lessons[0];
        s.selectedLessonId=selected.id;
      }
      env.setLesson(selected);
      var pool=lessonPool(selected);
      var todays=dailyItems(selected,pool);
      var day=Number(s.dayByLesson[selected.id]||1);
      var stats=overallStats(selected,pool);
      var oldCount=todays.filter(function(item){
        var p=s.progress[keyOf(selected.id,item)];
        return p&&p.firstDay&&p.firstDay<day;
      }).length;

      var lessonButtons=lessons.map(function(lesson){
        var active=lesson.id===selected.id;
        var lp=lessonPool(lesson);
        var st=overallStats(lesson,lp);
        return '<button class="shadow-v2-lesson '+(active?'active':'')+'" data-shadow-v2-lesson="'+escAttr(lesson.id)+'" type="button"><span>'+String(lesson.order||'').padStart(2,'0')+'</span><div><strong>'+esc(lesson.title)+'</strong><small>'+st.mastered+'/'+st.total+' thành thạo</small></div></button>';
      }).join('');

      var preview=todays.map(function(item,index){
        var p=getProgress(selected,item);
        return '<div class="shadow-v2-today-item '+(p.mastered?'mastered':'')+'"><span class="shadow-v2-today-number">'+(index+1)+'</span><div><small>'+esc(roleFor(item,pool))+(p.firstDay&&p.firstDay<day?' · Ôn lại':'')+'</small><strong>'+esc(item.en)+'</strong><p>'+esc(item.vi)+'</p></div><em>'+esc(itemStatus(item,selected))+'</em></div>';
      }).join('');

      env.main.innerHTML='<section class="page-hero shadow-v2-hero">'+
        '<div class="eyebrow">5 CÂU / NGÀY · ACTIVE SHADOWING</div>'+
        '<h1>Nghe được → hiểu được → biến đổi được → tự nói được.</h1>'+
        '<p>Shadowing chỉ là một bước. Một câu chỉ được coi là thành thạo khi bạn dùng được cấu trúc đó để nói một ý mới của chính mình.</p>'+
        '<div class="shadow-v2-principle"><b>Tiêu chuẩn:</b><span>Tôi không chỉ nói lại được câu này; tôi có thể dùng cấu trúc của nó để nói 3–5 câu mới về cuộc sống của mình.</span></div>'+
      '</section>'+
      '<section class="book-section shadow-v2-method">'+
        '<div class="section-title-row"><div><span class="eyebrow">PHƯƠNG PHÁP</span><h2>5 bước cho mỗi câu</h2><p>Mỗi bước giải quyết một điểm yếu khác nhau của việc học vẹt.</p></div></div>'+
        '<div class="shadow-v2-method-grid"><div><b>1</b><strong>Hiểu</strong><span>Hiểu nghĩa cả câu.</span></div><div><b>2</b><strong>Tách cụm</strong><span>Nhìn ra khung tái sử dụng.</span></div><div><b>3</b><strong>Shadow</strong><span>Bắt nhịp, nối âm, ngữ điệu.</span></div><div><b>4</b><strong>Biến đổi</strong><span>Dùng khung cho 2 ý mới.</span></div><div><b>5</b><strong>Tự nói</strong><span>Không nhìn mẫu + nói về bạn.</span></div></div>'+
      '</section>'+
      '<details class="book-section shadow-v2-guide">'+
        '<summary><div><span class="eyebrow">HƯỚNG DẪN CÁCH HỌC</span><h2>Shadowing thế nào để không học vẹt?</h2><p>Đọc phần này một lần để hiểu mục tiêu của phương pháp.</p></div><span class="shadow-v2-guide-toggle">Xem hướng dẫn</span></summary>'+
        '<div class="shadow-v2-guide-body">'+
          '<div class="shadow-v2-guide-point"><b>1</b><div><strong>Không shadow một câu khi chưa hiểu.</strong><p>Trước tiên hãy hiểu nghĩa cả câu và các cụm quan trọng. Không cần dịch từng chữ máy móc.</p></div></div>'+
          '<div class="shadow-v2-guide-point"><b>2</b><div><strong>Không vừa shadow vừa dịch sang tiếng Việt.</strong><p>Khi shadow, tập trung hoàn toàn vào âm thanh, nhịp, nối âm và cách người bản xứ nói. Việc hiểu đã làm ở bước trước.</p></div></div>'+
          '<div class="shadow-v2-guide-point"><b>3</b><div><strong>Đơn vị cần nhớ là cụm và khung câu.</strong><p>Ví dụ <em>I’d like to + V</em> hoặc <em>so that I can + V</em>. Khi thấy được khung, bạn có thể thay nội dung phía sau để tạo câu mới.</p></div></div>'+
          '<div class="shadow-v2-guide-point"><b>4</b><div><strong>Nhại được chưa có nghĩa là dùng được.</strong><p>Nếu bạn nói lại rất trôi chảy nhưng khi nhìn tiếng Việt lại không tự tạo được câu, kiến thức đó vẫn chưa thành ngôn ngữ chủ động.</p></div></div>'+
          '<div class="shadow-v2-guide-point"><b>5</b><div><strong>Tiêu chuẩn cuối cùng: nói được câu mới về chính bạn.</strong><p>Một câu chỉ thực sự là “của bạn” khi bạn giữ được cấu trúc và tự thay nội dung để nói về công việc, gia đình, kế hoạch hoặc suy nghĩ thật của mình.</p></div></div>'+
          '<div class="shadow-v2-guide-example"><span>Ví dụ</span><strong>I’d like to improve my English so that I can communicate better at work.</strong><p>Không dừng ở việc thuộc câu này. Hãy đổi thành: <b>I’d like to learn more about SCADA.</b> → <b>I’d like to improve my English so that I can understand meetings better.</b> → cuối cùng tự nói một câu thật về bạn.</p></div>'+
          '<div class="shadow-v2-guide-rule"><strong>Công thức học:</strong><span>Hiểu → Phân tích cụm → Shadow → Biến đổi → Tự nói.</span></div>'+
        '</div>'+
      '</details>'+
      '<section class="book-section">'+
        '<div class="section-title-row"><div><span class="eyebrow">CHỌN 1 MẪU CÂU</span><h2>Hôm nay chỉ học sâu một mẫu</h2><p>Không trộn nhiều mẫu trong cùng buổi Shadowing chủ động.</p></div></div>'+
        '<div class="shadow-v2-lesson-grid">'+lessonButtons+'</div>'+
      '</section>'+
      '<section class="book-section shadow-v2-plan">'+
        '<div class="shadow-v2-plan-head"><div><span class="eyebrow">SHADOWING · DAY '+day+'</span><h2>'+esc(selected.title)+'</h2><p>5 câu · khoảng 15–20 phút'+(oldCount?' · '+oldCount+' câu yếu được đưa lại để ôn':'')+'</p></div>'+
          '<div class="shadow-v2-plan-stats"><div><b>'+stats.mastered+'</b><span>đã thành thạo</span></div><div><b>'+stats.started+'</b><span>đã chạm tới</span></div><div><b>'+stats.total+'</b><span>câu phù hợp</span></div></div>'+
        '</div>'+
        '<div class="shadow-v2-today-list">'+preview+'</div>'+
        '<div class="shadow-v2-start-row"><div><strong>Hôm nay chỉ cần 5 câu.</strong><span>Ứng dụng tự ưu tiên tối đa 2 câu yếu cũ, phần còn lại lấy từ dễ → nâng cao.</span></div><button id="shadowV2Start" class="primary-button shadow-v2-start" type="button">Bắt đầu 5 câu hôm nay →</button></div>'+
      '</section>';

      qa('[data-shadow-v2-lesson]',env.main).forEach(function(btn){
        btn.onclick=function(){
          s.selectedLessonId=btn.getAttribute('data-shadow-v2-lesson');
          save();
          render(env);
        };
      });
      q('#shadowV2Start',env.main).onclick=function(){
        session={lesson:selected,pool:pool,items:todays,index:0,step:0,test:null};
        var p=getProgress(selected,todays[0]);
        session.step=stepUnlocked(p);
        renderSession();
      };
      window.scrollTo({top:0,behavior:'instant'});
    }

    return {render:render};
  }

  window.ShadowingV2={
    render:function(env){
      if(!window.ShadowingV2.__renderer) window.ShadowingV2.__renderer=createRenderer(env);
      return window.ShadowingV2.__renderer.render(env);
    }
  };
})();