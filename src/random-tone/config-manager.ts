/**
 * Random Tone Generator - Configuration Manager
 * Handles loading, saving, importing and exporting random tone configuration.
 */

import { RandomConfig } from './types';
import { validateConfig } from './validator';

let currentConfig: RandomConfig | null = null;
let configTextarea: HTMLTextAreaElement | null = null;
let configDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Get the currently active random configuration.
 */
export function getCurrentConfig(): RandomConfig | null {
    return currentConfig;
}

/**
 * Update config textarea with current configuration
 */
function updateConfigTextarea(): void {
    if (!configTextarea || !currentConfig) return;
    configTextarea.value = JSON.stringify(currentConfig, null, 2);
}

/**
 * Parse config from textarea
 */
function parseConfigFromTextarea(): void {
    if (!configTextarea) return;

    try {
        const parsed = JSON.parse(configTextarea.value);
        if (!validateConfig(parsed)) {
            console.error('Invalid config structure in textarea');
            return;
        }
        currentConfig = parsed;
        console.log('Config updated from textarea');
    } catch (error) {
        console.error('Invalid JSON in config textarea:', error);
        // Don't update currentConfig if parsing fails
    }
}

/**
 * Handle config textarea changes with debounce
 */
function onConfigTextareaChange(): void {
    if (configDebounceTimer !== null) {
        clearTimeout(configDebounceTimer);
    }

    configDebounceTimer = window.setTimeout(() => {
        parseConfigFromTextarea();
    }, 500); // 500ms debounce
}

/**
 * Load random configuration from JSON file
 */
export async function loadRandomConfig(): Promise<void> {
    try {
        const response = await fetch('random-config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const loaded = await response.json();
        if (!validateConfig(loaded)) {
            throw new Error('Loaded config has invalid structure');
        }
        currentConfig = loaded;

        // Update textarea with loaded config
        updateConfigTextarea();

        console.log('Random config loaded successfully');
    } catch (error) {
        console.error('Error loading random config:', error);
        // Config load failed; leave currentConfig as null (generation uses the library instead)
        currentConfig = null;
        updateConfigTextarea();
    }
}

/**
 * Export random configuration to JSON file
 */
export function exportRandomConfig(): void {
    if (!currentConfig) {
        alert('No configuration to export');
        return;
    }

    const jsonStr = JSON.stringify(currentConfig, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'random-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Import random configuration from JSON file
 */
export function importRandomConfig(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt: ProgressEvent<FileReader>) => {
            try {
                const content = evt.target?.result as string;
                const parsed = JSON.parse(content);

                // Validate configuration structure
                if (!validateConfig(parsed)) {
                    throw new Error('Invalid configuration structure');
                }

                currentConfig = parsed;
                updateConfigTextarea();
                alert('Configuration imported successfully');
            } catch (error) {
                console.error('Error importing config:', error);
                alert('Failed to import configuration. Invalid JSON file or structure.');
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

/**
 * Initialize the config textarea and load configuration from file
 */
export function initializeRandomToneGenerator(): void {
    configTextarea = document.getElementById('randomConfigTextarea') as HTMLTextAreaElement | null;

    if (configTextarea) {
        configTextarea.addEventListener('input', onConfigTextareaChange);
    }

    // Load config from file
    loadRandomConfig();
}
