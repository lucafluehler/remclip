import { cleanRichTextMarkdown } from './clean-rich-text';
import type { ExportNode } from './types';

const INDENT = '    ';
const CONCEPT_REM_TYPE = 1;
const DESCRIPTOR_REM_TYPE = 2;

function cardDelimiter(node: ExportNode): string {
  if (node.remType === CONCEPT_REM_TYPE) {
    return {
      forward: ':>',
      backward: ':<',
      both: '::',
      none: ':-',
    }[node.practiceDirection];
  }

  if (node.remType === DESCRIPTOR_REM_TYPE) {
    return {
      forward: ';;',
      backward: ';<',
      both: ';;',
      none: ';-',
    }[node.practiceDirection];
  }

  return {
    forward: '→',
    backward: '←',
    both: '↔',
    none: '→',
  }[node.practiceDirection];
}

function headingPrefix(node: ExportNode): string {
  return node.fontSize ? `${'#'.repeat(Number(node.fontSize.slice(1)))} ` : '';
}

function nodeOwnContent(node: ExportNode): string {
  const front = cleanRichTextMarkdown(node.frontMarkdown);
  const back = cleanRichTextMarkdown(node.backMarkdown);

  if (front && back) {
    const gap = back.trimStart().startsWith('$$') ? ' ' : '';
    return `${headingPrefix(node)}${front}${cardDelimiter(node)}${gap}${back}`;
  }

  const content = front || back;
  return content ? `${headingPrefix(node)}${content}` : '';
}

function visibleMatchText(markdown: string): string {
  return markdown
    .replace(/[*_~`]/g, '')
    .replace(/\\([\\{}[\]()#+.!-])/g, '$1')
    .trim()
    .toLocaleLowerCase();
}

function isFormalDefinition(node: ExportNode): boolean {
  if (
    cleanRichTextMarkdown(node.backMarkdown) ||
    !node.children.some((child) => child.isCardItem)
  ) {
    return false;
  }

  return visibleMatchText(cleanRichTextMarkdown(node.frontMarkdown)) === 'formal definition';
}

function flattenAnswer(node: ExportNode): string[] {
  if (isQueryNode(node)) {
    return [];
  }

  const ownContent = nodeOwnContent(node);
  const parts = ownContent ? [ownContent] : [];

  for (const child of node.children) {
    parts.push(...flattenAnswer(child));
  }

  return parts;
}

function serializeNode(node: ExportNode, depth: number): string[] {
  if (isQueryNode(node)) {
    return [];
  }

  const front = cleanRichTextMarkdown(node.frontMarkdown);
  const back = cleanRichTextMarkdown(node.backMarkdown);
  let ownContent = nodeOwnContent(node);

  if (isFormalDefinition(node)) {
    const answer = node.children.flatMap(flattenAnswer).join(' ').trim();
    ownContent = `${headingPrefix(node)}${front};;${answer}`;
  } else if (
    front &&
    !back &&
    node.children.some((child) => child.isCardItem)
  ) {
    ownContent = `${headingPrefix(node)}${front}   >>>`;
  }

  const lines: string[] = [];
  const blockMathGap = ownContent.trimStart().startsWith('$$') ? ' ' : '';
  lines.push(`${INDENT.repeat(depth)}- ${blockMathGap}${ownContent}`);

  if (!isFormalDefinition(node)) {
    const childDepth = ownContent ? depth + 1 : depth;
    for (const child of node.children) {
      lines.push(...serializeNode(child, childDepth));
    }
  }

  return lines;
}

export function serializeRemTrees(roots: readonly ExportNode[]): string {
  return roots.flatMap((root) => serializeNode(root, 0)).join('\n');
}

export function serializeDocument(root: ExportNode): string {
  const rootFront = cleanRichTextMarkdown(root.frontMarkdown).trimEnd();
  const lines = [`- # ${rootFront}`];

  for (const child of root.children) {
    const childFront = cleanRichTextMarkdown(child.frontMarkdown).trimEnd();
    const isDuplicateDocumentHeading =
      visibleMatchText(childFront) === visibleMatchText(rootFront);

    if (isDuplicateDocumentHeading) {
      for (const grandchild of child.children) {
        lines.push(...serializeNode(grandchild, 1));
      }
    } else {
      const depth = child.fontSize === 'H1' || !childFront ? 0 : 1;
      lines.push(...serializeNode(child, depth));
    }
  }

  return lines.join('\n');
}

function isQueryNode(node: ExportNode): boolean {
  return visibleMatchText(cleanRichTextMarkdown(node.frontMarkdown)).startsWith(
    'query:'
  );
}
