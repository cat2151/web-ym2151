// Emscripten/WASM initialization module
var Module = {
    onRuntimeInitialized: function() {
        console.log("Emscripten ready!");
        document.getElementById('info').innerHTML = 
            `OPM Internal Rate: ${OPM_SAMPLE_RATE.toFixed(0)} Hz<br>` +
            `Waiting for presets...`;
        
        const tryLoadFromStorage = function() {
            // Load from storage after presets are loaded (or if presets fail to load)
            // Only load if there's saved data, otherwise keep the preset
            // Note: The first preset is loaded by default, but will be overwritten
            // if saved data exists. This ensures users always see something even if
            // localStorage is unavailable.
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
};

// Initialize tone editor event listener when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const toneEditor = document.getElementById('toneEditor');
    const jsonEditor = document.getElementById('jsonEditor');
    
    if (toneEditor) {
        // Update JSON when tone editor changes (with debouncing)
        let timeoutId = null;
        toneEditor.addEventListener('input', function() {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                // Update JSON from tone editor
                onToneEditorChange();
                // Save both editors to local storage
                saveToneEditorToStorage();
                saveJsonEditorToStorage();
            }, AUTOSAVE_DEBOUNCE_MS);
        });
    }
    
    if (jsonEditor) {
        // Auto-save when JSON editor changes
        let jsonTimeoutId = null;
        jsonEditor.addEventListener('input', function() {
            if (jsonTimeoutId) clearTimeout(jsonTimeoutId);
            jsonTimeoutId = setTimeout(() => {
                // Save only JSON editor
                saveJsonEditorToStorage();
            }, AUTOSAVE_DEBOUNCE_MS);
        });
    }
});
