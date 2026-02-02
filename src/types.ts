/**
 * Type definitions for web-ym2151 application
 */

/**
 * Storage keys used in localStorage
 */
export interface StorageKeys {
    readonly TONE_EDITOR: string;
    readonly JSON_EDITOR: string;
    readonly SLOT_PREFIX: string;
}

/**
 * Slot data stored in localStorage
 */
export interface SlotData {
    toneEditor: string;
    jsonEditor: string;
    timestamp: string;
    name: string;
}

/**
 * Slot information for display
 */
export interface SlotInfo {
    number: number;
    name: string;
    timestamp: string | null;
    isEmpty: boolean;
    isCorrupt: boolean;
}

/**
 * Backup data for preview functionality
 */
export interface PreviewBackup {
    toneEditor: string;
    jsonEditor: string;
}

/**
 * All slots export data structure
 */
export interface AllSlotsExportData {
    version: string;
    exportDate: string;
    slots: Array<{
        slotNumber: number;
        data: SlotData;
    }>;
}

/**
 * YM2151 event structure
 */
export interface YM2151Event {
    time: number;
    addr: string;
    data: string;
}

/**
 * JSON editor data structure
 */
export interface JsonEditorData {
    events: YM2151Event[];
}

/**
 * Operator parameters for tone editor
 */
export interface OperatorParams {
    TL?: number;
    AR?: number;
    DR?: number;
    SR?: number;
    RR?: number;
    SL?: number;
    KS?: number;
    MUL?: number;
    DT1?: number;
}

/**
 * Global tone parameters
 */
export interface GlobalParams {
    con: number;
    fl: number;
    note: number;
}
