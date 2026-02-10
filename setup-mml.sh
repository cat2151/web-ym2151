#!/bin/bash
set -euo pipefail

echo "Setting up MML to YM2151 conversion libraries (prebuilt, no Rust toolchain)..."

rm -rf lib/mmlabc-to-smf-pkg lib/smf-to-ym2151log-pkg lib/mml-parser
mkdir -p lib/mmlabc-to-smf-pkg lib/smf-to-ym2151log-pkg lib/mml-parser

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
TREE_SITTER_BASE="${TREE_SITTER_BASE:-https://cat2151.github.io/mmlabc-to-smf-rust}"

download "${MML_BASE}/mmlabc_to_smf_wasm.js" "lib/mmlabc-to-smf-pkg/mmlabc_to_smf_wasm.js"
verify_sha "lib/mmlabc-to-smf-pkg/mmlabc_to_smf_wasm.js" "MML_JS_SHA256"
download "${MML_BASE}/mmlabc_to_smf_wasm_bg.wasm" "lib/mmlabc-to-smf-pkg/mmlabc_to_smf_wasm_bg.wasm"
verify_sha "lib/mmlabc-to-smf-pkg/mmlabc_to_smf_wasm_bg.wasm" "MML_WASM_SHA256"
download "${MML_BASE}/package.json" "lib/mmlabc-to-smf-pkg/package.json"
verify_sha "lib/mmlabc-to-smf-pkg/package.json" "MML_PKG_SHA256"

download "${SMF_BASE}/smf_to_ym2151log.js" "lib/smf-to-ym2151log-pkg/smf_to_ym2151log.js"
verify_sha "lib/smf-to-ym2151log-pkg/smf_to_ym2151log.js" "SMF_JS_SHA256"
download "${SMF_BASE}/smf_to_ym2151log_bg.wasm" "lib/smf-to-ym2151log-pkg/smf_to_ym2151log_bg.wasm"
verify_sha "lib/smf-to-ym2151log-pkg/smf_to_ym2151log_bg.wasm" "SMF_WASM_SHA256"
download "${SMF_BASE}/smf_to_ym2151log.d.ts" "lib/smf-to-ym2151log-pkg/smf_to_ym2151log.d.ts"
verify_sha "lib/smf-to-ym2151log-pkg/smf_to_ym2151log.d.ts" "SMF_DTS_SHA256"
download "${SMF_BASE}/package.json" "lib/smf-to-ym2151log-pkg/package.json"
verify_sha "lib/smf-to-ym2151log-pkg/package.json" "SMF_PKG_SHA256"

download "${TREE_SITTER_BASE}/demo/web-tree-sitter.js" "lib/mml-parser/web-tree-sitter.js"
verify_sha "lib/mml-parser/web-tree-sitter.js" "TREE_SITTER_JS_SHA256"
download "${TREE_SITTER_BASE}/demo/web-tree-sitter.wasm" "lib/mml-parser/web-tree-sitter.wasm"
verify_sha "lib/mml-parser/web-tree-sitter.wasm" "TREE_SITTER_WASM_SHA256"
download "${TREE_SITTER_BASE}/tree-sitter-mml/tree-sitter-mml.wasm" "lib/mml-parser/tree-sitter-mml.wasm"
verify_sha "lib/mml-parser/tree-sitter-mml.wasm" "MML_GRAMMAR_WASM_SHA256"

echo "✓ MML libraries setup complete!"
echo "  - mmlabc-to-smf: lib/mmlabc-to-smf-pkg/ (prebuilt download)"
echo "  - smf-to-ym2151log: lib/smf-to-ym2151log-pkg/ (prebuilt download)"
echo "  - tree-sitter parser: lib/mml-parser/ (web-tree-sitter + grammar)"
