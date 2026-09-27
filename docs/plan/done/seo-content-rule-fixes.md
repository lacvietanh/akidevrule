# SEO/content rule fixes — P1–P5

**Status: DONE 2026-09-27** — P2 and P3 executed in the working tree (not yet committed); P1, P4 shipped earlier in the same tree; P5 rejected as recorded below.

## Context

Nguồn: phiên `claude --resume 95a3bbfb-46e2-43ec-b61c-c8bb90ed93ff` (repo `kinhdich.akinet.me`), phát sinh khi soát lỗi trong hai bài tin tức 2.20.0 (URL ogImage tuyệt đối, cụm "(hoan sao)" chèn vào thân bài, câu văn vụng/sai sự thật). Phiên đó ghi lại 5 điểm cần sửa (P1–P5) trong bộ rule dùng chung, rồi bị chặn bởi safety classifier (`[reasoning_extraction]`) khi cố ghi lại toàn bộ quá trình suy nghĩ ra file — nên đúc kết lại ở đây, trong repo nguồn của rule, thay vì trong repo dự án.

Không phải audit theo `docs.C2` (không quét toàn bộ, chỉ đúc kết 5 điểm phát sinh từ sự cố cụ thể) — nên đi thẳng plan, không cần cặp research trước.

## P1 — SEO URL: relative-at-rest, absolute chỉ ở điểm phát ra

**Trạng thái: DONE**, đã áp trong working tree hiện tại (chưa commit):
- `payload/RULE-seo.md` — thêm `A6. URL form — relative at rest, absolute only at emission` + dòng validate-seo checklist tương ứng
- `payload/index.md` — cập nhật mô tả `RULE-seo.md` trong manifest

Không cần làm gì thêm cho P1.

## P4 — Skill viết bài: bước đọc lại bản render

**Trạng thái: DONE**, đã áp (Phase 6.5 — "Rendered-output pass" trong `skills/aki-article-writer/references/article-workflow.md` §6.5, dòng ~372-378): grep bản HTML đã build để bắt lỗi URL tuyệt đối, và đọc lại toàn văn như người đọc thật trước khi báo xong.

Không cần làm gì thêm cho P4.

## P5 — REJECTED: không thêm rule gốc "làm theo mục đích của rule" (`agent.B6`)

Đề xuất ban đầu: một mục core mới nói rule/tiền lệ nào cũng có mục đích, làm đúng chữ mà phá mục đích thì mục đích thắng.

**Lý do bác bỏ**: khi soát lại (xem P3), y hệt lỗi P5 định sửa — dựng thêm một tầng triết lý mà nội dung đã có sẵn:

| Nguyên lý định thêm | Đã có ở |
|---|---|
| Không suy đoán, làm đúng bằng chứng | `agent.B2` |
| Code/tiền lệ có sẵn không tự động là bằng chứng đúng | `agent.B2` (dẫn nguồn), `coding.A3` (source of truth ordering) |

Cả 3 lỗi gốc (URL, "(hoan sao)", câu vụng) không đến từ thiếu nguyên lý chung — đến từ (a) một rule sai cụ thể (`seo.B3`, xem P2) và (b) thiếu một bước kiểm cụ thể (đọc bản render — đã vá ở P4, và một lượt quét fact-check — xem P3). Không hành động.

## P3 — content.C2: thêm lượt quét thứ 4 (fact-check khẳng định về sản phẩm)

Đề xuất ban đầu (viết lại `content.A1` thành rule gốc 3 tiên đề: đúng sự thật / viết cho người đọc / tiết kiệm chữ) — **REJECTED cùng lý do P5**: cả 3 tiên đề đã trùng rule có sẵn:

| Tiên đề định thêm | Đã có ở |
|---|---|
| Đúng sự thật, dẫn nguồn | `agent.B2` |
| Viết cho người đọc, giọng bản ngữ | `agent.A4`, `content.A1` hiện có |
| Tiết kiệm chữ | `content.B2` (phép thử xoá câu) |

**Khoảng trống thật duy nhất**: `content.C2` (Content audit) hiện có 3 lượt quét (canonical-term drift, density, i18n coverage) — không lượt nào đối chiếu khẳng định với nguồn. Bài viết akitao từng có fact bịa mà không lượt nào bắt được.

### Việc cần làm

