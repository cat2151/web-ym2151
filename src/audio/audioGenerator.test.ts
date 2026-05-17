import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OPM_SAMPLE_RATE } from '../constants';
import { generateAudioFromEvents, generateAudioFromJson } from './audioGenerator';

function installModuleMock(): { generatedFrames: number[] } {
    const generatedFrames: number[] = [];
    const buffer = new ArrayBuffer(
        Math.ceil(OPM_SAMPLE_RATE * 5 * 2) * Float32Array.BYTES_PER_ELEMENT
    );

    (globalThis as typeof globalThis & { Module: EmscriptenModule }).Module = {
        _malloc: () => 0,
        _free: () => undefined,
        _generate_sound: (_dataPtr: number, _eventCount: number, numFrames: number) => {
            generatedFrames.push(numFrames);
            return numFrames;
        },
        _get_buffer_ptr: () => 0,
        _free_buffer: () => undefined,
        HEAPU8: new Uint8Array(buffer),
        HEAPF32: new Float32Array(buffer)
    };

    return { generatedFrames };
}

describe('audioGenerator render duration', () => {
    beforeEach(() => {
        installModuleMock();
    });

    afterEach(() => {
        delete (globalThis as Partial<typeof globalThis> & { Module?: EmscriptenModule }).Module;
    });

    it('uses render_duration_seconds from JSON when valid', () => {
        const state = installModuleMock();
        const audio = generateAudioFromJson(JSON.stringify({
            render_duration_seconds: 2.5,
            events: [{ time: 10, addr: '0x28', data: '0x4A' }]
        }));

        expect(audio?.duration).toBe(2.5);
        expect(state.generatedFrames).toEqual([Math.floor(OPM_SAMPLE_RATE * 2.5)]);
    });

    it('falls back to max event time plus one for invalid metadata', () => {
        const state = installModuleMock();
        const audio = generateAudioFromJson(JSON.stringify({
            render_duration_seconds: '2.5',
            events: [{ time: 3.5, addr: '0x28', data: '0x4A' }]
        }));

        expect(audio?.duration).toBe(4.5);
        expect(state.generatedFrames).toEqual([Math.floor(OPM_SAMPLE_RATE * 4.5)]);
    });

    it('accepts an optional render duration for parsed events', () => {
        const state = installModuleMock();
        const audio = generateAudioFromEvents(
            [{ time: 8, addr: '0x28', data: '0x4A' }],
            1.25
        );

        expect(audio?.duration).toBe(1.25);
        expect(state.generatedFrames).toEqual([Math.floor(OPM_SAMPLE_RATE * 1.25)]);
    });
});
