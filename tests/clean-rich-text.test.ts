import { describe, expect, it } from 'vitest';

import { cleanRichTextMarkdown } from '../src/export/clean-rich-text';
import { cleanerCases } from './fixtures/cleaner-cases';

describe('cleanRichTextMarkdown', () => {
  for (const testCase of cleanerCases) {
    it(testCase.name, () => {
      expect(cleanRichTextMarkdown(testCase.input)).toBe(testCase.expected);
    });
  }

  it('accepts missing rich text', () => {
    expect(cleanRichTextMarkdown(undefined)).toBe('');
  });

  it('unwraps nested clozes without looping forever', () => {
    expect(cleanRichTextMarkdown('{{c1::outer {{inner}}}}')).toBe('outer inner');
  });

  it('preserves intentional inline and trailing spaces from the exporter', () => {
    expect(cleanRichTextMarkdown('A  _stationary_  wave  ')).toBe(
      'A  _stationary_  wave  '
    );
  });

  it('does not leave a space where a trailing tag was removed', () => {
    expect(cleanRichTextMarkdown('formal definition #[[Tag]]')).toBe(
      'formal definition'
    );
  });
});
