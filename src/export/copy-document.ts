import type { RNPlugin } from '@remnote/plugin-sdk';

import { readDocumentTree } from './read-document';
import { serializeDocument } from './serialize-document';

export async function exportDocument(
  plugin: RNPlugin,
  documentId: string
): Promise<string | undefined> {
  const tree = await readDocumentTree(plugin, documentId);
  return tree ? serializeDocument(tree) : undefined;
}

export async function copyDocument(
  plugin: RNPlugin,
  documentId: string
): Promise<'copied' | 'missing-document'> {
  const markdown = await exportDocument(plugin, documentId);

  if (markdown === undefined) {
    return 'missing-document';
  }

  await navigator.clipboard.writeText(markdown);
  return 'copied';
}
