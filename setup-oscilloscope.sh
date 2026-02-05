#!/bin/bash

# Setup script for cat-oscilloscope library
# Downloads and extracts the cat-oscilloscope library files needed for waveform visualization

set -e

echo "=========================================="
echo " cat-oscilloscope Library Setup"
echo "=========================================="

# Check if lib and wasm directories already exist
if [ -d "lib" ] && [ -d "wasm" ]; then
    echo "Library files already exist. Checking if update is needed..."
fi

# Clone cat-oscilloscope repository to temp directory
echo "Downloading cat-oscilloscope library..."
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"
git clone --depth 1 https://github.com/cat2151/cat-oscilloscope.git
cd cat-oscilloscope

# Go back to project directory
cd "$OLDPWD"

# Create lib directory and copy library file
echo "Setting up library files..."
mkdir -p lib
cp "$TEMP_DIR/cat-oscilloscope/dist/cat-oscilloscope.mjs" lib/

# Create wasm directory and copy WASM files
echo "Setting up WASM files..."
mkdir -p wasm
cp "$TEMP_DIR/cat-oscilloscope/public/wasm/"* wasm/

# Clean up
rm -rf "$TEMP_DIR"

echo ""
echo "=========================================="
echo " Setup Complete!"
echo "=========================================="
echo "Library files installed:"
echo "  - lib/cat-oscilloscope.mjs"
echo "  - wasm/signal_processor_wasm.js"
echo "  - wasm/signal_processor_wasm_bg.wasm"
echo ""
echo "You can now run the application with:"
echo "  python3 -m http.server 8000"
echo ""
