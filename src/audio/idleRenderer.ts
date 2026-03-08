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
let debounceTimerId: number | null = null;

const IDLE_RENDERING_RESUME_DELAY_MS = 1500;

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
        // Free the WASM sample buffer now that we have the JS-side copy
        if (typeof Module !== 'undefined' && Module._free_buffer) {
            Module._free_buffer();
        }
        setCachedAudio(pending.jsonEditor, audioData);
        drawItemWaveform(pending.id, pending.type, audioData.left);
    }
    return true;
}

function onIdle(deadline: { timeRemaining(): number; didTimeout: boolean }): void {
    pendingCallbackId = null;

    // Limit work to 1 item per callback when the deadline has timed out to avoid
    // blocking the main thread.  When time is genuinely available, keep rendering.
    const limitToOne = deadline.didTimeout;
    let itemsProcessed = 0;

    while (deadline.timeRemaining() > 5 || (deadline.didTimeout && itemsProcessed < 1)) {
        const hadWork = renderOneItem();
        if (!hadWork) {
            return; // All items rendered; stop scheduling
        }
        itemsProcessed++;
        if (limitToOne) {
            break;
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
 * Cancel any pending idle rendering pass and any pending debounce timer.
 */
export function cancelIdleRendering(): void {
    if (debounceTimerId !== null) {
        clearTimeout(debounceTimerId);
        debounceTimerId = null;
    }
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

/**
 * Schedule idle rendering to start after a delay (debounced).
 * Cancels any existing idle rendering or pending debounce before setting the timer.
 * Use this after playback ends to avoid competing with active audio generation.
 */
export function scheduleIdleRenderingDebounced(): void {
    cancelIdleRendering();
    debounceTimerId = window.setTimeout(() => {
        debounceTimerId = null;
        scheduleIdleRendering();
    }, IDLE_RENDERING_RESUME_DELAY_MS);
}
