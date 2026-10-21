/* Mission 60 — deterministic, evidence-based 60-day curriculum.
   Self-marking and passive reading never count as a successful assessment.
   All proof is separate from existing saved vocabulary and lesson progress. */
(function(){
"use strict";
const DAY=86400000, TOTAL_DAYS=60;
const pad=n=>String(n).padStart(2,"0");
function localDay(now=Date.now()){
 const d=new Date(now);
 return [d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join("-");
}
function dayNum(iso){
 const [y,m,d]=String(iso||"").split("-").map(Number);
 return Date.UTC(y,m-1,d)/DAY;
}
function after(iso,n){const d=new Date((dayNum(iso)+n)*DAY);return [d.getUTCFullYear(),pad(d.getUTCMonth()+1),pad(d.getUTCDate())].join("-");}
function elapsed(start,today){return Math.max(1,Math.floor(dayNum(today)-dayNum(start))+1);}
function normalize(answer){
 let v=String(answer||"").toLowerCase().replace(/[’‘]/g,"'")
  .replace(/[^a-z0-9'\s]/g," ").replace(/\s+/g," ").trim();
 const changes=[
 [/\bi'm\b/g,"i am"],[/\bi've\b/g,"i have"],[/\bi'll\b/g,"i will"],
 [/\bi'd\b/g,"i would"],[/\byou're\b/g,"you are"],[/\byou've\b/g,"you have"],
 [/\byou'll\b/g,"you will"],[/\bhe's\b/g,"he is"],[/\bshe's\b/g,"she is"],
 [/\bwe're\b/g,"we are"],[/\bwe'll\b/g,"we will"],[/\bthey're\b/g,"they are"],
 [/\bthat's\b/g,"that is"],[/\bit's\b/g,"it is"],[/\bthere's\b/g,"there is"],
 [/\bdon't\b/g,"do not"],[/\bdoesn't\b/g,"does not"],[/\bdidn't\b/g,"did not"],
 [/\bcan't\b/g,"cannot"],[/\bwon't\b/g,"will not"],[/\bshouldn't\b/g,"should not"],
 [/\bcouldn't\b/g,"could not"],[/\bwouldn't\b/g,"would not"],[/\bmustn't\b/g,"must not"],
 [/\blet's\b/g,"let us"]
 ];
 for(const [re,repl] of changes)v=v.replace(re,repl);
 return v.replace(/\s+/g," ").trim();
}
function equal(expected,answer){return !!String(answer||"").trim()&&normalize(expected)===normalize(answer);}
function fresh(now=Date.now()){return {version:1,startDate:localDay(now),chunkProof:{},patternProof:{},readingProof:{},reviewBatches:{},events:[]};}
function ensure(state,now=Date.now()){
 if(!state.mission60||state.mission60.version!==1)state.mission60=fresh(now);
 return state.mission60;
}
function packs(){return (window.VocabularyTrainer?.packs?.()||[]).slice().sort((a,b)=>a.order-b.order);}
function chapters(){return (window.READING_STORIES||[]).slice();}
function allCards(){
 const tr=window.VocabularyTrainer,c=[];
 for(const p of packs()){
  c.push(...(tr?.studyChunks?.(p)||[]).filter(card=>card.kind!=="building"));
  c.push(...(tr?.usageSupplementChunks?.(p)||[]));
 }
 return c;
}
function fixedQuota(total,days,day){return [Math.floor((day-1)*total/days),Math.floor(day*total/days)];}
function planDay(day=1){
 const d=Math.max(1,Math.min(TOTAL_DAYS,Number(day)||1));
 const [start,end]=fixedQuota(4000,TOTAL_DAYS,d);
 const patterns=d<=40?[d*2-1,d*2]:[...Array(4)].map((_,i)=>(d-41)*4+i+1);
 return {day:d,chunkStart:start,chunkEnd:end,chunkCount:end-start,patterns,
  reading:d%2===0?d/2:0,patternReview:d>40};
}
function proofStatus(p,today){
 const unique=Array.isArray(p?.passDates)?[...new Set(p.passDates)].sort():[];
 const first=unique[0],last=unique[unique.length-1];
 return {
  seen:!!p?.attempts,
  passed:unique.length>0,
  mastered:unique.length>=3 && dayNum(last)-dayNum(first)>=7 && !p?.regressed,
  passes:unique.length,
  due:unique.length>0 && !!p?.nextReview && p.nextReview<=today,
  firstTry:!!p?.firstTry
 };
}
function nextReview(dates){
 if(dates.length<1)return '';
 const last=dates[dates.length-1],interval=[0,1,3,7,14][Math.min(4,dates.length)];
 return after(last,interval);
}
function recordChunk(mission,key,expected,answer,today=localDay(),isReveal=false){
 const p=mission.chunkProof[key]||(mission.chunkProof[key]={attempts:0,passDates:[],firstTry:null,regressed:false});
 const correct=!isReveal&&equal(expected,answer);
 if(p.firstTry===null)p.firstTry=correct;
 p.attempts++;
 p.lastAttempt=today;p.lastCorrect=correct;
 if(correct){
  if(!p.passDates.includes(today))p.passDates.push(today);
  p.passDates=p.passDates.slice(-16).sort();
  p.nextReview=nextReview(p.passDates);
  p.regressed=false;
 }else if(p.passDates.length){
  p.regressed=true;
  p.nextReview=today;
 }
 mission.events.push({day:today,type:'chunk',id:key,ok:correct,reveal:isReveal});
 if(mission.events.length>13000)mission.events=mission.events.slice(-13000);
 return correct;
}
function probes(pack,review=false){
 const all=(pack?.deepSentences||[]).filter(x=>Array.isArray(x)&&x[0]&&x[1]);
 if(all.length<2)return [];
 const chosen=review&&all.length>=4?[2,3]:[0,1];
 return chosen.map((at,i)=>({key:pack.lessonId+':'+(review?'r':'i')+':'+i,
  packId:pack.lessonId,vi:all[at][1],en:all[at][0],index:i,review}));
}
function patternDone(proof,review=false){return review?!!proof?.reviewPassed:!!proof?.passed;}
function recordPattern(mission,packId,index,expected,answer,review=false,today=localDay(),isReveal=false){
 const p=mission.patternProof[packId]||(mission.patternProof[packId]={attempts:{},reviewAttempts:{},passed:false,reviewPassed:false,firstTry:true,reviewFirstTry:true});
 const map=review?p.reviewAttempts:p.attempts;
 const id=String(index),old=map[id]||{tries:0,correct:false};
 const correct=!isReveal&&equal(expected,answer);
 if(!correct){
  if(review)p.reviewFirstTry=false;else p.firstTry=false;
 }
 map[id]={tries:old.tries+1,correct:old.correct||correct,lastCorrect:correct,date:today};
 if(map["0"]?.correct && map["1"]?.correct){
  if(review){p.reviewPassed=true;p.reviewPassedAt=today;}
  else{p.passed=true;p.passedAt=today;}
 }
 mission.events.push({day:today,type:review?'pattern-review':'pattern',id:packId+':'+index,ok:correct,reveal:isReveal});
 return correct;
}
function recordReading(mission,story,answers,today=localDay()){
 if(!story||!Array.isArray(story.questions)||story.questions.length<2)return {correct:0,total:0,passed:false};
 const result=story.questions.map((q,i)=>Number(answers?.[i])===Number(q.answer));
 const correct=result.filter(Boolean).length,total=result.length,passed=correct===total;
 const p=mission.readingProof[story.id]||(mission.readingProof[story.id]={attempts:0,passed:false,firstTry:null});
 if(p.firstTry===null)p.firstTry=passed;
 p.attempts++;p.lastAt=today;p.lastCorrect=correct;
 if(passed){p.passed=true;p.passedAt=today;}
 mission.events.push({day:today,type:'reading',id:story.id,ok:passed});
 return {correct,total,passed,results:result};
}
function orderedDue(m,today){
 const pool=allCards();
 return pool.filter(card=>proofStatus(m.chunkProof[card.key],today).due)
  .sort((a,b)=>String(m.chunkProof[a.key].nextReview).localeCompare(String(m.chunkProof[b.key].nextReview)));
}
function daily(state,now=Date.now()){
 const mission=ensure(state,now),today=localDay(now);
 const day=elapsed(mission.startDate,today);
 const shownDay=Math.min(TOTAL_DAYS,day),cfg=planDay(shownDay);
 const cards=allCards(),all=packs(),stories=chapters();
 const chunksToDate=cards.slice(0,cfg.chunkEnd);
 const pending=chunksToDate.filter(c=>!proofStatus(mission.chunkProof[c.key],today).passed);
 const todayChunks=cards.slice(cfg.chunkStart,cfg.chunkEnd);
 const due=orderedDue(mission,today).filter(c=>!pending.some(x=>x.key===c.key));
 // Freeze today's first 25 due cards. Without this, finishing one card would
 // instantly pull another into its place and a day's review would never end.
 mission.reviewBatches=mission.reviewBatches||{};
 if(!Array.isArray(mission.reviewBatches[today])){
   mission.reviewBatches[today]=due.slice(0,25).map(c=>c.key);
   const keys=Object.keys(mission.reviewBatches).sort();
   keys.slice(0,Math.max(0,keys.length-45)).forEach(key=>delete mission.reviewBatches[key]);
 }
 const cardMap=new Map(cards.map(c=>[c.key,c]));
 const reviews=mission.reviewBatches[today].map(key=>cardMap.get(key)).filter(Boolean);
 const reviewRemaining=reviews.filter(card=>proofStatus(mission.chunkProof[card.key],today).due);

 const todaysPacks=cfg.patterns.map(n=>all.find(p=>p.order===n)).filter(Boolean);
 const pendingPatterns=Array.from({length:shownDay},(_,i)=>planDay(i+1)).flatMap(d=>d.patterns.map(n=>({order:n,review:d.patternReview})))
  .filter((p,i,list)=>list.findIndex(x=>x.order===p.order&&x.review===p.review)===i)
  .filter(x=>{
   const pack=all.find(p=>p.order===x.order);
   return pack&&!patternDone(mission.patternProof[pack.lessonId],x.review);
  });
 const assignedStories=stories.slice(0,Math.floor(shownDay/2));
 const pendingReading=assignedStories.filter(st=>!mission.readingProof[st.id]?.passed);

 const patternTodayDone=todaysPacks.filter(p=>patternDone(mission.patternProof[p.lessonId],cfg.patternReview)).length;
 const readingToday=cfg.reading?stories[cfg.reading-1]:null;
 const readingTodayDone=!readingToday||!!mission.readingProof[readingToday.id]?.passed;
 const chunkTodayDone=todayChunks.filter(c=>proofStatus(mission.chunkProof[c.key],today).passed).length;
 const reviewCompleted=reviewRemaining.length===0;
 const patternSuccess=all.filter(p=>mission.patternProof[p.lessonId]?.passed).length;
 const reviewSuccess=all.filter(p=>mission.patternProof[p.lessonId]?.reviewPassed).length;
 const certified=cards.filter(c=>proofStatus(mission.chunkProof[c.key],today).passed).length;
 const mastered=cards.filter(c=>proofStatus(mission.chunkProof[c.key],today).mastered).length;
 const readSuccess=stories.filter(s=>mission.readingProof[s.id]?.passed).length;
 const eventsToday=mission.events.filter(x=>x.day===today);
 const scored=eventsToday.filter(x=>!x.reveal && x.type!=='reading');
 const accuracy=scored.length?Math.round(scored.filter(x=>x.ok).length/scored.length*100):null;
 // A completed lesson plan isn't a blanket claim of language mastery.
 const backlog=pending.filter(c=>!todayChunks.some(t=>t.key===c.key));
 const dayPassed=day<=60&&todayChunks.length===chunkTodayDone &&
  patternTodayDone===todaysPacks.length && readingTodayDone && reviewCompleted &&
  (accuracy===null||accuracy>=90);
 return {mission,today,day,shownDay,overdueDays:Math.max(0,day-60),cfg,
  cards,all,stories,pending,todayChunks,chunkTodayDone,backlog,
  reviews,dueTotal:due.length,reviewCompleted,reviewRemaining,
  todaysPacks,pendingPatterns,patternTodayDone,readingToday,pendingReading,
  patternSuccess,reviewSuccess,certified,mastered,readSuccess,
  accuracy,eventsToday,dayPassed};
}
window.Mission60Core={TOTAL_DAYS,normalize,equal,localDay,after,elapsed,fixedQuota,planDay,
 fresh,ensure,packs,chapters,allCards,proofStatus,probes,recordChunk,recordPattern,
 recordReading,orderedDue,daily};
})();