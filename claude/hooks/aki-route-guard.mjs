#!/usr/bin/env node
// PreToolUse route gate, fail-open. Design: docs/research/rule-delivery-second-hop-sep29.md
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname, basename, extname } from "node:path";

const HOME = homedir();
const RULE_DIR = join(HOME, ".aki", "akidevrule");
const CONFIG_DIR = process.env.CLAUDE_CONFIG_DIR || join(HOME, ".claude");
const MARK = "aki-route-guard";
const COMPACT = "compact_boundary";
const MAX_DENIALS_PER_RULE = 3; // a detection bug must never lock a session; after this many denials in one compaction segment the rule is treated as read

const CODE_EXT = new Set(["ts", "tsx", "js", "jsx", "mjs", "cjs", "vue", "svelte", "rs", "py", "go", "rb", "php", "java", "kt", "swift", "c", "cc", "cpp", "h", "hpp", "cs", "sh", "bash", "zsh", "ps1", "sql", "css", "scss", "lua", "dart"]);
const FRONTEND_EXT = new Set(["vue", "svelte", "css", "scss", "tsx", "jsx"]);
const TEST_NAME = /\.(test|spec)\.[a-z]+$|_test\.[a-z]+$|^test_.*\.py$|^conftest\.py$/;
const TEST_DIR = /(^|\/)(test|tests|__tests__|spec)\//;

function allow() {
  process.exit(0);
}

