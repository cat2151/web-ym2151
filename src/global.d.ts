/**
 * Global type definitions for Emscripten Module
 */

declare global {
    interface EmscriptenModule {
        _malloc(size: number): number;
        _free(ptr: number): void;
        _generate_sound(dataPtr: number, eventCount: number, numFrames: number): number;
        _get_sample(index: number): number;
        _free_buffer(): void;
        HEAPU8: Uint8Array;
        onRuntimeInitialized?: () => void;
    }
    
    const Module: EmscriptenModule;
    var Module: EmscriptenModule;
}

export {};
