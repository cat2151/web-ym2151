# Demo Presets

This document explains the demo presets available in `presets.json`.

## Musical Demonstrations

These demos prove that web-ym2151 can produce musical scales and chords ("これができる" を実証する).

### C Major Scale (Do-Re-Mi-Fa-So-La-Ti-Do)
**Purpose**: Demonstrates sequential note playback  
**Notes**: C4 → D4 → E4 → F4 → G4 → A4 → B4 → C5  
**Duration**: ~2.4 seconds (300ms per note)  
**Technical**:
- Uses YM2151 chromatic note values (C4=0x41, D4=0x43, E4=0x45, etc.)
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
- A4 (440Hz) = 0x4A (74 decimal)
- Each semitone increments by 1
- C4 = 0x41 (65 decimal)

### Note Table
```
C4  = 0x41    C#4 = 0x42    D4  = 0x43    D#4 = 0x44
E4  = 0x45    F4  = 0x46    F#4 = 0x47    G4  = 0x48
G#4 = 0x49    A4  = 0x4A    A#4 = 0x4B    B4  = 0x4C
C5  = 0x4D    C#5 = 0x4E    D5  = 0x4F    D#5 = 0x50
E5  = 0x51    F5  = 0x52    ...
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
