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

// Constants
export {
    STORAGE_KEYS,
    AUTOSAVE_DEBOUNCE_MS
} from './constants';
