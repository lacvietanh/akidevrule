# Plan — phục vụ rule cho Antigravity (AG / AG IDE / AGY)

> **Trạng thái:** ✅ HOÀN TẤT — verified cross-platform 2026-07-23 (4 surfaces: AG IDE Mac, AGY CLI Linux, Claude Code Mac, Claude Code Linux). · **Mở:** 2026-07-22 **Phạm vi:** mọi thứ liên quan tới việc đưa rule + skills sang phía Antigravity (loại bỏ hooks). **Ngoài phạm vi:** UNIDOC (tạm gác), per-project bootstrap (ngoài luồng, xem §8).

## 0. Vì sao có file này

Nhánh AG trước đây nằm lẫn trong nhật ký chuẩn hoá rule tổng của hệ sinh thái, chung với UNIDOC, per-project, và phía Claude. Kết quả là kẹt: quá nhiều đối tượng trong một mạch, không đối tượng nào xong. Nhánh AG **thuộc về repo này** — nó là việc của một bộ cài đặt public, không phải đặc thù của một hệ sinh thái riêng. Nên nó ra ở riêng.

**Mục tiêu cuối, phát biểu một câu:** sửa một chỗ trong `payload/`, chạy `install.sh` một phát, thì cả Claude lẫn cả ba bề mặt Antigravity đều nhận được cùng bộ rule/skills tương đương.

---

## 1. Ba bề mặt — chốt danh xưng

| Nhãn | Là gì | Lõi | Data dir |
|---|---|---|---|
| **AG** | Antigravity desktop app ("bản trắng") | dùng chung lõi với AGY | `~/.gemini/antigravity/` |
| **AG IDE** | Antigravity IDE ("bản đen"), nền VS Code | **thực thể riêng**, extension host riêng | `~/.gemini/antigravity-ide/` |
| **AGY** | AGY CLI (`agy`, v1.1.5) | dùng chung lõi với AG | `~/.gemini/antigravity-cli/` |

Bằng chứng chung lõi: bảng string của `language_server` (AG desktop) gần như trùng khít binary `agy` — cùng bộ proto `gemini_coder`, cùng hằng `~/.gemini/config`.

**Ba bề mặt ở ba nhịp phát hành khác nhau** (AGY 2026-07-22, AG 2026-07-16, AG IDE 2026-06-17). Đây không phải chi tiết vụn: một bug đã sửa ở AGY vẫn có thể còn sống ở hai bề mặt kia (xem §5, vụ symlink).

---

## 2. Câu chuyện nạp rule — ĐÃ GIẢI

Đây là chỗ tốn nhiều công nhất và từng dẫn tới một kết luận sai hoàn toàn. Ghi lại đầy đủ để không ai phải đi lại.

### 2.1 Mâu thuẫn

- **Quan sát thực nghiệm:** `~/.gemini/GEMINI.md` **có được nạp**, ở cả ba bề mặt — dấu vân tay `[AKIRULE-AG-OVERRIDES-V<date>]` xuất hiện trong context.
- **Spec vendor ship kèm `agy`** (`agy-customizations/SKILL.md`) nói global root là `~/.gemini/config/`, và `GEMINI.md`/`AGENTS.md` được tìm bằng cách đi từ CWD ngược lên repo root — đường đi đó **không bao giờ chạm `$HOME`**.

### 2.2 Lời giải: **có HAI hệ thống phát hiện khác nhau, trước đây bị gộp làm một**

| Hệ thống | Root | Chứa gì |
|---|---|---|
| **Customizations** | `~/.gemini/config/` | skills · plugins · hooks · mcp · agents · `rules/*.md` |
| **Directory rules** | phân cấp CWD→repo root, **cộng thêm một file global có tài liệu chính thức** | `GEMINI.md` / `AGENTS.md` — markdown trần, không frontmatter, luôn active |

Spec bundled **không sai, chỉ thiếu**: mục "Discovery Locations" của nó chỉ nói về customizations root. Doc chính thức của vendor (`antigravity.google/docs/rules-workflows`) ghi thẳng: **Global Rules = `~/.gemini/GEMINI.md`**, và UI của IDE (Rules panel → *+ Global*) ghi đúng file đó.

Thêm một đường thứ hai cùng đích: `~/.gemini/` **bản thân nó cũng là một customization root** với AGY và AG IDE (không với AG desktop) — một `GEMINI.md` ở đỉnh root là `topLevelFileCustomization` (symbol có thật trong binary).

