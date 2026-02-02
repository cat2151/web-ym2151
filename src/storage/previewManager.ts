/**
 * Preview Manager
 * Handles preview and restore functionality for slots
 */

import { PreviewBackup, SlotData } from '../types';
import { STORAGE_KEYS, PREVIEW_AUTO_RESTORE_MS } from './constants';
import { autoSaveState, saveToneEditorToStorage, saveJsonEditorToStorage } from './localStorageService';
import { loadEditorContent } from './editorUtils';

/**
 * State for preview operations
 */
class PreviewState {
    backup: PreviewBackup | null = null;
    lastPreviewedSlot: number | null = null;
    autoRestoreTimeout: number | null = null;

    hasBackup(): boolean {
        return this.backup !== null;
    }

    getLastPreviewedSlot(): number | null {
        return this.lastPreviewedSlot;
    }

    setBackup(backup: PreviewBackup): void {
        this.backup = backup;
    }

    clearBackup(): void {
        this.backup = null;
    }

    getBackup(): PreviewBackup | null {
        return this.backup;
    }

    setLastPreviewedSlot(slotNumber: number): void {
        this.lastPreviewedSlot = slotNumber;
    }

    clearLastPreviewedSlot(): void {
        this.lastPreviewedSlot = null;
    }

    setAutoRestoreTimeout(timeoutId: number): void {
        this.autoRestoreTimeout = timeoutId;
    }

    clearAutoRestoreTimeout(): void {
        if (this.autoRestoreTimeout !== null) {
            clearTimeout(this.autoRestoreTimeout);
            this.autoRestoreTimeout = null;
        }
    }
}

export const previewState = new PreviewState();

/**
 * Preview a slot by temporarily loading it and playing
 * @param slotNumber - Slot number (1-8) to preview
 */
export function previewSlot(slotNumber: number): void {
    previewState.clearAutoRestoreTimeout();
    
    // Backup current state if not already backed up
    if (!previewState.hasBackup()) {
        const toneEditor = document.getElementById('toneEditor') as HTMLTextAreaElement | null;
        const jsonEditor = document.getElementById('jsonEditor') as HTMLTextAreaElement | null;
        
        if (toneEditor && jsonEditor) {
            previewState.setBackup({
                toneEditor: toneEditor.value,
                jsonEditor: jsonEditor.value
            });
        }
    }
    
    // Pause auto-save to prevent overwriting the backup
    autoSaveState.pause();
    
    // Load the slot data
    const key = STORAGE_KEYS.SLOT_PREFIX + slotNumber;
    const slotDataStr = localStorage.getItem(key);
    
    if (!slotDataStr) {
        window.alert(`Slot ${slotNumber} is empty.`);
        autoSaveState.resume();
        return;
    }
    
    try {
        const slotData: SlotData = JSON.parse(slotDataStr);
        
        // Use helper function to load content
        loadEditorContent(slotData, true);
        
        // Store which slot was previewed
        previewState.setLastPreviewedSlot(slotNumber);
        
        // Show the "Load Previewed" button
        showLoadPreviewedButton();
        
        // Play the preview
        if (typeof (window as any).playSine === 'function') {
            (window as any).playSine();
        }
        
        // Auto-restore after configured timeout
        const timeoutId = window.setTimeout(() => {
            if (previewState.hasBackup()) {
                restoreBackup();
            }
        }, PREVIEW_AUTO_RESTORE_MS);
        previewState.setAutoRestoreTimeout(timeoutId);
        
        console.log(`Previewing slot ${slotNumber}: ${slotData.name}`);
    } catch (error) {
        console.error(`Error previewing slot ${slotNumber}:`, error);
        window.alert(`Failed to preview slot ${slotNumber}.`);
        autoSaveState.resume();
    }
}

/**
 * Restore the backed up tone state
 */
export function restoreBackup(): void {
    const backup = previewState.getBackup();
    if (!backup) return;
    
    previewState.clearAutoRestoreTimeout();
    
    // Use helper function to restore content
    loadEditorContent(backup, true);
    
    previewState.clearBackup();
    hideLoadPreviewedButton();
    
    // Resume auto-save after restore
    autoSaveState.resume();
    
    console.log('Restored backup');
}

/**
 * Load the last previewed slot permanently
 */
export function loadPreviewedSlot(): void {
    const lastSlot = previewState.getLastPreviewedSlot();
    if (lastSlot === null) return;
    
    previewState.clearAutoRestoreTimeout();
    
    // Clear the backup since we're committing to this tone
    previewState.clearBackup();
    hideLoadPreviewedButton();
    
    // Resume auto-save and save the loaded preview
    autoSaveState.resume();
    saveToneEditorToStorage();
    saveJsonEditorToStorage();
    
    console.log(`Loaded slot ${lastSlot} permanently`);
    window.alert(`Slot ${lastSlot} loaded!`);
}

/**
 * Show the "Load Previewed" button
 */
function showLoadPreviewedButton(): void {
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
function hideLoadPreviewedButton(): void {
    const buttonDiv = document.getElementById('loadPreviewedButtonDiv');
    if (buttonDiv) {
        buttonDiv.style.display = 'none';
    }
    previewState.clearLastPreviewedSlot();
}
