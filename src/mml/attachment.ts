import { YM2151Event } from '../types';

/**
 * Note/key registers are playback state, not tone definition.
 */
export function isNoteEvent(evt: YM2151Event): boolean {
    const addr = parseInt(evt.addr as string);
    return addr === 0x08 || (addr >= 0x28 && addr <= 0x37);
}

export function toneEventsForAttachment(events: YM2151Event[]): YM2151Event[] {
    return events.filter(evt => !isNoteEvent(evt));
}

export function eventsToProgramToneAttachmentJson(events: YM2151Event[], programChange = 0): string {
    return JSON.stringify([
        {
            ProgramChange: programChange,
            Tone: {
                type: 'YM2151 tone',
                events,
            },
        },
    ]);
}

export function buildAttachedMML(mml: string, toneEvents: YM2151Event[]): string {
    if (toneEvents.length === 0) {
        return mml;
    }

    return `${eventsToProgramToneAttachmentJson(toneEvents)}\n${mml}`;
}

