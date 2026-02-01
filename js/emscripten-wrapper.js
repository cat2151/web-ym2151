// Emscripten/WASM initialization module
var Module = {
    onRuntimeInitialized: function() {
        console.log("Emscripten ready!");
        document.getElementById('info').innerHTML = 
            `OPM Internal Rate: ${OPM_SAMPLE_RATE.toFixed(0)} Hz<br>` +
            `Waiting for presets...`;
        loadPresets().then(() => {
            // Load from storage after presets are loaded
            // Only load if there's saved data, otherwise keep the preset
            const hasSavedData = loadFromStorage();
            if (hasSavedData) {
                console.log('Restored from local storage');
            }
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
                onToneEditorChange();
                autoSave(); // Auto-save after change
            }, 500);
        });
    }
    
    if (jsonEditor) {
        // Auto-save when JSON editor changes
        let jsonTimeoutId = null;
        jsonEditor.addEventListener('input', function() {
            if (jsonTimeoutId) clearTimeout(jsonTimeoutId);
            jsonTimeoutId = setTimeout(() => {
                autoSave();
            }, 1000);
        });
    }
});
