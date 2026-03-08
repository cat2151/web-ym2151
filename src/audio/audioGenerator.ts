/**
 * Audio Buffer Generator
 * Generates audio buffers from JSON events using WASM
 */

import { YM2151Event } from '../types';
import { calculateDuration, updateDurationDisplay } from '../ui';
import { OPM_SAMPLE_RATE } from '../constants';
import { NOTE_TABLE } from '../midi/noteTable';

/**
 * Audio data returned from generation
 */
export interface AudioData {
    left: Float32Array;
    right: Float32Array;
    frames: number;
    duration: number;
    frequencyEstimate?: number;
}

function parseHexByte(value: string | number): number | null {
    const parsed = typeof value === 'number' ? value : parseInt(value, 16);
    if (Number.isNaN(parsed)) {
        return null;
    }
    return parsed & 0xff;
}

function kcToFrequencyHz(kc: number): number | null {
    const noteCode = kc & 0x0f;
    const block = (kc >> 4) & 0x07;
    const noteIndex = NOTE_TABLE.indexOf(noteCode);
    if (noteIndex === -1) {
        return null;
    }

    const midiNote = (block + 2) * 12 + noteIndex + 1;
    return 440 * Math.pow(2, (midiNote - 69) / 12);
}

function extractMinMul(events: YM2151Event[]): number | null {
    let minMul: number | null = null;

    events.forEach(evt => {
        const addrValue = parseHexByte(evt.addr);
        const dataValue = parseHexByte(evt.data);
        if (addrValue === null || dataValue === null) {
            return;
        }

        const opBase = addrValue & 0xf8;
        const isMulRegister =
            opBase === 0x40 || opBase === 0x48 || opBase === 0x50 || opBase === 0x58;
        if (!isMulRegister) {
            return;
        }

        const mulRaw = dataValue & 0x0f;
        const multiplier = mulRaw === 0 ? 0.5 : mulRaw;
        if (minMul === null || multiplier < minMul) {
            minMul = multiplier;
        }
    });

    return minMul;
}

function findLatestKc(events: YM2151Event[]): number | null {
    let kc: number | null = null;
    let latestTime = -Infinity;

    events.forEach(evt => {
        const addrValue = parseHexByte(evt.addr);
        const dataValue = parseHexByte(evt.data);
        if (addrValue === null || dataValue === null) {
            return;
        }

        if ((addrValue & 0xf8) === 0x28) {
            const time = parseFloat(evt.time as any);
            if (!Number.isNaN(time) && time >= latestTime) {
                latestTime = time;
                kc = dataValue & 0x7f;
            }
        }
    });

    return kc;
}

function estimateFrequencyFromEvents(events: YM2151Event[]): number | null {
    const kcValue = findLatestKc(events);
    if (kcValue === null) {
        return null;
    }

    const baseFrequency = kcToFrequencyHz(kcValue);
    if (baseFrequency === null) {
        return null;
    }

    const minMul = extractMinMul(events);
    const mulScale = minMul ?? 1;
    return baseFrequency * mulScale;
}

/**
 * Core audio generation from a pre-parsed event array.
 * Does NOT access the DOM – safe to call from background tasks.
 * @returns AudioData or null if generation fails
 */
export function generateAudioFromEvents(events: YM2151Event[]): AudioData | null {
    if (typeof Module === 'undefined' || !Module._generate_sound) {
        return null;
    }
    if (events.length === 0) {
        return null;
    }

    const durationSec = calculateDuration(events);
    const estimatedFrequency = estimateFrequencyFromEvents(events);
    const numFramesRaw = Math.floor(OPM_SAMPLE_RATE * durationSec);

    const STRUCT_SIZE = 8;
    const bufferSize = events.length * STRUCT_SIZE;
    const dataPtr = Module._malloc(bufferSize);
    const view = new DataView(Module.HEAPU8.buffer);

    events.forEach((evt, i) => {
        const baseAddr = dataPtr + (i * STRUCT_SIZE);
        view.setFloat32(baseAddr, parseFloat(evt.time as any), true);
        Module.HEAPU8[baseAddr + 4] = parseInt(evt.addr as string);
        Module.HEAPU8[baseAddr + 5] = parseInt(evt.data as string);
    });

    const actualFrames = Module._generate_sound(dataPtr, events.length, numFramesRaw);
    Module._free(dataPtr);

    if (actualFrames <= 0) {
        return null;
    }

    const rawLeft = new Float32Array(actualFrames);
    const rawRight = new Float32Array(actualFrames);

    // Use HEAPF32 bulk copy via get_buffer_ptr for better performance
    const bufPtr = Module._get_buffer_ptr();
    const floatOffset = bufPtr >> 2; // byte address to Float32Array index
    const interleaved = Module.HEAPF32.subarray(floatOffset, floatOffset + actualFrames * 2);
    for (let i = 0; i < actualFrames; i++) {
        rawLeft[i] = interleaved[i * 2];
        rawRight[i] = interleaved[i * 2 + 1];
    }

    // NOTE: caller is responsible for calling Module._free_buffer() after use.

    return {
        left: rawLeft,
        right: rawRight,
        frames: actualFrames,
        duration: durationSec,
        frequencyEstimate: estimatedFrequency ?? undefined
    };
}

