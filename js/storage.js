// Local storage management module
// Auto-saves and loads tone editor and JSON editor contents

const STORAGE_KEYS = {
    TONE_EDITOR: 'ym2151_tone_editor',
    JSON_EDITOR: 'ym2151_json_editor'
};

/**
 * Save tone editor content to local storage
 */
function saveToneEditorToStorage() {
    try {
        const toneEditor = document.getElementById('toneEditor');
        if (toneEditor) {
            // Save even if empty to allow users to clear saved content
            localStorage.setItem(STORAGE_KEYS.TONE_EDITOR, toneEditor.value);
            console.log('Tone editor saved to local storage');
        }
    } catch (error) {
        console.error('Error saving tone editor to local storage:', error);
    }
}

/**
 * Save JSON editor content to local storage
 */
function saveJsonEditorToStorage() {
    try {
        const jsonEditor = document.getElementById('jsonEditor');
        if (jsonEditor) {
            // Save even if empty to allow users to clear saved content
            localStorage.setItem(STORAGE_KEYS.JSON_EDITOR, jsonEditor.value);
            console.log('JSON editor saved to local storage');
        }
    } catch (error) {
        console.error('Error saving JSON editor to local storage:', error);
    }
}

/**
 * Load saved content from local storage and populate editors
 */
function loadFromStorage() {
    try {
        // Load tone editor
        const savedToneEditor = localStorage.getItem(STORAGE_KEYS.TONE_EDITOR);
        const savedJsonEditor = localStorage.getItem(STORAGE_KEYS.JSON_EDITOR);
        
        if (savedToneEditor) {
            const toneEditor = document.getElementById('toneEditor');
            if (toneEditor) {
                toneEditor.value = savedToneEditor;
                console.log('Tone editor loaded from local storage');
                
                // Trigger tone editor change to update JSON
                // We call this directly here since this is initial load, not user input
                if (typeof onToneEditorChange === 'function') {
                    onToneEditorChange();
                }
            }
        } else if (savedJsonEditor) {
            // Load JSON editor if no tone editor saved
            const jsonEditor = document.getElementById('jsonEditor');
            if (jsonEditor) {
                jsonEditor.value = savedJsonEditor;
                console.log('JSON editor loaded from local storage');
                
                // Try to parse and update tone editor from JSON
                try {
                    const data = JSON.parse(savedJsonEditor);
                    if (data.events && Array.isArray(data.events)) {
                        if (typeof parseJsonToToneEditor === 'function') {
                            parseJsonToToneEditor(data.events);
                        }
                        if (typeof updateDurationDisplay === 'function') {
                            updateDurationDisplay(data.events);
                        }
                    }
                } catch (e) {
                    console.error('Error parsing saved JSON:', e);
                }
            }
        }
        
        return savedToneEditor || savedJsonEditor;
    } catch (error) {
        console.error('Error loading from local storage:', error);
        return null;
    }
}

/**
 * Clear all saved data from local storage
 */
function clearStorage() {
    try {
        localStorage.removeItem(STORAGE_KEYS.TONE_EDITOR);
        localStorage.removeItem(STORAGE_KEYS.JSON_EDITOR);
        console.log('Local storage cleared');
    } catch (error) {
        console.error('Error clearing local storage:', error);
    }
}

/**
 * Auto-save function with debouncing
 */
let autoSaveTimeout = null;
function autoSave() {
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    autoSaveTimeout = setTimeout(() => {
        saveToneEditorToStorage();
        saveJsonEditorToStorage();
    }, 1000); // Save 1 second after user stops typing
}
