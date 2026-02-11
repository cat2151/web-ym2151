/**
 * Realtime audio visualization (waveform + FFT) updated at ~60 FPS.
 * Inspired by tonejs-step-sequencer approach using AnalyserNode.
 *
 * Enhanced with:
 * - Normalized amplitude display (auto-gain)
 * - 4-cycle waveform display based on frequency estimation
 * - Correlation-based positioning for stable waveform
 */

let analyserNode: AnalyserNode | null = null;
let waveformCanvas: HTMLCanvasElement | null = null;
let fftCanvas: HTMLCanvasElement | null = null;
let waveformCtx: CanvasRenderingContext2D | null = null;
let fftCtx: CanvasRenderingContext2D | null = null;
let timeDomainData: Uint8Array<ArrayBuffer> | null = null;
let frequencyData: Uint8Array<ArrayBuffer> | null = null;
let animationFrameId: number | null = null;
let currentSource: AudioNode | null = null;
let connectedContext: AudioContext | null = null;
let analyserConnected = false;
export type WaveformScalingMode = 'frame-dynamic' | 'buffer-max';
let waveformScalingMode: WaveformScalingMode = 'frame-dynamic';

// Enhanced visualization state
let previousWaveform: Float32Array | null = null;
let currentGain = 1.0;
let targetGain = 1.0;
const GAIN_INTERPOLATION = 0.1;
const FRAME_TARGET_AMPLITUDE = 0.95; // Use 95% of canvas height
const BUFFER_TARGET_AMPLITUDE = 0.8; // Use 80% of canvas height
let bufferMaxAmplitude: number = 1.0; // Maximum amplitude across entire buffer
let preferredFrequency: number | null = null;

const WAVEFORM_COLOR = '#4a90e2';
const FFT_COLOR = '#f6a821';
const BACKGROUND_COLOR = '#0b0b0f';
const CYCLES_TO_DISPLAY = 4;

function ensureCanvasContexts(): void {
    if (!waveformCanvas) {
        waveformCanvas = document.getElementById('realtimeWaveform') as HTMLCanvasElement | null;
        waveformCtx = waveformCanvas?.getContext('2d') ?? null;
    }
    if (!fftCanvas) {
        fftCanvas = document.getElementById('realtimeFFT') as HTMLCanvasElement | null;
        fftCtx = fftCanvas?.getContext('2d') ?? null;
    }
}

function ensureAnalyser(context: AudioContext): AnalyserNode | null {
    if (analyserNode && connectedContext !== context) {
        analyserNode.disconnect();
        analyserNode = null;
        connectedContext = null;
        analyserConnected = false;
    }

    if (!analyserNode) {
        analyserNode = context.createAnalyser();
        analyserNode.fftSize = 2048;
        analyserNode.smoothingTimeConstant = 0.8;
        timeDomainData = new Uint8Array(analyserNode.fftSize) as Uint8Array<ArrayBuffer>;
        frequencyData = new Uint8Array(analyserNode.frequencyBinCount) as Uint8Array<ArrayBuffer>;
        connectedContext = context;
    }

    return analyserNode;
}

function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, width, height);
}

/**
 * Estimate frequency using autocorrelation method
 * Returns the estimated frequency in Hz, or 0 if estimation fails
 */
function estimateFrequency(samples: Float32Array, sampleRate: number): number {
    const minPeriod = Math.floor(sampleRate / 2000); // Max ~2000 Hz
    const maxPeriod = Math.floor(sampleRate / 50);   // Min ~50 Hz

    if (samples.length < maxPeriod * 2) {
        return 0;
    }

    // Autocorrelation
    let bestCorrelation = -1;
    let bestPeriod = 0;

    for (let period = minPeriod; period < maxPeriod && period < samples.length / 2; period++) {
        let sum = 0;
        let count = 0;

        for (let i = 0; i < samples.length - period; i++) {
            sum += samples[i] * samples[i + period];
            count++;
        }

        const correlation = count > 0 ? sum / count : 0;

        if (correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestPeriod = period;
        }
    }

    if (bestPeriod > 0 && bestCorrelation > 0.3) {
        return sampleRate / bestPeriod;
    }

    return 0;
}

/**
 * Calculate correlation coefficient between two waveforms
 */
