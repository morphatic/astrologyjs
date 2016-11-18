import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
    moduleName: 'astrologyjs',
    entry: 'src/js/main.js',
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
            exclude: 'node_modules/**'
        }),
        json()
    ],
    external: ['http', 'https'],
    globals: {
        'http': 'http',
        'https': 'https'
    },
    exports: 'named',
    dest: 'dist/astrologyjs.js',
    sourceMap: true
};