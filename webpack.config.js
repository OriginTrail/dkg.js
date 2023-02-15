const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'dkg.min.js',
        libraryTarget: 'var',
        library: 'DKG',
    },
    resolve: {
        fallback: {
            fs: false,
            stream: require.resolve('stream-browserify'),
            http: require.resolve('stream-http/'),
            https: require.resolve('https-browserify/'),
            crypto: require.resolve('crypto-browserify'),
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
