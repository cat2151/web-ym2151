# MML Input Feature

This feature allows users to play musical notes using MML (Music Macro Language) notation in the web-ym2151 demo.

## Overview

The MML input feature provides a way to specify musical sequences using text notation, which is then converted to YM2151 register events and played back using the current tone/voice settings.

## Workflow

```
MML Input → SMF (MIDI) → YM2151 JSON → Audio Playback
```

1. User enters MML notation (e.g., "cdefgab" for a scale)
2. MML is converted to Standard MIDI File (SMF) format using `mmlabc-to-smf-rust`
3. SMF is converted to YM2151 register write events using `smf-to-ym2151log-rust`
4. YM2151 events are rendered to audio using the existing audio pipeline

## Usage

1. Load a tone using "Random Tone" button or select a preset tone
2. Enter MML notation in the "MML Input" textarea
   - Example: `cdefgab` for a C major scale
   - Example: `c;e;g` for a C major chord (simultaneous notes)
3. Click the "🎵 Play MML" button
4. The MML will be converted and played automatically

## MML Notation Examples

### Basic Scale
```
cdefgab
```

### Chords (Polyphony)
```
c;e;g
```
Separate notes with `;` to play them simultaneously.

### Multi-Channel
The conversion supports multiple MIDI channels with automatic voice allocation.

## Technical Details

### WASM Libraries

Two Rust libraries compiled to WebAssembly are used:

1. **mmlabc-to-smf-rust** - Converts MML to Standard MIDI File format
   - Repository: https://github.com/cat2151/mmlabc-to-smf-rust
   - Version: Always uses latest from main branch

2. **smf-to-ym2151log-rust** - Converts SMF to YM2151 register log JSON
   - Repository: https://github.com/cat2151/smf-to-ym2151log-rust
   - Version: Always uses latest from main branch

**Note**: These libraries are NOT pinned to specific versions. We always use the latest code from the main branch to ensure critical bug fixes are applied immediately. See `.github/AGENT_INSTRUCTIONS.md` for the rationale.

### Setup

The WASM libraries are set up during the build process:

```bash
./setup-mml.sh
```

This script:
1. Clones the required Rust repositories
2. Builds WASM packages using `wasm-pack`
3. Places the packages in `lib/` directory

### Module Structure

- `src/mml/index.ts` - Core MML conversion logic
- `src/mml/playback.ts` - Integration with audio playback system
- `setup-mml.sh` - WASM setup script

### CI/CD Integration

The GitHub Actions workflow automatically:
1. Sets up Rust toolchain and wasm-pack
2. Runs `setup-mml.sh` to build WASM libraries
3. Builds TypeScript modules
4. Deploys to GitHub Pages

## Limitations

- MML parsing depends on the features implemented in `mmlabc-to-smf-rust`
- Currently supports basic note notation and polyphony
- More advanced MML features (octave control, note length, tempo, etc.) depend on upstream library support

## Future Enhancements

- Support for more MML commands as they become available in the upstream libraries
- MML syntax help/documentation in the UI
- Example MML patterns
- MML file import/export

## References

- [Issue #83 notes](https://github.com/cat2151/smf-to-ym2151log-rust/blob/main/issue-notes/83.md)
- [mmlabc-to-smf-rust](https://github.com/cat2151/mmlabc-to-smf-rust)
- [smf-to-ym2151log-rust](https://github.com/cat2151/smf-to-ym2151log-rust)