### 2.3 Bằng chứng nó được **inject**, không phải model tự đi đọc

Trong transcript của AGY: ở bước 5, **không có `VIEW_FILE` nào trước đó**, model đã liệt kê các rule và trích đúng chuỗi marker **có số version**. File bootstrap trong workspace chỉ chứa tiền tố không số, nên phần số chỉ có thể đến từ `~/.gemini/GEMINI.md`. Ở bước 7, chính `thinking` của model gọi tên container: **`<user_rules>`**. Transcript AG IDE cũng có marker tương tự.

Trong binary, rule được gọi nội bộ là **"memories"**: `memories_to_system_prompt`, `rule_file_uris`, `num_global_rules` (bộ đếm telemetry **riêng cho rule global** — bằng chứng gián tiếp rằng rule global là một hạng mục first-class).

### 2.4 ⚠️ Rủi ro mới phát hiện: **rule bị cắt cụt im lặng**

`customization_budget`, `truncatableItem`, `truncateFromBreakdown`, `HasTruncatedCustomizationType` — đều là symbol thật. **Vượt ngân sách thì rule bị cắt, không có cảnh báo nào.** Giới hạn "12.000 ký tự mỗi file rule" trong doc không có literal tương ứng trong binary → nhiều khả năng cưỡng chế phía server hoặc phía UI.

> **Đính chính 2026-09-26** (đo thật, 26 lượt agy, `docs/research/rule-delivery-force-load-sep25.md`): không có trần 12.000 ký tự mỗi file. Ngân sách là **một tổng chung khoảng 43 KB cho mọi rule `always_on`**; vượt thì **rớt nguyên file, file to rớt trước**, không cảnh báo. Rule `model_decision` không bao giờ được nhét sẵn và không có giới hạn kích thước — vào context khi model tự `view_file`. `GEMINI.md` không tính vào ngân sách này. Hệ quả bên dưới vẫn đúng, lý do đổi.

**Hệ quả thiết kế, phải tuân:** file always-on phải **ngắn**. Mọi thứ không cần trên-mọi-lượt phải đẩy sang `trigger: glob` hoặc `model_decision`. Đây là ràng buộc mạnh nhất chi phối §4.

### 2.5 Còn chưa biết

**Thứ tự ưu tiên giữa `~/.gemini/GEMINI.md` và `~/.gemini/config/AGENTS.md`.** Không có literal nào trong hai binary sắp thứ tự chúng. Hai điều *biết chắc*: rule được **khử trùng lặp theo path đã giải** (không bao giờ inject hai lần), và chúng được **hợp nhất chứ không đè nhau** — chữ "override" trong bảng ưu tiên nói về **trùng tên** (hai skill cùng tên), mà file rule markdown thì không có tên để trùng. → Nhiều khả năng cả hai đều được nạp và thứ tự chỉ là hình thức.

**Thí nghiệm canary phân giải một lần cho xong** (rẻ, làm trước khi code bất cứ thứ gì ở §4):

1. Đặt `RULE_A_MARKER` vào `~/.gemini/GEMINI.md`, `RULE_B_MARKER` (nội dung mâu thuẫn) vào `~/.gemini/config/AGENTS.md`.
2. Mở `agy` từ một thư mục tạm trống, **không có `GEMINI.md`**.
3. Hỏi: *"trích ra mọi chuỗi marker rule trong context của bạn, theo đúng thứ tự"*.
4. Lặp lại với AG và AG IDE.

Trả lời được cùng lúc hai câu: `config/AGENTS.md` có được đọc không, và thứ tự ra sao.

> **Bài học ghi lại vì nó sẽ lặp:** đọc string trong binary chỉ chứng minh *hằng đó tồn tại*, không chứng minh *đường nào thực sự chạy*. Ở vùng công cụ thay đổi nhanh này, **quan sát runtime thắng suy luận tĩnh**, và trọng tài là canary.

---

## 3. Điều AG có mà Claude không có — và nó lật ngược một giả định

**`always_on` là literal có thật**, thuộc về **rule, không phải skill**.

