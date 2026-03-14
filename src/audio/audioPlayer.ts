import { generateAudioBuffers, AudioData } from './audioGenerator';
import { OPM_SAMPLE_RATE } from '../constants';
import {
    startOscilloscopeFromBuffer,
    isOscilloscopeVisible
} from '../oscilloscope';
import { startRealtimeVisualization } from './realtimeVisualizer';
import { renderWaveformPreview, runWithRenderingOverlay } from '../ui';
import { getCachedAudio, setCachedAudio } from './audioCache';
import { cancelIdleRendering, scheduleIdleRenderingDebounced } from './idleRenderer';
import { RANDOM_TONE_STATUS_ID } from '../constants';

let audioContext: AudioContext | null = null;

// Tracks the number of AudioBufferSourceNodes that are currently playing.
// Idle rendering is only resumed once this drops back to 0.
let activePlaybackCount = 0;

// In-player cache for generated audio to avoid redundant generation
// (separate from the global LRU audio cache used by history/favorites)
let cachedJsonContent: string | null = null;
let cachedAudioData: AudioData | null = null;
let cachedMaxAmplitude: number | null = null;

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

    // Check if we can use the in-player cache
    if (cachedJsonContent === currentJson && cachedAudioData) {
        console.log("Using cached audio (JSON unchanged)");
        return cachedAudioData;
    }

    // Check global LRU audio cache (shared with history/favorites idle renderer)
    const globalCached = getCachedAudio(currentJson);
    if (globalCached) {
        console.log("Using global audio cache");
        cachedJsonContent = currentJson;
        cachedAudioData = globalCached;
        cachedMaxAmplitude = null;
        return globalCached;
    }

    // Generate new audio
    console.log("Generating new audio (JSON changed or no cache)");
    const audioData = generateAudioBuffers();
    if (audioData) {
        // Update in-player cache
        cachedJsonContent = currentJson;
        cachedAudioData = audioData;
        // Clear cached max amplitude when audio data changes
        cachedMaxAmplitude = null;
        // Store in global LRU cache
        setCachedAudio(currentJson, audioData);
    }
    return audioData;
}

/**
 * Calculate maximum amplitude from audio buffer
 */
function calculateMaxAmplitude(audioData: AudioData): number {
    let maxAmplitude = 0;

    // Check both left and right channels
    for (let i = 0; i < audioData.left.length; i++) {
        const absLeft = Math.abs(audioData.left[i]);
        const absRight = Math.abs(audioData.right[i]);
        maxAmplitude = Math.max(maxAmplitude, absLeft, absRight);
    }

    return maxAmplitude;
}

/**
 * Play audio from current JSON editor content
 */
export function playAudio(): void {
    // Interrupt any background caching so it doesn't compete with playback
    cancelIdleRendering();

    const audioData = getAudioData();
    if (!audioData) {
        return;
    }

    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Calculate maximum amplitude from entire buffer for consistent normalization
    // Use cached value if available to avoid rescanning on repeated playback
    if (cachedMaxAmplitude === null) {
        cachedMaxAmplitude = calculateMaxAmplitude(audioData);
    }
    const maxAmplitude = cachedMaxAmplitude;

    const audioBuffer = audioContext.createBuffer(2, audioData.left.length, OPM_SAMPLE_RATE);

    audioBuffer.getChannelData(0).set(audioData.left);
    audioBuffer.getChannelData(1).set(audioData.right);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    startRealtimeVisualization(source, audioContext, maxAmplitude, audioData.frequencyEstimate);
    // Resume background caching 1.5 seconds after all active playbacks have ended
    activePlaybackCount++;
    source.addEventListener('ended', () => {
        activePlaybackCount = Math.max(0, activePlaybackCount - 1);
        if (activePlaybackCount === 0) {
            scheduleIdleRenderingDebounced();
        }
    }, { once: true });
    source.start();

    // Clear the random tone status balloon now that playback has started.
    // We access the DOM directly by ID to avoid a circular import
    // (random-tone → mml/playback → audio → audioPlayer).
    const randomToneStatus = document.getElementById(RANDOM_TONE_STATUS_ID);
    if (randomToneStatus) {
        randomToneStatus.textContent = '';
    }

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

    // Add to history and refresh UI
    const toneEl = document.getElementById('toneEditor') as HTMLTextAreaElement | null;
    const jsonEl = document.getElementById('jsonEditor') as HTMLTextAreaElement | null;
    if (toneEl && jsonEl && jsonEl.value.trim()) {
        if (typeof (window as any).addToHistoryAndRefresh === 'function') {
            (window as any).addToHistoryAndRefresh(toneEl.value, jsonEl.value);
        }
    }
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
    cachedMaxAmplitude = null;
    console.log("Audio cache cleared");
}
