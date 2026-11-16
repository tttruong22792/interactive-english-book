/* STEP 13–18 · photographed source. Japanese sentences may be meaning-preserving restorations. */
(function(){
"use strict";
const add=(id,start,rows)=>{const entries=rows.map((r,i)=>({n:start+i,en:r[0],ipa:r[6]||"",vi:r[1],ja:r[2],extra:r[7]||[],sentence:r[3],sentenceVi:r[4],sentenceJa:r[5],sentenceJaSource:"reconstructed"}));window.BOOK_2100_DATA.steps.push({id,start,end:start+entries.length-1,pages:(28+2*id)+"–"+(29+2*id),entries});};
add(13,147,[
["stadium","sân vận động","競技場{きょうぎじょう}、スタジアム","We walked from the station to the baseball stadium.","Chúng tôi đi bộ từ ga đến sân bóng chày.","私{わたし}たちは駅{えき}から野球場{やきゅうじょう}まで歩{ある}きました。"],
["firework","pháo hoa","花火{はなび}","We watched the fireworks last night.","Tối qua chúng tôi đã xem pháo hoa.","私{わたし}たちは昨夜{さくや}、花火{はなび}を見{み}ました。"],
["bed","giường","ベッド","My father goes to bed at ten every night.","Bố tôi đi ngủ lúc 10 giờ mỗi tối.","父{ちち}は毎晩{まいばん}10時{じ}に寝{ね}ます。"],
["vacation","kỳ nghỉ","休暇{きゅうか}","I visited my friend in Toyama during summer vacation.","Tôi đã đến thăm bạn ở Toyama trong kỳ nghỉ hè.","私{わたし}は夏休{なつやす}みに富山{とやま}の友達{ともだち}を訪{たず}ねました。"],
["bread","bánh mì","パン","I ate bread for lunch.","Tôi đã ăn bánh mì vào bữa trưa.","昼食{ちゅうしょく}にパンを食{た}べました。"],
["pie","bánh nướng (pie)","パイ","She made an apple pie for us.","Cô ấy làm một chiếc bánh táo cho chúng tôi.","彼女{かのじょ}は私{わたし}たちにアップルパイを作{つく}ってくれました。"],
["shrine","đền Thần đạo","神社{じんじゃ}","Many tourists visit this shrine.","Nhiều khách du lịch đến thăm ngôi đền này.","多{おお}くの観光客{かんこうきゃく}がこの神社{じんじゃ}を訪{おとず}れます。"],
["temple","chùa; đền thờ","寺院{じいん}、寺{てら}","There are a lot of temples and shrines in this city.","Thành phố này có rất nhiều chùa và đền.","この町{まち}にはたくさんのお寺{てら}や神社{じんじゃ}があります。"],
["newspaper","báo; tờ báo","新聞{しんぶん}","He reads the student newspaper every week.","Anh ấy đọc báo học sinh hằng tuần.","彼{かれ}は毎週{まいしゅう}学生新聞{がくせいしんぶん}を読{よ}みます。"],
["star","ngôi sao; người nổi tiếng","星{ほし}、スター","The stars are very beautiful in winter.","Các vì sao vào mùa đông rất đẹp.","冬{ふゆ}の星{ほし}はとてもきれいです。"],
["juice","nước ép","ジュース","A tomato juice and two orange juices, please.","Cho tôi một nước ép cà chua và hai nước cam.","トマトジュースを1つとオレンジジュースを2つお願{ねが}いします。"],
["salad","món sa lát","サラダ","He is making potato salad.","Anh ấy đang làm món sa lát khoai tây.","彼{かれ}はポテトサラダを作{つく}っています。"]
]);
add(14,159,[
["noodle","mì; sợi mì","めん類{るい}","They don't eat noodles with rice.","Họ không ăn mì cùng với cơm.","彼{かれ}らはご飯{はん}と一緒{いっしょ}に麺{めん}を食{た}べません。"],
["soup","súp; canh","スープ","I ate corn soup first.","Tôi ăn súp ngô trước.","私{わたし}は最初{さいしょ}にコーンスープを飲{の}みました。"],
["bicycle","xe đạp","自転車{じてんしゃ}","Many students at our school come to school by bicycle.","Nhiều học sinh trường tôi đi học bằng xe đạp.","私{わたし}たちの学校{がっこう}では多{おお}くの生徒{せいと}が自転車{じてんしゃ}で通学{つうがく}しています。"],
["artist","nghệ sĩ; họa sĩ","芸術家{げいじゅつか}、画家{がか}","These are works by a famous artist.","Đây là những tác phẩm của một nghệ sĩ nổi tiếng.","これらは有名{ゆうめい}な芸術家{げいじゅつか}の作品{さくひん}です。"],
["hat","mũ","帽子{ぼうし}","I bought this hat for my birthday.","Tôi mua chiếc mũ này nhân dịp sinh nhật.","誕生日{たんじょうび}にこの帽子{ぼうし}を買{か}いました。"],
["shirt","áo sơ mi; áo","シャツ","Can I try on this shirt?","Tôi có thể thử chiếc áo này không?","このシャツを試着{しちゃく}してもいいですか。"],
["hero","anh hùng","英雄{えいゆう}、ヒーロー","He is a hero of the country.","Anh ấy là một vị anh hùng của đất nước.","彼{かれ}はその国{くに}の英雄{えいゆう}です。"],
["football","bóng bầu dục; bóng đá","フットボール","There is a big football game in America next Sunday.","Chủ nhật tới có một trận bóng bầu dục lớn ở Mỹ.","次{つぎ}の日曜日{にちようび}にアメリカで大{おお}きなフットボールの試合{しあい}があります。"],
["jet","máy bay phản lực","ジェット機{き}","He took a jet to London.","Anh ấy đã đi máy bay phản lực tới London.","彼{かれ}はジェット機{き}でロンドンへ行{い}きました。"],
["eye","mắt","目{め}","Close your eyes.","Hãy nhắm mắt lại.","目{め}を閉{と}じてください。"],
["change","đổi; thay đổi","変{か}える、変{か}わる","We changed trains at Nagoya Station.","Chúng tôi đổi tàu tại ga Nagoya.","私{わたし}たちは名古屋駅{なごやえき}で電車{でんしゃ}を乗{の}り換{か}えました。"],
["give","cho; tặng","与{あた}える、あげる","My brother gave me a cap.","Anh trai tôi tặng tôi một chiếc mũ.","兄{あに}が私{わたし}に帽子{ぼうし}をくれました。"]
]);
add(15,171,[
["teach","dạy; giảng dạy","教{おし}える","She teaches them Japanese on weekends.","Cô ấy dạy họ tiếng Nhật vào cuối tuần.","彼女{かのじょ}は週末{しゅうまつ}に彼{かれ}らに日本語{にほんご}を教{おし}えています。"],
["tell","kể; nói cho biết","話{はな}す、伝{つた}える","I told him about my family.","Tôi kể cho anh ấy nghe về gia đình mình.","私{わたし}は彼{かれ}に家族{かぞく}について話{はな}しました。"],
["show","cho xem; chỉ ra","見{み}せる、示{しめ}す","He showed me some pictures.","Anh ấy cho tôi xem vài bức tranh.","彼{かれ}は私{わたし}に何枚{なんまい}かの写真{しゃしん}を見{み}せました。"],
["bring","mang đến; đem lại","持{も}ってくる","They brought us some food.","Họ đã mang một ít thức ăn đến cho chúng tôi.","彼{かれ}らは私{わたし}たちに食{た}べ物{もの}を持{も}ってきてくれました。"],
["find","tìm thấy","見{み}つける","Where did you find my bag?","Bạn tìm thấy túi của tôi ở đâu?","私{わたし}のバッグをどこで見{み}つけましたか。"],
["stay","ở lại; lưu trú","滞在{たいざい}する","On Saturday, we stayed with my grandparents.","Thứ Bảy chúng tôi đã ở nhà ông bà.","土曜日{どようび}、私{わたし}たちは祖父母{そふぼ}の家{いえ}に泊{と}まりました。"],
["feel","cảm thấy","感{かん}じる","When do you feel happy?","Khi nào bạn cảm thấy hạnh phúc?","あなたはいつ幸{しあわ}せだと感{かん}じますか。"],
["thank","cảm ơn","感謝{かんしゃ}する","Thank you for your help.","Cảm ơn bạn đã giúp đỡ.","手伝{てつだ}ってくれてありがとうございます。"],
["choose","chọn; lựa chọn","選{えら}ぶ","Which color did you choose?","Bạn đã chọn màu nào?","あなたはどの色{いろ}を選{えら}びましたか。"],
["sound","nghe có vẻ; âm thanh","聞{き}こえる、音{おと}","This idea sounds good to me.","Tôi thấy ý tưởng này có vẻ hay.","このアイデアは私{わたし}には良{よ}さそうに聞{き}こえます。"],
["join","tham gia; gia nhập","加{くわ}わる、入{はい}る","I joined the newspaper club.","Tôi đã tham gia câu lạc bộ báo chí.","私{わたし}は新聞部{しんぶんぶ}に入{はい}りました。"],
["meet","gặp gỡ","会{あ}う、出会{であ}う","I met her in the library.","Tôi đã gặp cô ấy ở thư viện.","私{わたし}は図書館{としょかん}で彼女{かのじょ}に会{あ}いました。"]
]);
add(16,183,[
["grow","phát triển; lớn lên","成長{せいちょう}する、育{そだ}てる","Children grow very quickly.","Trẻ em lớn lên rất nhanh.","子{こ}どもたちはとても早{はや}く成長{せいちょう}します。"],
["arrive","đến nơi","到着{とうちゃく}する","He arrived at Hakata Station at five.","Anh ấy đến ga Hakata lúc năm giờ.","彼{かれ}は5時{じ}に博多駅{はかたえき}に到着{とうちゃく}しました。"],
["send","gửi","送{おく}る","I sent a letter to my friend in Canada.","Tôi đã gửi thư cho người bạn ở Canada.","カナダにいる友達{ともだち}に手紙{てがみ}を送{おく}りました。"],
["happen","xảy ra","起{お}こる","What happened to her?","Chuyện gì đã xảy ra với cô ấy?","彼女{かのじょ}に何{なに}が起{お}きたのですか。"],
["follow","đi theo; tuân theo","後{あと}についていく、従{したが}う","That dog is following us.","Con chó đó đang đi theo chúng tôi.","あの犬{いぬ}は私{わたし}たちについてきています。"],
["hold","cầm; giữ; ôm","持{も}つ、抱{かか}える","He was holding a large box.","Anh ấy đang ôm một chiếc hộp lớn.","彼{かれ}は大{おお}きな箱{はこ}を抱{かか}えていました。"],
["relax","thư giãn","くつろぐ","He relaxed in his chair.","Anh ấy thư giãn trên ghế.","彼{かれ}は椅子{いす}に座{すわ}ってくつろぎました。"],
["perform","biểu diễn; thực hiện","演{えん}じる","They performed at the dance festival last night.","Họ biểu diễn tại lễ hội nhảy múa tối qua.","彼{かれ}らは昨夜{さくや}のダンスフェスティバルで演技{えんぎ}をしました。"],
["need","cần; nhu cầu","必要{ひつよう}とする、必要{ひつよう}","He needs your help.","Anh ấy cần sự giúp đỡ của bạn.","彼{かれ}はあなたの助{たす}けを必要{ひつよう}としています。"],
["start","bắt đầu","始{はじ}める、始{はじ}まる","The TV drama starts at eight.","Phim truyền hình bắt đầu lúc tám giờ.","そのテレビドラマは8時{じ}に始{はじ}まります。"],
["become","trở thành","なる","She became a Japanese teacher.","Cô ấy đã trở thành giáo viên tiếng Nhật.","彼女{かのじょ}は日本語{にほんご}の先生{せんせい}になりました。"],
["hope","hy vọng; mong đợi","望{のぞ}む、願{ねが}い","I hope that you can join us.","Tôi hy vọng bạn có thể tham gia cùng chúng tôi.","あなたが私{わたし}たちに参加{さんか}してくれることを願{ねが}っています。"]
]);
add(17,195,[
["worry","lo lắng","心配{しんぱい}する","I sometimes worry about him.","Đôi lúc tôi lo lắng cho anh ấy.","私{わたし}は時々{ときどき}彼{かれ}のことが心配{しんぱい}です。"],
["catch","bắt; chụp; đón kịp","捕{つか}まえる、間{ま}に合{あ}う","He caught the ball with one hand.","Anh ấy bắt bóng bằng một tay.","彼{かれ}は片手{かたて}でボールを捕{と}りました。"],
["set","đặt; sắp xếp; bộ","置{お}く、セット","Please set the dishes on the table.","Xin hãy xếp bát đĩa lên bàn.","テーブルに皿{さら}を並{なら}べてください。"],
["ski","trượt tuyết","スキーをする","We went skiing in Hokkaido last weekend.","Cuối tuần trước chúng tôi đã đi trượt tuyết ở Hokkaido.","私{わたし}たちは先週末{せんしゅうまつ}、北海道{ほっかいどう}へスキーに行{い}きました。"],
["skate","trượt băng; trượt patin","スケートをする","I learned how to skate from my father.","Tôi học trượt băng từ bố.","私{わたし}は父{ちち}からスケートの仕方{しかた}を習{なら}いました。"],
["speak","nói một ngôn ngữ; phát biểu","話{はな}す","Do they speak English?","Họ có nói tiếng Anh không?","彼{かれ}らは英語{えいご}を話{はな}しますか。"],
["like","thích; giống như","好{す}き、～のような","I like noodles very much.","Tôi rất thích mì.","私{わたし}は麺類{めんるい}が大好{だいす}きです。"],
["live","sống; cư trú","住{す}む、生{い}きる","My sister lives in America.","Chị/em gái tôi sống ở Mỹ.","姉{あね}はアメリカに住{す}んでいます。"],
["cook","nấu ăn; đầu bếp","料理{りょうり}する","He is cooking dinner in the kitchen.","Anh ấy đang nấu bữa tối trong bếp.","彼{かれ}は台所{だいどころ}で夕食{ゆうしょく}を作{つく}っています。"],
["open","mở; đang mở cửa","開{あ}ける、開{ひら}く","Can I open this box?","Tôi có thể mở hộp này không?","この箱{はこ}を開{あ}けてもいいですか。"],
["do","làm; thực hiện","する、行{おこな}う","I didn't do my homework yesterday.","Hôm qua tôi không làm bài tập về nhà.","私{わたし}は昨日{きのう}宿題{しゅくだい}をしませんでした。"],
["be","là; ở; trở thành","～である、いる","She wants to be a movie star.","Cô ấy muốn trở thành ngôi sao điện ảnh.","彼女{かのじょ}は映画{えいが}スターになりたがっています。"]
]);
add(18,207,[
["can","có thể; được phép","～できる","I can sing this song in English.","Tôi có thể hát bài này bằng tiếng Anh.","私{わたし}はこの歌{うた}を英語{えいご}で歌{うた}えます。"],
["will","sẽ; dự định","～するだろう","The team will win the game.","Đội đó sẽ thắng trận đấu.","そのチームは試合{しあい}に勝{か}つでしょう。"],
["must","phải; chắc chắn","～しなければならない","I must leave now.","Tôi phải đi bây giờ.","私{わたし}はもう行{い}かなければなりません。"],
["may","có thể; xin phép","～してもよい","A: May I sit here? B: Yes, of course.","A: Tôi ngồi đây được không? B: Tất nhiên rồi.","A：ここに座{すわ}ってもいいですか。B：はい、もちろんです。"],
["word","từ; lời nói","単語{たんご}、言葉{ことば}","I don't know these English words.","Tôi không biết những từ tiếng Anh này.","私{わたし}はこれらの英単語{えいたんご}を知{し}りません。"],
["language","ngôn ngữ","言語{げんご}","She can speak four languages.","Cô ấy nói được bốn thứ tiếng.","彼女{かのじょ}は4つの言語{げんご}を話{はな}せます。"],
["English","tiếng Anh; người Anh","英語{えいご}","I wrote a letter in English.","Tôi đã viết một lá thư bằng tiếng Anh.","私{わたし}は英語{えいご}で手紙{てがみ}を書{か}きました。"],
["Japanese","tiếng Nhật; người Nhật","日本語{にほんご}、日本人{にほんじん}","He speaks very good Japanese.","Anh ấy nói tiếng Nhật rất giỏi.","彼{かれ}は日本語{にほんご}をとても上手{じょうず}に話{はな}します。"],
["thing","đồ vật; việc; điều","物{もの}、こと","I want to try new things this year.","Tôi muốn thử những điều mới trong năm nay.","今年{ことし}は新{あたら}しいことに挑戦{ちょうせん}したいです。"],
["problem","vấn đề; rắc rối","問題{もんだい}","She had a big problem.","Cô ấy gặp phải một vấn đề lớn.","彼女{かのじょ}は大{おお}きな問題{もんだい}を抱{かか}えていました。"],
["question","câu hỏi","質問{しつもん}","Do you have any questions about this?","Bạn có câu hỏi nào về điều này không?","これについて何{なに}か質問{しつもん}はありますか。"],
["way","con đường; cách","道{みち}、方法{ほうほう}","Could you tell me the way to the museum?","Bạn chỉ giúp tôi đường đến bảo tàng được không?","博物館{はくぶつかん}への道{みち}を教{おし}えていただけますか。"]
]);
})();