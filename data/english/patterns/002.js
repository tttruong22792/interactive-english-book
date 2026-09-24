window.CONTENT_REGISTRY = window.CONTENT_REGISTRY || {};

window.CONTENT_REGISTRY["en-pattern-002"] = {
  id: "en-pattern-002",
  language: "en",
  category: "patterns",
  renderer: "english-pattern",
  layout: "sectioned-pattern",
  order: 2,
  title: "I’m going to…",
  meaning: "Tôi sẽ… / Tôi định…",
  description: "Mẫu cực kỳ quan trọng để nói về việc bạn dự định sẽ làm.",
  sourceVersion: 1,

  ui: {
    eyebrow: "MẪU CÂU SỐ 2",
    meaningTitle: "“Tôi sẽ… / Tôi định…” — dùng để nói về việc bạn dự định sẽ làm",
    leadHtml: "<strong>I’m going to… = Tôi sẽ… / Tôi định…</strong>",
    formula: "I’m going to + động từ nguyên mẫu",
    introNoteHtml: "Hãy học luôn cả cụm <b>“I’m going to…”</b>. Khi trong đầu xuất hiện “Tôi sẽ…”, mục tiêu là tự động bật ra “I’m going to…”.",
    sourceNote: "Nội dung bài học được dựng từ nội dung Mẫu câu 2 bạn vừa cung cấp."
  },

  introExamples: [
    ["I’m going to eat.", "Tôi sẽ ăn."],
    ["I’m going to go home.", "Tôi sẽ về nhà."],
    ["I’m going to call him.", "Tôi sẽ gọi cho anh ấy."],
    ["I’m going to study English.", "Tôi sẽ học tiếng Anh."],
    ["I’m going to take a shower.", "Tôi sẽ đi tắm."]
  ],

  sections: [
    {
      id: "what-is-im",
      title: "1. I’m là gì?",
      blocks: [
        { type: "formula", text: "I’m = I am" },
        { type: "paragraph", html: "<p>Vì vậy:</p><p><b>I’m going to...</b> = <b>I am going to...</b></p><p>Trong giao tiếp, người bản xứ gần như luôn dùng dạng rút gọn <b>I’m going to...</b> thay vì <b>I am going to...</b>.</p>" },
        { type: "callout", tone: "green", html: "Bạn nên học luôn cả cụm:<br><strong>I’m going to = Tôi sẽ / Tôi định</strong><br>Đừng dịch từng từ." }
      ]
    },
    {
      id: "pronunciation",
      title: "2. Cách đọc",
      blocks: [
        { type: "formula", text: "I’m going to", note: "IPA: /aɪm ˈɡoʊɪŋ tə/" },
        { type: "callout", tone: "purple", html: "Đọc gần đúng cho người Việt:<br><strong>aim gâu-ing tờ</strong>" },
        { type: "paragraph", html: "<p>Trong giao tiếp tự nhiên, <code>going to</code> thường được nói rất nhanh. Bạn có thể nghe:</p><p><b>I’m gonna...</b></p>" },
        { type: "sentences", items: [
          ["I’m going to go home.", "Nói rõ: Aim gâu-ing tờ gâu hôum."],
          ["I’m gonna go home.", "Nói tự nhiên: Aim gân-nờ gâu hôum."]
        ]},
        { type: "callout", tone: "amber", html: "<b>gonna = going to</b> trong cách nói thân mật.<br>Giai đoạn đầu: <b>viết</b> “I’m going to...”; khi <b>nói/nghe</b>, làm quen cả “I’m going to...” và “I’m gonna...”. Không nên viết <code>gonna</code> trong email công việc trang trọng." },
        { type: "sentences", items: [
          ["I’m gonna eat.", "I’m going to eat. → Tôi sẽ ăn."]
        ]}
      ]
    },
    {
      id: "when-to-use",
      title: "3. Khi nào dùng I’m going to...?",
      blocks: [
        { type: "paragraph", html: "<p>Dùng khi bạn <b>đã có ý định hoặc kế hoạch</b> làm việc gì đó.</p>" },
        { type: "sentences", items: [
          ["I’m going to study English tonight.", "Tối nay tôi sẽ học tiếng Anh."],
          ["I’m going to work tomorrow.", "Ngày mai tôi sẽ đi làm."]
        ]},
        { type: "callout", tone: "green", html: "Bạn đã quyết định rồi → <b>I’m going to...</b> rất tự nhiên." }
      ]
    },
    {
      id: "sentences20",
      title: "4. 20 câu quan trọng trong cuộc sống",
      blocks: [
        { type: "sentences", learnable: true, controls: true, items: [
          ["I’m going to eat.", "Tôi sẽ ăn."],
          ["I’m going to sleep.", "Tôi sẽ ngủ."],
          ["I’m going to take a shower.", "Tôi sẽ đi tắm."],
          ["I’m going to go home.", "Tôi sẽ về nhà."],
          ["I’m going to work.", "Tôi sẽ đi làm."],
          ["I’m going to study.", "Tôi sẽ học."],
          ["I’m going to study English.", "Tôi sẽ học tiếng Anh."],
          ["I’m going to cook dinner.", "Tôi sẽ nấu bữa tối."],
          ["I’m going to clean the room.", "Tôi sẽ dọn phòng."],
          ["I’m going to call him.", "Tôi sẽ gọi cho anh ấy."],
          ["I’m going to call her.", "Tôi sẽ gọi cho cô ấy."],
          ["I’m going to check it.", "Tôi sẽ kiểm tra nó."],
          ["I’m going to try it.", "Tôi sẽ thử nó."],
          ["I’m going to buy it.", "Tôi sẽ mua nó."],
          ["I’m going to ask him.", "Tôi sẽ hỏi anh ấy."],
          ["I’m going to talk to him.", "Tôi sẽ nói chuyện với anh ấy."],
          ["I’m going to meet my friend.", "Tôi sẽ gặp bạn tôi."],
          ["I’m going to take a break.", "Tôi sẽ nghỉ một chút."],
          ["I’m going to watch TV.", "Tôi sẽ xem TV."],
          ["I’m going to practice English.", "Tôi sẽ luyện tiếng Anh."]
        ]}
      ]
    },
    {
      id: "work",
      title: "5. Cực kỳ hữu ích trong công việc",
      blocks: [
        { type: "paragraph", html: "<p>Bạn có thể dùng mẫu này hàng ngày:</p>" },
        { type: "sentences", items: [
          ["I’m going to check it.", "Tôi sẽ kiểm tra."],
          ["I’m going to check the settings.", "Tôi sẽ kiểm tra cài đặt."],
          ["I’m going to test it again.", "Tôi sẽ kiểm tra/thử lại."],
          ["I’m going to restart the system.", "Tôi sẽ khởi động lại hệ thống."],
          ["I’m going to update the software.", "Tôi sẽ cập nhật phần mềm."],
          ["I’m going to send you the file.", "Tôi sẽ gửi file cho bạn."],
          ["I’m going to talk to my manager.", "Tôi sẽ nói chuyện với quản lý của tôi."],
          ["I’m going to check the problem.", "Tôi sẽ kiểm tra vấn đề."]
        ]},
        { type: "callout", tone: "green", html: "Một mẫu bạn nên nhớ ngay:<br><strong>I’m going to check it.</strong><br>Trong công việc, câu này dùng cực nhiều." }
      ]
    },
    {
      id: "time",
      title: "6. Thêm thời gian vào cuối câu",
      blocks: [
        { type: "paragraph", html: "<p><code>I’m going to...</code> rất dễ mở rộng.</p>" },
        { type: "sentences", items: [
          ["I’m going to study English.", "Tôi sẽ học tiếng Anh."],
          ["I’m going to study English tonight.", "Tối nay tôi sẽ học tiếng Anh."],
          ["I’m going to study English for 30 minutes tonight.", "Tối nay tôi sẽ học tiếng Anh trong 30 phút."],
          ["I’m going to call him later.", "Lát nữa tôi sẽ gọi cho anh ấy."],
          ["I’m going to go shopping this weekend.", "Cuối tuần này tôi sẽ đi mua sắm."]
        ]},
        { type: "chips", items: [
          ["today", "hôm nay"],
          ["tonight", "tối nay"],
          ["tomorrow", "ngày mai"],
          ["this afternoon", "chiều nay"],
          ["this evening", "tối nay"],
          ["this weekend", "cuối tuần này"],
          ["next week", "tuần sau"],
          ["later", "lát nữa / sau"],
          ["after work", "sau giờ làm"],
          ["after dinner", "sau bữa tối"]
        ]},
        { type: "builder", title: "Luyện ghép câu", base: "I’m going to" }
      ]
    },
    {
      id: "negative",
      title: "7. Dạng phủ định",
      blocks: [
        { type: "paragraph", html: "<p>Muốn nói “Tôi sẽ không...”, chỉ cần thêm <code>not</code>.</p>" },
        { type: "formula", text: "I’m not going to + động từ" },
        { type: "sentences", items: [
          ["I’m not going to go.", "Tôi sẽ không đi."],
          ["I’m not going to buy it.", "Tôi sẽ không mua nó."],
          ["I’m not going to work tomorrow.", "Ngày mai tôi sẽ không đi làm."],
          ["I’m not going to drink tonight.", "Tối nay tôi sẽ không uống rượu."],
          ["I’m not going to do that.", "Tôi sẽ không làm việc đó."]
        ]}
      ]
    },
    {
      id: "questions",
      title: "8. Hỏi người khác",
      blocks: [
        { type: "paragraph", html: "<p>Khi <code>I</code> đổi thành <code>you</code>:</p>" },
        { type: "formula", text: "Are you going to + động từ?", note: "= Bạn sẽ… à? / Bạn định… à?" },
        { type: "sentences", items: [
          ["Are you going to eat?", "Bạn định ăn à?"],
          ["Are you going to work tomorrow?", "Ngày mai bạn đi làm à?"],
          ["Are you going to buy it?", "Bạn định mua nó à?"],
          ["Are you going to come with us?", "Bạn sẽ đi cùng chúng tôi chứ?"]
        ]},
        { type: "callout", tone: "green", html: "Đây là mẫu cực kỳ phổ biến." }
      ]
    },
    {
      id: "wh-questions",
      title: "9. Các câu hỏi tự nhiên hơn",
      blocks: [
        { type: "sentences", items: [
          ["What are you going to do?", "Bạn định làm gì?"],
          ["What are you gonna do?", "Cách nói tự nhiên của “What are you going to do?”"],
          ["Where are you going to go?", "Bạn định đi đâu?"],
          ["When are you going to leave?", "Khi nào bạn sẽ đi?"],
          ["Who are you going to meet?", "Bạn sẽ gặp ai?"]
        ]}
      ]
    },
    {
      id: "common-mistake",
      title: "10. Một lỗi người mới rất hay mắc",
      blocks: [
        { type: "callout", tone: "bad", html: "❌ <strong>I’m going to home.</strong>" },
        { type: "paragraph", html: "<p>Vì <code>home</code> trong trường hợp này không dùng trực tiếp sau <code>going to</code>.</p>" },
        { type: "sentences", items: [
          ["I’m going home.", "Tôi đang/sắp về nhà."],
          ["I’m going to go home.", "Tôi dự định sẽ về nhà."]
        ]},
        { type: "callout", tone: "amber", html: "Trong giao tiếp thường ngày, nếu bạn chuẩn bị về ngay: <b>I’m going home.</b> tự nhiên hơn." }
      ]
    },
    {
      id: "going-to-vs-will",
      title: "11. I’m going to và I will",
      blocks: [
        { type: "paragraph", html: "<p>Hai cái đều có thể dịch là <b>“tôi sẽ”</b>, nhưng chưa cần học quá sâu.</p>" },
        { type: "compare", leftTitle: "I’m going to...", rightTitle: "I’ll...", leftHtml: "Bạn <b>đã có dự định trước</b>.", rightHtml: "Bạn <b>quyết định ngay lúc nói</b>." },
        { type: "sentences", items: [
          ["I’m going to study English tonight.", "Tối nay tôi sẽ học tiếng Anh. Bạn đã có kế hoạch."],
          ["I’ll answer it.", "Để tôi nghe máy. Quyết định ngay lúc điện thoại reo."]
        ]},
        { type: "callout", tone: "green", html: "Hiện tại hãy tập trung:<br><strong>I’m going to = Tôi định / Tôi sẽ</strong>" }
      ]
    },
    {
      id: "combine-patterns",
      title: "12. Kết hợp mẫu số 1 và mẫu số 2",
      blocks: [
        { type: "sentences", items: [
          ["I’d like to buy a new car.", "Tôi muốn mua một chiếc xe mới."],
          ["I’m going to buy a new car.", "Tôi sẽ mua một chiếc xe mới."],
          ["I’d like to learn English.", "Tôi muốn học tiếng Anh."],
          ["I’m going to study English every day.", "Tôi sẽ học tiếng Anh mỗi ngày."]
        ]},
        { type: "compare", leftTitle: "I’d like to...", rightTitle: "I’m going to...", leftHtml: "→ <b>mong muốn</b>", rightHtml: "→ <b>đã có ý định/kế hoạch</b>" },
        { type: "callout", tone: "purple", html: "Đây chính là cách người ta kết hợp nhiều mẫu câu để nói dài hơn." }
      ]
    },
    {
      id: "dialogs",
      title: "13. Hội thoại thực tế",
      blocks: [
        { type: "dialogs", items: [
          { place: "Tối nay", rows: [
            ["A", "What are you going to do tonight?", "Tối nay bạn định làm gì?"],
            ["B", "I’m going to study English.", "Tôi sẽ học tiếng Anh."],
            ["A", "Really?", "Thật à?"],
            ["B", "Yeah. I’m going to practice for about 30 minutes.", "Ừ. Tôi sẽ luyện khoảng 30 phút."]
          ]},
          { place: "Trong công việc", rows: [
            ["A", "Can you check this problem?", "Bạn kiểm tra vấn đề này được không?"],
            ["B", "Sure. I’m going to check it now.", "Được. Tôi sẽ kiểm tra ngay bây giờ."]
          ]},
          { place: "Ở nhà", rows: [
            ["A", "Where are you going?", "Bạn đi đâu vậy?"],
            ["B", "I’m going to the supermarket.", "Tôi đang đi siêu thị."],
            ["A", "What are you going to buy?", "Bạn định mua gì?"],
            ["B", "I’m going to buy some food.", "Tôi sẽ mua ít đồ ăn."]
          ]}
        ]}
      ]
    },
    {
      id: "practice",
      title: "14. 10 câu bạn cần tự nói",
      blocks: [
        { type: "paragraph", html: "<p>Nhìn tiếng Việt trước và tự nói.</p>" },
        { type: "quiz" }
      ]
    },
    {
      id: "summary",
      title: "Hai mẫu đã học",
      blocks: [
        { type: "compare", leftTitle: "01. I’d like to + V", rightTitle: "02. I’m going to + V", leftHtml: "→ Tôi muốn...", rightHtml: "→ Tôi sẽ / Tôi định..." },
        { type: "sentences", items: [
          ["I’d like to learn English.", "Tôi muốn học tiếng Anh."],
          ["I’m going to study English tonight.", "Tôi sẽ học tiếng Anh tối nay."]
        ]},
        { type: "callout", tone: "green", html: "Hãy cố đạt đến mức khi trong đầu xuất hiện <b>“Tôi sẽ…”</b>, bạn không dịch nữa mà tự động bật ra:<br><strong>I’m going to…</strong><br>Sau đó chỉ việc gắn động từ phía sau: <b>eat, go, buy, check, call, study, work, try, ask, talk...</b>" }
      ]
    }
  ],

  practice: [
    ["Tôi sẽ về nhà.", "I’m going to go home."],
    ["Tôi sẽ ăn.", "I’m going to eat."],
    ["Tôi sẽ đi ngủ.", "I’m going to sleep."],
    ["Tôi sẽ gọi cho anh ấy.", "I’m going to call him."],
    ["Tôi sẽ kiểm tra nó.", "I’m going to check it."],
    ["Tôi sẽ học tiếng Anh tối nay.", "I’m going to study English tonight."],
    ["Tôi sẽ làm việc ngày mai.", "I’m going to work tomorrow."],
    ["Tôi sẽ mua cái này.", "I’m going to buy this."],
    ["Tôi sẽ nói chuyện với quản lý của tôi.", "I’m going to talk to my manager."],
    ["Tôi sẽ thử lại.", "I’m going to try again."]
  ],

  dailyFive: [
    "I’m going to go home.",
    "I’m going to check it.",
    "I’m going to study English tonight.",
    "I’m going to call him later.",
    "I’m going to try again."
  ],

  builderGroups: [
    { label: "Động từ / cụm động từ", options: ["eat","go home","sleep","work","study English","call him","check it","buy it","try again","talk to my manager"] },
    { label: "Thời gian", options: ["today","tonight","tomorrow","later","this afternoon","this evening","this weekend","next week","after work","after dinner"] }
  ],

  dictionary: {
    "i'm": ["/aɪm/", "I am (dạng rút gọn)", "I’m going to study English."],
    "i": ["/aɪ/", "tôi", "I am ready."],
    "am": ["/æm/", "là / thì / ở; dùng với I", "I am going to work."],
    "going": ["/ˈɡoʊɪŋ/", "đi; trong 'be going to' dùng để nói dự định", "I’m going to work tomorrow."],
    "to": ["/tə/", "đến; để; trước động từ nguyên mẫu", "I’m going to eat."],
    "gonna": ["/ˈɡʌnə/", "cách nói thân mật của 'going to'", "I’m gonna eat."],
    "eat": ["/iːt/", "ăn", "I’m going to eat."],
    "sleep": ["/sliːp/", "ngủ", "I’m going to sleep."],
    "take": ["/teɪk/", "lấy; thực hiện; dùng", "I’m going to take a shower."],
    "a": ["/ə/", "một", "take a shower"],
    "shower": ["/ˈʃaʊər/", "tắm vòi sen; buổi tắm", "I’m going to take a shower."],
    "go": ["/ɡoʊ/", "đi", "I’m going to go home."],
    "home": ["/hoʊm/", "nhà; về nhà", "I’m going home."],
    "work": ["/wɜːrk/", "làm việc; công việc", "I’m going to work tomorrow."],
    "study": ["/ˈstʌdi/", "học", "I’m going to study English."],
    "english": ["/ˈɪŋɡlɪʃ/", "tiếng Anh", "I’m going to study English tonight."],
    "cook": ["/kʊk/", "nấu", "I’m going to cook dinner."],
    "dinner": ["/ˈdɪnər/", "bữa tối", "I’m going to cook dinner."],
    "clean": ["/kliːn/", "dọn / làm sạch", "I’m going to clean the room."],
    "the": ["/ðə/", "mạo từ 'the'", "the room"],
    "room": ["/ruːm/", "phòng", "I’m going to clean the room."],
    "call": ["/kɔːl/", "gọi", "I’m going to call him."],
    "him": ["/hɪm/", "anh ấy / ông ấy (tân ngữ)", "I’m going to call him."],
    "her": ["/hɜːr/", "cô ấy / chị ấy (tân ngữ)", "I’m going to call her."],
    "check": ["/tʃek/", "kiểm tra", "I’m going to check it."],
    "it": ["/ɪt/", "nó / việc đó", "I’m going to check it."],
    "try": ["/traɪ/", "thử", "I’m going to try again."],
    "buy": ["/baɪ/", "mua", "I’m going to buy it."],
    "ask": ["/æsk/", "hỏi", "I’m going to ask him."],
    "talk": ["/tɔːk/", "nói chuyện", "I’m going to talk to him."],
    "meet": ["/miːt/", "gặp", "I’m going to meet my friend."],
    "my": ["/maɪ/", "của tôi", "my friend"],
    "friend": ["/frend/", "bạn", "I’m going to meet my friend."],
    "break": ["/breɪk/", "giờ nghỉ; sự nghỉ", "I’m going to take a break."],
    "watch": ["/wɑːtʃ/", "xem", "I’m going to watch TV."],
    "tv": ["/ˌtiːˈviː/", "tivi / truyền hình", "I’m going to watch TV."],
    "practice": ["/ˈpræktɪs/", "luyện tập", "I’m going to practice English."],
    "settings": ["/ˈsetɪŋz/", "cài đặt", "I’m going to check the settings."],
    "test": ["/test/", "kiểm tra / thử", "I’m going to test it again."],
    "again": ["/əˈɡen/", "lại / một lần nữa", "I’m going to try again."],
    "restart": ["/ˌriːˈstɑːrt/", "khởi động lại", "I’m going to restart the system."],
    "system": ["/ˈsɪstəm/", "hệ thống", "I’m going to restart the system."],
    "update": ["/ˈʌpdeɪt/", "cập nhật", "I’m going to update the software."],
    "software": ["/ˈsɔːftwer/", "phần mềm", "I’m going to update the software."],
    "send": ["/send/", "gửi", "I’m going to send you the file."],
    "you": ["/juː/", "bạn", "I’m going to send you the file."],
    "file": ["/faɪl/", "tệp / file", "I’m going to send you the file."],
    "manager": ["/ˈmænɪdʒər/", "quản lý", "I’m going to talk to my manager."],
    "problem": ["/ˈprɑːbləm/", "vấn đề", "Can you check this problem?"],
    "today": ["/təˈdeɪ/", "hôm nay", "I’m going to work today."],
    "tonight": ["/təˈnaɪt/", "tối nay", "I’m going to study English tonight."],
    "tomorrow": ["/təˈmɑːroʊ/", "ngày mai", "I’m going to work tomorrow."],
    "this": ["/ðɪs/", "này / cái này", "I’m going to buy this."],
    "afternoon": ["/ˌæftərˈnuːn/", "buổi chiều", "this afternoon"],
    "evening": ["/ˈiːvnɪŋ/", "buổi tối", "this evening"],
    "weekend": ["/ˌwiːkˈend/", "cuối tuần", "this weekend"],
    "next": ["/nekst/", "tiếp theo / sau", "next week"],
    "week": ["/wiːk/", "tuần", "next week"],
    "later": ["/ˈleɪtər/", "lát nữa / sau", "I’m going to call him later."],
    "after": ["/ˈæftər/", "sau", "after work"],
    "shopping": ["/ˈʃɑːpɪŋ/", "mua sắm", "I’m going to go shopping this weekend."],
    "for": ["/fɔːr/", "trong; cho", "for 30 minutes"],
    "minutes": ["/ˈmɪnɪts/", "phút", "for 30 minutes"],
    "not": ["/nɑːt/", "không", "I’m not going to go."],
    "drink": ["/drɪŋk/", "uống", "I’m not going to drink tonight."],
    "do": ["/duː/", "làm", "I’m not going to do that."],
    "that": ["/ðæt/", "đó / việc đó", "I’m not going to do that."],
    "are": ["/ɑːr/", "là / thì / ở; dùng với you/we/they", "Are you going to eat?"],
    "come": ["/kʌm/", "đến / đi cùng về phía người nói", "Are you going to come with us?"],
    "with": ["/wɪð/", "với / cùng", "come with us"],
    "us": ["/ʌs/", "chúng tôi / chúng ta (tân ngữ)", "come with us"],
    "what": ["/wʌt/", "cái gì / điều gì", "What are you going to do?"],
    "where": ["/wer/", "ở đâu / đi đâu", "Where are you going to go?"],
    "when": ["/wen/", "khi nào", "When are you going to leave?"],
    "who": ["/huː/", "ai", "Who are you going to meet?"],
    "leave": ["/liːv/", "rời đi / đi", "When are you going to leave?"],
    "will": ["/wɪl/", "sẽ; dùng cho nhiều cách nói về tương lai", "I will help."],
    "i'll": ["/aɪl/", "I will (dạng rút gọn)", "I’ll answer it."],
    "answer": ["/ˈænsər/", "trả lời / nghe máy", "I’ll answer it."],
    "new": ["/nuː/", "mới", "a new car"],
    "car": ["/kɑːr/", "xe ô tô", "I’m going to buy a new car."],
    "learn": ["/lɜːrn/", "học", "I’d like to learn English."],
    "every": ["/ˈevri/", "mỗi", "every day"],
    "day": ["/deɪ/", "ngày", "every day"],
    "really": ["/ˈriːəli/", "thật à / thực sự", "Really?"],
    "yeah": ["/jeə/", "ừ / vâng (thân mật)", "Yeah."],
    "about": ["/əˈbaʊt/", "khoảng / về", "about 30 minutes"],
    "now": ["/naʊ/", "bây giờ / ngay bây giờ", "I’m going to check it now."],
    "sure": ["/ʃʊr/", "được / chắc chắn", "Sure."],
    "supermarket": ["/ˈsuːpərˌmɑːrkɪt/", "siêu thị", "I’m going to the supermarket."],
    "some": ["/sʌm/", "một ít / một số", "some food"],
    "food": ["/fuːd/", "đồ ăn / thực phẩm", "I’m going to buy some food."],
    "can": ["/kæn/", "có thể", "Can you check this problem?"]
  },

  phrases: {
    "i'm going to": ["/aɪm ˈɡoʊɪŋ tə/", "tôi sẽ… / tôi định…", "I’m going to study English tonight."],
    "going to": ["/ˈɡoʊɪŋ tə/", "sẽ / định; trong cấu trúc be going to", "I’m going to work tomorrow."],
    "i'm gonna": ["/aɪm ˈɡʌnə/", "cách nói thân mật của “I’m going to”", "I’m gonna eat."],
    "go home": ["/ɡoʊ hoʊm/", "về nhà", "I’m going to go home."],
    "take a shower": ["/teɪk ə ˈʃaʊər/", "đi tắm", "I’m going to take a shower."],
    "study english": ["/ˈstʌdi ˈɪŋɡlɪʃ/", "học tiếng Anh", "I’m going to study English."],
    "take a break": ["/teɪk ə breɪk/", "nghỉ một chút", "I’m going to take a break."],
    "talk to": ["/tɔːk tə/", "nói chuyện với", "I’m going to talk to him."],
    "this weekend": ["/ðɪs ˌwiːkˈend/", "cuối tuần này", "I’m going to go shopping this weekend."],
    "after work": ["/ˈæftər wɜːrk/", "sau giờ làm", "after work"],
    "after dinner": ["/ˈæftər ˈdɪnər/", "sau bữa tối", "after dinner"],
    "i'm not going to": ["/aɪm nɑːt ˈɡoʊɪŋ tə/", "tôi sẽ không / tôi không định", "I’m not going to buy it."],
    "are you going to": ["/ɑːr juː ˈɡoʊɪŋ tə/", "bạn sẽ / bạn định…?", "Are you going to eat?"],
    "what are you going to do": ["/wʌt ɑːr juː ˈɡoʊɪŋ tə duː/", "bạn định làm gì?", "What are you going to do?"],
    "going home": ["/ˈɡoʊɪŋ hoʊm/", "đang/sắp về nhà", "I’m going home."],
    "i'll answer it": ["/aɪl ˈænsər ɪt/", "để tôi nghe máy / tôi sẽ trả lời", "I’ll answer it."],
    "every day": ["/ˈevri deɪ/", "mỗi ngày", "I’m going to study English every day."],
    "new car": ["/nuː kɑːr/", "xe mới", "I’m going to buy a new car."]
  }
};
