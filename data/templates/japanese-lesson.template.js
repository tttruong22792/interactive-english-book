/*
HOW TO ADD A JAPANESE PHRASE LESSON
1. Copy into data/japanese/<category>/00X.js
2. Change metadata and phrases.
3. Add the metadata entry to data/content-index.js.
4. Keep renderer: "japanese-phrases" for this lesson type.
*/

window.CONTENT_REGISTRY = window.CONTENT_REGISTRY || {};

window.CONTENT_REGISTRY["ja-category-XXX"] = {
  id: "ja-category-XXX",
  language: "ja",
  category: "daily-life",
  renderer: "japanese-phrases",
  order: 0,
  title: "Japanese lesson title",
  meaning: "Mô tả tiếng Việt",
  description: "",
  sourceVersion: 1,

  phrases: [
    ["日本語", "Romaji", "Nghĩa tiếng Việt"]
  ]
};