Enum đầy đủ trong binary (5 giá trị, 4 dùng được): `CORTEX_MEMORY_TRIGGER_{UNSPECIFIED, ALWAYS_ON, GLOB, MANUAL, MODEL_DECISION}`. Template mặc định nhúng trong binary khi tạo rule mới chính là `trigger: always_on` — tức **vendor lấy always-on làm mặc định**.

| Trigger | Nạp khi nào | Tương đương phía Claude |
|---|---|---|
| `always_on` | vô điều kiện, mọi lượt | `@import` trong `CLAUDE.md` |
| `glob` | khi file khớp `globs:` được đụng tới | **không có tương đương** |
| `model_decision` | model tự quyết theo `description` | skill progressive disclosure |
| `manual` | user `@mention` | gọi skill bằng tên |

**Skill của AG thì chỉ có progressive disclosure** — frontmatter đúng **hai** trường bắt buộc, `name` và `description`, **không có** `trigger`/`allowed-tools`/`version`. Giống hệt Claude.

### Hai hệ quả lớn

1. **Router `akirule` không cần tồn tại ở phía AG.** Bên Claude phải có một skill làm nhiệm vụ định tuyến vì skill là cơ chế duy nhất, và nó là bước mềm có thể trượt. Bên AG, đặt thẳng text vào `rules/*.md` với `always_on` là xong — **ít bước mềm hơn phía Claude**, chứ không phải nhiều hơn. Toàn bộ trực giác "AG yếu hơn nên phải bù" là sai ở tầng cơ chế; chỗ AG yếu là **tuân thủ văn bản** (§7), không phải khả năng nạp.
2. **`glob` mạnh hơn mọi thứ phía Claude đang có.** `RULE-stack-*.md` và `RULE-coding.md` ánh xạ tự nhiên sang `trigger: glob` + `globs:` — nạp vô điều kiện *khi liên quan*, **zero phán đoán của model**. Đây là thứ nên khai thác chứ không chỉ là "cho bằng phía Claude".

---

## 4. Kiến trúc đích — `install.sh` ghi những gì

| Đường dẫn | Nội dung | Trạng thái |
|---|---|---|
| `~/.gemini/GEMINI.md` | rule always-on, **giữ ngắn** (§2.4) | ✅ đã có |
| `~/.gemini/GEMINI.local.md` | máy-cục-bộ, nối verbatim | ✅ đã có · ⚠️ cân nhắc dời, xem dưới |
| `~/.gemini/config/skills/<name>/SKILL.md` | skills global | ✅ đã có — rsync trực tiếp từ claude/skills/ |
| `~/.gemini/config/rules/*.md` | rule có frontmatter (`glob`/`model_decision`) | ✅ đã có — 13 rules với YAML trigger frontmatter |
| `~/.gemini/config/skills.json` | trỏ tới cây skill trong `~/.aki/claudedoc/` | ✅ đã có — dual path (absolute + tilde) |

### 4.1 `~/.gemini/config/` là đường duy nhất cả ba bề mặt cùng đọc

| Đường dẫn | AG | AGY | AG IDE |
|---|---|---|---|
| `~/.gemini/config/skills/` | ✅ | ✅ | ✅ |
| `~/.gemini/antigravity/skills/` | ✅ | ❌ | ✅ |
| `~/.gemini/antigravity-cli/skills/` | ❌ | ✅ | ✅ |
| `~/.gemini/skills/` | ❌ | ✅ | ✅ |
| `<repo>/.agents/skills/` | ✅ | ✅ | ✅ |

→ **Ghi một chỗ, cả ba nhận. Không cần bản sao theo bề mặt, không cần symlink.** Changelog AGY 1.1.0 xác nhận vendor coi `~/.gemini/config/` là root global được quét lúc khởi động.

### 4.2 Cấm ghi vào

- `~/.gemini/antigravity*/builtin/` — **vendor quản lý và chủ động dọn rác** (có `.checksum` + thông báo lỗi "failed to clean up stale builtin directory"). Ghi vào đây là mất khi update.
- `~/.gemini/config/config.json`, `~/.gemini/settings.json`, `~/.gemini/antigravity-cli/settings.json` — state của vendor/user (auth, allowlist, statusline, hostname). **Không đụng.**
- `~/.gemini/antigravity{,-ide,-cli}/` nói chung — app tự ghi đè.

### 4.3 Cần khởi động lại

