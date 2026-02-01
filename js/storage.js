// Local storage management module
// Auto-saves and loads tone editor and JSON editor contents

const STORAGE_KEYS = {
    TONE_EDITOR: 'ym2151_tone_editor',
    JSON_EDITOR: 'ym2151_json_editor'
};

// Auto-save debounce delay in milliseconds
const AUTOSAVE_DEBOUNCE_MS = 1000;

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
        
        // Provide user-facing feedback, with a clearer message for quota errors
        let message = 'Failed to save tone editor content.';
        if (error && (error.name === 'QuotaExceededError' ||
            error.code === 22 || // Safari / older WebKit
            error.code === 1014)) { // Firefox
            message += ' Your browser\'s local storage is full. Please clear some saved data and try again.';
        } else {
            message += ' Please try again.';
        }
        
        // Use a simple alert to ensure the user is notified
        window.alert(message);
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
        
        // Provide user-facing feedback, with a clearer message for quota errors
        let message = 'Failed to save JSON editor content.';
        if (error && (error.name === 'QuotaExceededError' ||
            error.code === 22 || // Safari / older WebKit
            error.code === 1014)) { // Firefox
            message += ' Your browser\'s local storage is full. Please clear some saved data and try again.';
        } else {
            message += ' Please try again.';
        }
        
        // Use a simple alert to ensure the user is notified
        window.alert(message);
    }
}

/**
 * Load saved content from local storage and populate editors
 */
function loadFromStorage() {
    try {
        // Load saved tone and JSON editor content from local storage
        const savedToneEditor = localStorage.getItem(STORAGE_KEYS.TONE_EDITOR);
        const savedJsonEditor = localStorage.getItem(STORAGE_KEYS.JSON_EDITOR);
        
        if (savedToneEditor !== null) {
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
            return true; // Indicate that saved data was found
        } else if (savedJsonEditor !== null) {
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
            return true; // Indicate that saved data was found
        }
        
        return false; // No saved data found
    } catch (error) {
        console.error('Error loading from local storage:', error);
        return false;
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
