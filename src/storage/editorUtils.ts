/**
 * Editor Utilities
 * Helper functions for loading editor content
 */

import { SlotData, PreviewBackup } from '../types';

/**
 * Load editor content from slot data or preview backup
 * @param data - Data to load (SlotData or PreviewBackup)
 * @param triggerCallbacks - Whether to trigger callbacks (default: true)
 */
export function loadEditorContent(
    data: SlotData | PreviewBackup,
    triggerCallbacks = true
): void {
    const toneEditor = document.getElementById('toneEditor') as HTMLTextAreaElement | null;
    const jsonEditor = document.getElementById('jsonEditor') as HTMLTextAreaElement | null;
    
    if (toneEditor && data.toneEditor !== undefined) {
        toneEditor.value = data.toneEditor;
        
        if (triggerCallbacks && typeof (window as any).onToneEditorChange === 'function') {
            (window as any).onToneEditorChange();
        }
    }
    
    if (jsonEditor && data.jsonEditor !== undefined) {
        jsonEditor.value = data.jsonEditor;
        
        if (triggerCallbacks) {
            try {
                const jsonData = JSON.parse(data.jsonEditor);
                if (jsonData.events && Array.isArray(jsonData.events)) {
                    if (typeof (window as any).updateDurationDisplay === 'function') {
                        (window as any).updateDurationDisplay(jsonData.events);
                    }
                }
            } catch (e) {
                console.error('Error parsing JSON from data:', e);
            }
        }
    }
}
