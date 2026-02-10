# TypeScript Architecture Documentation

## Overview

This project has been refactored from JavaScript to TypeScript with a modular architecture following the Single Responsibility Principle (SRP). The original monolithic JavaScript files have been split into focused, maintainable modules.

## Directory Structure

```
src/
├── types.ts                    # TypeScript type definitions
├── constants.ts                # Global constants (OPM_SAMPLE_RATE, etc.)
├── ui.ts                       # UI utility functions
├── presets.ts                  # Preset loading and management
├── app.ts                      # Application initialization
├── index.ts                    # Main entry point and global exports
├── global.d.ts                 # Global type declarations for Emscripten
├── storage/                    # Storage module (was 783-line storage.js)
│   ├── constants.ts           # Storage-specific constants
│   ├── errorHandler.ts        # Error handling utilities
│   ├── localStorageService.ts # Auto-save/load functionality
│   ├── slotManager.ts         # Save slot operations
│   ├── previewManager.ts      # Preview and restore functionality
│   ├── uiManager.ts           # Storage UI updates
│   ├── editorUtils.ts         # Editor content loading utilities
│   └── index.ts               # Module exports
├── tone-editor/                # Tone editor module
│   ├── parser.ts              # Parameter line parsing
│   ├── eventGenerator.ts      # YM2151 event generation
│   ├── jsonParser.ts          # JSON to tone editor conversion
│   └── index.ts               # Module exports
└── audio/                      # Audio module
    ├── audioGenerator.ts      # Audio buffer generation from events
    ├── wavEncoder.ts          # WAV file encoding
    ├── audioPlayer.ts         # Web Audio API playback
    ├── wavExporter.ts         # WAV file export
    └── index.ts               # Module exports
```

## Module Responsibilities

### Storage Module
The storage module (formerly one 783-line file) is now split into focused components:

- **localStorageService.ts**: Handles auto-save and auto-load of editor content
- **slotManager.ts**: Manages 8 save slots with save/load/export/import operations
- **previewManager.ts**: Handles slot preview with auto-restore functionality
- **uiManager.ts**: Updates UI to reflect storage state
- **errorHandler.ts**: Centralized error handling for storage operations
- **editorUtils.ts**: Shared utilities for loading editor content

### Tone Editor Module
Converts between tone parameter text format and YM2151 register events:

- **parser.ts**: Parses parameter lines (e.g., "TL=00 AR=1F...")
- **eventGenerator.ts**: Generates YM2151 register write events
- **jsonParser.ts**: Reverse operation - converts JSON events to tone text

### Audio Module
Handles audio generation, playback, and export:

- **audioGenerator.ts**: Generates audio buffers from YM2151 events via WASM
- **audioPlayer.ts**: Plays audio using Web Audio API
- **wavEncoder.ts**: Encodes audio buffers to WAV format
- **wavExporter.ts**: Exports audio as downloadable WAV files

## Building

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Clean dist directory
npm run clean

# Watch for changes (development)
npm run watch
```

The build process:
1. Compiles TypeScript to ES2015 modules in the `dist/` directory
2. Automatically fixes import paths to include `.js` extensions (required for ES modules in browsers)
3. Handles directory imports (e.g., `./storage` becomes `./storage/index.js`)

## Type Safety

All modules now have full TypeScript type annotations:
- **Interface definitions** in `types.ts` for data structures
- **Global type declarations** in `global.d.ts` for Emscripten
- **Strict type checking** enabled in `tsconfig.json`
- **Type exports** from each module for consumer use

## Migration from JavaScript

The original monolithic JavaScript files have been fully replaced by the TypeScript build. They are no longer included in the repository; the HTML now loads `dist/index.js` as an ES module. The `Before` snippet below reflects the historical `js/` paths used prior to migration.

### Before
```html
<script src="js/constants.js"></script>
<script src="js/ui.js"></script>
<script src="js/tone-editor.js"></script>
<script src="js/audio.js"></script>
<script src="js/presets.js"></script>
<script src="js/storage.js"></script>
<script src="js/emscripten-wrapper.js"></script>
```

### After
```html
<script type="module" src="dist/index.js"></script>
```

## Benefits

1. **Type Safety**: TypeScript catches errors at compile time
2. **Modularity**: Each file has a single, clear responsibility
3. **Maintainability**: Smaller, focused files are easier to understand and modify
4. **Testability**: Modular code is easier to unit test
5. **Documentation**: TypeScript interfaces serve as living documentation
6. **IDE Support**: Better autocomplete and refactoring support

## Adding New Features

When adding new features:

1. Add type definitions to `src/types.ts` if needed
2. Create new modules following the SRP pattern
3. Export public APIs through module `index.ts` files
4. Update main `src/index.ts` to expose functions needed by HTML
5. Run `npm run build` to compile
6. Test in browser

## Known Limitations

- The `dist/` directory must be built before running the application
- ES modules require a web server (cannot use `file://` protocol)
- Import paths must include `.js` extensions (handled automatically by build script)
