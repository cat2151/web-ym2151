/**
 * MML Playback Handler
 * Handles MML input, conversion, and playback integration
 */

import { convertMMLToYM2151JSON, initializeMMLConverter, isMMLConverterReady } from '../mml';
import { clearAudioCache, playAudioWithOverlay, playAudio } from '../audio';
import { updateDurationDisplay } from '../ui';
import { YM2151Event } from '../types';
import { parseToneEditorToJson, eventsToToneJsonString } from '../tone-editor';

/**
 * Get MML input textarea element
 */
function getMMLInput(): HTMLTextAreaElement | null {
    return document.getElementById('mmlInput') as HTMLTextAreaElement | null;
}

/**
 * Get JSON editor textarea element
 */
function getJSONEditor(): HTMLTextAreaElement | null {
    return document.getElementById('jsonEditor') as HTMLTextAreaElement | null;
}

/**
 * Get combined MML textarea element (shows tone JSON + MML)
 */
function getCombinedMMLEditor(): HTMLTextAreaElement | null {
    return document.getElementById('combinedMML') as HTMLTextAreaElement | null;
}

/**
 * Check if a YM2151 event is a note/key event (not a tone parameter register)
 * Note events: Key On/Off (0x08), KC (0x28-0x2F), KF (0x30-0x37)
 * Tone parameter events: 0x20-0x27, 0x38-0xFF
 */
function isNoteEvent(evt: YM2151Event): boolean {
    const addr = parseInt(evt.addr as string);
    return addr === 0x08 || (addr >= 0x28 && addr <= 0x37);
}

/**
 * Build tone initialization events from the tone editor (excluding key on/note)
 */
function getToneInitializationEvents(): YM2151Event[] {
    const toneData = parseToneEditorToJson();
    if (!toneData?.events?.length) {
        return [];
    }

    return toneData.events.filter(evt => {
        const addr = parseInt(evt.addr as string);
        return addr !== 0x08 && addr !== 0x28;
    });
}

/**
 * Play MML input by converting to YM2151 JSON and playing
 */
export async function playMMLInput(options?: { useOverlay?: boolean }): Promise<void> {
    const mmlInput = getMMLInput();
    const jsonEditor = getJSONEditor();
    const useOverlay = options?.useOverlay !== false;

    if (!mmlInput || !jsonEditor) {
        console.error('MML input or JSON editor not found');
        return;
    }

    let mml = mmlInput.value.trim();
    if (!mml) {
        mml = 'c';
        mmlInput.value = mml;
    }

    // Initialize WASM if not already done
    if (!isMMLConverterReady()) {
        const infoDiv = document.getElementById('info');
        if (infoDiv) {
            infoDiv.textContent = 'Initializing MML converter...';
        }

        const success = await initializeMMLConverter();
        if (!success) {
            alert('Failed to initialize MML converter. Please check the console for errors.');
            if (infoDiv) {
                infoDiv.textContent = 'Failed to initialize MML converter';
            }
            return;
        }

        if (infoDiv) {
            infoDiv.textContent = 'MML converter initialized';
        }
    }

    // Convert MML to YM2151 JSON
    const infoDiv = document.getElementById('info');
    if (infoDiv) {
        infoDiv.textContent = 'Converting MML...';
    }

    const ym2151Json = convertMMLToYM2151JSON(mml);
    if (!ym2151Json) {
        alert('Failed to convert MML. Please check the console for errors.');
        if (infoDiv) {
            infoDiv.textContent = 'Failed to convert MML';
        }
        return;
    }

    // Parse the result
    let result;
    try {
        result = JSON.parse(ym2151Json);
    } catch (e) {
        alert('Failed to parse conversion result: ' + (e as Error).message);
        if (infoDiv) {
            infoDiv.textContent = 'Failed to parse conversion result';
        }
        return;
    }

    // Check for errors in the result
    if (result.error) {
        alert('Conversion error: ' + result.error);
        if (infoDiv) {
            infoDiv.textContent = 'Conversion error: ' + result.error;
        }
        return;
    }

    // Update JSON editor with the converted events
    if (result.events && Array.isArray(result.events)) {
        const toneEvents = getToneInitializationEvents();

        // When tone events are available, strip the default tone initialization from the
        // MML-converted events so the edited tone is not overridden by the sine default.
        const mmlNoteEvents = toneEvents.length > 0
            ? (result.events as YM2151Event[]).filter(isNoteEvent)
            : (result.events as YM2151Event[]);

        const combinedEvents = [...toneEvents, ...mmlNoteEvents];

        jsonEditor.value = JSON.stringify({ events: combinedEvents }, null, 2);

        // Update combined MML textarea (tone JSON + MML text)
        const combinedMMLEditor = getCombinedMMLEditor();
        if (combinedMMLEditor) {
            const toneData = parseToneEditorToJson();
            const toneJson = toneData?.events?.length
                ? eventsToToneJsonString(toneData.events)
                : '';
            combinedMMLEditor.value = toneJson ? `${toneJson}\n${mml}` : mml;
        }

        // Update duration display
        updateDurationDisplay(combinedEvents);

        // Clear audio cache since we have new JSON
        clearAudioCache();

        if (infoDiv) {
            const totalEvents = combinedEvents.length;
            infoDiv.textContent = `✓ Converted MML to ${totalEvents} YM2151 events (tone + sequence)`;
        }

        // Automatically play the converted MML
        setTimeout(() => {
            if (useOverlay) {
                playAudioWithOverlay();
            } else {
                playAudio();
            }
        }, 100);
    } else {
        alert('Unexpected conversion result format');
        if (infoDiv) {
            infoDiv.textContent = 'Unexpected conversion result format';
        }
    }
}

/**
 * Play audio using MML pipeline (always), defaulting to "c" if no MML is entered.
 * This ensures the edited tone is always applied via the MML playback path.
 */
export function playWithMMLFallback(useOverlay: boolean = true): void {
    void playMMLInput({ useOverlay });
}
