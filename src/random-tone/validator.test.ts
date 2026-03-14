import { describe, it, expect } from 'vitest';
import { validateConfig, validateOperatorRanges } from './validator';

describe('validateOperatorRanges', () => {
    it('returns true for an empty object (all params optional)', () => {
        expect(validateOperatorRanges({})).toBe(true);
    });

    it('returns true for a valid operator config', () => {
        expect(validateOperatorRanges({ AR: { min: 0, max: 31 }, TL: { min: 0, max: 127 } })).toBe(true);
    });

    it('returns false for null', () => {
        expect(validateOperatorRanges(null)).toBe(false);
    });

    it('returns false for non-object', () => {
        expect(validateOperatorRanges('string')).toBe(false);
        expect(validateOperatorRanges(42)).toBe(false);
    });

    it('returns false when a range property has non-numeric min', () => {
        expect(validateOperatorRanges({ AR: { min: 'bad', max: 31 } })).toBe(false);
    });

    it('returns false when a range property has non-numeric max', () => {
        expect(validateOperatorRanges({ AR: { min: 0, max: null } })).toBe(false);
    });

    it('returns false when a range property is null', () => {
        expect(validateOperatorRanges({ AR: null })).toBe(false);
    });

    it('returns false when a range property is a non-object (e.g. number)', () => {
        expect(validateOperatorRanges({ AR: 5 })).toBe(false);
    });
});

describe('validateConfig', () => {
    const validCommonOp = { AR: { min: 5, max: 31 } };
    const validGlobal = { CON: { min: 0, max: 7 }, FL: { min: 0, max: 7 }, NOTE: { enabled: false } };

    it('returns true for a minimal valid config', () => {
        expect(validateConfig({ commonOperatorParams: validCommonOp, global: validGlobal })).toBe(true);
    });

    it('returns false for null', () => {
        expect(validateConfig(null)).toBe(false);
    });

    it('returns false for non-object', () => {
        expect(validateConfig('string')).toBe(false);
        expect(validateConfig(42)).toBe(false);
    });

    it('returns false when global is missing', () => {
        expect(validateConfig({ commonOperatorParams: validCommonOp })).toBe(false);
    });

    it('returns false when global is not an object', () => {
        expect(validateConfig({ commonOperatorParams: validCommonOp, global: 'bad' })).toBe(false);
    });

    it('returns false when both commonOperatorParams and operators are absent', () => {
        expect(validateConfig({ global: validGlobal })).toBe(false);
    });

    it('returns false when commonOperatorParams is empty and operators is missing', () => {
        expect(validateConfig({ commonOperatorParams: {}, global: validGlobal })).toBe(false);
    });

    it('returns false when commonOperatorParams has an invalid range', () => {
        expect(validateConfig({
            commonOperatorParams: { AR: { min: 'bad', max: 31 } },
            global: validGlobal
        })).toBe(false);
    });

    it('returns false when operators array has wrong length', () => {
        expect(validateConfig({
            commonOperatorParams: validCommonOp,
            global: validGlobal,
            operators: [{}, {}]
        })).toBe(false);
    });

    it('returns true when operators array has 4 valid entries', () => {
        expect(validateConfig({
            commonOperatorParams: validCommonOp,
            global: validGlobal,
            operators: [{}, {}, {}, {}]
        })).toBe(true);
    });

    it('returns false when an operator in operators array is invalid', () => {
        expect(validateConfig({
            commonOperatorParams: validCommonOp,
            global: validGlobal,
            operators: [{}, {}, {}, { AR: null }]
        })).toBe(false);
    });

    it('returns false when a global range (CON) has non-numeric min/max', () => {
        expect(validateConfig({
            commonOperatorParams: validCommonOp,
            global: { CON: { min: 'bad', max: 7 }, FL: { min: 0, max: 7 } }
        })).toBe(false);
    });

    it('returns false when global CON range is null', () => {
        expect(validateConfig({
            commonOperatorParams: validCommonOp,
            global: { CON: null, FL: { min: 0, max: 7 } }
        })).toBe(false);
    });

    it('returns false when NOTE is a non-object (e.g. number)', () => {
        expect(validateConfig({
            commonOperatorParams: validCommonOp,
            global: { CON: { min: 0, max: 7 }, FL: { min: 0, max: 7 }, NOTE: 42 }
        })).toBe(false);
    });

    it('returns false when NOTE is a string', () => {
        expect(validateConfig({
            commonOperatorParams: validCommonOp,
            global: { CON: { min: 0, max: 7 }, FL: { min: 0, max: 7 }, NOTE: 'bad' }
        })).toBe(false);
    });

    it('returns false when NOTE is null', () => {
        expect(validateConfig({
            commonOperatorParams: validCommonOp,
            global: { CON: { min: 0, max: 7 }, FL: { min: 0, max: 7 }, NOTE: null }
        })).toBe(false);
    });

    it('returns false when NOTE object has neither enabled nor min/max', () => {
        expect(validateConfig({
            commonOperatorParams: validCommonOp,
            global: { CON: { min: 0, max: 7 }, FL: { min: 0, max: 7 }, NOTE: { random: true } }
        })).toBe(false);
    });

    it('returns true when NOTE has enabled: false', () => {
        expect(validateConfig({
            commonOperatorParams: validCommonOp,
            global: { CON: { min: 0, max: 7 }, FL: { min: 0, max: 7 }, NOTE: { enabled: false } }
        })).toBe(true);
    });

    it('returns true when NOTE has numeric min/max (ParamRange)', () => {
        expect(validateConfig({
            commonOperatorParams: validCommonOp,
            global: { CON: { min: 0, max: 7 }, FL: { min: 0, max: 7 }, NOTE: { min: 0, max: 127 } }
        })).toBe(true);
    });

    it('returns true when NOTE is absent', () => {
        expect(validateConfig({
            commonOperatorParams: validCommonOp,
            global: { CON: { min: 0, max: 7 }, FL: { min: 0, max: 7 } }
        })).toBe(true);
    });
});
