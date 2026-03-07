/**
 * Favorites Manager
 * Stores up to 20 user-saved favorite tones in localStorage.
 */

import { FavoriteEntry } from '../types';
import { STORAGE_KEYS } from '../storage/constants';

const MAX_FAVORITES = 20;

/**
 * Load favorites from localStorage.
 */
export function getFavorites(): FavoriteEntry[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
        if (!stored) {
            return [];
        }
        return JSON.parse(stored) as FavoriteEntry[];
    } catch {
        return [];
    }
}

/**
 * Add a tone to favorites.
 * Deduplicates by jsonEditor content so re-playing the same tone doesn't create duplicate entries.
 * Does nothing if the same json is already in favorites or the list is full.
 * @returns true if successfully added, false otherwise
 */
export function addToFavorites(entry: FavoriteEntry): boolean {
    const favorites = getFavorites();
    if (favorites.some(f => f.jsonEditor === entry.jsonEditor)) {
        return false;
    }
    if (favorites.length >= MAX_FAVORITES) {
        return false;
    }
    favorites.push(entry);
    try {
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
        return true;
    } catch (error) {
        console.warn('Failed to save favorites to localStorage:', error);
        return false;
    }
}

/**
 * Remove a favorite entry by its jsonEditor content (stable key).
 */
export function removeFromFavorites(jsonEditor: string): void {
    const favorites = getFavorites().filter(f => f.jsonEditor !== jsonEditor);
    try {
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (error) {
        console.warn('Failed to save favorites to localStorage:', error);
    }
}

/**
 * Check whether a tone (identified by its jsonEditor content) is already saved as a favorite.
 */
export function isFavorite(jsonEditor: string): boolean {
    return getFavorites().some(f => f.jsonEditor === jsonEditor);
}

/**
 * Clear all favorites.
 */
export function clearFavorites(): void {
    try {
        localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    } catch (error) {
        console.warn('Failed to clear favorites from localStorage:', error);
    }
}
