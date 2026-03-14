/**
 * Tests for UI utility functions
 */

import { describe, it, expect } from 'vitest';
import { toHex, calculateDuration } from './ui';

describe('toHex', () => {
    it('converts 0 to "0x00"', () => {
        expect(toHex(0)).toBe('0x00');
    });

    it('converts 255 to "0xFF"', () => {
        expect(toHex(255)).toBe('0xFF');
    });

    it('converts 16 to "0x10"', () => {
        expect(toHex(16)).toBe('0x10');
    });

    it('produces uppercase hex digits', () => {
        expect(toHex(0xAB)).toBe('0xAB');
        expect(toHex(0xcd)).toBe('0xCD');
    });

    it('always pads to at least 2 hex digits', () => {
        const result = toHex(1);
        expect(result).toBe('0x01');
    });

    it('converts typical YM2151 register values', () => {
        expect(toHex(0x20)).toBe('0x20');
        expect(toHex(0x28)).toBe('0x28');
        expect(toHex(0x40)).toBe('0x40');
        expect(toHex(0x78)).toBe('0x78');
        expect(toHex(0xC0)).toBe('0xC0');
    });
});

describe('calculateDuration', () => {
    it('returns 1.0 for empty events array', () => {
        expect(calculateDuration([])).toBe(1.0);
    });

    it('returns maxTime + 1.0', () => {
        const events = [
            { time: 0.5 },
            { time: 2.0 },
            { time: 1.0 },
        ];
        expect(calculateDuration(events)).toBe(3.0);
    });

    it('handles a single event at time 0', () => {
        expect(calculateDuration([{ time: 0 }])).toBe(1.0);
    });

    it('handles string time values', () => {
        const events = [{ time: '3.5' as any }];
        expect(calculateDuration(events)).toBe(4.5);
    });

    it('ignores NaN time values', () => {
        const events = [
            { time: 1.0 },
            { time: NaN },
        ];
        expect(calculateDuration(events)).toBe(2.0);
    });
});
