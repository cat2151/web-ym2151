export interface LeadingJsonBlock {
    json: string;
    rest: string;
}

/**
 * Extract a leading JSON object/array from MML text.
 * This mirrors the upstream JSON-in-MML attachment convention.
 */
export function extractLeadingJsonBlock(input: string): LeadingJsonBlock | null {
    const trimmed = input.trimStart();
    const first = trimmed[0];
    if (first !== '{' && first !== '[') {
        return null;
    }

    const endIndex = findJsonEnd(trimmed);
    if (endIndex === -1) {
        return null;
    }

    const json = trimmed.substring(0, endIndex + 1);
    try {
        JSON.parse(json);
    } catch (_e) {
        return null;
    }

    return {
        json,
        rest: trimmed.substring(endIndex + 1).trimStart(),
    };
}

function findJsonEnd(input: string): number {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (char === '\\' && inString) {
            escaped = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (inString) {
            continue;
        }

        if (char === '{' || char === '[') {
            depth++;
        } else if (char === '}' || char === ']') {
            depth--;
            if (depth === 0) {
                return i;
            }
        }
    }

    return -1;
}

