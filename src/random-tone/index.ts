/**
 * Random Tone Generator Module
 * Generates random tone parameters based on configurable ranges
 */

import { RandomConfig, ParamRange, OperatorRandomConfig } from './types';
import { playAudio } from '../audio';

let currentConfig: RandomConfig | null = null;
let configTextarea: HTMLTextAreaElement | null = null;
let configDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random value for a parameter based on its range
 */
function randomValue(range: ParamRange | undefined): number | undefined {
    if (!range) return undefined;
    return randomInt(range.min, range.max);
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
        currentConfig = await response.json();
        
        // Update textarea with loaded config
        updateConfigTextarea();
        
        console.log('Random config loaded successfully');
    } catch (error) {
        console.error('Error loading random config:', error);
        // Use default config if loading fails
        currentConfig = getDefaultConfig();
        updateConfigTextarea();
    }
}

/**
 * Get default random configuration
 */
function getDefaultConfig(): RandomConfig {
    return {
        commonOperatorParams: {
            TL: { min: 0, max: 0 },
            AR: { min: 5, max: 31 },
            DR: { min: 0, max: 9 },
            SR: { min: 0, max: 0 },
            RR: { min: 0, max: 0 },
            SL: { min: 15, max: 15 },
            KS: { min: 0, max: 3 },
            MUL: { min: 0, max: 15 },
            DT1: { min: 0, max: 7 }
        },
        global: {
            CON: { min: 0, max: 7 },
            FL: { min: 0, max: 7 },
            NOTE: { enabled: false }
        }
    };
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
 * Format a parameter value to hex string
 */
function formatParam(name: string, value: number | undefined): string | undefined {
    if (value === undefined) return undefined;
    const hexValue = value.toString(16).toUpperCase();
    // Always format as 2-character uppercase hex, zero-padded if necessary (e.g., 0A, 05)
    // This ensures consistent width for all parameter values
    const paddedValue = hexValue.padStart(2, '0');
    return `${name}=${paddedValue}`;
}

/**
 * Get operator configuration for a specific operator index
 * Combines commonOperatorParams with operator-specific overrides
 */
function getOperatorConfig(config: RandomConfig, operatorIndex: number): OperatorRandomConfig {
    const common = config.commonOperatorParams || {};
    const specific = config.operators?.[operatorIndex] || {};
    
    // Merge common params with operator-specific overrides
    // Operator-specific values take precedence
    return {
        TL: specific.TL ?? common.TL,
        AR: specific.AR ?? common.AR,
        DR: specific.DR ?? common.DR,
        SR: specific.SR ?? common.SR,
        RR: specific.RR ?? common.RR,
        SL: specific.SL ?? common.SL,
        KS: specific.KS ?? common.KS,
        MUL: specific.MUL ?? common.MUL,
        DT1: specific.DT1 ?? common.DT1
    };
}

/**
 * Generate random tone and update editor
 */
export function generateRandomTone(): void {
    if (!currentConfig) {
        console.error('Random config not loaded');
        return;
    }
    
    const toneEditor = document.getElementById('toneEditor') as HTMLTextAreaElement | null;
    if (!toneEditor) {
        console.error('Tone editor not found');
        return;
    }
    
    const lines: string[] = [];
    
    // Generate random parameters for each operator
    for (let i = 0; i < 4; i++) {
        const opConfig = getOperatorConfig(currentConfig, i);
        const parts: string[] = [];
        
        const tl = formatParam('TL', randomValue(opConfig.TL));
        if (tl) parts.push(tl);
        
        const ar = formatParam('AR', randomValue(opConfig.AR));
        if (ar) parts.push(ar);
        
        const dr = formatParam('DR', randomValue(opConfig.DR));
        if (dr) parts.push(dr);
        
        const sr = formatParam('SR', randomValue(opConfig.SR));
        if (sr) parts.push(sr);
        
        const rr = formatParam('RR', randomValue(opConfig.RR));
        if (rr) parts.push(rr);
        
        const sl = formatParam('SL', randomValue(opConfig.SL));
        if (sl) parts.push(sl);
        
        const ks = randomValue(opConfig.KS);
        if (ks !== undefined) parts.push(`KS=${ks.toString(16).toUpperCase()}`);
        
        const mul = formatParam('MUL', randomValue(opConfig.MUL));
        if (mul) parts.push(mul);
        
        const dt1 = randomValue(opConfig.DT1);
        if (dt1 !== undefined) parts.push(`DT1=${dt1.toString(16).toUpperCase()}`);
        
        lines.push(parts.join(' '));
    }
    
    // Generate global parameters
    const globalParts: string[] = [];
    
    const con = randomValue(currentConfig.global.CON);
    if (con !== undefined) globalParts.push(`CON=${con.toString(16).toUpperCase()}`);
    
    const fl = randomValue(currentConfig.global.FL);
    if (fl !== undefined) globalParts.push(`FL=${fl.toString(16).toUpperCase()}`);
    
    // Handle NOTE parameter
    const noteConfig = currentConfig.global.NOTE;
    if (noteConfig) {
        // Check if NOTE is a ParamRange (has min/max) or enabled flag
        const hasMinMax = 'min' in noteConfig && 'max' in noteConfig;
        const isEnabled = 'enabled' in noteConfig && noteConfig.enabled;
        
        if (hasMinMax) {
            // Generate random NOTE value when ParamRange is provided
            const note = randomValue(noteConfig as ParamRange);
            if (note !== undefined) {
                globalParts.push(`NOTE=${note.toString(16).toUpperCase().padStart(2, '0')}`);
            }
        } else if (!isEnabled) {
            // Keep current NOTE value if NOTE randomization is disabled
            const currentContent = toneEditor.value;
            const noteMatch = currentContent.match(/NOTE=([0-9A-F]+)/i);
            if (noteMatch) {
                globalParts.push(`NOTE=${noteMatch[1].toUpperCase()}`);
            } else {
                // Default to A4: MIDI note 69 (0x45) maps to YM2151 KC value 0x4A
                globalParts.push('NOTE=4A');
            }
        }
        // If enabled=true but no range, skip NOTE (invalid config)
    } else {
        // No NOTE config, keep current value
        const currentContent = toneEditor.value;
        const noteMatch = currentContent.match(/NOTE=([0-9A-F]+)/i);
        if (noteMatch) {
            globalParts.push(`NOTE=${noteMatch[1].toUpperCase()}`);
        } else {
            // Default to A4: MIDI note 69 (0x45) maps to YM2151 KC value 0x4A
            globalParts.push('NOTE=4A');
        }
    }
    
    lines.push(globalParts.join(' '));
    
    // Update tone editor
    toneEditor.value = lines.join('\n');
    
    // Trigger change event to update JSON
    if (window.onToneEditorChange) {
        window.onToneEditorChange();
    }
    
    // Auto-play the generated tone
    playAudio();
}

/**
 * Toggle random config section visibility
 */
export function toggleRandomConfigSection(): void {
    const btn = document.getElementById('randomConfigToggleBtn');
    const content = document.getElementById('randomConfigContent');
    const toggleText = btn?.querySelector('.toggle-text');
    
    if (!btn || !content) return;
    
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    
    // Toggle state
    btn.setAttribute('aria-expanded', String(!isExpanded));
    content.setAttribute('aria-hidden', String(!isExpanded));
    content.style.display = isExpanded ? 'none' : 'block';
    
    // Update button text
    if (toggleText) {
        toggleText.textContent = isExpanded ? 'Show Config' : 'Hide Config';
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
 * Validate operator parameter ranges
 */
function validateOperatorRanges(params: unknown): params is OperatorRandomConfig {
    if (!params || typeof params !== 'object') {
        return false;
    }
    
    const rangeProps = ['TL', 'AR', 'DR', 'SR', 'RR', 'SL', 'KS', 'MUL', 'DT1'];
    for (const prop of rangeProps) {
        const paramObj = params as Record<string, any>;
        if (paramObj[prop]) {
            if (typeof paramObj[prop].min !== 'number' || typeof paramObj[prop].max !== 'number') {
                return false;
            }
        }
    }
    return true;
}

/**
 * Validate random configuration structure
 */
function validateConfig(config: unknown): config is RandomConfig {
    // Check basic structure
    if (!config || typeof config !== 'object') {
        return false;
    }
    
    // Cast to any for property access during validation
    const cfg = config as any;
    
    // Check global parameters first (required)
    if (!cfg.global || typeof cfg.global !== 'object') {
        return false;
    }
    
    // Check that at least one source of operator parameters exists and has content
    const hasCommonParams = cfg.commonOperatorParams && 
                           typeof cfg.commonOperatorParams === 'object' &&
                           Object.keys(cfg.commonOperatorParams).length > 0;
    const hasOperators = cfg.operators && 
                        Array.isArray(cfg.operators) && 
                        cfg.operators.length === 4;
    
    if (!hasCommonParams && !hasOperators) {
        return false;
    }
    
    // If commonOperatorParams exists, validate it
    if (cfg.commonOperatorParams) {
        if (!validateOperatorRanges(cfg.commonOperatorParams)) {
            return false;
        }
    }
    
    // If operators array exists, validate it
    if (cfg.operators) {
        if (!Array.isArray(cfg.operators) || cfg.operators.length !== 4) {
            return false;
        }
        
        // Check each operator has valid structure
        for (const op of cfg.operators) {
            if (!validateOperatorRanges(op)) {
                return false;
            }
        }
    }
    
    // Check global ranges
    const globalRangeProps = ['CON', 'FL'];
    for (const prop of globalRangeProps) {
        if (cfg.global[prop]) {
            if (typeof cfg.global[prop].min !== 'number' || typeof cfg.global[prop].max !== 'number') {
                return false;
            }
        }
    }
    
    // Check NOTE if present (can be either {enabled: boolean} or ParamRange)
    if (cfg.global.NOTE) {
        const hasEnabled = 'enabled' in cfg.global.NOTE && typeof cfg.global.NOTE.enabled === 'boolean';
        const hasMinMax = 'min' in cfg.global.NOTE && 'max' in cfg.global.NOTE &&
                          typeof cfg.global.NOTE.min === 'number' && typeof cfg.global.NOTE.max === 'number';
        if (!hasEnabled && !hasMinMax) {
            return false;
        }
    }
    
    return true;
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
 * Initialize random tone generator
 */
export function initializeRandomToneGenerator(): void {
    configTextarea = document.getElementById('randomConfigTextarea') as HTMLTextAreaElement | null;
    
    if (configTextarea) {
        configTextarea.addEventListener('input', onConfigTextareaChange);
    }
    
    // Load config from file
    loadRandomConfig();
}
