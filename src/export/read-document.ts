import type { PluginRem, RNPlugin } from '@remnote/plugin-sdk';

import type { ExportNode } from './types';

async function richTextToMarkdown(
  plugin: RNPlugin,
  richText: PluginRem['text']
): Promise<string> {
  return richText ? plugin.richText.toMarkdown(richText) : '';
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

  const [frontMarkdown, backMarkdown, isCardItem, children] = await Promise.all([
    richTextToMarkdown(plugin, rem.text),
    richTextToMarkdown(plugin, rem.backText),
    rem.isCardItem(),
    rem.getChildrenRem(),
  ]);

  const childNodes = await Promise.all(
    children.map((child) => readNode(plugin, child, nextAncestorIds))
  );

  return {
    id: rem._id,
    frontMarkdown,
    backMarkdown: backMarkdown || undefined,
    isCardItem,
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
