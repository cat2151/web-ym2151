/**
 * Main Entry Point
 * Exports all public APIs and integrates with Emscripten
 */

// Export all modules
export * from './constants';
export * from './types';
export * from './ui';
export * from './presets';
export * from './storage';
export * from './tone-editor';
export * from './audio';
export * from './keyboard';
export * from './autoplay';
export * from './app';

// Import necessary functions for global scope
import { playSine, exportWav } from './audio';
import { 
    handleSaveSlot, 
    refreshSlotInfo, 
    exportAllSlots, 
    importAllSlots 
} from './storage';
import { onToneEditorChange, updateToneEditorFromJson } from './tone-editor';
import { loadToEditor } from './presets';
import { updateDurationDisplay } from './ui';
import { initializeApplication } from './app';

// Declare Emscripten Module interface
declare global {
    interface Window {
        Module: any;
        playSine: typeof playSine;
        exportWav: typeof exportWav;
        handleSaveSlot: typeof handleSaveSlot;
        refreshSlotInfo: typeof refreshSlotInfo;
        exportAllSlots: typeof exportAllSlots;
        importAllSlots: typeof importAllSlots;
        onToneEditorChange: typeof onToneEditorChange;
        parseJsonToToneEditor: typeof updateToneEditorFromJson;
        loadToEditor: typeof loadToEditor;
        updateDurationDisplay: typeof updateDurationDisplay;
    }
}

// Setup Emscripten Module configuration
if (typeof window !== 'undefined') {
    window.Module = {
        onRuntimeInitialized: initializeApplication
    };
    
    // Expose functions to global scope for HTML onclick handlers
    window.playSine = playSine;
    window.exportWav = exportWav;
    window.handleSaveSlot = handleSaveSlot;
    window.refreshSlotInfo = refreshSlotInfo;
    window.exportAllSlots = exportAllSlots;
    window.importAllSlots = importAllSlots;
    window.onToneEditorChange = onToneEditorChange;
    window.parseJsonToToneEditor = updateToneEditorFromJson; // Keep original name for compatibility
    window.loadToEditor = loadToEditor;
    window.updateDurationDisplay = updateDurationDisplay;
}
