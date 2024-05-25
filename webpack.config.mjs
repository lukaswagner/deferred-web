'use strict';

import { dirname, resolve } from 'node:path';
import PugPlugin from 'pug-plugin';
import { fileURLToPath } from 'node:url';

const baseDir = dirname(fileURLToPath(import.meta.url));
const buildDir = resolve(baseDir, 'build');

/**
 * @returns {import("webpack").Configuration}
 */
export default function () {
    return {
        entry: {
            index: './pages/index.pug',
        },
        output: {
            clean: true,
            path: buildDir,
        },
        plugins: [
            new PugPlugin(),
        ],
        resolve: {
            extensions: ['.ts', '...'],
            alias: {
                shaders: resolve(baseDir, 'src/shaders/'),
            }
        },
        module: {
            rules: [
                {
                    test: /\.pug$/,
                    use: { loader: PugPlugin.loader },
                },
                {
                    test: /\.css$/,
                    use: [
                        { loader: 'css-loader' },
                        { loader: 'css-import-loader' },
                    ]
                },
                {
                    test: /\.ts$/,
                    use: { loader: 'ts-loader' },
                },
                {
                    test: /\.(glsl|vert|frag)$/,
                    use: {
                        loader: 'webpack-glsl-loader'
                    },
                },
                {
                    test: /\.obj$/,
                    type: 'asset/source',
                },
            ]
        },
        devServer: { hot: false },
        devtool: 'source-map'
    }
}
