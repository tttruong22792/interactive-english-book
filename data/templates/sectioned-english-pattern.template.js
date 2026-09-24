/*
SECTIONED ENGLISH PATTERN TEMPLATE

Use this when a lesson has many custom sections and does not fit the fixed
Pattern 01 layout.

Steps:
1. Copy to data/english/patterns/00X.js
2. Change id/order/title/meaning/content.
3. Add metadata to data/content-index.js.
4. Keep renderer: "english-pattern" and layout: "sectioned-pattern".
5. Do not edit app.js unless you need a genuinely new block type.
*/

window.CONTENT_REGISTRY = window.CONTENT_REGISTRY || {};

window.CONTENT_REGISTRY["en-pattern-XXX"] = {
  id: "en-pattern-XXX",
  language: "en",
  category: "patterns",
  renderer: "english-pattern",
  layout: "sectioned-pattern",
  order: 0,
  title: "Your pattern…",
  meaning: "Nghĩa tiếng Việt",
  description: "",
  sourceVersion: 1,

  ui: {
    eyebrow: "MẪU CÂU SỐ X",
    meaningTitle: "Mô tả ngắn",
    leadHtml: "<strong>Your pattern = nghĩa</strong>",
    formula: "Your pattern + động từ",
    introNoteHtml: "Điểm cần nhớ.",
    sourceNote: "Nguồn nội dung."
  },

  introExamples: [
    ["Example sentence.", "Nghĩa."]
  ],

  sections: [
    {
      id: "section-1",
      title: "1. Tiêu đề",
      blocks: [
        { type: "paragraph", html: "<p>Giải thích.</p>" },
        { type: "formula", text: "Pattern + V", note: "Ghi chú." },
        { type: "sentences", items: [["Example.", "Nghĩa."]] },
        { type: "callout", tone: "green", html: "<b>Điểm cần nhớ</b>" }
      ]
    },
    {
      id: "sentences20",
      title: "2. Câu cần thuộc",
      blocks: [
        {
          type: "sentences",
          learnable: true,
          controls: true,
          items: []
        }
      ]
    },
    {
      id: "practice",
      title: "Bài luyện",
      blocks: [
        { type: "quiz" }
      ]
    }
  ],

  practice: [],
  dailyFive: [],
  builderGroups: [],

  dictionary: {},
  phrases: {}
};

/*
BLOCK TYPES

paragraph:
{ type:"paragraph", html:"<p>...</p>" }

formula:
{ type:"formula", text:"I’m going to + V", note:"..." }

sentences:
{ type:"sentences", items:[["English.", "Nghĩa."]] }

learnable sentences:
{ type:"sentences", learnable:true, controls:true, items:[...] }

callout:
{ type:"callout", tone:"green|amber|purple|bad", html:"..." }

chips:
{ type:"chips", items:[["today","hôm nay"]] }

compare:
{ type:"compare", leftTitle:"A", rightTitle:"B", leftHtml:"...", rightHtml:"..." }

builder:
{ type:"builder", title:"Luyện ghép câu", base:"I’m going to" }

dialogs:
{
  type:"dialogs",
  items:[
    { place:"At work", rows:[["A","English","Nghĩa"],["B","English","Nghĩa"]] }
  ]
}

quiz:
{ type:"quiz" }
*/
