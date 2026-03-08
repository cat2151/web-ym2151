/**
 * Tone Editor Module - Main Export
 * Converts tone editor text to JSON and vice versa
 */

import { JsonEditorData, OperatorParams, GlobalParams } from '../types';
import { parseParamLine, getDefaultOperatorParams } from './parser';
import { generateEvents } from './eventGenerator';
import { updateDurationDisplay } from '../ui';
import { updateRegistersEditor, registersStringToEvents, eventsToToneJsonString } from './registersFormat';
import { updateToneEditorFromJson } from './jsonParser';

// Export both JSON parser functions with their original names
export { parseJsonToToneEditor, updateToneEditorFromJson } from './jsonParser';

// Export registers format utilities
export { eventsToRegistersString, eventsToToneJsonString } from './registersFormat';

/**
 * Parse tone editor textarea and generate YM2151 register events
 * @returns JSON editor data or null if parsing fails
 */
export function parseToneEditorToJson(): JsonEditorData | null {
    const toneEditor = document.getElementById('toneEditor') as HTMLTextAreaElement | null;
    if (!toneEditor) return null;
    
    const lines = toneEditor.value.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        return null;
    }
    
    const operators: OperatorParams[] = [];
    let globalParams: GlobalParams = { con: 7, fl: 0, note: 0x4A };
    
    // Parse each line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Check if this is a global parameter line
        const upperLine = line.toUpperCase();
        if (upperLine.includes('CON=') || upperLine.includes('FL=') || upperLine.includes('NOTE=')) {
            const params = parseParamLine(line);
            if (params.CON !== undefined) globalParams.con = params.CON;
            if (params.FL !== undefined) globalParams.fl = params.FL;
            if (params.NOTE !== undefined) globalParams.note = params.NOTE;
        } else {
            // Parse operator parameters
            const opParams = parseParamLine(line);
            operators.push(opParams);
        }
    }
    
    // Ensure we have exactly 4 operators
    while (operators.length < 4) {
        operators.push(getDefaultOperatorParams());
    }
    
    // Generate register events
    const events = generateEvents(operators, globalParams);
    
    return { events };
}

/**
 * Update JSON textarea when tone editor changes
 */
export function onToneEditorChange(): void {
    const result = parseToneEditorToJson();
    if (result) {
        const jsonEditor = document.getElementById('jsonEditor') as HTMLTextAreaElement | null;
        if (jsonEditor) {
            jsonEditor.value = JSON.stringify(result, null, 2);
        }
        updateDurationDisplay(result.events);
        updateRegistersEditor(result.events);
    }
}

/**
 * Update JSON and tone editor when registers editor changes
 */
export function onRegistersEditorChange(): void {
    const registersEditor = document.getElementById('registersEditor') as HTMLTextAreaElement | null;
    if (!registersEditor) return;

    try {
        const json: unknown = JSON.parse(registersEditor.value);
        if (typeof json === 'object' && json !== null) {
            const registersJson = json as { type?: unknown; registers?: unknown };

            // If a type is declared, require it to match the expected YM2151 tone format
            if (registersJson.type !== undefined && registersJson.type !== 'YM2151 tone') {
                return;
            }

            if (typeof registersJson.registers === 'string') {
                const events = registersStringToEvents(registersJson.registers);
                if (events.length > 0) {
                    // Normalize the registers editor content to keep it self-consistent
                    // (recomputes note_number from the KC register in the parsed events)
                    registersEditor.value = eventsToToneJsonString(events);

                    const jsonEditor = document.getElementById('jsonEditor') as HTMLTextAreaElement | null;
                    if (jsonEditor) {
                        jsonEditor.value = JSON.stringify({ events }, null, 2);
                    }
                    // Update tone editor text without triggering its change handler
                    updateToneEditorFromJson(events);
                    updateDurationDisplay(events);
                }
            }
        }
    } catch (_e) {
        // Invalid JSON – ignore silently
    }
}
