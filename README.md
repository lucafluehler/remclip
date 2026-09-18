# RemClip

RemClip is a small, read-only RemNote plugin that copies the current document as compact, AI-friendly Markdown.

The plugin adds a **Copy AI Markdown** button above the document toolbar. It reads the open document, serializes its Rem hierarchy, cleans exporter-specific syntax, writes the result to the clipboard, and displays a toast.

## Output behavior

RemClip:

- Preserves the document hierarchy as nested Markdown bullets.
- Removes RemNote tags such as `#[[Analysis II]]`.
- Normalizes `;;<` cards to `;;`.
- Keeps cloze text while removing cloze markup.
- Removes images completely.
- Keeps link labels while removing URLs.
- Collapses block math to one physical line.
- Removes blank lines and joins continuation lines.
- Flattens multiline `formal definition` cards into a single `;;` card.

It does not modify the knowledge base, send analytics, call an AI service, or make external network requests.

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

If a development plugin prevents RemNote from loading, open RemNote with `?disablePlugins` as described in the official plugin documentation.

## Project status

The implementation plan and decisions are recorded in [PLAN.md](PLAN.md). Repository setup and publishing are intentionally deferred.
