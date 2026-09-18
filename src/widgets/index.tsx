import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.app.registerWidget(
    'copy_ai_markdown',
    WidgetLocation.DocumentAboveToolbar,
    {
      dimensions: { height: 'auto', width: '100%' },
    }
  );
}

async function onDeactivate(_plugin: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
