/**
 * Oscilloscope Integration Module
 * Provides waveform visualization using cat-oscilloscope library
 */

// Type definitions for cat-oscilloscope
interface BufferSourceOptions {
    loop?: boolean;
    chunkSize?: number;
}

interface Oscilloscope {
    start(): Promise<void>;
    startFromBuffer(bufferSource: BufferSource): Promise<void>;
    stop(): Promise<void>;
    setAutoGain(enabled: boolean): void;
    getAutoGainEnabled(): boolean;
    setNoiseGate(enabled: boolean): void;
    setFrequencyEstimationMethod(method: 'zero-crossing' | 'autocorrelation' | 'fft' | 'stft' | 'cqt'): void;
    getEstimatedFrequency(): number;
    setDebugOverlaysEnabled(enabled: boolean): void;
}

interface BufferSource {
    reset(): void;
    seek(position: number): void;
}

declare global {
    interface Window {
        Oscilloscope: new (
            canvas: HTMLCanvasElement,
            previousWaveformCanvas?: HTMLCanvasElement,
            currentWaveformCanvas?: HTMLCanvasElement,
            similarityPlotCanvas?: HTMLCanvasElement,
            frameBufferCanvas?: HTMLCanvasElement
        ) => Oscilloscope;
        BufferSource: {
            new (audioData: Float32Array, sampleRate: number, options?: BufferSourceOptions): BufferSource;
        };
    }
}

let oscilloscopeInstance: Oscilloscope | null = null;
let audioContextForOscilloscope: AudioContext | null = null;
let analyserNodeForOscilloscope: AnalyserNode | null = null;
let animationFrameId: number | null = null;
let isOscilloscopeRunning = false;

/**
 * Initialize oscilloscope with canvas element
 */
export function initializeOscilloscope(): void {
    const canvas = document.getElementById('oscilloscope') as HTMLCanvasElement;
    if (!canvas) {
        console.error('Oscilloscope canvas not found');
        return;
    }

    // Check if cat-oscilloscope library is loaded
    if (typeof window.Oscilloscope === 'undefined') {
        console.error('cat-oscilloscope library not loaded. Please include the library via CDN.');
        return;
    }

    // Create hidden canvases for oscilloscope internal use
    const hiddenCanvas = document.createElement('canvas');
    hiddenCanvas.width = 250;
    hiddenCanvas.height = 120;

    try {
        oscilloscopeInstance = new window.Oscilloscope(
            canvas,
            hiddenCanvas,
            hiddenCanvas,
            hiddenCanvas,
            hiddenCanvas
        );

        // Configure oscilloscope
        oscilloscopeInstance.setAutoGain(true);
        oscilloscopeInstance.setNoiseGate(false);
        oscilloscopeInstance.setFrequencyEstimationMethod('autocorrelation');
        oscilloscopeInstance.setDebugOverlaysEnabled(false);

        console.log('Oscilloscope initialized');
    } catch (error) {
        console.error('Failed to initialize oscilloscope:', error);
    }
}

/**
 * Start oscilloscope visualization from audio buffer data
 */
export function startOscilloscopeFromBuffer(audioData: Float32Array, sampleRate: number): void {
    if (!oscilloscopeInstance) {
        console.warn('Oscilloscope not initialized');
        return;
    }

    if (typeof window.BufferSource === 'undefined') {
        console.error('BufferSource not available from cat-oscilloscope library');
        return;
    }

    try {
        const bufferSource = new window.BufferSource(audioData, sampleRate, {
            loop: true,
            chunkSize: 4096
        });

        oscilloscopeInstance.startFromBuffer(bufferSource);
        isOscilloscopeRunning = true;
        console.log('Oscilloscope started from buffer');
    } catch (error) {
        console.error('Failed to start oscilloscope from buffer:', error);
    }
}

/**
 * Start oscilloscope visualization from Web Audio API nodes
 */
export function startOscilloscopeFromAudioContext(
    audioContext: AudioContext,
    sourceNode: AudioNode
): void {
    if (!oscilloscopeInstance) {
        console.warn('Oscilloscope not initialized');
        return;
    }

    try {
        // Create analyser node for real-time data extraction
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 4096;
        analyser.smoothingTimeConstant = 0;

        sourceNode.connect(analyser);
        
        audioContextForOscilloscope = audioContext;
        analyserNodeForOscilloscope = analyser;
        
        // Start animation loop to feed data to oscilloscope
        updateOscilloscopeFromAnalyser();
        isOscilloscopeRunning = true;
        
        console.log('Oscilloscope started from audio context');
    } catch (error) {
        console.error('Failed to start oscilloscope from audio context:', error);
    }
}

/**
 * Update oscilloscope with data from analyser node
 */
function updateOscilloscopeFromAnalyser(): void {
    if (!analyserNodeForOscilloscope || !oscilloscopeInstance || !isOscilloscopeRunning) {
        return;
    }

    const bufferLength = analyserNodeForOscilloscope.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyserNodeForOscilloscope.getFloatTimeDomainData(dataArray);

    // Feed data to oscilloscope
    if (audioContextForOscilloscope) {
        startOscilloscopeFromBuffer(dataArray, audioContextForOscilloscope.sampleRate);
    }

    // Schedule next update (approximately 60fps)
    animationFrameId = requestAnimationFrame(updateOscilloscopeFromAnalyser);
}

/**
 * Stop oscilloscope visualization
 */
export async function stopOscilloscope(): Promise<void> {
    isOscilloscopeRunning = false;
    
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    if (oscilloscopeInstance) {
        try {
            await oscilloscopeInstance.stop();
            console.log('Oscilloscope stopped');
        } catch (error) {
            console.error('Failed to stop oscilloscope:', error);
        }
    }

    audioContextForOscilloscope = null;
    analyserNodeForOscilloscope = null;
}

/**
 * Toggle oscilloscope section visibility
 */
export function toggleOscilloscopeSection(): void {
    const content = document.getElementById('oscilloscopeContent');
    const button = document.getElementById('oscilloscopeToggleBtn');
    const toggleText = button?.querySelector('.toggle-text');
    
    if (!content || !button) return;
    
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    
    if (isExpanded) {
        content.style.display = 'none';
        content.setAttribute('aria-hidden', 'true');
        button.setAttribute('aria-expanded', 'false');
        if (toggleText) toggleText.textContent = 'Show Waveform Visualizer';
        // Stop oscilloscope when hiding
        stopOscilloscope();
    } else {
        content.style.display = 'block';
        content.setAttribute('aria-hidden', 'false');
        button.setAttribute('aria-expanded', 'true');
        if (toggleText) toggleText.textContent = 'Hide Waveform Visualizer';
        // Note: Oscilloscope will be started when Play button is clicked
        // Set flag to indicate oscilloscope is ready to receive data
        isOscilloscopeRunning = false; // Reset state
    }
}

/**
 * Check if oscilloscope is currently visible and ready
 */
export function isOscilloscopeVisible(): boolean {
    const button = document.getElementById('oscilloscopeToggleBtn');
    return button?.getAttribute('aria-expanded') === 'true';
}
