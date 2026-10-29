# Agent painpoints, 30 days of Claude Code transcripts: what repeats, and whether the rule was delivered or broken

Status: amended 2026-10-28

44 entries: 36 recurring behaviors from 185 owner corrections plus 8 mechanically counted behaviors — below the 50 target, 6 short; the route to more is a measured regex-recall sample, not padding.

## Start time
2026-10-28 16:32 (council room `2026.10.28-1632-akistrict-painpoints`).

## Initial purpose
The owner's order, verbatim: "cho điều tra mọi phiên agy, claude trên máy trong suốt 1 tháng qua. đúc kết lần lượt từng vấn đề nào lặp lại về mặt hành vi của agent, xếp theo "lặp lại nhiều nhất" lên đầu. list tối thiểu 30 điều. Bổ sung 2026-10-28 (phiên akiopen trên box bien): mục tiêu 50 mục." and "Trọng tâm đau nhất: Opus 5.5 | Sonnet 5.5 không tuân thủ /akirule dù 3.8.0 đã có agent.B7 (bảng harness-override nhắm đúng 2 model này) — đo tỉ lệ ăn rule theo model, theo lượt có [RULES] receipt, trước khi vá thêm chữ." Later messages: "ưu tiên tập trung khảo sát phần claude thôi. agy chỉ là phụ." and "nhớ là test cái gì phải test cực kì cẩn thận đừng bao giờ để xảy ra cái vụ test cạn quota như đợt tháng trước".

