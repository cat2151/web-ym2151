/**
 * Auto-play Manager
 * Manages auto-play on edit functionality
 */

import { playSine } from './audio';

const AUTO_PLAY_STORAGE_KEY = 'autoPlayOnEdit';

/**
 * Get auto-play preference from local storage
 */
export function getAutoPlayPreference(): boolean {
    const stored = localStorage.getItem(AUTO_PLAY_STORAGE_KEY);
    return stored === 'true'; // Default is false (OFF)
}

/**
 * Save auto-play preference to local storage
 */
export function saveAutoPlayPreference(enabled: boolean): void {
    localStorage.setItem(AUTO_PLAY_STORAGE_KEY, enabled.toString());
}

let checkboxElement: HTMLInputElement | null = null;

/**
 * Initialize auto-play checkbox
 */
export function initializeAutoPlayCheckbox(): void {
    const checkbox = document.getElementById('autoPlayCheckbox') as HTMLInputElement;
    if (!checkbox) return;
    
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
    if (checkboxElement && checkboxElement.checked) {
        playSine();
    }
}
