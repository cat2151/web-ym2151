import { describe, expect, it } from 'vitest';
import { extractLeadingJsonBlock } from './embeddedJson';

describe('extractLeadingJsonBlock', () => {
    it('extracts a leading attachment JSON array', () => {
        const result = extractLeadingJsonBlock('[{"ProgramChange":0,"Tone":{"events":[]}}]\nc;e');
        expect(result).toEqual({
            json: '[{"ProgramChange":0,"Tone":{"events":[]}}]',
            rest: 'c;e',
        });
    });

    it('extracts a leading tone JSON object', () => {
        const result = extractLeadingJsonBlock('{"type":"YM2151 tone","registers":"20C7"}\n c');
        expect(result).toEqual({
            json: '{"type":"YM2151 tone","registers":"20C7"}',
            rest: 'c',
        });
    });

    it('returns null for plain MML', () => {
        expect(extractLeadingJsonBlock('c;e')).toBeNull();
    });

    it('returns null for invalid JSON prefix', () => {
        expect(extractLeadingJsonBlock('[invalid]c')).toBeNull();
    });
});

