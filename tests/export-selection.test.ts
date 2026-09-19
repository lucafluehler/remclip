import {
  type PluginRem,
  type RichTextInterface,
  type RNPlugin,
} from '@remnote/plugin-sdk';
import { describe, expect, it, vi } from 'vitest';

import {
  exportSelection,
  exportSelectionOrDocument,
} from '../src/export/copy-document';

function rem(
  id: string,
  text: string,
  options: {
    children?: PluginRem[];
    parent?: PluginRem;
  } = {}
): PluginRem {
  return {
    _id: id,
    text: [text],
    backText: undefined,
    isCardItem: vi.fn().mockResolvedValue(false),
    getChildrenRem: vi.fn().mockResolvedValue(options.children ?? []),
    getParentRem: vi.fn().mockResolvedValue(options.parent),
  } as unknown as PluginRem;
}

describe('exportSelection', () => {
  it('cleans and returns a selected text range', async () => {
    const richText = ['selected text'] as RichTextInterface;
    const plugin = {
      editor: {
        getSelection: vi.fn().mockResolvedValue({
          type: 'Text',
          remId: 'rem-1',
          richText,
          isReverse: false,
          range: { start: 0, end: 13 },
        }),
      },
      richText: {
        toMarkdown: vi
          .fn()
          .mockResolvedValue('**Selected** #[[Tag]] [label](https://example.com)'),
      },
    } as unknown as RNPlugin;

    await expect(exportSelection(plugin)).resolves.toBe('**Selected** label');
    expect(plugin.richText.toMarkdown).toHaveBeenCalledWith(richText);
  });

  it('treats a collapsed caret as no selection', async () => {
    const plugin = {
      editor: {
        getSelection: vi.fn().mockResolvedValue({
          type: 'Text',
          remId: 'rem-1',
          richText: [],
          isReverse: false,
          range: { start: 4, end: 4 },
        }),
      },
      richText: { toMarkdown: vi.fn() },
    } as unknown as RNPlugin;

    await expect(exportSelection(plugin)).resolves.toBeUndefined();
    expect(plugin.richText.toMarkdown).not.toHaveBeenCalled();
  });

  it('falls back to the document for a collapsed caret', async () => {
    const document = rem('document', 'Document title');
    const plugin = {
      editor: {
        getSelection: vi.fn().mockResolvedValue({
          type: 'Text',
          remId: 'document',
          richText: [],
          isReverse: false,
          range: { start: 5, end: 5 },
        }),
      },
      rem: { findOne: vi.fn().mockResolvedValue(document) },
      richText: {
        toMarkdown: vi.fn((value: RichTextInterface) =>
          Promise.resolve(value.join(''))
        ),
      },
    } as unknown as RNPlugin;

    await expect(exportSelectionOrDocument(plugin, 'document')).resolves.toBe(
      '- # Document title'
    );
  });

  it('preserves selected Rem order and does not duplicate selected descendants', async () => {
    const child = rem('child', 'Child');
    const parent = rem('parent', 'Parent', { children: [child] });
    const sibling = rem('sibling', 'Sibling');
    vi.mocked(child.getParentRem).mockResolvedValue(parent);

    const rems = new Map([
      [parent._id, parent],
      [child._id, child],
      [sibling._id, sibling],
    ]);
    const plugin = {
      editor: {
        getSelection: vi.fn().mockResolvedValue({
          type: 'Rem',
          remIds: ['parent', 'child', 'sibling'],
        }),
      },
      rem: {
        findOne: vi.fn((id: string) => Promise.resolve(rems.get(id))),
      },
      richText: {
        toMarkdown: vi.fn((value: RichTextInterface) =>
          Promise.resolve(value.join(''))
        ),
      },
    } as unknown as RNPlugin;

    await expect(exportSelection(plugin)).resolves.toBe(
      '- Parent\n    - Child\n- Sibling'
    );
  });

  it('falls back to the pane document when nothing is selected', async () => {
    const document = rem('document', 'Document title');
    const plugin = {
      editor: { getSelection: vi.fn().mockResolvedValue(undefined) },
      rem: { findOne: vi.fn().mockResolvedValue(document) },
      richText: {
        toMarkdown: vi.fn((value: RichTextInterface) =>
          Promise.resolve(value.join(''))
        ),
      },
    } as unknown as RNPlugin;

    await expect(exportSelectionOrDocument(plugin, 'document')).resolves.toBe(
      '- # Document title'
    );
  });
});
