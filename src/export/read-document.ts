import type { PluginRem, RNPlugin } from '@remnote/plugin-sdk';

import type { ExportNode } from './types';

async function readOr<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch {
    return fallback;
  }
}

async function richTextToMarkdown(
  plugin: RNPlugin,
  richText: PluginRem['text']
): Promise<string> {
  if (!richText) {
    return '';
  }

  try {
    return await plugin.richText.toMarkdown(richText);
  } catch (error) {
    console.warn('RemClip could not convert rich text to Markdown; using plain text.', error);

    try {
      return await plugin.richText.toString(richText);
    } catch {
      return richText.filter((item): item is string => typeof item === 'string').join('');
    }
  }
}

async function readNode(
  plugin: RNPlugin,
  rem: PluginRem,
  ancestorIds: ReadonlySet<string>
): Promise<ExportNode> {
  if (ancestorIds.has(rem._id)) {
    throw new Error(`A cycle was found while reading Rem ${rem._id}.`);
  }

  const nextAncestorIds = new Set(ancestorIds);
  nextAncestorIds.add(rem._id);

  const [
    frontMarkdown,
    backMarkdown,
    isCardItem,
    remType,
    fontSize,
    practiceDirection,
    children,
  ] = await Promise.all([
    richTextToMarkdown(plugin, rem.text),
    richTextToMarkdown(plugin, rem.backText),
    rem.isCardItem(),
    readOr(() => rem.getType(), 0),
    readOr(() => rem.getFontSize(), undefined),
    readOr(() => rem.getPracticeDirection(), 'none' as const),
    rem.getChildrenRem(),
  ]);

  // Read sequentially so large documents do not flood the SDK message bridge.
  const childNodes: ExportNode[] = [];
  for (const child of children) {
    childNodes.push(await readNode(plugin, child, nextAncestorIds));
  }

  return {
    id: rem._id,
    frontMarkdown,
    backMarkdown: backMarkdown || undefined,
    isCardItem,
    remType,
    fontSize,
    practiceDirection,
    children: childNodes,
  };
}

export async function readDocumentTree(
  plugin: RNPlugin,
  documentId: string
): Promise<ExportNode | undefined> {
  const document = await plugin.rem.findOne(documentId);
  return document ? readNode(plugin, document, new Set()) : undefined;
}
