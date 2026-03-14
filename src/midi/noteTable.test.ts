/**
 * Tests for MIDI to YM2151 conversion
 */

import { describe, it, expect } from 'vitest';
import { midiToKcKf, midiToKcHex, NOTE_TABLE } from './noteTable';

describe('NOTE_TABLE', () => {
    it('has 12 entries (one per semitone)', () => {
        expect(NOTE_TABLE.length).toBe(12);
    });

    it('matches the expected YM2151 note codes', () => {
        expect([...NOTE_TABLE]).toEqual([0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14]);
    });

    it('does not contain skipped codes 3, 7, 11, 15', () => {
        for (const code of [3, 7, 11, 15]) {
            expect(NOTE_TABLE).not.toContain(code);
        }
    });
});

describe('midiToKcKf', () => {
    it('converts MIDI note 60 (Middle C / C4) correctly', () => {
        const [kc, kf] = midiToKcKf(60);
        expect(kc).toBe(0x2E);
        expect(kf).toBe(0);
    });

    it('converts MIDI note 69 (A4 / 440Hz) correctly', () => {
        const [kc, kf] = midiToKcKf(69);
        expect(kc).toBe(0x3A);
        expect(kf).toBe(0);
    });

    it('converts MIDI note 61 (C#4) correctly', () => {
        const [kc, kf] = midiToKcKf(61);
        expect(kc).toBe(0x30);
        expect(kf).toBe(0);
    });

    it('always returns kf = 0', () => {
        for (const midi of [0, 36, 60, 69, 72, 96, 127]) {
            const [, kf] = midiToKcKf(midi);
            expect(kf).toBe(0);
        }
    });
});

describe('midiToKcHex', () => {
    it('returns uppercase hex string with 0x prefix', () => {
        const result = midiToKcHex(60);
        expect(result).toMatch(/^0x[0-9A-F]{2}$/);
    });

    it('converts C Major Scale (MIDI notes 60-72) to expected YM2151 KC values', () => {
        const cMajorScale: Array<[number, string]> = [
            [60, '0x2E'], // C4
            [62, '0x31'], // D4
            [64, '0x34'], // E4
            [65, '0x35'], // F4
            [67, '0x38'], // G4
            [69, '0x3A'], // A4
            [71, '0x3D'], // B4
            [72, '0x3E'], // C5
        ];
        for (const [midi, expected] of cMajorScale) {
            expect(midiToKcHex(midi)).toBe(expected);
        }
    });
});
