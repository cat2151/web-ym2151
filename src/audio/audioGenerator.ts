/**
 * Audio Buffer Generator
 * Generates audio buffers from JSON events using WASM
 */

import { YM2151Event } from '../types';
import { calculateDuration, updateDurationDisplay } from '../ui';
import { OPM_SAMPLE_RATE } from '../constants';

/**
 * Audio data returned from generation
 */
export interface AudioData {
    left: Float32Array;
    right: Float32Array;
    frames: number;
    duration: number;
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
    
    // C-side buffer is [L0, R0, L1, R1, ...]
    for (let i = 0; i < actualFrames; i++) {
        rawLeft[i] = Module._get_sample(i * 2);
        rawRight[i] = Module._get_sample(i * 2 + 1);
    }
    
    return {
        left: rawLeft,
        right: rawRight,
        frames: actualFrames,
        duration: durationSec
    };
}
