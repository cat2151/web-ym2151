/**
 * Convert a number to hex string (2 digits with 0x prefix)
 */
export function toHex(value: number): string {
    return '0x' + value.toString(16).toUpperCase().padStart(2, '0');
}
