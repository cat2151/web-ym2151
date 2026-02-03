/**
 * Tone Preview Module
 * Provides functionality to preview tones with specified notes
 */

import { YM2151Event } from './types';
import { midiNoteToYM2151, getMidiNoteName } from './tone-editor/midiConverter';
import { parseToneEditorToJson } from './tone-editor';
import { playAudio } from './audio/audioPlayer';

/**
 * Preview the current tone with a specified MIDI note
 * Generates a short test note (1 second duration)
 */
export function previewTone(): void {
    const midiNoteInput = document.getElementById('previewMidiNote') as HTMLInputElement | null;
    const previewInfoEl = document.getElementById('previewInfo');
    const jsonEditor = document.getElementById('jsonEditor') as HTMLTextAreaElement | null;
    
    if (!midiNoteInput || !jsonEditor) {
        console.error('Preview elements not found');
        return;
    }
    
    const midiNote = parseInt(midiNoteInput.value, 10);
    
    if (isNaN(midiNote) || midiNote < 0 || midiNote > 127) {
        if (previewInfoEl) {
            previewInfoEl.textContent = 'Invalid MIDI note (must be 0-127)';
        }
        return;
    }
    
    // Convert MIDI note to YM2151
    const ym2151Note = midiNoteToYM2151(midiNote);
    
    // Get current tone from editor
    const parsedTone = parseToneEditorToJson();
    if (!parsedTone) {
        if (previewInfoEl) {
            previewInfoEl.textContent = 'Please enter tone parameters first';
        }
        return;
    }
    
    // Create preview events with the specified note
    const previewEvents = createPreviewEvents(parsedTone.events, ym2151Note);
    
    // Save current JSON editor content
    const originalContent = jsonEditor.value;
    
    // Temporarily set preview JSON
    jsonEditor.value = JSON.stringify({ events: previewEvents }, null, 2);
    
    // Update info
    if (previewInfoEl) {
        const noteName = getMidiNoteName(midiNote);
        previewInfoEl.textContent = `Playing ${noteName} (YM2151: 0x${ym2151Note.toString(16).toUpperCase()})...`;
    }
    
    // Play the preview
    try {
        playAudio();
        
        // Restore original content after a short delay
        setTimeout(() => {
            jsonEditor.value = originalContent;
            if (previewInfoEl) {
                previewInfoEl.textContent = '';
            }
        }, 100);
    } catch (error) {
        // Restore original content on error
        jsonEditor.value = originalContent;
        if (previewInfoEl) {
            previewInfoEl.textContent = 'Preview failed: ' + (error as Error).message;
        }
    }
}

/**
 * Create preview events from tone events with specified note
 * Adds key-on at start and key-off after 1 second
 */
function createPreviewEvents(toneEvents: YM2151Event[], note: number): YM2151Event[] {
    const events: YM2151Event[] = [];
    
    // Copy all tone setup events except the note and key-on
    for (const event of toneEvents) {
        const addr = typeof event.addr === 'string' ? parseInt(event.addr, 16) : event.addr;
        
        // Skip existing note (0x28) and key-on (0x08) events
        if (addr === 0x28 || addr === 0x08) {
            continue;
        }
        
        events.push({ ...event });
    }
    
    // Add the preview note
    events.push({
        time: 0.0,
        addr: "0x28",
        data: `0x${note.toString(16).toUpperCase().padStart(2, '0')}`
    });
    
    // Add key fraction (0x30)
    events.push({
        time: 0.0,
        addr: "0x30",
        data: "0x00"
    });
    
    // Key-on (channel 0, all slots)
    events.push({
        time: 0.0,
        addr: "0x08",
        data: "0x78"
    });
    
    // Key-off after 1 second
    events.push({
        time: 1.0,
        addr: "0x08",
        data: "0x00"
    });
    
    return events;
}

/**
 * Update the preview note name display when MIDI note input changes
 */
export function updatePreviewNoteName(): void {
    const midiNoteInput = document.getElementById('previewMidiNote') as HTMLInputElement | null;
    const noteNameEl = document.getElementById('previewNoteName');
    
    if (!midiNoteInput || !noteNameEl) return;
    
    const midiNote = parseInt(midiNoteInput.value, 10);
    
    if (isNaN(midiNote) || midiNote < 0 || midiNote > 127) {
        noteNameEl.textContent = '(Invalid)';
        return;
    }
    
    const noteName = getMidiNoteName(midiNote);
    const ym2151Note = midiNoteToYM2151(midiNote);
    noteNameEl.textContent = `(${noteName} = 0x${ym2151Note.toString(16).toUpperCase()})`;
}
