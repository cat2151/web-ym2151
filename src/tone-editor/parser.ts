/**
 * Parameter Parser
 * Parses parameter lines from tone editor input
 */

import { OperatorParams } from '../types';

/**
 * Parse a parameter line like "TL=00 AR=1F DR=17"
 * @param line - Input line to parse
 * @returns Object with parsed parameters
 */
export function parseParamLine(line: string): Record<string, number> {
    const params: Record<string, number> = {};
    const parts = line.toUpperCase().split(/\s+/);
    
    for (const part of parts) {
        const match = part.match(/^([A-Z0-9]+)=([0-9A-F]+)$/);
        if (match) {
            const key = match[1];
            const value = parseInt(match[2], 16);
            params[key] = value;
        }
    }
    
    return params;
}

/**
 * Get default operator parameters
 */
export function getDefaultOperatorParams(): OperatorParams {
    return {
        TL: 0x00,
        AR: 0x1F,
        DR: 0x10,
        SR: 0x00,
        RR: 0x07,
        SL: 0x00,
        KS: 0,
        MUL: 0x01,
        DT1: 3
    };
}
