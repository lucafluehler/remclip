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
    remType: 0,
    practiceDirection: 'forward',
    children: [],
    ...options,
  };
}

describe('serializeDocument', () => {
  it('renders the document as H1 and uses four-space hierarchy indentation', () => {
    const tree = node('Document title', {
      children: [
        node('First child', { children: [node('Grandchild')] }),
        node('Second child'),
      ],
    });

    expect(serializeDocument(tree)).toBe(
      '- # Document title\n    - First child\n        - Grandchild\n    - Second child'
    );
  });

  it('preserves empty top-level separators', () => {
    const tree = node('Document', {
      children: [node('', { children: [node('Section', { fontSize: 'H1' })] })],
    });

    expect(serializeDocument(tree)).toBe('- # Document\n- \n- # Section');
  });

  it('renders a basic forward card with the AI arrow delimiter', () => {
    const tree = node('Document', {
      children: [node('Question', { backMarkdown: 'Answer' })],
    });

    expect(serializeDocument(tree)).toBe('- # Document\n    - Question→Answer');
  });

  it('uses RemNote concept and descriptor delimiters', () => {
    const tree = node('Document', {
      children: [
        node('Concept', {
          backMarkdown: 'Definition',
          remType: 1,
          practiceDirection: 'both',
        }),
        node('descriptor', {
          backMarkdown: 'value',
          remType: 2,
          practiceDirection: 'forward',
        }),
        node('disabled descriptor', {
          backMarkdown: 'value',
          remType: 2,
          practiceDirection: 'none',
        }),
        node('Question', { backMarkdown: 'Answer' }),
      ],
    });

    expect(serializeDocument(tree)).toBe(
      '- # Document\n' +
        '    - Concept::Definition\n' +
        '    - descriptor;;value\n' +
        '    - disabled descriptor;-value\n' +
        '    - Question→Answer'
    );
  });

  it('marks an ordinary child-based card as multiline', () => {
    const tree = node('Document', {
      children: [
        node('Question', {
          children: [node('Answer detail', { isCardItem: true })],
        }),
      ],
    });

    expect(serializeDocument(tree)).toBe(
      '- # Document\n    - Question   >>>\n        - Answer detail'
    );
  });

  it('flattens a formal definition card structurally', () => {
    const formalDefinition = node('Formal Definition', {
      children: [
        node('first answer part', { isCardItem: true }),
        node('second answer part', { children: [node('nested detail')] }),
      ],
    });
    const tree = node('Document', { children: [formalDefinition] });

    expect(serializeDocument(tree)).toBe(
      '- # Document\n    - Formal Definition;;first answer part second answer part nested detail'
    );
  });

  it('does not flatten a non-card heading named formal definition', () => {
    const tree = node('Document', {
      children: [
        node('formal definition', { children: [node('ordinary child')] }),
      ],
    });

    expect(serializeDocument(tree)).toBe(
      '- # Document\n    - formal definition\n        - ordinary child'
    );
  });

  it('does not flatten a formal definition with explicit back text', () => {
    const tree = node('Document', {
      children: [
        node('formal definition', {
          backMarkdown: 'direct answer',
          children: [node('extra detail', { isCardItem: true })],
        }),
      ],
    });

    expect(serializeDocument(tree)).toBe(
      '- # Document\n' +
        '    - formal definition→direct answer\n' +
        '        - extra detail'
    );
  });

  it('cleans rich text in fronts, backs, and flattened answers', () => {
    const tree = node('Document', {
      children: [
        node('formal definition #[[Tag]]', {
          children: [
            node('{{c1::visible}}', { isCardItem: true }),
            node('[label](https://example.com)'),
            node('![omit](image.png)'),
          ],
        }),
      ],
    });

    expect(serializeDocument(tree)).toBe(
      '- # Document\n    - formal definition;;visible label'
    );
  });

  it('suppresses a duplicate first H1 while retaining its children', () => {
    const tree = node('Waves', {
      children: [
        node('Waves', {
          fontSize: 'H1',
          children: [node('Wave')],
        }),
        node('Next section', { fontSize: 'H1' }),
      ],
    });

    expect(serializeDocument(tree)).toBe(
      '- # Waves\n    - Wave\n- # Next section'
    );
  });

  it('omits query artifacts', () => {
    const tree = node('Document', {
      children: [node('Visible'), node('query:Visible')],
    });

    expect(serializeDocument(tree)).toBe('- # Document\n    - Visible');
  });

  it('compacts block math and leaves one space before it on card backs', () => {
    const tree = node('Document', {
      children: [
        node('formula', {
          backMarkdown: '$$\n x = y\n$$',
          remType: 2,
        }),
      ],
    });

    expect(serializeDocument(tree)).toBe(
      '- # Document\n    - formula;; $$x = y$$'
    );
  });

  it('renders an empty document heading', () => {
    expect(serializeDocument(node(''))).toBe('- # ');
  });

  it('does not append a trailing newline', () => {
    expect(serializeDocument(node('Document'))).toBe('- # Document');
  });
});
