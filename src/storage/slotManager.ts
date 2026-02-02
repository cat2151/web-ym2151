/**
 * Slot Manager
 * Handles save/load/clear operations for 8 save slots
 */

import { SlotData, SlotInfo, AllSlotsExportData } from '../types';
import { STORAGE_KEYS, SLOT_COUNT } from './constants';
import { getStorageErrorMessage } from './errorHandler';
import { saveToneEditorToStorage, saveJsonEditorToStorage } from './localStorageService';
import { loadEditorContent } from './editorUtils';

/**
 * Save current tone editor content to a specific slot
 * @param slotNumber - Slot number (1-8)
 * @param slotName - Optional name for the slot
 * @returns true if successful, false otherwise
 */
export function saveToSlot(slotNumber: number, slotName?: string): boolean {
    try {
        if (slotNumber < 1 || slotNumber > SLOT_COUNT) {
            throw new Error(`Slot number must be between 1 and ${SLOT_COUNT}`);
        }
        
        const toneEditor = document.getElementById('toneEditor') as HTMLTextAreaElement | null;
        const jsonEditor = document.getElementById('jsonEditor') as HTMLTextAreaElement | null;
        
        if (!toneEditor || !jsonEditor) {
            throw new Error('Editor elements not found');
        }
        
        const slotData: SlotData = {
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
        const message = getStorageErrorMessage(error, `Failed to save to slot ${slotNumber}.`);
        window.alert(message);
        return false;
    }
}

/**
 * Load tone editor content from a specific slot
 * @param slotNumber - Slot number (1-8)
 * @returns true if successful, false otherwise
 */
export function loadFromSlot(slotNumber: number): boolean {
    try {
        if (slotNumber < 1 || slotNumber > SLOT_COUNT) {
            throw new Error(`Slot number must be between 1 and ${SLOT_COUNT}`);
        }
        
        const key = STORAGE_KEYS.SLOT_PREFIX + slotNumber;
        const slotDataStr = localStorage.getItem(key);
        
        if (!slotDataStr) {
            window.alert(`Slot ${slotNumber} is empty.`);
            return false;
        }
        
        const slotData: SlotData = JSON.parse(slotDataStr);
        
        // Use helper function to load content
        loadEditorContent(slotData, true);
        
        console.log(`Loaded from slot ${slotNumber}: ${slotData.name}`);
        
        // Auto-save after loading to sync with auto-save storage
        saveToneEditorToStorage();
        saveJsonEditorToStorage();
        
        return true;
    } catch (error) {
        console.error(`Error loading from slot ${slotNumber}:`, error);
        const err = error as { message?: string };
        window.alert(`Failed to load from slot ${slotNumber}. ${err.message || 'Please try again.'}`);
        return false;
    }
}

/**
 * Get information about all saved slots
 * @returns Array of slot info objects
 */
export function getAllSlots(): SlotInfo[] {
    const slots: SlotInfo[] = [];
    
    try {
        for (let i = 1; i <= SLOT_COUNT; i++) {
            const key = STORAGE_KEYS.SLOT_PREFIX + i;
            const slotDataStr = localStorage.getItem(key);
            
            if (slotDataStr) {
                try {
                    const slotData: SlotData = JSON.parse(slotDataStr);
                    slots.push({
                        number: i,
                        name: slotData.name || `Slot ${i}`,
                        timestamp: slotData.timestamp,
                        isEmpty: false,
                        isCorrupt: false
                    });
                } catch (e) {
                    console.error(`Error parsing slot ${i}:`, e);
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
        console.error('Error accessing localStorage:', error);
        for (let i = 1; i <= SLOT_COUNT; i++) {
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
 * @param slotNumber - Slot number (1-8)
 * @returns true if successful, false otherwise
 */
export function clearSlot(slotNumber: number): boolean {
    try {
        if (slotNumber < 1 || slotNumber > SLOT_COUNT) {
            throw new Error(`Slot number must be between 1 and ${SLOT_COUNT}`);
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
 * Export all 8 slots to a JSON file
 */
export function exportAllSlots(): void {
    try {
        const allSlotsData: AllSlotsExportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            slots: []
        };
        
        let corruptedCount = 0;
        
        for (let i = 1; i <= SLOT_COUNT; i++) {
            const key = STORAGE_KEYS.SLOT_PREFIX + i;
            const slotDataStr = localStorage.getItem(key);
            
            if (slotDataStr) {
                try {
                    const slotData: SlotData = JSON.parse(slotDataStr);
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
        
        const jsonStr = JSON.stringify(allSlotsData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ym2151-slots-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`Exported ${allSlotsData.slots.length} slots`);
        
        let successMessage = `Successfully exported ${allSlotsData.slots.length} slot(s)!`;
        if (corruptedCount > 0) {
            successMessage += `\n${corruptedCount} corrupted slot(s) were skipped.`;
        }
        window.alert(successMessage);
    } catch (error) {
        console.error('Error exporting slots:', error);
        const err = error as { message?: string };
        window.alert('Failed to export slots. ' + (err.message || 'Please try again.'));
    }
}

/**
 * Import all slots from a JSON file
 */
export function importAllSlots(): void {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        
        input.onchange = function(event: Event) {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e: ProgressEvent<FileReader>) {
                try {
                    const result = e.target?.result;
                    if (typeof result !== 'string') {
                        throw new Error('Failed to read file content');
                    }
                    
                    const importedData = JSON.parse(result) as AllSlotsExportData;
                    
                    if (!importedData.slots || !Array.isArray(importedData.slots)) {
                        throw new Error('Invalid file format: missing slots array');
                    }
                    
                    const message = `This will import ${importedData.slots.length} slot(s).\nExisting slots with the same numbers will be overwritten.\n\nContinue?`;
                    if (!window.confirm(message)) {
                        return;
                    }
                    
                    let importedCount = 0;
                    let errorCount = 0;
                    
                    importedData.slots.forEach(slot => {
                        try {
                            const slotNumber = slot.slotNumber;
                            
                            if (slotNumber < 1 || slotNumber > SLOT_COUNT) {
                                console.warn(`Invalid slot number: ${slotNumber}`);
                                errorCount++;
                                return;
                            }
                            
                            if (!slot.data) {
                                console.warn(`No data for slot ${slotNumber}`);
                                errorCount++;
                                return;
                            }
                            
                            const key = STORAGE_KEYS.SLOT_PREFIX + slotNumber;
                            localStorage.setItem(key, JSON.stringify(slot.data));
                            importedCount++;
                        } catch (e) {
                            console.error(`Error importing slot ${slot.slotNumber}:`, e);
                            errorCount++;
                        }
                    });
                    
                    // Refresh the UI (will be called by the global function)
                    if (typeof (window as any).refreshSlotInfo === 'function') {
                        (window as any).refreshSlotInfo();
                    }
                    
                    let resultMessage = `Successfully imported ${importedCount} slot(s)!`;
                    if (errorCount > 0) {
                        resultMessage += `\n${errorCount} slot(s) failed to import.`;
                    }
                    window.alert(resultMessage);
                    
                    console.log(`Import complete: ${importedCount} successful, ${errorCount} failed`);
                } catch (error) {
                    console.error('Error parsing imported file:', error);
                    const err = error as { message?: string };
                    window.alert('Failed to import slots. ' + (err.message || 'Invalid file format.'));
                }
            };
            
            reader.onerror = function() {
                window.alert('Failed to read file. Please try again.');
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    } catch (error) {
        console.error('Error importing slots:', error);
        const err = error as { message?: string };
        window.alert('Failed to import slots. ' + (err.message || 'Please try again.'));
    }
}
