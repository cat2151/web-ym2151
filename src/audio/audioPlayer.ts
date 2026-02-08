import { generateAudioBuffers, AudioData } from './audioGenerator';
import { OPM_SAMPLE_RATE } from '../constants';
import {
    startOscilloscopeFromBuffer,
    isOscilloscopeVisible
} from '../oscilloscope';
import { startRealtimeVisualization } from './realtimeVisualizer';
import { renderWaveformPreview, runWithRenderingOverlay } from '../ui';

let audioContext: AudioContext | null = null;

// Cache for generated audio to avoid redundant generation
let cachedJsonContent: string | null = null;
let cachedAudioData: AudioData | null = null;

/**
 * Get current JSON editor content
 */
function getCurrentJsonContent(): string | null {
    const textarea = document.getElementById('jsonEditor') as HTMLTextAreaElement | null;
    if (!textarea) {
        return null;
    }
    return textarea.value;
}

/**
 * Get audio data, using cache if JSON hasn't changed
 */
function getAudioData(): AudioData | null {
    const currentJson = getCurrentJsonContent();
    // Only return early if the textarea is missing; let generateAudioBuffers()
    // handle empty/invalid JSON so users still get feedback.
    if (currentJson === null) {
        return null;
    }

    // Check if we can use cached audio
    if (cachedJsonContent === currentJson && cachedAudioData) {
        console.log("Using cached audio (JSON unchanged)");
        return cachedAudioData;
    }

    // Generate new audio
    console.log("Generating new audio (JSON changed or no cache)");
    const audioData = generateAudioBuffers();
    if (audioData) {
        // Update cache
        cachedJsonContent = currentJson;
        cachedAudioData = audioData;
    }
    return audioData;
}

/**
 * Play audio from current JSON editor content
 */
export function playAudio(): void {
    const audioData = getAudioData();
    if (!audioData) {
        return;
    }

    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const audioBuffer = audioContext.createBuffer(2, audioData.left.length, OPM_SAMPLE_RATE);
    
    audioBuffer.getChannelData(0).set(audioData.left);
    audioBuffer.getChannelData(1).set(audioData.right);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    startRealtimeVisualization(source, audioContext);
    source.start();

    renderWaveformPreview(audioData.left, OPM_SAMPLE_RATE);
    
    // Update oscilloscope if it's visible
    if (isOscilloscopeVisible()) {
        // Use mono audio for oscilloscope (left channel)
        startOscilloscopeFromBuffer(audioData.left, OPM_SAMPLE_RATE);
    }
    
    const infoDiv = document.getElementById('info');
    if (infoDiv) {
        infoDiv.innerHTML = 
            `Playing<br>` +
            `${audioData.frames} frames (@${OPM_SAMPLE_RATE.toFixed(0)}Hz)<br>`;
    }

    Module._free_buffer();
}

/**
 * Play audio while displaying the rendering overlay
 */
export function playAudioWithOverlay(): void {
    runWithRenderingOverlay(playAudio);
}

/**
 * Clear the audio cache
 * Call this when JSON is changed externally (e.g., loading presets)
 */
export function clearAudioCache(): void {
    cachedJsonContent = null;
    cachedAudioData = null;
    console.log("Audio cache cleared");
}
