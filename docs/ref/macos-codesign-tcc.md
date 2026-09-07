# Local macOS codesign and TCC

The one AkiDevRule lookup for this chain. `tauri.B7` is the concise rule (do not delete it); `install.py` deploys this file to `~/.aki/akidevrule/docs/ref/macos-codesign-tcc.md`. Evidence trail: `docs/research/macos-tcc-tauri-boundary-aug21.md`.

**Stable self-signed identity keeps TCC grants across rebuilds. Apple ad-hoc (`codesign --sign -`) does not.** Artifact names, install paths, and identity names live in that project’s own docs — not here.

## Responsible process

TCC judges a child (`git`/`rsync`/`ssh`/a CLI spawned by `std::process::Command`, `tauri-plugin-shell`, a PTY) by the **responsible process** at the head of the chain, inherited across `fork`/`posix_spawn`. Inside a shipped `.app` that is the bundle, never the user’s Terminal. Symptom: the same sidecar works in Terminal and is denied (`EPERM`, or a consent dialog naming the app) only in the bundle.

## Three switches (not peers)

- **Full Disk Access** (`kTCCServiceSystemPolicyAllFiles`) — top of the chain, a superset. If the responsible app holds it, protected locations are readable with no per-folder prompt. Request only when reach is genuinely unbounded.
- **Files & Folders** (`kTCCServiceSystemPolicyDocumentsFolder`, `…DesktopFolder`, `…DownloadsFolder`, plus removable/network volumes) — least privilege; consulted only when there is no FDA. A refusal is **sticky**: one “Don’t Allow” = denial with no re-prompt. Recovery is `tccutil reset` or **removing** the app’s entry — flipping the toggle back on restores access but not prompting.
- **Developer Tools** (`kTCCServiceDeveloperTool`) — **not file access.** Gatekeeper exemption for software the app *runs* (unsigned/ad-hoc sidecars, local toolchains). It silences no Files & Folders dialog.

Scope every spawn (`cwd`, workspace, app data dir). An unbounded walk from `$HOME` is a prompt/`EPERM` storm charged to the bundle.

This chain governs consent-based **reads**. User-picked Open/Save or drag-and-drop paths, and file *writes*, are a different diagnosis.

When the switch is unknown: `log show --predicate 'subsystem == "com.apple.TCC"' --last 5m` prints `AttributionChain` and the result.

## What TCC stores

TCC does not store “this app path is allowed”. It stores a **code signing requirement** (`csreq`). At check time it evaluates the running binary against that requirement.

| How the binary is signed | Designated requirement (typical) | Rebuild |
|---|---|---|
| Ad-hoc (`-`) | pinned to that build’s **CDHash** | CDHash changes → stored `csreq` fails → grant gone (Settings toggle can still look ON) |
| Named cert (self-signed or Developer ID) | `identifier "bundle.id" and certificate leaf = H"…"` | CDHash still changes; **leaf hash does not** → grant holds |

Measured 2026-08-28 on a Tauri `.app` re-signed with a login-keychain identity: DR was `identifier "<bundle-id>" and certificate leaf = H"…"`. CDHash is expected to change next compile.

Do **not** regenerate the cert. A new leaf hash is a new DR; every existing grant dies. Create once; reuse.

`security find-identity -p codesigning -v` lists only **trusted** identities. A self-signed cert often shows `CSSMERR_TP_NOT_TRUSTED` and vanishes from `-v`. `codesign --sign "Name"` still works. Probe without `-v`.

`sudo codesign` is wrong: root’s keychain is not the login keychain. If the installed `.app` is root-owned from an old `sudo cp`, `chown` once, then sign as the user.

## Gatekeeper is not TCC

| | Trigger | Survives rebuild? |
|---|---|---|
| **Gatekeeper** | `com.apple.quarantine` (downloads). Local compile typically has none | N/A if never quarantined |
| **TCC** | first access to a protected resource | yes iff DR stays the same cert+identifier |

`xattr -cr` on the installed `.app` strips quarantine if something set it. It does not reset TCC. A “right-click Open once” warning is a Gatekeeper first-launch, not a TCC grant.

## Rebuild and designated requirement

A Tauri bundle step ad-hoc-signs. Overwriting that signature with the **same** named identity is required every build; that is the mechanism, not wasted work. `codesign --force --sign "…"` must preserve entitlements. Skip `codesign` after a bundle and you ship ad-hoc again.

TCC evaluates the **running** binary against the stored `csreq`. The signed artifact and the `.app` the user launches must be the same path with the same DR. Signing a build output then opening a leftover copy does not keep the grant.

`tccutil reset` only clears stale state; it does not prevent the next loss. Install location and identity display name live in that project’s docs.

## Sources

[Apple TN3127 — Inside Code Signing: Requirements](https://developer.apple.com/documentation/technotes/tn3127-inside-code-signing-requirements) · [Nick Liu — TCC pins Accessibility to a cdhash](https://www.nick-liu.com/posts/tcc-cdhash-trap/) · [Eclectic Light — app first run / quarantine](https://eclecticlight.co/2020/01/27/what-could-possibly-go-wrong-on-an-app-first-run/) · `tauri.B7` · `docs/research/macos-tcc-tauri-boundary-aug21.md` §5 + §5b
