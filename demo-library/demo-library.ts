// Augment Window interface for legacy webkit AudioContext prefix
interface Window {
  webkitAudioContext?: typeof AudioContext;
}

// YM2151 WASM module interface (matches Emscripten-generated API)
// All WASM function members are optional — Emscripten populates them after loading
interface YM2151Module {
  onRuntimeInitialized?(): void;
  print?(text: string): void;
  printErr?(text: string): void;
  _malloc?(size: number): number;
  _free?(ptr: number): void;
  _generate_sound?(dataPtr: number, eventCount: number, numFrames: number): number;
  _get_sample?(index: number): number;
  _free_buffer?(): void;
  HEAPU8?: Uint8Array;
}

// Global Module object — must be assigned before ym2151.js loads (Emscripten reads it)
// Emscripten will augment this object with _malloc, _generate_sound, etc. at runtime
// eslint-disable-next-line no-var
var Module: YM2151Module = {
  onRuntimeInitialized() {
    console.log('WASM Module initialized successfully');
    updateWasmStatus('ready', '✓ WASM module loaded and ready');
    setAudioButtonsEnabled(true);
  },
  print(text: string) {
    console.log('[WASM stdout]:', text);
  },
  printErr(text: string) {
    console.error('[WASM stderr]:', text);
  }
};

// YM2151 emulator constants — must match WASM side
const OPM_CLOCK = 3579545;           // YM2151 master clock (Hz)
const CLOCK_STEP = 64;               // Divider used by the emulator
const OPM_SAMPLE_RATE = OPM_CLOCK / CLOCK_STEP; // ≈ 55930.4Hz

// YM2151 register event
interface YM2151Event {
  time: number;
  address: number;
  data: number;
}

// Simple 440Hz tone events for YM2151
// These configure the YM2151 chip registers to play a simple tone
const events: YM2151Event[] = [
  // Key Off all channels first
  { time: 0.0,   address: 0x08, data: 0x00 },

  // Set frequency for 440Hz (A4) on channel 0
  { time: 0.001, address: 0x28, data: 0x4A }, // KF: Key Frequency
  { time: 0.002, address: 0x30, data: 0x07 }, // KC: Key Code (octave 4, note A)

  // Configure operator parameters (using simple sine wave)
  { time: 0.003, address: 0x20, data: 0xC4 }, // RL, FB, CON

  // Operator 1 (M1) - Carrier
  { time: 0.004, address: 0x60, data: 0x7F }, // TL: Total Level
  { time: 0.005, address: 0x80, data: 0x1F }, // AR: Attack Rate
  { time: 0.006, address: 0xA0, data: 0x00 }, // D1R: Decay Rate 1
  { time: 0.007, address: 0xC0, data: 0x00 }, // D2R: Decay Rate 2
  { time: 0.008, address: 0xE0, data: 0x0F }, // RR: Release Rate

  // Key On channel 0, all slots
  { time: 0.01,  address: 0x08, data: 0x78 },

  // Key Off after 0.5 seconds
  { time: 0.5,   address: 0x08, data: 0x00 }
];

// Display the event data in the pre element
const eventDisplay = document.getElementById('eventDisplay');
if (eventDisplay) {
  eventDisplay.textContent = JSON.stringify(events, null, 2);
}

// Update the WASM status display element
function updateWasmStatus(status: string, message: string): void {
  const statusEl = document.getElementById('wasmStatus');
  if (statusEl) {
    statusEl.className = `status ${status}`;
    statusEl.textContent = message;
  }
}

// Enable or disable both audio buttons together
function setAudioButtonsEnabled(enabled: boolean): void {
  const playBtn = document.getElementById('playButton') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('downloadWavButton') as HTMLButtonElement | null;
  if (playBtn) { playBtn.disabled = !enabled; }
  if (downloadBtn) { downloadBtn.disabled = !enabled; }
}

// Audio samples returned from WASM generation
interface AudioSamples {
  left: Float32Array;
  right: Float32Array;
  actualFrames: number;
}

