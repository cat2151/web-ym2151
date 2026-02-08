#!/bin/bash
set -euo pipefail

echo "Setting up MML to YM2151 conversion libraries (prebuilt, no Rust toolchain)..."

mkdir -p lib/mmlabc-to-smf-pkg lib/smf-to-ym2151log-pkg

download() {
    local url="$1"
    local dest="$2"
    echo "Downloading $(basename "$dest") from $(dirname "$url")"
    curl -fL "$url" -o "$dest"
}

MML_BASE="https://cat2151.github.io/mmlabc-to-smf-rust/mmlabc-to-smf-wasm/pkg"
download "${MML_BASE}/mmlabc_to_smf_wasm.js" "lib/mmlabc-to-smf-pkg/mmlabc_to_smf_wasm.js"
download "${MML_BASE}/mmlabc_to_smf_wasm_bg.wasm" "lib/mmlabc-to-smf-pkg/mmlabc_to_smf_wasm_bg.wasm"
download "${MML_BASE}/package.json" "lib/mmlabc-to-smf-pkg/package.json"

SMF_BASE="https://cat2151.github.io/smf-to-ym2151log-rust/pkg"
download "${SMF_BASE}/smf_to_ym2151log.js" "lib/smf-to-ym2151log-pkg/smf_to_ym2151log.js"
download "${SMF_BASE}/smf_to_ym2151log_bg.wasm" "lib/smf-to-ym2151log-pkg/smf_to_ym2151log_bg.wasm"
download "${SMF_BASE}/smf_to_ym2151log.d.ts" "lib/smf-to-ym2151log-pkg/smf_to_ym2151log.d.ts"
download "${SMF_BASE}/package.json" "lib/smf-to-ym2151log-pkg/package.json"

echo "✓ MML libraries setup complete!"
echo "  - mmlabc-to-smf: lib/mmlabc-to-smf-pkg/ (prebuilt download)"
echo "  - smf-to-ym2151log: lib/smf-to-ym2151log-pkg/ (prebuilt download)"
