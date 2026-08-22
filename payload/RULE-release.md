# Release & Versioning Rule

<!-- Address map: release.A1-5 · release.B1-8 · release.C1-4 (⟨Aki⟩) -->

## A. Versioning core

### A1. Scope — when this applies, CHANGELOG mandatory
Every Aki project, any stack (Nuxt web — see `RULE-stack-akiNuxtCf.md` — Tauri v2, CLI, …). `CHANGELOG.md` is **mandatory from project creation**: the commit workflow and versioning discipline both anchor to it, so a repo without one is broken, not exempt — create it as the first fix. If a change is user-visible or dev-relevant, the release artifacts below must move with the code in the same task — never edit code and leave them stale.

**Release vs deploy — two different events.** A *release* defines a version of the app (CHANGELOG, releases.json, GitHub Release) and applies to every project type. A *deploy* puts a web build live and is web-only — see `RULE-stack-akiNuxtCf.md` § Deploy verification. This rule owns releases only.

### A2. Versioning — semver `major.minor.patch`
- **patch** — bug fixes, internal-only changes
- **minor** — new backward-compatible features
- **major** — breaking changes
- One release = one version; bundle the session's changes under it. Bump deliberately — do not bump on every tiny edit, and do not skip a bump when something shipped.

### A3. Version string format (ABSOLUTE — never violate)
The version *attribute itself* is always bare semver, **never prefixed with `v`**: `package.json`/`Cargo.toml`/equivalent manifest `"version"` field, and every git tag, are `1.10.1` — not `v1.10.1`. This is a real bug class, not a style nit: an inconsistent prefix across tags silently breaks semver comparisons and diffing tools (`git describe`, `hasUpdate()`-style JS comparisons against a fetched tag name), and produces doubled-up UI text when display code does `` `v${version}` `` against a value that already contains `v` (rendered as `vv1.10.1`).
- **Tag priority is stack-dependent.** Distributed-artifact apps (Tauri/Desktop/CLI) already cut a tag on every release build (A5's atomic bump+tag+build) — treat tagging as standard practice there, not optional, and give it real weight. Web (continuously-deployed) apps already have CHANGELOG.md/releases.json/GitHub Release as the authoritative record, so a tag there is a lighter-weight, optional checkpoint: mention it only lightly for an ordinary patch release, but actively recommend cutting one once a release bundles a major/minor bump or several substantial changes — that is exactly when a rollback/bisect anchor earns its keep.
- Tag only if the project already tags, or the user accepts a suggestion above: `git tag -l` empty and no acceptance → skip tag creation; CHANGELOG/releases.json/GitHub Release stay authoritative. Creating and pushing a tag is visible to others once pushed — propose it, never create or push one unasked ([[RULE-agent-behavior]] B3). Exception — an authorized full-release run (B8): the invocation is the acceptance, so an existing tag convention is followed mechanically (create the bare tag, no ask); an empty tag list still means skip, mentioned once. Pushing the tag stays bound to the run's push authorization.
- Create tags bare: `git tag 1.10.1`, never `git tag v1.10.1`.
- Before cutting any release, check the existing tag convention with `git tag -l | sort -V | tail -5` — if a project's history has drifted to `v`-prefixed tags partway through, treat that drift as the bug being corrected (go back to bare), not as the precedent to keep following.
- Human-facing display **may** prepend `v` at render time only — a GitHub Release title (`v{version}: …`, see below), a UI badge ("Update Available — v1.10.1"). That is a presentation concern, separate from and does not violate this rule. The forbidden thing is `v` baked into the stored/compared value itself.
- When resolving the last release's boundary commit, prefer the bare-tag form: `git rev-parse "<last-version>"`, falling back to `git rev-parse "v<last-version>"` only to read a legacy/already-existing `v`-prefixed tag — never as the form to create going forward.

### A4. Bump level — driven by content severity, not by step-count
Classify every accumulated change found in the git log:
- breaking / not backward-compatible → major
- new capability, backward-compatible → minor
- fix / internal-only → patch

**New version = the last version recorded in CHANGELOG (the Pre-bump baseline from the state table in B1) + exactly one step at the HIGHEST severity found across the full accumulation.** Do not add steps per session or per commit.

Unsure between two levels → choose the smaller, state the reason.

A jump like `1.4.2 → 2.0.0` is a correct single major step if the accumulation contains a breaking change. A jump like `1.4.2 → 1.6.0` remains invalid because it skips the minor version `1.5.0` (minor must only increment by 1).

### A5. A version is minted at the release event, never at work-completion (ABSOLUTE)

Finishing a piece of work does not earn a version number. Only shipping does — a production deploy, a published tag, a distributed build.

- **Continuously-deployed Web / Service Apps**: Between releases, the accumulation lives under `## [Unreleased]` at the top of `CHANGELOG.md` with **no version number and no manifest bump**. When the release actually happens, rename that `[Unreleased]` heading to the new version and bump the manifest once. Local version == production version at all times.
- **Distributed Artifact Apps (Tauri Desktop App, CLI Binaries, compiled packages)**:
  - Atomic bump + tag + build in the same release task is **PERMITTED** (because the version string is baked into the compiled binary artifact at build time).
  - **Mandatory Pre-Bump Guard (ABSOLUTE)**: This guards minting the **next** version — it does **not** block finishing the current one. Being at a manifest version with no tag yet is the *normal* mid-release state here: the manifest is bumped when work on the version starts, and the tag is cut only at build. The guard fires only when you would stack a **second** unshipped version on top of the first. Before advancing the manifest to a new, higher number, verify the current manifest version already has a matching tag/release build (`git tag -l "<current_manifest_version>"`). If it does not, **finish the current version (cut its tag/build) first** — do not open another version on top of an unshipped one (state: **Drifted**, see B1). Completing the current version (tag + build at its own number) is never blocked.

- **Never bump the manifest `version` field in the same task as a routine code change (Web apps)**. The bump belongs to the release task alone. A task that ends with "bumped to 0.2.0" but nothing deployed is the bug for web apps.
- **Many sessions collapse into one version, not one version per session.** Three or four rounds of local improvement on top of a `0.1.0` production release ship as `0.2.0` (or `0.1.1`, or `1.0.0` — whatever A4's severity rule gives), **never** as `0.3.4`.
- **Materiality test before minting.** A version the user sees must be worth seeing. If the whole accumulation is one or two trivial internal lines, do not mint it — leave it in the bucket and let it ride with the next real change. A release with three versions of two bullets each is the symptom this rule exists to prevent; those should have been one version.
- **Recovery when drift already happened.** Versions that were never published to production/tagged are not public, so they are **not protected by B3's "never renumber public versions"**. Squash them: collapse every unpublished version's entries into one `[Unreleased]` section, reset the manifest to the last *actually released* version, then mint one version. Only versions with a real deploy/tag/build behind them are frozen. If it is unclear whether a version ever shipped, treat it as shipped and ask the user.
- **Date = confirmed live, not drafted.** The version's date (CHANGELOG heading, `releases.json`) is the day C5's live-verification passes, never the day the entry was drafted or committed. Readers read the date as "when I got this," not "when the dev wrote the note." Same-day push makes the two dates match by default; they diverge on a late-night commit or a build that fails and gets fixed the next day — verified-live wins.

## B. Identify & audit

### B1. Identify the current version — cold-start, not session-memory

Run this check **each time a problem is closed and about to be recorded** — not once at the end of a session. It answers "does this entry go into a new version or the one already open?" Never rely on remembering a prior session: every time this step runs — 5 minutes or 5 months since the last run — it must re-derive the correct state from the repo alone.

1. Read `package.json` (or equivalent) for the recorded version.
2. Read `CHANGELOG.md` to identify the last documented version (`<last-version>`).
3. Determine the release state **before** deciding any bump. Web app: before concluding *Pre-bump* or *Mid-release*, confirm the top CHANGELOG version actually reached production (step 4b's remote check) — a manifest and CHANGELOG agreeing on a version production never received are consistent-looking drift, not Pre-bump. *Unreleased open* needs no remote check.

| State | Condition | Action |
|-------|-----------|--------|
| **Unreleased open** | `CHANGELOG.md` has an `## [Unreleased]` section on top | Normal working state (A5) — append the entry there, do NOT bump anything |
| **Pre-bump** | `package.json` == CHANGELOG top version | Nothing pending. Recording a change → open a new `## [Unreleased]`; releasing now → reconstruct the accumulation (steps 4–5) and mint exactly once |
| **Mid-release** | `package.json` > CHANGELOG top version | Already bumped, version still open — append to it, do NOT bump again |
| **Drifted** | unshipped versions sit above the last deployed/tagged version — the threshold follows A5's two shipping models. **Web / continuously-deployed: ≥1** — a single CHANGELOG version entry or manifest bump with no production deploy behind it already breaks A5's "local == production"; web has no normal one-ahead state. **Distributed-artifact (Tauri/CLI): ≥2** — one untagged version matching the manifest is the normal mid-release state (A5's Pre-Bump Guard); resolve via *Unreleased open* / *Pre-bump* above, do not block | Apply A5's recovery (squash unpublished entries back into `[Unreleased]`, reset the manifest to the last actually-released version, mint once) before doing anything else. Recovery always runs **backward**: never legitimize an orphan forward by backfilling it as a tag/GitHub Release — it was never public, so it has no history to protect (B3 shields published versions only) |
| **Mismatch** | any other disagreement | Warn the user, do not auto-fix |

4. Find the boundary commit for `<last-version>` using this sequence:
   a. The commit that wrote the CHANGELOG entry — the strongest anchor, since the entry itself marks the release boundary: `git log -1 --format=%H -S "[<last-version>]" -- CHANGELOG.md`
   b. Production baseline verification (stack-specific, strictly remote):
      - **App (Tauri/Desktop/CLI):** Check remote git tags (`git ls-remote --tags origin`) and GitHub Releases.
      - **Web (Nuxt Cloudflare / AkiNuxtCf):** Check remote GitHub state (published `app/data/releases.json` / remote GitHub tags).
   c. A release commit message — use fixed strings (`.` is a regex wildcard): `git log --fixed-strings --grep="<last-version>" -n 1 --format="%H"` (A later commit that merely *mentions* the version, e.g. "fix regression from 1.4.2", is NOT the boundary — inspect the hit before trusting it.)
   d. If no boundary is found, **do not scan the entire history**. Fall back to `git log --oneline -20`, analyze manually, and ask the user to confirm the boundary if there is any ambiguity.
5. Run `git log <boundary-commit>..HEAD --oneline` to get the complete, unbounded list of accumulated changes since the last release.
6. Fresh repo: fewer than ~5 commits, or no version recorded anywhere yet → treat the entire history as the current accumulation.

### B2. The real anti-skip invariant

A version jump is only actually wrong when there is evidence that a release boundary was already completed and left unrecorded. Concretely:
- Every git tag matching a version pattern (if tags are used) MUST have exactly one matching CHANGELOG entry.
- Every entry in `app/data/releases.json` (web stacks) MUST have exactly one matching CHANGELOG entry, and vice versa.
- CHANGELOG versions must increase monotonically with no gaps or duplicates.

If a tag or milestone exists without a matching entry, write the missing entry retroactively. Do not just warn and move on.

### B3. Audit mode — for legacy or imported projects

Run once when `CHANGELOG.md` was not produced under this rule from project inception:
1. Verify monotonic order of all versions in `CHANGELOG.md`.
2. Cross-check against all version-pattern git tags.
3. Cross-check against `app/data/releases.json` (if it exists).
4. Report mismatches and propose retroactive entries for any gaps. Never renumber or delete public versions.
5. If a gap's historical content cannot be determined (a tag exists but nobody knows what it contained), the retroactive entry must say so explicitly ("historical content unknown") — never invent or infer changes that cannot be verified.

### B4. GitHub Release — create it, do not just describe it

A pushed git tag is **not** a release: A1 lists the GitHub Release as a required artifact alongside CHANGELOG/releases.json. Stopping at `git push --tags` and reporting "released" is the exact gap this item closes — the Releases page still shows the previous version while the tag and code have moved on.

After updating CHANGELOG and the version bump, produce the GitHub Release without waiting to be asked:
- **Repo publishes GitHub Releases and `gh` is available** (`gh release list` succeeds) → create it directly: `gh release create <tag> --title "…" --notes-file <file> --latest`. An already-pushed tag is reused, not duplicated. Verify with `gh release list` that the new version now reads `Latest`.
- **Otherwise** (no `gh`, or the user will publish manually) → output the copy-ready block below instead.
- Before minting, cross-check tags against Releases (`gh release list` vs `git tag`) and offer to backfill any tag that has no matching Release, so the Releases page has no gaps.

**Title:** `v{version}: {2-5 word specific impact}` — no generic words ("patch fixes", "bug fixes", "improvements")
- Good: `v1.5.1: fix production icons blank, caret, grid gap`
- Bad: `v1.5.1: patch fixes`, `v1.5.1: various improvements`

**Body:** same `#### Fixed` / `#### Changed` / `#### Added` sections as CHANGELOG, but each bullet trimmed to one short sentence — symptom first, no file paths, no internal jargon.

**Compare link (GitHub-hosted repos — mandatory footer):** the notes end with `**Full Changelog**: <repo-url>/compare/<prev-tag>...<new-tag>` — or use `gh release create --generate-notes`, which inserts it automatically. The Release page renders notes only, never a diff, and the tag itself points at a single commit (usually the version-mint commit, a tiny diff) — without this line there is no one-click view of the commits accumulated since the previous release. First release with no prior tag: link `<repo-url>/commits/<new-tag>` instead.

**`--generate-notes` alone is not a substitute for Title/Body above.** It derives content from merged PRs only; a repo that commits straight to trunk (no PR history) gets a near-empty body — footer line only. Pair it with `--notes-file` for real content, or, when release creation is CI-automated rather than run interactively, have the workflow itself extract the tagged version's CHANGELOG section into the notes file — the content requirement above still applies even though no one is typing the `gh release create` command by hand.

### B5. Migration/infra completeness gate — a schema or infra change is not "released" until it ran

A CHANGELOG or `releases.json` entry that describes a database schema change or any other infra-dependent change (migration, remote config, env var, cron/schedule registration — see [[RULE-coding]] B3) is a claim that the change is live. That claim is only true once two things both hold, not one:

1. **The migration/infra action actually succeeded against the real target** — for a DB change, the migration ran against the production database (not just local/dev), and its own stated postconditions were checked (row counts, expected columns/tables), not assumed.
2. **The script is marked complete in the repo's own convention** — e.g. moved out of a pending location (`scripts/`) into its done location (`scripts/done/`), or whatever equivalent completion marker the project uses. A migration file still sitting in the pending location is itself the signal that step 1 has not been confirmed, regardless of what the CHANGELOG says.

Do not report a plan, task, or release/deploy as complete when a migration/infra step it depends on has not cleared **both** conditions. A written migration script plus a "Added" changelog line with the actual execution still outstanding is exactly the failure this gate exists to catch — the code shipped, the database did not, and nothing else in the release checklist would have noticed.

### B6. Content discipline
- Release note copy: no em/en dash (`—` `–`); short user-facing sentences, benefit first. See [[RULE-content-write]].
- Keep terminology stable across versions (e.g. always "Release Notes", not mixed synonyms). See [[RULE-content-write]] semantic stability.
- Doc/version moves are part of the change, not an afterthought. See [[RULE-docs]].

### B7. Pre-ship gate — work finished, nothing pushed yet

The last moment a mistake is still cheap: the work is done, the tree is clean, and nothing is public. This gate **composes rules that already exist** rather than adding new ones — its value is being one entry point instead of five scattered ones. It is a **pass/fail check, not a report**: every failure is fixed before shipping, and it produces no audit doc (contrast `docs.C`, which records findings precisely because its baseline is already published).

Run in order; each step names the rule that owns it.

0. **Leftover triage** — a tree that is not uniformly finished is classified first: finished / mid-edit / abandoned / accidental (the `/akigitcommit` step-0 taxonomy, under [[RULE-agent-behavior]] B5's read-only floor). Mid-edit vs abandoned is undecidable from the tree alone — that is an escalation (B8), never a guess.
1. **Release state** — derive it cold from the repo per B1, never from session memory. `Drifted` blocks everything until A5's recovery has run.
2. **Hygiene sweep — scoped to the accumulation, never the whole repo.** On the files touched since the boundary commit (B1.5): scythe `[WRAP]`/`[YAP]` lint ([[RULE-agent-behavior]] §0), dead code / redundant guards / duplication the accumulation itself introduced (`pattern.A8`; subtract-class detectors at diff scope), and doc references in touched comments still resolving ([[RULE-docs]] B3). A repo-wide subtraction or zero-trust sweep is a separately scheduled audit, never a per-release cost — diff scope is what keeps this gate affordable at many releases per day. Unlike an audit, findings here are fixed in place: this is a gate, not a report.
3. **External-action completeness** — every change whose "done" depends on something outside the repo actually happened: migrations ran against the real target and their postconditions were checked, remote config/env vars/cron registrations are live, and each script sits in its completion location (B5, [[RULE-coding]] B3). A green build proves nothing about the database.
4. **Record truthfulness** — every closed problem has its `CHANGELOG.md` entry, and no entry claims something step 3 has not cleared (B2). Web stacks additionally need `releases.json` parity (C3).
5. **Doc sync** — plans whose work shipped moved to `docs/plan/done/`, and `arch`/`feat` docs match what is about to ship ([[RULE-docs]] B1, B3). A doc left stale here becomes next release's drift finding.
6. **Verification honesty** — anything only checkable at runtime is reported as unverified rather than assumed ([[RULE-coding]] B3). "Untested but I expect it works" is a valid gate output; a silent "Done" is not.
7. **Version decision** — mint or defer per A4/A5's materiality test. Do not mint a version to mark that a session ended.

Deploy verification is deliberately **not** in this gate — it happens after the push, against the live target, and is owned by the stack rule.

### B8. Autonomous full-release run — only an explicit `/akiship` invocation is the authorization

The B7 gate plus its surrounding ritual (fix findings → sync docs → CHANGELOG/`releases.json` → grouped commits → mint → artifacts) is routinely run as one unattended pass. **Activation is owned by the `/akiship` skill and is literal — this section is not a trigger.** The contract below has force only inside a user turn carrying the exact token `/akiship` that asks for the run to be performed; that skill's activation gate is the single source of truth for what counts (`pattern.A1`). Reading this section grants nothing — not its completion-intensity list, and not the fact that a keyword routed this file into context. Outside a valid invocation those words are ordinary vocabulary, and a turn without the token is answered, never executed (`agent.A3`: a question is not a request). This rule predates the skill and stays for the release-domain signals and narrow release context the skill does not carry; on *whether the run may start*, the skill's gate wins. Nothing here weakens [[RULE-agent-behavior]] B3 elsewhere; it exercises B3's "durably authorized" clause, scoped to the enumerated steps of one explicit invocation.

- **A valid `/akiship` invocation = standing authorization for every enumerated step.** Explicitly invoking the full run authorizes: fixing gate findings, CHANGELOG/`releases.json` edits, grouped commits (the akigitcommit confirm step is pre-answered — "commit luôn" semantics), the version mint per A4/A5, and tag/GitHub Release strictly per the repo's existing convention (A3, B4). Push and deploy are included only when the invocation names them **or carries a completion-intensity signal** (the same trigger set as the next bullet) — a plain `/akiship` with no intensity marker stays local-only; deploy still additionally requires the stack to auto-deploy on push (owned by the stack rule, not this contract).
- **Front-load the asks.** Derive B1 state and run B7 step 0 first; every escalation found is reported once, as one batch, and the run stops there. A clean front check means the run completes with zero mid-run questions — an automation that stalls on a question halfway through has failed this rule.
- **Escalation floor (canonical — `/akiship` references this list, never restates it, `pattern.A1`) — stop only for:** (1) public-history ambiguity — cannot determine whether a version actually shipped, or a `Mismatch`/`Drifted` state whose recovery would rewrite published versions (A5, B1); (2) work the tree cannot classify — mid-edit vs abandoned (B7 step 0); (3) contradiction with documented design, or scope beyond what the invocation named ([[RULE-agent-behavior]] B3).
- **Completion-intensity phrasing collapses condition (2) and unlocks push/deploy/GitHub-Release, never conditions (1) or (3).** The canonical phrase list — every other file (the `/akiship` skill, `README.md`) points here (`pattern.A1`): "trọn vẹn", "hoàn thành"/"hoàn thiện", "làm/xong hết", "tất cả"/"toàn bộ", or equivalent sentiment insisting the run finish everything, end to end — read **only inside a valid invocation**, where it modifies a run already authorized to start and never creates that authorization, does two things: resolves B7 step 0's mid-edit-vs-abandoned ambiguity toward **mid-edit by default** (finish and integrate the leftover instead of stopping to ask), and satisfies the previous bullet's push/deploy naming requirement, so the run pushes commits and tags, creates the GitHub Release, and runs post-push deploy verification (C5) without a separate mid-run confirmation. Conditions (1) and (3) gate on irreversibility (a published-version rewrite) and correctness (a documented-design contradiction), not on effort, so no phrasing intensity waives them — a "nghiêm trọng"/major-contradiction hit still stops the run.
- **A question the repo already answers is a violation.** Anything determined by the repo, its docs, these rules, or the invocation itself — bump level (A4), tag or no tag (existing convention), changelog channel and tone (C1) — is self-answered, never asked — and every remaining candidate question runs through `agent.A3`'s kill-tests first. Over-asking inside an authorized run is the same failure as acting unasked (`agent.A3`, `think.B5`).
- **This licence covers facts the repo determines, never what the owner meant.** A criterion stated in the owner's own words — what "trọn vẹn" must include, which leftovers count as debt and which are future plan — is his to define, and deciding it for him is not self-answering but overwriting the anchor. Report the open items and let him rule on them; when it is the owner's own wording that is ambiguous, that is the one question worth the interrupt.

## C. ⟨Aki⟩ Web release artifacts

### C1. Two separate channels — do not merge them
| File | Audience | Language | Tone |
|------|----------|----------|------|
| `CHANGELOG.md` | developer / technical | English only | Precise, may name files/symbols. Keep a Changelog format (`Added` / `Changed` / `Fixed` / `Removed`) |
| `app/data/releases.json` | public / end user | Bilingual EN + VI if the site is multilingual (default EN); EN-only if single-language | Popular, user-friendly, benefit-first. No jargon, no file paths |

The changelog explains *what changed and why* for maintainers. The release note tells users *what they get*. Write them separately; do not paste changelog lines into the release note.

`releases.json` exists **only where a public web page renders it** (the Nuxt stack's release-notes page). Tauri, CLI, and other non-web projects keep `CHANGELOG.md` only — a release-notes file nothing renders is dead data; do not create one. Where `releases.json` does not exist, every rule below that mentions it simply does not apply.

### C2. releases.json schema
- Single-language site: `{ version, date, title, changes: [{ type, text }] }`
- Multilingual site: localize the human text — `title: { en, vi }`, `changes: [{ type, text: { en, vi } }]`. Keep `version`, `date`, `type` locale-neutral. Default/fallback language is English.
- `type` is one of `new` | `improved` | `fixed` (stable badge keys).

### C3. No version gaps in releases.json
Every version that appears in `CHANGELOG.md` MUST also appear in `releases.json`. Skipping a version because it is "internal" or "technical" is not allowed — it creates visible number jumps that users notice and distrust.

**If a version contains only internal/technical changes** (scripts, refactors, build tooling), write a brief user-friendly summary instead of omitting it entirely. Use one of these patterns:
- `"type": "improved"` — "Under-the-hood improvements for stability and performance"
- `"type": "fixed"` — "URL or display fixes" (describe the symptom a user would notice, not the cause)
- `"type": "improved"` — "Build and SEO tooling updates (no visible change for users)"

Never leave a gap like `1.0.5 → 1.0.7` or `0.1.0 → 0.1.3` in releases.json. A one-line entry is better than a missing version.

### C4. Sync check — required before closing a task
After editing `CHANGELOG.md` or `releases.json`, run:

```
grep '"version"' app/data/releases.json
grep -E '^## \[' CHANGELOG.md
```

Confirm every CHANGELOG version has a matching entry in releases.json and the order (newest-first in releases.json, newest-first in CHANGELOG) is consistent. Fix any gap before the task is done.

### C5. Live production verification
Never trust a deployment CLI's success status alone. A web deploy is only verified when the live production URL explicitly returns the new version data.
Wait ~3 minutes after a successful push/build, then fetch the rendered `/releases/` page and grep the version string — do NOT assume a `releases.json` static endpoint exists (it usually doesn't; `releases.json` is typically bundled into client JS, not served at a public path). The version-number CSS class differs per site (`rl-version`, `release-version`, or none at all), so match the semver text itself, not the class:

```
curl -s https://<production-domain>/releases/ | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1
```

Confirm the printed version matches what was just released. Verified across the AkiNet ecosystem (8 sites, differing CSS class names, one with no version class at all) — this pattern works regardless of markup since every site renders the version as literal `v{{version}}` text.