/** Rule files a path routes to; only routes with an artifact signature (docs/research/rule-delivery-second-hop-sep29.md §2). */
function routesFor(filePath, cwd) {
  const p = filePath.replace(/\\/g, "/");
  const name = basename(p);
  const ext = extname(name).slice(1).toLowerCase();
  const rules = new Set();
  const root = cwd ? cwd.replace(/\\/g, "/") + "/" : "";
  const rel = "/" + (root && p.startsWith(root) ? p.slice(root.length) : p.replace(/^\//, "")); // directory routes match inside the project only: a project under ~/tests/ or ~/lang/ must not route every file
  if (TEST_NAME.test(name) || (TEST_DIR.test(rel) && ext !== "md")) rules.add("RULE-test.md");
  if (CODE_EXT.has(ext)) {
    rules.add("RULE-coding.md");
    rules.add("RULE-pattern-core.md");
  }
  if (ext === "md") rules.add("RULE-docs.md");
  if (name === "CHANGELOG.md" || name === "releases.json") rules.add("RULE-release.md");
  if (FRONTEND_EXT.has(ext)) rules.add("RULE-ui-pattern.md");
  if (ext === "sql" || /\/migrations\//.test(rel)) rules.add("RULE-db-design.md");
  if (/\/(locales|i18n|lang)\//.test(rel)) rules.add("RULE-content-write.md");
  if (ext === "rs" || /\/src-tauri\//.test(rel) || name === "tauri.conf.json") rules.add("RULE-stack-tauri.md");
  if ((ext === "vue" || ext === "ts") && isNuxtProject(cwd)) rules.add("RULE-stack-akiNuxtCf.md");
  return rules;
}

/** Scratchpad, harness state and the corpus itself: files no project rule governs, so a Q&A session that writes a throwaway script or a memory note stays ungated. */
function isUngatedPath(filePath, cwd) {
  const p = filePath.replace(/\\/g, "/");
  if (p.includes("/.aki/")) return true;
  if (p.startsWith(CONFIG_DIR.replace(/\\/g, "/") + "/")) return true;
  if (/^\/tmp\//.test(p) || /\/scratchpad\//.test(p)) return true;
  if (cwd && !p.startsWith(cwd.replace(/\\/g, "/") + "/")) return true;
  return false;
}

function isNuxtProject(cwd) {
  if (!cwd) return false;
  return ["nuxt.config.ts", "nuxt.config.js", "nuxt.config.mjs"].some((f) => existsSync(join(cwd, f)));
}

/** Rule files the harness already embeds via `@` imports in the global CLAUDE.md; never gated. */
function residentRules() {
  const out = new Set();
  try {
    for (const line of readFileSync(join(CONFIG_DIR, "CLAUDE.md"), "utf8").split("\n")) {
      const m = line.match(/^@.*\/((?:RULE|METHOD)-[\w-]+\.md)\s*$/);
      if (m) out.add(m[1]);
    }
  } catch {
    /* no global file: nothing is resident */
  }
  return out;
}

/** The transcript that records this actor's own tool calls: the subagent file when the hook fires inside a subagent, else the session transcript. */
function transcriptFor(input) {
  const main = input.transcript_path;
  if (input.agent_id) {
    const sub = join(dirname(main), input.session_id, "subagents", `agent-${input.agent_id}.jsonl`);
    if (existsSync(sub)) return sub;
  }
  return main;
}

/** Scan a transcript once: which rule files were Read (Read tool, or a Bash cat/sed/head/bat of the file) since the last compaction, and how many times this hook already denied for each in that segment. A compaction drops the rule text from the model's context, so reads and denials before it do not count (agent.B7 row 2). */
function scanTranscript(path, wanted) {
  const read = new Set();
  const denials = new Map();
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return { read, denials, unreadable: true };
  }
  for (const line of text.split("\n")) {
    if (!line.includes("akidevrule") && !line.includes(MARK) && !line.includes(COMPACT)) continue;
    let d;
    try {
      d = JSON.parse(line);
    } catch {
      continue;
    }
    if (d.type === "system" && d.subtype === COMPACT) {
      read.clear();
      denials.clear();
    } else if (d.type === "assistant") {
      const content = d.message && Array.isArray(d.message.content) ? d.message.content : [];
      for (const c of content) {
        if (!c || c.type !== "tool_use" || !c.input) continue;
        if (c.name === "Read") {
          const target = String(c.input.file_path || "");
          for (const r of wanted) if (target.endsWith(r)) read.add(r);
        } else if (c.name === "Bash") {
          const cmd = String(c.input.command || "");
          for (const r of wanted) if (new RegExp(`\\b(cat|sed|head|bat|less)\\b[^|;&\\n]*${r.replace(".", "\\.")}`).test(cmd)) read.add(r);
        }
      }
    } else if (d.attachment && typeof d.attachment.stdout === "string" && d.attachment.stdout.includes(MARK)) {
      for (const r of wanted) if (d.attachment.stdout.includes(r)) denials.set(r, (denials.get(r) || 0) + 1);
    }
  }
  return { read, denials, unreadable: false };
}

function deny(missing, filePath) {
  const files = missing.map((r) => `~/.aki/akidevrule/${r}`).join(" and ");
  const reason = `[${MARK}] Editing ${basename(filePath)} is gated on rule files not read since the last compaction of this session: ${missing.join(", ")}. Read ${files} in full with the Read tool, add them to the [RULES] receipt, then retry this edit.`;
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }) + "\n");
  process.exit(0);
}

function main() {
  if (process.env.AKI_ROUTE_GUARD === "0") allow();
  const input = JSON.parse(readFileSync(0, "utf8"));
  const ti = input.tool_input || {};
  const filePath = ti.file_path || ti.notebook_path;
  if (!filePath || !input.transcript_path) allow();
  if (isUngatedPath(filePath, input.cwd)) allow();
  const wanted = [...routesFor(filePath, input.cwd)].filter((r) => existsSync(join(RULE_DIR, r)));
  const resident = residentRules();
  const gated = wanted.filter((r) => !resident.has(r));
  if (gated.length === 0) allow();
  const { read, denials, unreadable } = scanTranscript(transcriptFor(input), gated);
  if (unreadable) allow();
  const missing = gated.filter((r) => !read.has(r) && (denials.get(r) || 0) < MAX_DENIALS_PER_RULE);
  if (missing.length === 0) allow();
  deny(missing, filePath);
}

try {
  main();
} catch {
  allow();
}
