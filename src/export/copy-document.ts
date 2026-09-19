import type { PluginRem, RNPlugin } from '@remnote/plugin-sdk';

import { cleanRichTextMarkdown } from './clean-rich-text';
import {
  readDocumentTree,
  readRemTree,
  richTextToMarkdown,
} from './read-document';
import { serializeDocument, serializeRemTrees } from './serialize-document';
import { writeClipboardText } from './write-clipboard';

type EditorSelection = Awaited<ReturnType<RNPlugin['editor']['getSelection']>>;

async function hasSelectedAncestor(
  rem: PluginRem,
  selectedIds: ReadonlySet<string>
): Promise<boolean> {
  const visitedIds = new Set([rem._id]);
  let parent = await rem.getParentRem();

  while (parent && !visitedIds.has(parent._id)) {
    if (selectedIds.has(parent._id)) {
      return true;
    }

    visitedIds.add(parent._id);
    parent = await parent.getParentRem();
  }

  return false;
}

export async function exportSelection(
  plugin: RNPlugin,
  selection?: EditorSelection
): Promise<string | undefined> {
  const currentSelection = selection ?? (await plugin.editor.getSelection());

  if (!currentSelection) {
    return undefined;
  }

  if (currentSelection.type === 'Text') {
    if (currentSelection.range.start === currentSelection.range.end) {
      return undefined;
    }

    const markdown = await richTextToMarkdown(plugin, currentSelection.richText);
    const cleanedMarkdown = cleanRichTextMarkdown(markdown);
    return cleanedMarkdown || undefined;
  }

  if (currentSelection.type !== 'Rem' || currentSelection.remIds.length === 0) {
    return undefined;
  }

  const selectedIds = new Set(currentSelection.remIds);
  const selectedRems: PluginRem[] = [];

  // Read one at a time to preserve the order provided by RemNote.
  for (const remId of currentSelection.remIds) {
    const rem = await plugin.rem.findOne(remId);

    if (rem && !(await hasSelectedAncestor(rem, selectedIds))) {
      selectedRems.push(rem);
    }
  }

  const trees = [];
  for (const rem of selectedRems) {
    trees.push(await readRemTree(plugin, rem));
  }

  return serializeRemTrees(trees);
}

export async function exportSelectionOrDocument(
  plugin: RNPlugin,
  documentId: string,
  selection?: EditorSelection
): Promise<string | undefined> {
  const selectedMarkdown = await exportSelection(plugin, selection);
  return selectedMarkdown ?? exportDocument(plugin, documentId);
}

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
