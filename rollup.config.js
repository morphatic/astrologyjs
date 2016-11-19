import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
    entry: 'src/js/astrologyjs.js',
    format: 'umd',
    plugins: [
        resolve({
            jsnext: true,
            browser: true,
            preferBuiltins: false
        }),
        commonjs(),
        eslint(),
        babel({
            exclude: 'node_modules/**',
            runtimeHelpers: true
        }),
        json()
    ],
    external: ['http', 'https'],
    globals: {
        'http': 'http',
        'https': 'https'
    },
    exports: 'named',
    targets: [
        {
            dest: 'dist/astrologyjs.js',
            format: 'umd',
            moduleName: 'astrologyjs',
            sourceMap: true
        },
        {
            dest: 'dist/astrologyjs-es6.js',
            format: 'es'
        }
    ]
};