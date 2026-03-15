/**
 * JSON to Tone Editor Parser
 * Reverse operation: parses JSON events to populate tone editor
 */

import { YM2151Event } from '../types';
import { toHex } from '../ui';

/**
 * Parse JSON events and extract operator and global parameters
 * @param events - Array of YM2151 events
 * @returns Tone editor text
 */
export function parseJsonToToneEditor(events: YM2151Event[]): string {
    // Parse existing events and extract operator/global parameters
    const operators: Record<string, any>[] = [{}, {}, {}, {}];
    let con = 7;
    let fl = 0;
    let note = 0x4A;
    
    events.forEach(evt => {
        const addr = parseInt(evt.addr as string);
        const data = parseInt(evt.data as string);
        
        // 0x20: RL FL CON
        if (addr === 0x20) {
            con = data & 0x07;
            fl = (data >> 3) & 0x07;
        }
        // 0x28: Note (KC)
        else if (addr === 0x28) {
            note = data;
        }
        // Operator registers
        else {
            const bases = [0x40, 0x60, 0x80, 0xA0, 0xC0, 0xE0];
            // YM2151 hardware operator register order: OP1, OP3, OP2, OP4
            // Display order is: OP1, OP2, OP3, OP4 (user-friendly, matching ym2151-tone-editor)
            // This mapping converts from hardware register index to display row index
            const O1_O4_FROM_REG = [0, 2, 1, 3];
            
            for (const base of bases) {
                if (addr >= base && addr < base + 0x20) {
                    const opIndex = Math.floor((addr - base) / 8);
                    if (opIndex >= 0 && opIndex < 4) {
                        const op = operators[O1_O4_FROM_REG[opIndex]];
                        
                        if (base === 0x40) {
                            // DT1/MUL
                            op.DT1 = (data >> 4) & 0x7;
                            op.MUL = data & 0x0F;
                        } else if (base === 0x60) {
                            // TL
                            op.TL = data & 0x7F;
                        } else if (base === 0x80) {
                            // KS/AR
                            op.KS = (data >> 6) & 0x3;
                            op.AR = data & 0x1F;
                        } else if (base === 0xA0) {
                            // AMS-EN/D1R (DR)
                            op.AME = (data >> 7) & 0x1;
                            op.DR = data & 0x1F;
                        } else if (base === 0xC0) {
                            // DT2/D2R (SR)
                            op.DT2 = (data >> 6) & 0x3;
                            op.SR = data & 0x1F;
                        } else if (base === 0xE0) {
                            // D1L/RR
                            op.SL = (data >> 4) & 0x0F;
                            op.RR = data & 0x0F;
                        }
                    }
                    break;
                }
            }
        }
    });
    
    // Generate tone editor text from parsed values
    let text = '';
    for (let i = 0; i < 4; i++) {
        const op = operators[i];
        const tl = op.TL !== undefined ? op.TL : 0x00;
        const ar = op.AR !== undefined ? op.AR : 0x1F;
        const dr = op.DR !== undefined ? op.DR : 0x10;
        const sr = op.SR !== undefined ? op.SR : 0x00;
        const rr = op.RR !== undefined ? op.RR : 0x07;
        const sl = op.SL !== undefined ? op.SL : 0x00;
        const ks = op.KS !== undefined ? op.KS : 0;
        const mul = op.MUL !== undefined ? op.MUL : 0x01;
        const dt1 = op.DT1 !== undefined ? op.DT1 : 3;
        const dt2 = op.DT2 !== undefined ? op.DT2 : 0;
        const ame = op.AME !== undefined ? op.AME : 0;
        
        text += `TL=${toHex(tl).substring(2)} MUL=${toHex(mul).substring(2)} AR=${toHex(ar).substring(2)} DR=${toHex(dr).substring(2)} SL=${toHex(sl).substring(2)} SR=${toHex(sr).substring(2)} RR=${toHex(rr).substring(2)} DT1=${dt1} DT2=${dt2} AME=${ame} KS=${ks}\n`;
    }
    
    text += `CON=${con.toString(16).toUpperCase()} FL=${fl.toString(16).toUpperCase()} NOTE=${toHex(note).substring(2)}`;
    
    return text;
}

/**
 * Parse JSON events and populate tone editor element
 * @param events - Array of YM2151 events
 */
export function updateToneEditorFromJson(events: YM2151Event[]): void {
    const text = parseJsonToToneEditor(events);
    const toneEditor = document.getElementById('toneEditor') as HTMLTextAreaElement | null;
    if (toneEditor) {
        toneEditor.value = text;
    }
}
