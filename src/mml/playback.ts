/**
 * MML Playback Handler
 * Handles MML input, conversion, and playback integration
 */

import { convertMMLToYM2151JSON, initializeMMLConverter, isMMLConverterReady } from '../mml';
import { clearAudioCache, playAudioWithOverlay, playAudio } from '../audio';
import { updateDurationDisplay } from '../ui';
import { parseToneEditorToJson, onRegistersEditorChange } from '../tone-editor';
import { buildAttachedMML, toneEventsForAttachment } from './attachment';
import { extractLeadingJsonBlock } from './embeddedJson';

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
 * Get combined MML textarea element (shows attachment JSON + MML)
 */
function getCombinedMMLEditor(): HTMLTextAreaElement | null {
    return document.getElementById('combinedMML') as HTMLTextAreaElement | null;
}

/**
 * Build tone attachment events from the tone editor (excluding key on/note events)
 */
function getToneAttachmentEvents() {
    const toneData = parseToneEditorToJson();
    if (!toneData?.events?.length) {
        return [];
    }

    return toneEventsForAttachment(toneData.events);
}

/**
 * Parse content that may have a leading tone JSON or attachment JSON.
 * Tone JSON is the legacy single-tone editor format; attachment JSON is passed
 * through to the MML conversion libraries.
 */
export function parseCombinedMMLContent(content: string): { toneJson: string | null; attachmentJson: string | null; mml: string } {
    const trimmed = content.trim();
    const leadingJson = extractLeadingJsonBlock(trimmed);
    if (leadingJson) {
        try {
            const parsed = JSON.parse(leadingJson.json) as Record<string, unknown>;
            if (
                !Array.isArray(parsed) &&
                typeof parsed.registers === 'string' &&
                parsed.registers.length > 0 &&
                (parsed.type === undefined || parsed.type === 'YM2151 tone')
            ) {
                return { toneJson: leadingJson.json, attachmentJson: null, mml: leadingJson.rest.trim() };
            }
        } catch (_e) {
            // extractLeadingJsonBlock already validates JSON.
        }

        return { toneJson: null, attachmentJson: leadingJson.json, mml: leadingJson.rest.trim() };
    }

    return { toneJson: null, attachmentJson: null, mml: trimmed };
}

/**
 * Apply a tone JSON string to the registers editor and update all related editors.
 * Returns true if the tone JSON was successfully applied.
 */
function applyToneJsonString(toneJson: string): boolean {
    const registersEditor = document.getElementById('registersEditor') as HTMLTextAreaElement | null;
    if (registersEditor) {
        registersEditor.value = toneJson;
        onRegistersEditorChange();
        return true;
    }
    return false;
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
    }

    // Handle embedded tone/attachment JSON at the start of MML input
    const parsed = parseCombinedMMLContent(mml);
    if (parsed.toneJson) {
        applyToneJsonString(parsed.toneJson);
        mml = parsed.mml || 'c';
    } else if (parsed.attachmentJson) {
        mml = parsed.mml || 'c';
    }

    // Update mmlInput to reflect normalised value (trimmed / extracted MML)
    mmlInput.value = mml;

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

    const attachedMML = parsed.attachmentJson
        ? `${parsed.attachmentJson}\n${mml}`
        : buildAttachedMML(mml, getToneAttachmentEvents());
    const ym2151Json = convertMMLToYM2151JSON(attachedMML);
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
        jsonEditor.value = JSON.stringify(result, null, 2);

        // Update combined MML textarea (attachment JSON + MML text)
        const combinedMMLEditor = getCombinedMMLEditor();
        if (combinedMMLEditor) {
            combinedMMLEditor.value = attachedMML;
        }

        // Update duration display
        updateDurationDisplay(result.events, result);

        // Clear audio cache since we have new JSON
        clearAudioCache();

        if (infoDiv) {
            const totalEvents = result.events.length;
            infoDiv.textContent = `✓ Converted MML to ${totalEvents} YM2151 events`;
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
