// Shared version-status parser for akidevrule (pattern.A1 SSOT).
//
// Imported by both install.mjs (--check / inspect) and aki-update-check.mjs
// (SessionStart notify hook), so the two never classify the same CHANGELOG
// differently. A keep-a-changelog file's *latest released* version is its first
// `## [x.y.z]` heading — the `[Unreleased]` buffer at the top (release.A5's
// normal working state) is never a version and must be skipped.
import { statSync } from "node:fs";
import { join } from "node:path";

export const REMOTE_CHANGELOG_URL =
  "https://raw.githubusercontent.com/lacvietanh/akidevrule/master/CHANGELOG.md";
export const NETWORK_TIMEOUT_MS = 3000;

export const STATE_MISSING = "missing";
export const STATE_CURRENT = "current";
export const STATE_UPDATE = "update";
export const STATE_AHEAD = "ahead";
export const STATE_UNKNOWN = "unknown";

const VERSION_HEADING_RE = /^##\s*\[(\d+\.\d+\.\d+)\]/m;

/** First released `## [x.y.z]` heading, skipping `[Unreleased]`. null if absent/unparseable. */
export function parseChangelogVersion(text) {
  if (!text) return null;
  const m = text.match(VERSION_HEADING_RE);
  return m ? m[1] : null;
}

/** -1/0/1 for a<b / a==b / a>b on 3-part numeric semver. Either side missing -> 0 (no claim). */
export function cmpSemver(a, b) {
  if (!a || !b) return 0;
  const pa = a.split(".");
  const pb = b.split(".");
  for (let i = 0; i < 3; i++) {
    const x = i < pa.length ? parseInt(pa[i], 10) : 0;
    const y = i < pb.length ? parseInt(pb[i], 10) : 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

/** Raw text of the public CHANGELOG.md. null on any network/HTTP failure — never throws. */
export async function fetchRemoteChangelog(timeoutMs = NETWORK_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(REMOTE_CHANGELOG_URL, {
      headers: { "User-Agent": "aki-update-check" },
      signal: controller.signal,
    });
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function isFile(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

/** True when installRoot looks intact enough to compare (CHANGELOG.md and index.md both present). */
export function localInstallPresent(installRoot) {
  return isFile(join(installRoot, "CHANGELOG.md")) && isFile(join(installRoot, "index.md"));
}

/** One of the STATE_* constants — see README.md "Update notifications" for the full 5-state table. */
export function classifyState(localPresent, localVersion, remoteVersion) {
  if (!localPresent) return STATE_MISSING;
  if (remoteVersion == null) return STATE_UNKNOWN;
  if (localVersion == null) return STATE_AHEAD;
  const cmp = cmpSemver(localVersion, remoteVersion);
  if (cmp === 0) return STATE_CURRENT;
  if (cmp < 0) return STATE_UPDATE;
  return STATE_AHEAD;
}
