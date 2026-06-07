import { describe, expect, it } from 'vitest';
import {
    buildAttachedMML,
    eventsToProgramToneAttachmentJson,
    isNoteEvent,
    toneEventsForAttachment,
} from './attachment';
import { YM2151Event } from '../types';

const events: YM2151Event[] = [
    { time: 0, addr: '0x20', data: '0xC7' },
    { time: 0, addr: '0x40', data: '0x31' },
    { time: 0, addr: '0x28', data: '0x4A' },
    { time: 0, addr: '0x30', data: '0x00' },
    { time: 0, addr: '0x08', data: '0x78' },
];

describe('attachment helpers', () => {
    it('classifies note/key events separately from tone registers', () => {
        expect(isNoteEvent(events[0])).toBe(false);
        expect(isNoteEvent(events[2])).toBe(true);
        expect(isNoteEvent(events[3])).toBe(true);
        expect(isNoteEvent(events[4])).toBe(true);
    });

    it('keeps only tone registers for attachment tone data', () => {
        expect(toneEventsForAttachment(events)).toEqual([
            { time: 0, addr: '0x20', data: '0xC7' },
            { time: 0, addr: '0x40', data: '0x31' },
        ]);
    });

    it('serializes ProgramChange 0 tone attachment JSON', () => {
        const parsed = JSON.parse(eventsToProgramToneAttachmentJson(toneEventsForAttachment(events)));
        expect(parsed[0].ProgramChange).toBe(0);
        expect(parsed[0].Tone.type).toBe('YM2151 tone');
        expect(parsed[0].Tone.events).toHaveLength(2);
    });

    it('builds attachment-prefixed MML without changing the MML body', () => {
        const result = buildAttachedMML('c;e', toneEventsForAttachment(events));
        expect(result).toContain('\nc;e');
        expect(JSON.parse(result.split('\n')[0])[0].ProgramChange).toBe(0);
    });
});

