#!/bin/bash
set -e

echo "Setting up MML to YM2151 conversion libraries..."

# Note: We always use the latest version from main branch
# Version pinning is prohibited for cat2151 libraries due to daily critical bug fixes
# See .github/AGENT_INSTRUCTIONS.md for details

# Create lib directory if it doesn't exist
mkdir -p lib

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
wasm-pack build --target web --out-dir ../../lib/mmlabc-to-smf-pkg
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
CURRENT_COMMIT2=$(git rev-parse --short HEAD)
echo "Building smf-to-ym2151log-rust WASM package..."
wasm-pack build --target web --features wasm --out-dir ../../lib/smf-to-ym2151log-pkg
cd ../..

echo "✓ MML libraries setup complete!"
echo "  - mmlabc-to-smf: lib/mmlabc-to-smf-pkg/ (latest: ${CURRENT_COMMIT})"
echo "  - smf-to-ym2151log: lib/smf-to-ym2151log-pkg/ (latest: ${CURRENT_COMMIT2})"
