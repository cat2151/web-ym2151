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
export * from './mml';
export * from './app';
export * from './history';
export * from './favorites';

// Import necessary functions for global scope
import { exportWav, playAudioWithOverlay } from './audio';
import { 
    handleSaveSlot, 
    refreshSlotInfo, 
    exportAllSlots, 
    importAllSlots,
    initializeSlotUI 
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
import { playMMLInput, playWithMMLFallback } from './mml/playback';
import { initializeApplication } from './app';
import {
    toggleHistorySection,
    refreshHistoryUI,
    addToHistory,
    clearHistoryAndRefresh
} from './history';
import {
    toggleFavoritesSection,
    refreshFavoritesUI,
    clearFavoritesAndRefresh
} from './favorites';

// Declare Emscripten Module interface
declare global {
    interface Window {
        Module: any;
        playAudio: typeof playWithMMLFallback;
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
        playMML: typeof playMMLInput;
        playJsonAudio: typeof playAudioWithOverlay;
        toggleHistorySection: typeof toggleHistorySection;
        refreshHistoryUI: typeof refreshHistoryUI;
        addToHistoryAndRefresh: (toneEditor: string, jsonEditor: string) => void;
        clearHistoryAndRefresh: typeof clearHistoryAndRefresh;
        toggleFavoritesSection: typeof toggleFavoritesSection;
        refreshFavoritesUI: typeof refreshFavoritesUI;
        clearFavoritesAndRefresh: typeof clearFavoritesAndRefresh;
    }
}

// Setup Emscripten Module configuration
if (typeof window !== 'undefined') {
    initializeSlotUI();

    window.Module = {
        onRuntimeInitialized: initializeApplication
    };
    
    // Expose functions to global scope for HTML onclick handlers
    window.playAudio = () => playWithMMLFallback();
    window.playJsonAudio = playAudioWithOverlay;
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
    window.playMML = playMMLInput;
    window.toggleHistorySection = toggleHistorySection;
    window.refreshHistoryUI = refreshHistoryUI;
    window.addToHistoryAndRefresh = (toneEditor: string, jsonEditor: string) => {
        addToHistory(toneEditor, jsonEditor);
        refreshHistoryUI();
    };
    window.clearHistoryAndRefresh = clearHistoryAndRefresh;
    window.toggleFavoritesSection = toggleFavoritesSection;
    window.refreshFavoritesUI = refreshFavoritesUI;
    window.clearFavoritesAndRefresh = clearFavoritesAndRefresh;

    // Initialize history and favorites UI on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            refreshHistoryUI();
            refreshFavoritesUI();
        });
    } else {
        refreshHistoryUI();
        refreshFavoritesUI();
    }
}

