// Script pre-allow for every agent harness akidevrule deploys skills to.
// Matcher facts per harness: docs/ref/cli-permission-allowlist-standard.md.
import { existsSync, readdirSync, readFileSync, mkdirSync } from "node:fs";
import { join, dirname, relative, isAbsolute, sep } from "node:path";

// ---------------------------------------------------------------------------
// Inventory — the scripts and the command lines that invoke them
// ---------------------------------------------------------------------------

export function listSkillScripts(skillsSrc) {
  const scripts = [];
  for (const skill of readdirSync(skillsSrc).sort()) {
    const dir = join(skillsSrc, skill, "scripts");
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).sort()) {
      if (name.endsWith(".py")) scripts.push([skill, "scripts", name]);
    }
  }
  return scripts;
}

function launchers(isWin) {
  return isWin ? ["py -3", "python", "python3"] : ["python3"];
}

// Every rendering a model may type: absolute and `~/`-literal, since no surveyed matcher expands `~` on both sides.
export function scriptInvocations({ roots, scripts, home, isWin }) {
  const out = new Set();
  for (const root of new Set(roots)) {
    for (const parts of scripts) {
      const abs = join(root, ...parts);
      const renderings = [abs];
      const rel = relative(home, abs);
      if (rel && !rel.startsWith("..") && !isAbsolute(rel)) renderings.push("~/" + rel.split(sep).join("/"));
      for (const launcher of launchers(isWin)) {
        for (const path of renderings) out.add(`${launcher} ${path}`);
      }
    }
  }
  return [...out];
}

// ---------------------------------------------------------------------------
// Ownership — which existing entries this installer wrote and may replace
// ---------------------------------------------------------------------------

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Owned = any Python launcher pointing into `<akiSkill>/scripts/`, plus the directory-glob rules of earlier releases.
export function ownershipTest(skillNames) {
  const names = skillNames.map(escapeRe).join("|");
  const current = new RegExp(`(?:py -3|python3?)[\\s:]+\\S*[\\\\/](?:${names})[\\\\/]scripts[\\\\/]`);
  const legacy = /^(?:(?:Bash|command)\()?python3 \S*(?:skills|agskills)[\\/]\*{1,2}\)?$/;
  return (entry) => typeof entry === "string" && (current.test(entry) || legacy.test(entry));
}

export function replaceOwned(list, isOwned, desired) {
  return [...list.filter((e) => !isOwned(e)), ...desired];
}

// Recovers a --claude-dir root already recorded in a shared target's allowlist, so a run that omits the flag does not prune it as stale.
export function recoverSkillRoots(allow, isOwned, home) {
  const roots = new Set();
  for (const entry of allow) {
    if (!isOwned(entry)) continue;
    const m = /^command\((?:py -3|python3?)[ :]+(.+)\)$/.exec(entry);
    if (!m) continue;
    let p = m[1];
    if (p.startsWith("~/")) p = join(home, ...p.slice(2).split("/"));
    if (!isAbsolute(p)) continue;
    const root = dirname(dirname(dirname(p)));
    if (isAbsolute(root)) roots.add(root);
  }
  return [...roots];
}

// ---------------------------------------------------------------------------
// File writers
// ---------------------------------------------------------------------------

const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

function writeIfChanged(path, before, after, io) {
  if (before === after) return false;
  mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path)) io.backup(path);
  io.writeText(path, after);
  return true;
}

function updateJson(path, mutate, io) {
  const before = existsSync(path) ? readFileSync(path, "utf-8") : null;
  const data = before === null ? {} : JSON.parse(before);
  if (!isObject(data)) throw new Error(`must be a JSON object: ${path}`);
  mutate(data);
  return writeIfChanged(path, before, JSON.stringify(data, null, 2) + "\n", io);
}

function allowList(data, key = "allow") {
  if (!isObject(data.permissions)) data.permissions = {};
  if (!Array.isArray(data.permissions[key])) data.permissions[key] = [];
  return data.permissions;
}

const BLOCK_START = "# >>> akidevrule managed — regenerated on every install";
const BLOCK_END = "# <<< akidevrule managed";

// Kiro 3.x: one `rules:` list per file; the managed items live between two marker comments at its end.
function writeKiroYaml(path, matches, isOwned, io) {
  const before = existsSync(path) ? readFileSync(path, "utf-8") : null;
  let body = (before ?? "").replace(new RegExp(`\\n?${escapeRe(BLOCK_START)}[\\s\\S]*?${escapeRe(BLOCK_END)}\\n?`), "\n");
  // Pre-marker releases appended bare allow items; drop those whose every match line is owned.
  body = body.replace(/\n  - capability: shell\n    match:\n((?:      - ".*"\n)+)    effect: allow\n?/g, (item, lines) =>
    lines.trimEnd().split("\n").every((l) => isOwned(JSON.parse(l.trim().slice(2)))) ? "\n" : item
  );
  body = body.replace(/\s+$/, "");
  if (!/^rules:/m.test(body)) body = (body ? body + "\n" : "") + "rules:";
  const block = [BLOCK_START, "  - capability: shell", "    match:", ...matches.map((m) => `      - ${JSON.stringify(m)}`), "    effect: allow", BLOCK_END];
  return writeIfChanged(path, before, body + "\n" + block.join("\n") + "\n", io);
}

