/**
 * Local Storage Service
 * Handles auto-save and load operations for tone and JSON editors
 */

import { STORAGE_KEYS } from './constants';
import { getStorageErrorMessage } from './errorHandler';

/**
 * State for controlling auto-save behavior
 */
class AutoSaveState {
    private paused = false;

    isPaused(): boolean {
        return this.paused;
    }

    pause(): void {
        this.paused = true;
    }

    resume(): void {
        this.paused = false;
    }
}

export const autoSaveState = new AutoSaveState();

/**
 * Save tone editor content to local storage
 */
export function saveToneEditorToStorage(): void {
    if (autoSaveState.isPaused()) {
        console.log('Auto-save paused during preview');
        return;
    }
    
    try {
        const toneEditor = document.getElementById('toneEditor') as HTMLTextAreaElement | null;
        if (toneEditor) {
            localStorage.setItem(STORAGE_KEYS.TONE_EDITOR, toneEditor.value);
            console.log('Tone editor saved to local storage');
        }
    } catch (error) {
        console.error('Error saving tone editor to local storage:', error);
        const message = getStorageErrorMessage(error, 'Failed to save tone editor content.');
        window.alert(message);
    }
}

/**
 * Save JSON editor content to local storage
 */
export function saveJsonEditorToStorage(): void {
    if (autoSaveState.isPaused()) {
        console.log('Auto-save paused during preview');
        return;
    }
    
    try {
        const jsonEditor = document.getElementById('jsonEditor') as HTMLTextAreaElement | null;
        if (jsonEditor) {
            localStorage.setItem(STORAGE_KEYS.JSON_EDITOR, jsonEditor.value);
            console.log('JSON editor saved to local storage');
        }
    } catch (error) {
        console.error('Error saving JSON editor to local storage:', error);
        const message = getStorageErrorMessage(error, 'Failed to save JSON editor content.');
        window.alert(message);
    }
}

/**
 * Load saved content from local storage and populate editors
 * @returns true if saved data was found and loaded, false otherwise
 */
export function loadFromStorage(): boolean {
    try {
        const savedToneEditor = localStorage.getItem(STORAGE_KEYS.TONE_EDITOR);
        const savedJsonEditor = localStorage.getItem(STORAGE_KEYS.JSON_EDITOR);
        
        if (savedToneEditor !== null) {
            const toneEditor = document.getElementById('toneEditor') as HTMLTextAreaElement | null;
            if (toneEditor) {
                toneEditor.value = savedToneEditor;
                console.log('Tone editor loaded from local storage');
                
                // Trigger tone editor change to update JSON
                if (typeof (window as any).onToneEditorChange === 'function') {
                    (window as any).onToneEditorChange();
                }
            }
            return true;
        } else if (savedJsonEditor !== null) {
            const jsonEditor = document.getElementById('jsonEditor') as HTMLTextAreaElement | null;
            if (jsonEditor) {
                jsonEditor.value = savedJsonEditor;
                console.log('JSON editor loaded from local storage');
                
                try {
                    const data = JSON.parse(savedJsonEditor);
                    if (data.events && Array.isArray(data.events)) {
                        if (typeof (window as any).parseJsonToToneEditor === 'function') {
                            (window as any).parseJsonToToneEditor(data.events);
                        }
                        if (typeof (window as any).updateDurationDisplay === 'function') {
                            (window as any).updateDurationDisplay(data.events);
                        }
                    }
                } catch (e) {
                    console.error('Error parsing saved JSON:', e);
                }
            }
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error loading from local storage:', error);
        return false;
    }
}

/**
 * Clear all saved data from local storage
 */
export function clearStorage(): void {
    try {
        localStorage.removeItem(STORAGE_KEYS.TONE_EDITOR);
        localStorage.removeItem(STORAGE_KEYS.JSON_EDITOR);
        console.log('Local storage cleared');
    } catch (error) {
        console.error('Error clearing local storage:', error);
    }
}
