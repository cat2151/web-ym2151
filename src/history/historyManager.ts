/**
 * History Manager
 * Tracks the last 20 played tones and persists them to localStorage.
 */

import { HistoryEntry } from '../types';
import { STORAGE_KEYS } from '../storage/constants';

const MAX_HISTORY = 20;

function formatLabel(date: Date): string {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `Played at ${h}:${m}:${s}`;
}

/**
 * Load history from localStorage.
 */
export function getHistory(): HistoryEntry[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
        if (!stored) {
            return [];
        }
        return JSON.parse(stored) as HistoryEntry[];
    } catch {
        return [];
    }
}

/**
 * Add a new entry to the front of the history list.
 * Duplicate JSON content (same jsonEditor value) is removed before inserting.
 * List is trimmed to MAX_HISTORY entries.
 * @returns the new HistoryEntry
 */
export function addToHistory(toneEditor: string, jsonEditor: string): HistoryEntry {
    const now = new Date();
    const entry: HistoryEntry = {
        id: `hist_${now.getTime()}`,
        timestamp: now.toISOString(),
        label: formatLabel(now),
        toneEditor,
        jsonEditor
    };

    const history = getHistory().filter(h => h.jsonEditor !== jsonEditor);
    history.unshift(entry);
    const trimmed = history.slice(0, MAX_HISTORY);

    try {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
    } catch (error) {
        console.warn('Failed to save history to localStorage:', error);
    }

    return entry;
}

/**
 * Remove a single history entry by id.
 */
export function removeFromHistory(id: string): void {
    const history = getHistory().filter(h => h.id !== id);
    try {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (error) {
        console.warn('Failed to save history to localStorage:', error);
    }
}

/**
 * Clear all history entries.
 */
export function clearHistory(): void {
    try {
        localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch (error) {
        console.warn('Failed to clear history from localStorage:', error);
    }
}
