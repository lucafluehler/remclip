import { describe, expect, it } from 'vitest';

import { serializeDocument } from '../src/export/serialize-document';
import type { ExportNode } from '../src/export/types';

function node(
  frontMarkdown: string,
  options: Partial<Omit<ExportNode, 'id' | 'frontMarkdown'>> = {}
): ExportNode {
  return {
    id: frontMarkdown || 'empty',
    frontMarkdown,
    isCardItem: false,
    children: [],
    ...options,
  };
}

describe('serializeDocument', () => {
  it('includes the document root and preserves hierarchy and sibling order', () => {
    const tree = node('Document title', {
      children: [
        node('First child', { children: [node('Grandchild')] }),
        node('Second child'),
      ],
    });

    expect(serializeDocument(tree)).toBe(
      '- Document title\n  - First child\n    - Grandchild\n  - Second child'
    );
  });

  it('promotes descendants of an empty Rem without adding an indentation level', () => {
    const tree = node('Document', {
      children: [node('', { children: [node('Visible child')] })],
    });

    expect(serializeDocument(tree)).toBe('- Document\n  - Visible child');
  });

  it('renders front and back text directly as a normalized card', () => {
    const tree = node('Question', { backMarkdown: 'Answer', isCardItem: true });

    expect(serializeDocument(tree)).toBe('- Question;;Answer');
  });

  it('marks an ordinary child-based card as multiline', () => {
    const tree = node('Question', {
      isCardItem: true,
      children: [node('Answer detail')],
    });

    expect(serializeDocument(tree)).toBe('- Question >>>\n  - Answer detail');
  });

  it('flattens a formal definition card structurally', () => {
    const tree = node('Formal Definition', {
      isCardItem: true,
      children: [
        node('first answer part'),
        node('second answer part', { children: [node('nested detail')] }),
      ],
    });

    expect(serializeDocument(tree)).toBe(
      '- Formal Definition;;first answer part second answer part nested detail'
    );
  });

  it('does not flatten a non-card heading named formal definition', () => {
    const tree = node('formal definition', {
      children: [node('ordinary child')],
    });

    expect(serializeDocument(tree)).toBe('- formal definition\n  - ordinary child');
  });

  it('does not flatten a formal definition with explicit back text', () => {
    const tree = node('formal definition', {
      backMarkdown: 'direct answer',
      isCardItem: true,
      children: [node('extra detail')],
    });

    expect(serializeDocument(tree)).toBe(
      '- formal definition;;direct answer\n  - extra detail'
    );
  });

  it('cleans rich text in fronts, backs, and flattened answers', () => {
    const tree = node('formal definition #[[Tag]]', {
      isCardItem: true,
      children: [
        node('{{c1::visible}}'),
        node('[label](https://example.com)'),
        node('![omit](image.png)'),
      ],
    });

    expect(serializeDocument(tree)).toBe(
      '- formal definition;;visible label'
    );
  });

  it('returns an empty string for an entirely empty tree', () => {
    expect(serializeDocument(node(''))).toBe('');
  });

  it('does not append a trailing newline', () => {
    expect(serializeDocument(node('Document'))).toBe('- Document');
  });
});
