/**
 * Type definitions for web-ym2151 application
 */

/**
 * Storage keys used in localStorage
 */
export interface StorageKeys {
    readonly TONE_EDITOR: string;
    readonly JSON_EDITOR: string;
    readonly HISTORY: string;
    readonly FAVORITES: string;
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
 * History entry – one recently-played tone
 */
export interface HistoryEntry {
    id: string;
    timestamp: string;
    label: string;
    toneEditor: string;
    jsonEditor: string;
}

/**
 * Favorite entry – one user-saved tone
 */
export interface FavoriteEntry {
    id: string;
    timestamp: string;
    label: string;
    toneEditor: string;
    jsonEditor: string;
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
    DT2?: number;
    AME?: number;
}

/**
 * Global tone parameters
 */
export interface GlobalParams {
    con: number;
    fl: number;
    note: number;
}
