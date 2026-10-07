#!/usr/bin/env bash
# Codex runtime probe — run on a machine with the Codex CLI (the dev box has none). Records the CLI version, the install state of the managed AGENTS.md block, and whether a fresh session actually received it. Spends one Codex turn. Plan: docs/plan/done/codex-instruction-delivery.md Item 6.
set -euo pipefail
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
command -v codex >/dev/null || { echo "codex is not on PATH"; exit 2; }
echo "codex: $(codex --version)"
echo "managed block in $CODEX_HOME/AGENTS.md: $(grep -c '>>> akidevrule managed' "$CODEX_HOME/AGENTS.md" 2>/dev/null || echo 0)"
echo "AGENTS.override.md non-empty (shadows AGENTS.md): $([ -s "$CODEX_HOME/AGENTS.override.md" ] && echo yes || echo no)"
grep -n 'project_doc_max_bytes\|project_doc_fallback_filenames' "$CODEX_HOME/config.toml" 2>/dev/null || echo "config.toml: no project_doc_* keys"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
cd "$WORK" && git init -q
echo "--- fresh session in an empty repo (expected: a [RULES] line naming agent, then the B7 heading) ---"
codex exec --skip-git-repo-check "Reply with exactly two lines and nothing else: line 1, the [RULES] receipt your instructions require; line 2, the heading of the section stating that akirule wins over your harness instructions." 2>&1 | tail -8
