/**
 * Preset Management Module
 * Loads and manages preset tones from presets.json
 */

import { playAudio } from './audio';

interface Preset {
    name?: string;
    events: Array<{ time: number | string; addr: string; data: string }>;
}

let loadedPresets: Preset[] = [];

/**
 * Load presets from presets.json file
 */
export async function loadPresets(): Promise<void> {
    try {
        const response = await fetch('presets.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        loadedPresets = await response.json();
        
        const select = document.getElementById('presetSelect') as HTMLSelectElement | null;
        if (!select) return;
        
        select.innerHTML = '';

        if (!Array.isArray(loadedPresets) || loadedPresets.length === 0) {
            const option = document.createElement('option');
            option.text = "No presets found";
            select.add(option);
            return;
        }

        loadedPresets.forEach((preset, index) => {
            const option = document.createElement('option');
            option.value = String(index);
            option.text = preset.name || `Preset ${index + 1}`;
            select.add(option);
        });
        
        if (loadedPresets.length > 0) {
            select.value = '0';
            loadToEditor();
        }

        const infoDiv = document.getElementById('info');
        if (infoDiv) {
            infoDiv.innerHTML += "<br>Presets loaded.";
        }

    } catch (error) {
        console.error('Error loading presets:', error);
        const infoDiv = document.getElementById('info');
        if (infoDiv) {
            infoDiv.innerHTML = 
                `<span style="color: red;">Error loading 'presets.json'.</span>`;
        }
    }
}

/**
 * Load selected preset to editor
 */
export function loadToEditor(): void {
    const select = document.getElementById('presetSelect') as HTMLSelectElement | null;
    if (!select) return;
    
    const selectedIndex = parseInt(select.value);
    if (isNaN(selectedIndex) || selectedIndex < 0 || !loadedPresets[selectedIndex]) {
        return;
    }

    const editObj = {
        events: loadedPresets[selectedIndex].events
    };

    const textarea = document.getElementById('jsonEditor') as HTMLTextAreaElement | null;
    if (textarea) {
        textarea.value = JSON.stringify(editObj, null, 2);
    }
    
    if (window.updateDurationDisplay) {
        window.updateDurationDisplay(editObj.events as any);
    }
    
    // Try to parse and populate tone editor from JSON
    if (window.parseJsonToToneEditor) {
        window.parseJsonToToneEditor(editObj.events as any);
    }
    
    // Auto-play the loaded preset
    playAudio();
    
    // Note: We don't auto-save when loading a preset to avoid overwriting
    // the user's saved work. Auto-save only occurs on user edits.
}
