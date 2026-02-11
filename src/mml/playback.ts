/**
 * MML Playback Handler
 * Handles MML input, conversion, and playback integration
 */

import { convertMMLToYM2151JSON, initializeMMLConverter, isMMLConverterReady } from '../mml';
import { clearAudioCache, playAudioWithOverlay } from '../audio';
import { updateDurationDisplay } from '../ui';
import { YM2151Event } from '../types';
import { parseToneEditorToJson } from '../tone-editor';

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
export async function playMMLInput(): Promise<void> {
    const mmlInput = getMMLInput();
    const jsonEditor = getJSONEditor();

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
        const combinedEvents = [...toneEvents, ...(result.events as YM2151Event[])];

        jsonEditor.value = JSON.stringify({ events: combinedEvents }, null, 2);

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
            playAudioWithOverlay();
        }, 100);
    } else {
        alert('Unexpected conversion result format');
        if (infoDiv) {
            infoDiv.textContent = 'Unexpected conversion result format';
        }
    }
}
