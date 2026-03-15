/**
 * Random Tone Generator Module
 * Re-exports all public APIs and provides UI interaction functions.
 * Uses the ym2151-tone-editor WASM library for random tone generation.
 */

import { playWithMMLFallback } from '../mml/playback';
import { RANDOM_TONE_STATUS_ID } from '../constants';
import { NOTE_TABLE } from '../midi/noteTable';
import { registersStringToEvents } from '../tone-editor/registersFormat';
import { updateToneEditorFromJson } from '../tone-editor/jsonParser';

export {
    loadRandomConfig,
    exportRandomConfig,
    importRandomConfig,
    initializeRandomToneGenerator
} from './config-manager';

/** URL of the ym2151-tone-editor WASM library (SSoT for random tone generation). */
const LIBRARY_URL = 'https://cat2151.github.io/ym2151-tone-editor/demo-library/pkg/ym2151_wasm.js';

/** Cached promise that resolves to the generate_random_tone_registers function. */
let wasmInitPromise: Promise<(seed: number, note: number) => string> | null = null;

/** Load and initialise the WASM library once, then return the generation function. */
function getGenerateRandomToneRegisters(): Promise<(seed: number, note: number) => string> {
    if (!wasmInitPromise) {
        wasmInitPromise = (async () => {
            // @ts-ignore: Runtime browser dynamic import of external URL –
            // TypeScript cannot verify the external module structure at compile time.
            const mod = await import(LIBRARY_URL) as {
                default: (input?: unknown) => Promise<unknown>;
                generate_random_tone_registers: (seed: number, note: number) => string;
            };
            await mod.default();
            return mod.generate_random_tone_registers;
        })();
    }
    return wasmInitPromise;
}

/**
 * Convert a YM2151 KC (Key Code) value to a MIDI note number.
 * Inverse of midiToKcKf() in ../midi/noteTable.
 */
export function kcToMidi(kc: number): number {
    const ymOctave = (kc >> 4) & 0x7;
    const ymNote = kc & 0x0F;
    const noteInOctave = (NOTE_TABLE as readonly number[]).indexOf(ymNote);
    if (noteInOctave === -1) return 69; // fallback to A4 for unrecognised note code
    return (ymOctave + 2) * 12 + noteInOctave + 1;
}

/** Default KC value (A4, matching the tone-editor default). */
const DEFAULT_KC_A4 = 0x4A;

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
 * Generate a random tone using the ym2151-tone-editor library and update the editor.
 */
export function generateRandomTone(): void {
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

    // Preserve the current note: read the KC value from the tone editor and convert to MIDI.
    const currentContent = toneEditor.value;
    const noteMatch = currentContent.match(/NOTE=([0-9A-Fa-f]+)/i);
    const currentKc = noteMatch ? parseInt(noteMatch[1], 16) : DEFAULT_KC_A4;
    const currentMidiNote = kcToMidi(currentKc);

    getGenerateRandomToneRegisters()
        .then((generateRegisters) => {
            window.setTimeout(() => {
                try {
                    // Use current timestamp as random seed for a different tone each call.
                    const registers = generateRegisters(Date.now(), currentMidiNote);
                    const events = registersStringToEvents(registers);
                    updateToneEditorFromJson(events);

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
        })
        .catch((e) => {
            console.error('Failed to load ym2151-tone-editor library:', e);
            clearTimeout(balloonClearTimeout);
            hideRandomToneBalloon();
        });
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