// Generate audio frames from YM2151 events via WASM
// Returns { left, right, actualFrames } or throws on error
function generateAudio(): AudioSamples {
  if (!Module._malloc || !Module._generate_sound || !Module.HEAPU8) {
    throw new Error('WASM module not fully initialized');
  }
  const maxTime = Math.max(...events.map(e => e.time));
  const durationSeconds = maxTime + 0.5; // extra buffer after last event
  const numFrames = Math.floor(durationSeconds * OPM_SAMPLE_RATE);

  console.log(`Generating ${numFrames} frames (${durationSeconds.toFixed(2)}s)`);

  // Allocate WASM memory for the event array.
  // Struct layout (must match C): float time (4 bytes) + uint8 address (1) + uint8 data (1) + padding (2) = 8 bytes
  const eventSize = 8;
  const totalSize = events.length * eventSize;
  const dataPtr = Module._malloc!(totalSize);
  if (!dataPtr) {
    throw new Error('WASM memory allocation failed (out of memory)');
  }
  const view = new DataView(Module.HEAPU8!.buffer);

  try {
    // Write events into WASM memory
    for (let i = 0; i < events.length; i++) {
      const baseAddr = dataPtr + (i * eventSize);
      view.setFloat32(baseAddr, events[i].time, true); // little-endian float32
      Module.HEAPU8![baseAddr + 4] = events[i].address;
      Module.HEAPU8![baseAddr + 5] = events[i].data;
    }

    // Generate audio
    console.log('Calling Module._generate_sound...');
    const actualFrames = Module._generate_sound!(dataPtr, events.length, numFrames);
    console.log(`Generated ${actualFrames} frames`);

    if (actualFrames <= 0) {
      throw new Error('WASM audio generation failed: no frames were produced');
    }

    // Read back interleaved L/R samples
    const rawLeft = new Float32Array(actualFrames);
    const rawRight = new Float32Array(actualFrames);
    for (let i = 0; i < actualFrames; i++) {
      rawLeft[i]  = Module._get_sample!(i * 2);
      rawRight[i] = Module._get_sample!(i * 2 + 1);
    }

    Module._free_buffer!();
    return { left: rawLeft, right: rawRight, actualFrames };
  } finally {
    Module._free!(dataPtr);
  }
}

// Encode stereo Float32 audio as a 16-bit PCM WAV ArrayBuffer
function encodeWAV(leftChannel: Float32Array, rightChannel: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 2;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const numFrames = leftChannel.length;
  const dataSize = numFrames * numChannels * bytesPerSample;
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const dv = new DataView(buffer);

  function writeString(offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      dv.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  dv.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);  // PCM = 1
  dv.setUint16(22, numChannels, true);
  dv.setUint32(24, sampleRate, true);
  dv.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byte rate
  dv.setUint16(32, numChannels * bytesPerSample, true);              // block align
  dv.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(36, 'data');
  dv.setUint32(40, dataSize, true);

  // Write interleaved 16-bit PCM samples (clamp to [-1, 1] first)
  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    const sL = Math.max(-1, Math.min(1, leftChannel[i]));
    const sR = Math.max(-1, Math.min(1, rightChannel[i]));
    dv.setInt16(offset,     sL < 0 ? sL * 0x8000 : sL * 0x7FFF, true);
    dv.setInt16(offset + 2, sR < 0 ? sR * 0x8000 : sR * 0x7FFF, true);
    offset += 4;
  }

  return buffer;
}

// Poll until the WASM module is ready (fallback: onRuntimeInitialized may fire first)
let wasmCheckRetries = 0;
const maxRetries = 50;
const checkInterval = setInterval(() => {
  wasmCheckRetries++;
  if (Module._generate_sound) {
    clearInterval(checkInterval);
    updateWasmStatus('ready', '✓ WASM module loaded and ready');
    setAudioButtonsEnabled(true);
  } else if (wasmCheckRetries >= maxRetries) {
    clearInterval(checkInterval);
    updateWasmStatus('error', '✗ WASM module failed to load. Please reload the page.');
  }
}, 100);

// Play button — generate audio and play via Web Audio API
document.getElementById('playButton')?.addEventListener('click', async () => {
  try {
    if (!Module._generate_sound) {
      alert('WASM module not loaded yet. Please wait...');
      return;
    }

    const { left, right, actualFrames } = generateAudio();

    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtxClass) {
      alert('Web Audio API is not supported in this browser.');
      return;
    }
    const audioCtx = new AudioCtxClass();
    const audioBuffer = audioCtx.createBuffer(2, actualFrames, OPM_SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(left);
    audioBuffer.getChannelData(1).set(right);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start(0);

    console.log('Audio playback started');
  } catch (error) {
    console.error('Error playing audio:', error);
    alert('Error playing audio. Check console for details.');
  }
});

// Download WAV button — generate audio and offer as a WAV file download
document.getElementById('downloadWavButton')?.addEventListener('click', () => {
  try {
    if (!Module._generate_sound) {
      alert('WASM module not loaded yet. Please wait...');
      return;
    }

    const { left, right } = generateAudio();
    const wavBuffer = encodeWAV(left, right, OPM_SAMPLE_RATE);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 23);
    a.download = `ym2151_demo_${timestamp}.wav`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try { document.body.removeChild(a); } catch (err) { console.warn('Could not remove download link:', err); }
      try { URL.revokeObjectURL(url); } catch (err) { console.warn('Could not revoke object URL:', err); }
    }, 500);

    console.log('WAV download triggered');
  } catch (error) {
    console.error('Error downloading WAV:', error);
    alert('Error generating WAV. Check console for details.');
  }
});
