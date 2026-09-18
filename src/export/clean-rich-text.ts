const IMAGE_PATTERN = /[ \t]*!\[[^\]]*\]\((?:\\.|[^)])*\)[ \t]*/g;
const LINK_PATTERN = /\[([^\[\]]+)\]\((?:\\.|[^)])*\)/g;
const TAG_PATTERN = /[ \t]*#\[\[[\s\S]*?\]\][ \t]*/g;
const BLOCK_MATH_PATTERN = /\$\$([\s\S]*?)\$\$/g;
const CLOZE_PATTERN = /\{\{(?:c\d+::)?([\s\S]*?)\}\}/gi;

function unwrapClozes(markdown: string): string {
  let current = markdown;

  for (let pass = 0; pass < 10; pass += 1) {
    const next = current.replace(CLOZE_PATTERN, '$1');
    if (next === current) {
      return current;
    }
    current = next;
  }

  return current;
}

function collapseBlockMath(markdown: string): string {
  return markdown.replace(BLOCK_MATH_PATTERN, (_match, expression: string) => {
    const compactExpression = expression.replace(/\s+/g, ' ').trim();
    return compactExpression ? `$$${compactExpression}$$` : '$$$$';
  });
}

function joinPhysicalLines(markdown: string): string {
  const trailingWhitespace = markdown.match(/[ \t]+$/)?.[0] ?? '';
  const joined = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .trim();

  return joined ? joined + trailingWhitespace : '';
}

function removeStandaloneElement(markdown: string, pattern: RegExp): string {
  return markdown.replace(pattern, (match, offset: number, source: string) => {
    const hasContentBefore = Boolean(source.slice(0, offset).trim());
    const hasContentAfter = Boolean(source.slice(offset + match.length).trim());
    return hasContentBefore && hasContentAfter ? ' ' : '';
  });
}

/** Clean one Rem's converted rich text for the compact AI-oriented output. */
export function cleanRichTextMarkdown(markdown: string | undefined): string {
  if (!markdown) {
    return '';
  }

  let cleaned = markdown;
  cleaned = removeStandaloneElement(cleaned, TAG_PATTERN);
  cleaned = cleaned.replace(/;;</g, ';;');
  cleaned = unwrapClozes(cleaned);
  cleaned = removeStandaloneElement(cleaned, IMAGE_PATTERN);
  cleaned = cleaned.replace(LINK_PATTERN, '$1');
  cleaned = collapseBlockMath(cleaned);
  cleaned = joinPhysicalLines(cleaned);

  return cleaned;
}
