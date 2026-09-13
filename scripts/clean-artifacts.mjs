#!/usr/bin/env node
// Strip regenerable junk (Python bytecode, macOS Finder metadata) from the tree
// before packing. npm's `files` allowlist force-includes whole directories
// (payload/, skills/, claude/) and the root .npmignore does not prune inside
// them, so a stray __pycache__ left by running a shipped .py script would ship
// silently. Wired to `prepack` — see package.json.
import { readdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set(["node_modules", ".git", ".local-test"]);
const JUNK_FILE = /\.py[co]$|^\.DS_Store$/;

let removed = 0;

function walk(dir) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isSymbolicLink()) continue;
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      if (ent.name === "__pycache__") {
        rmSync(full, { recursive: true, force: true });
        removed++;
        continue;
      }
      walk(full);
    } else if (JUNK_FILE.test(ent.name)) {
      rmSync(full, { force: true });
      removed++;
    }
  }
}

walk(PKG_ROOT);
process.stdout.write(`clean-artifacts: removed ${removed} junk path(s)\n`);
