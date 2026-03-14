/**
 * Random Tone Generator - Pure Generation Logic
 * No DOM dependencies; safe to use in non-browser environments.
 */

import { RandomConfig, ParamRange, OperatorRandomConfig } from './types';

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
 * Get default random configuration
 */
export function getDefaultConfig(): RandomConfig {
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
 * Get default random configuration as a JSON string.
 * Useful for displaying or editing the config in an external tool.
 */
export function getDefaultConfigJSON(): string {
    return JSON.stringify(getDefaultConfig(), null, 2);
}

/**
 * Generate a random tone string from the given configuration.
 *
 * This is a pure function with no DOM dependencies.
 * External repositories (e.g. bluesky-text-to-audio) can import and call this
 * directly without needing a browser environment.
 *
 * @param config - RandomConfig describing parameter ranges.
 * @param currentContent - Optional current tone-editor string used to preserve
 *   the existing CON and NOTE values when they are not randomised.
 * @returns The generated tone string in the same format as the tone editor.
 */
export function generateRandomToneString(config: RandomConfig, currentContent?: string): string {
    const lines: string[] = [];

    // Determine CON: randomise when a range is configured, else read from currentContent.
    const conRaw = randomValue(config.global.CON);
    let con: number;
    if (conRaw !== undefined) {
        // Clamp to 0-7 to match YM2151 hardware behaviour.
        con = conRaw & 0x7;
    } else {
        // Fall back to the CON value embedded in the current content string.
        // If no CON value is found, default to 7 (all-carriers: every OP is a carrier, no modulation).
        const match = currentContent?.match(/CON=([0-9A-Fa-f]+)/i);
        con = match ? (parseInt(match[1], 16) & 0x7) : 7;
    }
    const modulatorTL = getModulatorTLForCON(con);

    // Generate random parameters for each operator.
    for (let i = 0; i < 4; i++) {
        const opConfig = getOperatorConfig(config, i);
        const parts: string[] = [];

        // Carriers keep TL=0; modulators use a fixed TL based on modulation stage count.
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

    // Generate global parameters (CON already determined above).
    const globalParts: string[] = [];

    // Emit CON= when a range was configured or when the current content already contains CON=.
    if (conRaw !== undefined) {
        globalParts.push(`CON=${con.toString(16).toUpperCase()}`);
    } else if (currentContent?.match(/CON=/i)) {
        globalParts.push(`CON=${con.toString(16).toUpperCase()}`);
    }

    const fl = randomValue(config.global.FL);
    if (fl !== undefined) globalParts.push(`FL=${fl.toString(16).toUpperCase()}`);

    // Handle NOTE parameter.
    const noteConfig = config.global.NOTE;
    if (noteConfig) {
        const hasMinMax = 'min' in noteConfig && 'max' in noteConfig;
        const isEnabled = 'enabled' in noteConfig && noteConfig.enabled;

        if (hasMinMax) {
            const note = randomValue(noteConfig as ParamRange);
            if (note !== undefined) {
                globalParts.push(`NOTE=${note.toString(16).toUpperCase().padStart(2, '0')}`);
            }
        } else if (!isEnabled) {
            // Keep current NOTE value if NOTE randomization is disabled.
            const noteMatch = currentContent?.match(/NOTE=([0-9A-F]+)/i);
            if (noteMatch) {
                globalParts.push(`NOTE=${noteMatch[1].toUpperCase()}`);
            } else {
                // Default to A4: MIDI note 69 (0x45) maps to YM2151 KC value 0x4A.
                globalParts.push('NOTE=4A');
            }
        }
        // If enabled=true but no range, skip NOTE (invalid config).
    } else {
        const noteMatch = currentContent?.match(/NOTE=([0-9A-F]+)/i);
        if (noteMatch) {
            globalParts.push(`NOTE=${noteMatch[1].toUpperCase()}`);
        } else {
            globalParts.push('NOTE=4A');
        }
    }

    lines.push(globalParts.join(' '));
    return lines.join('\n');
}
