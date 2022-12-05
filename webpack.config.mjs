'use strict';

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import PugPlugin from 'pug-plugin';

const baseDir = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(baseDir, 'src');
const buildDir = resolve(baseDir, 'build');

/**
 * @returns {import("webpack").Configuration}
 */
export default function (env, argv) {
    return {
        context: srcDir,
        entry: {
            index: './pug/index.pug',
        },
        output: {
            clean: true,
            path: buildDir,
        },
        plugins: [
            new PugPlugin()
        ],
        resolve: { extensions: ['.ts', '...'] },
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
            ]
        },
        devServer: { hot: false },
    }
}
