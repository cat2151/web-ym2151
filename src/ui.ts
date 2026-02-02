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
