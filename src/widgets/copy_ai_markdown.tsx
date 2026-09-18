import { renderWidget, usePlugin, WidgetLocation } from '@remnote/plugin-sdk';
import { useEffect, useState } from 'react';

import { copyPaneDocument } from '../export/copy-document';
import '../style.css';
import '../index.css';

function ClipboardIcon() {
  return (
    <svg
      aria-hidden="true"
      className="remclip-icon"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5.25H6.75A2.25 2.25 0 0 0 4.5 7.5v11.25A2.25 2.25 0 0 0 6.75 21h8.25a2.25 2.25 0 0 0 2.25-2.25V16.5M9 5.25A2.25 2.25 0 0 1 11.25 3h1.5A2.25 2.25 0 0 1 15 5.25M9 5.25A2.25 2.25 0 0 0 11.25 7.5h1.5A2.25 2.25 0 0 0 15 5.25m0 0h2.25A2.25 2.25 0 0 1 19.5 7.5v3.75"
      />
    </svg>
  );
}

function CopyAiMarkdownWidget() {
  const plugin = usePlugin();
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (!plugin.isNative || !plugin.mountDiv) {
      return;
    }

    let widgetHost: HTMLElement | null = plugin.mountDiv;

    // PaneHeader widgets are appended after RemNote's overflow menu. In native
    // mode, move this widget host left by one sibling to sit before that menu.
    for (let level = 0; level < 4 && widgetHost; level += 1) {
      if (
        widgetHost.previousElementSibling &&
        widgetHost.nextElementSibling &&
        widgetHost.dataset.remclipPositioned !== 'true'
      ) {
        widgetHost.parentElement?.insertBefore(
          widgetHost,
          widgetHost.previousElementSibling
        );
        widgetHost.dataset.remclipPositioned = 'true';
        break;
      }

      widgetHost = widgetHost.parentElement;
    }
  }, [plugin]);

  const handleCopy = async () => {
    if (isCopying) {
      return;
    }

    setIsCopying(true);

    try {
      const context = await plugin.widget.getWidgetContext<WidgetLocation.PaneHeader>();
      const result = await copyPaneDocument(plugin, context.paneId);

      if (result === 'missing-document') {
        await plugin.app.toast('Could not find the current document.');
        return;
      }

      await plugin.app.toast('AI Markdown copied.');
    } catch (error) {
      console.error('RemClip could not copy the document.', error);
      const fallbackMessage =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Clipboard access was denied.'
          : 'Could not copy AI Markdown.';
      const detail = error instanceof Error ? error.message : '';
      await plugin.app.toast(detail ? `${fallbackMessage} ${detail}` : fallbackMessage);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="remclip-widget">
      <button
        aria-label={isCopying ? 'Copying AI Markdown' : 'Copy AI Markdown'}
        className="remclip-button"
        disabled={isCopying}
        onClick={handleCopy}
        title={isCopying ? 'Copying AI Markdown...' : 'Copy AI Markdown'}
        type="button"
      >
        <ClipboardIcon />
      </button>
    </div>
  );
}

renderWidget(CopyAiMarkdownWidget);
