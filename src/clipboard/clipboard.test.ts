/**
 * Tests for clipboard utility functions
 */

import { afterEach, describe, it, expect, vi } from 'vitest';
import {
    copyTextToClipboard,
    deriveCopyButtonLabel,
    initializeClipboardButtons,
} from './index';

afterEach(() => {
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
    it('inserts a copy button before each textarea and avoids duplicates on re-init', () => {
        const inserted: Array<{ node: any; ref: any }> = [];
        const textarea = { id: '', value: '' } as HTMLTextAreaElement & {
            previousElementSibling?: any;
            parentNode?: any;
        };
        const parentNode = {
            insertBefore(node: any, ref: any) {
                inserted.push({ node, ref });
                if (ref === textarea) {
                    textarea.previousElementSibling = node;
                }
            },
        };
        textarea.parentNode = parentNode;
        textarea.previousElementSibling = null;

        vi.stubGlobal('document', {
            querySelectorAll: vi.fn().mockReturnValue([textarea]),
            querySelector: vi.fn().mockReturnValue(null),
            createElement: vi.fn().mockImplementation(() => {
                const button: any = {
                    className: '',
                    type: '',
                    title: '',
                    textContent: '',
                    addEventListener: vi.fn(),
                    setAttribute: vi.fn(),
                };
                button.classList = {
                    contains: (className: string) =>
                        button.className.split(/\s+/).includes(className),
                };
                return button;
            }),
        });

        initializeClipboardButtons();
        expect(inserted).toHaveLength(1);
        expect(inserted[0].ref).toBe(textarea);

        initializeClipboardButtons();
        expect(inserted).toHaveLength(1);
    });
});
