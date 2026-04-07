import { YM2151Event } from '../types';
import { toHex } from '../hex';

function parseHexAddress(addr: string): number {
    return parseInt(addr, 16);
}

function getNoteChannels(noteEvents: YM2151Event[]): number[] {
    const channels = new Set<number>();

    for (const event of noteEvents) {
        const addr = parseHexAddress(event.addr);
        if (addr >= 0x28 && addr <= 0x37) {
            channels.add(addr & 0x07);
        }
    }

    return channels.size > 0 ? [...channels].sort((a, b) => a - b) : [0];
}

function copyToneEventsToChannel(toneEvents: YM2151Event[], channel: number): YM2151Event[] {
    if (channel === 0) {
        return toneEvents.map(event => ({ ...event }));
    }

    return toneEvents.map(event => {
        const addr = parseHexAddress(event.addr);
        return {
            ...event,
            addr: toHex(addr + channel)
        };
    });
}

export function mergeToneInitializationWithMMLNoteEvents(
    toneEvents: YM2151Event[],
    noteEvents: YM2151Event[]
): YM2151Event[] {
    if (toneEvents.length === 0) {
        return [...noteEvents];
    }

    const expandedToneEvents = getNoteChannels(noteEvents).flatMap(channel =>
        copyToneEventsToChannel(toneEvents, channel)
    );

    return [...expandedToneEvents, ...noteEvents];
}
