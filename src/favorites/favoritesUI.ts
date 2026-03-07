/**
 * Favorites UI
 * Renders and manages the collapsible "Favorites" section.
 */

import { getFavorites, removeFromFavorites, clearFavorites } from './favoritesManager';
import { getCachedAudio } from '../audio/audioCache';
import { drawWaveformOnCanvas } from '../audio/itemWaveform';
import { FavoriteEntry } from '../types';

const SECTION_ID = 'favoritesContent';
const BTN_ID = 'favoritesToggleBtn';
const LIST_ID = 'favoritesList';

/**
 * Toggle the favorites section visibility.
 */
export function toggleFavoritesSection(): void {
    const btn = document.getElementById(BTN_ID);
    const content = document.getElementById(SECTION_ID);
    const toggleText = btn?.querySelector('.toggle-text');

    if (!btn || !content) {
        return;
    }

    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!isExpanded));
    content.setAttribute('aria-hidden', String(isExpanded));
    content.style.display = isExpanded ? 'none' : 'block';

    if (toggleText) {
        const count = getFavorites().length;
        toggleText.textContent = isExpanded
            ? `Show Favorites (${count})`
            : `Hide Favorites (${count})`;
    }
}

/**
 * Re-render the full favorites list into the DOM.
 */
export function refreshFavoritesUI(): void {
    const list = document.getElementById(LIST_ID);
    if (!list) {
        return;
    }

    const favorites = getFavorites();

    // Update toggle button count
    const btn = document.getElementById(BTN_ID);
    if (btn) {
        const toggleText = btn.querySelector('.toggle-text');
        if (toggleText) {
            const isExpanded = btn.getAttribute('aria-expanded') === 'true';
            toggleText.textContent = isExpanded
                ? `Hide Favorites (${favorites.length})`
                : `Show Favorites (${favorites.length})`;
        }
    }

    if (favorites.length === 0) {
        list.innerHTML = '<p class="history-empty">No favorites yet. Press ☆ on a history item to add it here.</p>';
        return;
    }

    list.innerHTML = '';
    favorites.forEach(entry => {
        const item = buildFavoriteItem(entry);
        list.appendChild(item);
    });
}

function buildFavoriteItem(entry: FavoriteEntry): HTMLElement {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.dataset.id = entry.id;

    // Small waveform canvas
    const canvas = document.createElement('canvas');
    canvas.id = `fav-wave-${entry.id}`;
    canvas.width = 80;
    canvas.height = 24;
    canvas.className = 'item-waveform';
    canvas.setAttribute('aria-hidden', 'true');

    // Draw waveform if audio is already cached
    const cached = getCachedAudio(entry.jsonEditor);
    if (cached) {
        drawWaveformOnCanvas(canvas, cached.left);
    }

    // Label
    const label = document.createElement('span');
    label.className = 'item-label';
    label.textContent = entry.label;

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const loadBtn = document.createElement('button');
    loadBtn.textContent = 'Load';
    loadBtn.title = 'Load this tone into the editor';
    loadBtn.className = 'item-btn';
    loadBtn.addEventListener('click', () => loadFavoriteEntry(entry.id));

    const playBtn = document.createElement('button');
    playBtn.textContent = '▶ Play';
    playBtn.title = 'Play this tone';
    playBtn.className = 'item-btn';
    playBtn.addEventListener('click', () => playFavoriteEntry(entry.id));

    const delBtn = document.createElement('button');
    delBtn.textContent = '★ Remove';
    delBtn.title = 'Remove from favorites';
    delBtn.className = 'item-btn fav-btn fav-active';
    delBtn.addEventListener('click', () => deleteFavoriteEntry(entry.jsonEditor));

    actions.appendChild(loadBtn);
    actions.appendChild(playBtn);
    actions.appendChild(delBtn);

    div.appendChild(canvas);
    div.appendChild(label);
    div.appendChild(actions);

    return div;
}

function findFavoriteEntry(id: string): FavoriteEntry | undefined {
    return getFavorites().find(f => f.id === id);
}

function loadEditorContent(toneEditor: string, jsonEditor: string): void {
    const toneEl = document.getElementById('toneEditor') as HTMLTextAreaElement | null;
    const jsonEl = document.getElementById('jsonEditor') as HTMLTextAreaElement | null;
    if (toneEl) { toneEl.value = toneEditor; }
    if (jsonEl) { jsonEl.value = jsonEditor; }

    if (typeof (window as any).onToneEditorChange === 'function') {
        (window as any).onToneEditorChange();
    }
}

export function loadFavoriteEntry(id: string): void {
    const entry = findFavoriteEntry(id);
    if (!entry) { return; }
    loadEditorContent(entry.toneEditor, entry.jsonEditor);
}

export function playFavoriteEntry(id: string): void {
    const entry = findFavoriteEntry(id);
    if (!entry) { return; }
    loadEditorContent(entry.toneEditor, entry.jsonEditor);
    if (typeof (window as any).playJsonAudio === 'function') {
        (window as any).playJsonAudio();
    }
}

export function deleteFavoriteEntry(jsonEditor: string): void {
    removeFromFavorites(jsonEditor);
    refreshFavoritesUI();
    // Refresh history UI to update the ★ button state
    if (typeof (window as any).refreshHistoryUI === 'function') {
        (window as any).refreshHistoryUI();
    }
}

export function clearFavoritesAndRefresh(): void {
    clearFavorites();
    refreshFavoritesUI();
}
