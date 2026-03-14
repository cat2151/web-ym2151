/**
 * Auto-play Manager
 * Auto-play on edit is always enabled.
 */

import { playWithMMLFallback } from './mml/playback';

/**
 * Trigger auto-play
 */
export function triggerAutoPlay(): void {
    playWithMMLFallback(false);
}
