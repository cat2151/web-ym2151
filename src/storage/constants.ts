/**
 * Constants for storage module
 */

import { StorageKeys } from '../types';

export const STORAGE_KEYS: StorageKeys = {
    TONE_EDITOR: 'ym2151_tone_editor',
    JSON_EDITOR: 'ym2151_json_editor',
    SLOT_PREFIX: 'ym2151_slot_'
};

export const AUTOSAVE_DEBOUNCE_MS = 1000;
export const SLOT_COUNT = 8;
export const PREVIEW_AUTO_RESTORE_MS = 3000;
