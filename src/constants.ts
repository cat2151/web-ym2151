/**
 * Global constants for YM2151 emulator
 */

// OPM (YM2151) Constants
export const OPM_CLOCK = 3579545;
export const CLOCK_STEP = 64;
export const OPM_SAMPLE_RATE = OPM_CLOCK / CLOCK_STEP; // Approximately 55930Hz

// UI element IDs
export const RANDOM_TONE_STATUS_ID = 'randomToneStatus';

// Also declare as global for backward compatibility with existing code
declare global {
    const OPM_SAMPLE_RATE: number;
}
