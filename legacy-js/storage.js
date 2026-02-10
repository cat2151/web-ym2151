// Local storage management module
// Auto-saves and loads tone editor and JSON editor contents

const STORAGE_KEYS = {
    TONE_EDITOR: 'ym2151_tone_editor',
    JSON_EDITOR: 'ym2151_json_editor',
    SLOT_PREFIX: 'ym2151_slot_'
};

// Auto-save debounce delay in milliseconds
const AUTOSAVE_DEBOUNCE_MS = 1000;

// Flag to pause auto-save during preview operations
let autoSavePaused = false;

/**
 * Save tone editor content to local storage
 */
function saveToneEditorToStorage() {
    // Skip auto-save during preview to avoid overwriting backup
    if (autoSavePaused) {
        console.log('Auto-save paused during preview');
        return;
    }
    
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
    // Skip auto-save during preview to avoid overwriting backup
    if (autoSavePaused) {
        console.log('Auto-save paused during preview');
        return;
    }
    
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
        
        // Use helper function to load content
        loadEditorContent(slotData, true);
        
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
    
    try {
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
                        isEmpty: false,
                        isCorrupt: false
                    });
                } catch (e) {
                    console.error(`Error parsing slot ${i}:`, e);
                    // Mark as corrupted, not empty, so users know to clear/resave
                    slots.push({
                        number: i,
                        name: `Slot ${i} (Corrupted)`,
                        timestamp: null,
                        isEmpty: false,
                        isCorrupt: true
                    });
                }
            } else {
                slots.push({
                    number: i,
                    name: `Slot ${i}`,
                    timestamp: null,
                    isEmpty: true,
                    isCorrupt: false
                });
            }
        }
    } catch (error) {
        // If localStorage access fails entirely (privacy mode, etc.), return empty slots
        console.error('Error accessing localStorage:', error);
        for (let i = 1; i <= 8; i++) {
            slots.push({
                number: i,
                name: `Slot ${i}`,
                timestamp: null,
                isEmpty: true,
                isCorrupt: false
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
 * Load editor content from slot data (helper function to reduce duplication)
 * @param {Object} slotData - Slot data object
 * @param {boolean} triggerCallbacks - Whether to trigger callbacks (default: true)
 */
function loadEditorContent(slotData, triggerCallbacks = true) {
    const toneEditor = document.getElementById('toneEditor');
    const jsonEditor = document.getElementById('jsonEditor');
    
    if (toneEditor && slotData.toneEditor !== undefined) {
        toneEditor.value = slotData.toneEditor;
        
        if (triggerCallbacks && typeof onToneEditorChange === 'function') {
            onToneEditorChange();
        }
    }
    
    if (jsonEditor && slotData.jsonEditor !== undefined) {
        jsonEditor.value = slotData.jsonEditor;
        
        if (triggerCallbacks) {
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

// Store current tone state for preview/restore
let previewBackup = null;
let lastPreviewedSlot = null;
let autoRestoreTimeout = null;

/**
 * Preview a slot by temporarily loading it and playing
 */
function previewSlot(slotNumber) {
    // Clear any existing auto-restore timeout
    if (autoRestoreTimeout) {
        clearTimeout(autoRestoreTimeout);
        autoRestoreTimeout = null;
    }
    
    // Backup current state if not already backed up
    if (!previewBackup) {
        const toneEditor = document.getElementById('toneEditor');
        const jsonEditor = document.getElementById('jsonEditor');
        previewBackup = {
            toneEditor: toneEditor.value,
            jsonEditor: jsonEditor.value
        };
    }
    
    // Pause auto-save to prevent overwriting the backup
    autoSavePaused = true;
    
    // Load the slot data
    const key = STORAGE_KEYS.SLOT_PREFIX + slotNumber;
    const slotDataStr = localStorage.getItem(key);
    
    if (!slotDataStr) {
        window.alert(`Slot ${slotNumber} is empty.`);
        autoSavePaused = false; // Resume auto-save
        return;
    }
    
    try {
        const slotData = JSON.parse(slotDataStr);
        
        // Use helper function to load content
        loadEditorContent(slotData, true);
        
        // Store which slot was previewed
        lastPreviewedSlot = slotNumber;
        
        // Show the "Load Previewed" button
        showLoadPreviewedButton();
        
        // Play the preview
        if (typeof playAudio === 'function') {
            playAudio();
        }
        
        // Auto-restore after 3 seconds (can be adjusted)
        autoRestoreTimeout = setTimeout(() => {
            if (previewBackup) {
                restoreBackup();
            }
        }, 3000);
        
        console.log(`Previewing slot ${slotNumber}: ${slotData.name}`);
    } catch (error) {
        console.error(`Error previewing slot ${slotNumber}:`, error);
        window.alert(`Failed to preview slot ${slotNumber}.`);
        autoSavePaused = false; // Resume auto-save on error
    }
}

/**
 * Restore the backed up tone state
 */
function restoreBackup() {
    if (!previewBackup) return;
    
    // Clear auto-restore timeout if it exists
    if (autoRestoreTimeout) {
        clearTimeout(autoRestoreTimeout);
        autoRestoreTimeout = null;
    }
    
    // Use helper function to restore content
    loadEditorContent(previewBackup, true);
    
    previewBackup = null;
    hideLoadPreviewedButton();
    
    // Resume auto-save after restore
    autoSavePaused = false;
    
    console.log('Restored backup');
}

/**
 * Load the last previewed slot permanently
 */
function loadPreviewedSlot() {
    if (lastPreviewedSlot === null) return;
    
    // Clear auto-restore timeout since user chose to keep the preview
    if (autoRestoreTimeout) {
        clearTimeout(autoRestoreTimeout);
        autoRestoreTimeout = null;
    }
    
    // Clear the backup since we're committing to this tone
    previewBackup = null;
    hideLoadPreviewedButton();
    
    // Resume auto-save and save the loaded preview
    autoSavePaused = false;
    saveToneEditorToStorage();
    saveJsonEditorToStorage();
    
    console.log(`Loaded slot ${lastPreviewedSlot} permanently`);
    window.alert(`Slot ${lastPreviewedSlot} loaded!`);
}

/**
 * Show the "Load Previewed" button
 */
function showLoadPreviewedButton() {
    let buttonDiv = document.getElementById('loadPreviewedButtonDiv');
    if (!buttonDiv) {
        buttonDiv = document.createElement('div');
        buttonDiv.id = 'loadPreviewedButtonDiv';
        buttonDiv.className = 'storage-section';
        buttonDiv.style.marginTop = '10px';
        
        const loadBtn = document.createElement('button');
        loadBtn.onclick = loadPreviewedSlot;
        loadBtn.textContent = '✓ Load Previewed Tone';
        loadBtn.title = 'Keep the previewed tone';
        buttonDiv.appendChild(loadBtn);
        
        const storageControls = document.querySelector('.storage-controls');
        if (storageControls) {
            storageControls.appendChild(buttonDiv);
        }
    }
    buttonDiv.style.display = 'block';
}

/**
 * Hide the "Load Previewed" button
 */
function hideLoadPreviewedButton() {
    const buttonDiv = document.getElementById('loadPreviewedButtonDiv');
    if (buttonDiv) {
        buttonDiv.style.display = 'none';
    }
    lastPreviewedSlot = null;
}

/**
 * Refresh and display slot information
 */
function refreshSlotInfo() {
    const slots = getAllSlots();
    const infoDiv = document.getElementById('slotInfo');
    
    if (!infoDiv) return;
    
    // Clear existing content
    infoDiv.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'slot-info-header';
    const headerStrong = document.createElement('strong');
    headerStrong.textContent = 'Saved Slots:';
    header.appendChild(headerStrong);
    infoDiv.appendChild(header);
    
    // Create grid
    const grid = document.createElement('div');
    grid.className = 'slot-grid';
    
    slots.forEach(slot => {
        const slotDiv = document.createElement('div');
        
        // Determine status class and text
        let statusClass, statusText;
        if (slot.isCorrupt) {
            statusClass = 'slot-corrupt';
            statusText = 'Corrupted';
        } else if (slot.isEmpty) {
            statusClass = 'slot-empty';
            statusText = 'Empty';
        } else {
            statusClass = 'slot-filled';
            statusText = slot.name;
        }
        
        slotDiv.className = `slot-item ${statusClass}`;
        
        // Add click handler for filled slots
        if (!slot.isEmpty && !slot.isCorrupt) {
            slotDiv.style.cursor = 'pointer';
            slotDiv.title = 'Click to preview';
            slotDiv.onclick = () => previewSlot(slot.number);
        }
        
        // Add slot number
        const slotNumber = document.createElement('strong');
        slotNumber.textContent = `Slot ${slot.number}`;
        slotDiv.appendChild(slotNumber);
        slotDiv.appendChild(document.createElement('br'));
        
        // Add status text
        const statusTextNode = document.createTextNode(statusText);
        slotDiv.appendChild(statusTextNode);
        
        // Add timestamp if available
        if (slot.timestamp) {
            slotDiv.appendChild(document.createElement('br'));
            const timeSmall = document.createElement('small');
            timeSmall.textContent = new Date(slot.timestamp).toLocaleString();
            slotDiv.appendChild(timeSmall);
        }
        
        grid.appendChild(slotDiv);
    });
    
    infoDiv.appendChild(grid);
}

/**
 * Export all 8 slots to a JSON file
 */
function exportAllSlots() {
    try {
        const allSlotsData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            slots: []
        };
        
        let corruptedCount = 0;
        
        // Collect all slot data
        for (let i = 1; i <= 8; i++) {
            const key = STORAGE_KEYS.SLOT_PREFIX + i;
            const slotDataStr = localStorage.getItem(key);
            
            if (slotDataStr) {
                try {
                    const slotData = JSON.parse(slotDataStr);
                    allSlotsData.slots.push({
                        slotNumber: i,
                        data: slotData
                    });
                } catch (e) {
                    corruptedCount++;
                    console.warn(`Skipping corrupted slot ${i}:`, e);
                }
            }
        }
        
        if (allSlotsData.slots.length === 0) {
            if (corruptedCount > 0) {
                window.alert(`No slots to export. ${corruptedCount} slot(s) are corrupted and cannot be exported.`);
            } else {
                window.alert('No slots to export. All slots are empty.');
            }
            return;
        }
        
        // Create JSON blob and download
        const jsonStr = JSON.stringify(allSlotsData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create temporary download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `ym2151-slots-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`Exported ${allSlotsData.slots.length} slots`);
        
        // Show success message with information about skipped slots
        let successMessage = `Successfully exported ${allSlotsData.slots.length} slot(s)!`;
        if (corruptedCount > 0) {
            successMessage += `\n${corruptedCount} corrupted slot(s) were skipped.`;
        }
        window.alert(successMessage);
    } catch (error) {
        console.error('Error exporting slots:', error);
        window.alert('Failed to export slots. ' + (error.message || 'Please try again.'));
    }
}

/**
 * Import all slots from a JSON file
 */
function importAllSlots() {
    try {
        // Create file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        
        input.onchange = function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validate imported data structure
                    if (!importedData.slots || !Array.isArray(importedData.slots)) {
                        throw new Error('Invalid file format: missing slots array');
                    }
                    
                    // Confirm before overwriting
                    const message = `This will import ${importedData.slots.length} slot(s).\nExisting slots with the same numbers will be overwritten.\n\nContinue?`;
                    if (!window.confirm(message)) {
                        return;
                    }
                    
                    let importedCount = 0;
                    let errorCount = 0;
                    
                    // Import each slot
                    importedData.slots.forEach(slot => {
                        try {
                            const slotNumber = slot.slotNumber;
                            
                            if (slotNumber < 1 || slotNumber > 8) {
                                console.warn(`Invalid slot number: ${slotNumber}`);
                                errorCount++;
                                return;
                            }
                            
                            if (!slot.data) {
                                console.warn(`No data for slot ${slotNumber}`);
                                errorCount++;
                                return;
                            }
                            
                            // Save to localStorage
                            const key = STORAGE_KEYS.SLOT_PREFIX + slotNumber;
                            localStorage.setItem(key, JSON.stringify(slot.data));
                            importedCount++;
                        } catch (e) {
                            console.error(`Error importing slot ${slot.slotNumber}:`, e);
                            errorCount++;
                        }
                    });
                    
                    // Refresh the UI
                    refreshSlotInfo();
                    
                    // Show result
                    let resultMessage = `Successfully imported ${importedCount} slot(s)!`;
                    if (errorCount > 0) {
                        resultMessage += `\n${errorCount} slot(s) failed to import.`;
                    }
                    window.alert(resultMessage);
                    
                    console.log(`Import complete: ${importedCount} successful, ${errorCount} failed`);
                } catch (error) {
                    console.error('Error parsing imported file:', error);
                    window.alert('Failed to import slots. ' + (error.message || 'Invalid file format.'));
                }
            };
            
            reader.onerror = function() {
                window.alert('Failed to read file. Please try again.');
            };
            
            reader.readAsText(file);
        };
        
        // Trigger file selection
        input.click();
    } catch (error) {
        console.error('Error importing slots:', error);
        window.alert('Failed to import slots. ' + (error.message || 'Please try again.'));
    }
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
