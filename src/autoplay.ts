/**
 * Auto-play Manager
 * Manages auto-play on edit functionality
 */

import { playWithMMLFallback } from './mml/playback';

const AUTO_PLAY_STORAGE_KEY = 'ym2151_auto_play_on_edit';

/**
 * Get auto-play preference from local storage
 */
export function getAutoPlayPreference(): boolean {
    try {
        const stored = localStorage.getItem(AUTO_PLAY_STORAGE_KEY);
        // Default is false (OFF) when value is not set or not 'true'
        return stored === 'true';
    } catch (error) {
        // Fall back to OFF if localStorage is unavailable or throws
        console.warn('Unable to read auto-play preference from localStorage; defaulting to OFF.', error);
        return false;
    }
}

/**
 * Save auto-play preference to local storage
 */
export function saveAutoPlayPreference(enabled: boolean): void {
    try {
        localStorage.setItem(AUTO_PLAY_STORAGE_KEY, enabled.toString());
    } catch (error) {
        // Fails silently with a non-blocking warning if localStorage is unavailable or quota is exceeded
        console.warn('Unable to save auto-play preference to localStorage.', error);
    }
}

let checkboxElement: HTMLInputElement | null = null;

/**
 * Initialize auto-play checkbox
 */
export function initializeAutoPlayCheckbox(): void {
    const checkbox = document.getElementById('autoPlayCheckbox');
    if (!checkbox || !(checkbox instanceof HTMLInputElement)) return;
    
    // Cache the checkbox element
    checkboxElement = checkbox;
    
    // Load saved preference
    checkbox.checked = getAutoPlayPreference();
    
    // Save preference when changed
    checkbox.addEventListener('change', () => {
        saveAutoPlayPreference(checkbox.checked);
    });
}

/**
 * Trigger auto-play if enabled
 */
export function triggerAutoPlay(): void {
    // Use cached element if available, otherwise query DOM as fallback
    const checkbox = checkboxElement || document.getElementById('autoPlayCheckbox');
    if (checkbox && checkbox instanceof HTMLInputElement && checkbox.checked) {
        playWithMMLFallback();
    }
}
