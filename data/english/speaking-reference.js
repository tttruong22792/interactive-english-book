/* Per-lesson vocabulary, contextual chunks and grammar; no external APIs. */
(function(){
"use strict";
const normalize=text=>String(text||"").toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g," ").trim();
const wordsOf=text=>String(text||"").match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g)||[];
const core=window.CORE_DICTIONARY||{};
const extra=window.SPEAKING_VOCAB_EXTRA||{};
const countWords=items=>items.reduce((sum,item)=>sum+wordsOf(item).length,0);
function lookupWord(term){
 const word=normalize(term),known=core[word],fallback=extra[word];
 if(Array.isArray(known)&&known[1])return {term:word,ipa:known[0]||"",meaning:known[1],example:known[2]||""};
 if(typeof fallback==="string"&&fallback.trim())return {term:word,ipa:"",meaning:fallback,example:""};
 return null;
}
function wordsFor(story){
 const found=new Map();
 (story?.lines||[]).forEach(([en,vi],sentenceIndex)=>{
  for(const raw of wordsOf(en)){
   const term=normalize(raw);
   let entry=found.get(term);
   if(!entry){
    const dictionary=lookupWord(term);
    entry={term,meaning:dictionary?.meaning||"",ipa:dictionary?.ipa||"",frequency:0,
      sentence:en,contextVi:vi,sentenceIndex};
    found.set(term,entry);
   }
   entry.frequency++;
  }
 });
 return [...found.values()].sort((a,b)=>a.sentenceIndex-b.sentenceIndex || b.frequency-a.frequency);
}
function chunkSegments(text){
 // Keep useful clauses together where possible. For long clauses, cut at
 // natural word intervals without introducing expressions absent from source.
 const parts=String(text||"").split(/[,;:!?]+|[.!](?=\s|$)/).map(x=>x.trim()).filter(Boolean);
 const results=[];
 for(const part of parts){
  const phraseTokens=part.match(/\S+/g)||[];
  if(phraseTokens.length<2)continue;
  if(phraseTokens.length<=8){results.push(part);continue;}
  let start=0;
  while(start<phraseTokens.length){
   const remain=phraseTokens.length-start;
   const take=remain<=8?remain:remain-7<=8?Math.ceil(remain/2):6;
   const group=phraseTokens.slice(start,start+take).join(" ");
   if(group.split(/\s+/).length>=2)results.push(group);
   start+=take;
  }
 }
 return results;
}
function phrasesFor(story){
 const found=new Map(),lines=story?.lines||[];
 const exact=(window.READING_STORY_CHUNK_VI||{})[story.id]||[];
 const add=(phrase,vi,source,contextEn,contextVi,sentenceIndex)=>{
  const name=String(phrase||"").trim().replace(/[.!?]+$/,"").trim(),key=normalize(name);
  if(!key||wordsOf(name).length<2||found.has(key))return;
  found.set(key,{name,meaning:vi||"",kind:source,
    sentence:contextEn||"",contextVi:contextVi||"",sentenceIndex:sentenceIndex??0});
 };
 // User-curated collocations have a phrase-level translation.
 (story.targetChunks||[]).forEach((en,i)=>{
  const index=lines.findIndex(([line])=>normalize(line).includes(normalize(en)));
  const row=lines[Math.max(index,0)]||["",""];
  add(en,exact[i]||"", "selected",row[0],row[1],index>=0?index:0);
 });
 // Cover every spoken sentence with useful contiguous contextual chunks.
 lines.forEach(([en,vi],index)=>chunkSegments(en).forEach(segment=>add(segment,"","context",en,vi,index)));
 return [...found.values()].sort((a,b)=>a.sentenceIndex-b.sentenceIndex ||
  (a.kind==="selected"?-1:1));
}
const grammarCatalog=[
 {id:"present-perfect",title:"Hiện tại hoàn thành",meaning:"Nói về trải nghiệm, kết quả hoặc quá trình liên quan đến hiện tại.",
  formula:"S + have/has + V3",usage:"Dùng khi kết quả quá khứ còn liên quan đến hiện tại; have been + V-ing nhấn mạnh quá trình.",
  test:/\b(?:i've|we've|you've|they've|have|has|haven't|hasn't)\s+(?:already\s+|just\s+|never\s+|ever\s+)?(?:been|finished|worked|received|noticed|had|completed|learned|found|decided|started|heard|made|reached|prepared|updated|reviewed|agreed|discussed|spent|asked|checked|seen)\b/i},
 {id:"past-simple",title:"Quá khứ đơn",meaning:"Kể một hành động đã xảy ra và kết thúc.",
  formula:"S + V2 / did not + V / Did + S + V?",
  usage:"Thường đi với yesterday, last week, this morning hoặc chuỗi sự kiện đã qua.",
  test:/\b(?:yesterday|last week|last meeting|last talked|received|started|noticed|worked|asked|discussed|decided|managed|checked|made|wanted|thought|spent|found)\b/i},
 {id:"passive",title:"Câu bị động",meaning:"Nhấn mạnh việc được thực hiện hoặc thứ chịu tác động.",
  formula:"S + be + V3 (+ by ...)",
  usage:"Dùng khi người thực hiện không quan trọng hoặc không biết rõ; rất phổ biến trong tài liệu kỹ thuật.",
  test:/\b(?:is|are|was|were|been|be)\s+(?:used|required|updated|completed|displayed|stored|returned|rejected|reported|affected|protected|resolved|included|interpreted|connected|configured|established|allowed|prepared|handled)\b/i},
 {id:"conditionals",title:"Câu điều kiện với If",meaning:"Nêu điều kiện và kết quả hoặc hành động tiếp theo.",
  formula:"If + S + V, S + will/can/may + V",
  usage:"Trong điều kiện có thật ở tương lai, mệnh đề if thường dùng hiện tại đơn, không dùng will.",
  test:/\bif\s+(?:i|you|we|they|it|the|a|something|everything|there)\b/i},
 {id:"modals",title:"Động từ khuyết thiếu",meaning:"Nêu khả năng, đề nghị, suy đoán hoặc lời khuyên.",
  formula:"can / could / may / might / should / would + V nguyên mẫu",
  usage:"Could thường lịch sự hơn can; might chỉ khả năng chưa chắc; should đưa lời khuyên.",
  test:/\b(?:could|might|should|would|may|can)\s+(?:[a-z]+)\b/i},
 {id:"linking",title:"Từ nối ý và lý do",meaning:"Nối câu bằng lý do, tương phản hoặc kết quả.",
  formula:"because / so / however / although / therefore + mệnh đề",
  usage:"Because đưa lý do; so đưa kết quả; however và although tạo sự tương phản.",
  test:/\b(?:because|however|although|fortunately|therefore|as a result|even though)\b/i},
 {id:"relative",title:"Mệnh đề quan hệ",meaning:"Bổ sung thông tin để xác định người hoặc sự vật.",
  formula:"Danh từ + who / that / which + mệnh đề",
  usage:"Who nói về người; which về vật; that có thể thay thế tùy trường hợp.",
  test:/\b(?:who|which|that)\s+(?:is|are|was|were|has|have|can|does|do|will|i|we|you|they|the)\b/i},
 {id:"comparison",title:"So sánh và lựa chọn",meaning:"So sánh mức độ, thời gian hoặc sự phù hợp giữa hai điều.",
  formula:"more / less + tính từ + than; better / easier / faster",
  usage:"Dùng để giải thích lý do bạn ưu tiên một phương án trong công việc.",
  test:/\b(?:more|less)\s+\w+(?:\s+\w+){0,2}\s+than\b|\b(?:better|easier|faster|more practical|more difficult)\b/i},
 {id:"infinitive",title:"To + động từ nguyên mẫu",meaning:"Diễn tả mục đích, mong muốn hoặc điều cần làm.",
  formula:"want / need / plan / try / hope + to + V",
  usage:"Sau want, need, plan, try hoặc hope, dùng to + động từ nguyên mẫu.",
  test:/\b(?:want|wanted|need|needed|plan|planned|try|tried|hope|hoping|decide|decided|able|important|easy|difficult)\s+to\s+\w+/i},
 {id:"gerund",title:"V-ing sau giới từ hoặc động từ",meaning:"Dùng hành động như một danh từ hoặc sau giới từ.",
  formula:"before / after / without + V-ing",
  usage:"Sau giới từ như before, after, without và by, dùng V-ing khi theo sau là động từ.",
  test:/\b(?:before|after|without|by|about|for)\s+\w+ing\b/i},
 {id:"reported",title:"Gián tiếp và tường thuật",meaning:"Trình bày thông tin, ý kiến hoặc lời nói của người khác.",
  formula:"S + said / explained / mentioned / reported + (that) + mệnh đề",
  usage:"Hữu ích trong báo cáo, cuộc họp và mô tả thông tin do khách hàng cung cấp.",
  test:/\b(?:said|explained|mentioned|reported|heard|noticed)\s+(?:that|how|whether|what)\b/i},
 {id:"future",title:"Tương lai với will / going to",meaning:"Nói kế hoạch, dự đoán và quyết định.",
  formula:"S + will + V / be going to + V",
  usage:"Going to thường nói về dự định đã có; will thường dùng cho dự đoán hoặc quyết định ngay lúc nói.",
  test:/\b(?:will|i'll|we'll|it'll|you'll|they'll|going to)\b/i}
];
const notes={
 1:"Would like to lịch sự hơn want to; sau to dùng động từ nguyên mẫu.",
 2:"Going to nói dự định đã hình thành; be đổi theo chủ ngữ.",
 3:"Want to + động từ nguyên mẫu; với người khác dùng want someone to + V.",
 4:"Plan to + V diễn đạt kế hoạch; không dùng plan + V-ing khi nói dự định.",
 5:"Hope to + V dùng khi kết quả mong muốn chưa chắc chắn.",
 6:"Would you like to + V dùng để mời một cách lịch sự.",
 8:"Would rather + V nguyên mẫu (không có to); có thể dùng than để so sánh.",
 11:"Need to + V nói việc cần thực hiện; khác must ở mức độ bắt buộc.",
 22:"Could you + V nguyên mẫu? là lời nhờ lịch sự; không dùng to sau you.",
 38:"Did + chủ ngữ + V nguyên mẫu? Không dùng động từ ở quá khứ sau did.",
 43:"Think + (that) + mệnh đề. Có thể lược bỏ that trong văn nói.",
 44:"I don't think + mệnh đề thường mềm hơn phủ định trực tiếp.",
 55:"As soon as + hiện tại đơn khi nói một điều sẽ xảy ra trong tương lai.",
 63:"If + hiện tại đơn, will/can + V: điều kiện có thể xảy ra.",
 69:"Although + mệnh đề tương phản; tránh dùng but ngay trong cùng cấu trúc.",
 71:"Thank you for + danh từ hoặc V-ing, không dùng động từ nguyên mẫu.",
 78:"There is no need to + V: không cần thiết phải làm."
};
function patternsFor(story){
 const examples=(story?.lines||[]).map(([en,vi],i)=>({en,vi,i,plain:normalize(en)}));
 const found=[];
 // Reuse the user's complete set of 80 sentence patterns when their exact
 // structures occur in the user-provided reading passages.
 for(const pattern of (window.CONTENT_INDEX||[]).filter(p=>p.language==="en"&&p.category==="patterns")){
  const base=normalize(pattern.title).replace(/[.…?]+$/g,"").trim();
  if(base.length<4)continue;
  const variants=[base];
  if(base.startsWith("i'm "))variants.push(base.replace(/^i'm /,"i am "));
  if(base.startsWith("it's "))variants.push(base.replace(/^it's /,"it is "));
  const hit=examples.find(row=>variants.some(prefix=>{
    let at=row.plain.indexOf(prefix);
    while(at>=0){
      const before=at>0?row.plain[at-1]:" ",after=row.plain[at+prefix.length]||" ";
      if(!/[a-z']/.test(before)&&!/[a-z']/.test(after))return true;
      at=row.plain.indexOf(prefix,at+1);
    }
    return false;
  }));
  if(hit)found.push({id:"pattern-"+pattern.order,linkedId:pattern.order,kind:"mẫu 80",
    title:pattern.title,meaning:pattern.meaning||"",description:pattern.description||"",
    formula:pattern.title.replace(/[.…]+/g," + ..."),usage:notes[pattern.order]||pattern.description||"",
    sentence:hit.en,contextVi:hit.vi,sentenceIndex:hit.i});
 }
 for(const grammar of grammarCatalog){
  const hit=examples.find(row=>grammar.test.test(row.en));
  if(hit)found.push({...grammar,linkedId:null,kind:"ngữ pháp",
    description:grammar.meaning,sentence:hit.en,contextVi:hit.vi,sentenceIndex:hit.i});
 }
 return found.sort((a,b)=>a.sentenceIndex-b.sentenceIndex ||
   (a.linkedId? -1:1));
}
window.SPEAKING_REFERENCE={wordsFor,phrasesFor,patternsFor,lookupWord,countWords};
})();