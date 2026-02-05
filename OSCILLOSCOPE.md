# Waveform Visualizer (Oscilloscope)

This demo includes a waveform visualizer feature using the [cat-oscilloscope](https://github.com/cat2151/cat-oscilloscope) library.

## Features

- Waveform visualization of generated audio from YM2151 output
- Sine wave display with automatic gain adjustment
- Collapsible UI section to save screen space
- Uses BufferSource mode for accurate waveform rendering

## Setup

### Automatic Setup (Recommended)

Run the setup script to download and install the required library files:

```bash
./setup-oscilloscope.sh
```

This will:
1. Download the cat-oscilloscope library from GitHub
2. Extract the necessary files to `lib/` and `wasm/` directories
3. Clean up temporary files

### Manual Setup

If the automatic setup doesn't work, you can manually set up the files:

1. Clone the cat-oscilloscope repository:
   ```bash
   git clone https://github.com/cat2151/cat-oscilloscope.git /tmp/cat-oscilloscope
   ```

2. Copy the library file:
   ```bash
   mkdir -p lib
   cp /tmp/cat-oscilloscope/dist/cat-oscilloscope.mjs lib/
   ```

3. Copy the WASM files:
   ```bash
   mkdir -p wasm
   cp /tmp/cat-oscilloscope/public/wasm/* wasm/
   ```

## Usage

1. Start the web server:
   ```bash
   python3 -m http.server 8000
   ```

2. Open http://localhost:8000 in your browser

3. Click the "Show Waveform Visualizer" button to reveal the oscilloscope canvas

4. Click "Play" to play audio and see the waveform visualization

## Technical Details

- **Library**: cat-oscilloscope v0.0.1+ (MIT License)
- **Visualization Mode**: BufferSource (non-audio-playback mode)
- **Frequency Estimation**: Autocorrelation method
- **Auto Gain**: Enabled by default
- **Debug Overlays**: Disabled for cleaner display

The oscilloscope integrates with the existing audio player to visualize the generated YM2151 audio data in real-time.

## Notes

- The `lib/` and `wasm/` directories are git-ignored and need to be set up locally
- The library files are required for the waveform visualizer to work
- Without the library files, the demo will still work but the waveform visualizer feature will not be available

## Credits

- cat-oscilloscope library by [@cat2151](https://github.com/cat2151)
- License: MIT
