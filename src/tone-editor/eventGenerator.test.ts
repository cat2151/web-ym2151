/**
 * Tests for YM2151 event generator
 */

import { describe, it, expect } from 'vitest';
import { generateEvents } from './eventGenerator';
import { OperatorParams, GlobalParams } from '../types';

const defaultOperator: OperatorParams = {
    TL: 0x00,
    AR: 0x1F,
    DR: 0x10,
    SR: 0x00,
    RR: 0x07,
    SL: 0x00,
    KS: 0,
    MUL: 0x01,
    DT1: 3,
    DT2: 0,
    AME: 0,
};

const defaultGlobal: GlobalParams = {
    con: 7,
    fl: 0,
    note: 0x4A,
};

describe('generateEvents', () => {
    it('returns an array of events', () => {
        const ops = [defaultOperator, defaultOperator, defaultOperator, defaultOperator];
        const events = generateEvents(ops, defaultGlobal);
        expect(Array.isArray(events)).toBe(true);
        expect(events.length).toBeGreaterThan(0);
    });

    it('all events have time = 0.0', () => {
        const ops = [defaultOperator, defaultOperator, defaultOperator, defaultOperator];
        const events = generateEvents(ops, defaultGlobal);
        for (const evt of events) {
            expect(evt.time).toBe(0.0);
        }
    });

    it('all events have addr and data as "0x"-prefixed uppercase hex strings', () => {
        const ops = [defaultOperator, defaultOperator, defaultOperator, defaultOperator];
        const events = generateEvents(ops, defaultGlobal);
        for (const evt of events) {
            expect(evt.addr).toMatch(/^0x[0-9A-F]{2}$/);
            expect(evt.data).toMatch(/^0x[0-9A-F]{2}$/);
        }
    });

    it('includes a 0x20 (RL FL CON) event', () => {
        const ops = [defaultOperator, defaultOperator, defaultOperator, defaultOperator];
        const events = generateEvents(ops, defaultGlobal);
        const evt = events.find(e => e.addr === '0x20');
        expect(evt).toBeDefined();
    });

    it('encodes CON=7 and FL=0 into the 0x20 register correctly', () => {
        // 0xC0 | (fl=0 << 3) | con=7 = 0xC7
        const ops = [defaultOperator, defaultOperator, defaultOperator, defaultOperator];
        const events = generateEvents(ops, { con: 7, fl: 0, note: 0x4A });
        const evt = events.find(e => e.addr === '0x20');
        expect(evt?.data).toBe('0xC7');
    });

    it('encodes FL into bits [5:3] of register 0x20', () => {
        const ops = [defaultOperator, defaultOperator, defaultOperator, defaultOperator];
        // FL=4, CON=0 → 0xC0 | (4 << 3) | 0 = 0xC0 | 0x20 = 0xE0
        const events = generateEvents(ops, { con: 0, fl: 4, note: 0x4A });
        const evt = events.find(e => e.addr === '0x20');
        const val = parseInt(evt!.data, 16);
        expect((val >> 3) & 0x7).toBe(4);
    });

    it('includes a 0x28 (KC) event with the correct note value', () => {
        const ops = [defaultOperator, defaultOperator, defaultOperator, defaultOperator];
        const events = generateEvents(ops, { con: 7, fl: 0, note: 0x3A });
        const evt = events.find(e => e.addr === '0x28');
        expect(evt).toBeDefined();
        expect(evt?.data).toBe('0x3A');
    });

    it('includes a 0x30 (KF) event set to 0x00', () => {
        const ops = [defaultOperator, defaultOperator, defaultOperator, defaultOperator];
        const events = generateEvents(ops, defaultGlobal);
        const evt = events.find(e => e.addr === '0x30');
        expect(evt).toBeDefined();
        expect(evt?.data).toBe('0x00');
    });

    it('includes a 0x08 (Key On) event set to 0x78', () => {
        const ops = [defaultOperator, defaultOperator, defaultOperator, defaultOperator];
        const events = generateEvents(ops, defaultGlobal);
        const evt = events.find(e => e.addr === '0x08');
        expect(evt).toBeDefined();
        expect(evt?.data).toBe('0x78');
    });

    it('encodes TL into register 0x60 for OP1 (hardware op offset 0)', () => {
        const ops: OperatorParams[] = [
            { ...defaultOperator, TL: 0x40 },
            defaultOperator,
            defaultOperator,
            defaultOperator,
        ];
        const events = generateEvents(ops, defaultGlobal);
        const tlEvt = events.find(e => e.addr === '0x60');
        expect(tlEvt).toBeDefined();
        expect(tlEvt?.data).toBe('0x40');
    });

    it('uses default operator values when params are undefined', () => {
        const emptyOp: OperatorParams = {};
        const ops = [emptyOp, emptyOp, emptyOp, emptyOp];
        // Should not throw
        expect(() => generateEvents(ops, defaultGlobal)).not.toThrow();
    });

    it('encodes DT2 into bits [7:6] of register 0xC0 for OP1', () => {
        const ops: OperatorParams[] = [
            { ...defaultOperator, DT2: 2, SR: 0x05 },
            defaultOperator,
            defaultOperator,
            defaultOperator,
        ];
        const events = generateEvents(ops, defaultGlobal);
        const dt2SrEvt = events.find(e => e.addr === '0xC0');
        expect(dt2SrEvt).toBeDefined();
        const val = parseInt(dt2SrEvt!.data, 16);
        expect((val >> 6) & 0x3).toBe(2); // DT2=2
        expect(val & 0x1F).toBe(0x05);    // SR=0x05
    });

    it('encodes AME into bit [7] of register 0xA0 for OP1', () => {
        const ops: OperatorParams[] = [
            { ...defaultOperator, AME: 1, DR: 0x0A },
            defaultOperator,
            defaultOperator,
            defaultOperator,
        ];
        const events = generateEvents(ops, defaultGlobal);
        const ameDrEvt = events.find(e => e.addr === '0xA0');
        expect(ameDrEvt).toBeDefined();
        const val = parseInt(ameDrEvt!.data, 16);
        expect((val >> 7) & 0x1).toBe(1); // AME=1
        expect(val & 0x1F).toBe(0x0A);    // DR=0x0A
    });
});
