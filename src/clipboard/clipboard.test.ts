/**
 * Tests for clipboard utility functions
 */

import { afterEach, describe, it, expect, vi } from 'vitest';
import {
    copyTextToClipboard,
    createCopyButton,
    deriveCopyButtonLabel,
    initializeClipboardButtons,
} from './index';

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('deriveCopyButtonLabel', () => {
    it('uses the label text when provided', () => {
        expect(deriveCopyButtonLabel('MML Input', 'mmlInput')).toBe(
            'Copy MML Input to clipboard'
        );
    });

    it('trims surrounding whitespace from the label text', () => {
        expect(deriveCopyButtonLabel('  Edit Events JSON:  ', 'jsonEditor')).toBe(
            'Copy Edit Events JSON: to clipboard'
        );
    });

    it('falls back to the id when label text is null', () => {
        expect(deriveCopyButtonLabel(null, 'toneEditor')).toBe(
            'Copy toneEditor to clipboard'
        );
    });

    it('falls back to the id when label text is empty or whitespace', () => {
        expect(deriveCopyButtonLabel('', 'registersEditor')).toBe(
            'Copy registersEditor to clipboard'
        );
        expect(deriveCopyButtonLabel('   ', 'combinedMML')).toBe(
            'Copy combinedMML to clipboard'
        );
    });
});

describe('copyTextToClipboard', () => {
    it('returns true when navigator.clipboard.writeText succeeds', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('navigator', { clipboard: { writeText } });
        vi.stubGlobal('document', { execCommand: vi.fn() });

        await expect(copyTextToClipboard('hello')).resolves.toBe(true);
        expect(writeText).toHaveBeenCalledWith('hello');
    });

    it('falls back to execCommand and restores focus, selection, and scroll state', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const writeText = vi.fn().mockRejectedValue(new Error('denied'));
        const refocus = vi.fn();
        const execCommand = vi.fn().mockReturnValue(true);
        const documentMock = { execCommand, activeElement: { focus: refocus } };
        vi.stubGlobal('navigator', { clipboard: { writeText } });
        vi.stubGlobal('document', documentMock);

        const textarea = {
            selectionStart: 2,
            selectionEnd: 5,
            selectionDirection: 'forward',
            scrollTop: 12,
            scrollLeft: 4,
            focus: vi.fn(),
            select: vi.fn(),
            setSelectionRange: vi.fn(),
        } as unknown as HTMLTextAreaElement;

        await expect(copyTextToClipboard('hello', textarea)).resolves.toBe(true);
        expect(execCommand).toHaveBeenCalledWith('copy');
        expect(textarea.focus).toHaveBeenCalledTimes(1);
        expect(textarea.select).toHaveBeenCalledTimes(1);
        expect(textarea.setSelectionRange).toHaveBeenCalledWith(2, 5, 'forward');
        expect(textarea.scrollTop).toBe(12);
        expect(textarea.scrollLeft).toBe(4);
        expect(refocus).toHaveBeenCalledTimes(1);
    });

    it('returns false when fallback copy throws', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.stubGlobal('navigator', { clipboard: undefined });
        vi.stubGlobal('document', {
            activeElement: null,
            execCommand: vi.fn(() => {
                throw new Error('copy failed');
            }),
        });

        const textarea = {
            selectionStart: null,
            selectionEnd: null,
            selectionDirection: null,
            scrollTop: 0,
            scrollLeft: 0,
            focus: vi.fn(),
            select: vi.fn(),
            setSelectionRange: vi.fn(),
        } as unknown as HTMLTextAreaElement;

        await expect(copyTextToClipboard('hello', textarea)).resolves.toBe(false);
        expect(textarea.setSelectionRange).toHaveBeenCalledWith(0, 0);
    });
});

describe('initializeClipboardButtons', () => {
    it('creates a copy button with an inline SVG icon and English label', () => {
        const button: any = {
            className: '',
            type: '',
            title: '',
            innerHTML: '',
            addEventListener: vi.fn(),
            setAttribute: vi.fn(),
        };
        button.classList = {
            add: vi.fn(),
            remove: vi.fn(),
            toggle: vi.fn(),
            contains: (className: string) =>
                button.className.split(/\s+/).includes(className),
        };

        vi.stubGlobal('document', {
            querySelector: vi.fn().mockReturnValue(null),
            createElement: vi.fn().mockReturnValue(button),
        });

        const textarea = {
            id: 'mmlInput',
        } as unknown as HTMLTextAreaElement;

        expect(createCopyButton(textarea)).toBe(button);
        expect(button.innerHTML).toContain('<svg');
        expect(button.innerHTML).toContain('copy-textarea-icon');
        expect(button.innerHTML).toContain('>Copy</span>');
        expect(button.title).toBe('Copy');
    });

    it('wraps each textarea and overlays a copy button, avoiding duplicates on re-init', () => {
        const inserted: Array<{ node: any; ref: any }> = [];

        const wrapper: any = {
            className: '',
            children: [] as any[],
            appendChild(node: any) {
                this.children.push(node);
                node.parentElement = wrapper;
                return node;
            },
        };
        wrapper.classList = {
            contains: (className: string) =>
                wrapper.className.split(/\s+/).includes(className),
        };

        const originalParent = {
            insertBefore(node: any, ref: any) {
                inserted.push({ node, ref });
            },
        };

        const textarea = {
            id: '',
            value: '',
            parentElement: null as any,
            parentNode: originalParent,
        } as unknown as HTMLTextAreaElement;

        vi.stubGlobal('document', {
            querySelectorAll: vi.fn().mockReturnValue([textarea]),
            querySelector: vi.fn().mockReturnValue(null),
            createElement: vi.fn().mockImplementation((tag: string) => {
                if (tag === 'div') {
                    return wrapper;
                }
                const button: any = {
                    className: '',
                    type: '',
                    title: '',
                    textContent: '',
                    innerHTML: '',
                    addEventListener: vi.fn(),
                    setAttribute: vi.fn(),
                };
                button.classList = {
                    add: vi.fn(),
                    remove: vi.fn(),
                    toggle: vi.fn(),
                    contains: (className: string) =>
                        button.className.split(/\s+/).includes(className),
                };
                return button;
            }),
        });

        initializeClipboardButtons();

        // The wrapper is inserted where the textarea was, then the textarea and
        // the copy button are moved inside the wrapper.
        expect(inserted).toHaveLength(1);
        expect(inserted[0].node).toBe(wrapper);
        expect(inserted[0].ref).toBe(textarea);
        expect(wrapper.className).toBe('copy-textarea-wrapper');
        expect(wrapper.children).toContain(textarea);
        expect(wrapper.children).toHaveLength(2);

        // Re-initialization should not wrap the textarea again.
        initializeClipboardButtons();
        expect(inserted).toHaveLength(1);
        expect(wrapper.children).toHaveLength(2);
    });
});
