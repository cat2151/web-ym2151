import { describe, it, expect } from 'vitest';
import { generateRandomToneString, getDefaultConfig } from './index';
import { RandomConfig } from './types';

describe('getDefaultConfig', () => {
    it('returns a valid RandomConfig object', () => {
        const config = getDefaultConfig();
        expect(config).toBeDefined();
        expect(config.global).toBeDefined();
        expect(config.commonOperatorParams).toBeDefined();
    });

    it('has CON range within 0-7', () => {
        const config = getDefaultConfig();
        expect(config.global.CON).toBeDefined();
        expect(config.global.CON!.min).toBeGreaterThanOrEqual(0);
        expect(config.global.CON!.max).toBeLessThanOrEqual(7);
    });

    it('has FL range within 0-7', () => {
        const config = getDefaultConfig();
        expect(config.global.FL).toBeDefined();
        expect(config.global.FL!.min).toBeGreaterThanOrEqual(0);
        expect(config.global.FL!.max).toBeLessThanOrEqual(7);
    });
});

describe('generateRandomToneString', () => {
    const config = getDefaultConfig();

    it('returns a non-empty string', () => {
        const result = generateRandomToneString(config);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('returns 5 lines (4 operators + 1 global)', () => {
        const result = generateRandomToneString(config);
        const lines = result.split('\n');
        expect(lines.length).toBe(5);
    });

    it('includes CON= in the last line', () => {
        const result = generateRandomToneString(config);
        const lastLine = result.split('\n').at(-1)!;
        expect(lastLine).toMatch(/CON=/);
    });

    it('includes FL= in the last line', () => {
        const result = generateRandomToneString(config);
        const lastLine = result.split('\n').at(-1)!;
        expect(lastLine).toMatch(/FL=/);
    });

    it('includes NOTE= in the last line', () => {
        const result = generateRandomToneString(config);
        const lastLine = result.split('\n').at(-1)!;
        expect(lastLine).toMatch(/NOTE=/);
    });

    it('CON value is within 0-7', () => {
        for (let i = 0; i < 10; i++) {
            const result = generateRandomToneString(config);
            const match = result.match(/CON=([0-9A-Fa-f]+)/);
            expect(match).not.toBeNull();
            const con = parseInt(match![1], 16);
            expect(con).toBeGreaterThanOrEqual(0);
            expect(con).toBeLessThanOrEqual(7);
        }
    });

    it('operator lines include TL= AR= DR= parameters', () => {
        const result = generateRandomToneString(config);
        const opLines = result.split('\n').slice(0, 4);
        for (const line of opLines) {
            expect(line).toMatch(/TL=/);
            expect(line).toMatch(/AR=/);
            expect(line).toMatch(/DR=/);
        }
    });

    it('carrier operators have TL=00 for CON=7 (all carriers)', () => {
        const con7Config: RandomConfig = {
            commonOperatorParams: getDefaultConfig().commonOperatorParams,
            global: {
                CON: { min: 7, max: 7 },
                FL: { min: 0, max: 7 },
                NOTE: { enabled: false }
            }
        };
        const result = generateRandomToneString(con7Config);
        const opLines = result.split('\n').slice(0, 4);
        for (const line of opLines) {
            expect(line).toMatch(/TL=00/);
        }
    });

    it('preserves CON from currentContent when CON range is not set', () => {
        const noConConfig: RandomConfig = {
            commonOperatorParams: getDefaultConfig().commonOperatorParams,
            global: {
                FL: { min: 0, max: 7 },
                NOTE: { enabled: false }
            }
        };
        const currentContent = 'TL=00 AR=1F\nTL=00 AR=1F\nTL=00 AR=1F\nTL=00 AR=1F\nCON=3 FL=4 NOTE=4A';
        const result = generateRandomToneString(noConConfig, currentContent);
        expect(result).toMatch(/CON=3/);
    });

    it('preserves NOTE from currentContent when NOTE is disabled', () => {
        const noNoteConfig: RandomConfig = {
            commonOperatorParams: getDefaultConfig().commonOperatorParams,
            global: {
                CON: { min: 0, max: 7 },
                FL: { min: 0, max: 7 },
                NOTE: { enabled: false }
            }
        };
        const currentContent = 'TL=00\nTL=20\nTL=20\nTL=20\nCON=0 FL=0 NOTE=5C';
        const result = generateRandomToneString(noNoteConfig, currentContent);
        expect(result).toMatch(/NOTE=5C/);
    });

    it('defaults NOTE to 4A when no currentContent and NOTE is disabled', () => {
        const noNoteConfig: RandomConfig = {
            commonOperatorParams: getDefaultConfig().commonOperatorParams,
            global: {
                CON: { min: 0, max: 7 },
                FL: { min: 0, max: 7 },
                NOTE: { enabled: false }
            }
        };
        const result = generateRandomToneString(noNoteConfig);
        expect(result).toMatch(/NOTE=4A/);
    });

    it('modulators have non-zero TL for CON=0 (one carrier)', () => {
        const con0Config: RandomConfig = {
            commonOperatorParams: getDefaultConfig().commonOperatorParams,
            global: {
                CON: { min: 0, max: 0 },
                FL: { min: 0, max: 7 },
                NOTE: { enabled: false }
            }
        };
        const result = generateRandomToneString(con0Config);
        const opLines = result.split('\n').slice(0, 4);
        // CON=0: only OP3 (index 3) is carrier; OP0, OP1, OP2 are modulators
        // Modulator TL for CON=0 is 0x20
        for (let i = 0; i < 3; i++) {
            expect(opLines[i]).toMatch(/TL=20/);
        }
        // OP3 is the carrier, TL=00
        expect(opLines[3]).toMatch(/TL=00/);
    });
});