/**
 * Generate audio buffers from a JSON string without modifying the DOM.
 * Returns null silently on parse errors – suitable for background rendering.
 * NOTE: caller is responsible for calling Module._free_buffer() after use.
 */
export function generateAudioFromJson(jsonString: string): AudioData | null {
    if (typeof Module === 'undefined' || !Module._generate_sound) {
        return null;
    }

    let events: YM2151Event[];
    try {
        const data = JSON.parse(jsonString);
        if (!data.events || !Array.isArray(data.events)) {
            return null;
        }
        events = data.events as YM2151Event[];
        if (events.length === 0) {
            return null;
        }
    } catch {
        return null;
    }

    return generateAudioFromEvents(events);
}

/**
 * Generate audio buffers from JSON events
 * @returns AudioData or null if generation fails
 */
export function generateAudioBuffers(): AudioData | null {
    // Check if Emscripten Module is initialized
    if (typeof Module === 'undefined' || !Module._generate_sound) {
        console.warn('WASM Module not yet initialized. Please wait for initialization to complete.');
        return null;
    }
    
    const textarea = document.getElementById('jsonEditor') as HTMLTextAreaElement | null;
    if (!textarea) {
        return null;
    }

    let currentEvents: YM2151Event[];
    
    try {
        const currentData = JSON.parse(textarea.value);
        if (!currentData.events || !Array.isArray(currentData.events)) {
            throw new Error("JSON must contain an 'events' array.");
        }
        currentEvents = currentData.events;
        if (currentEvents.length === 0) {
            alert("Events array is empty.");
            return null;
        }
    } catch (e) {
        const error = e as Error;
        alert("Invalid JSON format:\n" + error.message);
        return null;
    }

    const durationSec = calculateDuration(currentEvents);
    updateDurationDisplay(currentEvents);
    const estimatedFrequency = estimateFrequencyFromEvents(currentEvents);

    // Generate samples at OPM sample rate
    const numFramesRaw = Math.floor(OPM_SAMPLE_RATE * durationSec);
    
    const STRUCT_SIZE = 8;
    const bufferSize = currentEvents.length * STRUCT_SIZE;
    const dataPtr = Module._malloc(bufferSize);
    const view = new DataView(Module.HEAPU8.buffer);
    
    currentEvents.forEach((evt, i) => {
        const baseAddr = dataPtr + (i * STRUCT_SIZE);
        view.setFloat32(baseAddr, parseFloat(evt.time as any), true);
        Module.HEAPU8[baseAddr + 4] = parseInt(evt.addr as string);
        Module.HEAPU8[baseAddr + 5] = parseInt(evt.data as string);
    });
    
    console.log("Generating audio...");
    const actualFrames = Module._generate_sound(dataPtr, currentEvents.length, numFramesRaw);
    Module._free(dataPtr);
    
    if (actualFrames <= 0) {
        console.error("Failed to generate samples");
        return null;
    }
    
    console.log("Audio generated");
    
    const rawLeft = new Float32Array(actualFrames);
    const rawRight = new Float32Array(actualFrames);
    
    // Use HEAPF32 bulk copy via get_buffer_ptr for better performance
    const bufPtr = Module._get_buffer_ptr();
    const floatOffset = bufPtr >> 2; // byte address to Float32Array index
    const interleaved = Module.HEAPF32.subarray(floatOffset, floatOffset + actualFrames * 2);
    for (let i = 0; i < actualFrames; i++) {
        rawLeft[i] = interleaved[i * 2];
        rawRight[i] = interleaved[i * 2 + 1];
    }
    
    return {
        left: rawLeft,
        right: rawRight,
        frames: actualFrames,
        duration: durationSec,
        frequencyEstimate: estimatedFrequency ?? undefined
    };
}
