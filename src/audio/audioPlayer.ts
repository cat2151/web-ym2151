import { generateAudioBuffers } from './audioGenerator';
import { OPM_SAMPLE_RATE } from '../constants';
import { 
    startOscilloscopeFromBuffer, 
    isOscilloscopeVisible 
} from '../oscilloscope';

let audioContext: AudioContext | null = null;

/**
 * Play audio from current JSON editor content
 */
export function playAudio(): void {
    const audioData = generateAudioBuffers();
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
    source.connect(audioContext.destination);
    source.start();
    
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
