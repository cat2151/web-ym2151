#!/bin/bash
set -euo pipefail

echo "Setting up MML to YM2151 conversion libraries (prebuilt, no Rust toolchain)..."

rm -rf lib/mmlabc-to-smf-pkg lib/smf-to-ym2151log-pkg
mkdir -p lib/mmlabc-to-smf-pkg lib/smf-to-ym2151log-pkg

download() {
    local url="$1"
    local dest="$2"
    echo "Downloading $(basename "$dest") from $(dirname "$url")"
    curl -fL --retry 3 --retry-delay 2 --connect-timeout 5 --max-time 120 --proto '=https' --tlsv1.2 "$url" -o "$dest"
}

verify_sha() {
    local file="$1"
    local var_name="$2"
    local expected="${!var_name:-}"
    if [ -z "$expected" ]; then
        return 0
    fi
    local actual
    actual=$(sha256sum "$file" | awk '{print $1}')
    if [ "$actual" != "$expected" ]; then
        echo "Checksum mismatch for ${file}: expected ${expected}, got ${actual}" >&2
        exit 1
    fi
}

MML_BASE="${MML_BASE:-https://cat2151.github.io/mmlabc-to-smf-rust/mmlabc-to-smf-wasm/pkg}"
SMF_BASE="${SMF_BASE:-https://cat2151.github.io/smf-to-ym2151log-rust/pkg}"
SMF_SOURCE_REPO="${SMF_SOURCE_REPO:-https://github.com/cat2151/smf-to-ym2151log-rust.git}"
WASM_PACK_VERSION="${WASM_PACK_VERSION:-0.12.1}"

download "${MML_BASE}/mmlabc_to_smf_wasm.js" "lib/mmlabc-to-smf-pkg/mmlabc_to_smf_wasm.js"
verify_sha "lib/mmlabc-to-smf-pkg/mmlabc_to_smf_wasm.js" "MML_JS_SHA256"
download "${MML_BASE}/mmlabc_to_smf_wasm_bg.wasm" "lib/mmlabc-to-smf-pkg/mmlabc_to_smf_wasm_bg.wasm"
verify_sha "lib/mmlabc-to-smf-pkg/mmlabc_to_smf_wasm_bg.wasm" "MML_WASM_SHA256"
download "${MML_BASE}/package.json" "lib/mmlabc-to-smf-pkg/package.json"
verify_sha "lib/mmlabc-to-smf-pkg/package.json" "MML_PKG_SHA256"

download_smf_pkg() {
    download "${SMF_BASE}/smf_to_ym2151log.js" "lib/smf-to-ym2151log-pkg/smf_to_ym2151log.js" || return 1
    verify_sha "lib/smf-to-ym2151log-pkg/smf_to_ym2151log.js" "SMF_JS_SHA256"
    download "${SMF_BASE}/smf_to_ym2151log_bg.wasm" "lib/smf-to-ym2151log-pkg/smf_to_ym2151log_bg.wasm" || return 1
    verify_sha "lib/smf-to-ym2151log-pkg/smf_to_ym2151log_bg.wasm" "SMF_WASM_SHA256"
    download "${SMF_BASE}/smf_to_ym2151log.d.ts" "lib/smf-to-ym2151log-pkg/smf_to_ym2151log.d.ts" || return 1
    verify_sha "lib/smf-to-ym2151log-pkg/smf_to_ym2151log.d.ts" "SMF_DTS_SHA256"
    download "${SMF_BASE}/package.json" "lib/smf-to-ym2151log-pkg/package.json" || return 1
    verify_sha "lib/smf-to-ym2151log-pkg/package.json" "SMF_PKG_SHA256"
}

build_smf_pkg_from_source() {
    echo "Primary download failed; building smf-to-ym2151log from source (main branch)..."
    local tmp_dir
    tmp_dir=$(mktemp -d)
    git clone --depth 1 "$SMF_SOURCE_REPO" "$tmp_dir"
    pushd "$tmp_dir" >/dev/null
    if ! command -v wasm-pack >/dev/null 2>&1; then
        echo "wasm-pack not found; installing ${WASM_PACK_VERSION}..."
        cargo install wasm-pack --version "${WASM_PACK_VERSION}" --locked
    fi
    rustup target add wasm32-unknown-unknown
    wasm-pack build --target web --features wasm
    popd >/dev/null
    rm -rf lib/smf-to-ym2151log-pkg
    mkdir -p lib/smf-to-ym2151log-pkg
    cp "$tmp_dir/pkg/"* lib/smf-to-ym2151log-pkg/
    rm -rf "$tmp_dir"
}

if ! download_smf_pkg; then
    build_smf_pkg_from_source
fi

echo "✓ MML libraries setup complete!"
echo "  - mmlabc-to-smf: lib/mmlabc-to-smf-pkg/ (prebuilt download)"
echo "  - smf-to-ym2151log: lib/smf-to-ym2151log-pkg/ (prebuilt download)"
