# Language Studio Content Schema

## Mục tiêu

Nội dung bài học đã được tách khỏi engine. Từ bây giờ, thêm một bài mới dùng renderer đã có **không cần sửa `app.js`**.

## Cấu trúc

```text
data/
├── content-index.js
├── content-loader.js
├── english/
│   └── patterns/
│       └── 001.js
├── japanese/
│   └── daily-life/
│       └── 001.js
└── templates/
    ├── english-pattern.template.js
    └── japanese-lesson.template.js
```

## 1. Content index

`data/content-index.js` chỉ giữ metadata:

- `id`
- `language`
- `category`
- `order`
- `title`
- `meaning`
- `status`
- `renderer`
- `source`
- `route`

App dùng index để dựng thư viện và biết file nào cần tải.

## 2. Content registry

Mỗi file lesson tự đăng ký vào:

```js
window.CONTENT_REGISTRY["en-pattern-003"] = {
  id: "en-pattern-003",
  language: "en",
  renderer: "english-pattern"
};
```

## 3. Content loader

`data/content-loader.js` chỉ tải file khi người dùng mở nội dung đó.

## Thêm English pattern mới

1. Copy:
   `data/templates/english-pattern.template.js`
2. Save thành:
   `data/english/patterns/003.js`
3. Điền nội dung.
4. Thêm metadata vào `data/content-index.js`.
5. Đặt:
   - `status: "available"`
   - `renderer: "english-pattern"`
   - `source: "./data/english/patterns/003.js"`

Không sửa `app.js`.

## Thêm Japanese lesson

Có thể tạo các nhóm:

```text
data/japanese/daily-life/
data/japanese/work/
data/japanese/service/
data/japanese/school/
data/japanese/hospital/
```

Copy template Japanese rồi thêm metadata vào content index.

## Khi nào mới sửa app.js?

Chỉ khi tạo **loại bài hoàn toàn mới**, ví dụ:

- reading passage + comprehension
- listening dictation
- kanji trainer
- pronunciation scoring
- grammar visualizer

Khi đó hãy tạo một renderer tái sử dụng cho cả một loại bài, không viết code riêng cho từng lesson.

## Quy ước ID

- `en-pattern-001`
- `en-conversation-001`
- `en-vocab-001`
- `ja-daily-001`
- `ja-work-001`
- `ja-service-001`

Không đổi ID sau khi người dùng đã có progress gắn với nội dung đó.
