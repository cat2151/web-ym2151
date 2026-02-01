// Emscripten/WASM initialization module
var Module = {
    onRuntimeInitialized: function() {
        console.log("Emscripten ready!");
        document.getElementById('info').innerHTML = 
            `OPM Internal Rate: ${OPM_SAMPLE_RATE.toFixed(0)} Hz<br>` +
            `Waiting for presets...`;
        loadPresets();
    }
};

// Initialize tone editor event listener when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const toneEditor = document.getElementById('toneEditor');
    if (toneEditor) {
        // Update JSON when tone editor changes (with debouncing)
        let timeoutId = null;
        toneEditor.addEventListener('input', function() {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(onToneEditorChange, 500);
        });
    }
});
