#!/usr/bin/env node
// akidevrule installer — cross-platform SSOT (pure Node). See docs/arch/rule-delivery-architecture.md.
import {
  existsSync,
  statSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  rmSync,
  renameSync,
  realpathSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, dirname, basename, extname, relative, isAbsolute, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import readline from "node:readline";
import {
  STATE_MISSING,
  STATE_CURRENT,
  STATE_UPDATE,
  STATE_AHEAD,
  STATE_UNKNOWN,
  classifyState,
  fetchRemoteChangelog,
  localInstallPresent,
  parseChangelogVersion,
} from "./claude/hooks/aki_version_check.mjs";
import { applyHarnessPreAllow, claudeAllowRules, listSkillScripts, ownershipTest, recoverSkillRoots, replaceOwned, scriptInvocations } from "./lib/permissions.mjs";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const HOME = homedir();
const INSTALL_ROOT = join(HOME, ".aki", "akidevrule");

const LEGACY_INSTALL_ROOT = join(HOME, ".aki", "claudedoc");
const PRIMARY_CLAUDE_DIR = join(HOME, ".claude");
const GEMINI_DIR = join(HOME, ".gemini");
const GEMINI_RULES_DIR = join(GEMINI_DIR, "config", "rules");
const GEMINI_SKILLS_DIR = join(GEMINI_DIR, "config", "skills");

const CODEX_SKILLS_DIR = join(HOME, ".agents", "skills");
const KIRO_SKILLS_DIR = join(HOME, ".kiro", "skills");
const GROK_SKILLS_DIR = join(HOME, ".grok", "skills");
const SKILLS_SRC = join(REPO_ROOT, "skills");

const OLD_SKILLS = ["akidoc-rules", "akidoc-flow-audit", "akidoc-techbiz-optimizer", "akiadvise"];

const IS_WIN = process.platform === "win32";

if (Number(process.versions.node.split(".")[0]) < 18) {
  console.error("akidevrule requires Node.js 18 or later.");
  process.exit(1);
}

function expandTilde(p) {
  if (!p) return "";
  if (p === "~") return HOME;
  if (p.startsWith("~" + sep) || p.startsWith("~/")) {
    return join(HOME, p.slice(2));
  }
  return p;
}

function toTildePath(p) {
  if (!p) return "";
  if (p === HOME) return "~";
  if (p.startsWith(HOME + sep) || p.startsWith(HOME + "/")) {
    return "~" + p.slice(HOME.length).replace(/\\/g, "/");
  }
  return p.replace(/\\/g, "/");
}

function getClaudeDirs(argv = []) {
  const dirs = new Set();
  dirs.add(PRIMARY_CLAUDE_DIR);

  // 1. Explicit CLI arguments: --claude-dir <path> or --claude-dir=<path>
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--claude-dir" && argv[i + 1]) {
      const p = expandTilde(argv[i + 1].trim());
      dirs.add(isAbsolute(p) ? p : join(HOME, p));
    } else if (arg.startsWith("--claude-dir=")) {
      const p = expandTilde(arg.slice("--claude-dir=".length).trim());
      dirs.add(isAbsolute(p) ? p : join(HOME, p));
    }
  }

  // 2. Environment variable: CLAUDE_CONFIG_DIR
  if (process.env.CLAUDE_CONFIG_DIR) {
    const p = expandTilde(process.env.CLAUDE_CONFIG_DIR.trim());
    if (p) dirs.add(isAbsolute(p) ? p : join(HOME, p));
  }

  // 3. Auto-discover all ~/.claude* directories in HOME
  try {
    for (const name of listDir(HOME)) {
      if (!name.startsWith(".claude")) continue;
      const full = join(HOME, name);
      if (!isDir(full)) continue;
      if (name.includes("backup") || name.endsWith(".bak")) continue;
      dirs.add(full);
    }
  } catch {
    /* ignore */
  }

  // 4. Deduplicate symlinks resolving to the same real directory
  const canonicalMap = new Map();
  for (const d of dirs) {
    let canonical = d;
    try {
      canonical = realpathSync(d);
    } catch {
      /* directory might not exist yet */
    }
    if (!canonicalMap.has(canonical)) {
      canonicalMap.set(canonical, d);
    } else if (d === canonical) {
      canonicalMap.set(canonical, d);
    }
  }

  return Array.from(canonicalMap.values()).sort();
}

function pad2(n) {
  return String(n).padStart(2, "0");
}
function stampNow(d = new Date()) {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}
function dateTimeNow(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}
const STAMP = stampNow();

// ---------------------------------------------------------------------------
// fs helpers
// ---------------------------------------------------------------------------

function isDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}
function isFile(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}
function listDir(p) {
  try {
    return readdirSync(p);
  } catch {
    return [];
  }
}
function rmrf(p) {
  rmSync(p, { recursive: true, force: true });
}
function copyTree(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const s = join(src, name);
    const d = join(dest, name);
    if (isDir(s)) copyTree(s, d);
    else copyFileSync(s, d);
  }
}

// ---------------------------------------------------------------------------
// ANSI color helpers
// ---------------------------------------------------------------------------

function ansiSupported() {
  if (!process.stdout.isTTY) return false;
  if (IS_WIN) return process.env.TERM != null || process.env.WT_SESSION != null;
  return true;
}
const USE_COLOR = ansiSupported();
function c(code, text) {
  return USE_COLOR ? `\x1b[${code}m${text}\x1b[0m` : text;
}
const cyanBold = (t) => c("1;36", t);
const greenBold = (t) => c("1;32", t);
const yellowBold = (t) => c("1;33", t);
const redBold = (t) => c("1;31", t);
const blueBold = (t) => c("1;34", t);

