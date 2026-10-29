# Plan: restore `tauri.B7` with its two inverted TCC claims corrected

> Evidence base: `docs/research/macos-tcc-tauri-boundary-aug21.md` (verification event, 2026-08-21). Owner decision the same day: the removal was wrong — the problem is real and personally hit on the Mac, and "tauri b7 là sao?" was a comprehension failure of the text, not a verdict on the rule.

## 1. Problem

Two problems, and only the second one is about macOS.

- **The rule content was wrong in two places.** FDA was described as *not* covering the per-folder consents (it supersedes them), and Developer Tools was described as a file-consent switch (it is a Gatekeeper exemption for what the app *runs*). A rule that names the wrong switch costs more than no rule: it sends the reader to a Settings pane that cannot fix their symptom.
- **The section was unreadable to its owner.** It opened in TCC's internal vocabulary ("Responsible Process", "3-Tier Model") instead of the symptom a Tauri developer actually meets: a sidecar that works in Terminal fails inside the shipped `.app`, silently or behind a prompt naming the app rather than the tool. That is what made the section look foreign enough to be mistaken for another agent's scope-creep.

## 2. Fix

- Keep the section, its address (`tauri.B7`), and its verified premise, path-scoping bullet and `cdhash` bullet.
- Rewrite the three tiers as **three switches, named by what each one actually controls**, with Developer Tools carrying an explicit negative ("not file access") — the misdiagnosis is the most valuable line in the section.
- Reframe the opening on the observable symptom first, mechanism second (`agent.A4`).
- Drop "3-Tier Model" from the heading: it names the taxonomy, not the reader's problem (`pattern.A7` — name by role).

## 3. Steps

- [x] **S1** — research the three claims against authoritative sources → research doc above.
- [x] **S2** — restore the corrected B7 into `payload/RULE-stack-tauri.md`; address-map comment back to `tauri.B1-7`.
- [x] **S3** — `payload/index.md` tauri row gains the macOS-boundary clause (the row is the manifest gloss; it never mentioned B7 before because B7 arrived uncommitted and unsynced).
- [x] **S4** — `CHANGELOG.md` `[Unreleased]`: one entry for B7, stating the correction rather than claiming a new rule.
- [x] **S5** — dated correction note appended to `docs/plan/done/audit-fixes-agy-aug21.md` §0/F7; the original wording stays (immutable event record) and the appendix's "do not re-use" label is retargeted at the two inverted bullets only.
- [x] **S6** — `docs/index.md` rows for the new research doc and this plan.

## 4. Verification

- [x] Static: the corrected text asserts nothing beyond what §5 of the research doc records as measured, with each switch traceable to a quoted source there.
- [x] scythe over `payload/RULE-stack-tauri.md` — no `[WRAP]`/`[YAP]`.
- [x] **Independent fact-check, isolated context (2026-08-21).** An agent that was forbidden to read this repo's docs as evidence re-verified all six claims against primary sources. Q1/Q2/Q3 confirmed; it **contradicted** the `cdhash` bullet (ad-hoc signing loses grants on rebuild, but a stable self-signed cert is the documented *fix*, not a cause — the draft would have steered a reader away from the one thing that works), corrected the sticky-denial recovery (removing the entry restores prompting; toggling it only restores access), and found a missing scope limit (the chain governs consent-based reads — not user-picked paths or writes). All three folded into the rule text; the research doc carries them as §5b rather than a silent rewrite. This is the round's evidence that a same-session self-check is not a substitute for an isolated one: the authoring pass had rated that bullet CERTAIN.
- [-] **Runtime (owner, Mac, opportunistic — no run needed to close this plan):** next time a sidecar is denied inside a shipped build, confirm the symptom resolves via FDA *or* a Files & Folders entry, and that Developer Tools alone does not resolve it. Recorded as the research doc's reopen trigger; nothing in the rule text is gated on it.

## 5. Non-goals

- No general macOS-permissions rule beyond what a Tauri backend spawning subprocesses actually needs — Screen Recording, Accessibility, Camera/Mic and the MDM/PPPC deployment path stay out until a real project hits them.
- No claim about removable/network volumes beyond naming them as separate Files & Folders entries; whether FDA covers them was not verified.
