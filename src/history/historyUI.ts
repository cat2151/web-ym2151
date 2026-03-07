/**
 * History UI
 * Renders and manages the collapsible "History" section.
 */

import { getHistory, removeFromHistory, clearHistory } from './historyManager';
import { getFavorites, addToFavorites, removeFromFavorites, isFavorite } from '../favorites/favoritesManager';
import { getCachedAudio } from '../audio/audioCache';
import { drawWaveformOnCanvas } from '../audio/itemWaveform';
import { scheduleIdleRendering } from '../audio/idleRenderer';
import { HistoryEntry, FavoriteEntry } from '../types';

const SECTION_ID = 'historyContent';
const BTN_ID = 'historyToggleBtn';
const LIST_ID = 'historyList';

/**
 * Toggle the history section visibility.
 */
export function toggleHistorySection(): void {
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
        const count = getHistory().length;
        toggleText.textContent = isExpanded
            ? `Show History (${count})`
            : `Hide History (${count})`;
    }
}

/**
 * Re-render the full history list into the DOM.
 */
export function refreshHistoryUI(): void {
    const list = document.getElementById(LIST_ID);
    if (!list) {
        return;
    }

    const history = getHistory();

    // Update toggle button count
    const btn = document.getElementById(BTN_ID);
    if (btn) {
        const toggleText = btn.querySelector('.toggle-text');
        if (toggleText) {
            const isExpanded = btn.getAttribute('aria-expanded') === 'true';
            toggleText.textContent = isExpanded
                ? `Hide History (${history.length})`
                : `Show History (${history.length})`;
        }
    }

    if (history.length === 0) {
        list.innerHTML = '<p class="history-empty">No history yet. Play a tone to add it here.</p>';
        return;
    }

    list.innerHTML = '';
    history.forEach(entry => {
        const item = buildHistoryItem(entry);
        list.appendChild(item);
    });
}

function buildHistoryItem(entry: HistoryEntry): HTMLElement {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.dataset.id = entry.id;

    // Small waveform canvas
    const canvas = document.createElement('canvas');
    canvas.id = `hist-wave-${entry.id}`;
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
    loadBtn.addEventListener('click', () => loadHistoryEntry(entry.id));

    const playBtn = document.createElement('button');
    playBtn.textContent = '▶ Play';
    playBtn.title = 'Play this tone';
    playBtn.className = 'item-btn';
    playBtn.addEventListener('click', () => playHistoryEntry(entry.id));

    const isFav = isFavorite(entry.jsonEditor);

    const favBtn = document.createElement('button');
    favBtn.title = isFav ? 'Remove from favorites' : 'Add to favorites';
    favBtn.textContent = isFav ? '★' : '☆';
    favBtn.className = `item-btn fav-btn ${isFav ? 'fav-active' : ''}`;
    favBtn.addEventListener('click', () => toggleFavoriteFromHistory(entry.id));

    const delBtn = document.createElement('button');
    delBtn.textContent = '✕';
    delBtn.title = 'Remove from history';
    delBtn.className = 'item-btn del-btn';
    delBtn.addEventListener('click', () => deleteHistoryEntry(entry.id));

    actions.appendChild(loadBtn);
    actions.appendChild(playBtn);
    actions.appendChild(favBtn);
    actions.appendChild(delBtn);

    div.appendChild(canvas);
    div.appendChild(label);
    div.appendChild(actions);

    return div;
}

function findHistoryEntry(id: string): HistoryEntry | undefined {
    return getHistory().find(h => h.id === id);
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

export function loadHistoryEntry(id: string): void {
    const entry = findHistoryEntry(id);
    if (!entry) { return; }
    loadEditorContent(entry.toneEditor, entry.jsonEditor);
}

export function playHistoryEntry(id: string): void {
    const entry = findHistoryEntry(id);
    if (!entry) { return; }
    loadEditorContent(entry.toneEditor, entry.jsonEditor);
    if (typeof (window as any).playJsonAudio === 'function') {
        (window as any).playJsonAudio();
    }
}

export function toggleFavoriteFromHistory(id: string): void {
    const entry = findHistoryEntry(id);
    if (!entry) { return; }

    if (isFavorite(entry.jsonEditor)) {
        removeFromFavorites(entry.jsonEditor);
    } else {
        const favorites = getFavorites();
        if (favorites.length >= 20) {
            alert('Favorites list is full (max 20). Please remove a favorite first.');
            return;
        }
        const favEntry: FavoriteEntry = {
            id: entry.id,
            timestamp: entry.timestamp,
            label: entry.label,
            toneEditor: entry.toneEditor,
            jsonEditor: entry.jsonEditor
        };
        addToFavorites(favEntry);
    }

    // Refresh both UIs
    refreshHistoryUI();
    if (typeof (window as any).refreshFavoritesUI === 'function') {
        (window as any).refreshFavoritesUI();
    }
}

export function deleteHistoryEntry(id: string): void {
    removeFromHistory(id);
    refreshHistoryUI();
    scheduleIdleRendering();
}

export function clearHistoryAndRefresh(): void {
    clearHistory();
    refreshHistoryUI();
}
