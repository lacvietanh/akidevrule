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

// Each entry: [ruleFile, trigger, description, globs] — globs is a raw JSON array string or "".
const AG_RULE_MAP = [
  ["RULE-agent-behavior.md", "always_on", "", ""],
  [
    "RULE-coding.md",
    "model_decision",
    "Coding philosophy, source-of-truth discipline, error handling and security. Load when writing, reviewing or refactoring code.",
    "",
  ],
  [
    "RULE-pattern-core.md",
    "model_decision",
    'Universal design laws: single source of truth, Rule of Three, single-responsibility "and"-test, composition over inheritance, naming by role. Load on any structural or decomposition decision.',
    "",
  ],
  [
    "RULE-docs.md",
    "model_decision",
    "Documentation structure, plan lifecycle, doc-sync behavior and the docs-versus-code drift audit. Load when writing or reorganizing docs and plans, or when checking whether existing docs still match the code.",
    "",
  ],
  [
    "RULE-content-write.md",
    "model_decision",
    "UI copy, semantic stability, writing style and i18n. Load when writing user-facing text.",
    "",
  ],
  [
    "RULE-stack-akiNuxtCf.md",
    "glob",
    "Nuxt, Vue, Cloudflare Pages and Workers, Tailwind, i18n, state and build conventions. Load when working in a Nuxt or Cloudflare project.",
    '["**/*.vue", "**/*.ts", "nuxt.config.*", "server/**/*.ts"]',
  ],
  [
    "RULE-stack-tauri.md",
    "glob",
    "Tauri v2 and Rust conventions, including the never-block-the-UI rule for subprocess and network commands. Load when working in a Tauri project.",
    '["src-tauri/**", "**/*.rs", "tauri.conf.json"]',
  ],
  [
    "RULE-ui-pattern.md",
    "model_decision",
    "Frontend design-system layer: the subtraction pass that runs before the class-tier ladder, class taxonomy, design tokens in whichever mechanism the installed framework version uses, the aggregate style-block budget, arbitrary-value policy, variant APIs and the audit playbook. Load when building, minimizing or auditing UI components and styles.",
    "",
  ],
  [
    "RULE-seo.md",
    "model_decision",
    "Meta limits, schema.org, robots, sitemap, Open Graph and AI visibility. Load when working on SEO or page metadata.",
    "",
  ],
  [
    "RULE-release.md",
    "model_decision",
    "CHANGELOG discipline, release versus deploy boundary, severity-driven version bumps and the pre-ship gate for finished-but-unpushed work. Load when preparing a release, writing a changelog, or checking whether finished work is actually shippable.",
    "",
  ],
  [
    "RULE-db-design.md",
    "model_decision",
    "Immutability and event sourcing, normalization, bounded contexts, flat-query discipline. Load when designing a schema, migration or database refactor.",
    "",
  ],
  [
    "RULE-biz.md",
    "model_decision",
    "Positioning, audience, USP, pricing, monetization and customer-psychology messaging rules. Load on any market-facing decision or when working on docs/biz content.",
    "",
  ],
  [
    "METHOD-audit-flow.md",
    "model_decision",
    "Method for auditing end-to-end flow integrity. Load when guards and checks keep accumulating around a flow.",
    "",
  ],
  [
    "METHOD-audit-zero-trust.md",
    "model_decision",
    "Strict mechanical-first audit: scope locked by command, detectors run before any opinion, findings split into exact machine matches versus pattern-level candidates, short findings-only report. Load when the user asks for an uncompromising sweep of a project or of a change and everything it touches.",
    "",
  ],
  [
    "METHOD-deep-think.md",
    "model_decision",
    "Deep-think method: goal excavation, first principles, mandatory critique. Load for big, hard-to-reverse or goal-ambiguous decisions.",
    "",
  ],
  [
    "METHOD-ux-psych.md",
    "model_decision",
    "UX psychology audit: cognitive load, recognition, feedback, defaults, motor cost and mental-model lenses with a persona walkthrough protocol. Load when evaluating an interface or user flow through user behavior.",
    "",
  ],
  [
    "METHOD-proportionality.md",
    "model_decision",
    "Sizing a defense against its real threat: reach, capability, motive and blast radius measured before any guard, limit, quota or accepted risk is added, kept or removed; irreversibility outranks frequency; client-side limits are UX, never enforcement. Load whenever protection is being proposed, sized or dropped.",
    "",
  ],
  [
    "METHOD-audit-subtraction.md",
    "model_decision",
    "Repo-wide subtraction sweep asking what no longer needs to exist, terminating on two consecutive rounds with no new findings, with Chesterton's Fence as the brake before any removal is called certain. Load when the request is to minimize or strip an existing codebase rather than to check it is correct.",
    "",
  ],
];

