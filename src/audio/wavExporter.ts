/**
 * WAV Exporter
 * Exports audio to WAV file
 */

import { generateAudioBuffers } from './audioGenerator';
import { encodeWAV } from './wavEncoder';
import { OPM_SAMPLE_RATE } from '../constants';
import { renderWaveformPreview } from '../ui';

const CLEANUP_DELAY_MS = 500;

/**
 * Export current audio as WAV file
 */
export function exportWav(): void {
    const audioData = generateAudioBuffers();
    if (!audioData) {
        // Ensure any internal audio buffers are released and update UI status
        if (typeof Module._free_buffer === 'function') {
            Module._free_buffer();
        }
        const infoEl = document.getElementById('info');
        if (infoEl) {
            infoEl.innerHTML = "WAV export failed.<br>No audio samples were generated. Please verify your event data is valid.";
        }
        return;
    }

    renderWaveformPreview(audioData.left, OPM_SAMPLE_RATE);
    
    Module._free_buffer();
    
    // Encode as WAV
    const wavBuffer = encodeWAV(audioData.left, audioData.right, OPM_SAMPLE_RATE);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 23);
    a.download = `ym2151_${timestamp}.wav`;
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup after a short delay to ensure download starts
    setTimeout(() => {
        try {
            if (a && a.parentNode === document.body) {
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error('Failed to remove temporary download link:', err);
        }

        try {
            if (window.URL && typeof URL.revokeObjectURL === 'function') {
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Failed to revoke object URL:', err);
        }
    }, CLEANUP_DELAY_MS);
    
    console.log(`WAV export complete: ${audioData.frames} frames (@${OPM_SAMPLE_RATE.toFixed(0)}Hz)`);
    const infoDiv = document.getElementById('info');
    if (infoDiv) {
        infoDiv.innerHTML = 
            `WAV Exported<br>` +
            `${audioData.frames} frames (@${OPM_SAMPLE_RATE.toFixed(0)}Hz)<br>` +
            `Duration: ${audioData.duration.toFixed(2)} seconds`;
    }
}
