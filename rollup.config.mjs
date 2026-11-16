import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { Addon } from '@embroider/addon-dev/rollup';

const addon = new Addon({ srcDir: 'src', destDir: 'dist' });

export default {
  output: addon.output(),
  plugins: [
    nodeResolve({ extensions: ['.mjs', '.js', '.json', '.node', '.ts'] }),
    addon.publicEntrypoints(['index.ts', 'components/**/*.ts']),
    addon.appReexports(['components/json-renderer.js', 'components/json-node.js']),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.mjs', '.cjs', '.ts', '.hbs'],
      babelrc: false,
      configFile: './babel.config.cjs',
    }),
    addon.dependencies(),
    addon.hbs(),
    addon.keepAssets(['**/*.css']),
    addon.clean(),
  ],
};
