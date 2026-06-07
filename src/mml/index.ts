/**
 * MML to YM2151 Conversion Module
 * Converts Music Macro Language (MML) to YM2151 JSON events
 */

import { extractLeadingJsonBlock } from './embeddedJson';

// WASM module types will be imported dynamically
type MMLtoSMFModule = {
    parse_tree_json_to_smf: (parseTreeJson: string, mmlSource: string) => Uint8Array;
};

type SMFtoYM2151Module = {
    smf_to_ym2151_json: (smfData: Uint8Array) => string;
    smf_to_ym2151_json_with_attachment?: (smfData: Uint8Array, attachmentJson: Uint8Array) => string;
};

type TreeSitterModule = {
    Parser: {
        init: (config?: { locateFile?: (scriptName: string, scriptDirectory?: string) => string }) => Promise<void>;
        new (): TreeSitterParser;
    };
    Language: {
        load: (path: string) => Promise<unknown>;
    };
};

type TreeSitterParser = {
    setLanguage: (language: unknown) => void;
    parse: (input: string) => { rootNode: TreeSitterNode };
};

type TreeSitterPosition = {
    row: number;
    column: number;
};

type TreeSitterNode = {
    type: string;
    startIndex: number;
    endIndex: number;
    startPosition?: TreeSitterPosition;
    endPosition?: TreeSitterPosition;
    childCount: number;
    child: (index: number) => TreeSitterNode;
};

type ParseTreeJSON = {
    type: string;
    startPosition?: TreeSitterPosition;
    endPosition?: TreeSitterPosition;
    text?: string;
    children?: ParseTreeJSON[];
};

let mmlToSMFWasm: MMLtoSMFModule | null = null;
let smfToYM2151Wasm: SMFtoYM2151Module | null = null;
let treeSitterParser: TreeSitterParser | null = null;
let treeSitterLanguage: unknown | null = null;
let mmlConverterReady = false;

const TREE_SITTER_BASE_PATH = new URL('../../lib/mml-parser/', import.meta.url).toString();

/**
 * Initialize WASM modules for MML conversion
 */
export async function initializeMMLConverter(): Promise<boolean> {
    if (mmlConverterReady) {
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

        await initializeTreeSitterParser();

        mmlConverterReady = true;
        console.log('✓ MML converter WASM modules initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize MML converter WASM modules:', error);
        return false;
    }
}

/**
 * Convert MML string to YM2151 JSON events.
 * If the MML starts with a JSON object/array, the JSON is passed to
 * smf-to-ym2151log as attachment JSON. The generated YM2151 JSON is not
 * post-processed here.
 * @param mml MML string (e.g., "cdefgab" or "c;e;g" for chords)
 * @returns JSON string with YM2151 events or error
 */
export function convertMMLToYM2151JSON(mml: string): string | null {
    if (!mmlConverterReady || !mmlToSMFWasm || !smfToYM2151Wasm || !treeSitterParser || !treeSitterLanguage) {
        console.error('MML converter modules not initialized');
        return null;
    }

    try {
        const leadingJson = extractLeadingJsonBlock(mml);
        const mmlSource = leadingJson ? (leadingJson.rest || 'c') : mml;

        console.log('Parsing MML to tree-sitter JSON...');
        const parseTreeJson = buildParseTreeJSON(mmlSource);

        // Step 1: Convert MML to SMF
        console.log('Converting MML to SMF...');
        const smfData = mmlToSMFWasm.parse_tree_json_to_smf(JSON.stringify(parseTreeJson), mmlSource);
        console.log(`✓ SMF generated (${smfData.length} bytes)`);

        // Step 2: Convert SMF to YM2151 JSON
        console.log('Converting SMF to YM2151 JSON...');
        const ym2151Json = leadingJson
            ? convertSMFWithAttachment(smfData, leadingJson.json)
            : smfToYM2151Wasm.smf_to_ym2151_json(smfData);
        console.log('✓ YM2151 JSON generated');

        return ym2151Json;
    } catch (error) {
        console.error('Failed to convert MML:', error);
        return null;
    }
}

function convertSMFWithAttachment(smfData: Uint8Array, attachmentJson: string): string {
    if (!smfToYM2151Wasm?.smf_to_ym2151_json_with_attachment) {
        throw new Error('smf_to_ym2151_json_with_attachment is not available in the loaded WASM module');
    }

    return smfToYM2151Wasm.smf_to_ym2151_json_with_attachment(
        smfData,
        new TextEncoder().encode(attachmentJson),
    );
}

/**
 * Check if MML converter is ready
 */
export function isMMLConverterReady(): boolean {
    return mmlConverterReady;
}

async function initializeTreeSitterParser(): Promise<void> {
    if (treeSitterParser && treeSitterLanguage) {
        return;
    }

    // @ts-ignore - external ESM without types
    const treeSitterModule = (await import('../../lib/mml-parser/web-tree-sitter.js')) as unknown as TreeSitterModule;
    const { Parser, Language } = treeSitterModule;

    await Parser.init({
        locateFile: (scriptName: string, scriptDirectory?: string) => {
            if (scriptDirectory) {
                const normalizedDir = scriptDirectory.endsWith('/') ? scriptDirectory : `${scriptDirectory}/`;
                return `${normalizedDir}${scriptName}`;
            }

            const baseUrl = new URL(TREE_SITTER_BASE_PATH, import.meta.url);
            return new URL(scriptName, baseUrl).toString();
        }
    });

    const treeSitterBaseUrl = new URL(TREE_SITTER_BASE_PATH, import.meta.url);
    const treeSitterWasmUrl = new URL('tree-sitter-mml.wasm', treeSitterBaseUrl);
    treeSitterLanguage = await Language.load(treeSitterWasmUrl.toString());
    treeSitterParser = new Parser();
    treeSitterParser.setLanguage(treeSitterLanguage);
}

function buildParseTreeJSON(mml: string): ParseTreeJSON {
    if (!treeSitterParser) {
        throw new Error('Tree-sitter parser not initialized');
    }

    const tree = treeSitterParser.parse(mml);
    return convertNodeToJSON(tree.rootNode, mml);
}

function convertNodeToJSON(node: TreeSitterNode, source: string): ParseTreeJSON {
    const jsonNode: ParseTreeJSON = {
        type: node.type
    };

    if (node.startPosition && node.endPosition) {
        jsonNode.startPosition = { ...node.startPosition };
        jsonNode.endPosition = { ...node.endPosition };
    }

    if (node.childCount === 0) {
        jsonNode.text = source.substring(node.startIndex, node.endIndex);
    } else {
        jsonNode.children = [];
        for (let i = 0; i < node.childCount; i++) {
            jsonNode.children.push(convertNodeToJSON(node.child(i), source));
        }
    }

    return jsonNode;
}
