/**
 * Idle Renderer
 * Pre-renders history and favorites items into the audio cache one-by-one
 * during browser idle time using requestIdleCallback (with setTimeout fallback).
 */

import { getHistory } from '../history/historyManager';
import { getFavorites } from '../favorites/favoritesManager';
import { hasCachedAudio, setCachedAudio } from './audioCache';
import { generateAudioFromJson } from './audioGenerator';
import { drawItemWaveform } from './itemWaveform';

// requestIdleCallback is not in lib.dom.d.ts for all targets; declare it manually.
declare function requestIdleCallback(
    callback: (deadline: { timeRemaining(): number; didTimeout: boolean }) => void,
    options?: { timeout?: number }
): number;
declare function cancelIdleCallback(id: number): void;

let pendingCallbackId: number | null = null;
let scheduledViaTimeout = false;

function getItemsToRender(): Array<{ id: string; jsonEditor: string; type: 'history' | 'favorite' }> {
    const history = getHistory().map(h => ({
        id: h.id,
        jsonEditor: h.jsonEditor,
        type: 'history' as const
    }));
    const favorites = getFavorites().map(f => ({
        id: f.id,
        jsonEditor: f.jsonEditor,
        type: 'favorite' as const
    }));
    return [...history, ...favorites];
}

function renderOneItem(): boolean {
    const items = getItemsToRender();
    const pending = items.find(item => !hasCachedAudio(item.jsonEditor));
    if (!pending) {
        return false; // Nothing left to render
    }

    const audioData = generateAudioFromJson(pending.jsonEditor);
    if (audioData) {
        setCachedAudio(pending.jsonEditor, audioData);
        drawItemWaveform(pending.id, pending.type, audioData.left);
    }
    return true;
}

function onIdle(deadline: { timeRemaining(): number; didTimeout: boolean }): void {
    pendingCallbackId = null;

    // Render as many items as we can within the idle window
    while (deadline.timeRemaining() > 5 || deadline.didTimeout) {
        const hadWork = renderOneItem();
        if (!hadWork) {
            return; // All items rendered; stop scheduling
        }
    }

    // More items remain – schedule next idle callback
    scheduleIdleRendering();
}

function onIdleTimeout(): void {
    pendingCallbackId = null;
    scheduledViaTimeout = false;
    const hadWork = renderOneItem();
    if (hadWork) {
        scheduleIdleRendering();
    }
}

/**
 * Schedule the next idle rendering pass (idempotent – safe to call multiple times).
 */
export function scheduleIdleRendering(): void {
    if (pendingCallbackId !== null) {
        return; // Already scheduled
    }

    if (typeof requestIdleCallback === 'function') {
        scheduledViaTimeout = false;
        pendingCallbackId = requestIdleCallback(onIdle, { timeout: 2000 });
    } else {
        scheduledViaTimeout = true;
        pendingCallbackId = window.setTimeout(onIdleTimeout, 1000) as unknown as number;
    }
}

/**
 * Cancel any pending idle rendering pass.
 */
export function cancelIdleRendering(): void {
    if (pendingCallbackId === null) {
        return;
    }
    if (!scheduledViaTimeout && typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(pendingCallbackId);
    } else {
        clearTimeout(pendingCallbackId);
    }
    pendingCallbackId = null;
}
