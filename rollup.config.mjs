import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

/**
 * Builds the same three artifacts 1.3.1 published, under the same three names.
 *
 * The filenames are load-bearing. `main`, `jsnext:main` and `types` in
 * package.json point at them, and anyone on `^1.3.1` resolves through those
 * fields; a rename here would turn the retirement notice into a module-not-found
 * error, which explains nothing.
 */
export default {
  input: 'src/astrologyjs.ts',
  output: [
    {
      file: 'dist/astrologyjs.js',
      format: 'umd',
      name: 'astrologyjs',
      exports: 'named',
    },
    {
      // `main` points here, so this is the file `require('astrologyjs')` loads.
      file: 'dist/astrologyjs.min.js',
      format: 'umd',
      name: 'astrologyjs',
      exports: 'named',
      plugins: [
        terser({
          // The notice is the entire product. Nothing about it is dead code.
          compress: { pure_funcs: [], drop_console: false },
          format: { comments: false },
        }),
      ],
    },
    {
      file: 'dist/astrologyjs-es6.js',
      format: 'es',
    },
  ],
  plugins: [typescript({ tsconfig: './tsconfig.build.json', emitDeclarationOnly: false, declaration: false, outDir: undefined })],
};
