window.CONTENT_INDEX_VERSION = 1;

window.CONTENT_INDEX = [
  {
    id: "en-pattern-001",
    language: "en",
    category: "patterns",
    order: 1,
    title: "I’d like to…",
    meaning: "Tôi muốn… / Tôi muốn được…",
    description: "Mẫu câu lịch sự, tự nhiên để nói điều bạn muốn.",
    status: "available",
    renderer: "english-pattern",
    source: "./data/english/patterns/001.js",
    route: "lesson/1",
    accent: "purple",
    featured: true
  },
  {
    id: "en-pattern-002",
    language: "en",
    category: "patterns",
    order: 2,
    title: "I need to…",
    meaning: "Tôi cần phải…",
    description: "Mẫu tiếp theo được giới thiệu ở cuối Mẫu 01.",
    status: "next",
    renderer: "english-pattern",
    source: null,
    route: "patterns",
    accent: "yellow",
    featured: true
  },
  {
    id: "ja-daily-001",
    language: "ja",
    category: "daily-life",
    order: 1,
    title: "Daily Japanese Starter",
    meaning: "5 câu tiếng Nhật dùng hằng ngày",
    description: "Khung đầu tiên cho track tiếng Nhật sinh hoạt tại Nhật.",
    status: "available",
    renderer: "japanese-phrases",
    source: "./data/japanese/daily-life/001.js",
    route: "japanese",
    accent: "green",
    featured: true
  }
];
