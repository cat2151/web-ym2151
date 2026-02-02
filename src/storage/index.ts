/**
 * Storage Module - Main Export
 * Provides a unified interface for all storage functionality
 */

// Local Storage Service
export {
    saveToneEditorToStorage,
    saveJsonEditorToStorage,
    loadFromStorage,
    clearStorage
} from './localStorageService';

// Slot Manager
export {
    saveToSlot,
    loadFromSlot,
    getAllSlots,
    clearSlot,
    exportAllSlots,
    importAllSlots
} from './slotManager';

// Preview Manager
export {
    previewSlot,
    restoreBackup,
    loadPreviewedSlot
} from './previewManager';

// UI Manager
export {
    handleSaveSlot,
    refreshSlotInfo,
    initializeSlotUI
} from './uiManager';

// Constants
export {
    STORAGE_KEYS,
    AUTOSAVE_DEBOUNCE_MS
} from './constants';
