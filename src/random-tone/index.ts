/**
 * Random Tone Generator Module
 * Generates random tone parameters based on configurable ranges
 */

import { RandomConfig, ParamRange, OperatorRandomConfig } from './types';
import { playWithMMLFallback } from '../mml/playback';
import { runWithRenderingOverlay } from '../ui';

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
 * YM2151 algorithm (CON 0-7) carrier/modulator definitions.
 *
 * Carrier operators per CON:
 *   CON=0: OP3 only         (OP0→OP1→OP2→OP3→OUT, FB on OP0)
 *   CON=1: OP3 only         ((OP0,OP1)→OP2→OP3→OUT, FB on OP0)
 *   CON=2: OP3 only         (OP0→OP2→OP3, OP1→OP3→OUT, FB on OP0)
 *   CON=3: OP3 only         (OP0→OP1→OP3, OP2→OP3→OUT, FB on OP0)
 *   CON=4: OP2, OP3         (OP0→OP1→OP2→OUT, OP3→OUT, FB on OP0)
 *   CON=5: OP1, OP2, OP3    (OP0→{OP1,OP2,OP3}→OUT, FB on OP0)
 *   CON=6: OP1, OP2, OP3    (OP0→OP1→OUT, OP2→OUT, OP3→OUT, FB on OP0)
 *   CON=7: OP0,OP1,OP2,OP3  (all carriers, FB on OP0)
 *
 * Modulation stage count = (number of external modulators in chain) + (1 if FB present).
 * Modulator TL = stage_count * 0x08.
 *
 *   CON=0: stage count 4 (3 mods + FB) → modulator TL = 0x20
 *   CON=1: stage count 4 (3 mods + FB) → modulator TL = 0x20
 *   CON=2: stage count 4 (3 mods + FB) → modulator TL = 0x20
 *   CON=3: stage count 4 (3 mods + FB) → modulator TL = 0x20
 *   CON=4: stage count 3 (2 mods + FB) → modulator TL = 0x18  (for OP2's chain)
 *   CON=5: stage count 2 (1 mod  + FB) → modulator TL = 0x10
 *   CON=6: stage count 2 (1 mod  + FB) → modulator TL = 0x10
 *   CON=7: stage count 0 (no external modulators) → no modulator TL applied
 */

/** Carrier operator indices per CON (0-7). */
const CARRIERS_PER_CON: ReadonlyArray<ReadonlyArray<number>> = [
    [3],           // CON=0
    [3],           // CON=1
    [3],           // CON=2
    [3],           // CON=3
    [2, 3],        // CON=4
    [1, 2, 3],     // CON=5
    [1, 2, 3],     // CON=6
    [0, 1, 2, 3],  // CON=7
];

/** Modulator TL value per CON (stage_count * 0x08). */
const MODULATOR_TL_PER_CON: ReadonlyArray<number> = [
    0x20, // CON=0: stage count 4
    0x20, // CON=1: stage count 4
    0x20, // CON=2: stage count 4
    0x20, // CON=3: stage count 4
    0x18, // CON=4: stage count 3
    0x10, // CON=5: stage count 2
    0x10, // CON=6: stage count 2
    0x00, // CON=7: no external modulators
];

/**
 * Return true if the given operator is a carrier for the specified CON value.
 */
function isCarrierOp(con: number, operatorIndex: number): boolean {
    return (CARRIERS_PER_CON[con] ?? []).includes(operatorIndex);
}

/**
 * Return the fixed TL value for a modulator operator given the CON value.
 * Carrier operators always use TL=0, so this is only called for modulators.
 */
function getModulatorTLForCON(con: number): number {
    return MODULATOR_TL_PER_CON[con] ?? 0x00;
}

/**
 * Read the current CON value from the tone editor textarea.
 * Returns the clamped (0–7) value, or 7 (all-carriers default) if not present.
 */
function getEditorCON(toneEditor: HTMLTextAreaElement): number {
    const match = toneEditor.value.match(/CON=([0-9A-Fa-f]+)/i);
    return match ? (parseInt(match[1], 16) & 0x7) : 7;
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
    const config = currentConfig;

    runWithRenderingOverlay(() => {
        const lines: string[] = [];
        
        // Generate CON first so we can determine carrier/modulator roles for TL assignment.
        // Clamp to 0-7 to match the YM2151 hardware behaviour (same masking as event generation).
        const conRaw = randomValue(config.global.CON);
        const con = conRaw !== undefined ? (conRaw & 0x7) : getEditorCON(toneEditor);
        const modulatorTL = getModulatorTLForCON(con);
        
        // Generate random parameters for each operator
        for (let i = 0; i < 4; i++) {
            const opConfig = getOperatorConfig(config, i);
            const parts: string[] = [];
            
            // Carriers keep TL=0; modulators use a fixed TL based on modulation stage count
            const tl = formatParam('TL', isCarrierOp(con, i) ? 0 : modulatorTL);
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
        
        // Generate global parameters (CON already determined above)
        const globalParts: string[] = [];
        
        // Only emit CON= when a range was configured; otherwise keep the editor's current value
        if (conRaw !== undefined) {
            globalParts.push(`CON=${con.toString(16).toUpperCase()}`);
        } else if (toneEditor.value.match(/CON=/i)) {
            globalParts.push(`CON=${con.toString(16).toUpperCase()}`);
        }
        
        const fl = randomValue(config.global.FL);
        if (fl !== undefined) globalParts.push(`FL=${fl.toString(16).toUpperCase()}`);
        
        // Handle NOTE parameter
        const noteConfig = config.global.NOTE;
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
        playWithMMLFallback(false);
    }, 'Now rendering random tone...');
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
