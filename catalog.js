(() => {
  const content = window.CONTENT_INDEX || [];
  const known = new Map(
    content
      .filter(item => item.language === "en" && item.category === "patterns")
      .map(item => [item.order, item])
  );

  window.PATTERN_CATALOG = Array.from({ length: 80 }, (_, index) => {
    const id = index + 1;
    const item = known.get(id);

    if (item) {
      return {
        id,
        contentId: item.id,
        renderer: item.renderer,
        source: item.source,
        title: item.title,
        meaning: item.meaning,
        status: item.status,
        description: item.description || ""
      };
    }

    return {
      id,
      contentId: null,
      title: `Mẫu câu ${String(id).padStart(2, "0")}`,
      meaning: "Chưa nhập nội dung",
      status: "planned",
      description: "Khung đã sẵn sàng để thêm nội dung sau."
    };
  });
})();
