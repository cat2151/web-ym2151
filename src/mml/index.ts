/**
 * MML to YM2151 Conversion Module
 * Converts Music Macro Language (MML) to YM2151 JSON events
 */

// WASM module types will be imported dynamically
type MMLtoSMFModule = {
    mml_to_smf: (mml: string) => Uint8Array;
};

type SMFtoYM2151Module = {
    smf_to_ym2151_json: (smfData: Uint8Array) => string;
};

let mmlToSMFWasm: MMLtoSMFModule | null = null;
let smfToYM2151Wasm: SMFtoYM2151Module | null = null;
let wasmInitialized = false;

/**
 * Initialize WASM modules for MML conversion
 */
export async function initializeMMLConverter(): Promise<boolean> {
    if (wasmInitialized) {
        return true;
    }

    try {
        console.log('Initializing MML converter WASM modules...');

        // Import mmlabc-to-smf-rust WASM (prebuilt asset downloaded by setup-mml.sh)
        // @ts-ignore - no TS types published for this generated module
        const mmlModule = await import('../../lib/mmlabc-to-smf-pkg/mmlabc_to_smf_wasm.js');
        await mmlModule.default();
        mmlToSMFWasm = mmlModule as unknown as MMLtoSMFModule;

        // Import smf-to-ym2151log-rust WASM
        // @ts-ignore - WASM module generated at build time
        const smfModule = await import('../../lib/smf-to-ym2151log-pkg/smf_to_ym2151log.js');
        await smfModule.default();
        smfToYM2151Wasm = smfModule as unknown as SMFtoYM2151Module;

        wasmInitialized = true;
        console.log('✓ MML converter WASM modules initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize MML converter WASM modules:', error);
        return false;
    }
}

/**
 * Convert MML string to YM2151 JSON events
 * @param mml MML string (e.g., "cdefgab" or "c;e;g" for chords)
 * @returns JSON string with YM2151 events or error
 */
export function convertMMLToYM2151JSON(mml: string): string | null {
    if (!wasmInitialized || !mmlToSMFWasm || !smfToYM2151Wasm) {
        console.error('MML converter WASM modules not initialized');
        return null;
    }

    try {
        // Step 1: Convert MML to SMF
        console.log('Converting MML to SMF...');
        const smfData = mmlToSMFWasm.mml_to_smf(mml);
        console.log(`✓ SMF generated (${smfData.length} bytes)`);

        // Step 2: Convert SMF to YM2151 JSON
        console.log('Converting SMF to YM2151 JSON...');
        const ym2151Json = smfToYM2151Wasm.smf_to_ym2151_json(smfData);
        console.log('✓ YM2151 JSON generated');

        return ym2151Json;
    } catch (error) {
        console.error('Failed to convert MML:', error);
        return null;
    }
}

/**
 * Check if MML converter is ready
 */
export function isMMLConverterReady(): boolean {
    return wasmInitialized;
}
