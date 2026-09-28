(()=>{
  'use strict';

  const STOP=new Set([
    'i','a','an','the','to','of','in','on','at','for','with','and','or','but',
    'my','your','our','their','this','that','it','me','you','we','they','is','am',
    'are','be','been','being','do','does','did','can','could','would','should'
  ]);

  const DEFAULT_BANK=[
    {
      id:'daily',
      domain:'Đời sống',
      title:'Một việc bạn thật sự muốn thay đổi',
      prompt:'Nghĩ về một việc nhỏ trong sinh hoạt mà bạn muốn làm tốt hơn hoặc đều đặn hơn.',
      question:'Có việc gì ở nhà, buổi sáng hoặc buổi tối bạn vẫn thường nghĩ “mình nên làm việc này tốt hơn”?',
      keywords:['routine','organize','cook','exercise','sleep'],
      phrases:['make time for...','get into the habit of...','a little more consistently'],
      sample:"I'd like to make more time for exercise after work."
    },
    {
      id:'work',
      domain:'Công việc',
      title:'Một điều giúp công việc dễ hơn',
      prompt:'Nói về một kỹ năng, nhiệm vụ hoặc cách làm việc bạn muốn cải thiện.',
      question:'Có việc gì trong công việc khiến bạn mất thời gian, chưa tự tin hoặc muốn xử lý chuyên nghiệp hơn?',
      keywords:['handle','explain','communicate','manage','efficiently'],
      phrases:['get better at...','be more confident about...','so that I can...'],
      sample:"I'd like to get better at explaining technical issues clearly."
    },
    {
      id:'family',
      domain:'Gia đình',
      title:'Một điều bạn muốn làm cho gia đình',
      prompt:'Nói về thời gian, hoạt động hoặc việc bạn muốn làm cùng hoặc cho gia đình.',
      question:'Có điều gì bạn muốn dành thêm thời gian cho gia đình trong tuần hoặc cuối tuần?',
      keywords:['spend time','help','take','plan','weekend'],
      phrases:['spend more time...','make plans to...','when we have time'],
      sample:"I'd like to spend more time outdoors with my family on weekends."
    },
    {
      id:'learning',
      domain:'Học tập',
      title:'Một kỹ năng bạn muốn tiến bộ',
      prompt:'Nói về thứ bạn đang học và một kết quả cụ thể bạn muốn đạt được.',
      question:'Bạn muốn hiểu, nói, làm hoặc sử dụng điều gì tốt hơn trong vài tháng tới?',
      keywords:['practice','understand','improve','review','confidently'],
      phrases:['improve my ability to...','practice ... regularly','so that I can...'],
      sample:"I'd like to improve my English so that I can speak more confidently in meetings."
    },
    {
      id:'future',
      domain:'Kế hoạch',
      title:'Một việc cho tương lai gần',
      prompt:'Nói về điều bạn muốn chuẩn bị, bắt đầu hoặc hoàn thành trong vài tuần hoặc vài tháng tới.',
      question:'Nếu chọn một việc đáng làm trước cuối tháng này, bạn sẽ chọn việc gì?',
      keywords:['prepare','start','finish','save','plan'],
      phrases:['before the end of...','over the next few weeks','take some time to...'],
      sample:"I'd like to finish one important project before the end of this month."
    },
    {
      id:'self',
      domain:'Bản thân',
      title:'Một thay đổi giúp bạn tốt hơn',
      prompt:'Nói về sức khỏe, thói quen, sự tự tin hoặc cách bạn sử dụng thời gian.',
      question:'Có thói quen nào nếu cải thiện được thì cuộc sống hằng ngày của bạn sẽ dễ chịu hơn?',
      keywords:['healthier','focus','habit','stress','time'],
      phrases:['take better care of...','be more consistent with...','instead of...'],
      sample:"I'd like to be more consistent with how I use my free time."
    }
  ];

  const QUESTION_BANK=[
    {
      id:'invite',
      domain:'Mời ai đó',
      title:'Rủ một người làm gì đó',
      prompt:'Tưởng tượng bạn muốn rủ đồng nghiệp, bạn bè hoặc người thân làm một việc cụ thể.',
      question:'Bạn sẽ rủ ai, làm gì và vào lúc nào?',
      keywords:['join','come','have lunch','take a break','weekend'],
      phrases:['join me for...','after work','this weekend'],
      sample:'Would you like to join me for lunch after the meeting?'
    },
    {
      id:'offer',
      domain:'Đề nghị',
      title:'Đưa ra một lựa chọn hữu ích',
      prompt:'Tưởng tượng bạn đang giúp ai đó và muốn hỏi họ có muốn một lựa chọn cụ thể không.',
      question:'Trong công việc hoặc ở nhà, bạn thường có thể đề nghị giúp người khác việc gì?',
      keywords:['help','check','send','show','take'],
      phrases:['Would you like me to...','before we start','a little later'],
      sample:'Would you like to take a short break before we continue?'
    },
    {
      id:'plan-question',
      domain:'Kế hoạch chung',
      title:'Hỏi để cùng quyết định',
      prompt:'Đặt câu hỏi để cùng ai đó quyết định một hoạt động hoặc kế hoạch.',
      question:'Có việc gì bạn thường phải thống nhất với gia đình hoặc đồng nghiệp?',
      keywords:['plan','meet','go','start','discuss'],
      phrases:['this afternoon','before we decide','together'],
      sample:'Do you want to discuss the plan before we make a decision?'
    }
  ];

  const RATHER_BANK=[
    {
      id:'choice',
      domain:'Lựa chọn',
      title:'Chọn A thay vì B',
      prompt:'Nói về một lựa chọn thật của bạn giữa hai cách làm.',
      question:'Có việc gì bạn thích làm theo cách A hơn cách B?',
      keywords:['stay','finish','wait','drive','work'],
      phrases:['rather ... than ...','instead of...','for now'],
      sample:"I'd rather finish this tonight than rush it tomorrow morning."
    },
    {
      id:'work-pref',
      domain:'Công việc',
      title:'Cách bạn muốn xử lý công việc',
      prompt:'Nói về cách bạn muốn xử lý một việc ở công ty thay vì cách khác.',
      question:'Khi có vấn đề, bạn thích kiểm tra kỹ trước hay xử lý ngay?',
      keywords:['check','confirm','discuss','wait','review'],
      phrases:['rather ... first','before I...','than risk...'],
      sample:"I'd rather double-check the details before sending the file."
    },
    {
      id:'daily-pref',
      domain:'Đời sống',
      title:'Một sở thích thực tế',
      prompt:'Nói về lựa chọn trong sinh hoạt mà bạn thực sự ưu tiên.',
      question:'Bạn thích ở nhà, ra ngoài, đi sớm, đi muộn, nấu ăn hay mua sẵn hơn?',
      keywords:['stay home','go out','cook','leave early','walk'],
      phrases:['rather ... than...','on weekends','when possible'],
      sample:"I'd rather cook at home than eat out on weekdays."
    }
  ];

  const LOOK_FORWARD_BANK=[
    {
      id:'people',
      domain:'Con người',
      title:'Một người bạn mong gặp',
      prompt:'Nói về người bạn mong được gặp hoặc nói chuyện cùng trong tương lai gần.',
      question:'Có ai bạn chưa gặp một thời gian và thật sự mong gặp lại không?',
      keywords:['seeing','meeting','talking','visiting','again'],
      phrases:['look forward to + V-ing','next month','when ... comes'],
      sample:"I look forward to seeing my family again next month."
    },
    {
      id:'event',
      domain:'Sự kiện',
      title:'Một việc sắp tới bạn mong chờ',
      prompt:'Nói về một chuyến đi, cuối tuần, sự kiện hoặc cột mốc bạn đang mong chờ.',
      question:'Trong lịch sắp tới, điều gì khiến bạn cảm thấy háo hức nhất?',
      keywords:['starting','visiting','spending','trying','learning'],
      phrases:['look forward to + V-ing','this weekend','once ... is finished'],
      sample:"I look forward to spending a quiet weekend with my family."
    },
    {
      id:'progress',
      domain:'Tiến bộ',
      title:'Một kết quả bạn mong chờ',
      prompt:'Nói về kết quả tích cực bạn mong thấy sau khi đã cố gắng một thời gian.',
      question:'Nếu tiếp tục học hoặc luyện đều, bạn mong mình sẽ làm được điều gì?',
      keywords:['becoming','using','speaking','finishing','seeing'],
      phrases:['look forward to + V-ing','more confidently','after a few months'],
      sample:"I look forward to using English more confidently at work."
    }
  ];

  function normalize(value){
    return String(value||'').toLowerCase().replace(/[’]/g,"'")
      .replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim();
  }

  function tokens(value){
    return normalize(value).split(' ').filter(Boolean);
  }

  function stemOf(lesson){
    return String(lesson?.title||'').replace(/[…]+/g,'').replace(/[?]+$/g,'').trim();
  }

  function seededSlice(bank,seed,count=3){
    if(bank.length<=count) return bank.slice();
    const start=Math.abs(Number(seed)||0)%bank.length;
    const out=[];
    for(let i=0;i<bank.length&&out.length<count;i++){
      const item=bank[(start+i)%bank.length];
      if(!out.some(x=>x.id===item.id)) out.push(item);
    }
    return out;
  }

  function adaptSample(sample,stem){
    const known=[
      "i'd like to","i'm going to","i want to","i plan to","i hope to",
      "i intend to","i need to"
    ];
    const n=normalize(stem);
    if(!known.includes(n)) return sample;
    return String(sample)
      .replace(/^I'd like to\b/i,stem)
      .replace(/^I want to\b/i,stem)
      .replace(/^I plan to\b/i,stem)
      .replace(/^I hope to\b/i,stem)
      .replace(/^I intend to\b/i,stem)
      .replace(/^I need to\b/i,stem)
      .replace(/^I'm going to\b/i,stem);
  }

  function ideas(lesson,seed=0){
    const stem=stemOf(lesson);
    const n=normalize(stem);
    let bank=DEFAULT_BANK;
    if(n.startsWith('would you like to')||n.startsWith('do you want to')) bank=QUESTION_BANK;
    else if(n.startsWith("i'd rather")) bank=RATHER_BANK;
    else if(n.startsWith('i look forward to')) bank=LOOK_FORWARD_BANK;
    return seededSlice(bank,seed,3).map(item=>({
      ...item,
      sample:adaptSample(item.sample,stem)
    }));
  }

  function contentTokens(text,stem){
    const stemSet=new Set(tokens(stem));
    return tokens(text).filter(t=>!STOP.has(t)&&!stemSet.has(t));
  }

  function jaccard(a,b){
    const A=new Set(a),B=new Set(b);
    if(!A.size&&!B.size) return 1;
    let intersection=0;
    A.forEach(x=>{if(B.has(x)) intersection++;});
    const union=new Set([...A,...B]).size||1;
    return intersection/union;
  }

  function originality(text,references,stem){
    const mine=contentTokens(text,stem);
    let maxSimilarity=0;
    let closest='';
    (references||[]).forEach(ref=>{
      const sentence=typeof ref==='string'?ref:ref?.en;
      if(!sentence) return;
      const score=jaccard(mine,contentTokens(sentence,stem));
      if(score>maxSimilarity){
        maxSimilarity=score;
        closest=sentence;
      }
    });
    const score=Math.max(0,Math.min(100,Math.round((1-maxSimilarity)*100)));
    return {
      score,
      maxSimilarity:Math.round(maxSimilarity*100),
      closest,
      label:score>=65?'Mới rõ rệt':score>=40?'Có biến đổi':'Quá gần câu đã học'
    };
  }

  function complexity(text,stem){
    const list=tokens(text);
    const extra=Math.max(0,list.length-tokens(stem).length);
    const connector=/\b(because|so that|although|even though|if|when|while|before|after|instead of|rather than|so I can|in order to)\b/i.test(text);
    const detail=/\b(today|tomorrow|tonight|weekend|weekends|morning|evening|month|week|year|work|home|family|meeting|project|customer|colleague)\b/i.test(text);
    let score=extra*5+(connector?25:0)+(detail?10:0);
    score=Math.max(0,Math.min(100,score));
    const level=score>=65?'stretch':score>=35?'natural':'basic';
    return {
      score,
      level,
      label:level==='stretch'?'Stretch':level==='natural'?'Natural':'Basic'
    };
  }

  function nextChallenge(text,stem){
    const n=normalize(stem);
    if(n.startsWith("i'd rather")&&!/\bthan\b/i.test(text)){
      return {
        type:'comparison',
        title:'Thêm sự so sánh',
        prompt:'Giữ ý của bạn nhưng nói rõ bạn chọn điều này thay vì điều gì.',
        cue:'Dùng “than ...” để tạo một lựa chọn thật.',
        tools:['than...','instead of...']
      };
    }
    if(!/\b(because|so that|in order to)\b/i.test(text)){
      return {
        type:'reason',
        title:'Thêm lý do hoặc mục đích',
        prompt:'Giữ ý hiện tại và giải thích tại sao điều đó quan trọng với bạn.',
        cue:'Bạn có thể dùng “because ...” hoặc “so that I can ...”.',
        tools:['because...','so that I can...','in order to...']
      };
    }
    if(!/\b(today|tomorrow|tonight|this week|this month|next week|next month|every day|every week|on weekends|after work|before work|in the morning|in the evening|at night)\b/i.test(text)){
      return {
        type:'time',
        title:'Cụ thể hóa thời gian',
        prompt:'Giữ ý và thêm khi nào, bao lâu hoặc tần suất bạn sẽ làm việc đó.',
        cue:'Một chi tiết thời gian làm câu bớt chung chung và gần đời thật hơn.',
        tools:['after work','this month','on weekends','every evening']
      };
    }
    return {
      type:'detail',
      title:'Làm ý cụ thể hơn',
      prompt:'Giữ ý chính nhưng thêm một chi tiết thật: với ai, ở đâu, theo cách nào hoặc kết quả bạn muốn đạt được.',
      cue:'Đừng thêm từ cho dài; hãy thêm một thông tin có ý nghĩa.',
      tools:['with...','at work','more confidently','without...']
    };
  }

  function satisfies(base,upgraded,challenge,lesson,references){
    const stem=stemOf(lesson);
    const baseWords=tokens(base).length;
    const upgradedWords=tokens(upgraded).length;
    const starts=normalize(upgraded).startsWith(normalize(stem));
    let requirement=false;
    if(challenge?.type==='reason') requirement=/\b(because|so that|in order to)\b/i.test(upgraded);
    else if(challenge?.type==='time') requirement=/\b(today|tomorrow|tonight|weekend|weekends|week|month|morning|evening|night|after work|before work|every|next|this)\b/i.test(upgraded);
    else if(challenge?.type==='comparison') requirement=/\bthan\b/i.test(upgraded);
    else requirement=upgradedWords>=baseWords+3;
    const original=originality(upgraded,references,stem);
    return {
      ok:starts&&requirement&&upgradedWords>baseWords&&original.score>=35,
      starts,
      requirement,
      grew:upgradedWords>baseWords,
      originality:original,
      complexity:complexity(upgraded,stem)
    };
  }

  function hint(idea,level){
    if(!idea) return null;
    if(level===1) return {level,title:'Gợi ý chủ đề',content:idea.prompt};
    if(level===2) return {level,title:'Câu hỏi kích thích ý tưởng',content:idea.question};
    if(level===3) return {level,title:'Từ khóa',content:idea.keywords.join(' · ')};
    if(level===4) return {level,title:'Cụm hữu ích',content:idea.phrases.join(' · ')};
    if(level>=5) return {level:5,title:'Câu tham khảo',content:idea.sample,sample:true};
    return null;
  }

  window.PersonalizationEngine={
    ideas,
    originality,
    complexity,
    nextChallenge,
    satisfies,
    hint,
    stemOf
  };
})();