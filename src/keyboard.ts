/**
 * Keyboard Event Handlers
 * Sets up keyboard shortcuts for play functionality
 */

import { playSine } from './audio';

// Flag to ensure listeners are only added once
let keyboardListenersInitialized = false;

/**
 * Check if the current focus is on an editable element (input, textarea, select, etc.)
 */
function isEditableElement(element: EventTarget | null): boolean {
    if (!element || !(element instanceof HTMLElement)) {
        return false;
    }
    
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return true;
    }
    
    // Check for contenteditable
    if (element.isContentEditable) {
        return true;
    }
    
    return false;
}

/**
 * Setup keyboard event listeners for play shortcuts
 * - CTRL+S: Play (prevents default browser save)
 * - SHIFT+ENTER: Play (when not in an editable element)
 * - CTRL+ENTER: Play (when not in an editable element)
 */
export function setupKeyboardShortcuts(): void {
    // Prevent duplicate event listeners
    if (keyboardListenersInitialized) {
        return;
    }
    keyboardListenersInitialized = true;
    
    document.addEventListener('keydown', (event: KeyboardEvent) => {
        // Check for CTRL+S or CMD+S (always prevent default browser save and play)
        // Exclude SHIFT/ALT to avoid overriding CTRL+SHIFT+S (Save As)
        if (
            (event.ctrlKey || event.metaKey) &&
            !event.shiftKey &&
            !event.altKey &&
            event.key === 's'
        ) {
            event.preventDefault();
            playSine();
            return;
        }
        
        // For ENTER-based shortcuts, only trigger if not in an editable element
        const inEditableElement = isEditableElement(event.target);
        
        // Check for SHIFT+ENTER (without other modifier keys)
        if (
            event.shiftKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey &&
            event.key === 'Enter' &&
            !inEditableElement
        ) {
            event.preventDefault();
            playSine();
            return;
        }
        
        // Check for CTRL+ENTER or CMD+ENTER (without SHIFT/ALT)
        if (
            (event.ctrlKey || event.metaKey) &&
            !event.shiftKey &&
            !event.altKey &&
            event.key === 'Enter' &&
            !inEditableElement
        ) {
            event.preventDefault();
            playSine();
            return;
        }
    });
}
