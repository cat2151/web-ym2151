/**
 * Audio Module - Main Export
 */

export { generateAudioBuffers } from './audioGenerator';
export { encodeWAV } from './wavEncoder';
export { playAudio, playAudioWithOverlay, clearAudioCache } from './audioPlayer';
export { exportWav } from './wavExporter';
export type { AudioData } from './audioGenerator';
