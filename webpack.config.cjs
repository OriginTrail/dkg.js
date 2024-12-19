const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './index.cjs',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'dkg.min.js',
        libraryTarget: 'var',
        library: 'DKG',
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
            zlib: false,
            path: false,
            net: false,
            tls: false,
            stream: require.resolve('stream-browserify'),
            http: require.resolve('stream-http/'),
            https: require.resolve('https-browserify/'),
            crypto: require.resolve('crypto-browserify'),
            assert: require.resolve('assert'),
            os: require.resolve('os-browserify'),
            url: require.resolve('url'),
            module: require.resolve('./fallback/module.cjs'),
        },
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                include: /\.min\.js$/,
            }),
        ],
    },
};
