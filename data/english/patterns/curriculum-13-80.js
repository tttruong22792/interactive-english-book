(function(){
"use strict";
const W=window;
W.CONTENT_REGISTRY=W.CONTENT_REGISTRY||{};
const rawActions=[
["check the schedule","kiểm tra lịch trình"],["go over the report","rà soát báo cáo"],["take a closer look at the problem","xem xét kỹ hơn vấn đề"],["make a reservation","đặt chỗ trước"],["pick up the kids","đón các con"],["get ready for work","chuẩn bị đi làm"],["take care of the paperwork","lo liệu giấy tờ"],["figure out what went wrong","tìm hiểu điều gì xảy ra sai"],["follow up on the request","theo dõi tiếp yêu cầu"],["deal with an urgent issue","xử lý một việc khẩn cấp"],["come up with a better solution","nghĩ ra một giải pháp tốt hơn"],["set aside some money","để dành một ít tiền"],["make a final decision","đưa ra quyết định cuối cùng"],["compare the different options","so sánh các lựa chọn"],["think things through","suy nghĩ thấu đáo"],["get back to the customer","phản hồi lại khách hàng"],["check the system logs","kiểm tra nhật ký hệ thống"],["double-check the settings","kiểm tra kỹ lại cài đặt"],["sort out the documents","sắp xếp lại giấy tờ"],["make sure everything is ready","đảm bảo mọi thứ đã sẵn sàng"],["clean up the kitchen","dọn dẹp nhà bếp"],["buy groceries on the way home","mua thực phẩm trên đường về"],["prepare dinner for the family","chuẩn bị bữa tối cho gia đình"],["book a doctor's appointment","đặt lịch hẹn khám bác sĩ"],["reschedule the meeting","đổi lịch cuộc họp"],["write a clear email","viết một email rõ ràng"],["talk to my manager","trao đổi với quản lý"],["ask for more information","hỏi thêm thông tin"],["explain the problem clearly","giải thích vấn đề rõ ràng"],["review the contract","xem lại hợp đồng"],["fix the connection issue","sửa lỗi kết nối"],["test the new feature","kiểm tra tính năng mới"],["update the software","cập nhật phần mềm"],["back up the important files","sao lưu các tệp quan trọng"],["save more money each month","tiết kiệm thêm tiền mỗi tháng"],["cut back on unnecessary spending","giảm chi tiêu không cần thiết"],["keep track of expenses","theo dõi chi tiêu"],["pay the electricity bill","thanh toán tiền điện"],["charge my phone","sạc điện thoại"],["find a quieter place","tìm chỗ yên tĩnh hơn"],["get some fresh air","ra ngoài hít thở không khí trong lành"],["take a short break","nghỉ giải lao một chút"],["spend time with my family","dành thời gian cho gia đình"],["visit my parents","thăm bố mẹ"],["help the kids with homework","giúp các con làm bài tập"],["organize my desk","sắp xếp bàn làm việc"],["clean the bathroom","dọn phòng tắm"],["get enough sleep","ngủ đủ giấc"],["practice speaking English","luyện nói tiếng Anh"],["work on my pronunciation","cải thiện phát âm"],["learn a useful expression","học một cách diễn đạt hữu ích"],["put what I learn into practice","áp dụng điều đã học vào thực tế"],["build a better daily routine","xây dựng thói quen hàng ngày tốt hơn"],["stick to my plan","bám sát kế hoạch"],["prioritize the urgent tasks","ưu tiên những việc khẩn cấp"],["leave a little earlier","đi sớm hơn một chút"],["confirm the appointment","xác nhận lịch hẹn"],["check the weather forecast","xem dự báo thời tiết"],["make the most of my free time","tận dụng thời gian rảnh"],["get used to the new environment","làm quen với môi trường mới"],["look for a better opportunity","tìm một cơ hội tốt hơn"],["take responsibility for my decisions","chịu trách nhiệm về quyết định của mình"],["keep everyone updated","thông báo tình hình cho mọi người"],["get a second opinion","xin thêm ý kiến khác"],["handle the situation calmly","xử lý tình huống một cách bình tĩnh"],["talk it over with my family","bàn bạc việc đó với gia đình"],["make some changes to the plan","điều chỉnh kế hoạch"],["find out more about the service","tìm hiểu thêm về dịch vụ"],["return the item to the store","trả lại món hàng cho cửa hàng"],["send the documents before Friday","gửi giấy tờ trước thứ Sáu"],["take the car to the garage","đưa xe đến gara"],["set a reminder on my phone","đặt lời nhắc trên điện thoại"],["keep an eye on the kids","trông chừng các con"],["check whether the door is locked","kiểm tra xem cửa đã khóa chưa"],["turn off unnecessary notifications","tắt những thông báo không cần thiết"],["ask someone to help me","nhờ ai đó giúp"],["finish the task on time","hoàn thành công việc đúng hạn"],["follow the instructions carefully","làm theo hướng dẫn cẩn thận"],["find a way to solve the problem","tìm cách giải quyết vấn đề"],["take a different approach","thử cách tiếp cận khác"]
];
const rawClaims=[
["we need more time","chúng ta cần thêm thời gian"],["the meeting might take longer than expected","cuộc họp có thể kéo dài hơn dự kiến"],["the plan makes sense","kế hoạch này hợp lý"],["we should check the details first","chúng ta nên kiểm tra chi tiết trước"],["it's better to leave early","tốt hơn nên đi sớm"],["the customer is still waiting for an answer","khách hàng vẫn đang chờ câu trả lời"],["the new approach will save time","cách tiếp cận mới sẽ tiết kiệm thời gian"],["this issue needs to be fixed today","vấn đề này cần được sửa hôm nay"],["it's worth trying again","đáng để thử lại một lần nữa"],["we can finish the task by Friday","chúng ta có thể hoàn thành công việc trước thứ Sáu"],["the traffic will be heavy tonight","tối nay đường sẽ đông"],["the children need more time to rest","bọn trẻ cần thêm thời gian nghỉ ngơi"],["it would be helpful to ask for advice","việc xin lời khuyên sẽ có ích"],["there's a simpler way to do this","có cách đơn giản hơn để làm việc này"],["the instructions could be clearer","hướng dẫn có thể rõ ràng hơn"],["we're making steady progress","chúng ta đang tiến bộ đều đặn"],["it may not be the right time","có thể đây chưa phải thời điểm phù hợp"],["we should compare the prices","chúng ta nên so sánh giá"],["the system is working properly now","hệ thống hiện đang hoạt động đúng"],["we should discuss it with the team","chúng ta nên trao đổi với nhóm"],["we need to focus on what matters most","chúng ta cần tập trung vào điều quan trọng nhất"],["the deadline is too tight","hạn chót quá gấp"],["the new feature looks promising","tính năng mới có vẻ triển vọng"],["a short break would help","nghỉ một chút sẽ có ích"],["it might be easier to do it tomorrow","ngày mai làm có thể dễ hơn"],["the children will enjoy this activity","các con sẽ thích hoạt động này"],["it's important to keep a backup","việc giữ một bản sao lưu là quan trọng"],["our expenses are getting too high","chi phí của chúng ta đang tăng quá cao"],["we should take a closer look at the problem","chúng ta nên xem xét kỹ vấn đề hơn"],["it takes practice to speak naturally","cần luyện tập để nói tự nhiên"],["we can work it out together","chúng ta có thể cùng giải quyết"],["the reservation has been confirmed","việc đặt chỗ đã được xác nhận"],["the documents are ready to send","giấy tờ đã sẵn sàng để gửi"],["the schedule needs to be updated","lịch trình cần được cập nhật"],["we don't have enough information yet","chúng ta chưa có đủ thông tin"],["the solution is more complicated than it seems","giải pháp phức tạp hơn vẻ ngoài"],["it's safe to wait until tomorrow","đợi đến mai là an toàn"],["the product might be out of stock","sản phẩm có thể đã hết hàng"],["everyone deserves a clear explanation","mọi người đều xứng đáng có lời giải thích rõ ràng"],["we shouldn't rush into a decision","chúng ta không nên quyết định vội"]
];
const negativeClaims=[
["we can't finish this by tonight","chúng ta không thể hoàn thành trước tối nay"],["the appointment has to be postponed","lịch hẹn phải được dời lại"],["the system isn't responding","hệ thống không phản hồi"],["the item is out of stock","món hàng đã hết"],["we need to cancel the meeting","chúng ta cần hủy cuộc họp"],["the deadline is too soon","hạn chót quá gần"],["I won't be able to join the call","tôi sẽ không thể tham gia cuộc gọi"],["the delivery will arrive late","hàng sẽ đến muộn"],["we don't have enough information yet","chúng ta vẫn chưa đủ thông tin"],["there has been a misunderstanding","đã có sự hiểu lầm"]
];
const nouns=[
["a problem with the Wi-Fi","vấn đề với Wi-Fi"],["a pharmacy nearby","hiệu thuốc gần đây"],["an easier way to do this","cách dễ hơn để làm việc này"],["a parking space available","chỗ đỗ xe còn trống"],["a message from the manager","tin nhắn từ quản lý"],["an appointment tomorrow","cuộc hẹn ngày mai"],["a better option","lựa chọn tốt hơn"],["a reason for the delay","lý do của sự chậm trễ"],["a quiet room for the meeting","phòng yên tĩnh cho cuộc họp"],["a chance to try again","cơ hội thử lại"],["a supermarket around here","siêu thị quanh đây"],["an extra charge","khoản phí phát sinh"],["a deadline for this task","hạn chót cho việc này"],["a way to fix the problem","cách sửa vấn đề"],["a train to the airport","tàu đến sân bay"],["a problem with the payment","vấn đề thanh toán"],["a spare key","chìa khóa dự phòng"],["a receipt for this purchase","hóa đơn cho lần mua này"],["a more affordable plan","gói dịch vụ hợp túi tiền hơn"],["a place to charge my phone","chỗ sạc điện thoại"]
];
const plurals=[
["any seats left","ghế trống nào nữa"],["any updates on the issue","cập nhật nào về vấn đề"],["any questions about the plan","câu hỏi nào về kế hoạch"],["any restaurants nearby","nhà hàng nào gần đây"],["any available appointments tomorrow","lịch hẹn trống nào vào ngày mai"],["any extra charges","khoản phí phát sinh nào"],["any changes to the schedule","thay đổi nào trong lịch"],["any problems with the connection","vấn đề nào với kết nối"],["any documents I need to bring","giấy tờ nào tôi cần mang"],["any alternatives to this product","lựa chọn thay thế nào cho sản phẩm này"],["any messages for me","tin nhắn nào dành cho tôi"],["any tasks left to finish","công việc nào còn phải làm"],["any buses after midnight","xe buýt nào sau nửa đêm"],["any discounts available","ưu đãi giảm giá nào"],["any risks we should consider","rủi ro nào chúng ta nên cân nhắc"],["any seats by the window","chỗ ngồi nào gần cửa sổ"],["any updates from the customer","cập nhật nào từ khách hàng"],["any mistakes in the report","lỗi nào trong báo cáo"],["any cheaper options","lựa chọn nào rẻ hơn"],["any activities for children","hoạt động nào dành cho trẻ em"]
];
const times=[
["your weekend","cuối tuần của bạn"],["the meeting","cuộc họp"],["the trip to Kyoto","chuyến đi đến Kyoto"],["your first day at work","ngày đầu đi làm của bạn"],["the interview","buổi phỏng vấn"],["the presentation","bài thuyết trình"],["your appointment","buổi hẹn của bạn"],["the flight","chuyến bay"],["the weather yesterday","thời tiết hôm qua"],["your English lesson","buổi học tiếng Anh của bạn"],["the restaurant","nhà hàng"],["your family holiday","kỳ nghỉ gia đình của bạn"],["the new project","dự án mới"],["the conference","hội nghị"],["the doctor's visit","buổi khám bác sĩ"],["the weekend with the kids","cuối tuần cùng các con"],["the road trip","chuyến đi bằng ô tô"],["the new software update","bản cập nhật phần mềm mới"],["your conversation with the manager","cuộc trao đổi với quản lý"],["the first day of school","ngày đầu đi học"]
];
const topicNouns=[
["food","món ăn","eat","ăn"],["music","nhạc","listen to","nghe"],["books","sách","read","đọc"],["coffee","cà phê","drink","uống"],["movies","phim","watch","xem"],["restaurants","nhà hàng","prefer","thích"],["job","công việc","want","muốn"],["phone","điện thoại","use","dùng"],["car","ô tô","drive","lái"],["exercise","bài tập thể dục","do","tập"],["English lessons","bài học tiếng Anh","find helpful","thấy hữu ích"],["software","phần mềm","recommend","giới thiệu"],["schedule","lịch trình","prefer","thích"],["hotel","khách sạn","usually book","thường đặt"],["activities","hoạt động","enjoy","thích"],["weather","thời tiết","like","thích"],["transportation","phương tiện đi lại","use","dùng"],["shoes","giày","usually wear","thường mang"],["fruit","trái cây","buy","mua"],["projects","dự án","work on","thực hiện"]
];
const memoryNouns=[
["my childhood","tuổi thơ của tôi"],["our trip to Vietnam","chuyến đi Việt Nam của chúng tôi"],["my first day at work","ngày đầu đi làm của tôi"],["the place where I grew up","nơi tôi lớn lên"],["a conversation we had last year","cuộc trò chuyện chúng ta có năm ngoái"],["the first time I learned English","lần đầu tôi học tiếng Anh"],["my family holidays","những kỳ nghỉ gia đình của tôi"],["an old friend","một người bạn cũ"],["the restaurant we used to visit","nhà hàng chúng tôi từng đến"],["the house we lived in","ngôi nhà chúng tôi từng ở"],["my old school","trường cũ của tôi"],["a song my parents loved","bài hát bố mẹ tôi thích"],["the last time we worked together","lần cuối chúng ta làm việc cùng nhau"],["the summer I spent with my grandparents","mùa hè tôi ở cùng ông bà"],["our first family car","chiếc xe gia đình đầu tiên"],["the job I had before","công việc trước đây của tôi"],["the movie we watched together","bộ phim chúng ta từng xem cùng"],["my hometown","quê hương tôi"],["my first trip abroad","chuyến đi nước ngoài đầu tiên"],["the advice my teacher gave me","lời khuyên thầy cô từng nói"]
];
const errors=[
["being late for the meeting","đến cuộc họp muộn"],["forgetting to reply","quên trả lời"],["making you wait","để bạn phải đợi"],["missing your call","bỏ lỡ cuộc gọi của bạn"],["interrupting you","ngắt lời bạn"],["sending the wrong file","gửi nhầm tệp"],["causing confusion","gây hiểu lầm"],["not checking sooner","không kiểm tra sớm hơn"],["changing the plan at the last minute","đổi kế hoạch vào phút cuối"],["forgetting the appointment","quên lịch hẹn"],["making a mistake in the report","mắc lỗi trong báo cáo"],["raising my voice","nói to tiếng"],["not explaining it clearly","không giải thích rõ ràng"],["keeping you waiting","để bạn chờ lâu"],["not letting you know earlier","không báo trước cho bạn"],["overlooking that detail","bỏ sót chi tiết đó"],["being unable to attend","không thể tham dự"],["misunderstanding the question","hiểu nhầm câu hỏi"],["forgetting to attach the document","quên đính kèm tài liệu"],["taking so long to respond","phản hồi chậm như vậy"]
];
const helps=[
["taking the time to explain","dành thời gian giải thích"],["helping me with the task","giúp tôi với công việc"],["getting back to me so quickly","phản hồi tôi nhanh như vậy"],["looking into the issue","kiểm tra vấn đề"],["keeping me updated","cập nhật tình hình cho tôi"],["giving me another chance","cho tôi thêm cơ hội"],["picking up the kids","đón các con"],["sharing your experience","chia sẻ kinh nghiệm"],["being so patient","kiên nhẫn như vậy"],["letting me know in advance","báo cho tôi biết trước"],["checking the details","kiểm tra các chi tiết"],["staying a little longer","ở lại thêm một lúc"],["coming to the meeting","đến cuộc họp"],["taking care of everything","lo liệu mọi việc"],["making time for us","dành thời gian cho chúng tôi"],["pointing out the mistake","chỉ ra lỗi sai"],["understanding the situation","thấu hiểu tình hình"],["sending the documents","gửi các giấy tờ"],["working through this together","cùng nhau giải quyết việc này"],["supporting me when I needed help","hỗ trợ tôi lúc tôi cần"]
];
const agreements=[
["your suggestion","đề xuất của bạn"],["what you said earlier","điều bạn nói lúc nãy"],["the main point","điểm chính"],["your approach","cách tiếp cận của bạn"],["the decision to wait","quyết định chờ đợi"],["the plan to simplify the process","kế hoạch đơn giản hóa quy trình"],["the feedback from the customer","ý kiến phản hồi của khách hàng"],["your explanation","lời giải thích của bạn"],["most of your ideas","phần lớn ý tưởng của bạn"],["the way you handled it","cách bạn đã xử lý"],["the recommendation to double-check everything","đề xuất kiểm tra lại mọi thứ"],["your point about safety","ý kiến của bạn về an toàn"],["the decision to ask for help","quyết định nhờ giúp đỡ"],["your conclusion","kết luận của bạn"],["the proposed schedule","lịch trình đề xuất"],["the new priorities","những ưu tiên mới"],["your concern about the deadline","mối lo của bạn về thời hạn"],["the advice to start small","lời khuyên nên bắt đầu từ việc nhỏ"],["the need for more testing","sự cần thiết phải kiểm thử thêm"],["the idea of learning in short sessions","ý tưởng học trong các buổi ngắn"]
];
const causes=["the traffic jam","the heavy rain","an unexpected appointment","the deadline","a technical problem","the schedule change","the school holiday","the power outage","the price increase","a family emergency"];
const causesVi=["tắc đường","mưa lớn","một lịch hẹn bất ngờ","hạn chót","sự cố kỹ thuật","thay đổi lịch trình","kỳ nghỉ của trường","mất điện","giá tăng","một việc gia đình khẩn cấp"];
const endings=[
["we'll avoid unnecessary mistakes","chúng ta sẽ tránh được sai sót không cần thiết"],["we'll have a clearer plan","chúng ta sẽ có kế hoạch rõ ràng hơn"],["everyone will understand","mọi người sẽ hiểu"],["we can save more time","chúng ta có thể tiết kiệm thời gian"],["we'll be ready by Friday","chúng ta sẽ sẵn sàng trước thứ Sáu"],["we won't miss anything important","chúng ta sẽ không bỏ lỡ điều quan trọng"],["it'll be easier to follow up","việc theo dõi tiếp sẽ dễ hơn"],["we can make a better decision","chúng ta có thể đưa ra quyết định tốt hơn"],["the team can work more smoothly","cả nhóm có thể làm việc trôi chảy hơn"],["we can prevent the same issue","chúng ta có thể tránh cùng vấn đề tái diễn"]
];
const prep=["before dinner","after the meeting","on the way home","as soon as possible","by the end of the day","before Friday","this weekend","later today","when I have time","once everyone is ready"];
const prepVi=["trước bữa tối","sau cuộc họp","trên đường về nhà","sớm nhất có thể","trước cuối ngày","trước thứ Sáu","cuối tuần này","lát nữa hôm nay","khi tôi có thời gian","khi mọi người đã sẵn sàng"];
const irreg={be:["being","been"],get:["getting","gotten"],go:["going","gone"],take:["taking","taken"],make:["making","made"],give:["giving","given"],come:["coming","come"],see:["seeing","seen"],buy:["buying","bought"],write:["writing","written"],do:["doing","done"],have:["having","had"],find:["finding","found"],leave:["leaving","left"],think:["thinking","thought"],spend:["spending","spent"],set:["setting","set"],keep:["keeping","kept"],pay:["paying","paid"],send:["sending","sent"],drive:["driving","driven"],put:["putting","put"],choose:["choosing","chosen"],build:["building","built"],catch:["catching","caught"],meet:["meeting","met"]};
function gerund(v){
  const p=v.split(" ");const first=p.shift();let g=irreg[first]?.[0];
  if(!g){g=/ie$/.test(first)?first.slice(0,-2)+"ying":/[^e]e$/.test(first)?first.slice(0,-1)+"ing":/^(stop|plan|run|sit|swim)$/.test(first)?first+first.slice(-1)+"ing":first+"ing";}
  return [g,...p].join(" ");
}
function participle(v){const p=v.split(" ");const first=p.shift();let f=irreg[first]?.[1];if(!f){f=/e$/.test(first)?first+"d":/[^aeiou]y$/.test(first)?first.slice(0,-1)+"ied":first+"ed";}return [f,...p].join(" ");}
function lc(x){return x.charAt(0).toLowerCase()+x.slice(1);}
function upper(x){return x.charAt(0).toUpperCase()+x.slice(1);}
function pair(en,vi){return [upper(en).replace(/\s+/g," ").trim(),upper(vi).replace(/\s+/g," ").trim()];}
function choose(bank,n,order,offset=0){return bank[(order*13+n*7+offset)%bank.length];}
function englishStem(p){
 let t=p.t.replace(/[…?.,\s]+$/g,"").trim();
 if(p.kind==="opinion"||p.kind==="know")t+=",";
 return t;
}
function vietnameseStem(p){
 const map={13:"Để tôi",14:"Chúng ta hãy",15:"Bạn nên",16:"Tôi nhất định phải",18:"Chúng ta",19:"Hay là chúng ta",20:"Bạn nên",21:"Tôi có thể",22:"Bạn có thể",23:"Tôi xin phép",25:"Tôi có thể",26:"Tôi không thể",27:"Bạn sẽ",28:"Bạn có phiền",29:"Bạn có phiền nếu tôi",30:"Hãy nhớ",43:"Tôi nghĩ rằng",44:"Tôi không nghĩ rằng",45:"Bạn có nghĩ rằng",46:"Tôi muốn",47:"Tôi chắc rằng",48:"Tôi e rằng",49:"Theo tôi,",55:"Ngay khi",56:"Trong lúc tôi đang",57:"Trước khi bạn",58:"Sau khi tôi",61:"Bởi vì",62:"Đó là lý do",63:"Nếu bạn",64:"Để",65:"Để",66:"Trừ khi bạn",67:"Ngay cả khi",68:"Miễn là",69:"Mặc dù",70:"Nếu không,",75:"Đừng ngần ngại",78:"Không cần",79:"Tôi đang tự hỏi liệu",80:"Theo những gì tôi biết,"};
 return map[p.n]||p.vi.replace(/[…?]+.*$/g,"").trim();
}
function actionPairs(spec){const list=[];for(let i=0;i<70;i++){const action=choose(rawActions,i,spec.n);const p=buildAction(spec,action,i);if(p)list.push(p);}return list;}
function buildAction(p,a,i){
 const [v,vi]=a,ing=gerund(v),pp=participle(v);
 const en=englishStem(p),ve=vietnameseStem(p);
 switch(p.kind){
 case "v":return pair(en+" "+v+(p.question?"?":"."),ve+" "+vi+(p.question?"?":"."));
 case "askv":return pair(en+" "+v+"?",ve+" "+vi+"?");
 case "ing":return pair(en+" "+ing+(p.question?"?":"."),ve+" "+vi+(p.question?"?":"."));
 case "ever":return pair("Have you ever "+pp+"?","Bạn đã từng "+vi+" bao giờ chưa?");
 case "before":return pair("Before you "+v+", make sure you have enough time.","Trước khi "+vi+", hãy đảm bảo bạn có đủ thời gian.");
 case "after":return pair("After I "+v+", I'll let you know.","Sau khi tôi "+vi+", tôi sẽ báo bạn biết.");
 case "as-soon":return pair("As soon as I "+v+", I'll get back to you.","Ngay khi tôi "+vi+", tôi sẽ phản hồi bạn.");
 case "while":return pair("While I was "+ing+", I noticed something important.","Trong lúc tôi đang "+vi+", tôi nhận thấy điều quan trọng.");
 case "if":return pair("If you "+v+", you'll understand the situation better.","Nếu bạn "+vi+", bạn sẽ hiểu tình hình rõ hơn.");
 case "unless":return pair("Unless you "+v+", we may have to change the plan.","Trừ khi bạn "+vi+", chúng ta có thể phải đổi kế hoạch.");
 case "even-if":return pair("Even if it takes longer, I'll "+v+".","Dù mất thêm thời gian, tôi vẫn sẽ "+vi+".");
 case "as-long":return pair("As long as we have enough time, we can "+v+".","Miễn là có đủ thời gian, chúng ta có thể "+vi+".");
 case "although":return pair("Although I'm busy today, I'll "+v+".","Mặc dù hôm nay bận, tôi vẫn sẽ "+vi+".");
 case "otherwise":return pair("Otherwise, we'll have to "+v+".","Nếu không, chúng ta sẽ phải "+vi+".");
 case "so-that":{const end=choose(endings,i,p.n);return pair("I'll "+v+" so that "+end[0]+".","Tôi sẽ "+vi+" để "+end[1]+".");}
 case "in-order":return pair("In order to "+v+", I need to plan ahead.","Để "+vi+", tôi cần lên kế hoạch trước.");
 case "time":return pair("It takes time to "+v+".","Cần có thời gian để "+vi+".");
 case "long":return pair("How long does it take to "+v+"?","Mất bao lâu để "+vi+"?");
 case "able":return pair("Are you ready to "+v+"?","Bạn đã sẵn sàng "+vi+" chưa?");
 case "responsible":return pair("I'm in charge of "+ing+".","Tôi phụ trách việc "+vi+".");
 case "because":{const n=i%causes.length;return pair("Because of "+causes[n]+", I have to "+v+".","Vì "+causesVi[n]+", tôi phải "+vi+".");}
 case "used":return pair("I used to "+v+".","Trước đây tôi từng "+vi+".");
 case "used-ing":return pair("I'm used to "+ing+".","Tôi đã quen với việc "+vi+".");
 case "have-you":return pair("Have you ever "+pp+"?","Bạn đã từng "+vi+" bao giờ chưa?");
 case "did-i":return pair("Did I "+v+"?","Tôi đã "+vi+" chưa nhỉ?");
 case "did-you":return pair("Did you "+v+"?","Bạn đã "+vi+" chưa?");
 case "when":return pair("When did you "+v+"?","Bạn "+vi+" khi nào?");
 case "frequency":return pair("How often do you "+v+"?","Bạn "+vi+" bao lâu một lần?");
 case "mind-if":return pair("Do you mind if I "+v+"?","Bạn có phiền nếu tôi "+vi+" không?");
 case "okay-if":return pair("Is it okay if I "+v+"?","Tôi "+vi+" có được không?");
 case "explain-how":return pair("Can you show me how to "+v+"?","Bạn có thể chỉ cho tôi cách "+vi+" không?");
 case "dont-know":return pair("I have no idea how to "+v+".","Tôi không biết phải "+vi+" như thế nào.");
 case "thanks":return null;
 case "sorry":return null;
 default:return null;
 }
}
function buildClaim(p,c,i){
 const [en,vi]=c,kind=p.kind;
 switch(kind){
 case "think":case "think-not":case "sure":case "afraid":case "wonder":case "know":case "opinion":case "think-q":case "why":
   return pair(englishStem(p)+" "+en+(p.question?"?":"."),vietnameseStem(p)+" "+vi+(p.question?"?":"."));
 case "that-why":return pair("That's why "+en+".","Đó là lý do "+vi+".");
 case "although-claim":return pair("Although "+en+", we should stay flexible.","Mặc dù "+vi+", chúng ta vẫn nên linh hoạt.");
 default:return null;
 }
}
function makeExamples(p){
 const arr=[];
 function add(e,v){if(!e||!v)return;const key=e.toLowerCase().replace(/[^a-z ]/g,"");if(arr.some(x=>x[0].toLowerCase().replace(/[^a-z ]/g,"")===key))return;arr.push(pair(e,v));}
 (p.special||[]).forEach(x=>add(x[0],x[1]));
 for(let i=0;arr.length<40&&i<190;i++){
   const j=i+p.n*3;
   let x;
   if(["think","think-not","sure","afraid","wonder","know","opinion","think-q","that-why"].includes(p.kind)) {
     const c=p.kind==="afraid"?choose(negativeClaims,i,p.n):choose(rawClaims,i,p.n);x=p.kind==="afraid"&&i>=10?buildAction({...p,kind:"afraid-action"},choose(rawActions,i,p.n),i):buildClaim(p,c,i);
   }else if(p.kind==="is-there") {const n=choose(nouns,i,p.n);x=pair("Is there "+n[0]+"?","Có "+n[1]+" không?");}
   else if(p.kind==="are-there"){const n=choose(plurals,i,p.n);x=pair("Are there "+n[0]+"?","Có "+n[1]+" không?");}
   else if(p.kind==="how-was"){const n=choose(times,i,p.n);x=pair("How was "+n[0]+"?",""+upper(n[1])+" thế nào?");}
   else if(p.kind==="what-happened"){const n=choose(times,i,p.n);x=pair("What happened to "+n[0]+"?","Chuyện gì đã xảy ra với "+n[1]+"?");}
   else if(p.kind==="what-kind"){const n=choose(topicNouns,i,p.n);x=pair("What kind of "+n[0]+" do you "+n[2]+"?","Bạn "+n[3]+" loại "+n[1]+" nào?");}
   else if(p.kind==="reminds"){const n=choose(memoryNouns,i,p.n);x=pair("It reminds me of "+n[0]+".","Nó làm tôi nhớ đến "+n[1]+".");}
   else if(p.kind==="agree"){const n=choose(agreements,i,p.n);x=pair("I agree with "+n[0]+".","Tôi đồng ý với "+n[1]+".");}
   else if(p.kind==="thanks"){const n=choose(helps,i,p.n);x=pair("Thank you for "+n[0]+".","Cảm ơn bạn vì đã "+n[1]+".");}
   else if(p.kind==="sorry"){const n=choose(errors,i,p.n);x=pair("I'm sorry for "+n[0]+".","Tôi xin lỗi vì đã "+n[1]+".");}
   else if(p.kind==="its-time"){const n=choose(rawActions,i,p.n);x=pair("It's time to "+n[0]+".","Đã đến lúc "+n[1]+".");}
   else if(p.kind==="busy"){const n=choose(rawActions,i,p.n);x=pair("I'm busy "+gerund(n[0])+".","Tôi đang bận "+n[1]+".");}
   else if(p.kind==="necessary"){const n=choose(rawActions,i,p.n);x=pair("It's necessary to "+n[0]+".","Việc "+n[1]+" là cần thiết.");}
   else if(p.kind==="possible"){const n=choose(rawActions,i,p.n);x=pair("Is it possible to "+n[0]+"?","Có thể "+n[1]+" không?");}
   else if(p.kind==="afraid-action"){const n=choose(rawActions,i,p.n);x=pair("I'm afraid that we won't be able to "+n[0]+".","Tôi e rằng chúng ta sẽ không thể "+n[1]+".");}
   else x=buildAction(p,choose(rawActions,i,p.n),i);
   if(x)add(...x);
 }
 // Expand naturally contextualized variants when the source bank contains fewer unique examples.
 for(let i=0;arr.length<40&&i<180;i++){
   const base=arr[i%arr.length];
   if(["how-was","is-there","are-there","what-kind","what-happened"].includes(p.kind)){
     const prefix=["So, ","By the way, ","Excuse me, ","Just to clarify, "][Math.floor(i/20)%4];
     add(prefix+lc(base[0]),"Cho tôi hỏi: "+lc(base[1]));
     continue;
   }
   if(p.kind==="agree"){add(base[0].replace(/^I agree with/,"I completely agree with"),base[1].replace(/^Tôi đồng ý với/,"Tôi hoàn toàn đồng ý với"));continue;}
   if(p.kind==="thanks"){add(base[0].replace(/^Thank you for/,"Thank you so much for"),base[1].replace(/^Cảm ơn bạn vì đã/,"Cảm ơn bạn rất nhiều vì đã"));continue;}
   if(p.kind==="sorry"){add(base[0].replace(/^I'm sorry for/,"I'm truly sorry for"),base[1].replace(/^Tôi xin lỗi vì đã/,"Tôi thật lòng xin lỗi vì đã"));continue;}
   if(p.kind==="reminds"){add(base[0].replace(/^It reminds me of/,"That really reminds me of"),base[1].replace(/^Nó làm tôi nhớ đến/,"Điều đó thực sự làm tôi nhớ đến"));continue;}

   const mod=prep[i%prep.length],vi=prepVi[i%prep.length];
   if(base[0].endsWith("?")) continue;
   add(base[0].replace(/[.]$/,"")+" "+mod+".",base[1].replace(/[.]$/,"")+" "+vi+".");
 }
 return arr.slice(0,40);
}
function chunksFor(p){
 // Ten reusable, high-frequency chunks; priorities rotate so later lessons cover more daily situations.
 const ten=[];
 let i=0;
 while(ten.length<10&&i<200){
  const row=choose(rawActions,i,p.n,p.n*2);
  if(!ten.some(x=>x[0]===row[0])) ten.push(row);
  i++;
 }
 return ten;
}
function render(p){
 const samples=makeExamples(p),chunks=chunksFor(p);
 const B={
  para:html=>({type:"paragraph",html}),formula:(text,note)=>({type:"formula",text,note}),
  callout:(tone,html)=>({type:"callout",tone,html}),sent:(items,extra={})=>({type:"sentences",items,...extra}),
  chips:items=>({type:"chips",items})
 };
 const sections=[
  {id:"pronunciation",title:"1. Cấu trúc và cách dùng",blocks:[
   B.formula(p.formula||p.t,p.rule||p.vi),
   B.callout("purple","Chú ý vị trí của động từ và ngữ cảnh; đừng dịch từng chữ. Học cả cụm, nghe cách nối âm rồi tự đặt câu theo tình huống thực."),
   B.sent(samples.slice(0,3))
  ]},
  {id:"meaning",title:"2. Hiểu ý nghĩa trong giao tiếp",blocks:[
   B.para("<p><b>"+p.t+"</b> = "+p.vi+". "+(p.tip||"Mẫu này được dùng trong cuộc sống, giao tiếp với đồng nghiệp, gia đình, mua sắm và các tình huống thực tế.")+"</p>"),
   B.sent(samples.slice(3,9))
  ]},
  {id:"variations",title:"3. Cách biến đổi và lỗi cần tránh",blocks:[
   B.para("<p>Không chỉ học thuộc một câu: hãy thay đối tượng, thời gian, địa điểm và lý do. Với mẫu câu hỏi, luyện cả ngữ điệu hỏi và câu trả lời tự nhiên.</p>"),
   B.sent(samples.slice(9,15)),
   B.callout("amber",p.note||"Đừng đánh đồng mẫu câu này với các mẫu gần nghĩa. Chú ý thì, trợ động từ, giới từ và dạng động từ đứng sau.")
  ]},
  {id:"forty",title:"4. 40 câu giao tiếp thực tế",blocks:[
   B.para("<p>40 câu đa dạng từ sinh hoạt, công việc đến những tình huống khó hơn. Hãy chọn 5 câu mỗi ngày, nghe, nhắc lại, rồi tự dùng trong bối cảnh mới.</p>"),
   B.sent(samples,{learnable:true,controls:true})
  ]},
  ...chunks.slice(0,6).map((c,i)=>{
   const uses=[
    [upper(c[0])+".",upper(c[1])+"."],
    ["I need to "+c[0]+".","Tôi cần "+c[1]+"."],
    ["Could you "+c[0]+"?","Bạn có thể "+c[1]+" không?"],
    ["I'm going to "+c[0]+" tomorrow.","Ngày mai tôi sẽ "+c[1]+"."],
    ["We should "+c[0]+" before Friday.","Chúng ta nên "+c[1]+" trước thứ Sáu."]
   ];
   return {id:"chunk-"+(i+1),title:(i+5)+". Chunk Family: "+c[0],blocks:[
    B.formula(c[0],c[1]),
    B.chips(uses),
    B.callout("green","Học cụm như một khối, sau đó kết hợp với các mẫu câu khác (I need to, I'm going to, Could you...) để dùng linh hoạt.")
   ]};
  }),
  {id:"review",title:"11. Kiểm tra Việt → Anh và biến đổi câu",blocks:[
   B.para("<p>Nhìn ý tiếng Việt, nói câu tiếng Anh trước khi nhìn đáp án. Đổi chủ ngữ hoặc tình huống để tập phản xạ.</p>"),
   B.sent(samples.slice(15,25),{learnable:true,controls:true})
  ]},
  {id:"dialog",title:"12. Tình huống hội thoại và phản xạ",blocks:[
   B.para("<p>Luyện hỏi/đáp tự nhiên: trả lời thành câu hoàn chỉnh, sử dụng cụm đã học và hỏi lại để duy trì hội thoại.</p>"),
   B.chips([
    ["A: Could you explain what happened?","A: Bạn có thể giải thích chuyện gì xảy ra không?"],
    ["B: "+samples[1][0],"B: "+samples[1][1]],
    ["A: What do you think we should do next?","A: Bạn nghĩ tiếp theo chúng ta nên làm gì?"],
    ["B: "+samples[2][0],"B: "+samples[2][1]]
   ])
  ]},
  {id:"practice",title:"Luyện toàn bộ câu trong bài",blocks:[{type:"quiz"}]}
 ];
 return {id:"en-pattern-"+String(p.n).padStart(3,"0"),language:"en",category:"patterns",renderer:"english-pattern",layout:"sectioned-pattern",
  order:p.n,title:p.t,meaning:p.vi,description:p.tip||"Cấu trúc giao tiếp thường dùng trong đời sống, công việc và gia đình.",
  sourceVersion:1,ui:{eyebrow:"MẪU CÂU SỐ "+p.n,meaningTitle:p.vi,leadHtml:"<strong>"+p.t+" = "+p.vi+"</strong>",
  formula:p.formula||p.t,introNoteHtml:p.tip||"Học với 40 ví dụ và Chunk Family, luyện Việt → Anh chủ động.",
  sourceNote:"Bài học giao tiếp biên soạn theo chủ đề đời sống và phương pháp Chunk Family."},
  introExamples:samples.slice(0,3),sections,practice:[],dailyFive:[],builderGroups:[],dictionary:{},phrases:Object.fromEntries(chunks.map(x=>[lc(x[0]),["",x[1],"I need to "+x[0]+"."]]))};
}
const SPECS=window.PATTERN_SPECS_13_80||[];
for(const p of SPECS){W.CONTENT_REGISTRY["en-pattern-"+String(p.n).padStart(3,"0")]=render(p);}
W.BULK_PATTERN_CHUNKS={};
W.BULK_PATTERN_PACKS={};
W.BULK_CHUNK_USAGE={};
W.BULK_CHUNK_USAGE_VI={};
for(const p of SPECS){
 const chunks=chunksFor(p),samples=makeExamples(p),id="en-pattern-"+String(p.n).padStart(3,"0");
 const full=chunks.map((c,i)=>[c[0],c[1],"I need to "+c[0]+".","Tôi cần "+c[1]+"."]);
 const pack={lessonId:id,order:p.n,pattern:p.t,meaning:p.vi,activeChunks:full.slice(0,6),
  recognitionChunks:full.slice(6),deepSentences:samples.slice(0,10),
  buildingBlocks:chunks.slice(0,5).map(c=>[c[0],c[1],full.find(x=>x[0]===c[0])[2],full.find(x=>x[0]===c[0])[3]])};
 W.BULK_PATTERN_PACKS[id]=pack;
 for(const c of chunks){
   const key=lc(c[0]);
   if(!W.BULK_CHUNK_USAGE[key]){
     W.BULK_CHUNK_USAGE[key]=[upper(c[0])+".","I need to "+c[0]+".","Could you "+c[0]+"?","I'm going to "+c[0]+" tomorrow.","We should "+c[0]+" before Friday."];
     W.BULK_CHUNK_USAGE_VI[key]=[upper(c[1])+".","Tôi cần "+c[1]+".","Bạn có thể "+c[1]+" không?","Ngày mai tôi sẽ "+c[1]+".","Chúng ta nên "+c[1]+" trước thứ Sáu."];
   }
 }
}
})();