**Có, ở mọi bề mặt.** Phát hiện skill là một pass **lúc khởi động** (AGY 1.1.3 chuyển nó sang async nhưng vẫn là pass khởi động). Sửa `~/.gemini/GEMINI.md` chỉ có hiệu lực ở hội thoại mới.

→ `install.sh` **phải in ra dòng nhắc khởi động lại**, nếu không user sẽ tưởng cài hỏng.

---

## 5. Quyết định cấu trúc quan trọng nhất: `skills.json` inheritance, KHÔNG symlink

**Không được symlink thư mục rules.** Changelog AGY 1.1.3: *"Fixed customization rules being loaded twice when a rules directory is reachable through a symlink."* Đã sửa ở 1.1.3 — nhưng AG desktop và AG IDE ở **nhịp phát hành khác** (§1) và có thể vẫn còn bug. Nạp đúp rule là hỏng ngầm.

Cách "symlink" đúng ở đây là **kế thừa qua file cấu hình**:

```json
// ~/.gemini/config/skills.json
{ "entries": [ { "path": "~/.aki/claudedoc/agskills" } ] }
```

Một file bé xíu, idempotent tuyệt đối; **nội dung thật nằm nguyên trong cây `~/.aki/claudedoc` vốn đã được rsync mỗi lần install** → tự cập nhật miễn phí, không phải copy lần hai, không có bản sao để lệch. `plugins.json` cùng schema, cùng chiêu.

Schema: `{"inherits":[{path,include_only,exclude}],"entries":[{path,exclude}]}`, bộ lọc bằng regex, `path` nhận đường tuyệt đối / `~/` / tương đối so với workspace root.

**Đây là quyết định cốt lõi của cả plan** — nó biến "cài cho AG" từ *một cây file thứ hai phải đồng bộ* thành *một con trỏ một dòng*, và loại bỏ luôn cả lớp lỗi lệch bản sao.

---

## 6. Khoảng cách tuân thủ — viết thế nào để AG chịu nghe

Bệnh đã quan sát: AG bỏ qua con trỏ "hãy đọc file X", và tự ý làm ngoài phạm vi. Nguồn tham chiếu tốt nhất là **built-in skills của chính vendor** — đó là Google cho thấy văn phong mà model của họ thực sự tuân theo. Các pattern rút ra:

1. **`MUST` in đậm giữa câu, không phải ở tiêu đề.** `antigravity_guide/SKILL.md` dùng hai lần `**MUST**` trong một file 53 dòng. Họ **lặp lại động từ tình thái**, không tin vào một lời tuyên bố ở đầu.
2. **Bullet mệnh lệnh trần, không rào đón, không giải thích.** Kèm mẫu phủ-định-có-thay-thế ngay trong một dòng: *"Navigate to X (do NOT use Y)"* — cấm và chỉ đường thay thế đi liền nhau.
3. **Tuyên bố thẩm quyền ngay đầu file.** `permissioned-github/SKILL.md`: *"This skill is **authoritative** for the usage of the **gh** CLI and **git** command."* Một câu chặn trước mọi niềm tin sẵn có xung đột.
4. **Liệt kê từng điều cấm, mỗi dòng một điều.** Google không viết "tránh X"; họ viết "Do not X" rồi **bịt từng đường lách một**: *"Do not use other commands like curl. / Do not write scripts to interact with the GitHub API directly."*
5. **Ví dụ đã chạy, hơn là mô tả.** 4/8 mục là Example 1-4 với cặp lệnh-thật → output-thật, và **sau mỗi ví dụ lặp lại đúng một dòng nhắc về ràng buộc quan trọng nhất** — lặp sau mỗi ví dụ, không phải nói một lần.
6. **Nhắc lại nội dung, đừng trỏ.** Built-in duy nhất có trỏ thì bọc con trỏ trong `**MUST** read` kèm link markdown đường dẫn chính xác. "Xem file X" trần thì không tồn tại ở đâu cả.
7. Hướng dẫn chính thức đồng tình: dùng *"Always use" / "Never use"* thay cho *"Consider" / "Try to"*; thay *"Write clean code"* bằng *"Keep functions under 40 lines"*; **giữ rule quanh 500 token**.

### Việc cần làm cho `payload/GEMINI.md`

