/**
 * Keyboard Event Handlers
 * Sets up keyboard shortcuts for play functionality
 */

import { playSine } from './audio';

/**
 * Setup keyboard event listeners for play shortcuts
 * - CTRL+S: Play
 * - SHIFT+ENTER: Play
 * - CTRL+ENTER: Play
 */
export function setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
        // Check for CTRL+S (prevent default browser save)
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            playSine();
            return;
        }
        
        // Check for SHIFT+ENTER
        if (event.shiftKey && event.key === 'Enter') {
            event.preventDefault();
            playSine();
            return;
        }
        
        // Check for CTRL+ENTER (or CMD+ENTER on Mac)
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            playSine();
            return;
        }
    });
}
