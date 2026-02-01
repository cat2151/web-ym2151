// Local storage management module
// Auto-saves and loads tone editor and JSON editor contents

const STORAGE_KEYS = {
    TONE_EDITOR: 'ym2151_tone_editor',
    JSON_EDITOR: 'ym2151_json_editor',
    SLOT_PREFIX: 'ym2151_slot_'
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

/**
 * Save current tone editor content to a specific slot
 * @param {number} slotNumber - Slot number (1-8)
 * @param {string} slotName - Optional name for the slot
 */
function saveToSlot(slotNumber, slotName) {
    try {
        if (slotNumber < 1 || slotNumber > 8) {
            throw new Error('Slot number must be between 1 and 8');
        }
        
        const toneEditor = document.getElementById('toneEditor');
        const jsonEditor = document.getElementById('jsonEditor');
        
        if (!toneEditor || !jsonEditor) {
            throw new Error('Editor elements not found');
        }
        
        const slotData = {
            toneEditor: toneEditor.value,
            jsonEditor: jsonEditor.value,
            timestamp: new Date().toISOString(),
            name: slotName || `Slot ${slotNumber}`
        };
        
        const key = STORAGE_KEYS.SLOT_PREFIX + slotNumber;
        localStorage.setItem(key, JSON.stringify(slotData));
        console.log(`Saved to slot ${slotNumber}: ${slotData.name}`);
        
        return true;
    } catch (error) {
        console.error(`Error saving to slot ${slotNumber}:`, error);
        
        let message = `Failed to save to slot ${slotNumber}.`;
        if (error && (error.name === 'QuotaExceededError' ||
            error.code === 22 || // Safari / older WebKit
            error.code === 1014)) { // Firefox
            message += ' Your browser\'s local storage is full. Please clear some saved data and try again.';
        } else {
            message += ' ' + (error.message || 'Please try again.');
        }
        
        window.alert(message);
        return false;
    }
}

/**
 * Load tone editor content from a specific slot
 * @param {number} slotNumber - Slot number (1-8)
 */
function loadFromSlot(slotNumber) {
    try {
        if (slotNumber < 1 || slotNumber > 8) {
            throw new Error('Slot number must be between 1 and 8');
        }
        
        const key = STORAGE_KEYS.SLOT_PREFIX + slotNumber;
        const slotDataStr = localStorage.getItem(key);
        
        if (!slotDataStr) {
            window.alert(`Slot ${slotNumber} is empty.`);
            return false;
        }
        
        const slotData = JSON.parse(slotDataStr);
        
        const toneEditor = document.getElementById('toneEditor');
        const jsonEditor = document.getElementById('jsonEditor');
        
        if (toneEditor && slotData.toneEditor !== undefined) {
            toneEditor.value = slotData.toneEditor;
            
            // Trigger tone editor change to update JSON
            if (typeof onToneEditorChange === 'function') {
                onToneEditorChange();
            }
        }
        
        if (jsonEditor && slotData.jsonEditor !== undefined) {
            jsonEditor.value = slotData.jsonEditor;
            
            // Update duration display
            try {
                const data = JSON.parse(slotData.jsonEditor);
                if (data.events && Array.isArray(data.events)) {
                    if (typeof updateDurationDisplay === 'function') {
                        updateDurationDisplay(data.events);
                    }
                }
            } catch (e) {
                console.error('Error parsing JSON from slot:', e);
            }
        }
        
        console.log(`Loaded from slot ${slotNumber}: ${slotData.name}`);
        
        // Auto-save after loading to sync with auto-save storage
        saveToneEditorToStorage();
        saveJsonEditorToStorage();
        
        return true;
    } catch (error) {
        console.error(`Error loading from slot ${slotNumber}:`, error);
        window.alert(`Failed to load from slot ${slotNumber}. ${error.message || 'Please try again.'}`);
        return false;
    }
}

/**
 * Get information about all saved slots
 * @returns {Array} Array of slot info objects
 */
function getAllSlots() {
    const slots = [];
    
    for (let i = 1; i <= 8; i++) {
        const key = STORAGE_KEYS.SLOT_PREFIX + i;
        const slotDataStr = localStorage.getItem(key);
        
        if (slotDataStr) {
            try {
                const slotData = JSON.parse(slotDataStr);
                slots.push({
                    number: i,
                    name: slotData.name || `Slot ${i}`,
                    timestamp: slotData.timestamp,
                    isEmpty: false
                });
            } catch (e) {
                console.error(`Error parsing slot ${i}:`, e);
                slots.push({
                    number: i,
                    name: `Slot ${i}`,
                    timestamp: null,
                    isEmpty: true
                });
            }
        } else {
            slots.push({
                number: i,
                name: `Slot ${i}`,
                timestamp: null,
                isEmpty: true
            });
        }
    }
    
    return slots;
}

/**
 * Clear a specific slot
 * @param {number} slotNumber - Slot number (1-8)
 */
function clearSlot(slotNumber) {
    try {
        if (slotNumber < 1 || slotNumber > 8) {
            throw new Error('Slot number must be between 1 and 8');
        }
        
        const key = STORAGE_KEYS.SLOT_PREFIX + slotNumber;
        localStorage.removeItem(key);
        console.log(`Cleared slot ${slotNumber}`);
        return true;
    } catch (error) {
        console.error(`Error clearing slot ${slotNumber}:`, error);
        return false;
    }
}

/**
 * Handle save button click
 */
function handleSaveSlot() {
    const select = document.getElementById('saveSlotSelect');
    const slotNumber = parseInt(select.value);
    
    if (isNaN(slotNumber)) {
        window.alert('Please select a slot to save to.');
        return;
    }
    
    const slotName = window.prompt(`Enter a name for slot ${slotNumber}:`, `Slot ${slotNumber}`);
    
    // User cancelled the prompt
    if (slotName === null) {
        return;
    }
    
    const success = saveToSlot(slotNumber, slotName || `Slot ${slotNumber}`);
    
    if (success) {
        window.alert(`Saved to slot ${slotNumber}!`);
        refreshSlotInfo();
    }
}

/**
 * Handle load button click
 */
function handleLoadSlot() {
    const select = document.getElementById('loadSlotSelect');
    const slotNumber = parseInt(select.value);
    
    if (isNaN(slotNumber)) {
        window.alert('Please select a slot to load from.');
        return;
    }
    
    const success = loadFromSlot(slotNumber);
    
    if (success) {
        window.alert(`Loaded from slot ${slotNumber}!`);
    }
}

/**
 * Handle clear button click
 */
function handleClearSlot() {
    const select = document.getElementById('loadSlotSelect');
    const slotNumber = parseInt(select.value);
    
    if (isNaN(slotNumber)) {
        window.alert('Please select a slot to clear.');
        return;
    }
    
    if (!window.confirm(`Are you sure you want to clear slot ${slotNumber}?`)) {
        return;
    }
    
    const success = clearSlot(slotNumber);
    
    if (success) {
        window.alert(`Slot ${slotNumber} cleared!`);
        refreshSlotInfo();
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Refresh and display slot information
 */
function refreshSlotInfo() {
    const slots = getAllSlots();
    const infoDiv = document.getElementById('slotInfo');
    
    if (!infoDiv) return;
    
    let html = '<div class="slot-info-header"><strong>Saved Slots:</strong></div>';
    html += '<div class="slot-grid">';
    
    slots.forEach(slot => {
        const statusClass = slot.isEmpty ? 'slot-empty' : 'slot-filled';
        const statusText = slot.isEmpty ? 'Empty' : escapeHtml(slot.name);
        const timeText = slot.timestamp ? 
            `<br><small>${escapeHtml(new Date(slot.timestamp).toLocaleString())}</small>` : '';
        
        html += `<div class="slot-item ${statusClass}">
            <strong>Slot ${slot.number}</strong><br>
            ${statusText}${timeText}
        </div>`;
    });
    
    html += '</div>';
    infoDiv.innerHTML = html;
}

// Initialize slot info display when DOM is ready
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function() {
        // Check if slotInfo element exists and refresh
        const checkAndRefresh = function() {
            const infoDiv = document.getElementById('slotInfo');
            if (infoDiv) {
                refreshSlotInfo();
            }
        };
        
        // Try immediately and also after a short delay as fallback
        checkAndRefresh();
        setTimeout(checkAndRefresh, 100);
    });
}
