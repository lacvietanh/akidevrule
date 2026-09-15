# Research — the Windows CI matrix does not gate the agy permission rules, and what does

**Status:** amended 2026-09-15

**Start time:** 2026-08-22, while pre-clearing the accumulation so a later `/akiship` run on the Mac finds nothing open.

## 1. Initial purpose

This round shipped a fix making `install.py` emit the platform's Python launchers (`py -3`/`python` on Windows, `python3` elsewhere) for agy's literal-prefix permission matcher, and recorded it as **"Not tested on Windows; the `windows-latest` CI matrix stays the gate for the installer, as it has since 2.0.0."** The question: is that gate claim true for *these* rules, and can the doubt be closed without a Windows machine (`coding.B5` — climb the ladder before handing anything to the owner).

## 2. Strategy

Read what the CI job actually executes and asserts, rather than trusting the sentence that names it. Then, for whatever the CI does not reach, run rung 4 — simulate the platform locally instead of requesting it: import `install.py` with `sys.platform` patched and a disposable `HOME`, let it write into a fabricated `~/.gemini`, and read back the rule set it produced.

## 3. Checklist

1. Read `.github/workflows/install-smoke.yml` end to end — steps, env, assertions.
2. Determine which installer code paths a clean sandbox `HOME` can reach.
3. Simulate `linux` and `win32` rule generation locally; count and inspect the emitted rules.
4. Check that a pre-existing user rule survives the merge and that no dead glob rule is re-introduced.

## 4. Result

**The CI matrix does not gate these rules.** `install-smoke.yml` runs `python install.py` against a sandbox `HOME` on ubuntu/macos/windows and asserts an install manifest (seven files present) plus LF-cleanliness. `merge_antigravity_permissions()` returns immediately when `~/.gemini` is absent, and a clean sandbox `HOME` never has it — the workflow's own comment says as much about the `~/.gemini` artifacts. So the Windows job proves the installer *runs* on Windows and writes LF text; it has never executed one line of the permission-rule code, on any platform. The round's sentence was true about the installer as a whole and false about the part it was attached to.

**Simulation closes the doubt the CI could not.** Importing `install.py` with `sys.platform` patched, against a disposable `HOME` seeded with `~/.gemini/settings.json` carrying one pre-existing user rule:

| `sys.platform` | managed `command()` rules | tilde renderings | file rules | launchers emitted | user rule kept | glob leftovers |
|---|---|---|---|---|---|---|
| `linux` | 20 | 10 | 4 | `python3` | yes | 0 |
| `win32` | 60 | 30 | 4 | `py -3`, `python`, `python3` | yes | 0 |

5 akiflow scripts × 2 skill roots × 2 path renderings × launcher count — 20 and 60 exactly, matching the numbers the round had published as derived rather than measured. Both renderings appear for every script; the pre-existing `command(keep-me)` survives the merge untouched; no `*` rule is present in either output.

### Verification

- **Measured:** the rule set `install.py` emits under each platform value, read back from the JSON it wrote. This is the artifact the matcher consumes, computed without the machine that would consume it.
- **Still not measured, and narrower than before:** whether agy's Windows build accepts those strings. That is vendor behavior on a platform this repo has no access to — rung 3/5 of `coding.B5`, unchanged by this probe. What *is* now closed is the generation side, which is the part the repo owns.
- **Not claimed:** that CI is worthless here. It gates install correctness and LF discipline on three platforms, which is what it was built for. The correction is only to the sentence that borrowed it as evidence for the permission rules.
- **Reopen trigger:** a report that `/akiflow` scripts are denied on Windows despite a fresh install — that would move the failure from generation (now measured) to matching (still unmeasured).

## 5. Decision

**Action** — the CHANGELOG entry for the agy permission fix is corrected in place, before the round is released: the rule counts move from derived to measured, and the CI-as-gate claim is scoped to what the workflow actually executes. No installer or workflow change: the generation side is verified, and extending CI to fabricate a `~/.gemini` would be an infrastructure change beyond what this round was asked for — recorded here as the obvious next step if the matching side ever needs a gate.

**Cross-references** — [handoff-vs-self-verification-aug21.md](handoff-vs-self-verification-aug21.md) (V5, which first raised the Windows launcher question and closed it by construction); [../plan/done/antigravity-non-workspace-permissions.md](../plan/done/antigravity-non-workspace-permissions.md) (the plan whose S7 produced the dual-rendering rule set measured here).

## Amendments

**2026-09-15 — Status: amended.** Section 4's `install.py` and clean-home description is superseded by the Node installer and current smoke workflow. The workflow now seeds `~/.gemini`, exercises Antigravity permission merging on all three OS runners and Node 18/20, and checks field-only changes without modifying a complete allowlist. This amendment changes the CI scope stated in the historical result, not its Decision: the generation-side probe remains the evidence for exact Windows launcher strings, while the current matrix also regression-tests the merge path.
