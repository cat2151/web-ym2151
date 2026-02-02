/**
 * Application Initialization
 * Initializes Emscripten/WASM and sets up event listeners
 */

import { loadPresets } from './presets';
import { loadFromStorage, saveToneEditorToStorage, saveJsonEditorToStorage } from './storage';
import { onToneEditorChange } from './tone-editor';
import { setupKeyboardShortcuts } from './keyboard';
import { AUTOSAVE_DEBOUNCE_MS } from './storage/constants';
import { OPM_SAMPLE_RATE } from './constants';
import { initializeAutoPlayCheckbox, triggerAutoPlay } from './autoplay';

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
    
    const tryLoadFromStorage = function() {
        // Load from storage after presets are loaded (or if presets fail to load)
        const hasSavedData = loadFromStorage();
        if (hasSavedData) {
            console.log('Restored from local storage');
        }
    };
    
    loadPresets()
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
                // Save only JSON editor
                saveJsonEditorToStorage();
                // Trigger auto-play if enabled
                triggerAutoPlay();
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
