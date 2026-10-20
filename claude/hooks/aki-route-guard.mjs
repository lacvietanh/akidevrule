#!/usr/bin/env node
// PreToolUse route gate, fail-open. Design: docs/research/rule-delivery-second-hop-sep29.md
import { readFileSync, existsSync, statSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname, basename, extname } from "node:path";

const HOME = homedir();
const RULE_DIR = join(HOME, ".aki", "akidevrule");
const CONFIG_DIR = process.env.CLAUDE_CONFIG_DIR || join(HOME, ".claude");
const MARK = "aki-route-guard";
const COMPACT = "compact_boundary";
const MAX_DENIALS_PER_RULE = 3; // a detection bug must never lock a session; after this many denials in one compaction segment the rule is treated as read

const MAX_WIDEN_BYTES = 60000; // the Read tool refuses files over ~25k tokens; above this a partial read is the only possible one

function allow() {
  process.exit(0);
}

/** payload/route-map.json (installed to RULE_DIR), the one path-to-rule map; null when missing or invalid so the gate fails open. */
function loadMap() {
  try {
    const m = JSON.parse(readFileSync(join(RULE_DIR, "route-map.json"), "utf8"));
    return Array.isArray(m.routes) && m.ungated ? m : null;
  } catch {
    return null;
  }
}

/** Rule files a path routes to, interpreting the map's routes. */
function routesFor(map, filePath, cwd) {
  const p = filePath.replace(/\\/g, "/");
  const name = basename(p);
  const ext = extname(name).slice(1).toLowerCase();
  const rules = new Set();
  const root = cwd ? cwd.replace(/\\/g, "/").replace(/\/+$/, "") + "/" : "";
  const rel = "/" + (root && p.startsWith(root) ? p.slice(root.length) : p.replace(/^\//, "")); // directory routes match inside the project only: a project under ~/tests/ or ~/lang/ must not route every file
  for (const r of map.routes) {
    const hit = (r.ext || []).includes(ext) || (r.name || []).includes(name) || (r.nameRe && new RegExp(r.nameRe).test(name)) || (r.dirRe && !(r.dirSkipExt || []).includes(ext) && new RegExp(r.dirRe).test(rel));
    if (hit && (!r.projectHas || (cwd && r.projectHas.some((f) => existsSync(join(cwd, f)))))) for (const x of r.rules) rules.add(x);
  }
  return rules;
}

/** Scratchpad, harness state and the corpus itself: files no project rule governs, so a Q&A session that writes a throwaway script or a memory note stays ungated. */
function isUngatedPath(map, filePath, cwd) {
  const p = filePath.replace(/\\/g, "/");
  const u = map.ungated;
  if ((u.segments || []).some((s) => p.includes(s))) return true;
  if (p.startsWith(CONFIG_DIR.replace(/\\/g, "/") + "/")) return true;
  if ((u.prefixes || []).some((s) => p.startsWith(s)) || (u.dirs || []).some((d) => p.includes(`/${d}/`))) return true;
  if (cwd && !p.startsWith(cwd.replace(/\\/g, "/").replace(/\/+$/, "") + "/")) return true;
  return false;
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

/** Scan a transcript once: which rule files were read whole (Read tool without offset/limit short of the file, or a Bash/Shell cat/bat/less of it; head/sed/tail never count) since the last compaction, and how many times this hook already denied for each in that segment. A compaction drops the rule text from the model's context, so reads and denials before it do not count (agent.B7 row 2). Claude Code stores the turn as type "assistant" and the Read target as file_path. Cursor stores role "assistant", the Read target as path, and the shell tool as Shell. */
function scanTranscript(path, wanted) {
  const read = new Set();
  const partial = new Set();
  const denials = new Map();
  const pending = new Map(); // partial Read tool_use id -> rules, resolved when the hook's updatedInput attachment for that id appears
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return { read, partial, denials, unreadable: true };
  }
  for (const line of text.split("\n")) {
    if (!line.includes("akidevrule") && !line.includes(MARK) && !line.includes(COMPACT)) continue;
    let d;
    try {
      d = JSON.parse(line);
    } catch {
      continue;
    }
    const assistant = d.type === "assistant" || d.role === "assistant";
    if (d.type === "system" && d.subtype === COMPACT) {
      read.clear();
      partial.clear();
      denials.clear();
      pending.clear();
    } else if (assistant) {
      const content = d.message && Array.isArray(d.message.content) ? d.message.content : [];
      for (const c of content) {
        if (!c || c.type !== "tool_use" || !c.input) continue;
        if (c.name === "Read") {
          const target = String(c.input.file_path || c.input.path || "");
          for (const r of wanted) {
            if (!target.endsWith(r)) continue;
            const whole = !(c.input.offset > 1) && (!c.input.limit || c.input.limit >= lineCount(r));
            (whole ? read : partial).add(r);
            if (!whole && c.id) pending.set(c.id, [...(pending.get(c.id) || []), r]);
          }
        } else if (c.name === "Bash" || c.name === "Shell") {
          const cmd = String(c.input.command || "");
          for (const r of wanted) {
            const name = r.replace(".", "\\.");
            for (const m of cmd.matchAll(new RegExp(`(?:^|[;&|(\\n])\\s*(?:cat|bat|less)\\s[^|;&\\n]*?${name}[^|;&\\n]*(\\|(?!\\|))?`, "g"))) (m[1] ? partial : read).add(r);
            if (new RegExp(`\\b(head|sed|tail)\\b[^|;&\\n]*${name}`).test(cmd)) partial.add(r);
          }
        }
      }
    } else if (d.attachment && typeof d.attachment.stdout === "string" && d.attachment.stdout.includes(MARK)) {
      const a = d.attachment;
      const widened = String(a.hookName || "").startsWith("PreToolUse") && a.stdout.includes('"updatedInput"') && pending.has(a.toolUseID);
      if (widened) {
        for (const r of pending.get(a.toolUseID)) {
          partial.delete(r);
          read.add(r);
        }
        pending.delete(a.toolUseID);
      } else if (a.stdout.includes('"permissionDecision":"deny"')) {
        for (const r of wanted) if (a.stdout.includes(r)) denials.set(r, (denials.get(r) || 0) + 1);
      }
    }
  }
  return { read, partial, denials, unreadable: false };
}

function lineCount(rule) {
  try {
    return readFileSync(join(RULE_DIR, rule), "utf8").replace(/\n$/, "").split("\n").length;
  } catch {
    return Infinity;
  }
}

function deny(missing, partial, filePath) {
  const files = missing.map((r) => `~/.aki/akidevrule/${r}`).join(" and ");
  const reason = `[${MARK}] Editing ${basename(filePath)} is gated on rule files not read since the last compaction of this session: ${missing.join(", ")}. Read ${files} in full with the Read tool, add them to the [RULES] receipt, then retry this edit.${missing.some((r) => partial.has(r)) ? " A Read with limit/offset or a head/sed/tail print does not count — read the whole file." : ""}`;
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }) + "\n");
  process.exit(0);
}

