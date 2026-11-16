/* LEVEL 1 · STEPs 30–33. Last word is #400 before. English exact from photographed source; translated Japanese marked. */
(function(){
"use strict";
const add=(id,start,rows)=>{const entries=rows.map((r,i)=>({n:start+i,en:r[0],ipa:r[6]||"",vi:r[1],ja:r[2],extra:r[7]||[],sentence:r[3],sentenceVi:r[4],sentenceJa:r[5],sentenceJaSource:"reconstructed"}));window.BOOK_2100_DATA.steps.push({id,start,end:start+entries.length-1,pages:(28+2*id)+"–"+(29+2*id),entries});};
add(30,353,[
["favorite","yêu thích; ưa thích","お気{き}に入{い}りの、大好{だいす}きな","Blue is my favorite color.","Xanh dương là màu tôi thích nhất.","青{あお}は私{わたし}の大好{だいす}きな色{いろ}です。"],
["such","như thế; đến mức đó","そのような","Did you really finish your homework in such a short time?","Bạn thực sự đã làm xong bài tập chỉ trong thời gian ngắn như thế sao?","あなたは本当{ほんとう}にそんな短{みじか}い時間{じかん}で宿題{しゅくだい}を終{お}えたのですか。"],
["local","địa phương; tại chỗ","地元{じもと}の、その土地{とち}の","We enjoyed the local food there.","Chúng tôi đã thưởng thức các món ăn địa phương ở đó.","私{わたし}たちはそこで地元{じもと}の料理{りょうり}を楽{たの}しみました。"],
["true","đúng sự thật; có thật","本当{ほんとう}の、真実{しんじつ}の","This is a true story.","Đây là một câu chuyện có thật.","これは本当{ほんとう}の話{はなし}です。"],
["useful","hữu ích; có ích","役{やく}に立{た}つ","This book is very useful for me.","Cuốn sách này rất hữu ích với tôi.","この本{ほん}は私{わたし}にとってとても役{やく}に立{た}ちます。"],
["large","lớn; rộng","大{おお}きい、広{ひろ}い","Takayama is the largest city in Japan.","Takayama là thành phố có diện tích lớn nhất Nhật Bản.","高山{たかやま}は日本{にほん}で最{もっと}も面積{めんせき}の大{おお}きな市{し}です。"],
["cool","mát mẻ; ngầu","涼{すず}しい、かっこいい","His new song is really cool.","Bài hát mới của anh ấy thực sự rất hay.","彼{かれ}の新曲{しんきょく}は本当{ほんとう}にかっこいいです。"],
["next","tiếp theo; kế tiếp","次{つぎ}の、隣{となり}の","We are going to go fishing next Saturday.","Thứ Bảy tuần tới chúng tôi định đi câu cá.","私{わたし}たちは次{つぎ}の土曜日{どようび}に釣{つ}りに行{い}く予定{よてい}です。"],
["high","cao","高{たか}い","That house has very high walls.","Ngôi nhà đó có những bức tường rất cao.","あの家{いえ}にはとても高{たか}い壁{かべ}があります。"],
["free","rảnh; tự do; miễn phí","暇{ひま}な、自由{じゆう}な、無料{むりょう}の","Are you free this afternoon?","Chiều nay bạn có rảnh không?","今日{きょう}の午後{ごご}は暇{ひま}ですか。"],
["good","tốt; hay; ngon","よい、上手{じょうず}な","We had a good vacation.","Chúng tôi đã có kỳ nghỉ vui vẻ.","私{わたし}たちは楽{たの}しい休暇{きゅうか}を過{す}ごしました。"],
["beautiful","đẹp; xinh đẹp","美{うつく}しい","There is a beautiful beach near that hotel.","Có một bãi biển đẹp gần khách sạn đó.","そのホテルの近{ちか}くには美{うつく}しいビーチがあります。"]
]);
add(31,365,[
["sunny","nắng; trời quang","よく晴{は}れた","I feel happy on sunny days.","Tôi thấy vui vào những ngày nắng đẹp.","私{わたし}は晴{は}れた日{ひ}には幸{しあわ}せな気持{きも}ちになります。"],
["clean","sạch; dọn dẹp","きれいな、掃除{そうじ}する","Are your hands clean?","Tay bạn đã sạch chưa?","あなたの手{て}はきれいですか。"],
["later","sau; lát nữa","あとで","I'll call you later.","Tôi sẽ gọi bạn sau.","あとであなたに電話{でんわ}します。"],
["ago","trước đây (tính từ hiện tại)","～前{まえ}に","I played with him three days ago.","Tôi đã chơi cùng anh ấy ba ngày trước.","私{わたし}は3日前{みっかまえ}に彼{かれ}と遊{あそ}びました。"],
["soon","sớm; chẳng bao lâu","まもなく、すぐに","The bus will arrive here soon.","Xe buýt sẽ sớm đến đây.","バスはまもなくここに到着{とうちゃく}するでしょう。"],
["tomorrow","ngày mai","明日{あした}","Let's meet at nine tomorrow.","Ngày mai chúng ta gặp nhau lúc chín giờ nhé.","明日{あした}9時{じ}に会{あ}いましょう。"],
["still","vẫn còn; cho đến bây giờ","まだ、今{いま}でも","She is still studying in her room.","Cô ấy vẫn đang học trong phòng.","彼女{かのじょ}はまだ部屋{へや}で勉強{べんきょう}しています。"],
["away","xa; đi khỏi","離{はな}れて、去{さ}って","The city is two hours away from here by car.","Từ đây lái xe đến thành phố đó mất hai tiếng.","その町{まち}はここから車{くるま}で2時間{じかん}離{はな}れています。"],
["abroad","ở nước ngoài; ra nước ngoài","外国{がいこく}に、海外{かいがい}で","He wants to study abroad.","Anh ấy muốn du học.","彼{かれ}は留学{りゅうがく}したいと思{おも}っています。"],
["a.m.","giờ buổi sáng","午前{ごぜん}","My father leaves home at 7 a.m.","Bố tôi rời nhà lúc 7 giờ sáng.","父{ちち}は午前{ごぜん}7時{じ}に家{いえ}を出{で}ます。"],
["p.m.","giờ buổi chiều; tối","午後{ごご}","The concert starts at 3 p.m.","Buổi hòa nhạc bắt đầu lúc 3 giờ chiều.","コンサートは午後{ごご}3時{じ}に始{はじ}まります。"],
["then","khi ấy; sau đó","そのとき、それから","I was watching TV then.","Lúc đó tôi đang xem tivi.","私{わたし}はそのときテレビを見{み}ていました。"]
]);
add(32,377,[
["up","lên; phía trên","上{うえ}へ、起{お}きて","We looked up at the sky.","Chúng tôi ngước nhìn bầu trời.","私{わたし}たちは空{そら}を見上{みあ}げました。"],
["down","xuống; phía dưới","下{した}へ","He put the box down on the table.","Anh ấy đặt hộp xuống bàn.","彼{かれ}は箱{はこ}を下{お}ろしてテーブルの上{うえ}に置{お}きました。"],
["together","cùng nhau","いっしょに","We went to the festival together.","Chúng tôi đã cùng nhau đi lễ hội.","私{わたし}たちはいっしょに祭{まつ}りに行{い}きました。"],
["just","chỉ; vừa mới; đúng lúc","ただ～だけ、ちょうど","I just wanted to talk to you.","Tôi chỉ muốn nói chuyện với bạn thôi.","私{わたし}はただあなたと話{はな}したかっただけです。"],
["also","cũng; ngoài ra","～もまた","He is a TV star and also a writer.","Anh ấy là ngôi sao truyền hình và cũng là nhà văn.","彼{かれ}はテレビスターであり、作家{さっか}でもあります。"],
["where","ở đâu; nơi nào","どこに、どこで","Where did you buy it?","Bạn đã mua nó ở đâu?","あなたはそれをどこで買{か}いましたか。"],
["when","khi nào","いつ、～のとき","When will she come back?","Khi nào cô ấy sẽ quay lại?","彼女{かのじょ}はいつ戻{もど}ってきますか。"],
["how","như thế nào; bằng cách nào","どのように、どれくらい","How did you get here?","Bạn đã đến đây bằng cách nào?","あなたはどうやってここに来{き}ましたか。"],
["why","tại sao","なぜ","Why did you choose that book?","Tại sao bạn chọn cuốn sách đó?","なぜその本{ほん}を選{えら}んだのですか。"],
["who","ai","だれ","Who made this?","Ai đã làm cái này?","これはだれが作{つく}ったのですか。"],
["which","cái nào; cái nào trong số đó","どちら、どれ","Which is your umbrella?","Cái ô nào là của bạn?","どちらがあなたの傘{かさ}ですか。"],
["what","cái gì; điều gì","何{なに}","What is in the box on the floor?","Trong chiếc hộp trên sàn có gì?","床{ゆか}の上{うえ}の箱{はこ}には何{なに}が入{はい}っていますか。"]
]);
add(33,389,[
["whose","của ai","だれの、だれのもの","Whose bag is this?","Cái túi này là của ai?","これはだれのかばんですか。"],
["one","một; cái; người","一{ひと}つ、一人{ひとり}","That was one of the most exciting games of the year.","Đó là một trong những trận đấu hào hứng nhất năm.","あれは今年{ことし}で一番{いちばん}わくわくする試合{しあい}の一{ひと}つでした。"],
["something","điều gì đó; một thứ gì đó","何{なに}か、あること","I want something cold to drink.","Tôi muốn uống thứ gì đó lạnh.","何{なに}か冷{つめ}たい飲{の}み物{もの}が欲{ほ}しいです。"],
["anything","bất cứ điều gì","何{なに}か、何{なん}でも","She doesn't know anything about me.","Cô ấy chẳng biết gì về tôi.","彼女{かのじょ}は私{わたし}のことを何{なに}も知{し}りません。"],
["everyone","mọi người; tất cả mọi người","だれでも、みんな","Everyone wants to be happy.","Ai cũng muốn được hạnh phúc.","だれもが幸{しあわ}せになりたいと思{おも}っています。"],
["could","đã có thể; có thể (lịch sự)","できた、～かもしれない","I could not answer some of those questions.","Tôi đã không trả lời được một số câu hỏi đó.","私{わたし}はそれらの質問{しつもん}のいくつかに答{こた}えられませんでした。"],
["would","sẽ; muốn; (dạng quá khứ của will)","～だろう、～したい","I thought you would help me.","Tôi đã nghĩ bạn sẽ giúp tôi.","私{わたし}はあなたが手伝{てつだ}ってくれると思{おも}っていました。"],
["should","nên; phải","～したほうがいい、～すべきだ","You should thank her for that.","Bạn nên cảm ơn cô ấy vì điều đó.","あなたはそのことで彼女{かのじょ}に感謝{かんしゃ}したほうがいいですよ。"],
["as","với tư cách; như; khi","～として、～のように","My father works as a pianist.","Bố tôi làm việc với tư cách nghệ sĩ piano.","父{ちち}はピアニストとして働{はたら}いています。"],
["around","xung quanh; khoảng","～のまわりに、約{やく}","I walked around the park with my mother.","Tôi đi bộ quanh công viên cùng mẹ.","私{わたし}は母{はは}といっしょに公園{こうえん}のまわりを歩{ある}きました。"],
["after","sau; sau khi","～のあとに、～したあとで","I took a bath after my father.","Tôi tắm sau bố.","私{わたし}は父{ちち}のあとにお風呂{ふろ}に入{はい}りました。"],
["before","trước; trước khi","～の前{まえ}に、以前{いぜん}","We had coffee before the show.","Chúng tôi uống cà phê trước buổi biểu diễn.","私{わたし}たちはショーの前{まえ}にコーヒーを飲{の}みました。"]
]);
})();