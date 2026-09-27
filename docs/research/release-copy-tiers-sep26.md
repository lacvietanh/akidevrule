# Release copy as one contract in three lengths — /akithink decision record

## Start time
2026-09-26, same session as `release-changelog-shape-highlight-sep26.md`, after the owner asked for the GitHub-Release-only "user-friendly" wording to become the default for every case and for `/akiship` to end with paste-ready announcement lines.

## Initial purpose
Where should the user-facing release wording live so that every project type gets it by default, `/akiship` prints it without being asked, and nothing is written twice? Sub-question from the owner: which parts belong to the release rule, which to the skill, what may repeat, what is SSOT plus reference.

## Strategy
Grep every site restating the title/body contract (B4, B6, C1, C2, README, akiship, index); classify each as content contract vs sequencing; apply the deep-think modules to the split; write the contract once and reduce the other sites to pointers.

## Checklist
1. ✅ Sites found: B4 (title format, good/bad examples, body), B6 (three loose copy lines), C1 (tone table), C2 (`title`), akiship Report (no copy block), README row.
2. ✅ B6 already existed as "Content discipline" with the right topic and no substance; it became the SSOT instead of a new B12 address.
3. ✅ B4 and C2 reduced to pointers; akiship Report gained one paragraph that says when and in what shape, nothing about wording.

## Result

### Goal chain
Copy exists for every release → the owner announces without rewriting → users and crawlers see one consistent story per version (`biz.C4`) → trust that the product moves. The deeper goal is that the announcement costs the owner a paste, not a composition, on a day they ship several projects.

### Boundary — rule vs skill
- **Rule (`release.B6`) owns content:** the three tiers, the wording rules, the agreement rule with B4/C2, the announce verdict and its reason, the block shape. Shape is content: whoever renders the block must produce the same fields, so it cannot live in one skill.
- **Skill (`akiship`) owns sequencing:** that the block is the last block of every run, that it quotes existing artifacts, that a deferred version still prints a line. One paragraph, all pointers.
- **May repeat:** the address `release.B6` and the field names in a pointer. **Must not repeat:** the good/bad title examples (moved from B4 into B6), the dash and terminology rules (folded into B6 as pointers to `content`), any wording guidance.
- **Reference implementations:** the `releases.json` entry (web) and the GitHub Release body already are the copy; the block quotes them. Composing a third variant per run is the duplication this change prevents.

### Real cases
| Project shape | Where the copy already lives | Block does |
|---|---|---|
| Web with `releases.json` | the entry (title + highlight + changes) | quotes it; adds Short and the verdict |
| Desktop/CLI with GitHub Release | the Release title/body (B4) | quotes it; adds Short and the verdict |
| npm package | GitHub Release if the repo has one; the registry carries none | as above, else the block is the only home |
| Deferred version (A5 materiality) | nothing minted | `deferred — no copy` |
| Internal-only version | one honest line (C3) | `Announce: no — internal-only` |

### Critique
- Steelman "keep it in B4": the GitHub Release is the only place with a hard format. Rejected: that scoping is exactly why web and CLI projects had no copy rule, and why `releases.json` titles were written by feel.
- Attack the three tiers: is Short ever different from Headline plus a link? Often not; it is kept because a post needs the proof clause (`biz.C1`) that a title has no room for, and because it is the tier the owner pastes most.
- Attack the announce verdict: the rule cannot know the owner's channels. It does not try — channels come from the project's records or are absent; the verdict is only yes/no with a reason.
- Inversion: to guarantee the copy drifts, let each surface carry its own wording rules. That was the state before.
- Pre-mortem: in six months every block says `Announce: yes` and the tiers are the CHANGELOG bullets rephrased. The wording rules ("what the user can now do, never the file or route") and the quote-don't-compose rule are the counter; the reopen trigger is a block that names a file path.

### Verification
Static: every old restating site now points at B6 (`grep` for "2-5 word", "Body:", "patch fixes" returns only B6). scythe exit 0 on the edited files; `release_lint.py --latest .` exit 0.

## Decision
**Action** — `payload/RULE-release.md` B6 (contract), B4 and C2 (pointers); `skills/akiship/SKILL.md` Report (last block); `payload/index.md`, `README.md`, `CHANGELOG.md`.

**Rejected/closed** — a new `B12` address (B6 already had the topic); a channel list inside the rule; the block composing its own text when an artifact already holds it.

**Cross-references** — `docs/research/release-changelog-shape-highlight-sep26.md` (the highlight the Headline tier reuses).
