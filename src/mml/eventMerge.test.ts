import { describe, expect, it } from 'vitest';
import { mergeToneInitializationWithMMLNoteEvents } from './eventMerge';
import { YM2151Event } from '../types';

describe('mergeToneInitializationWithMMLNoteEvents', () => {
    it('duplicates tone initialization for each channel used by a chord', () => {
        const toneEvents: YM2151Event[] = [
            { time: 0, addr: '0x20', data: '0xC7' },
            { time: 0, addr: '0x40', data: '0x31' },
            { time: 0, addr: '0x48', data: '0x31' }
        ];
        const noteEvents: YM2151Event[] = [
            { time: 0, addr: '0x28', data: '0x2E' },
            { time: 0, addr: '0x30', data: '0x00' },
            { time: 0, addr: '0x08', data: '0x78' },
            { time: 0, addr: '0x29', data: '0x34' },
            { time: 0, addr: '0x31', data: '0x00' },
            { time: 0, addr: '0x08', data: '0x79' },
            { time: 0, addr: '0x2A', data: '0x38' },
            { time: 0, addr: '0x32', data: '0x00' },
            { time: 0, addr: '0x08', data: '0x7A' }
        ];

        const merged = mergeToneInitializationWithMMLNoteEvents(toneEvents, noteEvents);

        expect(merged.slice(0, 9)).toEqual([
            { time: 0, addr: '0x20', data: '0xC7' },
            { time: 0, addr: '0x40', data: '0x31' },
            { time: 0, addr: '0x48', data: '0x31' },
            { time: 0, addr: '0x21', data: '0xC7' },
            { time: 0, addr: '0x41', data: '0x31' },
            { time: 0, addr: '0x49', data: '0x31' },
            { time: 0, addr: '0x22', data: '0xC7' },
            { time: 0, addr: '0x42', data: '0x31' },
            { time: 0, addr: '0x4A', data: '0x31' }
        ]);
        expect(merged.slice(-noteEvents.length)).toEqual(noteEvents);
    });

    it('keeps single-note playback on channel 0 only', () => {
        const toneEvents: YM2151Event[] = [
            { time: 0, addr: '0x20', data: '0xC7' },
            { time: 0, addr: '0x40', data: '0x31' }
        ];
        const noteEvents: YM2151Event[] = [
            { time: 0, addr: '0x28', data: '0x2E' },
            { time: 0, addr: '0x30', data: '0x00' },
            { time: 0, addr: '0x08', data: '0x78' }
        ];

        const merged = mergeToneInitializationWithMMLNoteEvents(toneEvents, noteEvents);

        expect(merged).toEqual([...toneEvents, ...noteEvents]);
        expect(merged.some(event => event.addr === '0x21')).toBe(false);
    });
});
