/**
 * Tests for registers format conversion utilities
 */

import { describe, it, expect } from 'vitest';
import { eventsToRegistersString, registersStringToEvents, eventsToToneJsonString } from './registersFormat';
import { YM2151Event } from '../types';

/** Minimal set of events representing a simple tone (Key On for channel 0) */
const sampleEvents: YM2151Event[] = [
    { time: 0.0, addr: '0x20', data: '0xC7' },
    { time: 0.0, addr: '0x28', data: '0x4A' },
    { time: 0.0, addr: '0x08', data: '0x78' },
];

describe('eventsToRegistersString', () => {
    it('returns a non-empty string for valid events', () => {
        const result = eventsToRegistersString(sampleEvents);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('encodes each event as 4 uppercase hex characters', () => {
        const result = eventsToRegistersString(sampleEvents);
        // Each event → 2 chars addr + 2 chars data
        expect(result.length).toBe(sampleEvents.length * 4);
        expect(result).toMatch(/^[0-9A-F]+$/);
    });

    it('encodes addr=0x20, data=0xC7 as "20C7"', () => {
        const events: YM2151Event[] = [{ time: 0.0, addr: '0x20', data: '0xC7' }];
        expect(eventsToRegistersString(events)).toBe('20C7');
    });

    it('encodes addr=0x28, data=0x4A as "284A"', () => {
        const events: YM2151Event[] = [{ time: 0.0, addr: '0x28', data: '0x4A' }];
        expect(eventsToRegistersString(events)).toBe('284A');
    });

    it('returns empty string for empty events array', () => {
        expect(eventsToRegistersString([])).toBe('');
    });

    it('throws for invalid (out-of-range) addr or data', () => {
        const bad: YM2151Event[] = [{ time: 0.0, addr: '0x200', data: '0x00' }];
        expect(() => eventsToRegistersString(bad)).toThrow();
    });
});

describe('registersStringToEvents', () => {
    it('parses a registers string back to events', () => {
        const registersStr = eventsToRegistersString(sampleEvents);
        const events = registersStringToEvents(registersStr);
        expect(events.length).toBe(sampleEvents.length);
    });

    it('restores addr and data values correctly', () => {
        const events = registersStringToEvents('20C7');
        expect(events.length).toBe(1);
        expect(parseInt(events[0].addr, 16)).toBe(0x20);
        expect(parseInt(events[0].data, 16)).toBe(0xC7);
    });

    it('round-trips through eventsToRegistersString', () => {
        const str = eventsToRegistersString(sampleEvents);
        const events = registersStringToEvents(str);
        const str2 = eventsToRegistersString(events);
        expect(str2).toBe(str);
    });

    it('ignores whitespace in the input string', () => {
        const events = registersStringToEvents('20 C7 28 4A');
        expect(events.length).toBe(2);
    });

    it('returns empty array for empty string', () => {
        expect(registersStringToEvents('')).toEqual([]);
    });

    it('sets time to 0.0 for all events', () => {
        const events = registersStringToEvents('20C7284A');
        for (const evt of events) {
            expect(evt.time).toBe(0.0);
        }
    });
});

describe('eventsToToneJsonString', () => {
    it('returns a valid JSON string', () => {
        const result = eventsToToneJsonString(sampleEvents);
        expect(() => JSON.parse(result)).not.toThrow();
    });

    it('includes type field equal to "YM2151 tone"', () => {
        const obj = JSON.parse(eventsToToneJsonString(sampleEvents));
        expect(obj.type).toBe('YM2151 tone');
    });

    it('includes a non-empty registers string', () => {
        const obj = JSON.parse(eventsToToneJsonString(sampleEvents));
        expect(typeof obj.registers).toBe('string');
        expect(obj.registers.length).toBeGreaterThan(0);
    });

    it('includes note_number extracted from 0x28 event', () => {
        const obj = JSON.parse(eventsToToneJsonString(sampleEvents));
        expect(obj.note_number).toBe(0x4A);
    });

    it('defaults note_number to 0x4A when no 0x28 event is present', () => {
        const eventsWithoutNote: YM2151Event[] = [
            { time: 0.0, addr: '0x20', data: '0xC7' },
        ];
        const obj = JSON.parse(eventsToToneJsonString(eventsWithoutNote));
        expect(obj.note_number).toBe(0x4A);
    });
});
