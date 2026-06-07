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
export * from './clipboard';

// Import necessary functions for global scope
import { exportWav, playAudioWithOverlay } from './audio';
import { onToneEditorChange, updateToneEditorFromJson } from './tone-editor';
import { loadToEditor, handlePresetChange } from './presets';
import { loadToneToEditor, handlePresetToneChange } from './preset-tones';
import { updateDurationDisplay } from './ui';
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
    clearHistoryAndRefresh,
    consumeHistoryPlay
} from './history';
import {
    toggleFavoritesSection,
    refreshFavoritesUI,
    clearFavoritesAndRefresh
} from './favorites';
import { initializeClipboardButtons } from './clipboard';

// Declare Emscripten Module interface
declare global {
    interface Window {
        Module: any;
        playAudio: typeof playWithMMLFallback;
        exportWav: typeof exportWav;
        onToneEditorChange: typeof onToneEditorChange;
        parseJsonToToneEditor: typeof updateToneEditorFromJson;
        loadToEditor: typeof loadToEditor;
        loadToneToEditor: typeof loadToneToEditor;
        handlePresetChange: typeof handlePresetChange;
        handlePresetToneChange: typeof handlePresetToneChange;
        updateDurationDisplay: typeof updateDurationDisplay;
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
        consumeHistoryPlay: () => boolean;
        clearHistoryAndRefresh: typeof clearHistoryAndRefresh;
        toggleFavoritesSection: typeof toggleFavoritesSection;
        refreshFavoritesUI: typeof refreshFavoritesUI;
        clearFavoritesAndRefresh: typeof clearFavoritesAndRefresh;
    }
}

// Setup Emscripten Module configuration
if (typeof window !== 'undefined') {
    window.Module = {
        onRuntimeInitialized: initializeApplication
    };
    
    // Expose functions to global scope for HTML onclick handlers
    window.playAudio = () => playWithMMLFallback();
    window.playJsonAudio = playAudioWithOverlay;
    window.exportWav = exportWav;
    window.onToneEditorChange = onToneEditorChange;
    window.parseJsonToToneEditor = updateToneEditorFromJson; // Keep original name for compatibility
    window.loadToEditor = loadToEditor;
    window.loadToneToEditor = loadToneToEditor;
    window.handlePresetChange = handlePresetChange;
    window.handlePresetToneChange = handlePresetToneChange;
    window.updateDurationDisplay = updateDurationDisplay;
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
    window.consumeHistoryPlay = consumeHistoryPlay;
    window.clearHistoryAndRefresh = clearHistoryAndRefresh;
    window.toggleFavoritesSection = toggleFavoritesSection;
    window.refreshFavoritesUI = refreshFavoritesUI;
    window.clearFavoritesAndRefresh = clearFavoritesAndRefresh;

    // Initialize history and favorites UI on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            refreshHistoryUI();
            refreshFavoritesUI();
            initializeClipboardButtons();
        });
    } else {
        refreshHistoryUI();
        refreshFavoritesUI();
        initializeClipboardButtons();
    }
}

