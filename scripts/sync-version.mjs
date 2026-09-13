#!/usr/bin/env node
// Derive package.json "version" from the latest released CHANGELOG.md heading.
//
// CHANGELOG.md is the single source of truth for the version — the same regex
// install.py and the SessionStart hook (aki_version_check.py) use. Wired to
// `prepack` so the published tarball always matches CHANGELOG. `--check` mode
// exits non-zero when the two drift (use it as a CI guard).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHANGELOG = join(PKG_ROOT, "CHANGELOG.md");
const PKG_JSON = join(PKG_ROOT, "package.json");
const checkOnly = process.argv.includes("--check");

// Matches aki_version_check.py: ^##\s*\[(\d+\.\d+\.\d+)\] — first (newest)
// released heading. "[Unreleased]" and other non-semver headings are skipped.
const changelog = readFileSync(CHANGELOG, "utf8");
const m = changelog.match(/^##\s*\[(\d+\.\d+\.\d+)\]/m);
if (!m) {
  process.stderr.write(
    "sync-version: no released version heading (## [x.y.z]) found in CHANGELOG.md\n"
  );
  process.exit(1);
}
const version = m[1];

const pkg = JSON.parse(readFileSync(PKG_JSON, "utf8"));

if (pkg.version === version) {
  process.stdout.write(`sync-version: package.json already at ${version}\n`);
  process.exit(0);
}

if (checkOnly) {
  process.stderr.write(
    `sync-version: DRIFT — package.json is ${pkg.version}, CHANGELOG latest is ${version}. ` +
      "Run `npm run sync-version`.\n"
  );
  process.exit(1);
}

pkg.version = version;
writeFileSync(PKG_JSON, JSON.stringify(pkg, null, 2) + "\n");
process.stdout.write(`sync-version: package.json version -> ${version}\n`);
