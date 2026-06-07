/**
 * Tests for clipboard utility functions
 */

import { describe, it, expect } from 'vitest';
import { deriveCopyButtonLabel } from './index';

describe('deriveCopyButtonLabel', () => {
    it('uses the label text when provided', () => {
        expect(deriveCopyButtonLabel('MML Input', 'mmlInput')).toBe(
            'Copy MML Input to clipboard'
        );
    });

    it('trims surrounding whitespace from the label text', () => {
        expect(deriveCopyButtonLabel('  Edit Events JSON:  ', 'jsonEditor')).toBe(
            'Copy Edit Events JSON: to clipboard'
        );
    });

    it('falls back to the id when label text is null', () => {
        expect(deriveCopyButtonLabel(null, 'toneEditor')).toBe(
            'Copy toneEditor to clipboard'
        );
    });

    it('falls back to the id when label text is empty or whitespace', () => {
        expect(deriveCopyButtonLabel('', 'registersEditor')).toBe(
            'Copy registersEditor to clipboard'
        );
        expect(deriveCopyButtonLabel('   ', 'combinedMML')).toBe(
            'Copy combinedMML to clipboard'
        );
    });
});
