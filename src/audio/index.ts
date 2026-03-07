/**
 * Audio Module - Main Export
 */

export { generateAudioBuffers, generateAudioFromJson, generateAudioFromEvents } from './audioGenerator';
export { encodeWAV } from './wavEncoder';
export { playAudio, playAudioWithOverlay, clearAudioCache } from './audioPlayer';
export { exportWav } from './wavExporter';
export { getCachedAudio, setCachedAudio, hasCachedAudio } from './audioCache';
export { scheduleIdleRendering, cancelIdleRendering } from './idleRenderer';
export { drawWaveformOnCanvas, drawItemWaveform } from './itemWaveform';
export type { AudioData } from './audioGenerator';
