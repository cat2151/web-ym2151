/**
 * YM2151 Note Table
 * 
 * Contains the note mapping table for YM2151 chip.
 * Based on cat2151/smf-to-ym2151log-rust
 */

/**
 * YM2151 note table (C# to C)
 * Maps note within octave to YM2151 note code
 * 
 * Note codes skip values 3, 7, 11, and 15 within each octave
 */
export const NOTE_TABLE: readonly number[] = [
    0,  // C#
    1,  // D
    2,  // D#
    4,  // E
    5,  // F
    6,  // F#
    8,  // G
    9,  // G#
    10, // A
    12, // A#
    13, // B
    14, // C
] as const;

/**
 * Convert MIDI note to YM2151 KC (Key Code) and KF (Key Fraction)
 * 
 * @param midiNote - MIDI note number (0-127)
 * @returns Tuple of [KC, KF] where KC is the key code and KF is the key fraction
 * 
 * @example
 * ```typescript
 * const [kc, kf] = midiToKcKf(60); // Middle C (C4)
 * // kc = 0x2E (Octave 2, Note C)
 * // kf = 0
 * ```
 */
export function midiToKcKf(midiNote: number): [number, number] {
    // Adjust MIDI note by -1 to align octaves between MIDI and YM2151 numbering
    const adjustedMidi = midiNote > 0 ? midiNote - 1 : 0;
    const noteInOctave = adjustedMidi % 12;
    
    // Calculate YM2151 octave (0-7)
    const ymOctave = Math.max(0, Math.min(7, Math.floor(adjustedMidi / 12) - 2));
    
    // Get YM2151 note code from table
    const ymNote = NOTE_TABLE[noteInOctave];
    
    // Combine octave and note into KC
    const kc = (ymOctave << 4) | ymNote;
    
    // No fine tuning for now
    const kf = 0;
    
    return [kc, kf];
}

/**
 * Convert MIDI note to YM2151 KC (Key Code) as hex string
 * 
 * @param midiNote - MIDI note number (0-127)
 * @returns KC value as hex string (e.g., "0x3E")
 */
export function midiToKcHex(midiNote: number): string {
    const [kc] = midiToKcKf(midiNote);
    return `0x${kc.toString(16).toUpperCase().padStart(2, '0')}`;
}
