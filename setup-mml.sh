#!/bin/bash
set -e

echo "Setting up MML to YM2151 conversion libraries..."

# Note: We always use the latest version from main branch
# Version pinning is prohibited for cat2151 libraries due to daily critical bug fixes
# See .github/AGENT_INSTRUCTIONS.md for details

# Create lib directory if it doesn't exist
mkdir -p lib

ensure_cdylib_crate_type() {
    if ! grep -Eq '^[[:space:]]*crate-type[[:space:]]*=' Cargo.toml; then
        if grep -Eq '^\[lib\]' Cargo.toml; then
            perl -0777 -pe 's/^\[lib\][ \t]*\r?\n/[lib]\ncrate-type = ["cdylib", "rlib"]\n/m' -i Cargo.toml
        else
            cat <<'EOF' >> Cargo.toml

[lib]
crate-type = ["cdylib", "rlib"]
EOF
        fi
    fi
}

# Clone and build mmlabc-to-smf-rust
if [ ! -d "lib/mmlabc-to-smf-rust" ]; then
    echo "Cloning mmlabc-to-smf-rust..."
    git clone https://github.com/cat2151/mmlabc-to-smf-rust.git lib/mmlabc-to-smf-rust
fi

cd lib/mmlabc-to-smf-rust
echo "Pulling latest changes from mmlabc-to-smf-rust..."
git fetch origin
git checkout main
git pull origin main
CURRENT_COMMIT=$(git rev-parse --short HEAD)
echo "Building mmlabc-to-smf-rust WASM package..."
cd mmlabc-to-smf-wasm
ensure_cdylib_crate_type
rm -rf ../../../lib/mmlabc-to-smf-pkg
wasm-pack build --target web
mv pkg ../../../lib/mmlabc-to-smf-pkg
rm -rf target
git checkout -- Cargo.toml
cd ..
cd ../..

# Clone and build smf-to-ym2151log-rust
if [ ! -d "lib/smf-to-ym2151log-rust" ]; then
    echo "Cloning smf-to-ym2151log-rust..."
    git clone https://github.com/cat2151/smf-to-ym2151log-rust.git lib/smf-to-ym2151log-rust
fi

cd lib/smf-to-ym2151log-rust
echo "Pulling latest changes from smf-to-ym2151log-rust..."
git fetch origin
git checkout main
git pull origin main
ensure_cdylib_crate_type
CURRENT_COMMIT2=$(git rev-parse --short HEAD)
echo "Building smf-to-ym2151log-rust WASM package..."
rm -rf ../../lib/smf-to-ym2151log-pkg
wasm-pack build --target web --features wasm
mv pkg ../../lib/smf-to-ym2151log-pkg
rm -rf target
git checkout -- Cargo.toml
cd ../..

echo "✓ MML libraries setup complete!"
echo "  - mmlabc-to-smf: lib/mmlabc-to-smf-pkg/ (latest: ${CURRENT_COMMIT})"
echo "  - smf-to-ym2151log: lib/smf-to-ym2151log-pkg/ (latest: ${CURRENT_COMMIT2})"
