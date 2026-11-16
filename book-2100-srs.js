/* Book 2100 — independent, testable spaced-repetition engine.
   One record per vocabulary item and skill (word / sentence).
   This is a conservative interval scheduler, not a claim of measured memory certainty. */
(function(global){
  "use strict";
  var KEY="language-studio-book-2100-srs-v1";
  var DAY=24*60*60*1000;
  var INTERVALS=[1,1,3,7,14,30,60,120];
  var LEVELS={new:"Mới",weak:"Chưa vững",learning:"Đang nhớ",mastered:"Vững"};
  function validId(n){return Number.isInteger(Number(n)) && Number(n)>=1 && Number(n)<=400;}
  function skillName(skill){if(skill!=="word" && skill!=="sentence")throw Error("Unsupported skill: "+skill);return skill;}
  function todayKey(now){
    var d=new Date(now);
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
  }
  function blank(){return {version:1,seeded:false,word:{},sentence:{}};}
  function safeParse(value){
    try{
      var parsed=JSON.parse(value);
      if(!parsed || parsed.version!==1 || typeof parsed.word!=="object" ||
         parsed.word===null || Array.isArray(parsed.word) ||
         typeof parsed.sentence!=="object" || parsed.sentence===null ||
         Array.isArray(parsed.sentence))return blank();
      return {version:1,seeded:parsed.seeded===true,word:parsed.word,sentence:parsed.sentence};
    }catch(e){return blank();}
  }
  function normalized(record){
    if(!record || typeof record!=="object" || Array.isArray(record))return null;
    var stage=Number.isInteger(record.stage)?Math.max(0,Math.min(7,record.stage)):null;
    var dueAt=Number.isFinite(Number(record.dueAt)) && Number(record.dueAt)>0?Number(record.dueAt):null;
    return {
      stage:stage,dueAt:dueAt,
      firstAt:Math.max(0,Number(record.firstAt)||0),
      lastAt:Math.max(0,Number(record.lastAt)||0),
      lastGradeDay:typeof record.lastGradeDay==="string"?record.lastGradeDay:"",
      lastMissDay:typeof record.lastMissDay==="string"?record.lastMissDay:"",
      attempts:Math.max(0,Math.floor(Number(record.attempts)||0)),
      successes:Math.max(0,Math.floor(Number(record.successes)||0)),
      mistakes:Math.max(0,Math.floor(Number(record.mistakes)||0)),
      lapses:Math.max(0,Math.floor(Number(record.lapses)||0)),
      source:record.source==="legacy"?"legacy":"practice",
      history:Array.isArray(record.history)?record.history.filter(function(ev){
        return ev && typeof ev.day==="string" && (ev.result==="good"||ev.result==="again");
      }).slice(-12).map(function(ev){return {day:ev.day,result:ev.result};}):[]
    };
  }
  function status(rec){
    if(!rec || rec.stage===null)return "new";
    if(rec.stage<=1)return "weak";
    if(rec.stage<=3)return "learning";
    return "mastered";
  }
  function createStore(options){
    options=options||{};
    var storage=options.storage||global.localStorage||null;
    var clock=typeof options.clock==="function"?options.clock:function(){return Date.now();};
    var key=options.key||KEY;
    var current=blank();
    try{current=safeParse(storage&&storage.getItem(key));}catch(e){}
    function persist(){try{if(storage)storage.setItem(key,JSON.stringify(current));}catch(e){}}
    function getRaw(id,skill){
      skillName(skill);
      if(!validId(id))return null;
      return normalized(current[skill][String(id)]);
    }
    function get(id,skill){
      var rec=getRaw(id,skill);
      return rec?Object.assign({},rec,{history:rec.history.slice(),status:status(rec),
        due:!!(rec.dueAt && rec.dueAt<=clock())}):
        {stage:null,dueAt:null,attempts:0,successes:0,mistakes:0,lapses:0,
          firstAt:0,lastAt:0,lastGradeDay:"",history:[],source:"new",status:"new",due:false};
    }
    function save(id,skill,rec){
      current[skill][String(id)]=rec;
      persist();
      return get(id,skill);
    }
    function rememberEvent(rec,day,result){
      var position=rec.history.findIndex(function(h){return h.day===day;});
      if(position>=0){
        // A lapse on the same date overrides a previously successful attempt.
        if(result==="again")rec.history[position].result="again";
      }else{
        rec.history.push({day:day,result:result});
        rec.history=rec.history.slice(-12);
      }
    }
    function record(id,skill,correct,options){
      if(!validId(id))return null;
      skillName(skill);
      var now=clock(),day=todayKey(now),assisted=!!options?.assisted;
      var rec=getRaw(id,skill)||normalized({stage:null,source:"practice",firstAt:now});
      // Once the learner interacts again, the old imported check is no longer
      // an unverified legacy-only record.
      rec.source="practice";
      if(!rec.firstAt)rec.firstAt=now;
      rec.lastAt=now;
      rec.attempts+=1;
      if(!correct){
        rec.mistakes+=1;
        if(rec.lastMissDay!==day){
          rec.lapses+=1;
          rec.stage=0;
          rec.dueAt=now+DAY;
          rec.lastGradeDay=day;
          rec.lastMissDay=day;
          rememberEvent(rec,day,"again");
        }
      }else{
        rec.successes+=1;
        // Listening to the answer before typing is assisted practice, not
        // evidence of independent recall. Keep the original due date.
        if(assisted){
          if(rec.stage===null){
            rec.stage=0;
            rec.dueAt=now+DAY;
            rec.lastGradeDay=day;
          }
          return save(id,skill,rec);
        }
        // Fixing today's error is good practice, but never counts as a new
        // spaced review. Repeated successes before a due date do not level up.
        if(rec.lastMissDay!==day && rec.lastGradeDay!==day &&
            (rec.stage===null || rec.dueAt===null || rec.dueAt<=now)){
          rec.stage=rec.stage===null?1:Math.min(7,rec.stage+1);
          rec.dueAt=now+INTERVALS[rec.stage]*DAY;
          rec.lastGradeDay=day;
          rememberEvent(rec,day,"good");
        }
      }
      return save(id,skill,rec);
    }
    function markDue(id,skill){
      if(!validId(id))return null;
      skillName(skill);
      var now=clock();
      var rec=getRaw(id,skill)||normalized({stage:null,source:"practice",firstAt:now});
      if(!rec.firstAt)rec.firstAt=now;
      // Explicit self-assessment: needs more study. Do not award a spaced
      // success for a correction made later on this same calendar day.
      rec.stage=0;
      rec.dueAt=now;
      rec.lastGradeDay=todayKey(now);
      rec.lastMissDay=todayKey(now);
      return save(id,skill,rec);
    }
    function seedLegacy(wordIds,sentenceIds){
      if(current.seeded)return false;
      var now=clock(),changed=false;
      [["word",wordIds],["sentence",sentenceIds]].forEach(function(pair){
        var skill=pair[0],ids=pair[1];
        if(!Array.isArray(ids))return;
        ids.forEach(function(value){
          if(!validId(value) || current[skill][String(value)])return;
          // Old green checks mean "answered correctly once", NOT long-term
          // mastery. Keep them and ask for a fresh spaced review today.
          current[skill][String(value)]=normalized({
            stage:0,dueAt:now,firstAt:now,lastAt:0,
            attempts:1,successes:1,source:"legacy",history:[]
          });
          changed=true;
        });
      });
      current.seeded=true;
      persist();
      return changed;
    }
    function dueEntries(steps,skill){
      skillName(skill);
      var now=clock();
      var values=[];
      (steps||[]).forEach(function(step){
        (step.entries||[]).forEach(function(item){
          var rec=getRaw(item.n,skill);
          if(rec && rec.dueAt!==null && rec.dueAt<=now){
            values.push({id:item.n,item:item,step:step.id,dueAt:rec.dueAt,
              status:status(rec),stage:rec.stage});
          }
        });
      });
      var severity={weak:0,learning:1,mastered:2,new:3};
      values.sort(function(a,b){
        return severity[a.status]-severity[b.status] || a.dueAt-b.dueAt || a.id-b.id;
      });
      return values;
    }
    function summary(entries,skill){
      skillName(skill);
      var counters={new:0,weak:0,learning:0,mastered:0,due:0,total:0};
      (entries||[]).forEach(function(item){
        var rec=getRaw(item.n,skill),kind=status(rec);
        counters[kind]+=1;counters.total+=1;
        if(rec && rec.dueAt!==null && rec.dueAt<=clock())counters.due+=1;
      });
      return counters;
    }
    function reload(){try{current=safeParse(storage&&storage.getItem(key));}catch(e){current=blank();}}
    return {get:get,record:record,markDue:markDue,seedLegacy:seedLegacy,
      dueEntries:dueEntries,summary:summary,reload:reload,status:status,
      intervals:INTERVALS.slice(),levels:Object.assign({},LEVELS),
      key:key,_dump:function(){return JSON.parse(JSON.stringify(current));}};
  }
  global.Book2100SRS={createStore:createStore,todayKey:todayKey,intervals:INTERVALS.slice()};
})(window);
