/**
 * Clipboard Module
 * Adds a "copy to clipboard" button to each textarea in the demo.
 */

const COPY_BUTTON_CLASS = 'copy-textarea-btn';
const COPY_WRAPPER_CLASS = 'copy-textarea-wrapper';
const COPY_DEFAULT_LABEL = '📋 Copy';
const COPY_SUCCESS_LABEL = '✓ Copied!';
const COPY_ERROR_LABEL = '⚠ Copy failed';
const COPY_FEEDBACK_MS = 1500;

/**
 * Derive an accessible label for a textarea's copy button.
 * Uses the associated label text when available, falling back to the id.
 */
export function deriveCopyButtonLabel(
    labelText: string | null,
    fallbackId: string
): string {
    const base = (labelText && labelText.trim()) || fallbackId;
    return `Copy ${base} to clipboard`;
}

/**
 * Copy text to the clipboard, falling back to selecting a source textarea
 * and using execCommand when the async Clipboard API is unavailable.
 */
export async function copyTextToClipboard(
    text: string,
    sourceTextarea?: HTMLTextAreaElement
): Promise<boolean> {
    try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (error) {
        console.warn('navigator.clipboard.writeText failed, attempting fallback', error);
    }

    if (sourceTextarea) {
        const previousActiveElement = document.activeElement as HTMLElement | null;
        const selectionStart = sourceTextarea.selectionStart;
        const selectionEnd = sourceTextarea.selectionEnd;
        const selectionDirection = sourceTextarea.selectionDirection;
        const scrollTop = sourceTextarea.scrollTop;
        const scrollLeft = sourceTextarea.scrollLeft;

        try {
            sourceTextarea.focus();
            sourceTextarea.select();
            const succeeded = document.execCommand('copy');
            return succeeded;
        } catch (error) {
            console.error('Fallback clipboard copy failed', error);
        } finally {
            if (selectionStart !== null && selectionEnd !== null) {
                sourceTextarea.setSelectionRange(
                    selectionStart,
                    selectionEnd,
                    selectionDirection ?? undefined
                );
            } else {
                sourceTextarea.setSelectionRange(0, 0);
            }
            sourceTextarea.scrollTop = scrollTop;
            sourceTextarea.scrollLeft = scrollLeft;
            if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
                previousActiveElement.focus();
            }
        }
    }

    return false;
}

/**
 * Find the visible label text associated with a textarea, if any.
 */
function findLabelText(textarea: HTMLTextAreaElement): string | null {
    if (textarea.id) {
        const label = document.querySelector<HTMLLabelElement>(
            `label[for="${textarea.id}"]`
        );
        if (label && label.textContent) {
            return label.textContent;
        }
    }
    return null;
}

/**
 * Create a copy-to-clipboard button bound to the given textarea.
 */
export function createCopyButton(textarea: HTMLTextAreaElement): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = COPY_BUTTON_CLASS;
    button.textContent = COPY_DEFAULT_LABEL;
    button.title = COPY_DEFAULT_LABEL;
    button.setAttribute(
        'aria-label',
        deriveCopyButtonLabel(findLabelText(textarea), textarea.id)
    );

    let resetTimeoutId: number | null = null;

    button.addEventListener('click', async () => {
        const succeeded = await copyTextToClipboard(textarea.value, textarea);
        button.textContent = succeeded ? COPY_SUCCESS_LABEL : COPY_ERROR_LABEL;

        if (resetTimeoutId !== null) {
            clearTimeout(resetTimeoutId);
        }
        resetTimeoutId = window.setTimeout(() => {
            button.textContent = COPY_DEFAULT_LABEL;
            resetTimeoutId = null;
        }, COPY_FEEDBACK_MS);
    });

    return button;
}

/**
 * Wrap each textarea in a positioned container and overlay a
 * copy-to-clipboard button inside the textarea (top-right corner).
 */
export function initializeClipboardButtons(): void {
    const textareas = document.querySelectorAll<HTMLTextAreaElement>('textarea');

    textareas.forEach((textarea) => {
        // Avoid wrapping twice (e.g. on re-initialization).
        const parent = textarea.parentElement;
        if (parent && parent.classList.contains(COPY_WRAPPER_CLASS)) {
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = COPY_WRAPPER_CLASS;

        const button = createCopyButton(textarea);

        // Insert the wrapper where the textarea is, then move the textarea
        // inside it and overlay the copy button on top of the textarea.
        textarea.parentNode?.insertBefore(wrapper, textarea);
        wrapper.appendChild(textarea);
        wrapper.appendChild(button);
    });
}
