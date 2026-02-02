/**
 * Error handling utilities for storage operations
 */

/**
 * Check if an error is a quota exceeded error
 */
export function isQuotaExceededError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false;
    }

    const err = error as { name?: string; code?: number };
    
    return (
        err.name === 'QuotaExceededError' ||
        err.code === 22 || // Safari / older WebKit
        err.code === 1014   // Firefox
    );
}

/**
 * Get user-friendly error message for storage errors
 */
export function getStorageErrorMessage(error: unknown, baseMessage: string): string {
    let message = baseMessage;
    
    if (isQuotaExceededError(error)) {
        message += ' Your browser\'s local storage is full. Please clear some saved data and try again.';
    } else {
        const err = error as { message?: string };
        message += ' ' + (err.message || 'Please try again.');
    }
    
    return message;
}
