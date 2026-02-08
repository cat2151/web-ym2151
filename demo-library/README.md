# Demo Library - External Repository Usage Example

This directory contains a minimal implementation that demonstrates how to use `web-ym2151` as a library in an external repository.

## Purpose

This demo is stripped down to the minimum implementation that can verify:
- Library installation from GitHub
- WASM module loading
- Basic YM2151 sound generation
- Simple waveform rendering usage example

This serves as a reference for developers who want to use `web-ym2151` in their own projects to integrate YM2151 FM synthesis and waveform rendering capabilities.

## Installation Method: npm GitHub Installation

To use `web-ym2151` in your own project directly from GitHub:

### 1. Install from GitHub

```bash
npm install cat2151/web-ym2151
```

Or specify a specific branch, tag, or commit:

```bash
# Install from a specific branch
npm install cat2151/web-ym2151#main

# Install from a specific tag (check available tags with: git ls-remote --tags https://github.com/cat2151/web-ym2151)
npm install cat2151/web-ym2151#v1.0.0

# Install from a specific commit
npm install cat2151/web-ym2151#commit-hash
```

### 2. Obtain WASM files

The web-ym2151 library requires WASM files for the YM2151 emulator. When installing from GitHub, prebuilt files are already included.

**Option A: Use bundled WASM from the GitHub npm install (recommended)**

```bash
# Files are included in the package after install
cp node_modules/web-ym2151/sine_test.js .
cp node_modules/web-ym2151/sine_test.wasm .
```

**Option B: Use prebuilt WASM from GitHub Pages**

```bash
# Download WASM files from the deployed site
curl -O https://cat2151.github.io/web-ym2151/sine_test.js
curl -O https://cat2151.github.io/web-ym2151/sine_test.wasm
```

**Option C: Build WASM yourself (requires Emscripten)**

```bash
# After npm install, navigate to the installed package
cd node_modules/web-ym2151

# Install dependencies
npm install

# Build WASM (requires Emscripten SDK to be installed)
./build.sh --build-only

# Copy generated files to your project root
cp sine_test.js ../../
cp sine_test.wasm ../../
```

To install Emscripten SDK, see: https://emscripten.org/docs/getting_started/downloads.html

### 3. Use in your project

See `index.html` in this directory for a complete working example.

## Files in this Directory

- `index.html` - Minimal working example using the library
- `README.md` - This file (installation and usage instructions)

## Local Development

To test this demo locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/cat2151/web-ym2151.git
   cd web-ym2151
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the library:
   ```bash
   # Build TypeScript
   npm run build
   
   # Build WASM
   ./build.sh --build-only
   ```

4. Serve the project with a local web server:
   ```bash
   # Example using Python
   python3 -m http.server 8000
   
   # Or using Node.js http-server
   npx http-server
   ```

5. Open the demo in your browser:
   ```
   http://localhost:8000/demo-library/index.html
   ```

## Deployment

This demo is deployed to GitHub Pages at:
https://cat2151.github.io/web-ym2151/demo-library/

## Difference from Main Demo

The main demo (`index.html` in the root) contains full-featured UI with:
- Complete tone editor
- Multiple preset examples
- Storage functionality
- Random tone generator
- WAV export
- Oscilloscope visualization

This `demo-library/` directory contains:
- Minimal single-file example
- Focus on library installation and basic YM2151 usage
- Suitable as a starting point for external projects
- Clear, simple code without extra features
- Direct WASM module usage example

## Key APIs

The main APIs exposed by web-ym2151:

### WASM Module Functions

- `Module._generate_sound(dataPtr, eventsCount, numFrames)` - Generate audio from YM2151 events
- `Module._get_sample(index)` - Get audio sample at specific index
- `Module._free_buffer()` - Free audio buffer memory

### YM2151 Event Structure

Events are JSON objects with the following structure:

```javascript
{
  "time": 0.0,     // Time in seconds
  "addr": "0x08",  // YM2151 register address (hex string in JSON format)
  "data": "0x78"   // Register data value (hex string in JSON format)
}
```

**Note:** The demo-library example uses numeric values internally for simplicity, but the main application's JSON format uses hex strings for `addr` and `data` fields. When working with the main demo or presets.json, use the hex string format shown above.

## Next Steps

After successfully running this minimal example:

1. Explore the main demo in the root directory for more advanced features
2. Read the main README.md for comprehensive documentation
3. Check DEMOS.md for preset examples
4. Visit the live demo at https://cat2151.github.io/web-ym2151/
