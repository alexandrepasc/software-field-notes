#!/usr/bin/env bash
set -euo pipefail

# Setup script for running this Jekyll site locally on Fedora.
# Installs the build toolchain + Ruby dev headers and Node.js, installs
# bundle and Playwright dependencies, then verifies the build and the e2e
# test suite. Idempotent: safe to re-run.

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUNDLE_GEMFILE="${PROJECT_DIR}/Gemfile.local"
PLAYWRIGHT_CACHE="${HOME}/.cache/ms-playwright"

say() { printf '\033[1;34m==> %s\033[0m\n' "$*"; }
ok()  { printf '\033[1;32m==> %s\033[0m\n' "$*"; }

cd "$PROJECT_DIR"

command -v git >/dev/null 2>&1 || { echo "ERROR: git is required" >&2; exit 1; }

say "Installing build toolchain, Ruby dev headers, and Node.js (dnf)..."
dnf_cmd=(dnf install -y ruby ruby-devel gcc gcc-c++ make nodejs npm)
if [[ "$(id -u)" -ne 0 ]]; then
  sudo "${dnf_cmd[@]}"
else
  "${dnf_cmd[@]}"
fi

command -v bundle >/dev/null 2>&1 || {
  say "Bundler not found; installing..."
  if [[ "$(id -u)" -ne 0 ]]; then sudo gem install bundler; else gem install bundler; fi
}
ok "Bundler: $(bundle --version)"
ok "Node.js: $(node --version)"
ok "npm: $(npm --version)"

if [[ ! -f "$BUNDLE_GEMFILE" ]]; then
  say "Creating gitignored Gemfile.local (adds webrick without touching Gemfile)..."
  cat > "$BUNDLE_GEMFILE" <<EOF
eval_gemfile "${PROJECT_DIR}/Gemfile"
gem "webrick"
EOF
fi

say "Installing bundle dependencies..."
BUNDLE_GEMFILE="$BUNDLE_GEMFILE" bundle install

say "Verifying build..."
BUNDLE_GEMFILE="$BUNDLE_GEMFILE" bundle exec jekyll build

say "Installing Playwright (Node) dependencies..."
npm install

if [[ -d "$PLAYWRIGHT_CACHE" ]] && ls "$PLAYWRIGHT_CACHE"/chromium-* >/dev/null 2>&1; then
  ok "Playwright chromium already installed."
else
  say "Installing Playwright chromium browser and its system dependencies..."
  npx playwright install --with-deps chromium
fi

say "Verifying tests..."
npm test

ok "Setup complete."
printf 'Serve with:\n    BUNDLE_GEMFILE=%s bundle exec jekyll serve\n' "$BUNDLE_GEMFILE"
printf 'Run tests with:\n    npm test\n'
printf 'Then open http://localhost:4000\n'
