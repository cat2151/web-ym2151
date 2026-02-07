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
export * from './midi';
export * from './random-tone';
export * from './oscilloscope';
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
import { loadToEditor, handlePresetChange } from './presets';
import { loadToneToEditor, handlePresetToneChange } from './preset-tones';
import { updateDurationDisplay, toggleStorageSection } from './ui';
import { 
    generateRandomTone, 
    toggleRandomConfigSection, 
    exportRandomConfig, 
    importRandomConfig 
} from './random-tone';
import { toggleOscilloscopeSection } from './oscilloscope';
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
        handlePresetChange: typeof handlePresetChange;
        handlePresetToneChange: typeof handlePresetToneChange;
        updateDurationDisplay: typeof updateDurationDisplay;
        toggleStorageSection: typeof toggleStorageSection;
        generateRandomTone: typeof generateRandomTone;
        toggleRandomConfigSection: typeof toggleRandomConfigSection;
        exportRandomConfig: typeof exportRandomConfig;
        importRandomConfig: typeof importRandomConfig;
        toggleOscilloscopeSection: typeof toggleOscilloscopeSection;
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
    window.handlePresetChange = handlePresetChange;
    window.handlePresetToneChange = handlePresetToneChange;
    window.updateDurationDisplay = updateDurationDisplay;
    window.toggleStorageSection = toggleStorageSection;
    window.generateRandomTone = generateRandomTone;
    window.toggleRandomConfigSection = toggleRandomConfigSection;
    window.exportRandomConfig = exportRandomConfig;
    window.importRandomConfig = importRandomConfig;
    window.toggleOscilloscopeSection = toggleOscilloscopeSection;
}
