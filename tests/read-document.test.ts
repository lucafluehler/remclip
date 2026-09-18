import type { PluginRem, RNPlugin } from '@remnote/plugin-sdk';
import { describe, expect, it, vi } from 'vitest';

import { readDocumentTree } from '../src/export/read-document';

describe('readDocumentTree', () => {
  it('falls back to plain text when a rich-text element cannot become Markdown', async () => {
    const document = {
      _id: 'document-1',
      text: ['Unsupported rich text'],
      backText: undefined,
      isCardItem: vi.fn().mockResolvedValue(false),
      getType: vi.fn().mockResolvedValue(1),
      getFontSize: vi.fn().mockResolvedValue('H1'),
      getPracticeDirection: vi.fn().mockResolvedValue('both'),
      getChildrenRem: vi.fn().mockResolvedValue([]),
    } as unknown as PluginRem;

    const plugin = {
      rem: { findOne: vi.fn().mockResolvedValue(document) },
      richText: {
        toMarkdown: vi.fn().mockRejectedValue(new Error('Unsupported element')),
        toString: vi.fn().mockResolvedValue('Plain-text fallback'),
      },
    } as unknown as RNPlugin;

    await expect(readDocumentTree(plugin, 'document-1')).resolves.toMatchObject({
      frontMarkdown: 'Plain-text fallback',
      remType: 1,
      fontSize: 'H1',
      practiceDirection: 'both',
    });
  });
});
