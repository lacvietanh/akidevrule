# Aki global Claude Code guidance

@~/.aki/akidevrule/RULE-agent-behavior.md
@~/.claude/skills/akirule/SKILL.md

The harness embeds both at session start: the behavior floor and the router. Every other rule enters context when the model `Read`s it on a route match. For routes with an artifact signature the `aki-route-guard` PreToolUse hook denies the first Edit/Write of that artifact type in a session until the routed files were read — the deny reason names them; read them in full, then retry. Meaning-only routes stay model-dependent: route on meaning, load when the domain is in doubt. A turn that only reads, counts or explains what exists routes nothing.

Doc corpora named by short name in conversation ("UNIDOC", "the standards doc") are machine-specific: resolve them in `~/.claude/CLAUDE.local.md` before searching or asking.
