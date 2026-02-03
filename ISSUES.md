# Unimplemented Features from README

This document lists unimplemented features mentioned in README.md that should be tracked and implemented.

## Status Summary

- ✅ **Implemented**: Feature is complete
- 🚧 **Partially Implemented**: Feature exists but incomplete
- ❌ **Not Implemented**: Feature not yet started

---

## 1. Enhanced Tone Editor Preview Functionality ❌

**Status**: Not Implemented  
**README Reference**: Lines 86-95

### Description
Add preview functionality to the tone editor with:
- Preview button or textarea right-side controls
- Note number selection (1-8 notes for mono to 8-poly playback)
- Generate test notes automatically (append to JSON events)

### Requirements
1. **Mono Preview** (Priority: High)
   - Single note playback for testing tone
   - Note number: 0x00-0x7F (MIDI-compatible)
   - Simple UI: single note number input

2. **Polyphonic Preview** (Priority: Low, future)
   - 2-8 simultaneous notes
   - Multiple note number inputs
   - Channel allocation

### Implementation Notes
- MIDI note number to YM2151 register conversion needed
- Reference existing Rust implementation tables (mentioned in README)
- Octave: upper bits of note value
- Should auto-generate key-on/key-off events

---

## 2. Grid-based Tone Parameter Editor ❌

**Status**: Not Implemented  
**README Reference**: Lines 78-85

### Description
Alternative to current line-based editor:
- Grid layout: 4 rows (operators) × 11 columns (parameters)
- Order: O1, O3, O2, O4 (as-is from YM2151)
- Plus one row for global params (CON, FL, slot mask)

### Requirements
1. **Grid UI**
   - 4×11 input fields for operator params
   - 1 row for global params (CON, FL, etc.)
   - Real-time conversion to register values

2. **Slot Mask**
   - Order: O1, O2, O3, O4
   - Checkbox or bitfield input

### Implementation Notes
- May be easier than current textarea approach for beginners
- Could coexist with current line-based editor
- Consider as textarea alternative (README suggests textarea might be easier to implement)

---

## 3. MIDI Note Number Conversion ❌

**Status**: Not Implemented  
**README Reference**: Lines 91-94

### Description
Simplified MIDI note number to YM2151 register conversion.

### Requirements
1. **Conversion Function**
   - Input: MIDI note number (0-127)
   - Output: YM2151 note register value
   - Reference table from Rust version

2. **Octave Handling**
   - Upper bits = octave
   - Lower bits = note within octave

### Implementation Notes
- Needed for preview feature (#1)
- JavaScript implementation (reference Rust source for table)
- Should be in tone-editor module

---

## 4. Library Extraction for External Use ❌

**Status**: Not Implemented  
**README Reference**: Lines 99-105

### Description
Extract core functionality as a library usable by other projects (e.g., wavlpf).

### Requirements
1. **Tone Library**
   - Simple verification/testing library
   - One-shot waveform generation
   
2. **API Design**
   - Input: Tone JSON
   - Output: WAV file (buffer or file)
   - Standalone, no UI dependencies

3. **Use Cases**
   - Batch tone generation
   - Automated testing
   - Integration with other projects

### Implementation Notes
- Requires refactoring to separate UI and core logic
- Current TypeScript architecture (src/audio, src/tone-editor) is good foundation
- May need separate entry point for library mode

---

## Already Implemented Features ✅

These were mentioned in README but are now implemented:

### 1. WAV File Export ✅
**Status**: Implemented  
**Files**: `src/audio/wavExporter.ts`, `src/audio/wavEncoder.ts`  
**UI**: "Export WAV" button in index.html  

### 2. Local Storage Save/Load ✅
**Status**: Implemented  
**Files**: `src/storage/localStorageService.ts`, `src/storage/slotManager.ts`  
**Features**:
- Auto-save current content
- 8 save slots
- Slot preview with auto-restore
- Export/import all slots

### 3. Simple Tone Editor ✅
**Status**: Implemented  
**Files**: `src/tone-editor/parser.ts`, `src/tone-editor/eventGenerator.ts`  
**Features**:
- Text-based parameter input
- Real-time conversion to JSON events
- Support for 4 operators + global params

### 4. TypeScript Migration ✅
**Status**: Completed  
**Documentation**: TYPESCRIPT.md  
**Architecture**: Modular structure with SRP

---

## Implementation Priority

### High Priority
1. MIDI Note Number Conversion (#3) - Foundation for preview
2. Enhanced Tone Editor Preview (#1) - Improves user experience

### Medium Priority  
3. Grid-based Parameter Editor (#2) - Alternative UI approach

### Low Priority
4. Library Extraction (#4) - For advanced use cases

---

## Notes

- Focus on "体験の検証ができるよう実装" (implementation for experience verification)
- Keep minimal implementation philosophy
- Existing high-end editors are out of scope (割り切る/割り切り)
- Grid UI may or may not be easier than textarea (要検証)
