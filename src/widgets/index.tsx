import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';

async function onActivate(plugin: ReactRNPlugin) {
  // Remove earlier placements when upgrading an existing dev install.
  await plugin.app.unregisterWidget(
    'copy_ai_markdown',
    WidgetLocation.DocumentAboveToolbar
  );
  await plugin.app.unregisterWidget('copy_ai_markdown', WidgetLocation.TopBar);

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
