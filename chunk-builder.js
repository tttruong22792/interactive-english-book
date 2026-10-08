(function(){
  'use strict';

  function esc(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function norm(value){
    return String(value||'').toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim();
  }
  function coreBank(packs){
    var map=new Map();
    (packs||[]).forEach(function(pack){
      var cards=window.VocabularyTrainer?.studyChunks?.(pack)||[];
      cards.filter(function(card){return card.kind!=='building';}).forEach(function(card){
        var key=norm(card.baseEn);
        if(!key) return;
        if(!map.has(key)) map.set(key,{baseEn:card.baseEn,baseVi:card.baseVi,cards:[],lessons:[]});
        var item=map.get(key);
        item.cards.push(card);
        if(!item.lessons.some(function(x){return x.lessonId===pack.lessonId;})){
          item.lessons.push({lessonId:pack.lessonId,order:pack.order,pattern:pack.pattern});
        }
      });
    });
    return Array.from(map.values());
  }
  function familyFor(item){
    var rows=[];
    (item?.cards||[]).forEach(function(card){
      (card.usageExamples||[]).forEach(function(example){
        var en=typeof example==='string'?example:String(example?.en||'');
        var vi=typeof example==='string'?'':String(example?.vi||'');
        if(en && !rows.some(function(x){return norm(x.en)===norm(en);})){
          rows.push({en:en,vi:vi});
        }
      });
    });
    return rows;
  }
  function frames(){
    return (window.PATTERN_FRAMES_80||[]).filter(function(frame){return frame.kind==='verb-inf';});
  }
  function combine(pattern,chunk){
    var p=String(pattern||'').trim();
    var c=String(chunk||'').trim().replace(/[.!?]+$/,'');
    if(!p||!c) return '';
    var base=p.replace(/\.{3}\s*$/,'').trim();
    var question=/^(Would you|Do you|Shall we|Why don't we|Can I|Could you|May I|Is it possible to|Will you|Did I|Did you|When did you|How long does it take to|How often do you|Can you show me how to)/i.test(base);
    return base+' '+c+(question?'?':'.');
  }
  function settings(env){
    env.state.chunkBuilder=Object.assign({frameId:'frame-001',chunkKey:''},env.state.chunkBuilder||{});
    return env.state.chunkBuilder;
  }
  function render(env){
    var bank=coreBank(env.packs||[]);
    var fs=frames();
    var cfg=settings(env);
    if(!fs.some(function(x){return x.id===cfg.frameId;})) cfg.frameId=fs[0]?.id||'';
    if(!bank.some(function(x){return norm(x.baseEn)===cfg.chunkKey;})) cfg.chunkKey=norm(bank[0]?.baseEn||'');
    var frame=fs.find(function(x){return x.id===cfg.frameId;})||fs[0];
    var item=bank.find(function(x){return norm(x.baseEn)===cfg.chunkKey;})||bank[0];
    var sentence=combine(frame?.pattern,item?.baseEn);
    var family=familyFor(item);

    env.setHeader?.('English › Ghép chunk','Ghép câu');
    env.main.innerHTML=
      '<section class="chunk-builder-hero">'+
        '<div><span class="eyebrow">CHUNK → SENTENCE</span><h1>Ghép chunk vào 80 khung câu</h1><p>Chunk là nguyên liệu. Mẫu câu chỉ là khung để tái sử dụng cùng một cụm trong nhiều tình huống.</p></div>'+
        '<div class="chunk-builder-bank"><b>'+bank.length+'</b><span>chunk gốc hiện có</span></div>'+
      '</section>'+
      '<section class="chunk-builder-workbench">'+
        '<label><span>1 · Chọn khung</span><select id="chunkBuilderFrame">'+fs.map(function(x){return '<option value="'+x.id+'" '+(x.id===frame?.id?'selected':'')+'>#'+String(x.order).padStart(2,'0')+' · '+esc(x.pattern)+'</option>';}).join('')+'</select></label>'+
        '<label><span>2 · Chọn chunk</span><select id="chunkBuilderChunk">'+bank.map(function(x){var key=norm(x.baseEn);return '<option value="'+esc(key)+'" '+(key===cfg.chunkKey?'selected':'')+'>'+esc(x.baseEn)+' · '+esc(x.baseVi)+'</option>';}).join('')+'</select></label>'+
        '<article class="chunk-builder-result">'+
          '<span class="eyebrow">KẾT QUẢ</span>'+
          '<h2>'+esc(sentence)+'</h2>'+
          '<p><b>'+esc(item?.baseEn||'')+'</b> = '+esc(item?.baseVi||'')+'</p>'+
          '<button id="chunkBuilderSpeak" type="button">'+(env.uiIcon?env.uiIcon('volume-2'):'')+' Nghe câu</button>'+
        '</article>'+
      '</section>'+
      '<section class="chunk-builder-family">'+
        '<div class="section-title-row"><div><span class="eyebrow">CHUNK FAMILY</span><h2>Một chunk, nhiều cách dùng thật</h2><p>Không học một cách dùng duy nhất. Các biến thể dưới đây cũng thuộc Kho chunk và hệ Recall.</p></div></div>'+
        '<div class="chunk-builder-family-grid">'+family.map(function(row,i){return '<article><em>'+(i+1)+'</em><div><b>'+esc(row.en)+'</b><span>'+esc(row.vi)+'</span></div><button data-builder-speak="'+esc(row.en)+'" type="button">'+(env.uiIcon?env.uiIcon('volume-2'):'')+'</button></article>';}).join('')+'</div>'+
      '</section>'+
      '<section class="chunk-builder-patterns">'+
        '<div class="section-title-row"><div><span class="eyebrow">REUSE</span><h2>Cùng chunk, đổi khung</h2></div></div>'+
        '<div class="chunk-builder-pattern-grid">'+fs.slice(0,24).map(function(x){return '<button data-builder-frame="'+x.id+'" class="'+(x.id===frame?.id?'active':'')+'" type="button"><small>#'+String(x.order).padStart(2,'0')+'</small><b>'+esc(x.pattern)+'</b><span>'+esc(combine(x.pattern,item?.baseEn))+'</span></button>';}).join('')+'</div>'+
      '</section>';

    var frameSelect=document.querySelector('#chunkBuilderFrame');
    if(frameSelect) frameSelect.onchange=function(){cfg.frameId=frameSelect.value;env.saveState?.();render(env);};
    var chunkSelect=document.querySelector('#chunkBuilderChunk');
    if(chunkSelect) chunkSelect.onchange=function(){cfg.chunkKey=chunkSelect.value;env.saveState?.();render(env);};
    var speak=document.querySelector('#chunkBuilderSpeak');
    if(speak) speak.onclick=function(){env.speak?.(sentence);};
    document.querySelectorAll('[data-builder-speak]').forEach(function(btn){btn.onclick=function(){env.speak?.(btn.dataset.builderSpeak);};});
    document.querySelectorAll('[data-builder-frame]').forEach(function(btn){btn.onclick=function(){cfg.frameId=btn.dataset.builderFrame;env.saveState?.();render(env);};});
  }

  window.ChunkBuilder={render:render,coreBank:coreBank,familyFor:familyFor,combine:combine,frames:frames};
})();