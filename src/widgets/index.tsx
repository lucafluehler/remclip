import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';

async function onActivate(plugin: ReactRNPlugin) {
  // Clear previous placements so activation is safe after a marketplace update.
  await plugin.app.unregisterWidget(
    'copy_ai_markdown',
    WidgetLocation.DocumentAboveToolbar
  );
  await plugin.app.unregisterWidget('copy_ai_markdown', WidgetLocation.TopBar);
  await plugin.app.unregisterWidget('copy_ai_markdown', WidgetLocation.PaneHeader);

  await plugin.app.registerWidget(
    'copy_ai_markdown',
    WidgetLocation.PaneHeader,
    {
      dimensions: { height: 32, width: 32 },
    }
  );
}

async function onDeactivate(_plugin: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
