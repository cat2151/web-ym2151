/**
 * Preset Tone Management Module
 * Loads and manages preset tones from preset-tones.json
 */

import { playAudio } from './audio';
import { runWithRenderingOverlay } from './ui';

interface PresetTone {
    name?: string;
    tone: string;
}

let loadedPresetTones: PresetTone[] = [];

/**
 * Load preset tones from preset-tones.json file
 */
export async function loadPresetTones(): Promise<void> {
    try {
        const response = await fetch('preset-tones.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        loadedPresetTones = await response.json();
        
        const select = document.getElementById('presetToneSelect') as HTMLSelectElement | null;
        if (!select) return;
        
        select.innerHTML = '';

        if (!Array.isArray(loadedPresetTones) || loadedPresetTones.length === 0) {
            const option = document.createElement('option');
            option.text = "No preset tones found";
            select.add(option);
            return;
        }

        // Add a default "Select preset tone..." option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.text = 'Select preset tone...';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        select.add(defaultOption);

        loadedPresetTones.forEach((presetTone, index) => {
            const option = document.createElement('option');
            option.value = String(index);
            option.text = presetTone.name || `Preset Tone ${index + 1}`;
            select.add(option);
        });

        const infoDiv = document.getElementById('info');
        if (infoDiv) {
            infoDiv.innerHTML += "<br>Preset tones loaded.";
        }

    } catch (error) {
        console.error('Error loading preset tones:', error);
        const infoDiv = document.getElementById('info');
        if (infoDiv) {
            infoDiv.innerHTML += 
                `<br><span style="color: orange;">Warning: Could not load 'preset-tones.json'.</span>`;
        }
    }
}

/**
 * Load selected preset tone to tone editor
 * @param autoPlay - Whether to automatically play the preset tone (default: true)
 */
export function loadToneToEditor(autoPlay: boolean = true): void {
    const select = document.getElementById('presetToneSelect') as HTMLSelectElement | null;
    if (!select) return;
    
    const selectedIndex = parseInt(select.value);
    if (isNaN(selectedIndex) || selectedIndex < 0 || !loadedPresetTones[selectedIndex]) {
        return;
    }

    const toneEditor = document.getElementById('toneEditor') as HTMLTextAreaElement | null;
    if (toneEditor) {
        toneEditor.value = loadedPresetTones[selectedIndex].tone;
        
        // Trigger the tone editor change event to update JSON
        if (window.onToneEditorChange) {
            window.onToneEditorChange();
        }
        
        // Auto-play the loaded preset tone if requested
        if (autoPlay) {
            playAudio();
        }
    }
}

export function handlePresetToneChange(): void {
    runWithRenderingOverlay(loadToneToEditor, 'Now rendering tone...');
}
