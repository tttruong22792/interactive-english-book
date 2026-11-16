/* Level 1 STEPs 3–6, photographed book pages. English examples follow source; Japanese explanatory renderings are reconstructed when source is unclear. */
(function(){
"use strict";
const add=(id,start,rows)=>{
 const entries=rows.map((r,i)=>({n:start+i,en:r[0],ipa:r[6]||"",vi:r[1],ja:r[2],
   extra:r[7]||[],sentence:r[3],sentenceVi:r[4],sentenceJa:r[5],sentenceJaSource:"reconstructed"}));
 window.BOOK_2100_DATA.steps.push({id,start,end:start+entries.length-1,pages:(28+2*id)+"–"+(29+2*id),entries});
};
add(3,25,[
["TV","tivi; truyền hình","テレビ","I often watch sports on TV.","Tôi thường xem thể thao trên tivi.","私{わたし}はよくテレビでスポーツを見{み}ます。"],
["drama","phim truyền hình; kịch","ドラマ、劇{げき}","My friends all love that drama.","Bạn bè tôi đều thích bộ phim truyền hình đó.","私{わたし}の友達{ともだち}はみんなあのドラマが大好{だいす}きです。"],
["picture","bức ảnh; bức tranh","絵{え}、写真{しゃしん}","I took some pictures of the castle.","Tôi đã chụp vài bức ảnh của lâu đài.","私{わたし}はその城{しろ}の写真{しゃしん}を何枚{なんまい}か撮{と}りました。"],
["course","hướng đi; lộ trình; khóa học","コース、進路{しんろ}","The plane changed course and came back.","Máy bay đổi hướng rồi quay lại.","飛行機{ひこうき}は進路{しんろ}を変{か}えて戻{もど}ってきました。"],
["festival","lễ hội","祭{まつ}り","Is there a summer festival in your town?","Thị trấn của bạn có lễ hội mùa hè không?","あなたの町{まち}では夏祭{なつまつ}りがありますか。"],
["food","thức ăn; thực phẩm","食{た}べ物{もの}","What is your favorite food?","Món ăn yêu thích của bạn là gì?","あなたの一番好{いちばんす}きな食{た}べ物{もの}は何{なん}ですか。"],
["breakfast","bữa sáng","朝食{ちょうしょく}","I had sandwiches for breakfast today.","Hôm nay tôi ăn bánh sandwich vào bữa sáng.","私{わたし}は今日{きょう}の朝食{ちょうしょく}にサンドイッチを食{た}べました。"],
["lunch","bữa trưa","昼食{ちゅうしょく}、ランチ","They sometimes have lunch in the park.","Đôi khi họ ăn trưa trong công viên.","彼{かれ}らは時々{ときどき}公園{こうえん}で昼食{ちゅうしょく}を食{た}べます。"],
["dinner","bữa tối","夕食{ゆうしょく}、ディナー","My father is cooking dinner now.","Bố tôi đang nấu bữa tối.","父{ちち}は今{いま}、夕食{ゆうしょく}を作{つく}っています。"],
["restaurant","nhà hàng","レストラン","We had a good time at the restaurant.","Chúng tôi đã có khoảng thời gian vui vẻ tại nhà hàng.","私{わたし}たちはレストランで楽{たの}しい時間{じかん}を過{す}ごしました。"],
["music","âm nhạc","音楽{おんがく}","I often listen to music at night.","Tôi thường nghe nhạc vào ban đêm.","私{わたし}は夜{よる}によく音楽{おんがく}を聞{き}きます。"],
["piano","đàn piano","ピアノ","He plays the piano very well.","Anh ấy chơi đàn piano rất giỏi.","彼{かれ}はピアノをとても上手{じょうず}に弾{ひ}きます。"]
]);
add(4,37,[
["guitar","đàn ghi-ta","ギター","I played the guitar for my friends.","Tôi đã chơi ghi-ta cho bạn bè nghe.","私{わたし}は友達{ともだち}のためにギターを弾{ひ}きました。"],
["song","bài hát","歌{うた}","I know some English songs.","Tôi biết một số bài hát tiếng Anh.","私{わたし}はいくつかの英語{えいご}の歌{うた}を知{し}っています。"],
["sport","thể thao; môn thể thao","スポーツ","She is good at winter sports.","Cô ấy giỏi các môn thể thao mùa đông.","彼女{かのじょ}はウィンタースポーツが得意{とくい}です。"],
["soccer","bóng đá","サッカー","Don't play soccer in the park.","Đừng chơi bóng đá trong công viên.","公園{こうえん}でサッカーをしないでください。"],
["tennis","quần vợt; tennis","テニス","I play tennis at school.","Tôi chơi quần vợt ở trường.","私{わたし}は学校{がっこう}でテニスをします。"],
["team","đội; nhóm","チーム","Our soccer team has thirty players.","Đội bóng đá của chúng tôi có 30 cầu thủ.","私{わたし}たちのサッカーチームには30人{にん}の選手{せんしゅ}がいます。"],
["player","người chơi; cầu thủ","選手{せんしゅ}、演奏者{えんそうしゃ}","He is a famous basketball player.","Anh ấy là một cầu thủ bóng rổ nổi tiếng.","彼{かれ}は有名{ゆうめい}なバスケットボール選手{せんしゅ}です。"],
["birthday","sinh nhật","誕生日{たんじょうび}","When is your birthday?","Sinh nhật bạn là ngày nào?","あなたの誕生日{たんじょうび}はいつですか。"],
["color","màu sắc","色{いろ}","I like the color of your shirt.","Tôi thích màu chiếc áo của bạn.","私{わたし}はあなたのシャツの色{いろ}が好{す}きです。"],
["zoo","vườn thú","動物園{どうぶつえん}","We went to the zoo last Sunday.","Chúng tôi đã đi vườn thú Chủ nhật tuần trước.","私{わたし}たちは先週{せんしゅう}の日曜日{にちようび}に動物園{どうぶつえん}へ行{い}きました。"],
["park","công viên","公園{こうえん}","Many children were playing in the park with their dogs.","Nhiều trẻ em đang chơi cùng những chú chó ở công viên.","多{おお}くの子{こ}どもたちが公園{こうえん}で犬{いぬ}と遊{あそ}んでいました。"],
["tea","trà","お茶{ちゃ}、紅茶{こうちゃ}","Do you drink tea or coffee after dinner?","Bạn uống trà hay cà phê sau bữa tối?","夕食後{ゆうしょくご}に紅茶{こうちゃ}かコーヒーを飲{の}みますか。"],
["cherry","quả anh đào; cây anh đào","桜{さくら}の木{き}、サクランボ","Can you see the cherry trees over there?","Bạn có nhìn thấy những cây anh đào ở đằng kia không?","あそこにある桜{さくら}の木{き}が見{み}えますか。"]
]);
add(5,50,[
["house","ngôi nhà","家{いえ}","My house is near the station.","Nhà tôi ở gần nhà ga.","私{わたし}の家{いえ}は駅{えき}の近{ちか}くにあります。"],
["wall","bức tường","壁{かべ}","Those pictures on the wall are very nice.","Những bức tranh trên tường đó rất đẹp.","壁{かべ}に掛{か}かっているあの絵{え}はとても素敵{すてき}です。"],
["cap","mũ lưỡi trai; mũ","帽子{ぼうし}","I have three caps.","Tôi có ba chiếc mũ lưỡi trai.","私{わたし}は帽子{ぼうし}を3つ持{も}っています。"],
["notebook","vở; sổ tay","ノート","I bought a new notebook.","Tôi đã mua một quyển vở mới.","新{あたら}しいノートを買{か}いました。"],
["pen","bút mực; bút bi","ペン","Can I borrow your pen?","Tôi có thể mượn bút của bạn được không?","あなたのペンを借{か}りてもいいですか。"],
["pencil","bút chì","鉛筆{えんぴつ}","Write with a pen, not a pencil.","Hãy viết bằng bút mực, không phải bút chì.","鉛筆{えんぴつ}ではなくペンで書{か}いてください。"],
["umbrella","ô; dù","傘{かさ}","I left my umbrella at school.","Tôi để quên ô ở trường.","学校{がっこう}に傘{かさ}を忘{わす}れました。"],
["chair","cái ghế","椅子{いす}","My cat always sits on my chair.","Con mèo của tôi lúc nào cũng ngồi trên ghế của tôi.","うちの猫{ねこ}はいつも私{わたし}の椅子{いす}に座{すわ}っています。"],
["weekend","cuối tuần","週末{しゅうまつ}","I usually play tennis on weekends.","Tôi thường chơi tennis vào cuối tuần.","私{わたし}は普段{ふだん}、週末{しゅうまつ}にテニスをします。"],
["concert","buổi hòa nhạc","コンサート","We went to a rock concert last weekend.","Cuối tuần trước chúng tôi đi xem hòa nhạc rock.","先週末{せんしゅうまつ}、ロックコンサートに行{い}きました。"],
["musician","nhạc sĩ; người biểu diễn nhạc","音楽家{おんがくか}、ミュージシャン","The musician sang five songs on the street.","Người nghệ sĩ đã hát năm bài trên đường phố.","そのミュージシャンは通{とお}りで5曲{きょく}歌{うた}いました。"],
["go","đi","行{い}く","Does this bus go to Umeda Station?","Xe buýt này có đi đến ga Umeda không?","このバスは梅田駅{うめだえき}に行{い}きますか。"]
]);
add(6,62,[
["come","đến; đi tới","来{く}る","He came to Japan from America last week.","Tuần trước anh ấy đến Nhật từ Mỹ.","彼{かれ}は先週{せんしゅう}アメリカから日本{にほん}に来{き}ました。"],
["want","muốn","欲{ほ}しい","She wants a new bag.","Cô ấy muốn một chiếc túi mới.","彼女{かのじょ}は新{あたら}しいバッグが欲{ほ}しいと思{おも}っています。"],
["know","biết; hiểu","知{し}っている","Do you know his phone number?","Bạn có biết số điện thoại của anh ấy không?","彼{かれ}の電話番号{でんわばんごう}を知{し}っていますか。"],
["make","làm; tạo; chế tạo","作{つく}る","My brother and I made a chair.","Tôi và anh trai đã làm một chiếc ghế.","兄{あに}と私{わたし}は椅子{いす}を作{つく}りました。"],
["see","nhìn thấy; gặp","見{み}える、会{あ}う","You can see the beautiful sea from the hotel.","Bạn có thể nhìn thấy biển đẹp từ khách sạn.","ホテルから美{うつく}しい海{うみ}が見{み}えます。"],
["look","nhìn; trông","見{み}る、見{み}える","She looked at me and smiled.","Cô ấy nhìn tôi và mỉm cười.","彼女{かのじょ}は私{わたし}を見{み}て微笑{ほほえ}みました。"],
["watch","xem; quan sát; đồng hồ đeo tay","見{み}る、腕時計{うでどけい}","Many people watched the parade on Sunday.","Nhiều người xem cuộc diễu hành vào Chủ nhật.","日曜日{にちようび}に大勢{おおぜい}の人{ひと}がパレードを見{み}ました。"],
["think","nghĩ; cho rằng","思{おも}う、考{かんが}える","What do you think about my idea?","Bạn nghĩ sao về ý tưởng của tôi?","私{わたし}の考{かんが}えについてどう思{おも}いますか。"],
["use","dùng; sử dụng","使{つか}う、使用{しよう}","Please use my umbrella.","Hãy dùng ô của tôi.","私{わたし}の傘{かさ}を使{つか}ってください。"],
["play","chơi; biểu diễn","遊{あそ}ぶ、弾{ひ}く","I don't play video games.","Tôi không chơi trò chơi điện tử.","私{わたし}はテレビゲームをしません。"],
["talk","nói chuyện","話{はな}す","I talked to him about the movie.","Tôi đã nói chuyện với anh ấy về bộ phim.","私{わたし}は彼{かれ}とその映画{えいが}について話{はな}しました。"],
["enjoy","tận hưởng; thích","楽{たの}しむ","Enjoy your trip!","Chúc bạn có chuyến đi vui vẻ!","旅行{りょこう}を楽{たの}しんでください！"]
]);
})();