/**
 * Item Waveform Renderer
 * Draws small waveform previews into the canvas elements inside history/favorites list items.
 */

const WAVEFORM_COLOR = '#f60';
const BG_COLOR = '#000';

/**
 * Draw a waveform preview into a canvas element.
 * @param canvas - target canvas element
 * @param samples - audio samples (left channel)
 */
export function drawWaveformOnCanvas(canvas: HTMLCanvasElement, samples: Float32Array): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return;
    }

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    if (samples.length === 0) {
        return;
    }

    const samplesPerPixel = samples.length / width;
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
        if (start >= samples.length) {
            break;
        }
        if (end > samples.length) {
            end = samples.length;
        }

        let min = samples[start];
        let max = samples[start];
        for (let i = start + 1; i < end; i++) {
            if (samples[i] < min) { min = samples[i]; }
            if (samples[i] > max) { max = samples[i]; }
        }

        const yMax = mid - max * amplitude;
        const yMin = mid - min * amplitude;
        ctx.moveTo(x + 0.5, yMax);
        ctx.lineTo(x + 0.5, yMin);
    }

    ctx.stroke();
}

/**
 * Find the canvas element for a history or favorites list item and draw its waveform.
 * Canvas elements have IDs of the form `hist-wave-{id}` or `fav-wave-{id}`.
 */
export function drawItemWaveform(id: string, type: 'history' | 'favorite', samples: Float32Array): void {
    const prefix = type === 'history' ? 'hist-wave-' : 'fav-wave-';
    const canvas = document.getElementById(prefix + id) as HTMLCanvasElement | null;
    if (!canvas) {
        return;
    }
    drawWaveformOnCanvas(canvas, samples);
}
