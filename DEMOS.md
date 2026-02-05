# Demo Presets

This document explains the demo presets available in `presets.json`.

## Musical Demonstrations

These demos prove that web-ym2151 can produce musical scales and chords ("これができる" を実証する).

### C Major Scale (Do-Re-Mi-Fa-So-La-Ti-Do)
**Purpose**: Demonstrates sequential note playback  
**Notes**: C4 → D4 → E4 → F4 → G4 → A4 → B4 → C5
**Duration**: ~2.4 seconds (300ms per note)  
**Technical**:
- Register values: 0x2E, 0x31, 0x34, 0x35, 0x38, 0x3A, 0x3D, 0x3E
- Uses correct YM2151 note codes (C4=0x2E, D4=0x31, E4=0x34, F4=0x35, G4=0x38, A4=0x3A, B4=0x3D, C5=0x3E)
- Note codes skip values 3, 7, 11, and 15 within each octave
- Each note plays for 300ms with proper key-on/key-off sequences
- Simple sine wave tone configuration

### C Major Chord (C4-E4-G4)
**Purpose**: Demonstrates 3-note chord playback  
**Notes**: C4 + E4 + G4 (simultaneous)  
**Duration**: ~1 second  
**Technical**:
- Uses channels 0, 1, 2 for polyphonic playback
- Notes triggered with slight delays (0ms, 50ms, 100ms) for cleaner sound
- Key-on via register 0x08 per channel (0x78 for ch 0, 0x79 for ch 1, 0x7A for ch 2)

### F Major Chord (F4-A4-C5)
**Purpose**: Demonstrates another major chord  
**Notes**: F4 + A4 + C5 (simultaneous)  
**Duration**: ~1 second  
**Technical**: Same structure as C Major Chord

### G Major Chord (G4-B4-D5)
**Purpose**: Demonstrates another major chord  
**Notes**: G4 + B4 + D5 (simultaneous)  
**Duration**: ~1 second  
**Technical**: Same structure as C Major Chord

### Chord Progression (C-F-G-C)
**Purpose**: Demonstrates a musical progression  
**Chords**: C Major → F Major → G Major → C Major  
**Duration**: ~3.2 seconds (800ms per chord)  
**Technical**:
- Combines all three chords in sequence
- Each chord change includes key-off followed by new key-on
- Creates a simple I-IV-V-I progression

## YM2151 Note Values

The note values follow a chromatic scale where:
- A4 (440Hz, MIDI 69) = 0x3A (58 decimal)
- C#4 (MIDI 61) = 0x30 (48 decimal) - note 0 starts at C#
- Note codes skip values 3, 7, 11, and 15 within each octave
- YM2151 octave numbering: octave value = (MIDI octave - 2), range 0-7

### Note Table
```
C#4 = 0x30    D4  = 0x31    D#4 = 0x32    E4  = 0x34
F4  = 0x35    F#4 = 0x36    G4  = 0x38    G#4 = 0x39
A4  = 0x3A    A#4 = 0x3C    B4  = 0x3D    C5  = 0x3E
C#5 = 0x40    D5  = 0x41    D#5 = 0x42    E5  = 0x44
F5  = 0x45    F#5 = 0x46    G5  = 0x48    G#5 = 0x49
A5  = 0x4A    A#5 = 0x4C    B5  = 0x4D    C6  = 0x4E
```

## Original Presets

### Sine Wave (A4 - 440Hz)
The original simple sine wave demo at concert pitch.

### Sine Wave (A5 - High Pitch)
Higher octave demonstration.

## Future Enhancements

These demos were created as JSON files to prove the concept. In the future, when browser versions of the libraries used by cat-play-mml are available, demos could be created directly from MML (Music Macro Language) instead of JSON.

## Related Project

These demos were inspired by the cat-play-mml project, which supports MML-based music composition with YM2151.
