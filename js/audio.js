// Audio generation and WAV export module
let audioContext;

// Shared function to parse events and generate audio buffers
function generateAudioBuffers() {
    const textarea = document.getElementById('jsonEditor');
    let currentData = null;
    let currentEvents = [];

    try {
        currentData = JSON.parse(textarea.value);
        if (!currentData.events || !Array.isArray(currentData.events)) {
            throw new Error("JSON must contain an 'events' array.");
        }
        currentEvents = currentData.events;
        if (currentEvents.length === 0) {
            alert("Events array is empty.");
            return null;
        }
    } catch (e) {
        alert("Invalid JSON format:\n" + e.message);
        return null;
    }

    const durationSec = calculateDuration(currentEvents);
    updateDurationDisplay(currentEvents);

    // OPM_SAMPLE_RATE ベースでの生成サンプル数（フレーム数）
    const numFramesRaw = Math.floor(OPM_SAMPLE_RATE * durationSec);
    
    const STRUCT_SIZE = 8;
    const bufferSize = currentEvents.length * STRUCT_SIZE;
    const dataPtr = Module._malloc(bufferSize);
    const view = new DataView(Module.HEAPU8.buffer);
    
    currentEvents.forEach((evt, i) => {
        const baseAddr = dataPtr + (i * STRUCT_SIZE);
        view.setFloat32(baseAddr, parseFloat(evt.time), true);
        Module.HEAPU8[baseAddr + 4] = parseInt(evt.addr);
        Module.HEAPU8[baseAddr + 5] = parseInt(evt.data);
    });
    
    console.log("Generating audio...");
    // C側を実行: 戻り値は「生成されたフレーム数」
    const actualFrames = Module._generate_sound(dataPtr, currentEvents.length, numFramesRaw);
    Module._free(dataPtr);
    
    if (actualFrames <= 0) {
        console.error("Failed to generate samples");
        return null;
    }
    
    console.log("Audio generated");
    
    const rawLeft = new Float32Array(actualFrames);
    const rawRight = new Float32Array(actualFrames);
    // C側のバッファは [L0, R0, L1, R1, ...] の順で並んでいる
    for (let i = 0; i < actualFrames; i++) {
        rawLeft[i] = Module._get_sample(i * 2);
        rawRight[i] = Module._get_sample(i * 2 + 1);
    }
    
    return {
        left: rawLeft,
        right: rawRight,
        frames: actualFrames,
        duration: durationSec
    };
}

function playSine() {
    const audioData = generateAudioBuffers();
    if (!audioData) {
        return;
    }

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const audioBuffer = audioContext.createBuffer(2, audioData.left.length, OPM_SAMPLE_RATE);
    
    audioBuffer.getChannelData(0).set(audioData.left);
    audioBuffer.getChannelData(1).set(audioData.right);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
    
    document.getElementById('info').innerHTML = 
        `Playing Stereo<br>` +
        `${audioData.frames} frames (@${OPM_SAMPLE_RATE.toFixed(0)}Hz)<br>`;

    Module._free_buffer();
}

// WAV file encoding and export
function encodeWAV(leftChannel, rightChannel, sampleRate) {
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

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function exportWav() {
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
    const CLEANUP_DELAY_MS = 500;
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
    document.getElementById('info').innerHTML = 
        `WAV Exported<br>` +
        `${audioData.frames} frames (@${OPM_SAMPLE_RATE.toFixed(0)}Hz)<br>` +
        `Duration: ${audioData.duration.toFixed(2)} seconds`;
}
