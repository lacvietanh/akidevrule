#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# akidevrule is a pure-Node installer. This launcher just locates node and hands
# off to install.mjs. Prefer `npx @akitao/akidevrule@latest` for a zero-clone install.
if ! command -v node >/dev/null 2>&1; then
  echo "akidevrule: Node.js 18+ is required but 'node' was not found on PATH." >&2
  echo "Install Node 18+ (https://nodejs.org) or run: npx @akitao/akidevrule@latest" >&2
  exit 1
fi

exec node "$DIR/install.mjs" "$@"
