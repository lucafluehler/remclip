import type { RNPlugin } from '@remnote/plugin-sdk';

import { readDocumentTree } from './read-document';
import { serializeDocument } from './serialize-document';
import { writeClipboardText } from './write-clipboard';

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

  await writeClipboardText(markdown);
  return 'copied';
}

export async function copyCurrentDocument(
  plugin: RNPlugin
): Promise<'copied' | 'missing-document'> {
  const paneId = await plugin.window.getFocusedPaneId();
  return copyPaneDocument(plugin, paneId);
}

export async function copyPaneDocument(
  plugin: RNPlugin,
  paneId: string | undefined
): Promise<'copied' | 'missing-document'> {
  const documentId = await plugin.window.getOpenPaneRemId(paneId);

  if (!documentId) {
    return 'missing-document';
  }

  return copyDocument(plugin, documentId);
}
