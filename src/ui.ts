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
export function calculateDuration(
    events: Array<{ time: number | string }>,
    renderDurationSeconds?: number
): number {
    if (
        renderDurationSeconds !== undefined &&
        Number.isFinite(renderDurationSeconds) &&
        renderDurationSeconds > 0
    ) {
        return renderDurationSeconds;
    }

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
 * Read a valid render duration override from a top-level YM2151 JSON object.
 */
export function getRenderDurationSeconds(jsonRoot: unknown): number | undefined {
    if (typeof jsonRoot !== 'object' || jsonRoot === null) {
        return undefined;
    }

    const value = (jsonRoot as { render_duration_seconds?: unknown }).render_duration_seconds;
    return typeof value === 'number' && Number.isFinite(value) && value > 0
        ? value
        : undefined;
}

/**
 * Update duration display in the UI
 */
export function updateDurationDisplay(
    events: Array<{ time: number | string }>,
    jsonRoot?: unknown
): void {
    const d = calculateDuration(events, getRenderDurationSeconds(jsonRoot));
    const infoSpan = document.getElementById('durationInfo');
    if (infoSpan) {
        infoSpan.innerText = `(Calculated Duration: ${d.toFixed(2)} sec)`;
    }
}

/**
 * Render a waveform preview to the UI canvas.
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
    if (width <= 0 || height <= 0) {
        return;
    }
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const samplesToDisplay = Math.min(samples.length, Math.floor(sampleRate));
    if (samplesToDisplay <= 0) {
        return;
    }

    const samplesPerPixel = samplesToDisplay / width;
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
        if (start >= samplesToDisplay) {
            break;
        }
        if (end > samplesToDisplay) {
            end = samplesToDisplay;
        }
        let min = samples[start];
        let max = samples[start];
        for (let i = start + 1; i < end; i++) {
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

const RENDERING_OVERLAY_ID = 'renderOverlay';
const RENDERING_BODY_CLASS = 'rendering';
const RENDERING_TEXT_SELECTOR = '.render-overlay__text';
const RENDERING_TARGET_IDS: string[] = [];

function toggleRenderingTargets(disabled: boolean): void {
    RENDERING_TARGET_IDS.forEach(id => {
        const element = document.getElementById(id) as HTMLSelectElement | null;
        if (element) {
            element.disabled = disabled;
        }
    });
}

export function showRenderingOverlay(message?: string): void {
    const overlay = document.getElementById(RENDERING_OVERLAY_ID);
    if (!overlay) return;

    overlay.classList.add('is-active');
    overlay.setAttribute('aria-busy', 'true');
    overlay.setAttribute('aria-hidden', 'false');

    const textElement = overlay.querySelector(RENDERING_TEXT_SELECTOR);
    if (textElement) {
        textElement.textContent = message ?? 'Now rendering...';
    }

    document.body.classList.add(RENDERING_BODY_CLASS);
    toggleRenderingTargets(true);
}

export function hideRenderingOverlay(): void {
    const overlay = document.getElementById(RENDERING_OVERLAY_ID);
    if (!overlay) return;

    overlay.classList.remove('is-active');
    overlay.setAttribute('aria-busy', 'false');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove(RENDERING_BODY_CLASS);
    toggleRenderingTargets(false);
}

/**
 * Run a task while showing the rendering overlay
 */
export function runWithRenderingOverlay(task: () => void, message?: string): void {
    showRenderingOverlay(message);
    window.setTimeout(() => {
        try {
            task();
        } finally {
            hideRenderingOverlay();
        }
    }, 0);
}
