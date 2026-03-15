import { describe, it, expect } from 'vitest';
import { kcToMidi } from './index';

describe('kcToMidi', () => {
    it('converts KC 0x3A (A4/440Hz) to MIDI note 69', () => {
        expect(kcToMidi(0x3A)).toBe(69);
    });

    it('converts KC 0x4A to MIDI note 81', () => {
        expect(kcToMidi(0x4A)).toBe(81);
    });

    it('converts KC 0x2E (C4) to MIDI note 60', () => {
        expect(kcToMidi(0x2E)).toBe(60);
    });

    it('returns 69 (A4 fallback) for an unrecognised note code', () => {
        // Note code 3 is not in NOTE_TABLE (skipped by YM2151 hardware)
        expect(kcToMidi(0x03)).toBe(69);
    });
});
