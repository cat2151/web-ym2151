/**
 * Application Initialization
 * Initializes Emscripten/WASM and sets up event listeners
 */

import { loadFromStorage, saveToneEditorToStorage, saveJsonEditorToStorage } from './storage';
import { onToneEditorChange, onRegistersEditorChange } from './tone-editor';
import { setupKeyboardShortcuts } from './keyboard';
import { AUTOSAVE_DEBOUNCE_MS } from './storage/constants';
import { OPM_SAMPLE_RATE } from './constants';
import { triggerAutoPlay } from './autoplay';
import { initializeRandomToneGenerator } from './random-tone';
import {
    initializeRealtimeVisualizer,
    setWaveformScalingMode,
} from './audio/realtimeVisualizer';
import { parseCombinedMMLContent } from './mml/playback';

/**
 * Initialize the application when Emscripten runtime is ready
 */
export function initializeApplication(): void {
    console.log("Emscripten ready!");
    
    const infoDiv = document.getElementById('info');
    if (infoDiv) {
        infoDiv.innerHTML = `OPM Internal Rate: ${OPM_SAMPLE_RATE.toFixed(0)} Hz`;
    }
    
    // Initialize random tone generator
    initializeRandomToneGenerator();

    // Initialize realtime visualizer canvases (fixed to frame-dynamic / 95% scaling)
    initializeRealtimeVisualizer();
    setWaveformScalingMode('frame-dynamic');
    
    // Load from storage
    const hasSavedData = loadFromStorage();
    if (hasSavedData) {
        console.log('Restored from local storage');
    }
}

/**
 * Setup editor event listeners for auto-save functionality
 */
export function setupEditorListeners(): void {
    const toneEditor = document.getElementById('toneEditor');
    const jsonEditor = document.getElementById('jsonEditor');
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    if (toneEditor) {
        let timeoutId: number | null = null;
        toneEditor.addEventListener('input', function() {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                // Update JSON from tone editor
                onToneEditorChange();
                // Save both editors to local storage
                saveToneEditorToStorage();
                saveJsonEditorToStorage();
                // Trigger auto-play if enabled
                triggerAutoPlay();
            }, AUTOSAVE_DEBOUNCE_MS);
        });
    }
    
    if (jsonEditor) {
        let jsonTimeoutId: number | null = null;
        jsonEditor.addEventListener('input', function() {
            if (jsonTimeoutId) clearTimeout(jsonTimeoutId);
            jsonTimeoutId = window.setTimeout(() => {
                // Validate JSON before triggering auto-play to avoid alert spam
                let isValidJson = true;
                const jsonInputElement = jsonEditor as HTMLTextAreaElement | HTMLInputElement;
                const jsonText = jsonInputElement.value;
                try {
                    const parsed = JSON.parse(jsonText);
                    // Also validate it has the expected structure
                    if (!parsed.events || !Array.isArray(parsed.events)) {
                        isValidJson = false;
                    }
                } catch (e) {
                    isValidJson = false;
                }
                // Save only JSON editor
                saveJsonEditorToStorage();
                // Trigger auto-play if enabled and JSON is valid
                if (isValidJson) {
                    triggerAutoPlay();
                }
            }, AUTOSAVE_DEBOUNCE_MS);
        });
    }

    const registersEditor = document.getElementById('registersEditor');
    if (registersEditor) {
        let registersTimeoutId: number | null = null;
        registersEditor.addEventListener('input', function() {
            if (registersTimeoutId) clearTimeout(registersTimeoutId);
            registersTimeoutId = window.setTimeout(() => {
                // Validate registers JSON before triggering auto-play to avoid stale tone playback
                let isValidRegistersJson = false;
                const registersText = (registersEditor as HTMLTextAreaElement).value;
                try {
                    const parsed = JSON.parse(registersText);
                    if (
                        typeof parsed === 'object' &&
                        parsed !== null &&
                        typeof parsed.registers === 'string' &&
                        parsed.registers.length > 0 &&
                        (parsed.type === undefined || parsed.type === 'YM2151 tone')
                    ) {
                        isValidRegistersJson = true;
                    }
                } catch (_e) {
                    isValidRegistersJson = false;
                }

                // Apply changes and save editors
                onRegistersEditorChange();
                saveJsonEditorToStorage();
                saveToneEditorToStorage();

                // Trigger auto-play only when registers JSON is valid
                if (isValidRegistersJson) {
                    triggerAutoPlay();
                }
            }, AUTOSAVE_DEBOUNCE_MS);
        });
    }

    const mmlInput = document.getElementById('mmlInput');
    if (mmlInput) {
        let mmlTimeoutId: number | null = null;
        mmlInput.addEventListener('input', function() {
            if (mmlTimeoutId) clearTimeout(mmlTimeoutId);
            mmlTimeoutId = window.setTimeout(() => {
                triggerAutoPlay();
            }, AUTOSAVE_DEBOUNCE_MS);
        });
    }

    const combinedMMLEditor = document.getElementById('combinedMML');
    if (combinedMMLEditor) {
        let combinedTimeoutId: number | null = null;
        combinedMMLEditor.addEventListener('input', function() {
            if (combinedTimeoutId) clearTimeout(combinedTimeoutId);
            combinedTimeoutId = window.setTimeout(() => {
                const content = (combinedMMLEditor as HTMLTextAreaElement).value;
                const { toneJson, mml } = parseCombinedMMLContent(content);

                // Update mmlInput with the MML portion
                const mmlInput = document.getElementById('mmlInput') as HTMLTextAreaElement | null;
                if (mmlInput) {
                    mmlInput.value = mml;
                }

                // Apply tone JSON to editors if present
                if (toneJson) {
                    const regEditor = document.getElementById('registersEditor') as HTMLTextAreaElement | null;
                    if (regEditor) {
                        regEditor.value = toneJson;
                        onRegistersEditorChange();
                    }
                }

                // Trigger MML playback only when content is ready:
                // - if it starts with '{', a valid tone JSON header must have been found
                // - otherwise it's plain MML which is always safe to play
                const contentStartsWithJson = content.trim().startsWith('{');
                if (!contentStartsWithJson || toneJson !== null) {
                    triggerAutoPlay();
                }
            }, AUTOSAVE_DEBOUNCE_MS);
        });
    }
}

/**
 * Initialize when DOM is ready
 */
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', setupEditorListeners);
}
