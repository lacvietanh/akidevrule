$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Thin launcher for install.mjs; `npx @akinet/akidevrule@latest` needs no clone.
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "akidevrule: Node.js 18+ is required but 'node' was not found on PATH. Install Node 18+ (https://nodejs.org) or run: npx @akinet/akidevrule@latest"
  exit 1
}

& node "$dir\install.mjs" @args
exit $LASTEXITCODE