function calculateCorrelation(wave1: Float32Array, wave2: Float32Array): number {
    if (wave1.length !== wave2.length || wave1.length === 0) {
        return 0;
    }

    const n = wave1.length;
    let mean1 = 0;
    let mean2 = 0;

    for (let i = 0; i < n; i++) {
        mean1 += wave1[i];
        mean2 += wave2[i];
    }
    mean1 /= n;
    mean2 /= n;

    let numerator = 0;
    let sumSq1 = 0;
    let sumSq2 = 0;

    for (let i = 0; i < n; i++) {
        const diff1 = wave1[i] - mean1;
        const diff2 = wave2[i] - mean2;
        numerator += diff1 * diff2;
        sumSq1 += diff1 * diff1;
        sumSq2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(sumSq1 * sumSq2);

    if (denominator === 0) {
        return 0;
    }

    return numerator / denominator;
}

/**
 * Find the position in the buffer with highest correlation to the previous waveform
 */
function findBestCorrelationPosition(
    samples: Float32Array,
    previousWave: Float32Array,
    cycleLength: number
): number {
    const searchRange = Math.min(
        Math.floor(cycleLength * CYCLES_TO_DISPLAY),
        samples.length - previousWave.length
    );

    if (searchRange <= 0) {
        return 0;
    }

    let bestCorrelation = -2;
    let bestPosition = 0;

    for (let pos = 0; pos <= searchRange; pos++) {
        const candidate = samples.slice(pos, pos + previousWave.length);
        const correlation = calculateCorrelation(previousWave, candidate);

        if (correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestPosition = pos;
        }
    }

    return bestPosition;
}

/**
 * Calculate auto-gain to normalize amplitude
 */
function calculateFrameMaxAmplitude(samples: Float32Array): number {
    let maxAmplitude = 0;

    for (let i = 0; i < samples.length; i++) {
        const absValue = Math.abs(samples[i]);
        if (absValue > maxAmplitude) {
            maxAmplitude = absValue;
        }
    }

    return maxAmplitude;
}

function calculateAutoGain(displaySamples: Float32Array): number {
    if (waveformScalingMode === 'frame-dynamic') {
        const frameMaxAmplitude = calculateFrameMaxAmplitude(displaySamples);
        if (frameMaxAmplitude > 0.001) {
            return FRAME_TARGET_AMPLITUDE / frameMaxAmplitude;
        }
        return 1.0;
    }

    if (bufferMaxAmplitude > 0.001) {
        return BUFFER_TARGET_AMPLITUDE / bufferMaxAmplitude;
    }

    return 1.0;
}

function drawWaveform(): void {
    if (!waveformCanvas || !waveformCtx || !timeDomainData || !analyserNode) return;

    const width = waveformCanvas.width;
    const height = waveformCanvas.height;

    clearCanvas(waveformCtx, width, height);

    // Convert Uint8Array to Float32Array normalized to [-1, 1]
    const samples = new Float32Array(timeDomainData.length);
    for (let i = 0; i < timeDomainData.length; i++) {
        samples[i] = (timeDomainData[i] / 128.0) - 1.0;
    }

    // Estimate frequency
    const sampleRate = connectedContext?.sampleRate || 48000;
    const frequency =
        preferredFrequency && preferredFrequency > 0
            ? preferredFrequency
            : estimateFrequency(samples, sampleRate);

    let startIndex = 0;
    let endIndex = samples.length;

    // If we have a valid frequency, show 4 cycles
    if (frequency && frequency > 0) {
        const cycleLength = sampleRate / frequency;
        const fourCyclesLength = Math.floor(cycleLength * CYCLES_TO_DISPLAY);

        if (fourCyclesLength < samples.length) {
            // Use correlation-based positioning if we have a previous waveform
            if (previousWaveform && previousWaveform.length === fourCyclesLength) {
                startIndex = findBestCorrelationPosition(samples, previousWaveform, cycleLength);
            }

            endIndex = Math.min(startIndex + fourCyclesLength, samples.length);

            // Store current waveform for next frame
            previousWaveform = samples.slice(startIndex, endIndex);
        }
    } else {
        // No frequency detected, reset previous waveform
        previousWaveform = null;
    }

    // Extract the segment to display
    const displaySamples = samples.slice(startIndex, endIndex);

    // Calculate and apply auto-gain based on selected scaling mode
    targetGain = calculateAutoGain(displaySamples);
    currentGain += (targetGain - currentGain) * GAIN_INTERPOLATION;

    // Draw the waveform
    waveformCtx.lineWidth = 2;
    waveformCtx.strokeStyle = WAVEFORM_COLOR;
    waveformCtx.beginPath();

    const sliceWidth = width / displaySamples.length;
    let x = 0;

    for (let i = 0; i < displaySamples.length; i++) {
        const v = displaySamples[i] * currentGain; // Apply gain
        const y = height / 2 + v * (height / 2);

        if (i === 0) {
            waveformCtx.moveTo(x, y);
        } else {
            waveformCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    waveformCtx.stroke();
}

function drawFFT(): void {
    if (!fftCanvas || !fftCtx || !frequencyData) return;

    const width = fftCanvas.width;
    const height = fftCanvas.height;

    clearCanvas(fftCtx, width, height);

    const numBars = Math.min(width, frequencyData.length);
    if (numBars <= 0) return;

    const barWidth = width / numBars;
    const binStep = frequencyData.length / numBars;

    let x = 0;
    fftCtx.fillStyle = FFT_COLOR;

    for (let barIndex = 0; barIndex < numBars; barIndex++) {
        const startBin = Math.floor(barIndex * binStep);
        const endBin = Math.floor((barIndex + 1) * binStep);

        let sum = 0;
        let count = 0;

        for (let bin = startBin; bin < endBin && bin < frequencyData.length; bin++) {
            sum += frequencyData[bin];
            count++;
        }

        const avgValue = count > 0 ? sum / count : 0;
        const normalized = avgValue / 255;
        const barHeight = normalized * height;
        const y = height - barHeight;

        fftCtx.fillRect(x, y, barWidth, barHeight);
        x += barWidth;
    }
}

function renderFrame(): void {
    if (!analyserNode || !timeDomainData || !frequencyData) return;

    analyserNode.getByteTimeDomainData(timeDomainData);
    analyserNode.getByteFrequencyData(frequencyData);

    drawWaveform();
    drawFFT();

    animationFrameId = window.requestAnimationFrame(renderFrame);
}

/**
 * Prepare and clear canvas contexts for realtime visualization.
 * Call this after the visualizer canvases are available in the DOM.
 */
export function initializeRealtimeVisualizer(): void {
    if (typeof document === 'undefined') {
        return;
    }

    ensureCanvasContexts();

    if (waveformCanvas && waveformCtx) {
        clearCanvas(waveformCtx, waveformCanvas.width, waveformCanvas.height);
    }
    if (fftCanvas && fftCtx) {
        clearCanvas(fftCtx, fftCanvas.width, fftCanvas.height);
    }
}

/**
 * Start realtime visualization for the given source.
 * Connects source -> analyser -> destination and starts a ~60 FPS render loop.
 *
 * @param source - The audio source to visualize
 * @param context - The audio context
 * @param maxAmplitude - Optional maximum amplitude from entire buffer for consistent normalization
 * @param frequencyHint - Optional base frequency hint derived from register data
 */
export function startRealtimeVisualization(
    source: AudioBufferSourceNode,
    context: AudioContext,
    maxAmplitude?: number,
    frequencyHint?: number
): void {
    ensureCanvasContexts();
    const analyser = ensureAnalyser(context);

    // Reset visualization state to avoid cross-playback artifacts
    previousWaveform = null;
    currentGain = 1.0;
    targetGain = 1.0;

    // Set buffer-wide maximum amplitude if provided
    if (maxAmplitude !== undefined && maxAmplitude > 0) {
        bufferMaxAmplitude = maxAmplitude;
    } else {
        bufferMaxAmplitude = 1.0; // Reset to default if not provided
    }
    preferredFrequency = frequencyHint && frequencyHint > 0 ? frequencyHint : null;

    if (!analyser) {
        // Fallback: ensure audio still plays even if analyser cannot be created
        source.connect(context.destination);
        return;
    }

    // Disconnect any previous source to avoid lingering connections
    if (currentSource && analyserNode && currentSource !== source) {
        try {
            currentSource.disconnect(analyserNode);
        } catch (error) {
            console.warn('Failed to disconnect previous source from analyser:', error);
        }
    }

    if (!analyserConnected) {
        analyser.connect(context.destination);
        analyserConnected = true;
    }

    try {
        source.connect(analyser);
    } catch (error) {
        console.error('Failed to connect source to analyser:', error);
        source.connect(context.destination);
        return;
    }

    currentSource = source;

    if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    renderFrame();
    source.addEventListener(
        'ended',
        () => {
            if (analyserNode) {
                try {
                    source.disconnect(analyserNode);
                } catch (error) {
                    console.warn('Failed to disconnect ended source from analyser:', error);
                }
            }
            if (currentSource === source) {
                stopRealtimeVisualization();
            }
        },
        { once: true }
    );
}

/**
 * Stop realtime visualization and clear canvases.
 */
export function stopRealtimeVisualization(): void {
    if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    preferredFrequency = null;

    if (currentSource && analyserNode) {
        try {
            currentSource.disconnect(analyserNode);
        } catch (error) {
            console.warn('Failed to disconnect source from analyser:', error);
        }
    }
    currentSource = null;

    if (waveformCanvas && waveformCtx) {
        clearCanvas(waveformCtx, waveformCanvas.width, waveformCanvas.height);
    }
    if (fftCanvas && fftCtx) {
        clearCanvas(fftCtx, fftCanvas.width, fftCanvas.height);
    }
}

export function setWaveformScalingMode(mode: WaveformScalingMode): void {
    waveformScalingMode = mode;
    currentGain = 1.0;
    targetGain = 1.0;
}