function splitLauncher(invocation) {
  const i = invocation.startsWith("py -3 ") ? 5 : invocation.indexOf(" ");
  return [invocation.slice(0, i), invocation.slice(i + 1)];
}

// ---------------------------------------------------------------------------
// Harness adapters — one per rule dialect
// ---------------------------------------------------------------------------

// Claude Code: `*` spans `/` and spaces; used inside the settings.json merge the installer already owns.
export function claudeAllowRules(invocations) {
  return invocations.map((inv) => `Bash(${inv}*)`);
}

// Each adapter: which config it owns, which skill roots its sessions see, and how to write the rules.
export function harnessAdapters(ctx) {
  const { home, claudeSkillRoots, dirs } = ctx;
  const primaryClaude = claudeSkillRoots[0];
  return [
    {
      id: "antigravity",
      present: existsSync(dirs.gemini),
      roots: [dirs.geminiSkills, ...claudeSkillRoots],
      files: [join(dirs.gemini, "antigravity-cli", "settings.json"), join(dirs.gemini, "settings.json")],
      // Literal string-prefix matcher, no glob: one rule per exact invocation.
      write(path, invs, isOwned, io) {
        return updateJson(path, (data) => {
          const perms = allowList(data);
          const lanes = [
            `write_file(${join(home, ".aki", "agent-council")}/)`,
            `read_file(${join(home, ".aki", "akidevrule")}/)`,
            "write_file(~/.aki/agent-council/)",
            "read_file(~/.aki/akidevrule/)",
          ];
          perms.allow = replaceOwned(perms.allow.filter((e) => !lanes.includes(e)), isOwned, [
            ...invs.map((inv) => `command(${inv})`),
            ...lanes,
          ]);
          perms.allowNonWorkspaceAccess = true;
          perms.agentMode = true;
          if (!Array.isArray(perms.trustedWorkspaces)) perms.trustedWorkspaces = [];
          if (!perms.trustedWorkspaces.includes(home)) perms.trustedWorkspaces.push(home);
        }, io);
      },
    },
    {
      id: "kiro",
      present: existsSync(dirs.kiro),
      roots: [dirs.kiroSkills, primaryClaude],
      files: [join(dirs.kiro, "settings", "permissions.yaml")],
      write: (path, invs, isOwned, io) => writeKiroYaml(path, invs.map((inv) => `${inv}*`), isOwned, io),
    },
    {
      id: "codex",
      present: existsSync(dirs.codex),
      roots: [dirs.agentsSkills, primaryClaude],
      // A whole file akidevrule owns — regenerated, never merged.
      files: [join(dirs.codex, "rules", "akidevrule.rules")],
      write(path, invs, _isOwned, io) {
        const before = existsSync(path) ? readFileSync(path, "utf-8") : null;
        const rules = invs.map((inv) => {
          const [launcher, script] = splitLauncher(inv);
          const pattern = [...launcher.split(" "), script].map((t) => JSON.stringify(t)).join(", ");
          return `prefix_rule(pattern = [${pattern}], decision = "allow")`;
        });
        return writeIfChanged(path, before, ["# Generated by akidevrule installer — do not edit.", ...rules, ""].join("\n"), io);
      },
    },
    {
      id: "cursor",
      present: existsSync(dirs.cursor),
      roots: [dirs.agentsSkills, primaryClaude],
      files: [join(dirs.cursor, "cli-config.json")],
      // `Shell(<first token>:<args glob>)`; a bare `Shell(python3)` would allow every Python command.
      write(path, invs, isOwned, io) {
        return updateJson(path, (data) => {
          const perms = allowList(data);
          perms.allow = replaceOwned(perms.allow, isOwned, invs.map((inv) => {
            const [launcher, args] = splitLauncher(inv);
            const [base, ...flags] = launcher.split(" ");
            return `Shell(${base}:${[...flags, args].join(" ")}*)`;
          }));
        }, io);
      },
    },
    {
      id: "opencode",
      present: existsSync(dirs.opencode),
      roots: [primaryClaude, dirs.agentsSkills],
      files: [join(dirs.opencode, "opencode.json")],
      // `permission.bash` maps glob → action, last match wins, so owned keys go last.
      write(path, invs, isOwned, io) {
        return updateJson(path, (data) => {
          if (!isObject(data.permission)) data.permission = {};
          const bash = data.permission.bash;
          const kept = isObject(bash) ? bash : typeof bash === "string" ? { "*": bash } : {};
          const next = Object.fromEntries(Object.entries(kept).filter(([k]) => !isOwned(k)));
          for (const inv of invs) next[`${inv}*`] = "allow";
          data.permission.bash = next;
        }, io);
      },
    },
  ];
}

// Returns one report row per file touched or skipped, for the install summary.
export function applyHarnessPreAllow(ctx, io) {
  const isOwned = ownershipTest(ctx.akiSkillNames);
  const report = [];
  for (const adapter of harnessAdapters(ctx)) {
    if (!adapter.present) continue;
    const invs = scriptInvocations({ roots: adapter.roots, scripts: ctx.scripts, home: ctx.home, isWin: ctx.isWin });
    for (const file of adapter.files) {
      try {
        const changed = adapter.write(file, invs, isOwned, io);
        report.push({ id: adapter.id, file, rules: invs.length, changed });
      } catch (err) {
        report.push({ id: adapter.id, file, error: err.message });
      }
    }
  }
  return report;
}
