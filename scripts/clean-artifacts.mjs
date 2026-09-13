#!/usr/bin/env node
// prepack: `files` force-includes whole dirs that .npmignore cannot prune inside, so a __pycache__ from running a skill script would ship.
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
