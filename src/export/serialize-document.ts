import { cleanRichTextMarkdown } from './clean-rich-text';
import type { ExportNode } from './types';

function nodeOwnContent(node: ExportNode): string {
  const front = cleanRichTextMarkdown(node.frontMarkdown);
  const back = cleanRichTextMarkdown(node.backMarkdown);

  if (front && back) {
    return `${front};;${back}`;
  }

  return front || back;
}

function visibleMatchText(markdown: string): string {
  return markdown
    .replace(/[*_~`]/g, '')
    .replace(/\\([\\{}[\]()#+.!-])/g, '$1')
    .trim()
    .toLocaleLowerCase();
}

function isFormalDefinition(node: ExportNode): boolean {
  if (!node.isCardItem || cleanRichTextMarkdown(node.backMarkdown) || node.children.length === 0) {
    return false;
  }

  return visibleMatchText(cleanRichTextMarkdown(node.frontMarkdown)) === 'formal definition';
}

function flattenAnswer(node: ExportNode): string[] {
  const ownContent = nodeOwnContent(node);
  const parts = ownContent ? [ownContent] : [];

  for (const child of node.children) {
    parts.push(...flattenAnswer(child));
  }

  return parts;
}

function serializeNode(node: ExportNode, depth: number): string[] {
  const front = cleanRichTextMarkdown(node.frontMarkdown);
  const back = cleanRichTextMarkdown(node.backMarkdown);
  let ownContent = nodeOwnContent(node);

  if (isFormalDefinition(node)) {
    const answer = node.children.flatMap(flattenAnswer).join(' ').trim();
    ownContent = `${front};;${answer}`;
  } else if (front && !back && node.isCardItem && node.children.length > 0) {
    ownContent = `${front} >>>`;
  }

  const lines: string[] = [];
  const hasOwnLine = Boolean(ownContent);

  if (hasOwnLine) {
    lines.push(`${'  '.repeat(depth)}- ${ownContent}`);
  }

  if (!isFormalDefinition(node)) {
    const childDepth = hasOwnLine ? depth + 1 : depth;
    for (const child of node.children) {
      lines.push(...serializeNode(child, childDepth));
    }
  }

  return lines;
}

export function serializeDocument(root: ExportNode): string {
  return serializeNode(root, 0).join('\n');
}