// ---------------------------------------------------------------------------
// Backup / prune
// ---------------------------------------------------------------------------

function backup(path) {
  if (!existsSync(path)) return;
  const dest = join(dirname(path), `${basename(path)}.akidevrule-backup-${STAMP}`);
  if (isDir(path)) copyTree(path, dest);
  else copyFileSync(path, dest);
}

function pruneBackups(base) {
  const parent = dirname(base);
  const prefix = `${basename(base)}.akidevrule-backup-`;
  const candidates = listDir(parent)
    .filter((n) => n.startsWith(prefix))
    .map((n) => join(parent, n))
    .sort((a, b) => statSync(a).mtimeMs - statSync(b).mtimeMs);
  for (const old of candidates.slice(0, -2)) {
    console.log(`  🗑️  Removing old backup: ${basename(old)}`);
    rmrf(old);
  }
}

// ---------------------------------------------------------------------------
// Directory sync (rsync -a --delete, scoped to Aki-owned names)
// ---------------------------------------------------------------------------

function isBuildArtifact(name) {
  const ext = extname(name);
  return name === "__pycache__" || ext === ".pyc" || ext === ".pyo" || name === ".DS_Store";
}

function syncDirDelete(src, dest) {
  mkdirSync(dest, { recursive: true });
  const srcNames = new Set(listDir(src).filter((n) => !isBuildArtifact(n)));

  // Remove anything in dest not in src (also prunes artifacts from earlier installs).
  for (const child of listDir(dest)) {
    if (!srcNames.has(child)) rmrf(join(dest, child));
  }

  // Copy everything from src to dest.
  for (const child of listDir(src)) {
    if (isBuildArtifact(child)) continue;
    const s = join(src, child);
    const d = join(dest, child);
    if (isDir(s)) syncDirDelete(s, d);
    else copyFileSync(s, d);
  }
}

function syncAkiSkills(destRoot) {
  mkdirSync(destRoot, { recursive: true });
  const skillsSrc = join(REPO_ROOT, "skills");
  if (!isDir(skillsSrc)) return;
  for (const name of listDir(skillsSrc).sort()) {
    const skillDir = join(skillsSrc, name);
    if (!isDir(skillDir)) continue;
    syncDirDelete(skillDir, join(destRoot, name));
  }
  for (const oldSkill of OLD_SKILLS) {
    const oldPath = join(destRoot, oldSkill);
    if (existsSync(oldPath)) rmrf(oldPath);
  }
}

function syncAkiAgents(destClaudeDir) {
  const agentsSrc = join(REPO_ROOT, "claude", "agents");
  if (!isDir(agentsSrc)) return;
  const dest = join(destClaudeDir, "agents");
  mkdirSync(dest, { recursive: true });
  for (const name of listDir(agentsSrc).sort()) {
    if (name.endsWith(".md")) copyFileSync(join(agentsSrc, name), join(dest, name));
  }
}

// ---------------------------------------------------------------------------
// Text file writing (always LF, never CRLF)
// ---------------------------------------------------------------------------

function writeTextLf(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Buffer.from(content, "utf-8"));
}

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function git(repo, args) {
  try {
    const r = spawnSync("git", ["-C", repo, ...args], { encoding: "utf-8", timeout: 5000 });
    if (r.status === 0) return r.stdout.trim();
    return "";
  } catch {
    return "";
  }
}
function gitShortHash(repo) {
  return git(repo, ["rev-parse", "--short", "HEAD"]);
}
function gitTreeClean(repo) {
  try {
    const r = spawnSync("git", ["-C", repo, "status", "--porcelain"], {
      encoding: "utf-8",
      timeout: 5000,
    });
    return r.status === 0 && r.stdout.trim() === "";
  } catch {
    return false;
  }
}
function installedCommit() {
  try {
    for (const line of readFileSync(join(INSTALL_ROOT, ".version"), "utf-8").split("\n")) {
      if (line.startsWith("commit=")) return line.slice("commit=".length).trim();
    }
  } catch {
    /* ignore */
  }
  return "";
}
function gitBranch(repo) {
  return git(repo, ["rev-parse", "--abbrev-ref", "HEAD"]);
}

// ---------------------------------------------------------------------------
// Antigravity rule map
// ---------------------------------------------------------------------------

const ROUTER_SRC = join(SKILLS_SRC, "akirule", "SKILL.md");

