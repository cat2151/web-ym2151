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
 * Render a 1-second waveform preview to the UI canvas.
 */
const WAVEFORM_COLOR = '#f60';

export function renderWaveformPreview(samples: Float32Array, sampleRate: number): void {
    const canvas = document.getElementById('waveformPreview') as HTMLCanvasElement | null;
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return;
    }

    const width = canvas.width;
    const height = canvas.height;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const framesToDisplay = Math.min(samples.length, Math.floor(sampleRate));
    if (framesToDisplay <= 0) {
        return;
    }

    const samplesPerPixel = framesToDisplay / width;
    const mid = height / 2;
    const amplitude = height / 2;

    ctx.strokeStyle = WAVEFORM_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
        const start = Math.floor(x * samplesPerPixel);
        let end = Math.floor((x + 1) * samplesPerPixel);
        if (end <= start) {
            end = start + 1;
        }
        if (start >= framesToDisplay) {
            break;
        }
        if (end > framesToDisplay) {
            end = framesToDisplay;
        }
        let min = Infinity;
        let max = -Infinity;
        for (let i = start; i < end; i++) {
            const value = samples[i];
            if (value < min) {
                min = value;
            }
            if (value > max) {
                max = value;
            }
        }
        const yMax = mid - max * amplitude;
        const yMin = mid - min * amplitude;
        ctx.moveTo(x + 0.5, yMax);
        ctx.lineTo(x + 0.5, yMin);
    }

    ctx.stroke();
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
    content.setAttribute('aria-hidden', String(!isExpanded));
    content.style.display = isExpanded ? 'none' : 'block';
    
    // Update button text
    if (toggleText) {
        toggleText.textContent = isExpanded ? 'Show Save Section' : 'Hide Save Section';
    }
}
