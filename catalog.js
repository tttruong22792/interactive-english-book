window.PATTERN_CATALOG = Array.from({ length: 80 }, (_, index) => {
  const id = index + 1;
  if (id === 1) return {
    id, title: "I’d like to…", meaning: "Tôi muốn… / Tôi muốn được…", status: "available",
    description: "Mẫu câu lịch sự, tự nhiên để nói điều bạn muốn."
  };
  if (id === 2) return {
    id, title: "I need to…", meaning: "Tôi cần phải…", status: "next",
    description: "Mẫu tiếp theo được giới thiệu ở cuối Mẫu 01."
  };
  return { id, title: `Mẫu câu ${String(id).padStart(2, "0")}`, meaning: "Chưa nhập nội dung", status: "planned", description: "Khung đã sẵn sàng để thêm nội dung sau." };
});