// The router's routes table is the single routing source; AG's native rule descriptions are derived from it.
function routerClauses() {
  const table = readFileSync(ROUTER_SRC, "utf-8").matchAll(/^\| `((?:RULE|METHOD)-[^`]+\.md)` \| ([^|]+) \|/gm);
  return new Map([...table].map(([, file, clause]) => [file, clause.trim()]));
}

// Each entry: [ruleFile, trigger, globs, description] — globs is a raw JSON array string or ""; description only for core rules, which the router does not route.
const AG_RULE_MAP = [
  ["RULE-agent-behavior.md", "always_on", ""],
  ["RULE-coding.md", "model_decision", "", "Coding philosophy, source-of-truth discipline, error handling and security. Load when writing, reviewing or refactoring code."],
  ["RULE-pattern-core.md", "model_decision", "", 'Universal design laws: single source of truth, Rule of Three, single-responsibility "and"-test, composition over inheritance, naming by role. Load on any structural or decomposition decision.'],
  ["RULE-docs.md", "model_decision", ""],
  ["RULE-content-write.md", "model_decision", ""],
  ["RULE-stack-akiNuxtCf.md", "glob", '["**/*.vue", "nuxt.config.*", "wrangler.toml", "app/**", "server/**", "composables/**", "middleware/**", "plugins/**", "layouts/**"]'],
  ["RULE-stack-tauri.md", "glob", '["src-tauri/**", "**/*.rs", "tauri.conf.json"]'],
  ["RULE-ui-pattern.md", "model_decision", ""],
  ["RULE-seo.md", "model_decision", ""],
  ["RULE-release.md", "model_decision", ""],
  ["RULE-db-design.md", "model_decision", ""],
  ["RULE-biz.md", "model_decision", ""],
  ["METHOD-audit-flow.md", "model_decision", ""],
  ["METHOD-audit-zero-trust.md", "model_decision", ""],
  ["METHOD-deep-think.md", "model_decision", ""],
  ["METHOD-ux-psych.md", "model_decision", ""],
  ["METHOD-proportionality.md", "model_decision", ""],
  ["METHOD-audit-subtraction.md", "model_decision", ""],
  ["METHOD-audit-frozen-reference.md", "model_decision", ""],
];

function agDestName(ruleFile) {
  let stem = ruleFile.replace(/^(RULE|METHOD)-/, "");
  stem = stem.replace(/\.md$/, "");
  return `akirule-${stem.toLowerCase()}.md`;
}

function agRuleDescription(ruleFile, core, clauses) {
  if (core) return core;
  if (!clauses.has(ruleFile)) throw new Error(`akirule has no route for ${ruleFile}`);
  // agy denies view_file on ~/.gemini/config/rules/ (hardcoded protection boundary, measured 2026-09-26), so the description names the readable copy.
  return `Load when the task ${clauses.get(ruleFile)}: view_file ~/.aki/akidevrule/${ruleFile} (this rules directory itself is not readable).`;
}

// Every rule file is rendered before any installed one is removed, so a bad map or router aborts with AG untouched.
function installAgRules() {
  const clauses = routerClauses();
  const mapped = new Set(AG_RULE_MAP.map(([f]) => f));
  const unmapped = listDir(join(REPO_ROOT, "payload")).filter((n) => /^(RULE|METHOD)-.*\.md$/.test(n) && !mapped.has(n));
  if (unmapped.length) throw new Error(`AG_RULE_MAP has no entry for: ${unmapped.join(", ")}`);

  const rendered = AG_RULE_MAP.map(([ruleFile, trigger, globs, core]) => {
    const lines = ["---", `trigger: ${trigger}`];
    if (globs) lines.push(`globs: ${globs}`);
    if (trigger !== "always_on") lines.push(`description: ${JSON.stringify(agRuleDescription(ruleFile, core, clauses))}`);
    lines.push("---", "", `<!-- Generated by akidevrule from payload/${ruleFile}. Do not edit here. -->`, "");
    lines.push(readFileSync(join(REPO_ROOT, "payload", ruleFile), "utf-8"));
    return [join(GEMINI_RULES_DIR, agDestName(ruleFile)), lines.join("\n")];
  });

  mkdirSync(GEMINI_RULES_DIR, { recursive: true });
  for (const name of listDir(GEMINI_RULES_DIR)) {
    if (name.startsWith("akirule-") && name.endsWith(".md")) rmrf(join(GEMINI_RULES_DIR, name));
  }
  for (const [dest, content] of rendered) writeTextLf(dest, content);
  return rendered.length;
}

// ---------------------------------------------------------------------------
// settings.json merge (Claude Code)
// ---------------------------------------------------------------------------

function validateJsonObject(path, label) {
  if (!isFile(path)) return;
  const data = JSON.parse(readFileSync(path, "utf-8"));
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error(`${label} must be a JSON object: ${path}`);
  }
}

function preflightInstallSettings(claudeDirs) {
  for (const claudeDir of claudeDirs) validateJsonObject(join(claudeDir, "settings.json"), "Claude settings");
  if (!isDir(GEMINI_DIR)) return;
  validateJsonObject(join(GEMINI_DIR, "config", "skills.json"), "Gemini skills config");
  validateJsonObject(join(GEMINI_DIR, "antigravity-cli", "settings.json"), "Antigravity settings");
  validateJsonObject(join(GEMINI_DIR, "settings.json"), "Antigravity settings");
}

function mergeSettings(settingsPath, installRoot, claudeDir) {
  const data = JSON.parse(readFileSync(settingsPath, "utf-8"));

  if (typeof data.permissions !== "object" || data.permissions === null || Array.isArray(data.permissions))
    data.permissions = {};
  const perms = data.permissions;
  if (!Array.isArray(perms.allow)) perms.allow = [];
  if (!Array.isArray(perms.additionalDirectories)) perms.additionalDirectories = [];

  const readRule = `Read(//${installRoot.replace(/^\/+/, "")}/**)`;
  const legacyRoot = join(HOME, ".aki", "claudedoc");
  const legacyReadRule = `Read(//${legacyRoot.replace(/^\/+/, "")}/**)`;
  perms.allow = perms.allow.filter((x) => x !== readRule && x !== legacyReadRule);
  perms.allow.push(readRule);

  const skillRoots = [join(PRIMARY_CLAUDE_DIR, "skills"), join(claudeDir, "skills")];
  const invocations = scriptInvocations({ roots: skillRoots, scripts: listSkillScripts(SKILLS_SRC), home: HOME, isWin: IS_WIN });
  perms.allow = replaceOwned(perms.allow, ownershipTest(akiSkillNames()), claudeAllowRules(invocations));

  perms.additionalDirectories = perms.additionalDirectories.filter((d) => d !== legacyRoot);
  if (!perms.additionalDirectories.includes(installRoot)) perms.additionalDirectories.push(installRoot);

  if (typeof data.skillOverrides !== "object" || data.skillOverrides === null || Array.isArray(data.skillOverrides))
    data.skillOverrides = {};
  for (const old of ["akidoc-rules", "akidoc-flow-audit", "akidoc-techbiz-optimizer"])
    delete data.skillOverrides[old];
  data.skillOverrides.akirule = "on";
  if (!("akihelp" in data.skillOverrides)) data.skillOverrides.akihelp = "name-only";

  if (typeof data.hooks !== "object" || data.hooks === null || Array.isArray(data.hooks)) data.hooks = {};
  const hooks = data.hooks;
  if (!Array.isArray(hooks.SessionStart)) hooks.SessionStart = [];

  const isAkiUpdate = (entry) => {
    try {
      return (entry.hooks || []).some((h) => (h.command || "").includes("aki-update-check"));
    } catch {
      return false;
    }
  };
  hooks.SessionStart = hooks.SessionStart.filter((e) => !isAkiUpdate(e));
  hooks.SessionStart.push({
    matcher: "startup|resume",
    hooks: [
      {
        type: "command",
        command: `node "${join(claudeDir, "hooks", "aki-update-check.mjs")}"`,
        timeout: 8,
      },
    ],
  });

  writeTextLf(settingsPath, JSON.stringify(data, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// Script pre-allow for the non-Claude harnesses (lib/permissions.mjs)
// ---------------------------------------------------------------------------

function akiSkillNames() {
  return listDir(SKILLS_SRC).filter((n) => isDir(join(SKILLS_SRC, n)));
}

function preAllowHarnessScripts(claudeDirs) {
  const skillNames = akiSkillNames();
  const isOwned = ownershipTest(skillNames);
  // Antigravity's allowlist is shared machine-wide, not per profile — a --claude-dir root omitted this run must not read as stale (lib/permissions.mjs recoverSkillRoots).
  const knownRoots = new Set([PRIMARY_CLAUDE_DIR, ...claudeDirs.filter((d) => d !== PRIMARY_CLAUDE_DIR)].map((d) => join(d, "skills")));
  for (const settingsFile of [join(GEMINI_DIR, "antigravity-cli", "settings.json"), join(GEMINI_DIR, "settings.json")]) {
    if (!isFile(settingsFile)) continue;
    try {
      const data = JSON.parse(readFileSync(settingsFile, "utf-8"));
      const allow = (data.permissions && data.permissions.allow) || [];
      for (const root of recoverSkillRoots(allow, isOwned, HOME)) knownRoots.add(root);
    } catch {
      /* malformed file: preflightInstallSettings already validated this before install runs */
    }
  }
  const ctx = {
    home: HOME,
    isWin: IS_WIN,
    scripts: listSkillScripts(SKILLS_SRC),
    akiSkillNames: skillNames,
    claudeSkillRoots: [...knownRoots],
    dirs: {
      gemini: GEMINI_DIR,
      geminiSkills: GEMINI_SKILLS_DIR,
      kiro: join(HOME, ".kiro"),
      kiroSkills: KIRO_SKILLS_DIR,
      codex: join(HOME, ".codex"),
      agentsSkills: CODEX_SKILLS_DIR,
      cursor: join(HOME, ".cursor"),
      opencode: join(HOME, ".config", "opencode"),
    },
  };
  const io = {
    backup(path) {
      backup(path);
      pruneBackups(path);
    },
    writeText: writeTextLf,
  };
  return applyHarnessPreAllow(ctx, io);
}

// ---------------------------------------------------------------------------
// Deploy single Claude target
// ---------------------------------------------------------------------------

function installClaudeDir(claudeDir) {
  mkdirSync(claudeDir, { recursive: true });

  // 1. Skills
  syncAkiSkills(join(claudeDir, "skills"));

  // 2. Agents
  syncAkiAgents(claudeDir);

  // 3. Hooks
  const hooksDest = join(claudeDir, "hooks");
  mkdirSync(hooksDest, { recursive: true });
  copyFileSync(join(REPO_ROOT, "claude", "hooks", "aki-update-check.mjs"), join(hooksDest, "aki-update-check.mjs"));
  copyFileSync(join(REPO_ROOT, "claude", "hooks", "aki_version_check.mjs"), join(hooksDest, "aki_version_check.mjs"));
  for (const legacy of ["aki-update-check.py", "aki_version_check.py"]) {
    const p = join(hooksDest, legacy);
    if (existsSync(p)) rmrf(p);
  }
  const pyCache = join(hooksDest, "__pycache__");
  if (isDir(pyCache)) {
    for (const n of readdirSync(pyCache)) if (n.startsWith("aki_version_check.")) rmrf(join(pyCache, n));
    if (readdirSync(pyCache).length === 0) rmrf(pyCache);
  }

  // 4. CLAUDE.md
  const claudeMd = join(claudeDir, "CLAUDE.md");
  backup(claudeMd);
  pruneBackups(claudeMd);

  const routerImport = "@~/.claude/skills/akirule/SKILL.md";
  const template = readFileSync(join(REPO_ROOT, "claude", "CLAUDE.md"), "utf-8");
  if (!template.includes(routerImport)) throw new Error(`claude/CLAUDE.md no longer imports ${routerImport}`);
  const claudeMdSrc = template.replace(routerImport, `@${toTildePath(join(claudeDir, "skills", "akirule", "SKILL.md"))}`);
  const propagateCmd = `node "${join(REPO_ROOT, "install.mjs")}"`;
  const localMd = join(claudeDir, "CLAUDE.local.md");
  const localMdTilde = toTildePath(localMd);
  const ruleSourceBlock =
    "\n## akidevrule — edit source, not deployed copy (ABSOLUTE)\n\n" +
    `The deployed rule files at \`${INSTALL_ROOT}\` are **overwritten on every install**.\n` +
    "To change any shared rule:\n" +
    `1. Edit in the **source repo**: \`${join(REPO_ROOT, "payload")}/\`\n` +
    `2. Run \`${propagateCmd}\` to propagate.\n\n` +
    `**NEVER edit files under \`${INSTALL_ROOT}\` directly** — changes will be silently lost on the next install.\n\n` +
    `@${localMdTilde}\n`;
  writeTextLf(claudeMd, claudeMdSrc + ruleSourceBlock);

  // 5. CLAUDE.local.md (create-only if missing)
  if (!isFile(localMd)) {
    const isPrimary = claudeDir === PRIMARY_CLAUDE_DIR;
    const templateContent = isPrimary
      ? "# Machine-local Claude instructions\n\n" +
        "This file is machine-specific and never touched by akidevrule installs.\n" +
        "Add any per-machine rules here (e.g. build constraints, IDE paths, remote flags).\n"
      : "# Machine-local Claude instructions (profile variant)\n\n" +
        "This file is machine-specific and never touched by akidevrule installs.\n" +
        "@~/.claude/CLAUDE.local.md\n\n" +
        "# Add any profile-specific instructions below:\n";
    writeTextLf(localMd, templateContent);
    console.log(`📝 Created ${localMd} (machine-local template)`);
  }

  // 6. settings.json
  const settingsPath = join(claudeDir, "settings.json");
  if (!isFile(settingsPath)) writeTextLf(settingsPath, "{}\n");
  backup(settingsPath);
  pruneBackups(settingsPath);
  mergeSettings(settingsPath, INSTALL_ROOT, claudeDir);
}

// ---------------------------------------------------------------------------
// skills.json for Antigravity
// ---------------------------------------------------------------------------

function updateSkillsJson() {
  const skillsJson = join(GEMINI_DIR, "config", "skills.json");
  mkdirSync(dirname(skillsJson), { recursive: true });
  const data = isFile(skillsJson) ? JSON.parse(readFileSync(skillsJson, "utf-8")) : {};
  if (!Array.isArray(data.entries)) data.entries = [];
  const absPath = join(INSTALL_ROOT, "agskills");
  const tildePath = "~/.aki/akidevrule/agskills";
  for (const p of [absPath, tildePath]) {
    if (!data.entries.some((e) => e && typeof e === "object" && e.path === p)) data.entries.push({ path: p });
  }
  writeTextLf(skillsJson, JSON.stringify(data, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// Version status (shared with the SessionStart hook)
// ---------------------------------------------------------------------------

async function getVersionStatus() {
  const present = localInstallPresent(INSTALL_ROOT);
  let localVersion = null;
  if (present) {
    try {
      localVersion = parseChangelogVersion(readFileSync(join(INSTALL_ROOT, "CHANGELOG.md"), "utf-8"));
    } catch {
      localVersion = null;
    }
  }
  const remoteText = await fetchRemoteChangelog();
  const remoteVersion = remoteText ? parseChangelogVersion(remoteText) : null;
  const state = classifyState(present, localVersion, remoteVersion);
  return { state, localVersion, remoteVersion };
}

async function printVersionCheck() {
  const { state, localVersion, remoteVersion } = await getVersionStatus();
  console.log(cyanBold("=== akidevrule version check ==="));
  let installedStr;
  if (state === STATE_MISSING) installedStr = "not installed";
  else if (localVersion === null) installedStr = "installed (no released version found -- Unreleased-only?)";
  else installedStr = localVersion;
  console.log(`Installed: ${installedStr}`);
  console.log(`Latest:    ${remoteVersion || "unknown (network/parse error)"}`);
  const labels = {
    [STATE_MISSING]: redBold("not installed"),
    [STATE_CURRENT]: greenBold("up to date"),
    [STATE_UPDATE]: yellowBold("update available"),
    [STATE_AHEAD]: cyanBold("ahead of remote"),
    [STATE_UNKNOWN]: yellowBold("unknown (network/parse error)"),
  };
  console.log(`Status:    ${labels[state]}`);
  if (state === STATE_UPDATE) console.log("Update:    npx @akinet/akidevrule@latest");
  else if (state === STATE_MISSING) console.log("Install:   npx @akinet/akidevrule@latest");
  console.log(cyanBold("================================="));
}

// ---------------------------------------------------------------------------
// inspect_status (pre-install preview)
// ---------------------------------------------------------------------------

async function inspectStatus(claudeDirs) {
  console.log(cyanBold("=== SYSTEM STATUS CHECK BEFORE INSTALL ==="));

  const head = gitShortHash(REPO_ROOT);
  const sameCheckout = !!head && installedCommit() === head && gitTreeClean(REPO_ROOT);
  if (sameCheckout)
    console.log(`✅ Already installed from this exact commit (${head}, clean tree) — reinstalling refreshes identical content.`);

  const { state, localVersion, remoteVersion } = await getVersionStatus();
  if (state === STATE_CURRENT)
    console.log(`ℹ️  Installed release ${localVersion} matches remote; the overwrite below comes from this checkout, which may carry [Unreleased] work.`);
  else if (state === STATE_UPDATE)
    console.log(`🔔 A newer akidevrule is available: ${localVersion} → ${remoteVersion} (this install only refreshes local files at the current repo checkout's version).`);
  else if (state === STATE_MISSING)
    console.log("📦 Fresh install — akidevrule is not currently installed on this machine.");
  else if (state === STATE_UNKNOWN)
    console.log("⚠️  Could not reach the remote CHANGELOG to compare versions (network/parse error) — proceeding with local install only.");
  else if (state === STATE_AHEAD)
    console.log(`ℹ️  Local install (${localVersion || "Unreleased-only"}) is ahead of or diverged from remote (${remoteVersion}).`);

  if (isDir(INSTALL_ROOT)) console.log(`📦 Payload rules: will ${yellowBold("OVERWRITE")} ${INSTALL_ROOT}`);
  else console.log(`📦 Payload rules: will ${greenBold("CREATE")} at ${INSTALL_ROOT}`);

  console.log(`🤖 Claude config targets (${claudeDirs.length}): ${claudeDirs.map(toTildePath).join(", ")}`);
  for (const claudeDir of claudeDirs) {
    const claudeMd = join(claudeDir, "CLAUDE.md");
    if (isFile(claudeMd)) console.log(`  📝 Global CLAUDE.md (${toTildePath(claudeDir)}): will ${yellowBold("OVERWRITE")} (backed up)`);
    else console.log(`  📝 Global CLAUDE.md (${toTildePath(claudeDir)}): will ${greenBold("CREATE")}`);

    const oldPresent = OLD_SKILLS.filter((s) => isDir(join(claudeDir, "skills", s)));
    if (oldPresent.length) console.log(`  🗑️  Old skills in ${toTildePath(claudeDir)} will be REMOVED: ${redBold(oldPresent.join(" "))}`);
  }

  const skillsSrc = join(REPO_ROOT, "skills");
  if (isDir(skillsSrc)) {
    const skillList = listDir(skillsSrc).filter((n) => isDir(join(skillsSrc, n))).sort();
    console.log(`🔧 Skills (${skillList.length}): will sync to all Claude targets (${skillList.join(", ")})`);
  }

  const agentsSrc = join(REPO_ROOT, "claude", "agents");
  if (isDir(agentsSrc)) {
    const agentList = listDir(agentsSrc).filter((n) => n.endsWith(".md")).sort();
    console.log(`🧠 Agents (${agentList.length}): will sync to all Claude targets (${agentList.map((n) => basename(n, ".md")).join(", ")})`);
  }

  console.log("⚙️  settings: checking permissions and skill overrides across platforms...");
  for (const claudeDir of claudeDirs) {
    const settingsPath = join(claudeDir, "settings.json");
    if (isFile(settingsPath)) {
      try {
        const data = JSON.parse(readFileSync(settingsPath, "utf-8"));
        const readRule = `Read(//${INSTALL_ROOT.replace(/^\/+/, "")}/**)`;
        const allow = (data.permissions && data.permissions.allow) || [];
        const isOwned = ownershipTest(akiSkillNames());
        const bashOk = allow.some((e) => e.startsWith("Bash(") && isOwned(e.slice(5)));
        const readOk = allow.includes(readRule);
        const overrides = data.skillOverrides || {};
        const akiOk = overrides.akirule === "on";
        console.log(`  Claude (${toTildePath(claudeDir)}): Read=${readOk ? "✅" : "⚠️ missing"}, Bash=${bashOk ? "✅" : "⚠️ missing"}, akirule=${akiOk ? "✅" : "⚠️ will enable"}`);
      } catch (e) {
        console.log(`  ❌ Error reading ${settingsPath}: ${e}`);
      }
    } else {
      console.log(`  ⚠️  Claude (${toTildePath(claudeDir)}): No settings.json yet. Will be CREATED.`);
    }
  }

  if (isDir(GEMINI_DIR)) {
    const agSettings = join(GEMINI_DIR, "antigravity-cli", "settings.json");
    if (isFile(agSettings)) {
      try {
        const data = JSON.parse(readFileSync(agSettings, "utf-8"));
        const allow = (data.permissions && data.permissions.allow) || [];
        const probeRule = `command(python3 ${join(GEMINI_SKILLS_DIR, "akiflow", "scripts", "council_open.py")})`;
        if (allow.includes(probeRule)) console.log("  ✅ Antigravity CLI: per-script skill permissions already granted.");
        else console.log("  ⚠️  Antigravity CLI: per-script skill permissions will be added.");
      } catch (e) {
        console.log(`  ❌ Error reading Antigravity settings: ${e}`);
      }
    } else {
      console.log("  ⚠️  Antigravity CLI: settings.json will be updated with skill permissions.");
    }
  }

  console.log(cyanBold("===================================================="));
  return sameCheckout;
}

// ---------------------------------------------------------------------------
// print_summary (post-install)
// ---------------------------------------------------------------------------

function printSummary(claudeDirs, preAllow) {
  console.log(`\n${greenBold("=== INSTALL SUCCEEDED ===")}`);

  const gitHash = gitShortHash(REPO_ROOT);
  const hashSuffix = gitHash ? ` (${gitHash})` : "";
  console.log(`📅 Time    : ${dateTimeNow()}${hashSuffix}`);
  console.log(`📁 Payload : ${INSTALL_ROOT}`);
  console.log(`🤖 Claude targets (${claudeDirs.length}):`);
  for (const dir of claudeDirs) {
    console.log(`   - ${toTildePath(dir)} (skills, agents, hooks, CLAUDE.md, settings.json)`);
  }
  console.log();

  console.log(cyanBold("Rules deployed:"));
  const indexPath = join(INSTALL_ROOT, "index.md");
  if (isFile(indexPath)) {
    const tierColors = [["Core", redBold], ["Contextual", yellowBold], ["Analytical", blueBold]];
    for (const line of readFileSync(indexPath, "utf-8").split("\n")) {
      const m = line.match(/^\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|(.+)\|/);
      if (m) {
        const fname = m[1];
        const tier = m[2].trim();
        const desc = m[3].trim();
        const entry = tierColors.find(([k]) => tier.startsWith(k));
        const tierStr = entry ? entry[1](tier.padEnd(12)) : tier.padEnd(12);
        console.log(`  ${tierStr} ${fname.padEnd(30)} ${desc}`);
      }
    }
  }

  console.log();
  console.log(cyanBold("Skills deployed:"));
  const primarySkills = join(PRIMARY_CLAUDE_DIR, "skills");
  if (isDir(primarySkills)) {
    for (const name of listDir(primarySkills).sort()) {
      if (isDir(join(primarySkills, name))) console.log(`  🔧 ${name}`);
    }
  }

  const agentsSrc = join(REPO_ROOT, "claude", "agents");
  if (isDir(agentsSrc)) {
    console.log();
    console.log(cyanBold(`Agents deployed (${claudeDirs.map(toTildePath).join(", ")} — your own agents there are untouched):`));
    for (const name of listDir(agentsSrc).sort()) {
      if (name.endsWith(".md")) console.log(`  🧠 ${basename(name, ".md")}`);
    }
  }

  console.log();
  console.log(cyanBold("Other CLI skill roots synced (harmless if that CLI isn't installed):"));
  console.log(`  🤖 Codex CLI : ${CODEX_SKILLS_DIR}`);
  console.log(`  🤖 Kiro CLI  : ${KIRO_SKILLS_DIR}`);
  console.log(`  🤖 Grok CLI  : ${GROK_SKILLS_DIR}`);

  console.log();
  console.log(cyanBold("Skill scripts pre-allowed (no prompt when a skill runs its own scripts):"));
  console.log("  ⚙️  claude       settings.json in every target above — plus Read(~/.aki/akidevrule/**)");
  for (const row of preAllow) {
    const state = row.error ? `⚠️  skipped: ${row.error}` : `${row.rules} invocation(s)${row.changed ? "" : ", unchanged"}`;
    console.log(`  ⚙️  ${row.id.padEnd(12)} ${toTildePath(row.file)} — ${state}`);
  }
  console.log("  ℹ️  no file-based allowlist exists for Grok CLI or Ollama; approve their script runs interactively.");

  console.log();
  console.log(cyanBold("Hooks deployed:"));
  console.log("  📢 aki-update-check (SessionStart, notify-only) — notifies when a new rule version is available");

  console.log(`\n${greenBold("==============================")}`);
}

// ---------------------------------------------------------------------------
// Prompt helper
// ---------------------------------------------------------------------------

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ---------------------------------------------------------------------------
// Main install logic
// ---------------------------------------------------------------------------

async function runInstall(claudeDirs) {
  const sameCheckout = await inspectStatus(claudeDirs);

  // Skip the prompt only for a byte-identical overwrite (same commit, clean tree).
  if (process.stdin.isTTY && !sameCheckout) {
    const confirm = await ask("Proceed with install/update given the changes above? (y/n): ");
    if (confirm.trim().toLowerCase() !== "y") {
      console.log("Install cancelled.");
      process.exit(1);
    }
  }

  // Legacy migration: ~/.aki/claudedoc -> ~/.aki/akidevrule
  if (isDir(LEGACY_INSTALL_ROOT) && !existsSync(INSTALL_ROOT)) {
    mkdirSync(dirname(INSTALL_ROOT), { recursive: true });
    renameSync(LEGACY_INSTALL_ROOT, INSTALL_ROOT);
    console.log(`📦 Migrated legacy install root: ${LEGACY_INSTALL_ROOT} → ${INSTALL_ROOT}`);
  }
  console.log("Installing...");

  // --- 1. Payload -> INSTALL_ROOT ---
  mkdirSync(INSTALL_ROOT, { recursive: true });

  const payloadSrc = join(REPO_ROOT, "payload");
  const EXCLUDED = new Set(["ref-ECC", ".DS_Store", "GEMINI.md"]);
  const srcNames = new Set(listDir(payloadSrc).filter((n) => !EXCLUDED.has(n)));
  const MANAGED_EXT = new Set([".md"]);
  // Remove managed .md files no longer in payload/ (rsync --delete). Dotfiles are managed explicitly.
  for (const child of listDir(INSTALL_ROOT)) {
    if (child.startsWith(".")) continue;
    if (MANAGED_EXT.has(extname(child)) && !srcNames.has(child)) rmrf(join(INSTALL_ROOT, child));
  }
  for (const child of listDir(payloadSrc)) {
    if (EXCLUDED.has(child)) continue;
    const s = join(payloadSrc, child);
    const d = join(INSTALL_ROOT, child);
    if (isDir(s)) syncDirDelete(s, d);
    else copyFileSync(s, d);
  }

  const stalePayload = join(INSTALL_ROOT, "METHOD-techbiz-optimizer.md");
  if (existsSync(stalePayload)) rmrf(stalePayload);

  copyFileSync(join(REPO_ROOT, "CHANGELOG.md"), join(INSTALL_ROOT, "CHANGELOG.md"));

  const tccSrc = join(REPO_ROOT, "docs", "ref", "macos-codesign-tcc.md");
  const tccDest = join(INSTALL_ROOT, "docs", "ref", "macos-codesign-tcc.md");
  rmrf(join(INSTALL_ROOT, "docs"));
  mkdirSync(dirname(tccDest), { recursive: true });
  copyFileSync(tccSrc, tccDest);

  // Write version stamp.
  const versionLines = [`installed=${dateTimeNow()}`];
  const installedVersion = parseChangelogVersion(readFileSync(join(INSTALL_ROOT, "CHANGELOG.md"), "utf-8"));
  if (installedVersion) versionLines.push(`version=${installedVersion}`);
  const stampHash = gitShortHash(REPO_ROOT);
  if (stampHash) {
    versionLines.push(`commit=${stampHash}`);
    const branch = gitBranch(REPO_ROOT);
    if (branch) versionLines.push(`branch=${branch}`);
  }
  writeTextLf(join(INSTALL_ROOT, ".version"), versionLines.join("\n") + "\n");
  writeTextLf(join(INSTALL_ROOT, ".source-repo"), REPO_ROOT + "\n");

  // --- 2. Claude targets (skills, agents, hooks, CLAUDE.md, settings.json) ---
  for (const cDir of claudeDirs) {
    installClaudeDir(cDir);
  }

  // --- 3. Other CLI skill roots ---
  syncAkiSkills(CODEX_SKILLS_DIR);
  syncAkiSkills(KIRO_SKILLS_DIR);
  syncAkiSkills(GROK_SKILLS_DIR);

  // --- 4. GEMINI.md (only when ~/.gemini exists) ---
  if (isDir(GEMINI_DIR)) {
    const geminiFile = join(GEMINI_DIR, "GEMINI.md");
    const geminiLocal = join(GEMINI_DIR, "GEMINI.local.md");
    const geminiMarker = "[AKIRULE-AG-OVERRIDES-";

    let hadUnmanaged = false;
    if (isFile(geminiFile)) hadUnmanaged = !readFileSync(geminiFile, "utf-8").includes(geminiMarker);

    if (!isFile(geminiLocal)) {
      writeTextLf(
        geminiLocal,
        "# Machine-local GEMINI instructions\n\n" +
          "This file is machine-specific and never touched by akidevrule installs.\n" +
          "Add machine-specific paths, CLIs, and emulator commands here.\n"
      );
      console.log(`📝 Created ${geminiLocal} (machine-local template)`);
    }

    backup(geminiFile);
    console.log("🧹 Pruning GEMINI.md backups (keeping the 2 most recent):");
    pruneBackups(geminiFile);

    const d = new Date();
    const geminiVersion = `V${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
    const geminiTemplate = readFileSync(join(REPO_ROOT, "payload", "GEMINI.md"), "utf-8");
    const geminiContent = geminiTemplate.split("__VERSION__").join(geminiVersion);

    const propagateCmd = `node "${join(REPO_ROOT, "install.mjs")}"`;
    const geminiSourceBlock =
      "\n## 15. Shared rule source — edit source, not deployed copy (ABSOLUTE)\n\n" +
      `The deployed rule corpus at \`${INSTALL_ROOT}\` are **overwritten on every install**.\n` +
      "To change any shared rule:\n" +
      `1. Edit in the **source repo**: \`${join(REPO_ROOT, "payload")}/\` (rules) or \`${join(REPO_ROOT, "claude")}/\` (runtime assets).\n` +
      `2. Read \`${join(REPO_ROOT, "CLAUDE.md")}\` first — it lists which files must be updated together.\n` +
      `3. Run \`${propagateCmd}\` to propagate.\n\n` +
      `**NEVER edit files under \`${INSTALL_ROOT}\` directly** — changes will be silently lost on the next install.\n`;

    const localContent = readFileSync(geminiLocal, "utf-8");
    const fullGemini = geminiContent + geminiSourceBlock + "\n---\n\n" + localContent;
    writeTextLf(geminiFile, fullGemini);

    console.log(`🤖 Installed ${geminiFile} (marker ${geminiMarker}${geminiVersion}])`);
    if (hadUnmanaged) {
      console.log("  ⚠️  Your previous ~/.gemini/GEMINI.md was replaced (saved as *.akidevrule-backup-*).");
      console.log(`      Move any machine-local lines from that backup into ${geminiLocal}.`);
    }

    // --- Antigravity rules ---
    const agCount = installAgRules();
    console.log(`🧭 Installed ${agCount} rule(s) to ${GEMINI_RULES_DIR} (read by AG, AG IDE and AGY)`);

    // --- Antigravity skills ---
    syncAkiSkills(GEMINI_SKILLS_DIR);
    syncAkiSkills(join(INSTALL_ROOT, "agskills"));
    updateSkillsJson();
    console.log(`💡 Deployed skills to ${GEMINI_SKILLS_DIR} & updated ~/.gemini/config/skills.json`);
    console.log("  ℹ️  Antigravity discovers rules and skills at startup — restart the app or start a new agy session.");
  }

  // --- 5. Script pre-allow for every other harness present ---
  const preAllow = preAllowHarnessScripts(claudeDirs);

  printSummary(claudeDirs, preAllow);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) {
    console.log("akidevrule installer — deploys shared rule corpus and skills.");
    console.log("");
    console.log("Usage: node install.mjs [--check] [--claude-dir <path>]");
    console.log("  --check              Print installed vs latest akidevrule version and exit. No install, no overwrite.");
    console.log("  --claude-dir <path>  Explicit Claude config directory to include (also auto-detects ~/.claude* and $CLAUDE_CONFIG_DIR).");
    process.exit(0);
  }
  if (argv.includes("--check")) {
    await printVersionCheck();
    process.exit(0);
  }
  const claudeDirs = getClaudeDirs(argv);
  preflightInstallSettings(claudeDirs);
  await runInstall(claudeDirs);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
