$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path

# akidevrule is a pure-Node installer. This launcher just locates node and hands
# off to install.mjs. Prefer `npx @akitao/akidevrule@latest` for a zero-clone install.
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "akidevrule: Node.js 18+ is required but 'node' was not found on PATH. Install Node 18+ (https://nodejs.org) or run: npx @akitao/akidevrule@latest"
  exit 1
}

& node "$dir\install.mjs" @args
exit $LASTEXITCODE
