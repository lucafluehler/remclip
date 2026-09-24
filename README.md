# RemClip

RemClip is a small, read-only RemNote plugin that copies selected content or the current document as compact, AI-friendly Markdown.

The plugin adds a compact clipboard icon to RemNote's document header alongside its built-in controls. It prioritizes selected text, then selected Rems, and otherwise reads the document or folder in that pane. It serializes Rem hierarchy, cleans exporter-specific syntax, writes the result to the clipboard, and displays a toast.

## Output behavior

RemClip:

- Copies only selected text when a text range is selected.
- Copies selected Rems and their descendants in visible order, without duplicating descendants whose parent is also selected.
- Falls back to the current document or folder when nothing is selected.
- Preserves the document hierarchy as four-space-indented Markdown bullets.
- Preserves H1/H2/H3 headings and the document-title heading.
- Preserves RemNote card semantics: concepts (`::`), descriptors (`;;`),
  disabled descriptors (`;-`), basic forward cards (`→`), and multiline cards
  (`>>>`).
- Removes RemNote tags such as `#[[Analysis II]]`.
- Normalizes `;;<` cards to `;;`.
- Keeps cloze text while removing cloze markup.
- Removes images completely.
- Keeps link labels while removing URLs.
- Collapses block math to one physical line without padding inside `$$`.
- Removes blank lines and joins continuation lines.
- Removes `query:` artifacts introduced by multiline-card structures.
- Flattens multiline Descriptor cards into compact single-line cards.

It does not modify the knowledge base, send analytics, call an AI service, or make external network requests.

## Permissions and privacy

RemClip runs in RemNote's sandbox and requests read-only access to the knowledge
base so it can export whichever document the user chooses. Document content is
processed locally and is written only to the user's clipboard after they click
the plugin button. RemClip does not request native access, modify notes, persist
document content, or transmit data over the network.

## Requirements

- Node.js 22 or a compatible current LTS release
- RemNote desktop or web

## Development

Install dependencies:

```sh
npm install
```

Run the checks:

```sh
npm test
npm run check-types
npm run build
```

`npm run build` creates both `dist/` and `PluginZip.zip`. The RemNote CLI validator expects the project to be inside a Git repository, so run it after repository initialization:

```sh
npm run validate
```

Start the development server:

```sh
npm run dev
```

In RemNote, open **Settings → Plugins → Build**, choose **Develop from localhost**, and enter:

```text
http://localhost:8080
```

## Test the production build

`npm run dev` uses a development bundle that injects styles differently from
the release build. Build the plugin, then serve the compiled `dist/` directory:

```sh
npm run build
npm run preview
```

Stop `npm run dev` first, because both servers use port 8080. In RemNote, use
**Settings → Plugins → Build → Develop from localhost** with
`http://localhost:8080`. Disable the marketplace copy while testing to avoid
two active copies.

Check that the clipboard icon appears in the pane header and can be clicked in
both light and dark themes. Copy a document, selected text, and selected Rems;
confirm the clipboard content and success toast. Restart RemNote and check the
button again to exercise registration after activation. Rebuild and reload the
plugin after changes. A final check of the marketplace installation is still
needed after publishing, because localhost uses a different origin.

If a development plugin prevents RemNote from loading, open RemNote with `?disablePlugins` as described in the official plugin documentation.
