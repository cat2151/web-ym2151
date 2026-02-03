/**
 * MIDI Note Converter
 * Converts MIDI note numbers to YM2151 chromatic note values
 * 
 * The YM2151 note system used in this project:
 * - Simple chromatic scale: each semitone increments by 1
 * - C4 = 0x41 (65), A4 = 0x4A (74), etc.
 * - This maps directly to register 0x28 (KC - Key Code)
 */

/**
 * Convert MIDI note number (0-127) to YM2151 chromatic note value
 * 
 * MIDI note format:
 * - 0 = C-1, 12 = C0, 24 = C1, ..., 60 = C4 (Middle C), 69 = A4 (440Hz)
 * 
 * YM2151 chromatic note format (used in this project):
 * - Simple chromatic scale where each semitone = +1
 * - C4 (MIDI 60) = 0x41 (65 decimal)
 * - A4 (MIDI 69) = 0x4A (74 decimal)
 * - Formula: YM2151_note = MIDI_note + 5
 * 
 * @param midiNote - MIDI note number (0-127)
 * @returns YM2151 chromatic note value (0x05-0x7F)
 */
export function midiNoteToYM2151(midiNote: number): number {
    // Clamp to valid MIDI range
    if (midiNote < 0) midiNote = 0;
    if (midiNote > 127) midiNote = 127;
    
    // Convert to YM2151 chromatic scale
    // C4 (MIDI 60) maps to 0x41 (65)
    // So: YM2151 = MIDI + 5
    const ym2151Note = midiNote + 5;
    
    // Clamp to valid YM2151 range
    return Math.min(Math.max(ym2151Note, 0x05), 0x7F);
}

/**
 * Convert YM2151 chromatic note value back to MIDI note number
 * 
 * @param ym2151Note - YM2151 chromatic note value (0x05-0x7F)
 * @returns MIDI note number (0-127)
 */
export function ym2151ToMidiNote(ym2151Note: number): number {
    // Reverse the conversion: MIDI = YM2151 - 5
    const midiNote = ym2151Note - 5;
    
    // Clamp to valid MIDI range
    return Math.min(Math.max(midiNote, 0), 127);
}

/**
 * Get MIDI note name from note number
 * 
 * @param midiNote - MIDI note number (0-127)
 * @returns Note name (e.g., "C4", "A4", "C#5")
 */
export function getMidiNoteName(midiNote: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const noteInOctave = midiNote % 12;
    return `${noteNames[noteInOctave]}${octave}`;
}

/**
 * Get YM2151 chromatic note name from note value
 * 
 * @param ym2151Note - YM2151 chromatic note value
 * @returns Note name (e.g., "C4", "A4")
 */
export function getYM2151NoteName(ym2151Note: number): string {
    const midiNote = ym2151ToMidiNote(ym2151Note);
    return getMidiNoteName(midiNote);
}

/**
 * Common MIDI note constants for reference
 */
export const MIDI_NOTES = {
    C4: 60,  // Middle C
    A4: 69,  // Concert pitch A (440Hz)
    C0: 12,
    C1: 24,
    C2: 36,
    C3: 48,
    C5: 72,
    C6: 84,
    C7: 96,
    C8: 108
};

/**
 * Common YM2151 chromatic note constants
 * These correspond to the MIDI notes + 5
 */
export const YM2151_NOTES = {
    C4: 0x41,  // 65 decimal
    D4: 0x43,  // 67 decimal
    E4: 0x45,  // 69 decimal
    F4: 0x46,  // 70 decimal
    G4: 0x48,  // 72 decimal
    A4: 0x4A,  // 74 decimal (440Hz)
    B4: 0x4C,  // 76 decimal
    C5: 0x4D   // 77 decimal
};
