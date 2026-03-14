/**
 * Tests for tone editor parameter parser
 */

import { describe, it, expect } from 'vitest';
import { parseParamLine, getDefaultOperatorParams } from './parser';

describe('parseParamLine', () => {
    it('parses a single key=value pair', () => {
        const result = parseParamLine('TL=20');
        expect(result).toEqual({ TL: 0x20 });
    });

    it('parses multiple key=value pairs separated by spaces', () => {
        const result = parseParamLine('TL=00 AR=1F DR=10');
        expect(result).toEqual({ TL: 0x00, AR: 0x1F, DR: 0x10 });
    });

    it('parses hex values correctly', () => {
        const result = parseParamLine('TL=7F AR=1F');
        expect(result.TL).toBe(0x7F);
        expect(result.AR).toBe(0x1F);
    });

    it('is case-insensitive for keys and values', () => {
        const result = parseParamLine('tl=0a ar=1f');
        expect(result.TL).toBe(0x0A);
        expect(result.AR).toBe(0x1F);
    });

    it('returns empty object for empty string', () => {
        expect(parseParamLine('')).toEqual({});
    });

    it('ignores malformed segments without "="', () => {
        const result = parseParamLine('TL=10 BADTOKEN AR=05');
        expect(result).toEqual({ TL: 0x10, AR: 0x05 });
    });

    it('parses a full operator line with all parameters', () => {
        const result = parseParamLine('TL=00 MUL=01 AR=1F DR=10 SL=00 SR=00 RR=07 DT1=3 KS=0');
        expect(result.TL).toBe(0);
        expect(result.MUL).toBe(1);
        expect(result.AR).toBe(0x1F);
        expect(result.DR).toBe(0x10);
        expect(result.SL).toBe(0);
        expect(result.SR).toBe(0);
        expect(result.RR).toBe(7);
        expect(result.DT1).toBe(3);
        expect(result.KS).toBe(0);
    });

    it('parses the global line CON/FL/NOTE', () => {
        const result = parseParamLine('CON=7 FL=0 NOTE=4A');
        expect(result.CON).toBe(7);
        expect(result.FL).toBe(0);
        expect(result.NOTE).toBe(0x4A);
    });
});

describe('getDefaultOperatorParams', () => {
    it('returns an object with all required keys', () => {
        const params = getDefaultOperatorParams();
        for (const key of ['TL', 'AR', 'DR', 'SR', 'RR', 'SL', 'KS', 'MUL', 'DT1']) {
            expect(params).toHaveProperty(key);
        }
    });

    it('has sensible default values', () => {
        const params = getDefaultOperatorParams();
        expect(params.TL).toBe(0x00);
        expect(params.AR).toBe(0x1F);
        expect(params.DR).toBe(0x10);
        expect(params.SR).toBe(0x00);
        expect(params.RR).toBe(0x07);
        expect(params.SL).toBe(0x00);
        expect(params.KS).toBe(0);
        expect(params.MUL).toBe(0x01);
        expect(params.DT1).toBe(3);
    });

    it('returns a new object each call (no shared state)', () => {
        const a = getDefaultOperatorParams();
        const b = getDefaultOperatorParams();
        expect(a).not.toBe(b);
    });
});
