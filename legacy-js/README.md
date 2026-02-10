# Legacy JavaScript

This directory contains the original pre-TypeScript JavaScript implementation kept only for reference and historical context.

The application now loads compiled modules from `dist/` (built from `src/`), and nothing in `legacy-js/` is loaded by `index.html`.

Following common TypeScript migration guidance, legacy code is isolated under a clearly named folder to avoid accidental use and to signal it is not part of the active codebase.
