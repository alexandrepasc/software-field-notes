#!/usr/bin/env bash
set -euo pipefail

# Setup script for running this Jekyll site locally on Fedora or Void Linux.
# Installs the build toolchain + Ruby dev headers and Node.js, installs
# bundle and Playwright dependencies, then verifies the build and the e2e
# test suite. Idempotent: safe to re-run.
#
# Only the package-manager steps differ per distro; everything from bundler
# onwards is shared. Fedora and Void also disagree on package names, which is
# why the lists below are spelled out rather than shared:
#   - Void's `gcc` already ships g++/c++, and `nodejs` bundles npm, so there is
#     no `gcc-c++` or `npm` package to install.
#   - Playwright's `install --with-deps` only knows apt/dnf, so on Void the
#     Chromium runtime libraries are installed through xbps instead.

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUNDLE_GEMFILE="${PROJECT_DIR}/Gemfile.local"
PLAYWRIGHT_CACHE="${HOME}/.cache/ms-playwright"

say() { printf '\033[1;34m==> %s\033[0m\n' "$*"; }
ok()  { printf '\033[1;32m==> %s\033[0m\n' "$*"; }

cd "$PROJECT_DIR"

command -v git >/dev/null 2>&1 || { echo "ERROR: git is required" >&2; exit 1; }

if command -v xbps-install >/dev/null 2>&1; then
  DISTRO=void
elif command -v dnf >/dev/null 2>&1; then
  DISTRO=fedora
else
  echo "ERROR: unsupported distribution: need xbps-install (Void Linux) or dnf (Fedora)" >&2
  exit 1
fi

# Void's Chromium runtime libraries, mapped from Playwright's Ubuntu dependency
# list to XBPS package names. `cups` is Void's name for what Fedora ships as
# `cups-libs`; the rest are identical.
CHROMIUM_DEPS=(alsa-lib atk at-spi2-atk at-spi2-core cairo cups dbus libdrm
  libgbm glib nspr nss pango libX11 libxcb libXcomposite libXdamage libXext
  libXfixes libxkbcommon libXrandr)

as_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    sudo "$@"
  else
    "$@"
  fi
}

say "Installing build toolchain, Ruby dev headers, and Node.js ($DISTRO)..."
case "$DISTRO" in
  void)
    # Playwright's bundled Chromium is a glibc build; Void defaults to musl.
    if ldd --version 2>&1 | grep -qi musl; then
      printf '\033[1;33m==> WARNING\033[0m\n'
      echo "    This is a musl-based Void install, but Playwright's bundled"
      echo "    Chromium is a glibc build and will not run here."
      echo "    Use the 'chromium' xbps package with Playwright's"
      echo "    channel: 'chromium' as the browser instead."
    fi
    as_root xbps-install -y ruby ruby-devel gcc make nodejs
    ;;
  fedora)
    as_root dnf install -y ruby ruby-devel gcc gcc-c++ make nodejs npm
    ;;
esac

command -v bundle >/dev/null 2>&1 || {
  say "Bundler not found; installing..."
  as_root gem install bundler
}
ok "Bundler: $(bundle --version)"
ok "Node.js: $(node --version)"
ok "npm: $(npm --version)"

# Void installs Ruby's gems into a root-owned /usr/lib/ruby/gems, and unlike
# `gem install`, Bundler has no interactive "install into ~/.gem instead?"
# fallback — `bundle install` just dies with Bundler::PermissionError. When the
# system gem dir is not writable, point Bundler at a project-local path. The
# setting is persisted in .bundle/config rather than exported as an env var
# because `npm test` shells out to `bundle exec` from playwright.config.js,
# which would never see a variable set here.
SYSTEM_GEM_DIR="$(ruby -e 'print Gem.dir')"
if [[ -w "$SYSTEM_GEM_DIR" ]]; then
  ok "System gem directory is writable: $SYSTEM_GEM_DIR"
else
  say "System gem directory is not writable ($SYSTEM_GEM_DIR); using a project-local bundle path..."
  bundle config set --local path "${PROJECT_DIR}/.bundle"
fi

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
  case "$DISTRO" in
    void)
      # Void has no package manager hook in Playwright, so the libraries that
      # `--with-deps` would pull in on Fedora are named explicitly here.
      as_root xbps-install -y "${CHROMIUM_DEPS[@]}"
      npx playwright install chromium
      ;;
    fedora)
      npx playwright install --with-deps chromium
      ;;
  esac
fi

say "Verifying tests..."
npm test

ok "Setup complete."
printf 'Serve with:\n    BUNDLE_GEMFILE=%s bundle exec jekyll serve\n' "$BUNDLE_GEMFILE"
printf 'Run tests with:\n    npm test\n'
printf 'Then open http://localhost:4000\n'
