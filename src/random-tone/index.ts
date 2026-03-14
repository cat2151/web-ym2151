/**
 * Random Tone Generator Module
 * Re-exports all public APIs and provides UI interaction functions.
 */

import { playWithMMLFallback } from '../mml/playback';
import { RANDOM_TONE_STATUS_ID } from '../constants';
import { getCurrentConfig } from './config-manager';
import { generateRandomToneString } from './generator';

export * from './generator';
export {
    loadRandomConfig,
    exportRandomConfig,
    importRandomConfig,
    initializeRandomToneGenerator
} from './config-manager';

function showRandomToneBalloon(message: string): void {
    const el = document.getElementById(RANDOM_TONE_STATUS_ID);
    if (el) {
        el.textContent = message;
    }
}

export function hideRandomToneBalloon(): void {
    const el = document.getElementById(RANDOM_TONE_STATUS_ID);
    if (el) {
        el.textContent = '';
    }
}

/**
 * Generate random tone and update editor
 */
export function generateRandomTone(): void {
    const config = getCurrentConfig();
    if (!config) {
        console.error('Random config not loaded');
        return;
    }

    const toneEditor = document.getElementById('toneEditor') as HTMLTextAreaElement | null;
    if (!toneEditor) {
        console.error('Tone editor not found');
        return;
    }

    showRandomToneBalloon('⏳ Now generating...');

    // Defer heavy work so the browser can paint the balloon before processing starts.
    // The balloon is cleared when playback actually starts (in audioPlayer.ts).
    // A timeout fallback ensures the balloon is cleared if playback never starts
    // (e.g. MML conversion fails with an early return rather than a thrown error).
    const balloonClearTimeout = window.setTimeout(hideRandomToneBalloon, 8000);

    window.setTimeout(() => {
        try {
            toneEditor.value = generateRandomToneString(config, toneEditor.value);

            // Trigger change event to update JSON
            if (window.onToneEditorChange) {
                window.onToneEditorChange();
            }

            // Auto-play the generated tone
            playWithMMLFallback(false);
        } catch (e) {
            console.error('Random tone generation failed:', e);
            clearTimeout(balloonClearTimeout);
            hideRandomToneBalloon();
        }
    }, 0);
}

/**
 * Toggle random config section visibility
 */
export function toggleRandomConfigSection(): void {
    const btn = document.getElementById('randomConfigToggleBtn');
    const content = document.getElementById('randomConfigContent');
    const toggleText = btn?.querySelector('.toggle-text');

    if (!btn || !content) return;

    const isExpanded = btn.getAttribute('aria-expanded') === 'true';

    // Toggle state
    btn.setAttribute('aria-expanded', String(!isExpanded));
    content.setAttribute('aria-hidden', String(!isExpanded));
    content.style.display = isExpanded ? 'none' : 'block';

    // Update button text
    if (toggleText) {
        toggleText.textContent = isExpanded ? 'Show Config' : 'Hide Config';
    }
}
