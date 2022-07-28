const path = require("path");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const webpack = require('webpack')

module.exports = {
  mode: "development",
  entry: "./index.js",
  watch: true,
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "dkg.min.js",
    libraryTarget: "var",
    library: "DKG",
  },
  plugins: [
    // fix "process is not defined" error:
    new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.ProvidePlugin({
        process: 'process/browser',
    }),
  ],
  resolve: {
    fallback: {
      fs: false,
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer/"),
      util: require.resolve("util/"),
      assert: require.resolve("assert/"),
      http: require.resolve("stream-http/"),
      url: require.resolve("url/"),
      https: require.resolve("https-browserify/"),
      os: require.resolve("os-browserify/"),
      crypto: require.resolve("crypto-browserify"),
      path: require.resolve("path-browserify"),
    },
  },
  optimization: {
    minimize: true,
    minimizer: [
      new UglifyJsPlugin({
        include: /\.min\.js$/,
      }),
    ],
  },
};
