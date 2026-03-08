/**
 * Registers Format
 * Converts between YM2151 events and the registers tone format JSON
 */

import { YM2151Event } from '../types';
import { toHex } from '../ui';

/**
 * Convert events array to registers hex string.
 * Format: 2 hex chars for address + 2 hex chars for data, repeated.
 * @param events - Array of YM2151 events
 * @returns Registers hex string (e.g. "40016014801FA00A...")
 */
export function eventsToRegistersString(events: YM2151Event[]): string {
    return events.map(evt => {
        const addr = parseInt(evt.addr as string, 16);
        const data = parseInt(evt.data as string, 16);
        if (isNaN(addr) || isNaN(data)) return '';
        return addr.toString(16).toUpperCase().padStart(2, '0') +
               data.toString(16).toUpperCase().padStart(2, '0');
    }).join('');
}

/**
 * Convert registers hex string to events array.
 * @param registersStr - Hex string of register address/data pairs
 * @returns Array of YM2151 events
 */
export function registersStringToEvents(registersStr: string): YM2151Event[] {
    const events: YM2151Event[] = [];
    const str = registersStr.replace(/\s/g, '').toUpperCase();
    for (let i = 0; i + 4 <= str.length; i += 4) {
        const addrStr = str.substring(i, i + 2);
        const dataStr = str.substring(i + 2, i + 4);
        const addr = parseInt(addrStr, 16);
        const data = parseInt(dataStr, 16);
        if (!isNaN(addr) && !isNaN(data)) {
            events.push({
                time: 0.0,
                addr: toHex(addr),
                data: toHex(data)
            });
        }
    }
    return events;
}

/**
 * Get note number (KC value) from events via register 0x28 (channel 0 KC).
 * @param events - Array of YM2151 events
 * @returns KC value, or 0x4A (A4) as default
 */
function getNoteNumberFromEvents(events: YM2151Event[]): number {
    for (const evt of events) {
        if (parseInt(evt.addr as string, 16) === 0x28) {
            return parseInt(evt.data as string, 16);
        }
    }
    return 0x4A;
}

/**
 * Convert events to the YM2151 tone JSON string.
 * @param events - Array of YM2151 events
 * @returns JSON string with type, note_number and registers fields
 */
export function eventsToToneJsonString(events: YM2151Event[]): string {
    const registersStr = eventsToRegistersString(events);
    const noteNumber = getNoteNumberFromEvents(events);
    return JSON.stringify({
        type: 'YM2151 tone',
        note_number: noteNumber,
        registers: registersStr
    });
}

/**
 * Update the registers editor textarea from events.
 * @param events - Array of YM2151 events
 */
export function updateRegistersEditor(events: YM2151Event[]): void {
    const registersEditor = document.getElementById('registersEditor') as HTMLTextAreaElement | null;
    if (registersEditor) {
        registersEditor.value = eventsToToneJsonString(events);
    }
}
