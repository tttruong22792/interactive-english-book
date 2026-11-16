/* LEVEL 1 · STEP 19–23 · photos pp. 66–75 */
(function(){
"use strict";
const add=(id,start,rows)=>{const entries=rows.map((r,i)=>({n:start+i,en:r[0],ipa:r[6]||"",vi:r[1],ja:r[2],extra:r[7]||[],sentence:r[3],sentenceVi:r[4],sentenceJa:r[5],sentenceJaSource:"reconstructed"}));window.BOOK_2100_DATA.steps.push({id,start,end:start+entries.length-1,pages:(28+2*id)+"–"+(29+2*id),entries});};
add(19,219,[
["world","thế giới","世界{せかい}","It is the largest lake in the world.","Đó là hồ lớn nhất thế giới.","それは世界{せかい}で最{もっと}も大{おお}きな湖{みずうみ}です。"],
["country","đất nước; miền quê","国{くに}、田舎{いなか}","Which country do you want to visit?","Bạn muốn đến thăm đất nước nào?","あなたはどの国{くに}を訪{おとず}れたいですか。"],
["life","cuộc sống; sinh mệnh","生活{せいかつ}、生命{せいめい}","He enjoys his country life.","Anh ấy tận hưởng cuộc sống nông thôn.","彼{かれ}は田舎{いなか}の生活{せいかつ}を楽{たの}しんでいます。"],
["man","người đàn ông","男{おとこ}の人{ひと}","Do you know that tall man?","Bạn có biết người đàn ông cao kia không?","あの背{せ}の高{たか}い男{おとこ}の人{ひと}を知{し}っていますか。"],
["woman","người phụ nữ","女{おんな}の人{ひと}","Are these hats for women?","Những chiếc mũ này dành cho phụ nữ phải không?","これらの帽子{ぼうし}は女性用{じょせいよう}ですか。"],
["class","lớp học; tiết học","クラス、授業{じゅぎょう}","He and I are in the same class.","Anh ấy và tôi học cùng lớp.","彼{かれ}と私{わたし}は同{おな}じクラスです。"],
["classmate","bạn cùng lớp","同級生{どうきゅうせい}、クラスメート","They are my classmates.","Họ là bạn cùng lớp của tôi.","彼{かれ}らは私{わたし}のクラスメートです。"],
["game","trò chơi; trận đấu","試合{しあい}、ゲーム","In the evening, I watched a soccer game on TV.","Buổi tối tôi đã xem một trận bóng đá trên TV.","夜{よる}、私{わたし}はテレビでサッカーの試合{しあい}を見{み}ました。"],
["idea","ý tưởng; quan điểm","考{かんが}え、アイデア","That's a good idea.","Đó là một ý tưởng hay.","それはいい考{かんが}えです。"],
["room","căn phòng","部屋{へや}","They are now waiting in the next room.","Hiện giờ họ đang đợi ở phòng bên cạnh.","彼{かれ}らは今{いま}、隣{となり}の部屋{へや}で待{ま}っています。"],
["city","thành phố; đô thị","市{し}、都市{とし}","He works in a big city in Canada.","Anh ấy làm việc ở một thành phố lớn tại Canada.","彼{かれ}はカナダの大都市{だいとし}で働{はたら}いています。"],
["town","thị trấn; thị xã","町{まち}","He is from a small town in that country.","Anh ấy đến từ một thị trấn nhỏ của đất nước đó.","彼{かれ}はその国{くに}の小{ちい}さな町{まち}の出身{しゅっしん}です。"]
]);
add(20,231,[
["example","ví dụ","例{れい}","I'll give you an example.","Tôi sẽ đưa cho bạn một ví dụ.","例{れい}を一{ひと}つ挙{あ}げましょう。"],
["job","công việc; nghề nghiệp","仕事{しごと}","He found a job in this town.","Anh ấy tìm được việc làm ở thị trấn này.","彼{かれ}はこの町{まち}で仕事{しごと}を見{み}つけました。"],
["part","phần; bộ phận; vai trò","部分{ぶぶん}、役割{やくわり}","Music is an important part of my life.","Âm nhạc là một phần quan trọng trong cuộc sống của tôi.","音楽{おんがく}は私{わたし}の人生{じんせい}の大切{たいせつ}な一部{いちぶ}です。"],
["story","câu chuyện","話{はなし}、物語{ものがたり}","She told me an interesting story.","Cô ấy kể cho tôi một câu chuyện thú vị.","彼女{かのじょ}は私{わたし}に面白{おもしろ}い話{はなし}をしてくれました。"],
["event","sự kiện; việc xảy ra","行事{ぎょうじ}、出来事{できごと}","It is the biggest event of the year.","Đó là sự kiện lớn nhất trong năm.","それは一年{いちねん}で最{もっと}も大{おお}きな行事{ぎょうじ}です。"],
["river","con sông","川{かわ}","Let's go swimming in the river.","Chúng ta đi bơi ở sông nhé.","川{かわ}に泳{およ}ぎに行{い}きましょう。"],
["lake","hồ","湖{みずうみ}","You can play with fireworks by this lake.","Bạn có thể chơi pháo hoa cạnh hồ này.","この湖{みずうみ}のほとりで花火{はなび}ができます。"],
["trip","chuyến đi; cuộc du lịch","旅行{りょこう}","How was your trip to Kyoto?","Chuyến đi Kyoto của bạn thế nào?","京都{きょうと}への旅行{りょこう}はどうでしたか。"],
["tourist","khách du lịch","観光客{かんこうきゃく}","Many tourists visit the town in winter.","Nhiều khách du lịch đến thị trấn vào mùa đông.","冬{ふゆ}には多{おお}くの観光客{かんこうきゃく}がその町{まち}を訪{おとず}れます。"],
["e-mail","thư điện tử; email","Eメール","He sent me an e-mail last night.","Tối qua anh ấy đã gửi email cho tôi.","彼{かれ}は昨夜{さくや}、私{わたし}にメールを送{おく}りました。"],
["evening","buổi tối; chiều tối","夕方{ゆうがた}、晩{ばん}","I have tennis practice on Friday evening every week.","Tối thứ Sáu hằng tuần tôi luyện tập tennis.","私{わたし}は毎週{まいしゅう}金曜日{きんようび}の夕方{ゆうがた}にテニスの練習{れんしゅう}があります。"],
["weather","thời tiết","天気{てんき}","The weather was bad during the trip.","Thời tiết trong chuyến đi rất xấu.","旅行中{りょこうちゅう}は天気{てんき}が悪{わる}かったです。"]
]);
// The original tourist.mp3 recording is an abnormally short 5.6 KB clip.
// Keep the printed vocabulary unchanged; route WORD audio to a new TTS key.
const touristEntry=window.BOOK_2100_DATA.steps.find(step=>step.id===20)
  ?.entries.find(entry=>entry.en==="tourist");
if(touristEntry){
  touristEntry.wordAudio="Tourist.";
  touristEntry.wordAudioMinSeconds=0.55;
}
add(21,243,[
["green","màu xanh lá","緑{みどり}の、緑{みどり}","The boy with the green cap is my brother.","Cậu bé đội mũ xanh lá là em trai tôi.","緑色{みどりいろ}の帽子{ぼうし}をかぶった少年{しょうねん}は私{わたし}の弟{おとうと}です。"],
["white","màu trắng","白{しろ}い、白{しろ}","I bought a white T-shirt yesterday.","Hôm qua tôi đã mua áo thun trắng.","昨日{きのう}、白{しろ}いTシャツを買{か}いました。"],
["red","màu đỏ","赤{あか}い、赤{あか}","You must not write your names in red ink.","Bạn không được viết tên bằng mực đỏ.","赤{あか}いインクで名前{なまえ}を書{か}いてはいけません。"],
["black","màu đen","黒{くろ}い、黒{くろ}","I have a black dog.","Tôi có một chú chó màu đen.","私{わたし}は黒{くろ}い犬{いぬ}を飼{か}っています。"],
["blue","màu xanh dương","青{あお}い、青{あお}","She has beautiful blue eyes.","Cô ấy có đôi mắt xanh rất đẹp.","彼女{かのじょ}はきれいな青{あお}い目{め}をしています。"],
["brown","màu nâu","茶色{ちゃいろ}い、茶色{ちゃいろ}","I want brown shoes.","Tôi muốn một đôi giày nâu.","私{わたし}は茶色{ちゃいろ}い靴{くつ}が欲{ほ}しいです。"],
["some","một vài; một ít","いくつかの、いくらか","I had some bread and soup.","Tôi đã ăn một ít bánh mì và súp.","私{わたし}はパンとスープを少{すこ}し食{た}べました。"],
["many","nhiều (đếm được)","多{おお}くの","There were many people at that festival.","Có rất đông người ở lễ hội đó.","その祭{まつ}りには多{おお}くの人{ひと}がいました。"],
["every","mọi; mỗi","すべての、毎{まい}","Every student in my class studies hard.","Mọi học sinh trong lớp tôi đều học chăm chỉ.","私{わたし}のクラスの生徒{せいと}はみんな一生懸命{いっしょうけんめい}勉強{べんきょう}します。"],
["old","cũ; già; lâu năm","古{ふる}い、年{とし}をとった","My father likes to watch old movies.","Bố tôi thích xem những bộ phim cũ.","父{ちち}は古{ふる}い映画{えいが}を見{み}るのが好{す}きです。"],
["new","mới","新{あたら}しい","Your bicycle looks new.","Chiếc xe đạp của bạn trông mới.","あなたの自転車{じてんしゃ}は新{あたら}しく見{み}えます。"],
["other","khác; cái khác","ほかの","Are there any other problems?","Còn vấn đề nào khác không?","ほかに何{なに}か問題{もんだい}はありますか。"]
]);
add(22,255,[
["big","to; lớn","大{おお}きい","Yours is bigger than mine.","Của bạn lớn hơn của tôi.","あなたのものは私{わたし}のものより大{おお}きいです。"],
["small","nhỏ","小{ちい}さい","This shirt is too small for me.","Chiếc áo này quá nhỏ với tôi.","このシャツは私{わたし}には小{ちい}さすぎます。"],
["tall","cao; cao lớn","背{せ}が高{たか}い","He is the tallest player on the team.","Anh ấy là cầu thủ cao nhất đội.","彼{かれ}はチームで一番背{いちばんせ}が高{たか}い選手{せんしゅ}です。"],
["great","tuyệt vời; vĩ đại","すばらしい、偉大{いだい}な","I had a great time at the party.","Tôi đã rất vui tại bữa tiệc.","私{わたし}はパーティーで素晴{すば}らしい時間{じかん}を過{す}ごしました。"],
["last","cuối cùng; trước","最後{さいご}の、この前{まえ}の","This is the last question.","Đây là câu hỏi cuối cùng.","これが最後{さいご}の質問{しつもん}です。"],
["nice","tốt; đẹp; dễ chịu","すてきな、よい","What nice weather!","Thời tiết đẹp quá!","なんていい天気{てんき}なんでしょう！"],
["famous","nổi tiếng","有名{ゆうめい}な","She is a very famous artist in that country.","Cô ấy là nghệ sĩ rất nổi tiếng ở nước đó.","彼女{かのじょ}はその国{くに}でとても有名{ゆうめい}な芸術家{げいじゅつか}です。"],
["busy","bận","忙{いそが}しい","Are you busy this evening?","Tối nay bạn có bận không?","今夜{こんや}は忙{いそが}しいですか。"],
["tired","mệt mỏi","疲{つか}れた","I was very tired after the trip.","Sau chuyến đi tôi đã rất mệt.","旅行{りょこう}の後{あと}、私{わたし}はとても疲{つか}れました。"],
["delicious","ngon","とてもおいしい","This apple pie looks delicious.","Chiếc bánh táo này trông ngon quá.","このアップルパイはとてもおいしそうです。"],
["sweet","ngọt","甘{あま}い","People in those countries often drink sweet green tea.","Người ở những nước đó thường uống trà xanh ngọt.","それらの国{くに}の人{ひと}たちはよく甘{あま}い緑茶{りょくちゃ}を飲{の}みます。"],
["another","một cái khác; thêm một","別{べつ}の、もう一{ひと}つの","Let's talk about it another time.","Chúng ta nói chuyện này dịp khác nhé.","そのことはまた別{べつ}の機会{きかい}に話{はな}しましょう。"],
["all","tất cả; toàn bộ","すべての、全部{ぜんぶ}","I read all the books here.","Tôi đã đọc tất cả sách ở đây.","私{わたし}はここにある本{ほん}をすべて読{よ}みました。"]
]);
add(23,268,[
["any","bất kỳ; một chút nào","いくらかの、何{なに}かの","Do you have any good ideas?","Bạn có ý tưởng hay nào không?","何{なに}かいいアイデアはありますか。"],
["traditional","truyền thống","伝統的{でんとうてき}な","They are practicing traditional Japanese dance.","Họ đang luyện múa truyền thống Nhật Bản.","彼{かれ}らは日本{にほん}の伝統的{でんとうてき}な踊{おど}りを練習{れんしゅう}しています。"],
["hungry","đói bụng","空腹{くうふく}な","He was very hungry during the class.","Anh ấy rất đói trong giờ học.","彼{かれ}は授業中{じゅぎょうちゅう}、とてもお腹{なか}が空{す}いていました。"],
["sleepy","buồn ngủ","眠{ねむ}い","I felt sleepy and went to bed.","Tôi thấy buồn ngủ nên đi ngủ.","私{わたし}は眠{ねむ}くなったのでベッドに入{はい}りました。"],
["long","dài; lâu","長{なが}い","He lived there for a long time.","Anh ấy đã sống ở đó một thời gian dài.","彼{かれ}は長{なが}い間{あいだ}そこに住{す}んでいました。"],
["short","ngắn; thấp","短{みじか}い、背{せ}が低{ひく}い","She is now taking a short vacation.","Cô ấy hiện đang nghỉ ngắn ngày.","彼女{かのじょ}は今{いま}、短{みじか}い休暇{きゅうか}を取{と}っています。"],
["kind","tử tế; tốt bụng; loại","親切{しんせつ}な、種類{しゅるい}","She is always kind to older people.","Cô ấy luôn tử tế với người lớn tuổi.","彼女{かのじょ}はいつも年配{ねんぱい}の人{ひと}に親切{しんせつ}です。"],
["happy","vui vẻ; hạnh phúc","幸{しあわ}せな、うれしい","You look very happy today.","Hôm nay trông bạn rất vui.","今日{きょう}はとてもうれしそうですね。"],
["sad","buồn","悲{かな}しい","This is a book of sad stories about animals.","Đây là cuốn sách gồm những chuyện buồn về động vật.","これは動物{どうぶつ}についての悲{かな}しい物語{ものがたり}の本{ほん}です。"],
["wonderful","tuyệt vời","すばらしい","Thank you for the wonderful dinner.","Cảm ơn vì bữa tối tuyệt vời.","すばらしい夕食{ゆうしょく}をありがとうございました。"],
["hundred","một trăm","100、百{ひゃく}","There are about two hundred books in this room.","Trong phòng này có khoảng 200 quyển sách.","この部屋{へや}には約{やく}200冊{さつ}の本{ほん}があります。"],
["there","ở đó; tại đó","そこに、そこへ","They went to London and stayed there for a week.","Họ đến London và ở đó một tuần.","彼{かれ}らはロンドンへ行{い}き、そこで1週間{しゅうかん}滞在{たいざい}しました。"]
]);
})();