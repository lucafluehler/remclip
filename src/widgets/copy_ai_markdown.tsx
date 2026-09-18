import { renderWidget, usePlugin, WidgetLocation } from '@remnote/plugin-sdk';
import { useState } from 'react';

import { copyDocument } from '../export/copy-document';
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

  const handleCopy = async () => {
    if (isCopying) {
      return;
    }

    setIsCopying(true);

    try {
      const context =
        await plugin.widget.getWidgetContext<WidgetLocation.DocumentAboveToolbar>();
      const result = await copyDocument(plugin, context.documentId);

      if (result === 'missing-document') {
        await plugin.app.toast('Could not find the current document.');
        return;
      }

      await plugin.app.toast('AI Markdown copied.');
    } catch (error) {
      console.error('RemClip could not copy the document.', error);
      const message =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Clipboard access was denied.'
          : 'Could not copy AI Markdown.';
      await plugin.app.toast(message);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="remclip-widget">
      <button
        className="remclip-button"
        disabled={isCopying}
        onClick={handleCopy}
        type="button"
      >
        <ClipboardIcon />
        {isCopying ? 'Copying...' : 'Copy AI Markdown'}
      </button>
    </div>
  );
}

renderWidget(CopyAiMarkdownWidget);