/** A partial Read of a rule file is rewritten to a whole one; above the Read tool's size cap a partial read is the only one possible, so it passes. */
function widenRuleRead(ti) {
  if (ti.limit == null && ti.offset == null) allow();
  // permissionDecision allow skips the permission prompt, so it applies only to the corpus's own files, judged on the resolved path
  const real = (x) => {
    try {
      return realpathSync(x).replace(/\\/g, "/");
    } catch {
      return null;
    }
  };
  const p = real(String(ti.file_path || ti.path || ""));
  if (!p) allow();
  const inside = (dir) => dir !== null && p.startsWith(dir + "/");
  const isRule = (inside(real(RULE_DIR)) && p.endsWith(".md")) || (basename(p) === "SKILL.md" && inside(real(join(CONFIG_DIR, "skills"))));
  if (!isRule || statSync(p).size > MAX_WIDEN_BYTES) allow();
  const { limit, offset, ...updatedInput } = ti;
  const reason = `[${MARK}] rule files are read whole: limit/offset removed`;
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "allow", permissionDecisionReason: reason, updatedInput } }) + "\n");
  process.exit(0);
}

function main() {
  if (process.env.AKI_ROUTE_GUARD === "0") allow();
  const input = JSON.parse(readFileSync(0, "utf8"));
  const ti = input.tool_input || {};
  if (input.tool_name === "Read") widenRuleRead(ti);
  const filePath = ti.file_path || ti.notebook_path;
  if (!filePath || !input.transcript_path) allow();
  const map = loadMap();
  if (!map || isUngatedPath(map, filePath, input.cwd)) allow();
  const wanted = [...routesFor(map, filePath, input.cwd)].filter((r) => existsSync(join(RULE_DIR, r)));
  const resident = residentRules();
  const gated = wanted.filter((r) => !resident.has(r));
  if (gated.length === 0) allow();
  const { read, partial, denials, unreadable } = scanTranscript(transcriptFor(input), gated);
  if (unreadable) allow();
  const missing = gated.filter((r) => !read.has(r) && (denials.get(r) || 0) < MAX_DENIALS_PER_RULE);
  if (missing.length === 0) allow();
  deny(missing, partial, filePath);
}

try {
  main();
} catch {
  allow();
}
