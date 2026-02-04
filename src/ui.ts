/**
 * UI Utilities
 * Helper functions for UI operations
 */

/**
 * Convert a number to hex string (2 digits with 0x prefix)
 */
export function toHex(value: number): string {
    return '0x' + value.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Calculate duration of events in seconds
 */
export function calculateDuration(events: Array<{ time: number | string }>): number {
    if (!events || events.length === 0) {
        return 1.0;
    }
    
    let maxTime = 0.0;
    events.forEach(evt => {
        const t = parseFloat(evt.time as string);
        if (!isNaN(t) && t > maxTime) {
            maxTime = t;
        }
    });
    return maxTime + 1.0;
}

/**
 * Update duration display in the UI
 */
export function updateDurationDisplay(events: Array<{ time: number | string }>): void {
    const d = calculateDuration(events);
    const infoSpan = document.getElementById('durationInfo');
    if (infoSpan) {
        infoSpan.innerText = `(Calculated Duration: ${d.toFixed(2)} sec)`;
    }
}

/**
 * Toggle the storage section visibility
 */
export function toggleStorageSection(): void {
    const btn = document.getElementById('storageToggleBtn');
    const content = document.getElementById('storageContent');
    const toggleText = btn?.querySelector('.toggle-text');
    
    if (!btn || !content) return;
    
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    
    // Toggle state
    btn.setAttribute('aria-expanded', String(!isExpanded));
    content.setAttribute('aria-hidden', String(isExpanded));
    content.style.display = isExpanded ? 'none' : 'block';
    
    // Update button text
    if (toggleText) {
        toggleText.textContent = isExpanded ? 'Show Save Section' : 'Hide Save Section';
    }
}
