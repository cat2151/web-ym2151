/**
 * Tests for JSON-to-tone-editor parser
 */

import { describe, it, expect } from 'vitest';
import { parseJsonToToneEditor } from './jsonParser';
import { generateEvents } from './eventGenerator';
import { OperatorParams, GlobalParams, YM2151Event } from '../types';

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

describe('parseJsonToToneEditor', () => {
    it('returns a non-empty string', () => {
        const ops = [defaultOperator, defaultOperator, defaultOperator, defaultOperator];
        const events = generateEvents(ops, defaultGlobal);
        const result = parseJsonToToneEditor(events);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('returns 5 lines (4 operator lines + 1 global line)', () => {
        const ops = [defaultOperator, defaultOperator, defaultOperator, defaultOperator];
        const events = generateEvents(ops, defaultGlobal);
        const result = parseJsonToToneEditor(events);
        const lines = result.split('\n');
        expect(lines.length).toBe(5);
    });

    it('global line contains CON=, FL=, NOTE=', () => {
        const ops = [defaultOperator, defaultOperator, defaultOperator, defaultOperator];
        const events = generateEvents(ops, defaultGlobal);
        const result = parseJsonToToneEditor(events);
        const lastLine = result.split('\n').at(-1)!;
        expect(lastLine).toMatch(/CON=/);
        expect(lastLine).toMatch(/FL=/);
        expect(lastLine).toMatch(/NOTE=/);
    });

    it('each operator line contains TL=, AR=, DR=, DT2=, AME=', () => {
        const ops = [defaultOperator, defaultOperator, defaultOperator, defaultOperator];
        const events = generateEvents(ops, defaultGlobal);
        const result = parseJsonToToneEditor(events);
        const opLines = result.split('\n').slice(0, 4);
        for (const line of opLines) {
            expect(line).toMatch(/TL=/);
            expect(line).toMatch(/AR=/);
            expect(line).toMatch(/DR=/);
            expect(line).toMatch(/DT2=/);
            expect(line).toMatch(/AME=/);
        }
    });

    it('round-trips CON and FL values through generateEvents', () => {
        const ops = [defaultOperator, defaultOperator, defaultOperator, defaultOperator];
        const global: GlobalParams = { con: 3, fl: 5, note: 0x3A };
        const events = generateEvents(ops, global);
        const result = parseJsonToToneEditor(events);
        const lastLine = result.split('\n').at(-1)!;
        expect(lastLine).toMatch(/CON=3/);
        expect(lastLine).toMatch(/FL=5/);
    });

    it('round-trips NOTE value through generateEvents', () => {
        const ops = [defaultOperator, defaultOperator, defaultOperator, defaultOperator];
        const global: GlobalParams = { con: 7, fl: 0, note: 0x2E }; // C4
        const events = generateEvents(ops, global);
        const result = parseJsonToToneEditor(events);
        const lastLine = result.split('\n').at(-1)!;
        expect(lastLine).toMatch(/NOTE=2E/);
    });

    it('round-trips TL value for OP1', () => {
        const op1: OperatorParams = { ...defaultOperator, TL: 0x3F };
        const ops = [op1, defaultOperator, defaultOperator, defaultOperator];
        const events = generateEvents(ops, defaultGlobal);
        const result = parseJsonToToneEditor(events);
        const firstOpLine = result.split('\n')[0];
        expect(firstOpLine).toMatch(/TL=3F/);
    });

    it('defaults to note 0x4A when no 0x28 event is present', () => {
        const events: YM2151Event[] = [
            { time: 0.0, addr: '0x20', data: '0xC7' },
        ];
        const result = parseJsonToToneEditor(events);
        const lastLine = result.split('\n').at(-1)!;
        expect(lastLine).toMatch(/NOTE=4A/);
    });

    it('returns sensible defaults when given an empty events array', () => {
        const result = parseJsonToToneEditor([]);
        expect(typeof result).toBe('string');
        expect(result.split('\n').length).toBe(5);
    });

    it('round-trips DT2 value for OP1', () => {
        const op1: OperatorParams = { ...defaultOperator, DT2: 3, SR: 0x0A };
        const ops = [op1, defaultOperator, defaultOperator, defaultOperator];
        const events = generateEvents(ops, defaultGlobal);
        const result = parseJsonToToneEditor(events);
        const firstOpLine = result.split('\n')[0];
        expect(firstOpLine).toMatch(/DT2=3/);
        expect(firstOpLine).toMatch(/SR=0A/);
    });

    it('round-trips AME value for OP1', () => {
        const op1: OperatorParams = { ...defaultOperator, AME: 1, DR: 0x08 };
        const ops = [op1, defaultOperator, defaultOperator, defaultOperator];
        const events = generateEvents(ops, defaultGlobal);
        const result = parseJsonToToneEditor(events);
        const firstOpLine = result.split('\n')[0];
        expect(firstOpLine).toMatch(/AME=1/);
        expect(firstOpLine).toMatch(/DR=08/);
    });
});