function agDestName(ruleFile) {
  let stem = ruleFile.replace(/^(RULE|METHOD)-/, "");
  stem = stem.replace(/\.md$/, "");
  return `akirule-${stem.toLowerCase()}.md`;
}

function installAgRules() {
  mkdirSync(GEMINI_RULES_DIR, { recursive: true });
  for (const name of listDir(GEMINI_RULES_DIR)) {
    if (name.startsWith("akirule-") && name.endsWith(".md")) rmrf(join(GEMINI_RULES_DIR, name));
  }

  let written = 0;
  for (const [ruleFile, trigger, desc, globs] of AG_RULE_MAP) {
    const src = join(REPO_ROOT, "payload", ruleFile);
    if (!isFile(src)) {
      console.log(`  ⚠️  ${ruleFile} listed in AG_RULE_MAP but missing from payload/`);
      continue;
    }
    const dest = join(GEMINI_RULES_DIR, agDestName(ruleFile));

    const lines = ["---", `trigger: ${trigger}`];
    if (globs) lines.push(`globs: ${globs}`);
    if (trigger !== "always_on" && desc) lines.push(`description: ${JSON.stringify(desc)}`);
    lines.push("---");
    lines.push("");
    lines.push(`<!-- Generated by akidevrule from payload/${ruleFile}. Do not edit here. -->`);
    lines.push("");
    lines.push(readFileSync(src, "utf-8"));

    writeTextLf(dest, lines.join("\n"));
    written += 1;
  }
  return written;
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

  const legacyBashRules = [
    "Bash(python3 ~/.claude/skills/**)",
    "Bash(python3 ~/.aki/akidevrule/agskills/**)",
  ];
  const managedBashRules = [
    "Bash(python3 ~/.claude/skills/*)",
    "Bash(python3 ~/.aki/akidevrule/agskills/*)",
  ];
  const variantBashRule = `Bash(python3 ${toTildePath(join(claudeDir, "skills"))}/*)`;
  if (!managedBashRules.includes(variantBashRule)) {
    managedBashRules.push(variantBashRule);
  }

  perms.allow = perms.allow.filter((x) => !legacyBashRules.includes(x));
  for (const rule of managedBashRules) if (!perms.allow.includes(rule)) perms.allow.push(rule);

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
// Antigravity permissions merge
// ---------------------------------------------------------------------------

function mergeAntigravityPermissions(claudeDirs = []) {
  if (!isDir(GEMINI_DIR)) return;

  const scriptsDir = join(REPO_ROOT, "skills", "akiflow", "scripts");
  const skillScripts = listDir(scriptsDir)
    .filter((n) => n.endsWith(".py"))
    .map((n) => `akiflow/scripts/${n}`)
    .sort();
  const claudeRoots = claudeDirs.map((d) => join(d, "skills"));
  const skillRoots = [GEMINI_SKILLS_DIR, ...claudeRoots];
  const launchers = IS_WIN ? ["py -3", "python", "python3"] : ["python3"];

  const managedCommands = [];
  for (const launcher of launchers) {
    for (const root of skillRoots) {
      for (const script of skillScripts) {
        const target = join(root, script);
        managedCommands.push(`command(${launcher} ${target})`);
        const rel = relative(HOME, target);
        if (rel && !rel.startsWith("..") && !isAbsolute(rel)) {
          managedCommands.push(`command(${launcher} ~/${rel.split(sep).join("/")})`);
        }
      }
    }
  }
  managedCommands.push(
    `write_file(${join(HOME, ".aki", "agent-council")}/)`,
    `read_file(${join(HOME, ".aki", "akidevrule")}/)`,
    "write_file(~/.aki/agent-council/)",
    "read_file(~/.aki/akidevrule/)"
  );

  const legacyCommands = [
    "command(python3 ~/.gemini/config/skills/*)",
    "command(python3 ~/.claude/skills/*)",
    "command(python3 ~/.aki/akidevrule/agskills/*)",
  ];

  const targetFiles = [
    join(GEMINI_DIR, "antigravity-cli", "settings.json"),
    join(GEMINI_DIR, "settings.json"),
  ];

  for (const target of targetFiles) {
    let data = {};
    if (isFile(target)) data = JSON.parse(readFileSync(target, "utf-8"));

    if (typeof data.permissions !== "object" || data.permissions === null || Array.isArray(data.permissions))
      data.permissions = {};
    const perms = data.permissions;
    if (!Array.isArray(perms.allow)) perms.allow = [];

    let changed = false;
    for (const cmd of legacyCommands) {
      const i = perms.allow.indexOf(cmd);
      if (i !== -1) {
        perms.allow.splice(i, 1);
        changed = true;
      }
    }
    for (const cmd of managedCommands) {
      if (!perms.allow.includes(cmd)) {
        perms.allow.push(cmd);
        changed = true;
      }
    }

    if (perms.allowNonWorkspaceAccess !== true) {
      perms.allowNonWorkspaceAccess = true;
      changed = true;
    }
    if (perms.agentMode !== true) {
      perms.agentMode = true;
      changed = true;
    }
    if (!Array.isArray(perms.trustedWorkspaces)) {
      perms.trustedWorkspaces = [];
      changed = true;
    }
    if (!perms.trustedWorkspaces.includes(HOME)) {
      perms.trustedWorkspaces.push(HOME);
      changed = true;
    }

    if (changed || !isFile(target)) {
      mkdirSync(dirname(target), { recursive: true });
      if (isFile(target)) {
        backup(target);
        pruneBackups(target);
      }
      writeTextLf(target, JSON.stringify(data, null, 2) + "\n");
    }
  }
}

// ---------------------------------------------------------------------------
// Kiro permissions merge
// ---------------------------------------------------------------------------

function mergeKiroPermissions(claudeDirs = []) {
  const kiroDir = join(HOME, ".kiro");
  if (!isDir(kiroDir)) return;

  const settingsDir = join(kiroDir, "settings");
  mkdirSync(settingsDir, { recursive: true });
  const yamlPath = join(settingsDir, "permissions.yaml");

  const managedMatches = [
    "python3 ~/.kiro/skills/*",
    "python3 ~/.gemini/config/skills/*",
    "python3 ~/.aki/akidevrule/agskills/*",
  ];
  for (const cDir of claudeDirs) {
    const m = `python3 ${toTildePath(join(cDir, "skills"))}/*`;
    if (!managedMatches.includes(m)) managedMatches.push(m);
  }

  if (!isFile(yamlPath)) {
    const lines = [
      "# Generated by akidevrule installer",
      "rules:",
      "  - capability: shell",
      "    match:",
    ];
    for (const m of managedMatches) lines.push(`      - "${m}"`);
    lines.push("    effect: allow\n");
    writeTextLf(yamlPath, lines.join("\n"));
  } else {
    const content = readFileSync(yamlPath, "utf-8");
    const needed = managedMatches.filter((m) => !content.includes(m));
    if (needed.length) {
      backup(yamlPath);
      pruneBackups(yamlPath);
      const appendLines = ["", "  - capability: shell", "    match:"];
      for (const m of needed) appendLines.push(`      - "${m}"`);
      appendLines.push("    effect: allow\n");
      writeTextLf(yamlPath, content.replace(/\s+$/, "") + "\n" + appendLines.join("\n"));
    }
  }
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

  const claudeMdSrc = readFileSync(join(REPO_ROOT, "claude", "CLAUDE.md"), "utf-8");
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
        const bashRule = `Bash(python3 ${toTildePath(join(claudeDir, "skills"))}/*)`;
        const bashOk = allow.includes(bashRule) || allow.includes("Bash(python3 ~/.claude/skills/*)");
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

function printSummary(claudeDirs) {
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
  console.log(cyanBold("Permissions configured:"));
  console.log("  ⚙️  Claude Code     : Read(~/.aki/akidevrule/**), Bash(python3 <target>/skills/*)");
  if (isDir(GEMINI_DIR))
    console.log("  ⚙️  Antigravity     : per-script command() rules (akiflow scripts ×all roots ×2 path renderings ×the platform's python launchers), write_file(~/.aki/agent-council/), read_file(~/.aki/akidevrule/)");
  if (isDir(join(HOME, ".kiro")))
    console.log("  ⚙️  Kiro CLI        : capability:shell (python3 ~/.kiro/skills/*, ~/.claude*/skills/*)");

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

  // --- 5. Antigravity & Kiro permissions ---
  mergeAntigravityPermissions(claudeDirs);
  mergeKiroPermissions(claudeDirs);

  printSummary(claudeDirs);
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
