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

  it('flattens any multiline descriptor card structurally', () => {
    const definition = node('definition', {
      remType: 2,
      children: [
        node('first answer part', { isCardItem: true }),
        node('second answer part', { children: [node('nested detail')] }),
      ],
    });
    const tree = node('Document', { children: [definition] });

    expect(serializeDocument(tree)).toBe(
      '- # Document\n    - definition;;first answer part second answer part nested detail'
    );
  });

  it('does not flatten an ordinary descriptor with child notes', () => {
    const tree = node('Document', {
      children: [
        node('details', {
          remType: 2,
          children: [node('ordinary child')],
        }),
      ],
    });

    expect(serializeDocument(tree)).toBe(
      '- # Document\n    - details\n        - ordinary child'
    );
  });

  it('does not flatten a descriptor with explicit back text', () => {
    const tree = node('Document', {
      children: [
        node('definition', {
          remType: 2,
          backMarkdown: 'direct answer',
          children: [node('extra detail', { isCardItem: true })],
        }),
      ],
    });

    expect(serializeDocument(tree)).toBe(
      '- # Document\n' +
        '    - definition;;direct answer\n' +
        '        - extra detail'
    );
  });

  it('cleans rich text in flattened descriptor answers', () => {
    const tree = node('Document', {
      children: [
        node('explanation #[[Tag]]', {
          remType: 2,
          children: [
            node('{{c1::visible}}', { isCardItem: true }),
            node('[label](https://example.com)'),
            node('![omit](image.png)'),
          ],
        }),
      ],
    });

    expect(serializeDocument(tree)).toBe(
      '- # Document\n    - explanation;;visible label'
    );
  });

  it('preserves the practice direction of a flattened descriptor', () => {
    const tree = node('Document', {
      children: [
        node('source', {
          remType: 2,
          practiceDirection: 'backward',
          children: [node('answer', { isCardItem: true })],
        }),
      ],
    });

    expect(serializeDocument(tree)).toBe('- # Document\n    - source;<answer');
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