1. **`payload/RULE-content-write.md` §C2** — thêm lượt quét thứ 4:
   > **Fact-check** (`agent.B2`) — mỗi khẳng định về sản phẩm/tính năng phải truy được về repo hoặc trang live của chính sản phẩm đó; không truy được thì là finding.
2. **`payload/RULE-content-write.md` §B3** — xoá bullet FAQ trùng lặp:
   > `- FAQ answers: answer directly in the first sentence — no "Đây là...", "According to..." preamble`

   vì `B2` đã tự ghi "This generalizes B3's FAQ rule to all content" — bullet ở B3 là bản sao chết theo B2.
3. **Giữ nguyên** bullet FAQ ở `seo.B1` (nếu có) — lý do riêng của nó là câu trả lời ngắn để AI trích dẫn được, không trùng lý do của `content.B2`.

## P2 — Xoá `seo.B3` (Vietnamese keyword handling) và mọi bản sao

### Vì sao xoá

Tiền đề gốc của B3 — "Google coi có dấu và không dấu là hai truy vấn khác nhau" — không có căn cứ chính thức nào (theo cả hai chiều); mọi dòng bên dưới đều dựa trên tiền đề này:

| Dòng | Loại lỗi |
|---|---|
| Chèn dạng không dấu trong ngoặc vào thân bài/FAQ | Không có căn cứ, gây hại — người đọc chịu thiệt, máy hưởng lợi chưa ai xác nhận. Đây là nguồn gốc trực tiếp của lỗi "(hoan sao)" trong bài 2.20.0. |
| Đưa vào meta `keywords` | Không có tác dụng — Google đã công bố không dùng meta keywords để xếp hạng (Google Webmaster Central Blog, 09/2009) |
| Đưa vào `alternateName` | Trùng — `seo.B1` đã có đủ biến thể tên thương hiệu (có dấu/không dấu/domain form) |
| Cấm ở H1/H2 | Chết theo dòng 1 — chỉ tồn tại để giới hạn dòng đã sai |
| Meta có dấu, độ phủ không dấu từ schema+body | Nửa đầu hiển nhiên, nửa sau chết theo tiền đề |

*Lưu ý xác minh*: dòng "Google không dùng meta keywords" và "alternateName phục vụ site name" được trích theo trí nhớ trong phiên gốc, chưa mở lại nguồn — nếu cần trích dẫn chính thức trong rule, kiểm lại trước khi ghi làm căn cứ cứng.

### Việc cần làm — xoá tại 4 vị trí

1. `payload/RULE-seo.md` — xoá mục `### B3. Vietnamese keyword handling (vi locale)` (dòng ~115-122 hiện tại), đánh số lại các mục B tiếp theo (B4→B3 …), cập nhật address map ở đầu file (`seo.A1-6 · seo.B1-4 …` → số B mới) và mô tả trong `payload/index.md`.
2. `skills/aki-article-writer/references/article-workflow.md` — xoá §3.4 "Vietnamese dual-coverage (vi locale)" (dòng ~133-140).
3. `skills/aki-article-writer/references/article-workflow.md` — xoá dòng checklist §6.2: `- [ ] Unaccented Vietnamese keyword embedded in parentheses at first occurrence in body / FAQ (vi locale only)` (dòng ~357).
4. Kiểm lại `CLAUDE.md:38` của repo AkiDevRule — phiên gốc nêu vị trí này nhưng grep hiện tại **không thấy** tham chiếu `seo.B3`/"hoan sao"/keyword ở đó; có thể trí nhớ phiên gốc sai hoặc đã lệch dòng. Bỏ qua trừ khi grep lại ra kết quả khác khi thực thi plan này.

Sau khi xoá B3, dòng review §6.5 đã có sẵn ("Any SEO device visible in the text … is listed as a review line, never shipped silently") đủ để bắt lại nếu ai đó lỡ thêm cụm không dấu bằng tay — không cần thay thế bằng rule khác.

## Thứ tự thực thi khi được duyệt

1. Sửa `payload/RULE-content-write.md` (P3, 2 chỗ)
2. Sửa `payload/RULE-seo.md` + `payload/index.md` (P2, xoá B3 + đánh số lại)
3. Sửa `skills/aki-article-writer/references/article-workflow.md` (P2, 2 chỗ)
4. Chạy `node install.mjs` để đồng bộ deployed copy
5. Cập nhật `CHANGELOG.md` theo `RULE-release.md`
6. Không cần sửa gì cho P1, P4, P5 — đã xong hoặc đã bác bỏ có ghi lý do ở trên
