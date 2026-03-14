/**
 * Tests for storage error handler utilities
 */

import { describe, it, expect } from 'vitest';
import { isQuotaExceededError, getStorageErrorMessage } from './errorHandler';

describe('isQuotaExceededError', () => {
    it('returns false for null', () => {
        expect(isQuotaExceededError(null)).toBe(false);
    });

    it('returns false for undefined', () => {
        expect(isQuotaExceededError(undefined)).toBe(false);
    });

    it('returns false for a plain string', () => {
        expect(isQuotaExceededError('QuotaExceededError')).toBe(false);
    });

    it('returns true for error with name "QuotaExceededError"', () => {
        expect(isQuotaExceededError({ name: 'QuotaExceededError' })).toBe(true);
    });

    it('returns true for error with code 22 (Safari / older WebKit)', () => {
        expect(isQuotaExceededError({ code: 22 })).toBe(true);
    });

    it('returns true for error with code 1014 (Firefox)', () => {
        expect(isQuotaExceededError({ code: 1014 })).toBe(true);
    });

    it('returns false for other error names', () => {
        expect(isQuotaExceededError({ name: 'SecurityError' })).toBe(false);
    });

    it('returns false for other error codes', () => {
        expect(isQuotaExceededError({ code: 99 })).toBe(false);
    });

    it('returns false for an empty object', () => {
        expect(isQuotaExceededError({})).toBe(false);
    });
});

describe('getStorageErrorMessage', () => {
    it('appends quota exceeded message when quota is exceeded', () => {
        const err = { name: 'QuotaExceededError' };
        const msg = getStorageErrorMessage(err, 'Save failed.');
        expect(msg).toContain('Save failed.');
        expect(msg).toContain('local storage is full');
    });

    it('appends the error message for non-quota errors', () => {
        const err = { message: 'disk I/O error' };
        const msg = getStorageErrorMessage(err, 'Save failed.');
        expect(msg).toContain('Save failed.');
        expect(msg).toContain('disk I/O error');
    });

    it('falls back to "Please try again." when no error message is present', () => {
        const msg = getStorageErrorMessage({}, 'Save failed.');
        expect(msg).toContain('Save failed.');
        expect(msg).toContain('Please try again.');
    });
});
