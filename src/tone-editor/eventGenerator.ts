/**
 * Event Generator
 * Generates YM2151 register events from operator and global parameters
 */

import { YM2151Event, OperatorParams, GlobalParams } from '../types';
import { toHex } from '../ui';

/**
 * Generate YM2151 register events for Channel 0
 * @param operators - Array of 4 operator parameters
 * @param globalParams - Global parameters (CON, FL, NOTE)
 * @returns Array of YM2151 events
 */
export function generateEvents(
    operators: OperatorParams[],
    globalParams: GlobalParams
): YM2151Event[] {
    const events: YM2151Event[] = [];
    
    // 0x20: RL FL CON (Right/Left enable, Feedback Level, Connection algorithm)
    const rlFlCon = 0xC0 | ((globalParams.fl & 0x7) << 3) | (globalParams.con & 0x7);
    events.push({ time: 0.0, addr: "0x20", data: toHex(rlFlCon) });
    
    // YM2151 hardware operator register order: OP1, OP3, OP2, OP4
    // Display order is: OP1, OP2, OP3, OP4 (user-friendly, matching ym2151-tone-editor)
    // This mapping converts from display order index to hardware register index
    const REG_FROM_O1_O4 = [0, 2, 1, 3];

    // For each operator (0,1,2,3) on Channel 0
    for (let op = 0; op < 4; op++) {
        const params = operators[op];
        const opOffset = REG_FROM_O1_O4[op] * 8;
        
        // DT1/MUL (0x40 + opOffset)
        const dt1 = params.DT1 ?? 3;
        const mul = params.MUL ?? 1;
        const dt1Mul = ((dt1 & 0x7) << 4) | (mul & 0x0F);
        events.push({ time: 0.0, addr: toHex(0x40 + opOffset), data: toHex(dt1Mul) });
        
        // TL (0x60 + opOffset)
        const tl = params.TL ?? 0x00;
        events.push({ time: 0.0, addr: toHex(0x60 + opOffset), data: toHex(tl & 0x7F) });
        
        // KS/AR (0x80 + opOffset)
        const ks = params.KS ?? 0;
        const ar = params.AR ?? 0x1F;
        const ksAr = ((ks & 0x3) << 6) | (ar & 0x1F);
        events.push({ time: 0.0, addr: toHex(0x80 + opOffset), data: toHex(ksAr) });
        
        // AMS-EN/D1R (0xA0 + opOffset)
        const ame = params.AME ?? 0;
        const dr = params.DR ?? 0x10;
        const ameDr = ((ame & 0x1) << 7) | (dr & 0x1F);
        events.push({ time: 0.0, addr: toHex(0xA0 + opOffset), data: toHex(ameDr) });
        
        // DT2/D2R (0xC0 + opOffset)
        const dt2 = params.DT2 ?? 0;
        const sr = params.SR ?? 0x00;
        const dt2Sr = ((dt2 & 0x3) << 6) | (sr & 0x1F);
        events.push({ time: 0.0, addr: toHex(0xC0 + opOffset), data: toHex(dt2Sr) });
        
        // D1L/RR (0xE0 + opOffset)
        const sl = params.SL ?? 0x00;
        const rr = params.RR ?? 0x07;
        const slRr = ((sl & 0x0F) << 4) | (rr & 0x0F);
        events.push({ time: 0.0, addr: toHex(0xE0 + opOffset), data: toHex(slRr) });
    }
    
    // Note (KC - Key Code) (0x28 for channel 0)
    events.push({ time: 0.0, addr: "0x28", data: toHex(globalParams.note & 0x7F) });
    
    // KF (Key Fraction) (0x30 for channel 0)
    events.push({ time: 0.0, addr: "0x30", data: "0x00" });
    
    // Key On (0x08)
    events.push({ time: 0.0, addr: "0x08", data: "0x78" });
    
    return events;
}
