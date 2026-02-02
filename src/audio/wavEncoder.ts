/**
 * WAV Encoder
 * Encodes audio buffers to WAV format
 */

/**
 * Write a string to a DataView
 */
function writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * Encode stereo audio as WAV file
 * @param leftChannel - Left channel samples (float32, -1.0 to 1.0)
 * @param rightChannel - Right channel samples (float32, -1.0 to 1.0)
 * @param sampleRate - Sample rate in Hz
 * @returns ArrayBuffer containing WAV file data
 */
export function encodeWAV(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    sampleRate: number
): ArrayBuffer {
    const numChannels = 2;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const numFrames = leftChannel.length;
    const dataSize = numFrames * numChannels * bytesPerSample;
    const headerSize = 44;
    const buffer = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(buffer);

    // Write WAV file header
    // "RIFF" chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // File size - 8
    writeString(view, 8, 'WAVE');

    // "fmt " sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true);  // Audio format (1 = PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // Byte rate
    view.setUint16(32, numChannels * bytesPerSample, true); // Block align
    view.setUint16(34, bitsPerSample, true);

    // "data" sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write interleaved PCM samples
    let offset = 44;
    for (let i = 0; i < numFrames; i++) {
        // Convert float [-1.0, 1.0] to 16-bit PCM [-32768, 32767]
        const sampleL = Math.max(-1, Math.min(1, leftChannel[i]));
        const sampleR = Math.max(-1, Math.min(1, rightChannel[i]));
        const intSampleL = sampleL < 0 ? sampleL * 0x8000 : sampleL * 0x7FFF;
        const intSampleR = sampleR < 0 ? sampleR * 0x8000 : sampleR * 0x7FFF;
        view.setInt16(offset, intSampleL, true);
        view.setInt16(offset + 2, intSampleR, true);
        offset += 4;
    }

    return buffer;
}
