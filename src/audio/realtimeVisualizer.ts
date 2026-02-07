/**
 * Realtime audio visualization (waveform + FFT) updated at ~60 FPS.
 * Inspired by tonejs-step-sequencer approach using AnalyserNode.
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

const WAVEFORM_COLOR = '#4a90e2';
const FFT_COLOR = '#f6a821';
const BACKGROUND_COLOR = '#0b0b0f';

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

function drawWaveform(): void {
    if (!waveformCanvas || !waveformCtx || !timeDomainData) return;

    const width = waveformCanvas.width;
    const height = waveformCanvas.height;

    clearCanvas(waveformCtx, width, height);

    waveformCtx.lineWidth = 2;
    waveformCtx.strokeStyle = WAVEFORM_COLOR;
    waveformCtx.beginPath();

    const sliceWidth = width / timeDomainData.length;
    let x = 0;

    for (let i = 0; i < timeDomainData.length; i++) {
        const v = timeDomainData[i] / 128.0 - 1.0; // Normalize to [-1, 1]
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
 */
export function startRealtimeVisualization(
    source: AudioBufferSourceNode,
    context: AudioContext
): void {
    ensureCanvasContexts();
    const analyser = ensureAnalyser(context);

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
