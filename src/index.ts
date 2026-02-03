/**
 * Main Entry Point
 * Exports all public APIs and integrates with Emscripten
 */

// Export all modules
export * from './constants';
export * from './types';
export * from './ui';
export * from './presets';
export * from './preset-tones';
export * from './storage';
export * from './tone-editor';
export * from './audio';
export * from './keyboard';
export * from './autoplay';
export * from './app';

// Import necessary functions for global scope
import { playAudio, exportWav } from './audio';
import { 
    handleSaveSlot, 
    refreshSlotInfo, 
    exportAllSlots, 
    importAllSlots 
} from './storage';
import { onToneEditorChange, updateToneEditorFromJson } from './tone-editor';
import { loadToEditor } from './presets';
import { loadToneToEditor } from './preset-tones';
import { updateDurationDisplay } from './ui';
import { initializeApplication } from './app';

// Declare Emscripten Module interface
declare global {
    interface Window {
        Module: any;
        playAudio: typeof playAudio;
        exportWav: typeof exportWav;
        handleSaveSlot: typeof handleSaveSlot;
        refreshSlotInfo: typeof refreshSlotInfo;
        exportAllSlots: typeof exportAllSlots;
        importAllSlots: typeof importAllSlots;
        onToneEditorChange: typeof onToneEditorChange;
        parseJsonToToneEditor: typeof updateToneEditorFromJson;
        loadToEditor: typeof loadToEditor;
        loadToneToEditor: typeof loadToneToEditor;
        updateDurationDisplay: typeof updateDurationDisplay;
    }
}

// Setup Emscripten Module configuration
if (typeof window !== 'undefined') {
    window.Module = {
        onRuntimeInitialized: initializeApplication
    };
    
    // Expose functions to global scope for HTML onclick handlers
    window.playAudio = playAudio;
    window.exportWav = exportWav;
    window.handleSaveSlot = handleSaveSlot;
    window.refreshSlotInfo = refreshSlotInfo;
    window.exportAllSlots = exportAllSlots;
    window.importAllSlots = importAllSlots;
    window.onToneEditorChange = onToneEditorChange;
    window.parseJsonToToneEditor = updateToneEditorFromJson; // Keep original name for compatibility
    window.loadToEditor = loadToEditor;
    window.loadToneToEditor = loadToneToEditor;
    window.updateDurationDisplay = updateDurationDisplay;
}
