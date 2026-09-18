const { resolve } = require('path');
const glob = require('glob');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { EsbuildPlugin } = require('esbuild-loader');
const { ProvidePlugin, BannerPlugin } = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const sandboxSuffix = '-sandbox';

const config = {
  mode: isProduction ? 'production' : 'development',
  entry: glob.sync('./src/widgets/**/*.tsx').reduce((entries, file) => {
    const relativeName = path
      .relative('src/widgets', file)
      .replace(/\.[tj]sx?$/, '')
      .replace(/\\/g, '/');

    const absoluteFile = path.resolve(file);
    entries[relativeName] = absoluteFile;
    entries[`${relativeName}${sandboxSuffix}`] = absoluteFile;
    return entries;
  }, {}),
  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: '',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|jsx|js)?$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'tsx',
          target: 'es2020',
          minify: false,
        },
      },
      {
        test: /\.css$/i,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          { loader: 'css-loader', options: { url: false } },
          'postcss-loader',
        ],
      },
    ],
  },
  plugins: [
    isProduction
      ? new MiniCssExtractPlugin({ filename: '[name].css' })
      : undefined,
    new HtmlWebpackPlugin({
      templateContent: `
      <body></body>
      <script type="text/javascript">
      const urlSearchParams = new URLSearchParams(window.location.search);
      const queryParams = Object.fromEntries(urlSearchParams.entries());
      const widgetName = queryParams["widgetName"];
      if (widgetName == undefined) {document.body.innerHTML += "Widget ID not specified.";}

      const script = document.createElement('script');
      script.type = "module";
      script.src = widgetName + "${sandboxSuffix}.js";
      document.body.appendChild(script);
      </script>
    `,
      filename: 'index.html',
      inject: false,
    }),
    new ProvidePlugin({
      React: 'react',
      reactDOM: 'react-dom',
    }),
    new BannerPlugin({
      banner: (file) =>
        file.chunk.name.includes(sandboxSuffix) ? '' : 'const IMPORT_META=import.meta;',
      raw: true,
    }),
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '' },
        { from: 'README.md', to: '' },
      ],
    }),
    isProduction ? undefined : new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
};

if (isProduction) {
  config.optimization = {
    minimize: true,
    minimizer: [new EsbuildPlugin()],
  };
} else {
  config.devServer = {
    port: 8080,
    open: false,
    hot: true,
    compress: true,
    watchFiles: ['src/**/*'],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'baggage, sentry-trace',
    },
  };
}

module.exports = config;