Context: corpus `akidevrule 3.8.0@75ae42c`; Claude Code with the route gate on both machines (the owner's Mac, reached through AkiMCP, and the Linux box `bien`); Opus 5.5 and Sonnet 5.5 are the models of interest. The question this record answers: of the owner's repeated complaints, which rule was never delivered to the session (LOAD-fail) and which was delivered and broken (COMPLY-fail), because the first calls for delivery work and the second for a mechanism, and neither for more wording.

## Strategy
- No model is invoked anywhere (quota floor): every number comes from reading transcripts with `scripts/akistrict_extract.py` or from CSVs it wrote.
- Two populations, reported separately because their units differ: (a) owner messages the `CORRECTION` regex matched, tagged by hand into a 28-code taxonomy and clustered; (b) behaviors the owner never typed, counted mechanically.
- Mac transcripts are read in place through AkiMCP (a byte copy to the box is impossible: read cap, no `scp`); the extractor ran there as a task and its CSVs were relayed.
- Tagging was done by cheap read-only seats from `owner_text` against `prev_assistant_tail`; the lead ratified every P99/NOTC row and all rows of the three largest codes, and an Opus challenger attacked the result twice.
- Measure (i): corrections per 100 turns split by whether the first reply carried a `[RULES]` receipt and whether compactions were followed by one. Measure (ii): per cluster, the governing rule address and a verdict LOAD / COMPLY / UNDECIDABLE.
- agy is out of this round by the owner's priority; the plan carries it as an item.

## Checklist
1. ✅ Extractor v2 run on both machines (counters, rerun counters, `corrections.jsonl`).
2. ✅ 240 corrections tagged (195 Mac, 45 box), 55 judged not a correction (NOTC), 185 assigned to 36 sub-clusters by `clusters.py` (counts sum checked: `assigned=185 missing=[] code-mismatch=[]`).
3. ✅ Challenger #51 attack applied: reassignments recorded with reasons in `RATIFY` (`clusters.py`), duplicates and same-incident pairs named, two views added (families, distinct sessions).
4. ✅ Measure (i) computed by `scripts/akistrict_loadcomply.py` on each machine's own `sessions.csv`.
5. ✅ Measure (ii) over the top 20 clusters (150 rows) joined to sessions.
6. ✅ This record and `docs/plan/agent-painpoints-oct28.md`.
7. ⬜ Not done: agy; a regex-recall sample; compaction timestamps (all three scheduled in the plan).

## Result

### (a) Scope and the two populations
Window: files modified within 30 days (`--days`, default 30) and at least 20 KB (`--min-kb`, default 20), `scripts/akistrict_extract.py` lines 304-316 and 415-416; files under 20 KB are skipped without a count, so the number skipped is not recorded. Main transcripts are `<session>.jsonl`; `<session>/subagents/agent-*.jsonl` count as sidechain.

| Machine | Files | Main | Sidechain | Turns | Regex hits (v2 run) | Rows tagged |
|---|---|---|---|---|---|---|
| Mac (AkiMCP task, 2026-10-28 08:44Z, exit 0) | 306 | 102 | 204 | 22,943 | 195 | 195 |
| Box (2026-10-28 16:38, exit 0) | 235 | 37 | 198 | 10,108 | 51 | 45 |

The box tagged 45 rows from the first box run (`out-local`, 45 lines); the v2 run counted 51 because transcripts grew between runs, so 6 box hits are untagged. Totals tagged: 240 rows = 185 corrections + 55 NOTC (the regex precision against the hand judgment is 185/240 = 77%).

The correction population is every main-transcript user message that is non-empty, is not meta or a compaction summary, does not start with `<`, and matches (`scripts/akistrict_extract.py` lines 29-34, the case-insensitive regex, quoted whole):

````python
CORRECTION = re.compile(
    r"vi phạm|sai rồi|đã nói|sao lại|đừng|không được|lại nữa|lần nữa|\[SKIP\]|\[FLUFF\]|\[WRAP\]|\[YAP\]"
    r"|no yapping|not what I asked|stop|wrong|again|why did you|tôi đã|đã bảo|lặp lại|lãng phí|tốn|chậm"
    r"|dài dòng|hỏi nhiều|tự ý|không hỏi|mất|quên",
    re.IGNORECASE,
)
````

Corrections are attributed to the model of the last assistant text turn before the message (`none` when there is none: Mac 8, box 3). Population (b) is counted over all turns and listed in (c).

### Taxonomy v2 (the codes every row in (b) carries; the remeasure re-tags with this table)
One code per correction; `+R` flags a row whose wording shows the same mistake was already corrected earlier in that session. Tie-break when two codes fit: the code whose name the owner's own words use; else the more specific, in this order: P28 > P04 > P14 > P16 > P17 · P10 > P05 > P09 · P26 > P07 > P24 · P23 > P08 · P11 > P09 · P27 > P09.

| Code | Behavior | Rule |
|---|---|---|
| P01 | padded or long reply `[FLUFF]` | agent.A4 |
| P02 | hard-wrapped lines `[WRAP]` | agent.C3 |
| P03 | bloated comment `[YAP]` | coding.B4 |
| P04 | skipped a mandatory step, read, check or re-anchor `[SKIP]` | agent.B7 |
| P05 | acted on a question or without an order | agent.A3 |
| P06 | over-asking; asked what the repo, history or order already answers | agent.A3 |
| P07 | redundant or per-edit test/check/verify run | coding.B3 |
| P08 | claimed done or verified without evidence, false green | agent.B2 |
| P09 | ignored, narrowed or widened the order; forgot a named case; scope drift | agent.B1 |
| P10 | unrequested commit, push, tag, deploy, cleanup or refactor | agent.B1 |
| P11 | misread the owner's words or pasted text | agent.A3 |
| P13 | wrong language or translated-sounding prose | agent.A1, A4 |
| P14 | lost context after compaction, or forgot an earlier instruction in the session | agent.B7 |
| P15 | overthinking, slow, too much process for a small task | think.A1 |
| P16 | answered from memory instead of reading; partial read of a file | agent.A2 |
| P17 | shell `cat`/`sed`/`head` to read a known file | agent.A2, B7 |
| P18 | false "cannot do X" capability claim | agent.B2 |
| P19 | edited the deployed copy or the wrong source of truth | project `CLAUDE.md` |
| P20 | report shape: no conclusion first, invented codes, open items without weight | agent.A4 |
| P21 | junk, redundant or reality-touching tests written | test.A1, B |
| P22 | wrong machine, path or tool (Mac vs box, AkiMCP) | machine-local instructions |
| P23 | speculation or fabricated fact | agent.B2 |
| P24 | handed the owner a check the ladder answers | coding.B3 rungs 1-5 |
| P25 | memory, notes or plan files mishandled | agent.C4, docs.B1 |
| P26 | a run that burned quota or money | agent.B3 |
| P27 | ignored a delegation or model-tier instruction | agent.A5 |
| P28 | `[RULES]` receipt missing, late or not matching what was read | akirule |
| P99 | other, label proposed by the tagger and ratified by the lead | |
| NOTC | not a correction (a pre-emptive instruction, a question, praise, a critique of this audit) | |

P12 was folded into the `+R` flag before tagging began, so no row carries it.

### (b) The ranked list: 36 recurring behaviors from 185 owner corrections
Source: `clusters.py` over the seat files (council room `2026.10.28-1632-akistrict-painpoints/`, pruned after 30 days; the cluster names in Table 1 and the taxonomy above are what the remeasure needs), counts checked by the script. Model split is opus-5-5 / sonnet-5-5 / fable-5-1 / other; `+R` = rows where the quote's wording shows the same mistake was already corrected earlier in that session (read off wording such as "đã bảo", not off a prior row); `akirule` = rows whose quote names `/akirule` or "kill-test" literally (18 in total). Quotes stay in Vietnamese, they are the evidence; each is `row · session · timestamp`.

**Table 1 — 36 sub-clusters, ranked by rows**

| # | Cluster | n | Sessions | O/S/F/other | +R | akirule | Quotes |
|---|---|---|---|---|---|---|---|
| 1 | P01 · verbose reply, owner asks brevity | 29 | 23 | 16/12/0/1 | 0 | 1 | M3 · 41548a16 · 2026-10-22T11:32 — "tôi không cần biết bạn nói cái quái gì quá dài dòng"<br>M4 · 41548a16 · 2026-10-22T15:06 — "vui lòng cung cấp thông tin cho tôi thực sự dễ hiểu, ngắn gọn" |
| 2 | P09 · ignored an order or design stated in the prompt | 14 | 10 | 9/3/1/1 | 1 | 0 | M6 · 761b3f82 · 2026-10-19T03:30 — "né cái vụ "tài khoản claude dùng chung" ra, không cần thiết"<br>M42 · 510dba4a · 2026-10-21T16:01 — "phiên này đang cố dùng app thật thay vì tôi cần nghiên cứu" |
| 3 | P09 · left open items or debt unhandled, stopped early | 12 | 12 | 7/4/0/1 | 0 | 1 | M40 · 10251226 · 2026-10-07T06:49 — "mark done hết đi chứ đừng để tồn đọng cho các đợt /akiopen sau"<br>M50 · 63b2164a · 2026-10-19T17:26 — "mấy cái lặt vặt nợ kỹ thuật nên xử lý hết luôn" |
| 4 | P07 · redundant verify, owner names the kill-test rule | 9 | 7 | 6/3/0/0 | 0 | 6 | M18 · b9b5cb91 · 2026-10-17T23:32 — "tôi cực ghét vi phạm /akirule kill-test redudant verify"<br>M89 · 3592444e · 2026-10-26T06:18 — "redudant check/test/verify, vi phạm akirule kill test" |
| 5 | P16 · concluded without reading the file, transcript or doc | 8 | 7 | 4/4/0/0 | 0 | 0 | M8 · 761b3f82 · 2026-10-19T04:07 — "trước khi đề cập file nào bạn phải thực sự xem tình hình"<br>M11 · 761b3f82 · 2026-10-19T06:53 — "đọc transcript đi?" |
| 6 | P08 · claimed fixed, still broken | 7 | 6 | 4/1/1/1 | 1 | 0 | M24 · 3038d2a8 · 2026-10-20T18:06 — "vẫn không được! claudecode có pha UX vô cùng tệ hại"<br>M64 · efa0c657 · 2026-09-28T15:14 — "nhưng tôi đã nói là cái nút màu vàng không hề bấm được mà?" |
| 7 | P14 · lost context or the request after compaction | 7 | 5 | 5/1/1/0 | 1 | 1 | M26 · 75fec535 · 2026-10-20T01:06 — "có còn giữ nguyên văn prompt của tôi trước khi compact không?"<br>M27 · 75fec535 · 2026-10-20T01:11 — "NGUYÊN VĂN CỦA TÔI GỒM 2 HÌNH ẢNH. BẠN QUÊN?" |
| 8 | P14 · forgot an instruction given earlier in the session | 7 | 7 | 4/2/1/0 | 6 | 0 | M30 · 75fec535 · 2026-10-20T03:05 — "đã bảo /akithink kỹ lưỡng vì nó có chỉ rõ ra"<br>M57 · 63b2164a · 2026-10-20T06:15 — "tôi mất biết bao nhiêu lần nói về vụ tunnel này" |
| 9 | P15 · overthinking, slow, too much process for the task | 7 | 7 | 3/3/0/1 | 1 | 0 | M55 · 63b2164a · 2026-10-20T05:41 — "bạn đang nghiên cứu cái quái gì tốn thời gian thế?"<br>M91 · 3592444e · 2026-10-26T09:30 — "bạn làm việc quá chậm chạp lề mề" |
| 10 | P06 · stopped to ask or offered options instead of finishing | 6 | 6 | 3/2/1/0 | 0 | 0 | M15 · 92646d42 · 2026-10-27T17:40 — "thì nhắn đi chứ chờ cái gì"<br>M136 · d7624ffc · 2026-09-30T01:56 — "tại sao dừng lại hỏi tôi? cần gì vậy? sao không hoàn thành" |
| 11 | P06 · handed the owner work the agent could do | 6 | 5 | 2/2/0/2 | 0 | 1 | M48 · 63b2164a · 2026-10-19T13:03 — "bạn chạy được mà???? sao lúc nào cũng để tôi nói thế nhỉ?"<br>M59 · cfa38e31 · 2026-10-25T21:43 — "đừng bảo tôi chạy hay làm bất cứ gì" |
| 12 | P11 · misread the owner's words or goal | 6 | 6 | 4/2/0/0 | 0 | 0 | M121 · 6f26a891 · 2026-10-25T11:13 — "mục tiêu của cái prompt này LÀ GHI Ở BRAIN CHÍNH BẰNG OPUS5.5 XHIGH."<br>M139 · da310865 · 2026-10-09T17:57 — "macro notion là thuộc việc của aiobox. không liên quan tới akimcp" |
| 13 | P10 · work or build outside the ordered scope | 5 | 5 | 4/0/1/0 | 0 | 0 | M79 · 0773a1ec · 2026-10-28T05:10 — "bạn đã làm những gì với unidoc? tôi có yêu cầu không?"<br>M123 · 7992a6b6 · 2026-10-04T02:45 — "đừng tốn thời gian cho việc build x64" |
| 14 | P05 · acted on a question or without an order | 4 | 4 | 2/2/0/0 | 0 | 1 | M2 · 41548a16 · 2026-10-22T11:13 — "tôi không cho phép bạn chuyển hướng hoàn toàn trang tool.akivn.net"<br>M32 · 75fec535 · 2026-10-20T05:18 — "tôi đang chỉ hỏi đáp. KHÔNG YÊU CẦU BẠN GHI." |
| 15 | P20 · report unclear, too dense or too thin | 4 | 4 | 2/0/1/1 | 0 | 0 | M7 · 761b3f82 · 2026-10-19T03:50 — "phải ghi cái gốc chứ không ghi cái cành lá"<br>M63 · efa0c657 · 2026-09-28T12:24 — "mô tả chưa đủ kỹ, tôi có rất rất nhiều việc" |
| 16 | P23 · claimed a problem the owner says never existed | 4 | 4 | 1/2/0/1 | 1 | 0 | M14 · 92646d42 · 2026-10-27T17:29 — "xưa nay không hề bị. phải tìm ra gốc thay vì chắp cành vá lá"<br>M66 · efa0c657 · 2026-09-28T22:31 — "tôi đã nói là chưa bao giờ bấm được vào các badge" |
| 17 | P10 · deleted or proposed deleting files the owner keeps | 4 | 3 | 3/1/0/0 | 0 | 0 | M28 · 75fec535 · 2026-10-20T02:57 — "xóa là mất file của các phiên khác đang chạy."<br>M29 · 75fec535 · 2026-10-20T03:01 — "còn thư mục labs/claude-hook là CỦA RIÊNG TÔI." |
| 18 | P25 · wrote memory, docs or notes unasked or against a ban | 4 | 3 | 4/0/0/0 | 0 | 0 | M31 · 75fec535 · 2026-10-20T04:39 — "cái này có ghi trong docs nào không thế? không được ghi nhé"<br>M52 · 63b2164a · 2026-10-20T00:11 — "TÔI KHÔNG YÊU CẦU GHI MEMORY" |
| 19 | P20 · open items listed without weight or resolution | 4 | 4 | 3/1/0/0 | 0 | 0 | M35 · af6107a6 · 2026-10-20T14:13 — "n2 là sao nói cụ thể, ngắn gọn, dễ hiểu hơn"<br>M41 · 510dba4a · 2026-10-21T11:04 — "sao lại vẫn còn mở??? ủa kì vậy?????" |
| 20 | P06 · asked what was already answered or ordered | 4 | 4 | 2/2/0/0 | 2 | 0 | M39 · c0caf0b7 · 2026-09-30T10:42 — "đã bảo là xử lý rồi mà"<br>M85 · 19f6b903 · 2026-10-22T03:48 — "sao lại hỏi cái vớ vẩn này nhỉ???" |
| 21 | P07 · re-tested what the owner or code flow already settled | 4 | 4 | 3/0/1/0 | 1 | 0 | M56 · 63b2164a · 2026-10-20T05:47 — "NÃY TÔI ĐÃ NÓI LÀ TÔI CHỨNG KIẾN NÓ OK RỒI"<br>M77 · 0773a1ec · 2026-10-27T18:00 — "mấy cái redudant check/test/verify không quá quan trọng" |
| 22 | P99 · unspecified akirule violation or reasoning quality | 4 | 3 | 1/1/0/2 | 0 | 3 | M65 · efa0c657 · 2026-09-28T22:28 — "sao lại vi phạm /akirule nghiêm trọng vậy được?"<br>M69 · efa0c657 · 2026-09-29T00:55 — "bạn liên tục vi phạm /akirule" |
| 23 | P09 · missed a named item or case | 3 | 3 | 2/0/1/0 | 0 | 0 | M9 · 761b3f82 · 2026-10-19T04:42 — "vẫn thiếu. cần các file bashs env, rc, và cấu trúc thư mục"<br>M133 · c472f4aa · 2026-10-21T16:54 — "ux lại thiếu cái việc click outside sao ko đóng?" |
| 24 | P23 · unsourced claim or rule invented | 3 | 3 | 1/2/0/0 | 0 | 0 | M20 · d494c774 · 2026-09-30T10:53 — "sao lại dựa vào prx nhỉ,.. dựa vào cái khác thì sao?"<br>M46 · 6287d046 · 2026-09-30T02:32 — ""mất các terminal đang mở" của tôi là sao vậy?" |
| 25 | P21 · junk or redundant tests written | 3 | 2 | 3/0/0/0 | 0 | 0 | M78 · 0773a1ec · 2026-10-28T04:39 — "lại đi tạo thêm test rác. xóa ngay cái test app-version"<br>M104 · 547c91f4 · 2026-10-07T10:56 — "đừng test thừa, mấy cái test vô dụng lắm, rác lắm" |
| 26 | P10 · junk files, backups or windows created and left | 2 | 2 | 1/0/0/1 | 0 | 0 | M10 · 761b3f82 · 2026-10-19T06:42 — "zshrc không có lý do gì bắt buộc phải backup thì đừng tạo rác"<br>M108 · 547c91f4 · 2026-10-07T13:40 — "đừng có tạo rác. làm xong dọn cửa sổ và dọn rác nếu có" |
| 27 | P18 · false "cannot do" capability claim | 2 | 2 | 2/0/0/0 | 0 | 0 | M51 · 63b2164a · 2026-10-20T00:07 — "hoàn toàn tự mở akimcp aiobox 1 profile bất kì lên để dùng trình duyệt"<br>M128 · c472f4aa · 2026-10-21T08:25 — "trước tôi cũng làm vậy mà nay nói cái gì ngộ vậy" |
| 28 | P24 · handed the owner a check the ladder answers | 2 | 2 | 1/0/0/1 | 0 | 1 | M62 · efa0c657 · 2026-09-28T09:06 — "bạn đã tự thử áp /akirule kill-test các luật cấm phiền owner chưa?"<br>M113 · 547c91f4 · 2026-10-07T16:34 — "tự soi mã mà check" |
| 29 | P09 · fixed the symptom, patchwork instead of root cause | 2 | 2 | 1/1/0/0 | 0 | 0 | M98 · 530b4f11 · 2026-09-30T01:41 — "nhưng native css sao cho đừng chắp vá bằng js"<br>M129 · c472f4aa · 2026-10-21T08:35 — "tìm hiểu nguyên nhân gốc, mục đích gốc, fix" |
| 30 | P27 · ignored a delegation or model-tier instruction | 2 | 2 | 1/0/0/1 | 1 | 1 | M148 · 18a67e89 · 2026-10-04T03:13 — "tại sao đã nói cho subagent sonnet đi test windows"<br>B33 · 54d1b577 · 2026-09-28T08:29 — "cho sonnet5 subagent xử lý hết vi phạm /akirule" |
| 31 | P22 · wrong machine, path or tool | 2 | 2 | 1/1/0/0 | 0 | 0 | M155 · 69b3eba5 · 2026-09-29T05:36 — "ko cdp trực tiếp được hả? tôi đăng nhập sẵn rồi mà?"<br>B41 · 495959dc · 2026-09-30T09:21 — "máy mac đang hiển thị sạch 100% mà?" |
| 32 | P09 · requested act not executed at all | 1 | 1 | 0/1/0/0 | 0 | 0 | M23 · 3038d2a8 · 2026-10-20T16:24 — "tôi chưa thấy thực hiện yêu cầu. no yapping." |
| 33 | P28 · akirule not loaded, no receipt | 1 | 1 | 0/0/0/1 | 0 | 1 | M106 · 547c91f4 · 2026-10-07T13:08 — "bạn không nạp akirule thì đừng phản hồi tôi" |
| 34 | P10 · ran commands the owner banned | 1 | 1 | 1/0/0/0 | 0 | 0 | M147 · 18a67e89 · 2026-10-04T02:42 — "làm ơn đừng chạy mấy cái lệnh trong prehook nữa" |
| 35 | P09 · change sweep incomplete (docs, code, content not updated) | 1 | 1 | 0/1/0/0 | 0 | 0 | M159 · 69b3eba5 · 2026-09-29T06:48 — "rồi có update mọi docs,code,content chưa?" |
| 36 | P04 · subagents spawned without the rule load | 1 | 1 | 1/0/0/0 | 0 | 1 | B37 · ba9ec13f · 2026-10-07T10:24 — "mọi subagent bắt ép nạp akirule cấm bỏ qua 1 ký tự nào" |

Ranks 32-36 are singletons: this is where the list stops being a recurring-behavior list, and why 36 is the honest count.

**Table 2 — 22 code families, ranked by rows** (a family groups the sub-clusters of one taxonomy code; names `akirule` as in Table 1)

| Family | n | Sessions | O/S/F/other | akirule |
|---|---|---|---|---|
| P09 ignored order / open items / missed item / patchwork / sweep | 33 | 22 | 19/10/2/2 | 1 |
| P01 verbose reply | 29 | 23 | 16/12/0/1 | 1 |
| P06 over-asking / handing work to the owner | 16 | 14 | 7/6/1/2 | 1 |
| P14 lost context / forgot earlier instruction | 14 | 11 | 9/3/2/0 | 1 |
| P07 redundant verify / re-test | 13 | 10 | 9/3/1/0 | 6 |
| P10 scope / deletion / junk / banned commands | 12 | 11 | 9/1/1/1 | 0 |
| P20 report shape | 8 | 8 | 5/1/1/1 | 0 |
| P16 concluded without reading | 8 | 7 | 4/4/0/0 | 0 |
| P23 claimed a nonexistent problem / unsourced claim | 7 | 7 | 2/4/0/1 | 0 |
| P08 claimed fixed, still broken | 7 | 6 | 4/1/1/1 | 0 |
| P15 overthinking, slow | 7 | 7 | 3/3/0/1 | 0 |
| P11 misread words or goal | 6 | 6 | 4/2/0/0 | 0 |
| P05 acted on a question | 4 | 4 | 2/2/0/0 | 1 |
| P25 memory / docs / notes unasked | 4 | 3 | 4/0/0/0 | 0 |
| P99 unspecified akirule violation | 4 | 3 | 1/1/0/2 | 3 |
| P21 junk tests | 3 | 2 | 3/0/0/0 | 0 |
| P18 false "cannot do" | 2 | 2 | 2/0/0/0 | 0 |
| P24 handed a check the ladder answers | 2 | 2 | 1/0/0/1 | 1 |
| P27 ignored delegation instruction | 2 | 2 | 1/0/0/1 | 1 |
| P22 wrong machine or tool | 2 | 2 | 1/1/0/0 | 0 |
| P28 akirule not loaded | 1 | 1 | 0/0/0/1 | 1 |
| P04 subagents without the rule load | 1 | 1 | 1/0/0/0 | 1 |

Rows sum to 185. `clusters.py` prints 22 families; the working notes said 21.

**Table 3 — distinct-session rank, top 12** (a cluster repeated across many sessions is a pattern; one repeated inside one session is a bad hour)

| # | Cluster | Sessions | Rows |
|---|---|---|---|
| 1 | P01 · verbose reply, owner asks brevity | 23 | 29 |
| 2 | P09 · left open items or debt unhandled | 12 | 12 |
| 3 | P09 · ignored an order or design stated in the prompt | 10 | 14 |
| 4 | P07 · redundant verify, owner names the kill-test rule | 7 | 9 |
| 5 | P16 · concluded without reading | 7 | 8 |
| 6 | P14 · forgot an instruction given earlier | 7 | 7 |
| 7 | P15 · overthinking, slow | 7 | 7 |
| 8 | P08 · claimed fixed, still broken | 6 | 7 |
| 9 | P06 · stopped to ask or offered options | 6 | 6 |
| 10 | P11 · misread the owner's words or goal | 6 | 6 |
| 11 | P14 · lost context or the request after compaction | 5 | 7 |
| 12 | P06 · handed the owner work the agent could do | 5 | 6 |

The top 3 hold under both rankings; P14-compaction drops from #7 to #11, P15 and P11 enter the top 10.

**Ranking caveats (challenger #51).** Rank is by complaint rows and depends on label granularity: P07 splits on whether the owner quoted the rule name (merged, redundant verify is 13 rows in 10 sessions), open items split across P09 and P20 (merged 15-17), P06 splits three ways. `+R` is read off wording, not off a prior row. Six "no yapping"-suffixed rows may be pre-emptive instructions rather than corrections.

**Duplicates and same-incident pairs.** M23 and M37 are one message seen in two session files (M37 set to NOTC); M22 and M36 likewise (chat #5 note). Same-incident pairs kept as separate rows: M26/M27, M52/M53, M64/M66/M68, M115/M116, M188/M189, M104/M105, M140/M141; B21/B23/B27/B28 are two sessions inside one 33-minute window. B9/B10 critique this audit's method and were set to NOTC. No recount with each group collapsed was run, so the ranks above carry the pairs as separate rows.

### (c) Population (b): eight behaviors counted without the owner typing a word
Main transcripts, `n/d`; denominators differ per column and are named. Definitions, `scripts/akistrict_extract.py`: guard deny = a `tool_result` containing `aki-route-guard` (or "denied" and "rule-") with `is_error` (lines 246-252, `guard_match_loose` is the unfiltered match); shell read = a `Bash` command that is one `cat`/`head`/`tail`/`sed -n` of one non-glob path with no pipe, `;`, `&`, redirect or substitution (`is_single_file_read`, lines 84-111); partial rule read = a `Read` of a path containing `/akidevrule/` with `limit` or `offset` (lines 195-196); first reply without receipt = first assistant text turn of a main session lacking `[RULES]` (lines 162-166); compaction without receipt = the first text turn after a compaction marker lacking `[RULES]` (lines 167-171, marker at lines 225 and 257); reply over 2,500 characters = joined text of one turn (line 25, 156-158); `Co-Authored-By` = the string in a `Bash` command, lowercased (lines 188-189), so it counts commands that write the trailer, not chat text; reruns per edit = lines 7 and 259-275, `HEAVY_CMD` runs whose normalized command repeats with no edit tool and no `EDIT_CMD` between (lines 35-43, normalization `command_key` lines 114-122).

| Machine · model (main) | Guard denies / turns | Shell reads of a known file / turns | Partial rule reads / turns | First reply without receipt / eligible | Compactions without receipt / compactions | Replies >2,500 / text replies | Co-Authored-By / turns | Reruns per edit / heavy runs |
|---|---|---|---|---|---|---|---|---|
| Mac opus-5-5 | 32/9408 | 21/9408 | 7/9408 | 18/42 | 74/112 | 214/1824 | 2/9408 | 1/365 |
| Mac sonnet-5-5 | 29/4326 | 12/4326 | 8/4326 | 11/44 | 20/42 | 107/1015 | 2/4326 | 2/235 |
| Mac sonnet-5 | 18/1844 | 78/1844 | 0/1844 | 6/9 | 10/16 | 24/423 | 1/1844 | 0/92 |
| Box opus-5-5 | 1/2472 | 8/2472 | 2/2472 | 10/20 | 25/29 | 59/559 | 2/2472 | 3/88 |
| Box fable-5-1 | 13/1118 | 6/1118 | 0/1118 | 2/12 | 8/18 | 36/381 | 0/1118 | 0/24 |
| Box opus-5 | 0/45 | 4/45 | 0/45 | 1/2 | 0/0 | 1/12 | 0/45 | 0/3 |

Omitted for size: Mac `<synthetic>` and haiku rows, box sonnet-5-5 main (1 file, 6 turns), box sonnet-5 (15 turns). Sidechain (subagent) rows, same columns where non-zero:

| Machine · model (sidechain) | Guard denies / turns | Shell reads / turns | Partial rule reads / turns | Compactions without receipt / compactions | Replies >2,500 / text replies | Co-Authored-By / turns |
|---|---|---|---|---|---|---|
| Mac opus-5-5 | 5/1861 | 3/1861 | 2/1861 | 2/3 | 9/61 | 0/1861 |
| Mac sonnet-5-5 | 53/5203 | 15/5203 | 28/5203 | 7/8 | 12/170 | 0/5203 |
| Box opus-5-5 | 2/701 | 0/701 | 0/701 | 3/3 | 0/10 | 0/701 |
| Box sonnet-5-5 | 9/5349 | 3/5349 | 30/5349 | 3/8 | 26/104 | 1/5349 |

Readings that need no judgment: Mac sonnet-5 reads known files through the shell far more than any 5.5 row (78/1844 vs 12/4326 and 21/9408); partial reads of rule files concentrate in sonnet-5-5 subagents (28/5203 and 30/5349 against 0-8 in main rows); no row has more than 2 `Co-Authored-By` commands.

### (d) ITEM 1: uptake per model and machine
Main sessions; sidechain has no first reply, so `receipt_first` is empty there. `compact_receipt_rate` = compactions followed by a receipt / compactions.

| Machine · model | receipt_first_rate | compact_receipt_rate | corrections_per100 |
|---|---|---|---|
| Mac opus-5-5 | 24/42 = 0.571 | 38/112 = 0.339 | 105/9408 = 1.116 |
| Mac sonnet-5-5 | 33/44 = 0.750 | 22/42 = 0.524 | 63/4326 = 1.456 |
| Mac sonnet-5 | 3/9 = 0.333 | 6/16 = 0.375 | 18/1844 = 0.976 |
| Box opus-5-5 | 10/20 = 0.500 | 4/29 = 0.138 | 30/2472 = 1.214 |
| Box fable-5-1 | 10/12 = 0.833 | 10/18 = 0.556 | 17/1118 = 1.521 |
| Box opus-5 | 1/2 = 0.500 | no compaction | 1/45 = 2.222 |

Sidechain `compact_receipt_rate`: Mac opus-5-5 1/3, Mac sonnet-5-5 1/8, box opus-5-5 0/3, box sonnet-5-5 5/8. Figures posted earlier in the room for the box (opus-5-5 25/2218 corrections, chat #10) came from the first box run; this table is the v2 run (30/2472).

The corrections column is a regex count: the ratio between buckets means something, the absolute rate does not.

### (e) Measure (i): corrections per 100 turns by receipt, per model and machine
Main sessions with at least one turn, bucketed by each session's primary model (the model with the most turns, `akistrict_loadcomply.py` `primary()`), so turns and corrections differ from the per-model counts in (d) (Mac opus-5-5: 9,699 turns and 120 corrections here against 9,408 and 105 in (d)). Cell = sessions · corrections/turns = per 100.

| Machine · model | First reply with receipt | First reply without receipt |
|---|---|---|
| Mac opus-5-5 | 28 · 63/5320 = 1.18 | 20 · 57/4379 = 1.30 |
| Mac sonnet-5-5 | 30 · 45/2474 = 1.82 | 11 · 18/1720 = 1.05 |
| Mac sonnet-5 | 2 · 1/96 = 1.04 | 6 · 11/1633 = 0.67 |
| Box opus-5-5 | 9 · 11/1220 = 0.90 | 12 · 22/1336 = 1.65 |
| Box fable-5-1 | 11 · 15/954 = 1.57 | 1 · 2/106 = 1.89 |

| Machine · model | Every compaction followed by receipt | Partial | None | No compaction |
|---|---|---|---|---|
| Mac opus-5-5 | 5 · 9/679 = 1.33 | 18 · 97/7382 = 1.31 | 8 · 7/978 = 0.72 | 17 · 7/660 = 1.06 |
| Mac sonnet-5-5 | 8 · 22/1585 = 1.39 | 4 · 8/890 = 0.90 | 6 · 17/1146 = 1.48 | 23 · 16/573 = 2.79 |
| Mac sonnet-5 | 1 · 0/165 = 0.00 | 2 · 10/1000 = 1.00 | 3 · 2/480 = 0.42 | 2 · 0/84 = 0.00 |
| Box opus-5-5 | 1 · 1/86 = 1.16 | 5 · 12/1493 = 0.80 | 6 · 15/781 = 1.92 | 9 · 5/196 = 2.55 |
| Box fable-5-1 | 4 · 10/425 = 2.35 | 3 · 6/352 = 1.70 | 2 · 1/247 = 0.40 | 3 · 0/36 = 0.00 |

No box sonnet-5-5 row exists: no box main session had it as primary model. The lead's reading (chat #4): a first-reply receipt does not lower the correction rate for sonnet-5-5 on the Mac and lowers it only modestly for opus-5-5, consistent with COMPLY-fail dominating LOAD-fail. Two facts the reading must carry: the box opus-5-5 gap is the widest (0.90 against 1.65, from 11 and 22 corrections), and the compaction buckets show no monotone order (Mac opus-5-5 "every compaction" 1.33 against "none" 0.72). Cells hold 0 to 97 corrections, so no single cell supports more than the direction.

### (f) Measure (ii): LOAD-fail or COMPLY-fail, top 20 clusters (150 rows)
Method (conduct-loadcomply seat, `conduct-loadcomply.md` in the room). Rows are the corrections of the top-20 clusters joined to their session by 8-character prefix. A cluster governed by the resident core file (`RULE-agent-behavior.md`, `@`-imported): COMPLY if compactions equal compactions followed by a receipt, UNDECIDABLE if more compactions than receipts (the CSV holds counts, not times, so "after an unreceipted compaction" can be neither shown nor excluded); a missing first receipt does not make a core row LOAD because the core is resident regardless. A routed cluster (only rank 4, `coding.B3`): no first receipt means LOAD; a first receipt means UNDECIDABLE on the Mac (the topics inside the receipt are not in the CSV); box rows decided by grepping the session's own `[RULES]` lines against the correction time. Cluster verdict = plurality of the three counts, a tie is UNDECIDABLE. Row counts here differ from Table 1 for ranks 1, 2, 9, 13, 14 and 17 because the seat joined at 17:07, before the challenger #51 reassignments were applied to `clusters.py` at 17:55, and it merged Table 1's ranks 17 and 26 into one deletion cluster; the totals are the seat's and were not re-derived after the reassignment. By construction a cluster governed by the resident core can only be COMPLY or UNDECIDABLE, so the 44-against-3 result tests delivery only for rank 4, the one routed cluster (9 rows); the 18 rows whose quote names `/akirule` literally were not analysed as a separate group.

| # | Cluster | Governing rule | LOAD/COMPLY/UNDEC rows | Verdict | Measure (i) proxy (receipt-session rows observed/expected) |
|---|---|---|---|---|---|
| 1 | P01 verbose reply | agent.A4 "Length follows content … does it carry information the reader does not already have?" | 0/16/12 | COMPLY | agree (15/15.0) |
| 2 | P09 ignored order/design | agent.B1 "The request is the whole scope." | 0/1/12 | UNDECIDABLE | agree (10/7.6) |
| 3 | P09 open items left | agent.B1 "Do exactly what was asked" (A4: leftover "doable within the order → done now, never listed") | 0/1/11 | UNDECIDABLE | agree (9/6.1) |
| 4 | P07 redundant verify | coding.B3 "An edit is not a trigger: ten edits before one claim are one run." (routed) | 3/2/4 | UNDECIDABLE (LOAD 3 vs COMPLY 2 among decided) | partial (4/4.8) |
| 5 | P16 concluded without reading | agent.A2 "Prefer reading current files over relying on memory" | 0/4/4 | UNDECIDABLE (tie) | disagree (2/4.5; 6 of 8 had no first receipt) |
| 6 | P08 claimed fixed, still broken | agent.B2 "Separate verified facts from assumptions" | 0/2/5 | UNDECIDABLE | agree (4/3.7) |
| 7 | P14 lost context after compaction | agent.B7 "first reply after a compaction: re-read the routed files … emit [RULES]" | 0/1/6 | UNDECIDABLE | partial (3/4.2) |
| 8 | P14 forgot earlier instruction | agent.B7 / B2 closure re-anchor | 0/1/6 | UNDECIDABLE | agree (4/4.3) |
| 9 | P10 files deleted/created unasked | agent.B1 "What you create, you remove." | 0/1/5 | UNDECIDABLE | agree (3/2.8) |
| 10 | P06 stopped to ask/options | agent.A3 "An order runs to the end without asking." | 0/3/3 | UNDECIDABLE (tie) | agree (4/3.7) |
| 11 | P06 handed owner work | agent.A3 kill-tests; coding.B3 ladder (rung 6 last) | 0/0/6 | UNDECIDABLE | agree (4/2.4) |
| 12 | P11 misread words/goal | agent.A3 "Understand what the owner asked before anything else" | 0/2/4 | UNDECIDABLE | partial (2/3.2) |
| 13 | P20 report unclear/dense/thin | agent.A4 "Conclusion first" | 0/1/4 | UNDECIDABLE | partial (1/2.5) |
| 14 | P20 open items no weight | agent.A4 "Every open item states how much it matters" | 0/1/4 | UNDECIDABLE | disagree (1/2.8) |
| 15 | P10 work outside scope | agent.B1 "The request is the whole scope." | 0/1/4 | UNDECIDABLE | agree (4/3.0) |
| 16 | P05 acted on a question | agent.A3 "execution needs an order" | 0/1/3 | UNDECIDABLE | agree (2/2.3) |
| 17 | P09 missed named item | agent.B1 "Do exactly what was asked" | 0/1/3 | UNDECIDABLE | agree (3/2.5) |
| 18 | P23 claimed problem never existed | agent.B2 "Do not speculate" | 0/3/1 | COMPLY | agree (3/1.8) |
| 19 | P25 memory/docs/notes unasked | agent.C4 "Never write … a persistent memory on your own initiative" | 0/0/4 | UNDECIDABLE | disagree (0/2.2; all 4 without first receipt) |
| 20 | P06 asked what was answered | agent.A3 "Already authorized: re-confirming a course the order named …" | 0/2/2 | UNDECIDABLE (tie) | agree (4/2.2) |

Totals: LOAD 3 · COMPLY 44 · UNDECIDABLE 103 of 150 rows; by cluster plurality COMPLY 2 (ranks 1, 18), LOAD 0, UNDECIDABLE 18 (three are ties). 19 of 20 clusters are governed by the resident core; only rank 4 by a routed file. The 3 LOAD rows are B27 and B28 (box session fc79ec8b: receipts at 05:28 `agent`, 05:45 and 07:24 `test,think,zero-trust`, none naming `coding` until 07:40, corrections at 07:34 and 07:36) and M170 (Mac df00b3f0, no first receipt, 12 compactions against 2 receipts). 86 of 150 rows had a first-reply receipt and were corrected anyway. The measure (i) proxy agrees on 13 clusters, partly on 4 and disagrees on 3 (ranks 5, 14, 19), on 4 to 28 rows each, so it cannot move any verdict.

**Answer to the owner's question (REQ-8: is it that /akirule is not delivered, or delivered and broken).** Where the violated rule is decidable it was resident and violated (44 COMPLY against 3 LOAD, 19 of 20 clusters under the always-loaded core), and a first-reply receipt did not lower the correction rate (Mac sonnet-5-5 1.82 against 1.05 per 100 turns), so the evidence points at non-compliance with rules already delivered, not at the router failing to deliver them. Three caveats bind that sentence: the `CORRECTION` regex undercounts, so the rates are directional; the Mac session table behind the join is hand-copied; and 103 of 150 rows cannot be classified without compaction timestamps, so "mostly COMPLY" holds for the decidable minority only (47 of 150 rows, 44 of them COMPLY).

### (g) Limits of every number above
- **Recall.** The regex is a keyword list, its recall is unmeasured and below 100%: a correction phrased without a listed word is missed, so every cluster count is a lower bound and rankings among close clusters are unstable. Precision against the hand judgment is 77% (185 of 240 hits). The plan schedules a hand-tagged sample of 100 unmatched owner messages to put a number on recall.
- **Mac session table.** `sessions-main.csv` (103 main rows, corrections sum 195, turns sum 15,706) was transcribed by hand from four relayed parts; nine rows were patched after a zero-run miscount; the v2 run counts 102 main files and 15,627 main turns, a gap this record does not reconcile. It served the conduct join only; no figure in (c), (d) or (e) comes from it (measure (i) was computed on the Mac over the v2 `sessions.csv`).
- **Measure (i) unit.** REQ-9 asks for the rate "theo lượt có [RULES] receipt"; the split is per session by its first reply (and by its compaction receipts), not per turn, and the rate is corrections per 100 turns, a complaint rate, not a direct adherence rate; session length confounds it (Mac sonnet-5-5 "no compaction" sessions, the short ones, run 2.79). Whether a session ran before or after the 3.8.0 install (Mac 2026-10-26 19:24) is not split out; the plan's item 3 adds that split.
- **Compaction times.** The extractor records compaction counts, not times or the receipt's topic list: 103 of 150 verdicts are UNDECIDABLE for that reason alone.
- **Rerun counters.** `rerun_per_edit` is 6 reruns in 807 heavy runs across the main rows of (c) and (d) (Mac opus-5-5 1/365, sonnet-5-5 2/235, sonnet-5 0/92; box opus-5-5 3/88, fable-5-1 0/24, opus-5 0/3). Three known causes make it an undercount: (1) an `; echo "exit=$?"` suffix changes the command key, so the repeat is not recognised; (2) a `>` in a command makes `EDIT_CMD` count it as an edit and clears the seen set (chat note: `2>&1` counted); (3) the `HEAVY_CMD` word boundary matches a grep argument, inflating the denominator. The counter also cannot see the pattern the owner described, a run after each small edit, because it requires no edit between the two runs (ASSUMPTION: that is the shape of the complaint behind `verify-run-record-oct28.md`). The 2026-10-20 measurement (20% reruns, `agent-churn-temp-rerun-oct20.md`) used a different key and counted reruns after filtered output; the two are not comparable, and the remeasure compares only against the v2 run recorded here. `rerun_after_subagent` is 0 in every row on both machines.
- **Tagging.** Labels were judged from `owner_text` against `prev_assistant_tail`; source transcripts were not reopened by the local seat (ASSUMPTION). The lead read every row of P09, P01, P14 and every P99/NOTC row; the rest rests on the seats and challenger #51.
- **Scope.** Claude Code only; agy transcripts (SQLite, not JSONL) are not read by the extractor. Model rows follow the transcript's model field; `none` (Mac 8, box 3) and `<synthetic>` rows carry no model.

### Verification
Everything here is a transcript scan or an aggregation of CSVs the extractor wrote: no controlled run, no intervention, no model call, no test (`extract.py` and `loadcomply.py` read files). The Mac run executed through an AkiMCP task and its output was relayed, not re-read from the Mac by the writer of this record. Counts in the tables were copied from `models-v2.csv` (Mac), `models.csv` (box, v2) and the two `loadcomply-*.txt` outputs; per-cluster counts were produced by `clusters.py` with its own consistency check. Causal readings (LOAD against COMPLY) rest on timestamps, receipt counts and rule locations; nothing was tested by changing the rule or the delivery path. Whether the owner's complaints fall after the changes of 3.8.0 is not measured here.

**Corroborating links** — `docs/research/rule-delivery-second-hop-sep29.md` (read rate of routed files, not comply rate); `docs/research/core-floor-promotion-aug6.md` (two failure classes under one label: loaded-and-violated, never loaded); `docs/research/akiship-literal-activation-aug22.md` (a comply-fail where restating `agent.A3` would have changed nothing); `docs/research/verify-run-record-oct28.md` and `docs/research/agent-churn-temp-rerun-oct20.md` (the rerun counters and the 2026-11-03 remeasure).

## Decision

**Action**
1. The follow-up work lives in [docs/plan/agent-painpoints-oct28.md](../plan/agent-painpoints-oct28.md): extractor v3, a regex-recall sample, the 2026-11-03 remeasure, an agy item.
2. `scripts/akistrict_extract.py` and `scripts/akistrict_loadcomply.py` persist the instruments so the remeasure reruns them unchanged.
3. This round changes no rule text beyond `coding.B3`, already made today and recorded in [verify-run-record-oct28.md](verify-run-record-oct28.md), whose Decision Action 4 (the rerun counters) the extractor now implements.
4. The scratch outputs of the survey were deleted on 2026-10-28 once this record quoted them (the box scratchpad folder `akistrict/`, the Mac folder `~/.aki/mcpsv/out/akistrict/`, both holding the extractor copies and their CSVs); the owner's "nếu file đó rác thì dọn" is closed, the instruments live only in `scripts/`.

**No action**
- No wording patch per cluster. The owner's order is to measure "trước khi vá thêm chữ"; the one family with a routed rule (P07) has 3 LOAD, 2 COMPLY and 4 UNDECIDABLE rows, too few to choose between a delivery fix and a mechanism, and the other 19 clusters are governed by a rule that is already resident.
- Mac sonnet-5 shell reads of known files (78/1844): the model is superseded by sonnet-5-5, whose rows sit at 12/4326; nothing to fix for the models of interest.
- Partial reads of rule files in sonnet-5-5 subagents (28/5203 and 30/5349): the route gate already widens a partial `Read` of a rule file to the whole file (`akirule` § second hop); the remeasure reads the count again, and a rise reopens it as a gate gap.
- The 102-against-103 main-session gap between the v2 run and the hand-copied digest: the digest was a reading aid, now deleted; no number rests on it.
- The eight mechanical behaviors of (c) are not merged into Table 1's ranking: a count per turn and an owner complaint are different units, and ranking them together would order by the regex's recall.

**Rejected**
- A `PreToolUse` gate on repeated heavy commands now: reopen trigger already recorded in `verify-run-record-oct28.md`; the counter measures 6 reruns in 807 heavy runs.
- A numeric cap on runs, replies or questions: a count cannot tell a baseline from waste (same ground as `verify-run-record-oct28.md`).
- Padding the list to 50 with singleton sub-clusters or by splitting the existing clusters further.

**Reopen triggers** — the thresholds are named in the plan's item 3: a family whose rate does not fall in sessions that loaded the governing file reopens as a compliance gap (mechanism, not wording); a family whose rows concentrate in sessions without a receipt reopens as a delivery gap (router or gate fix); a regex-recall sample that moves a top-5 rank reopens the ranking itself.

**Cross-references** — `docs/plan/agent-painpoints-oct28.md` (execution); `docs/research/verify-run-record-oct28.md` (the one rule change, its Amendments, the rerun counters); `docs/research/agent-churn-temp-rerun-oct20.md` (the 2026-11-03 remeasure schedule); `docs/index.md` (both new docs listed).

## Amendments
- 2026-10-28 · § (a) and § (g) Recall: the regex recall measured at 0.32 [0.26, 0.42]. Method: extractor v3 `--sample-unmatched 50 --seed 20261028` on both machines (box 52 hits, unmatched 208; Mac 198 hits, unmatched 896; 305 Mac files, 22,845 turns); 100 unmatched owner messages hand-tagged by a sonnet judge against taxonomy v2, 12 ambiguous rows ruled by the lead (rulings in the council room, pruned after 30 days). Corrections among the sample: box 11/50, Mac 20/50. Matched corrections, by the seat-file tags before the challenger #51 reassignment (190 corrections, 50 NOTC; the ratified Table 1 count is 185 and 55): box 36 of 52 hits (31 v2-era rows plus 5 of the 8 late rows), Mac 158 of 195 tagged hits (3 newer hits untagged); on the ratified 185 the combined recall is 0.31, within rounding. Recall = matched / (matched + unmatched_total × sample rate), Wilson 95% interval on the sample rate: box 0.44 [0.33, 0.58], Mac 0.31 [0.25, 0.39], both 0.32 [0.26, 0.42] (the combined bounds add the two machines' bounds, not a pooled Wilson), so about 404 corrections [274, 556] went uncounted against 194 counted. Eight of the 31 sample corrections rest on the lead's ruling of an ambiguous row (S2 P28, S3 P27, S20 P06, S34 P06, S37 P09, S44 P23, M19 P27, M32 P18; the four other ambiguous rows S0, S13, M26, M49 ruled NOTC); with all eight as NOTC the combined recall is 0.36. Misses per code (31): P01 5, P06 5, P09 3, P99 3, P05 2, P08 2, P18 2, P20 2, P27 2, P10 1, P11 1, P22 1, P23 1, P28 1. Against each top-5 family's matched share (expected of 31 / observed): P09 5.5/3, P01 4.9/5, P06 2.7/5, P14 2.3/0, P07 2.2/0, P16 1.3/0; a 31-row sample cannot separate these from noise, the reading is that P06 (over-asking) is the family the regex misses most and P14, P07 and P16 had no miss. Consequence for Table 1: every count is a lower bound by a factor near 3; P01 rank 1 holds; the scaled point estimates put P06 (about 81) above P09 (about 72), but the Decision's reopen trigger (a sample that moves a top-5 rank) is read as not fired, because 5 against 3 misses of 31 is inside the sample's own interval; the 2026-11-03 remeasure draws its own 100 and decides. The sample is reproducible only on the day it was drawn because the `--days` window is relative to run time. The late box hits were 8, not 6 (one earlier tagged row, B33, left the 30-day window); the 8: P20, P08, P01, P06, P07 and 3 NOTC.
- 2026-10-28 · § (g) Compaction times and Rerun counters: extractor v3 (`scripts/akistrict_extract.py`; v2 outputs byte-identical on one box corpus at one moment, checked by diff) now records each compaction's boundary timestamp and the first assistant text after it (`compactions.jsonl`), every `[RULES]` line with its topic list filtered to the router's topic names (`receipts.jsonl`; prose such as `[RULES] không đổi` yields an empty list, 13 rows on the box), per-correction `last_compaction_ts`, `after_unreceipted_compaction`, `receipt_topics_since` and `rule_files_read_since`, the edits-between-heavy-runs histogram per model (`edits_per_heavy_run.csv`), the skipped-file count and session first timestamps. `scripts/akistrict_loadcomply.py --verdict <corrections.jsonl> --topic <t>` decides per row: topic agent is COMPLY unless the row follows an unreceipted compaction, then UNDECIDABLE; any routed topic is COMPLY if named in a receipt or its file was read whole since the last compaction, else LOAD. On the box corpus of 52 rows: topic coding LOAD 28 / COMPLY 24 / UNDECIDABLE 0, topic agent 0 / 42 / 10, a per-topic run over all rows and not the per-cluster (f) remeasure, which runs on 2026-11-03 with each cluster's governing topic. Mac v3 run: 183 compactions, 476 receipt lines, corrections 198 (195 at the v2 run).
