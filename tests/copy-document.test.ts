import type { PluginRem, RNPlugin } from '@remnote/plugin-sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { copyCurrentDocument } from '../src/export/copy-document';
import { writeClipboardText } from '../src/export/write-clipboard';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('copyCurrentDocument', () => {
  it('prefers the synchronous sandbox clipboard path when available', async () => {
    const execCommand = vi.fn().mockReturnValue(true);
    const browserWriteText = vi.fn();
    const textarea = {
      value: '',
      style: {},
      setAttribute: vi.fn(),
      select: vi.fn(),
      setSelectionRange: vi.fn(),
      remove: vi.fn(),
    };
    vi.stubGlobal('document', {
      body: { appendChild: vi.fn() },
      createElement: vi.fn().mockReturnValue(textarea),
      execCommand,
    });
    vi.stubGlobal('navigator', { clipboard: { writeText: browserWriteText } });

    await expect(writeClipboardText('sandbox copy')).resolves.toBeUndefined();
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(textarea.value).toBe('sandbox copy');
    expect(browserWriteText).not.toHaveBeenCalled();
  });

  it('uses the async browser clipboard when the synchronous path is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(writeClipboardText('browser copy')).resolves.toBeUndefined();
    expect(writeText).toHaveBeenCalledWith('browser copy');
  });

  it('returns missing-document when the focused pane has no Rem', async () => {
    const plugin = {
      window: {
        getFocusedPaneId: vi.fn().mockResolvedValue('pane-1'),
        getOpenPaneRemId: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as RNPlugin;

    await expect(copyCurrentDocument(plugin)).resolves.toBe('missing-document');
    expect(plugin.window.getOpenPaneRemId).toHaveBeenCalledWith('pane-1');
  });

  it('exports and copies the document from the focused pane', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const document = {
      _id: 'document-1',
      text: ['Document title'],
      backText: undefined,
      isCardItem: vi.fn().mockResolvedValue(false),
      getChildrenRem: vi.fn().mockResolvedValue([]),
    } as unknown as PluginRem;

    const plugin = {
      window: {
        getFocusedPaneId: vi.fn().mockResolvedValue('pane-1'),
        getOpenPaneRemId: vi.fn().mockResolvedValue('document-1'),
      },
      rem: {
        findOne: vi.fn().mockResolvedValue(document),
      },
      richText: {
        toMarkdown: vi.fn().mockResolvedValue('Document title'),
      },
    } as unknown as RNPlugin;

    await expect(copyCurrentDocument(plugin)).resolves.toBe('copied');
    expect(plugin.rem.findOne).toHaveBeenCalledWith('document-1');
    expect(writeText).toHaveBeenCalledWith('- # Document title');
  });

  it('copies through the synchronous sandbox path after document export', async () => {
    const writeText = vi.fn();
    const execCommand = vi.fn().mockReturnValue(true);
    const remove = vi.fn();
    const textarea = {
      value: '',
      style: {},
      setAttribute: vi.fn(),
      select: vi.fn(),
      setSelectionRange: vi.fn(),
      remove,
    };

    vi.stubGlobal('navigator', { clipboard: { writeText } });
    vi.stubGlobal('document', {
      body: { appendChild: vi.fn() },
      createElement: vi.fn().mockReturnValue(textarea),
      execCommand,
    });

    const documentRem = {
      _id: 'document-1',
      text: ['Document title'],
      backText: undefined,
      isCardItem: vi.fn().mockResolvedValue(false),
      getChildrenRem: vi.fn().mockResolvedValue([]),
    } as unknown as PluginRem;

    const plugin = {
      window: {
        getFocusedPaneId: vi.fn().mockResolvedValue('pane-1'),
        getOpenPaneRemId: vi.fn().mockResolvedValue('document-1'),
      },
      rem: {
        findOne: vi.fn().mockResolvedValue(documentRem),
      },
      richText: {
        toMarkdown: vi.fn().mockResolvedValue('Document title'),
      },
    } as unknown as RNPlugin;

    await expect(copyCurrentDocument(plugin)).resolves.toBe('copied');
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(textarea.value).toBe('- # Document title');
    expect(writeText).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledOnce();
  });
});
