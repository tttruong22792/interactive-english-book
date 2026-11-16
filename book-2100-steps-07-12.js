/* Level 1 STEPs 7–12. English source text checked against photographed pages; Japanese renderings supplied where needed. */
(function(){
"use strict";
const add=(id,start,rows)=>{
 const entries=rows.map((r,i)=>({n:start+i,en:r[0],ipa:r[6]||"",vi:r[1],ja:r[2],extra:r[7]||[],
 sentence:r[3],sentenceVi:r[4],sentenceJa:r[5],sentenceJaSource:"reconstructed"}));
 window.BOOK_2100_DATA.steps.push({id,start,end:start+entries.length-1,pages:(28+2*id)+"–"+(29+2*id),entries});
};
add(7,74,[
["eat","ăn","食{た}べる","They don't eat meat or fish.","Họ không ăn thịt hay cá.","彼{かれ}らは肉{にく}も魚{さかな}も食{た}べません。"],
["get","nhận được; lấy; đến","得{え}る、到着{とうちゃく}する","I got two tickets for the concert.","Tôi đã có được hai vé xem hòa nhạc.","私{わたし}はそのコンサートのチケットを2枚{まい}手{て}に入{い}れました。"],
["take","mang; đưa; đi bằng; nhận","持{も}っていく、乗{の}る","We took a taxi to the hospital.","Chúng tôi đi taxi đến bệnh viện.","私{わたし}たちはタクシーで病院{びょういん}へ行{い}きました。"],
["try","thử; cố gắng","試{ため}す、試{こころ}み","He tried a new racket.","Anh ấy đã thử một cây vợt mới.","彼{かれ}は新{あたら}しいラケットを試{ため}しました。"],
["listen","nghe (chủ động)","聞{き}く","My father listens to the radio every morning.","Bố tôi nghe đài mỗi buổi sáng.","父{ちち}は毎朝{まいあさ}ラジオを聞{き}きます。"],
["hear","nghe thấy","聞{き}こえる、耳{みみ}にする","I heard the sound of rain last night.","Đêm qua tôi nghe thấy tiếng mưa.","昨夜{さくや}、雨{あめ}の音{おと}が聞{き}こえました。"],
["visit","thăm; đến thăm","訪問{ほうもん}する","I visit my grandparents every summer.","Mùa hè nào tôi cũng đến thăm ông bà.","私{わたし}は毎年{まいとし}夏{なつ}に祖父母{そふぼ}を訪{たず}ねます。"],
["wait","đợi; chờ","待{ま}つ","We waited for him for an hour.","Chúng tôi đã chờ anh ấy một tiếng.","私{わたし}たちは彼{かれ}を1時間{じかん}待{ま}ちました。"],
["win","thắng; chiến thắng","勝{か}つ","How can we win the next game?","Làm thế nào để chúng ta thắng trận tiếp theo?","どうすれば次{つぎ}の試合{しあい}に勝{か}てますか。"],
["fall","rơi; ngã; mùa thu","落{お}ちる、倒{たお}れる、秋{あき}","My eraser fell off my desk during the test.","Cục tẩy của tôi rơi khỏi bàn trong lúc kiểm tra.","試験中{しけんちゅう}、消{け}しゴムが机{つくえ}から落{お}ちました。"],
["sing","hát","歌{うた}う","My father can still sing his high school song.","Bố tôi vẫn có thể hát bài hát thời trung học của ông.","父{ちち}は今{いま}でも高校時代{こうこうじだい}の校歌{こうか}を歌{うた}えます。"],
["keep","giữ; bảo quản; tiếp tục","保管{ほかん}する、保{たも}つ","Keep it in a cool place.","Hãy giữ nó ở nơi mát mẻ.","涼{すず}しい場所{ばしょ}に保管{ほかん}してください。"]
]);
add(8,86,[
["draw","vẽ; kéo","描{えが}く、引{ひ}く","He often draws pictures of animals.","Anh ấy thường vẽ tranh về động vật.","彼{かれ}はよく動物{どうぶつ}の絵{え}を描{か}きます。"],
["write","viết","書{か}く","I wrote a letter to my friend in China.","Tôi đã viết thư cho người bạn ở Trung Quốc.","中国{ちゅうごく}にいる友達{ともだち}に手紙{てがみ}を書{か}きました。"],
["stop","dừng; trạm dừng","止{と}まる、止{と}める","This train doesn't stop at Tokyo Station.","Chuyến tàu này không dừng ở ga Tokyo.","この電車{でんしゃ}は東京駅{とうきょうえき}には止{と}まりません。"],
["put","đặt; để","置{お}く","She put her bag on her bed.","Cô ấy đã đặt túi lên giường.","彼女{かのじょ}はかばんをベッドの上{うえ}に置{お}きました。"],
["study","học; nghiên cứu","勉強{べんきょう}する、研究{けんきゅう}","I was studying science then.","Lúc đó tôi đang học khoa học.","私{わたし}はその時{とき}、理科{りか}を勉強{べんきょう}していました。"],
["learn","học; tiếp thu","学{まな}ぶ、覚{おぼ}える","We are learning the history of the town.","Chúng tôi đang học lịch sử của thị trấn.","私{わたし}たちは町{まち}の歴史{れきし}を学{まな}んでいます。"],
["walk","đi bộ; đi dạo","歩{ある}く、散歩{さんぽ}","I usually walk to school.","Tôi thường đi bộ đến trường.","私{わたし}は普段{ふだん}歩{ある}いて学校{がっこう}に通{かよ}います。"],
["run","chạy; vận hành","走{はし}る","They ran to the bus stop.","Họ chạy đến trạm xe buýt.","彼{かれ}らはバス停{てい}まで走{はし}りました。"],
["buy","mua","買{か}う","He bought flowers for his mother.","Anh ấy mua hoa cho mẹ.","彼{かれ}は母{はは}のために花{はな}を買{か}いました。"],
["read","đọc","読{よ}む","She reads ten books a month.","Cô ấy đọc mười cuốn sách mỗi tháng.","彼女{かのじょ}は毎月{まいつき}10冊{さつ}の本{ほん}を読{よ}みます。"],
["practice","luyện tập; thực hành","練習{れんしゅう}する","When do you practice the piano?","Bạn luyện đàn piano lúc nào?","あなたはいつピアノを練習{れんしゅう}しますか。"],
["leave","rời đi; để quên","出発{しゅっぱつ}する、去{さ}る","What time do you leave home?","Bạn rời nhà lúc mấy giờ?","あなたは何時{なんじ}に家{いえ}を出{で}ますか。"]
]);
add(9,98,[
["drink","uống; đồ uống","飲{の}む、飲{の}み物{もの}","I drank a lot of water yesterday.","Hôm qua tôi uống rất nhiều nước.","昨日{きのう}、私{わたし}は水{みず}をたくさん飲{の}みました。"],
["turn","quay; rẽ; lượt","向{む}きを変{か}える、曲{ま}がる","He turned and looked at us.","Anh ấy quay lại và nhìn chúng tôi.","彼{かれ}は振{ふ}り返{かえ}って私{わたし}たちを見{み}ました。"],
["check","kiểm tra; đối chiếu","確認{かくにん}する、点検{てんけん}","Can you check my answers?","Bạn có thể kiểm tra đáp án giúp tôi không?","私{わたし}の答{こた}えを確認{かくにん}してもらえますか。"],
["ride","cưỡi; đi xe","乗{の}る","My mother rides her bicycle to the office.","Mẹ tôi đi xe đạp đến công ty.","母{はは}は自転車{じてんしゃ}で会社{かいしゃ}に通{かよ}います。"],
["swim","bơi","泳{およ}ぐ","We swam in the sea this afternoon.","Chiều nay chúng tôi đã bơi ở biển.","私{わたし}たちは今日{きょう}の午後{ごご}、海{うみ}で泳{およ}ぎました。"],
["wash","rửa; giặt","洗{あら}う","Did you wash your hands?","Bạn đã rửa tay chưa?","手{て}を洗{あら}いましたか。"],
["dance","nhảy; khiêu vũ","踊{おど}る、ダンス","They were dancing to the song.","Họ đang nhảy theo bài hát.","彼{かれ}らはその曲{きょく}に合{あ}わせて踊{おど}っていました。"],
["jump","nhảy; bật lên","跳{と}ぶ、跳{と}びはねる","Don't jump into the pool.","Đừng nhảy xuống hồ bơi.","プールに飛{と}び込{こ}まないでください。"],
["help","giúp đỡ","手伝{てつだ}う、助{たす}ける","I helped my sister with her homework.","Tôi đã giúp chị/em gái làm bài tập về nhà.","私{わたし}は妹{いもうと}の宿題{しゅくだい}を手伝{てつだ}いました。"],
["say","nói; phát biểu","言{い}う","He said, \"Nice to meet you.\"","Anh ấy nói: 'Rất vui được gặp bạn.'","彼{かれ}は「はじめまして」と言{い}いました。"],
["work","làm việc; công việc","働{はたら}く、仕事{しごと}","They work from nine to five.","Họ làm việc từ chín giờ đến năm giờ.","彼{かれ}らは9時{じ}から5時{じ}まで働{はたら}きます。"],
["bus","xe buýt","バス","We went to the park by bus.","Chúng tôi đi xe buýt đến công viên.","私{わたし}たちはバスで公園{こうえん}に行{い}きました。"]
]);
add(10,110,[
["club","câu lạc bộ","クラブ、部{ぶ}","Our club practices after school every day.","Câu lạc bộ chúng tôi luyện tập hằng ngày sau giờ học.","私{わたし}たちのクラブは毎日{まいにち}放課後{ほうかご}に練習{れんしゅう}します。"],
["museum","bảo tàng; viện mỹ thuật","博物館{はくぶつかん}、美術館{びじゅつかん}","He visited some museums in France.","Anh ấy đã thăm vài bảo tàng ở Pháp.","彼{かれ}はフランスでいくつかの博物館{はくぶつかん}を訪{おとず}れました。"],
["shopping","việc mua sắm","買{か}い物{もの}","I always carry my own shopping bag.","Tôi luôn mang túi mua sắm của mình.","私{わたし}はいつも自分{じぶん}の買{か}い物{もの}バッグを持{も}っていきます。"],
["library","thư viện","図書館{としょかん}、図書室{としょしつ}","Our city has about twenty libraries.","Thành phố chúng tôi có khoảng hai mươi thư viện.","私{わたし}たちの町{まち}には約{やく}20の図書館{としょかん}があります。"],
["apple","quả táo","リンゴ","I ate an apple for lunch.","Tôi ăn một quả táo vào bữa trưa.","私{わたし}は昼食{ちゅうしょく}にリンゴを一{ひと}つ食{た}べました。"],
["box","hộp; thùng","箱{はこ}","I keep my old toys in these boxes.","Tôi cất đồ chơi cũ trong những chiếc hộp này.","古{ふる}いおもちゃをこれらの箱{はこ}に保管{ほかん}しています。"],
["ball","quả bóng","ボール、球{たま}","I can't catch the ball well.","Tôi không bắt bóng giỏi.","私{わたし}はうまくボールを捕{と}れません。"],
["subject","môn học; chủ đề","教科{きょうか}、主題{しゅだい}","My favorite subject is English.","Môn học yêu thích của tôi là tiếng Anh.","私{わたし}の一番好{いちばんす}きな教科{きょうか}は英語{えいご}です。"],
["math","toán học","数学{すうがく}","I have a math class today.","Hôm nay tôi có tiết toán.","私{わたし}は今日{きょう}、数学{すうがく}の授業{じゅぎょう}があります。"],
["science","khoa học; môn khoa học","理科{りか}、科学{かがく}","He is good at science.","Anh ấy giỏi môn khoa học.","彼{かれ}は理科{りか}が得意{とくい}です。"],
["art","nghệ thuật; mỹ thuật","芸術{げいじゅつ}、美術{びじゅつ}","They are talking about Japanese art.","Họ đang nói chuyện về nghệ thuật Nhật Bản.","彼{かれ}らは日本{にほん}の美術{びじゅつ}について話{はな}しています。"],
["cat","con mèo","ネコ","My cat is sleeping under the table.","Mèo của tôi đang ngủ dưới bàn.","うちの猫{ねこ}はテーブルの下{した}で寝{ね}ています。"]
]);
add(11,122,[
["penguin","chim cánh cụt","ペンギン","The penguins were walking around in the zoo.","Những con chim cánh cụt đang đi lại trong vườn thú.","ペンギンたちは動物園{どうぶつえん}で歩{ある}き回{まわ}っていました。"],
["gym","nhà thể chất; phòng tập","体育館{たいいくかん}、スポーツジム","I have a volleyball game in our school gym tomorrow.","Ngày mai tôi có trận bóng chuyền tại nhà thể chất của trường.","明日{あした}、学校{がっこう}の体育館{たいいくかん}でバレーボールの試合{しあい}があります。"],
["bath","việc tắm; bồn tắm","入浴{にゅうよく}、風呂{ふろ}","I took a bath at around nine yesterday.","Hôm qua tôi tắm vào khoảng chín giờ.","昨日{きのう}は9時{じ}ごろお風呂{ふろ}に入{はい}りました。"],
["window","cửa sổ","窓{まど}","Can you open the window?","Bạn mở cửa sổ giúp tôi được không?","窓{まど}を開{あ}けてくれますか。"],
["snack","đồ ăn nhẹ; bữa phụ","軽食{けいしょく}、おやつ","I had a snack in the afternoon.","Buổi chiều tôi đã ăn nhẹ.","私{わたし}は午後{ごご}におやつを食{た}べました。"],
["ink","mực viết","インク","He is writing a letter in ink.","Anh ấy đang viết thư bằng mực.","彼{かれ}はインクで手紙{てがみ}を書{か}いています。"],
["king","vua","王{おう}","The king is still young.","Vị vua đó vẫn còn trẻ.","その王{おう}はまだ若{わか}いです。"],
["queen","nữ hoàng","女王{じょおう}","They love their country's queen.","Họ yêu quý nữ hoàng của đất nước mình.","彼{かれ}らは自国{じこく}の女王{じょおう}を愛{あい}しています。"],
["shoe","giày","靴{くつ}","Take off your shoes here, please.","Vui lòng cởi giày ở đây.","ここで靴{くつ}を脱{ぬ}いでください。"],
["flower","hoa","花{はな}、草花{くさばな}","You can see many flowers in the park in spring.","Vào mùa xuân bạn có thể thấy nhiều hoa ở công viên.","春{はる}には公園{こうえん}で多{おお}くの花{はな}が見{み}られます。"],
["tree","cây","木{き}","There is an apple tree in our garden.","Có một cây táo trong vườn nhà chúng tôi.","うちの庭{にわ}にはリンゴの木{き}があります。"],
["station","nhà ga; trạm","駅{えき}","See you at the station at five.","Hẹn gặp bạn lúc năm giờ ở nhà ga.","5時{じ}に駅{えき}で会{あ}いましょう。"],
["computer","máy tính","コンピューター","My brother uses an old computer.","Anh trai tôi dùng một chiếc máy tính cũ.","兄{あに}は古{ふる}いコンピューターを使{つか}っています。"]
]);
add(12,135,[
["girl","bé gái; cô gái","少女{しょうじょ}","The young girls were practicing dancing this morning.","Sáng nay các bé gái đang tập nhảy.","その若{わか}い女{おんな}の子{こ}たちは今朝{けさ}ダンスの練習{れんしゅう}をしていました。"],
["boy","cậu bé","少年{しょうねん}","The little boy often helps his mother.","Cậu bé thường giúp mẹ.","その小{ちい}さな男{おとこ}の子{こ}はよくお母{かあ}さんを手伝{てつだ}います。"],
["street","đường phố","通{とお}り","The trees on this street are very beautiful in the fall.","Những hàng cây trên con phố này rất đẹp vào mùa thu.","この通{とお}りの木{き}は秋{あき}になるととてもきれいです。"],
["hospital","bệnh viện","病院{びょういん}","He is in the hospital now.","Hiện giờ anh ấy đang nằm viện.","彼{かれ}は今{いま}、入院{にゅういん}しています。"],
["doctor","bác sĩ","医者{いしゃ}、医師{いし}","I saw my doctor yesterday.","Hôm qua tôi đã gặp bác sĩ.","私{わたし}は昨日{きのう}、医者{いしゃ}に診{み}てもらいました。"],
["mountain","núi","山{やま}","He climbs that mountain every year.","Anh ấy leo ngọn núi đó mỗi năm.","彼{かれ}は毎年{まいとし}その山{やま}に登{のぼ}ります。"],
["sea","biển","海{うみ}","They are swimming in the sea now.","Bây giờ họ đang bơi ở biển.","彼{かれ}らは今{いま}、海{うみ}で泳{およ}いでいます。"],
["table","cái bàn","テーブル","Can you put it on the table?","Bạn có thể đặt nó lên bàn không?","それをテーブルの上{うえ}に置{お}いてくれますか。"],
["desk","bàn học; bàn làm việc","机{つくえ}","I was reading at my desk last night.","Tối qua tôi đang đọc sách tại bàn học.","昨夜{さくや}、私{わたし}は机{つくえ}で本{ほん}を読{よ}んでいました。"],
["card","thẻ; tấm thiệp; lá bài","カード、はがき","Write your name on this card.","Hãy viết tên bạn lên tấm thẻ này.","このカードに名前{なまえ}を書{か}いてください。"],
["classroom","phòng học","教室{きょうしつ}","You can't eat snacks in the classroom.","Bạn không được ăn vặt trong lớp học.","教室{きょうしつ}でおやつを食{た}べてはいけません。"],
["dish","đĩa; món ăn","皿{さら}、料理{りょうり}","Wash the dishes. It's your turn today.","Hãy rửa bát đĩa đi. Hôm nay đến lượt bạn.","皿{さら}を洗{あら}ってね。今日{きょう}はあなたの番{ばん}だよ。"]
]);
})();