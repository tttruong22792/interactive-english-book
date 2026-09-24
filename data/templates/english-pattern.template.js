/*
HOW TO ADD AN ENGLISH PATTERN
1. Copy this file to data/english/patterns/00X.js
2. Change id/order/title/content.
3. Add ONE metadata entry to data/content-index.js.
4. Do not edit app.js for another lesson using renderer: "english-pattern".
*/

window.CONTENT_REGISTRY = window.CONTENT_REGISTRY || {};

window.CONTENT_REGISTRY["en-pattern-XXX"] = {
  id: "en-pattern-XXX",
  language: "en",
  category: "patterns",
  renderer: "english-pattern",
  order: 0,
  title: "Your pattern…",
  meaning: "Nghĩa tiếng Việt",
  sourceVersion: 1,

  ui: {
    eyebrow: "MẪU CÂU SỐ X",
    meaningTitle: "Mô tả ngắn",
    leadHtml: "<strong>Your pattern = nghĩa</strong>",
    formula: "Your pattern + ...",
    introNoteHtml: "Ghi chú học theo cụm.",
    sourceNote: "Nguồn nội dung.",

    pronunciation: {
      title: "1. Cách đọc",
      phrase: "Your pattern",
      ipa: "/.../",
      vnReadingHtml: "Cách đọc gần đúng",
      naturalIntro: "Khi nói tự nhiên:",
      naturalReading: "...",
      naturalVi: "...",
      exampleTitle: "Ví dụ",
      exampleSentence: "Example.",
      exampleMeaning: "Nghĩa / cách đọc",
      contractionTitle: "2. Giải thích cấu trúc",
      contractionIntroHtml: "Giải thích.",
      contractionCalloutHtml: "Điểm cần nhớ.",
      contrastSentences: [],
      contrastNote: ""
    },

    comparison: {
      title: "3. So sánh",
      intro: "",
      examples: [],
      leftTitle: "A",
      rightTitle: "B",
      leftText: "",
      rightText: "",
      homeLabel: "",
      homeSentence: ["", ""],
      publicLabel: "",
      publicSentence: ["", ""],
      noteHtml: ""
    },

    masterList: { title: "4. Câu cần thuộc", intro: "" },

    work: {
      title: "5. Trong công việc",
      intro: "",
      calloutEyebrow: "CÂU NÊN THUỘC",
      calloutSentence: "",
      calloutMeaning: ""
    },

    restaurant: {
      title: "6. Trong tình huống đời sống",
      intro: "",
      formula: "",
      formulaNote: "",
      leftTitle: "",
      rightTitle: "",
      leftExample: "",
      rightExample: ""
    },

    builder: {
      title: "7. Mở rộng câu",
      intro: "",
      summaryHtml: "",
      note: "",
      labEyebrow: "SENTENCE BUILDER",
      labTitle: "Tự ghép câu",
      dialogTitle: "8. Hội thoại",
      base: "Your pattern"
    },

    questions: {
      title: "9. Câu hỏi / biến thể",
      formula: "",
      formulaNote: "",
      answerIntro: "",
      answers: []
    },

    quiz: { title: "10. Bài luyện hôm nay", intro: "" },

    daily: {
      eyebrow: "CÁCH HỌC HÔM NAY",
      title: "Chọn 5 câu.",
      intro: "",
      formula: "",
      goalHtml: "",
      nextEyebrow: "BÀI TIẾP THEO",
      nextTitle: "",
      nextMeaning: "",
      nextNote: ""
    }
  },

  introExamples: [],
  sentences20: [],
  work: [],
  restaurantNouns: [],
  buildSteps: [],
  dialogs: [],
  questions: [],
  practice: [],
  dailyFive: [],
  builderGroups: [],
  dictionary: {},
  phrases: {}
};
