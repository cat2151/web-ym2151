/**
 * Tests for MIDI to YM2151 conversion
 * 
 * Run with: npm test (if test framework is set up)
 * Or verify manually by running: ts-node src/midi/noteTable.test.ts
 */

import { midiToKcKf, midiToKcHex, NOTE_TABLE } from './noteTable';

console.log('Testing MIDI to YM2151 conversion...\n');

// Test NOTE_TABLE
console.log('NOTE_TABLE:', NOTE_TABLE);
console.log('Expected: [0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14]');
console.log('Skipped codes: 3, 7, 11, 15\n');

// Test MIDI note 60 (Middle C / C4)
console.log('Test 1: MIDI note 60 (Middle C / C4)');
const [kc60, kf60] = midiToKcKf(60);
console.log(`  midiToKcKf(60) = [0x${kc60.toString(16)}, ${kf60}]`);
console.log(`  midiToKcHex(60) = ${midiToKcHex(60)}`);
console.log(`  Expected: KC=0x2E (octave 2, note 14=C)\n`);

// Test MIDI note 69 (A4 / 440Hz)
console.log('Test 2: MIDI note 69 (A4 / 440Hz)');
const [kc69, kf69] = midiToKcKf(69);
console.log(`  midiToKcKf(69) = [0x${kc69.toString(16)}, ${kf69}]`);
console.log(`  midiToKcHex(69) = ${midiToKcHex(69)}`);
console.log(`  Expected: KC=0x4A (octave 4, note 10=A)\n`);

// Test MIDI note 61 (C#4)
console.log('Test 3: MIDI note 61 (C#4)');
const [kc61, kf61] = midiToKcKf(61);
console.log(`  midiToKcKf(61) = [0x${kc61.toString(16)}, ${kf61}]`);
console.log(`  midiToKcHex(61) = ${midiToKcHex(61)}`);
console.log(`  Expected: KC=0x40 (octave 4, note 0=C#)\n`);

// Test C Major Scale (C4-D4-E4-F4-G4-A4-B4-C5)
console.log('Test 4: C Major Scale (MIDI notes 60-72)');
const cMajorScale = [60, 62, 64, 65, 67, 69, 71, 72];
const noteNames = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
console.log('  MIDI Note | Name | YM2151 KC');
console.log('  ----------|------|----------');
for (let i = 0; i < cMajorScale.length; i++) {
    const midi = cMajorScale[i];
    const hex = midiToKcHex(midi);
    console.log(`  ${midi.toString().padStart(9)} | ${noteNames[i].padEnd(4)} | ${hex}`);
}
console.log('\n  Expected C Major Scale YM2151 values:');
console.log('  C4=0x2E, D4=0x31, E4=0x34, F4=0x35, G4=0x38, A4=0x3A, B4=0x3D, C5=0x3E');