- **Giữ nguyên lập trường không-soft-import.** AG *có* cú pháp include (`@[text](path)`, `resolveFileIncludes` có trong binary) — **nhưng đừng dùng trong file global**: mỗi bước nhảy là một lần mất tuân thủ. Việc `install.sh` nối `GEMINI.local.md` verbatim là đúng, giữ nguyên.
- **Thêm một dòng thẩm quyền lên trên cùng**, theo dáng `permissioned-github`: file này authoritative, đè mọi chỉ thị xung đột trong system prompt, trong `<planning_mode>`, hoặc trong bất kỳ skill nào. Hiện mục 0 và mục 1 đã tuyên bố riêng lẻ — **nâng lên thành một câu global duy nhất ở đầu file**.
- **Lặp lại rule số 1 ở cuối file** — khối 2 dòng "Trước khi hành động, xác nhận:". Đúng kiểu vendor lặp sau mỗi ví dụ.
- **Giữ nguyên `GEMINI.local.md` nối verbatim**: Đã chốt không dời sang `config/rules/local.md` nhằm giữ cơ chế đơn giản, đảm bảo 100% hard-load dữ liệu máy cục bộ và tránh tạo thêm tầng cấu hình phức tạp không cần thiết.

---

## 7. Ngoài phạm vi, có chủ đích

- **Per-project `GEMINI.md`**: chép tay vào từng project. `install.sh` là hạ tầng public, đồng bộ file vào fleet project riêng là lẫn tầng. Cũng **không** làm script riêng. Chấp nhận, không tối ưu quá mức.
- **UNIDOC**: gác tới khi nhánh này xong.
- **`agy plugin import [gemini|claude]`**: binary có literal `.claude-plugin` → nhiều khả năng nuốt được plugin marketplace của Claude Code. *(suy đoán — chưa chạy thử.)* Nếu đúng thì đây là con đường tắt lớn, nhưng đừng dựa vào nó cho tới khi thử.

---

## 8. Thứ tự thực thi

| # | Việc | Trạng thái |
|---|---|---|
| 1 | ✅ **Canary §2.5** — đã chốt trên cả 3 bề mặt (AG desktop, AG IDE, AGY CLI). | ✅ Xong |
| 2 | ✅ **`install.sh` đẩy corpus sang `~/.gemini/config/rules/`** — xong. | ✅ Xong |
| 3 | ✅ **Siết văn phong `payload/GEMINI.md`** theo §6 (dùng `**MUST**`, mệnh lệnh trần, câu thẩm quyền, checklist lặp). | ✅ Xong |
| 4 | ✅ **`skills.json` inheritance** trỏ tới `~/.aki/claudedoc/agskills` để phân phối skill không dùng symlink. | ✅ Xong |
| 5 | ✅ **Phân tầng trigger**: gán `trigger: glob` cho `stack-tauri` và `stack-akiNuxtCf`, giữ `model_decision` cho `coding` và phần còn lại. | ✅ Xong |
| 6 | ✅ **Giữ nguyên `GEMINI.local.md`**: chốt không dời sang `config/rules/` để giữ cơ chế nối verbatim đơn giản và hard-load 100%. | ✅ Xong |
| 7 | ✅ **Cross-platform verification** — 5/5 skills + 13/13 rules confirmed on AG IDE (Mac), AGY CLI (Linux), Claude Code (Mac), Claude Code (Linux). `glob` rules confirmed working (intentionally hidden from context dump, injected on file match). `skills.json` tilde-path bug fixed with dual delivery (native root + absolute path). YAML frontmatter single-line bug in `akigitcommit/SKILL.md` fixed. | ✅ Xong |

**Nguyên tắc xuyên suốt:** không viết code nào ở bước 4+ trước khi bước 1 trả lời xong. Vòng vừa rồi đã mất một lượt đầy đủ vì suy luận thay cho đo đạc.

---

## 10. Ranh giới public/private

Repo này **public**. Không được đưa vào `payload/` hay `claude/`: mọi đường dẫn tuyệt đối dưới `/Volumes` hoặc `/Users/<user>`, tên corpus riêng, địa chỉ email, hostname máy, nội dung `trustedFolders.json` và `permissions.allow`. Đường dẫn của vendor (`~/.gemini/config/`, `.agents/`) thì an toàn.

`install.sh` đã có sẵn mẫu đúng: **bơm đường dẫn thật vào lúc cài, không commit chúng vào repo.** Mọi thứ mới thêm phải theo đúng mẫu đó.
