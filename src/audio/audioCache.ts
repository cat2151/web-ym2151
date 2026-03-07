/**
 * Audio Cache
 * In-memory LRU cache for generated audio data (up to 100 entries).
 * Key: JSON editor string used as render parameters.
 * Value: generated audio buffers.
 */

import { AudioData } from './audioGenerator';

const MAX_CACHE_SIZE = 100;

// Map preserves insertion order – we treat the first entry as least recently used.
const cache = new Map<string, AudioData>();

/**
 * Retrieve cached audio for the given JSON key.
 * Accessing an entry moves it to the most-recently-used position.
 */
export function getCachedAudio(key: string): AudioData | undefined {
    const value = cache.get(key);
    if (value !== undefined) {
        // Refresh position (move to end = most recently used)
        cache.delete(key);
        cache.set(key, value);
    }
    return value;
}

/**
 * Store audio data in the cache under the given JSON key.
 * Evicts the least recently used entry when the cache is full.
 */
export function setCachedAudio(key: string, data: AudioData): void {
    if (cache.has(key)) {
        cache.delete(key);
    } else if (cache.size >= MAX_CACHE_SIZE) {
        // Evict LRU entry (first key in Map)
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) {
            cache.delete(firstKey);
        }
    }
    cache.set(key, data);
}

/**
 * Check whether audio is already cached for the given JSON key.
 */
export function hasCachedAudio(key: string): boolean {
    return cache.has(key);
}
