/**
 * Application Initialization
 * Initializes Emscripten/WASM and sets up event listeners
 */

import { loadPresets } from './presets';
import { loadPresetTones } from './preset-tones';
import { loadFromStorage, saveToneEditorToStorage, saveJsonEditorToStorage } from './storage';
import { onToneEditorChange } from './tone-editor';
import { setupKeyboardShortcuts } from './keyboard';
import { AUTOSAVE_DEBOUNCE_MS } from './storage/constants';
import { OPM_SAMPLE_RATE } from './constants';
import { initializeAutoPlayCheckbox, triggerAutoPlay } from './autoplay';
import { initializeRandomToneGenerator } from './random-tone';
import { initializeOscilloscope } from './oscilloscope';

/**
 * Initialize the application when Emscripten runtime is ready
 */
export function initializeApplication(): void {
    console.log("Emscripten ready!");
    
    const infoDiv = document.getElementById('info');
    if (infoDiv) {
        infoDiv.innerHTML = 
            `OPM Internal Rate: ${OPM_SAMPLE_RATE.toFixed(0)} Hz<br>` +
            `Waiting for presets...`;
    }
    
    // Initialize auto-play checkbox
    initializeAutoPlayCheckbox();
    
    // Initialize random tone generator
    initializeRandomToneGenerator();
    
    // Initialize oscilloscope when library is loaded
    // Check periodically if the library is available
    const checkOscilloscopeLibrary = () => {
        if (typeof window.Oscilloscope !== 'undefined') {
            try {
                initializeOscilloscope();
            } catch (error) {
                console.warn('Oscilloscope initialization failed:', error);
            }
        } else {
            // Retry after a short delay
            setTimeout(checkOscilloscopeLibrary, 100);
        }
    };
    
    // Start checking after a brief delay to allow script loading
    setTimeout(checkOscilloscopeLibrary, 500);
    
    const tryLoadFromStorage = function() {
        // Load from storage after presets are loaded (or if presets fail to load)
        const hasSavedData = loadFromStorage();
        if (hasSavedData) {
            console.log('Restored from local storage');
        }
    };
    
    loadPresets()
        .then(function() {
            return loadPresetTones();
        })
        .then(function() {
            tryLoadFromStorage();
        })
        .catch(function(error) {
            console.error('Failed to load presets, attempting to restore from local storage instead.', error);
            tryLoadFromStorage();
        });
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
}

/**
 * Initialize when DOM is ready
 */
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', setupEditorListeners);
}
