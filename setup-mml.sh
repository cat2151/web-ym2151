#!/bin/bash
set -e

echo "Setting up MML to YM2151 conversion libraries..."

# Pin to specific commits for reproducible builds
MMLABC_TO_SMF_COMMIT="23a01aec14aba51f91ec4c264eebf0af9dfc735d"
SMF_TO_YM2151LOG_COMMIT="9204374692f166f2b24cd1daba504b81d7ee3a02"

# Create lib directory if it doesn't exist
mkdir -p lib

# Clone and build mmlabc-to-smf-rust
if [ ! -d "lib/mmlabc-to-smf-rust" ]; then
    echo "Cloning mmlabc-to-smf-rust..."
    git clone https://github.com/cat2151/mmlabc-to-smf-rust.git lib/mmlabc-to-smf-rust
fi

cd lib/mmlabc-to-smf-rust
echo "Checking out pinned commit ${MMLABC_TO_SMF_COMMIT}..."
git fetch origin
git checkout ${MMLABC_TO_SMF_COMMIT}
echo "Building mmlabc-to-smf-rust WASM package..."
wasm-pack build --target web --out-dir ../../lib/mmlabc-to-smf-pkg
cd ../..

# Clone and build smf-to-ym2151log-rust
if [ ! -d "lib/smf-to-ym2151log-rust" ]; then
    echo "Cloning smf-to-ym2151log-rust..."
    git clone https://github.com/cat2151/smf-to-ym2151log-rust.git lib/smf-to-ym2151log-rust
fi

cd lib/smf-to-ym2151log-rust
echo "Checking out pinned commit ${SMF_TO_YM2151LOG_COMMIT}..."
git fetch origin
git checkout ${SMF_TO_YM2151LOG_COMMIT}
echo "Building smf-to-ym2151log-rust WASM package..."
wasm-pack build --target web --features wasm --out-dir ../../lib/smf-to-ym2151log-pkg
cd ../..

echo "✓ MML libraries setup complete!"
echo "  - mmlabc-to-smf: lib/mmlabc-to-smf-pkg/ (commit: ${MMLABC_TO_SMF_COMMIT})"
echo "  - smf-to-ym2151log: lib/smf-to-ym2151log-pkg/ (commit: ${SMF_TO_YM2151LOG_COMMIT})"
