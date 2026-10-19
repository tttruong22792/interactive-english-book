/* Structured supplementary chunk extraction for lessons 13–80.
   Each phrase is shown with a real, bilingual sentence so VI→EN review is meaningful.
   Legacy lessons and study progress remain untouched. */
(function(){
"use strict";
const W=window;
const specs=W.PATTERN_SPECS_13_80||[];
const pick=(s,r)=>String(s||"").replace(r,"").trim();
const tidy=s=>String(s||"").trim().replace(/^[,;:\s]+|[.!?,;:\s]+$/g,"").replace(/\s+/g," ");
const fixText=s=>String(s||"").replace(/^[,;:\s]+/,"").trim();
const cutStarts=[
 ["^Let me\\s+","^Để tôi\\s+"],["^Let's\\s+","^Chúng ta\\s+(?:cùng|hãy)?\\s*"],
 ["^You should\\s+","^Bạn nên\\s+"],["^I must\\s+","^Tôi (?:nhất định )?phải\\s+"],
 ["^You'd better\\s+","^Bạn nên\\s+"],["^Can I\\s+","^Tôi\\s+"],
 ["^Could you\\s+","^Bạn có thể\\s+"],["^May I\\s+","^Tôi xin phép\\s+"],
 ["^I can\\s+","^Tôi có thể\\s+"],["^I can't\\s+","^Tôi không thể\\s+"],
 ["^Will you\\s+","^Bạn sẽ\\s+"],["^Would you mind\\s+","^Bạn có phiền\\s+"],
 ["^Do you mind if I\\s+","^Bạn có phiền nếu tôi\\s+"],
 ["^Please make sure to\\s+","^Hãy (?:nhớ )?"],
 ["^Don't hesitate to\\s+","^Đừng (?:ngần ngại|ngại)\\s+"],
 ["^There is no need to\\s+","^Không cần(?: phải)?\\s+"],
 ["^There's really no need to\\s+","^Thực sự không cần\\s+"],
 ["^I used to\\s+","^Trước đây tôi từng\\s+"],
 ["^I'm used to\\s+","^Tôi đã quen (?:với việc )?"],
 ["^I feel like\\s+","^Tôi muốn\\s+"],
 ["^I think\\s+","^Tôi nghĩ (?:rằng )?"],
 ["^I don't think\\s+","^Tôi không nghĩ (?:rằng )?"],
 ["^Do you think\\s+","^Bạn có nghĩ (?:rằng )?"],
 ["^I'm sure that\\s+","^Tôi chắc (?:rằng )?"],
 ["^I'm afraid that\\s+","^Tôi e rằng\\s+"],
 ["^In my opinion,\\s*","^Theo (?:tôi|ý kiến của tôi),?\\s*"],
 ["^As far as I know,\\s*","^Theo (?:tôi|những gì tôi) biết,?\\s*"],
 ["^I agree with\\s+","^Tôi đồng ý với\\s+"],
 ["^I completely agree with\\s+","^Tôi hoàn toàn đồng ý với\\s+"],
 ["^I'm wondering if\\s+","^Tôi (?:đang tự hỏi(?: liệu)?|không biết)\\s+"],
 ["^It's necessary to\\s+","^Việc\\s+"],["^Is it possible to\\s+","^Có thể\\s+"],
 ["^Are you ready to\\s+","^Bạn (?:đã )?sẵn sàng\\s+"],
 ["^Did I\\s+","^Tôi đã\\s+"],["^Did you\\s+","^Bạn đã\\s+"],
 ["^When did you\\s+","^Bạn\\s+"],["^How often do you\\s+","^Bạn\\s+"],
 ["^How long does it take to\\s+","^Mất bao lâu để\\s+"],
 ["^It takes time to\\s+","^Cần (?:có )?thời gian để\\s+"],
 ["^It's time to\\s+","^Đã đến lúc\\s+"],["^I'm busy\\s+","^Tôi (?:đang )?bận\\s+"],
 ["^I have no idea how to\\s+","^Tôi không biết (?:phải|cách)\\s+"],
 ["^Can you show me how to\\s+","^Bạn có thể chỉ (?:cho )?tôi cách\\s+"],
 ["^I am in charge of\\s+","^Tôi phụ trách (?:việc )?"],
 ["^I'm in charge of\\s+","^Tôi phụ trách (?:việc )?"],
 ["^Thank you(?: so much)? for\\s+","^Cảm ơn bạn (?:(?:rất nhiều )?vì )?đã\\s+"],
 ["^I'm (?:truly )?sorry for\\s+","^Tôi (?:thật lòng )?xin lỗi vì đã\\s+"],
 ["^It reminds me of\\s+","^Nó làm tôi nhớ (?:đến|về)?\\s+"],
 ["^That really reminds me of\\s+","^Điều đó thực sự làm tôi nhớ đến\\s+"],
 ["^That's why\\s+","^Đó là lý do\\s+"],
 ["^Otherwise,?\\s+","^Nếu không,?\\s+"],
 ["^Before you\\s+","^Trước khi (?:bạn )?"],
 ["^After I\\s+","^Sau khi tôi\\s+"],
 ["^As soon as\\s+","^Ngay khi\\s+"],
 ["^While I was\\s+","^Trong (?:lúc|khi) tôi đang\\s+"],
 ["^If you\\s+","^Nếu bạn\\s+"],
 ["^Unless you\\s+","^Trừ khi bạn\\s+"],
 ["^Although\\s+","^Mặc dù\\s+"],
 ["^Even if\\s+","^Ngay cả khi\\s+"],
 ["^As long as\\s+","^Miễn là\\s+"],
 ["^Because of\\s+","^Vì\\s+"],
 ["^In order to\\s+","^Để\\s+"],
 ["^Is there\\s+","^Có\\s+"],["^Are there\\s+","^Có\\s+"],
 ["^How was\\s+","^"],["^What happened to\\s+","^Chuyện gì đã xảy ra với\\s+"],
 ["^What kind of\\s+","^Bạn\\s+"],
 ["^Have you ever\\s+","^Bạn (?:đã )?từng\\s+"]
];
function stripHead(en,vi){
 for(const [a,b] of cutStarts){
  const ra=new RegExp(a,"i");
  if(!ra.test(en))continue;
  const extractedEn=pick(en,ra);
  let v=pick(vi,new RegExp(b,"i"));
  if(v===vi&&/^(how was)/i.test(en))v=vi.replace(/\s+thế nào\??$/i,"");
  if(v===vi&&/^(what kind of)/i.test(en))v=vi.replace(/^Bạn\s+/i,"").replace(/\s+(?:nào|gì)\??$/i,"");
  return [extractedEn,v];
 }
 return [en,vi];
}
function cutUseful(en,vi,order){
 let a=tidy(en),v=tidy(vi);
 if([57,58].includes(order)&&a.includes(",")){
   const halves=a.split(/,\s*/);
   const vn=v.split(/,\s*/);
   if(halves.length>1){a=halves.slice(1).join(", ").replace(/^(?:I'll|I will|we'll|hãy)\s+/i,"");v=(vn[1]||v).replace(/^hãy\s+/i,"");}
 }
 if(order===61&&a.includes(",")){a=tidy(a.split(",").slice(1).join(","));v=tidy(v.split(",").slice(1).join(","));}
 if(order===65&&a.includes(" so that ")){
   const parts=a.split(" so that "),vp=v.split(/\s+để\s+/);
   a=tidy(parts[0].replace(/^(I'll|I will|Let's)\s+/i,""));v=tidy((vp.length>1?vp[0]:v).replace(/^Tôi sẽ\s+|^Chúng ta hãy\s+/i,""));
 }
 if([55,56].includes(order)&&a.includes(",")){
   a=tidy(a.split(",")[0].replace(/^I\s+|^we\s+/i,""));
   v=tidy(v.split(",")[0].replace(/^tôi\s+|^chúng ta\s+/i,""));
 }
 if(order===70&&a.includes(",")){a=tidy(a.split(",").slice(1).join(","));v=tidy(v.split(",").slice(1).join(","));}
 return [a,v];
}
function extractSentence(pair,p){
 let [en,vi]=pair;
 if(!en||!vi)return null;
 if([55,56,57,58,63,66,69].includes(p.n)&&/^(?:After I|Before you|As soon as|While I was|If you|Unless you|Although)\b/i.test(en)&&!en.includes(","))return null;
 en=fixText(en).replace(/^(So,\s*|By the way,\s*|Excuse me,\s*|Just to clarify,\s*)/i,"");
 vi=fixText(vi).replace(/^Cho tôi hỏi:\s*/i,"");
 let item=stripHead(en,vi);
 if(item[0]===en&&item[1]===vi&&p.n!==61&&p.n!==65)return null;
 item=cutUseful(item[0],item[1],p.n);
 let [phrase,meaning]=item;
 phrase=tidy(phrase);
 meaning=tidy(meaning).replace(/\s+(?:bao giờ chưa|thế nào|chưa|không)$/i,"").trim();
 if(/^Let me know\b/i.test(en)){phrase=tidy(en);meaning=tidy(vi.replace(/^Hãy\s+/i,""));}
 if(/^i(?:'ll|\b)/.test(phrase))phrase=phrase[0].toUpperCase()+phrase.slice(1);
 if(phrase.length<8||phrase.split(/\s+/).length<2||phrase.split(/\s+/).length>12)return null;
 if(meaning.length<5)return null;
 if(/\b(?:the|a|to|of|and|or|if|when|with)$/i.test(phrase))return null;
 if(/[.?!]/.test(phrase))return null;
 return [phrase.charAt(0).toLowerCase()+phrase.slice(1),meaning.charAt(0).toLowerCase()+meaning.slice(1),pair[0],pair[1]];
}
const enrichmentThemes=[
["get back to the customer","phản hồi lại khách hàng"],["make sure everything is ready","đảm bảo mọi thứ đã sẵn sàng"],
["come up with a better solution","nghĩ ra giải pháp tốt hơn"],["check the system logs","kiểm tra nhật ký hệ thống"],
["pick up the kids","đón các con"],["take a closer look at the problem","xem xét kỹ hơn vấn đề"],
["deal with an urgent issue","xử lý một vấn đề khẩn cấp"],["sort out the paperwork","xử lý giấy tờ cho ổn thỏa"],
["look into the issue","tìm hiểu vấn đề"],["follow up on the email","theo dõi tiếp email"],
["double-check the settings","kiểm tra kỹ lại cài đặt"],["review the contract","xem lại hợp đồng"],
["keep an eye on the kids","trông chừng các con"],["reschedule the appointment","dời lịch hẹn"],
["get ready for work","chuẩn bị đi làm"],["spend quality time with my family","dành thời gian chất lượng cho gia đình"],
["cut down on unnecessary expenses","cắt giảm khoản chi không cần thiết"],["set aside some money","để dành một khoản tiền"],
["stick to the budget","giữ đúng ngân sách"],["make an informed decision","đưa ra quyết định có cân nhắc"],
["get used to the new environment","làm quen với môi trường mới"],["work on my pronunciation","luyện cải thiện phát âm"],
["catch up on housework","làm nốt việc nhà"],["find a way to solve the problem","tìm cách giải quyết vấn đề"],
["talk things over with the family","bàn bạc mọi việc với gia đình"],["take responsibility for the result","chịu trách nhiệm về kết quả"],
["plan ahead for the weekend","lên kế hoạch trước cho cuối tuần"],["check whether the door is locked","kiểm tra xem cửa đã khóa chưa"],
["compare different options","so sánh các lựa chọn khác nhau"],["keep track of my expenses","theo dõi các khoản chi"],
["avoid making the same mistake","tránh mắc lại lỗi tương tự"],["try a different approach","thử cách tiếp cận khác"],
["ask for clarification","hỏi lại để làm rõ"],["get the report ready on time","chuẩn bị báo cáo đúng hạn"],
["put what I learned into practice","áp dụng những gì đã học"],["prioritize the urgent tasks","ưu tiên các việc khẩn cấp"],
["make a reservation in advance","đặt chỗ trước"],["take care of my health","chăm sóc sức khỏe"],
["save a backup copy","lưu một bản sao dự phòng"],["work through the problem step by step","giải quyết vấn đề từng bước"],
["get enough sleep","ngủ đủ giấc"],["find out what went wrong","tìm ra nguyên nhân sai sót"],
["stay in touch with colleagues","giữ liên lạc với đồng nghiệp"],["get everything ready before leaving","chuẩn bị xong mọi thứ trước khi đi"],
["make changes to the schedule","điều chỉnh lịch trình"],["put some money aside for emergencies","dành tiền dự phòng cho trường hợp khẩn cấp"],
["give everyone a clear explanation","giải thích rõ ràng cho mọi người"],["take a short break","nghỉ giải lao một chút"],
["keep the documents organized","sắp xếp giấy tờ gọn gàng"],["practice speaking English every day","luyện nói tiếng Anh mỗi ngày"],
["handle the situation calmly","bình tĩnh xử lý tình huống"],["ask someone for a second opinion","xin thêm ý kiến của người khác"],
["send a reminder before the meeting","gửi lời nhắc trước cuộc họp"],["look for a more affordable option","tìm lựa chọn hợp túi tiền hơn"]
];
function contextual(p,action,meaning){
 const kind=p.kind;
 const special={
 "think":["I think we should ","Tôi nghĩ chúng ta nên "],
 "think-not":["I don't think we need to ","Tôi không nghĩ chúng ta cần "],
 "sure":["I'm sure we can ","Tôi chắc chúng ta có thể "],
 "afraid":["I'm afraid we can't ","Tôi e rằng chúng ta không thể "],
 "opinion":["In my opinion, we should ","Theo tôi, chúng ta nên "],
 "think-q":["Do you think we should ","Bạn nghĩ chúng ta có nên "],
 "wonder":["I'm wondering if we can ","Tôi đang tự hỏi liệu chúng ta có thể "],
 "know":["As far as I know, we need to ","Theo tôi biết, chúng ta cần "],
 "that-why":["That's why we need to ","Đó là lý do chúng ta cần "],
 "is-there":["Is there a way to ","Có cách nào để "],
 "are-there":["Are there any ways to ","Có những cách nào để "],
 "what-kind":["What kind of help do you need to ","Bạn cần trợ giúp kiểu nào để "],
 "have-you":["Have you ever had to ","Bạn đã từng phải "],
 "how-was":["How was it when you had to ","Mọi việc thế nào khi bạn phải "],
 "what-happened":["What happened when you tried to ","Chuyện gì xảy ra khi bạn cố "],
 "reminds":["It reminds me of the time we had to ","Nó làm tôi nhớ đến lần chúng ta phải "],
 "although":["Although it's difficult, I'll ","Mặc dù khó, tôi sẽ "],
 "even-if":["Even if it takes time, I'll ","Dù mất thời gian, tôi vẫn sẽ "],
 "as-long":["As long as we have time, we can ","Miễn là có thời gian, chúng ta có thể "],
 "if":["If you ","Nếu bạn "],
 "unless":["Unless you ","Trừ khi bạn "],
 "in-order":["In order to ","Để "],
 "as-soon":["As soon as I ","Ngay khi tôi "],
 "before":["Before you ","Trước khi bạn "],
 "after":["After I ","Sau khi tôi "],
 "while":["While I was busy trying to ","Trong lúc tôi đang cố "],
 "time":["It takes time to ","Cần thời gian để "],
 "long":["How long does it take to ","Mất bao lâu để "],
 "possible":["Is it possible to ","Có thể "],
 "necessary":["It's necessary to ","Cần thiết phải "],
 "responsible":["I'm in charge of ","Tôi phụ trách việc "],
 "used":["I used to ","Trước đây tôi từng "],
 "used-ing":["I'm getting used to ","Tôi đang dần quen với việc "],
 "busy":["I'm busy trying to ","Tôi đang bận cố "],
 "dont-know":["I have no idea how to ","Tôi không biết cách "],
 "explain-how":["Can you show me how to ","Bạn chỉ tôi cách "],
 "okay-if":["Is it okay if I ","Tôi "],
 "mind-if":["Do you mind if I ","Bạn có phiền nếu tôi "],
 "its-time":["It's time to ","Đến lúc "],
 "otherwise":["Otherwise, we may have to ","Nếu không, chúng ta có thể phải "],
 "that-why":["That's why we need to ","Đó là lý do chúng ta cần "],
 "have-to":["I have to ","Tôi phải "]
 };
 const result=special[kind]||[p.t.replace(/[…?.,\s]+$/g,"")+" ",""+(p.vi.replace(/[…?.,\s]+$/g,""))+" "];
 // Safer default: familiar grammar rather than a poorly formed generic stem.
 if(!special[kind]&&!/^(?:I|You|Let|Can|Could|Will|Shall|May|Please|Don't|There)/i.test(result[0]))return ["I need to "+action+".","Tôi cần "+meaning+"."];
 const q=/^(?:Is |Are |Do |Did |When |How |Can |Could |May |Will |Shall |Would |Why )/i.test(result[0]);
 const baseEn=(result[0]+action).trim();
 return [baseEn+(q?"?":"."),(result[1]+meaning).trim()+(q?"?":".")];
}
function makeExtras(p){
 const lesson=W.CONTENT_REGISTRY?.["en-pattern-"+String(p.n).padStart(3,"0")];
 const pack=W.BULK_PATTERN_PACKS?.[lesson?.id];if(!pack)return [];
 const rows=lesson.sections?.find(s=>s.id==="forty")?.blocks?.find(b=>b.type==="sentences")?.items||[];
 const main=new Set([...(pack.activeChunks||[]),...(pack.recognitionChunks||[])].map(x=>x[0].toLowerCase()));
 const out=[],known=new Set(main);
 const add=row=>{
  if(!Array.isArray(row)||row.length<4)return;
  const key=tidy(row[0]).toLowerCase();
  if(!key||known.has(key)||!/^[a-z]/i.test(key)||key.split(/\s+/).length<2)return;
  if(tidy(row[1]).length<5)return;
  known.add(key);out.push(row);
 };
 rows.forEach(row=>add(extractSentence(row,p)));
 // Fill from reusable everyday collocations, each with a bilingual context
 // rather than padding a deck with fragments such as "at", "the", or "a".
 const offset=(p.n*7)%enrichmentThemes.length;
 for(let i=0;out.length<44&&i<enrichmentThemes.length;i++){
  const [phrase,vi]=enrichmentThemes[(i+offset)%enrichmentThemes.length];
  if([18,19,22,27,28].includes(p.n)&&/\b(my|me)\b/i.test(phrase))continue;
  const context=contextual(p,phrase,vi);
  add([phrase,vi,...context]);
 }
 return out.slice(0,44);
}
for(const p of specs){
 const pack=W.BULK_PATTERN_PACKS?.["en-pattern-"+String(p.n).padStart(3,"0")];
 if(pack)pack.supplementChunks=makeExtras(p);
}
})();
