import babel from '@rollup/plugin-babel';
import { Addon } from '@embroider/addon-dev/rollup';

const addon = new Addon({ srcDir: 'src', destDir: 'dist' });

export default {
  output: addon.output(),
  plugins: [
    addon.publicEntrypoints(['index.ts', 'components/**/*.ts']),
    addon.appReexports(['components/json-renderer.ts']),
    babel({ babelHelpers: 'bundled' }),
    addon.dependencies(),
    addon.hbs(),
    addon.keepAssets(['**/*.css']),
    addon.clean(),
  ],
};
