window.CONTENT_REGISTRY = window.CONTENT_REGISTRY || {};

window.CONTENT_REGISTRY["en-pattern-003"] = {
  id: "en-pattern-003",
  language: "en",
  category: "patterns",
  renderer: "english-pattern",
  layout: "sectioned-pattern",
  order: 3,
  title: "I want to…",
  meaning: "Tôi muốn…",
  description: "Một trong những mẫu quan trọng nhất vì dùng được gần như mỗi ngày.",
  sourceVersion: 1,

  ui: {
    eyebrow: "MẪU CÂU SỐ 3",
    meaningTitle: "“Tôi muốn…” — một mẫu rất quan trọng trong giao tiếp hằng ngày",
    leadHtml: "<strong>I want to… = Tôi muốn…</strong>",
    formula: "I want to + động từ nguyên mẫu",
    introNoteHtml: "Hãy học cả cụm <b>I want to…</b>. Sau đó chỉ việc thay động từ phía sau.",
    sourceNote: "Nội dung bài học được dựng từ nội dung Mẫu câu 3 bạn vừa cung cấp."
  },

  introExamples: [
    ["I want to eat.", "Tôi muốn ăn."],
    ["I want to sleep.", "Tôi muốn ngủ."],
    ["I want to go home.", "Tôi muốn về nhà."],
    ["I want to buy this.", "Tôi muốn mua cái này."],
    ["I want to learn English.", "Tôi muốn học tiếng Anh."]
  ],

  sections: [
    {
      id: "pronunciation",
      title: "1. Cách đọc",
      blocks: [
        { type: "formula", text: "I want to", note: "IPA: /aɪ wɑːnt tə/ hoặc /aɪ wɒnt tə/ tùy giọng." },
        { type: "callout", tone: "purple", html: "Đọc gần đúng:<br><strong>ai won-tờ</strong>" },
        { type: "paragraph", html: "<p>Khi nói tự nhiên, <code>want to</code> thường nối lại và bạn có thể nghe gần giống <b>wanna</b>.</p>" },
        { type: "sentences", items: [
          ["I want to go home.", "Nói rõ: Ai won-tờ gâu hôum."],
          ["I wanna go home.", "Nói rất tự nhiên: Ai wo-nờ gâu hôum."],
          ["I wanna eat.", "I want to eat. → Tôi muốn ăn."]
        ]},
        { type: "callout", tone: "amber", html: "<b>wanna = want to</b> trong giao tiếp thân mật.<br>Bạn nên <b>viết: I want to</b>; khi nghe giao tiếp, hãy nhận ra cả <b>I wanna…</b>." }
      ]
    },

    {
      id: "when-to-use",
      title: "2. I want to... dùng khi nào?",
      blocks: [
        { type: "paragraph", html: "<p>Dùng khi bạn muốn làm một hành động nào đó.</p>" },
        { type: "sentences", items: [
          ["I want to eat.", "Tôi muốn ăn."],
          ["I want to rest.", "Tôi muốn nghỉ."],
          ["I want to talk to you.", "Tôi muốn nói chuyện với bạn."]
        ]},
        { type: "callout", tone: "green", html: "Điểm quan trọng: sau <code>to</code> phải là <b>động từ nguyên mẫu</b>." },
        { type: "compare", leftTitle: "Đúng", rightTitle: "Không dùng", leftHtml: "✅ I want to eat.<br>✅ I want to go.<br>✅ I want to buy it.", rightHtml: "❌ I want to eating.<br>❌ I want to went." }
      ]
    },

    {
      id: "sentences20",
      title: "3. 20 câu rất thường dùng",
      blocks: [
        { type: "sentences", learnable: true, controls: true, items: [
          ["I want to eat.", "Tôi muốn ăn."],
          ["I want to drink something.", "Tôi muốn uống gì đó."],
          ["I want to sleep.", "Tôi muốn ngủ."],
          ["I want to go home.", "Tôi muốn về nhà."],
          ["I want to take a break.", "Tôi muốn nghỉ một chút."],
          ["I want to buy this.", "Tôi muốn mua cái này."],
          ["I want to try it.", "Tôi muốn thử nó."],
          ["I want to see it.", "Tôi muốn xem nó."],
          ["I want to know.", "Tôi muốn biết."],
          ["I want to know more.", "Tôi muốn biết thêm."],
          ["I want to ask you something.", "Tôi muốn hỏi bạn một việc."],
          ["I want to talk to you.", "Tôi muốn nói chuyện với bạn."],
          ["I want to learn English.", "Tôi muốn học tiếng Anh."],
          ["I want to practice English.", "Tôi muốn luyện tiếng Anh."],
          ["I want to speak English better.", "Tôi muốn nói tiếng Anh tốt hơn."],
          ["I want to change it.", "Tôi muốn thay đổi nó."],
          ["I want to check it.", "Tôi muốn kiểm tra nó."],
          ["I want to do it myself.", "Tôi muốn tự làm nó."],
          ["I want to help you.", "Tôi muốn giúp bạn."],
          ["I want to understand this.", "Tôi muốn hiểu cái này."]
        ]}
      ]
    },

    {
      id: "want-vs-id-like",
      title: "4. I want to và I’d like to khác nhau thế nào?",
      blocks: [
        { type: "paragraph", html: "<p>Hai câu đều có thể dịch là <b>“Tôi muốn…”</b>, nhưng sắc thái khác nhau.</p>" },
        { type: "compare", leftTitle: "I want to...", rightTitle: "I’d like to...", leftHtml: "<b>Trực tiếp hơn.</b>", rightHtml: "<b>Mềm và lịch sự hơn.</b>" },
        { type: "sentences", items: [
          ["I want to buy this.", "Tôi muốn mua cái này."],
          ["I’d like to buy this.", "Tôi muốn mua cái này."]
        ]},
        { type: "paragraph", html: "<p>Trong gia đình, bạn bè: <b>I want to eat.</b> hoàn toàn tự nhiên.</p><p>Nhưng khi nói với nhân viên, khách hàng hoặc người lạ: <b>I’d like to order this.</b> thường lịch sự hơn.</p>" },
        { type: "callout", tone: "green", html: "<b>I want to = Tôi muốn</b><br><b>I’d like to = Tôi muốn, nhưng lịch sự hơn</b>" }
      ]
    },

    {
      id: "want-noun",
      title: "5. I want + danh từ",
      blocks: [
        { type: "paragraph", html: "<p>Nếu phía sau là <b>động từ</b>:</p>" },
        { type: "formula", text: "I want to + động từ" },
        { type: "sentences", items: [
          ["I want to eat.", "Tôi muốn ăn."]
        ]},
        { type: "paragraph", html: "<p>Nhưng nếu phía sau là đồ vật / danh từ, không dùng <code>to</code>.</p>" },
        { type: "formula", text: "I want + danh từ" },
        { type: "sentences", items: [
          ["I want water.", "Tôi muốn nước."],
          ["I want some coffee.", "Tôi muốn một ít cà phê."],
          ["I want this one.", "Tôi muốn cái này."],
          ["I want a new phone.", "Tôi muốn một chiếc điện thoại mới."]
        ]},
        { type: "compare", leftTitle: "I want + danh từ", rightTitle: "I want to + động từ", leftHtml: "I want coffee.<br><span data-vi-only>Tôi muốn cà phê.</span>", rightHtml: "I want to drink coffee.<br><span data-vi-only>Tôi muốn uống cà phê.</span>" }
      ]
    },

    {
      id: "negative",
      title: "6. Dạng phủ định",
      blocks: [
        { type: "formula", text: "I don’t want to + động từ", note: "= Tôi không muốn…" },
        { type: "sentences", items: [
          ["I don’t want to go.", "Tôi không muốn đi."],
          ["I don’t want to eat.", "Tôi không muốn ăn."],
          ["I don’t want to wait.", "Tôi không muốn chờ."],
          ["I don’t want to work today.", "Hôm nay tôi không muốn làm việc."],
          ["I don’t want to do that.", "Tôi không muốn làm việc đó."]
        ]},
        { type: "callout", tone: "green", html: "Câu rất đáng học thuộc:<br><strong>I don’t want to do that.</strong>" }
      ]
    },

    {
      id: "questions",
      title: "7. Hỏi người khác",
      blocks: [
        { type: "paragraph", html: "<p>Đổi <code>I</code> thành <code>you</code>:</p>" },
        { type: "formula", text: "Do you want to + động từ?", note: "= Bạn có muốn… không?" },
        { type: "sentences", items: [
          ["Do you want to eat?", "Bạn muốn ăn không?"],
          ["Do you want to go?", "Bạn muốn đi không?"],
          ["Do you want to try it?", "Bạn muốn thử không?"],
          ["Do you want to come with me?", "Bạn muốn đi cùng tôi không?"],
          ["Do you want to take a break?", "Bạn muốn nghỉ một chút không?"],
          ["Do you wanna go?", "Cách nói nhanh, thân mật của “Do you want to go?”"]
        ]}
      ]
    },

    {
      id: "wh-questions",
      title: "8. Câu hỏi với What",
      blocks: [
        { type: "formula", text: "What do you want to do?", note: "= Bạn muốn làm gì?" },
        { type: "callout", tone: "purple", html: "Đây là một câu cực kỳ quan trọng." },
        { type: "sentences", items: [
          ["What do you want to eat?", "Bạn muốn ăn gì?"],
          ["What do you want to drink?", "Bạn muốn uống gì?"],
          ["Where do you want to go?", "Bạn muốn đi đâu?"],
          ["When do you want to leave?", "Bạn muốn đi lúc nào?"],
          ["Who do you want to talk to?", "Bạn muốn nói chuyện với ai?"]
        ]}
      ]
    },

    {
      id: "daily-life",
      title: "9. Dùng trong cuộc sống hằng ngày",
      blocks: [
        { type: "sentences", items: [
          ["I want to sleep a little longer.", "Tôi muốn ngủ thêm một chút."],
          ["I want to go home and relax.", "Tôi muốn về nhà và thư giãn."],
          ["I want to look around first.", "Tôi muốn xem quanh trước."],
          ["I want to eat something.", "Tôi muốn ăn gì đó."],
          ["I want to watch a movie tonight.", "Tối nay tôi muốn xem phim."]
        ]}
      ]
    },

    {
      id: "work",
      title: "10. Dùng trong công việc",
      blocks: [
        { type: "sentences", items: [
          ["I want to check something.", "Tôi muốn kiểm tra một việc."],
          ["I want to make sure it works.", "Tôi muốn chắc chắn rằng nó hoạt động."],
          ["I want to test it again.", "Tôi muốn thử lại."],
          ["I want to understand the problem.", "Tôi muốn hiểu vấn đề."],
          ["I want to talk about this issue.", "Tôi muốn nói về vấn đề này."]
        ]},
        { type: "paragraph", html: "<p>Tuy nhiên, với khách hàng hoặc cấp trên, thường nên đổi:</p>" },
        { type: "sentences", items: [
          ["I want to ask you something.", "Cách nói trực tiếp."],
          ["I’d like to ask you something.", "Nghe mềm hơn."]
        ]}
      ]
    },

    {
      id: "compare-three",
      title: "11. So sánh 3 mẫu bạn đã học",
      blocks: [
        { type: "paragraph", html: "<p>Đây là phần quan trọng nhất.</p>" },
        { type: "sentences", items: [
          ["I’d like to buy a new computer.", "Tôi muốn mua một máy tính mới. — lịch sự."],
          ["I’m going to buy a new computer next month.", "Tháng sau tôi sẽ mua một máy tính mới. — đã có kế hoạch."],
          ["I want to buy a new computer.", "Tôi muốn mua một máy tính mới. — mong muốn trực tiếp."],
          ["I want to buy it.", "Tôi muốn mua nó."],
          ["I’d like to buy it.", "Tôi muốn mua nó. (lịch sự hơn)"],
          ["I’m going to buy it.", "Tôi sẽ mua nó. (đã có ý định)"]
        ]},
        { type: "chips", items: [
          ["I’d like to...", "Tôi muốn… — lịch sự"],
          ["I’m going to...", "Tôi sẽ / tôi định… — kế hoạch"],
          ["I want to...", "Tôi muốn… — trực tiếp"]
        ]}
      ]
    },

    {
      id: "build-longer",
      title: "12. Mở rộng câu từng bước",
      blocks: [
        { type: "sentences", items: [
          ["I want to go.", "Bắt đầu."],
          ["I want to go to the supermarket.", "Thêm địa điểm."],
          ["I want to go to the supermarket tonight.", "Thêm thời gian."],
          ["I want to go to the supermarket tonight to buy some food.", "Thêm mục đích."],
          ["I want to go there tomorrow.", "Một cách mở rộng đơn giản khác."]
        ]},
        { type: "callout", tone: "amber", html: "Đừng cố học nguyên câu dài. Hãy xây từng tầng:<br><b>I want to…</b> → <b>I want to go…</b> → <b>I want to go there…</b> → <b>I want to go there tomorrow.</b>" },
        { type: "builder", title: "Tự ghép câu", base: "I want to" }
      ]
    },

    {
      id: "dialogs",
      title: "13. Hội thoại ngắn",
      blocks: [
        { type: "dialogs", items: [
          { place: "Ăn uống", rows: [
            ["A", "What do you want to eat?", "Bạn muốn ăn gì?"],
            ["B", "I want to eat pizza.", "Tôi muốn ăn pizza."]
          ]},
          { place: "Buổi tối", rows: [
            ["A", "Do you want to go out tonight?", "Tối nay bạn muốn ra ngoài không?"],
            ["B", "Yeah, I want to go somewhere.", "Ừ, tôi muốn đi đâu đó."]
          ]},
          { place: "Cuối tuần", rows: [
            ["A", "What do you want to do this weekend?", "Cuối tuần này bạn muốn làm gì?"],
            ["B", "I want to spend time with my family.", "Tôi muốn dành thời gian với gia đình."]
          ]}
        ]}
      ]
    },

    {
      id: "practice",
      title: "14. 10 câu luyện phản xạ",
      blocks: [
        { type: "paragraph", html: "<p>Hãy nhìn tiếng Việt và nói ngay bằng tiếng Anh.</p>" },
        { type: "quiz" }
      ]
    },

    {
      id: "summary",
      title: "3 mẫu hiện tại cần nhớ như một khối",
      blocks: [
        { type: "chips", items: [
          ["01 — I’d like to + V", "Tôi muốn… (lịch sự)"],
          ["02 — I’m going to + V", "Tôi sẽ / tôi định…"],
          ["03 — I want to + V", "Tôi muốn…"]
        ]},
        { type: "sentences", items: [
          ["I’d like to talk to him.", "Tôi muốn nói chuyện với anh ấy. (lịch sự)"],
          ["I’m going to talk to him.", "Tôi sẽ nói chuyện với anh ấy."],
          ["I want to talk to him.", "Tôi muốn nói chuyện với anh ấy."]
        ]},
        { type: "callout", tone: "green", html: "Mục tiêu là khi nghĩ <b>“Tôi muốn…”</b>, bạn có thể bật ngay:<br><strong>I want to…</strong><br>rồi thay phía sau bằng <b>eat, go, buy, ask, check, try, learn, talk, call, sleep…</b>" }
      ]
    }
  ],

  practice: [
    ["Tôi muốn ăn.", "I want to eat."],
    ["Tôi muốn ngủ.", "I want to sleep."],
    ["Tôi muốn về nhà.", "I want to go home."],
    ["Tôi muốn mua cái này.", "I want to buy this."],
    ["Tôi muốn thử nó.", "I want to try it."],
    ["Tôi muốn biết thêm.", "I want to know more."],
    ["Tôi muốn học tiếng Anh.", "I want to learn English."],
    ["Tôi muốn nói chuyện với bạn.", "I want to talk to you."],
    ["Tôi muốn kiểm tra nó.", "I want to check it."],
    ["Tôi không muốn chờ.", "I don’t want to wait."]
  ],

  dailyFive: [
    "I want to eat.",
    "I want to go home.",
    "I want to know more.",
    "I want to talk to you.",
    "I don’t want to wait."
  ],

  builderGroups: [
    { label: "Động từ / cụm động từ", options: ["eat","sleep","go home","buy this","try it","know more","learn English","talk to you","check it","help you"] },
    { label: "Mở rộng thêm", options: ["tonight","tomorrow","this weekend","a little longer","to the supermarket","with my family","to buy some food"] }
  ],

  dictionary: {
    "i": ["/aɪ/", "tôi", "I want to eat."],
    "want": ["/wɑːnt/", "muốn", "I want to go home."],
    "to": ["/tə/", "đến; để; trước động từ nguyên mẫu", "I want to eat."],
    "wanna": ["/ˈwɑːnə/", "cách nói thân mật của want to", "I wanna go home."],
    "eat": ["/iːt/", "ăn", "I want to eat."],
    "sleep": ["/sliːp/", "ngủ", "I want to sleep."],
    "go": ["/ɡoʊ/", "đi", "I want to go home."],
    "home": ["/hoʊm/", "nhà; về nhà", "I want to go home."],
    "buy": ["/baɪ/", "mua", "I want to buy this."],
    "this": ["/ðɪs/", "này / cái này", "I want to buy this."],
    "learn": ["/lɜːrn/", "học", "I want to learn English."],
    "english": ["/ˈɪŋɡlɪʃ/", "tiếng Anh", "I want to learn English."],
    "rest": ["/rest/", "nghỉ ngơi", "I want to rest."],
    "talk": ["/tɔːk/", "nói chuyện", "I want to talk to you."],
    "you": ["/juː/", "bạn", "I want to talk to you."],
    "drink": ["/drɪŋk/", "uống", "I want to drink something."],
    "something": ["/ˈsʌmθɪŋ/", "một thứ gì đó / điều gì đó", "I want to drink something."],
    "take": ["/teɪk/", "lấy; thực hiện", "I want to take a break."],
    "a": ["/ə/", "một", "take a break"],
    "break": ["/breɪk/", "giờ nghỉ / sự nghỉ", "I want to take a break."],
    "try": ["/traɪ/", "thử", "I want to try it."],
    "it": ["/ɪt/", "nó / việc đó", "I want to try it."],
    "see": ["/siː/", "xem / nhìn thấy", "I want to see it."],
    "know": ["/noʊ/", "biết", "I want to know more."],
    "more": ["/mɔːr/", "thêm / nhiều hơn", "I want to know more."],
    "ask": ["/æsk/", "hỏi", "I want to ask you something."],
    "practice": ["/ˈpræktɪs/", "luyện tập", "I want to practice English."],
    "speak": ["/spiːk/", "nói", "I want to speak English better."],
    "better": ["/ˈbetər/", "tốt hơn", "I want to speak English better."],
    "change": ["/tʃeɪndʒ/", "thay đổi", "I want to change it."],
    "check": ["/tʃek/", "kiểm tra", "I want to check it."],
    "do": ["/duː/", "làm", "I want to do it myself."],
    "myself": ["/maɪˈself/", "tự mình", "I want to do it myself."],
    "help": ["/help/", "giúp", "I want to help you."],
    "understand": ["/ˌʌndərˈstænd/", "hiểu", "I want to understand this."],
    "like": ["/laɪk/", "thích; trong I’d like to là muốn một cách lịch sự", "I’d like to buy this."],
    "order": ["/ˈɔːrdər/", "đặt món / gọi món", "I’d like to order this."],
    "water": ["/ˈwɔːtər/", "nước", "I want water."],
    "some": ["/sʌm/", "một ít / một số", "I want some coffee."],
    "coffee": ["/ˈkɔːfi/", "cà phê", "I want some coffee."],
    "one": ["/wʌn/", "một; cái này / cái kia khi thay danh từ", "I want this one."],
    "new": ["/nuː/", "mới", "I want a new phone."],
    "phone": ["/foʊn/", "điện thoại", "I want a new phone."],
    "don't": ["/doʊnt/", "do not; không", "I don’t want to go."],
    "wait": ["/weɪt/", "chờ", "I don’t want to wait."],
    "work": ["/wɜːrk/", "làm việc", "I don’t want to work today."],
    "today": ["/təˈdeɪ/", "hôm nay", "I don’t want to work today."],
    "that": ["/ðæt/", "đó / việc đó", "I don’t want to do that."],
    "what": ["/wʌt/", "cái gì / điều gì", "What do you want to eat?"],
    "where": ["/wer/", "ở đâu / đi đâu", "Where do you want to go?"],
    "when": ["/wen/", "khi nào", "When do you want to leave?"],
    "who": ["/huː/", "ai", "Who do you want to talk to?"],
    "come": ["/kʌm/", "đến / đi cùng", "Do you want to come with me?"],
    "with": ["/wɪð/", "với / cùng", "come with me"],
    "me": ["/miː/", "tôi (tân ngữ)", "come with me"],
    "leave": ["/liːv/", "rời đi / đi", "When do you want to leave?"],
    "little": ["/ˈlɪtl/", "một chút / nhỏ", "a little longer"],
    "longer": ["/ˈlɔːŋɡər/", "lâu hơn / thêm một chút", "sleep a little longer"],
    "and": ["/ænd/", "và", "go home and relax"],
    "relax": ["/rɪˈlæks/", "thư giãn", "I want to go home and relax."],
    "look": ["/lʊk/", "nhìn / xem", "I want to look around first."],
    "around": ["/əˈraʊnd/", "xung quanh", "look around"],
    "first": ["/fɜːrst/", "trước / đầu tiên", "look around first"],
    "watch": ["/wɑːtʃ/", "xem", "I want to watch a movie tonight."],
    "movie": ["/ˈmuːvi/", "phim", "I want to watch a movie tonight."],
    "tonight": ["/təˈnaɪt/", "tối nay", "I want to watch a movie tonight."],
    "make": ["/meɪk/", "làm / tạo", "I want to make sure it works."],
    "sure": ["/ʃʊr/", "chắc chắn", "make sure"],
    "works": ["/wɜːrks/", "hoạt động", "I want to make sure it works."],
    "test": ["/test/", "thử / kiểm tra", "I want to test it again."],
    "again": ["/əˈɡen/", "lại / một lần nữa", "I want to test it again."],
    "the": ["/ðə/", "mạo từ the", "the problem"],
    "problem": ["/ˈprɑːbləm/", "vấn đề", "I want to understand the problem."],
    "about": ["/əˈbaʊt/", "về", "talk about this issue"],
    "issue": ["/ˈɪʃuː/", "vấn đề", "I want to talk about this issue."],
    "computer": ["/kəmˈpjuːtər/", "máy tính", "a new computer"],
    "next": ["/nekst/", "tiếp theo / sau", "next month"],
    "month": ["/mʌnθ/", "tháng", "next month"],
    "going": ["/ˈɡoʊɪŋ/", "đi; trong be going to là sẽ / định", "I’m going to buy it."],
    "supermarket": ["/ˈsuːpərˌmɑːrkɪt/", "siêu thị", "I want to go to the supermarket."],
    "there": ["/ðer/", "ở đó / đến đó", "I want to go there tomorrow."],
    "tomorrow": ["/təˈmɑːroʊ/", "ngày mai", "I want to go there tomorrow."],
    "food": ["/fuːd/", "đồ ăn / thực phẩm", "buy some food"],
    "pizza": ["/ˈpiːtsə/", "pizza", "I want to eat pizza."],
    "out": ["/aʊt/", "ra ngoài", "go out tonight"],
    "yeah": ["/jeə/", "ừ / vâng (thân mật)", "Yeah."],
    "somewhere": ["/ˈsʌmwer/", "đâu đó", "I want to go somewhere."],
    "weekend": ["/ˌwiːkˈend/", "cuối tuần", "this weekend"],
    "spend": ["/spend/", "dành (thời gian / tiền)", "spend time"],
    "time": ["/taɪm/", "thời gian", "spend time"],
    "family": ["/ˈfæməli/", "gia đình", "my family"],
    "my": ["/maɪ/", "của tôi", "my family"],
    "him": ["/hɪm/", "anh ấy / ông ấy (tân ngữ)", "talk to him"],
    "call": ["/kɔːl/", "gọi", "call him"]
  },

  phrases: {
    "i want to": ["/aɪ wɑːnt tə/", "tôi muốn…", "I want to learn English."],
    "want to": ["/wɑːnt tə/", "muốn làm gì đó", "I want to go home."],
    "i wanna": ["/aɪ ˈwɑːnə/", "cách nói thân mật của I want to", "I wanna eat."],
    "go home": ["/ɡoʊ hoʊm/", "về nhà", "I want to go home."],
    "take a break": ["/teɪk ə breɪk/", "nghỉ một chút", "I want to take a break."],
    "know more": ["/noʊ mɔːr/", "biết thêm", "I want to know more."],
    "talk to": ["/tɔːk tə/", "nói chuyện với", "I want to talk to you."],
    "learn english": ["/lɜːrn ˈɪŋɡlɪʃ/", "học tiếng Anh", "I want to learn English."],
    "practice english": ["/ˈpræktɪs ˈɪŋɡlɪʃ/", "luyện tiếng Anh", "I want to practice English."],
    "speak english better": ["/spiːk ˈɪŋɡlɪʃ ˈbetər/", "nói tiếng Anh tốt hơn", "I want to speak English better."],
    "do it myself": ["/duː ɪt maɪˈself/", "tự làm nó", "I want to do it myself."],
    "i don't want to": ["/aɪ doʊnt wɑːnt tə/", "tôi không muốn…", "I don’t want to wait."],
    "do you want to": ["/duː juː wɑːnt tə/", "bạn có muốn… không?", "Do you want to eat?"],
    "what do you want to do": ["/wʌt duː juː wɑːnt tə duː/", "bạn muốn làm gì?", "What do you want to do?"],
    "look around": ["/lʊk əˈraʊnd/", "xem quanh", "I want to look around first."],
    "make sure": ["/meɪk ʃʊr/", "đảm bảo / chắc chắn", "I want to make sure it works."],
    "talk about": ["/tɔːk əˈbaʊt/", "nói về", "I want to talk about this issue."],
    "new computer": ["/nuː kəmˈpjuːtər/", "máy tính mới", "I want to buy a new computer."],
    "go to the supermarket": ["/ɡoʊ tə ðə ˈsuːpərˌmɑːrkɪt/", "đi siêu thị", "I want to go to the supermarket."],
    "go out": ["/ɡoʊ aʊt/", "ra ngoài", "Do you want to go out tonight?"],
    "this weekend": ["/ðɪs ˌwiːkˈend/", "cuối tuần này", "What do you want to do this weekend?"],
    "spend time": ["/spend taɪm/", "dành thời gian", "I want to spend time with my family."]
  }
};
