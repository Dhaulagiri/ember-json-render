import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { chromium } from 'playwright';
import { rollup } from 'rollup';

const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, '..');

test('packed addon attaches templates and renders nested, repeated catalog components', async (t) => {
  const temporary = await mkdtemp(join(root, '.package-test-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  execFileSync('npm', ['pack', '--pack-destination', temporary], { cwd: root, stdio: 'pipe' });
  const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const packageDir = join(temporary, 'node_modules/ember-json-render');
  await mkdir(packageDir, { recursive: true });
  execFileSync('tar', ['-xzf', join(temporary, `ember-json-render-${version}.tgz`), '--strip-components=1', '-C', packageDir]);
  // Give the consumer its own package scope so self-references cannot use source/dist in the repository.
  await writeFile(join(temporary, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  await copyFile(join(root, 'tests/fixtures/consumer.js'), join(temporary, 'consumer.js'));
  const packed = JSON.parse(await readFile(join(packageDir, 'package.json'), 'utf8'));
  const appJS = packed['ember-addon']['app-js'];
  assert.ok(appJS?.['./components/json-renderer.js'], 'JsonRenderer has an app reexport');
  assert.ok(appJS?.['./components/json-node.js'], 'recursive JsonNode has an app reexport');
  const imports = [];
  const registrations = [];
  for (const [name, path] of Object.entries(appJS)) {
    const local = `component${imports.length}`;
    imports.push(`import ${local} from './node_modules/ember-json-render/${path}';`);
    registrations.push(`app.register('${name.replace('./components/', 'component:').replace(/\.js$/, '')}', ${local});`);
  }
  await writeFile(join(temporary, 'app-components.js'), `${imports.join('\n')}
export function registerAppComponents(app) { ${registrations.join('\n')} }
`);
  const bundle = await rollup({
    input: join(temporary, 'consumer.js'),
    external: (id) => id.startsWith('@ember/') || id === '@glimmer/tracking',
    plugins: [
      nodeResolve({ exportConditions: ['development'] }),
      babel({
        babelHelpers: 'bundled',
        babelrc: false,
        configFile: false,
        plugins: [['babel-plugin-ember-template-compilation', {
          compilerPath: require.resolve('ember-source/dist/ember-template-compiler.js'),
        }]],
      }),
    ],
  });
  t.after(() => bundle.close());
  assert.ok(bundle.watchFiles.includes(join(packageDir, 'dist/index.js')), 'consumer imports the extracted package');
  const { output } = await bundle.generate({
    format: 'iife',
    interop: 'auto',
    globals: (id) => `require('${id}')`,
  });
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setContent('<div id="fixture"></div>');
  const emberDir = dirname(require.resolve('ember-source/package.json'));
  await page.addScriptTag({ path: join(emberDir, 'dist/ember.debug.js') });
  await page.addScriptTag({ content: output[0].code });
  assert.deepEqual(errors, [], 'consumer boots without browser errors');
  await page.evaluate(() => window.consumer.ready);
  assert.deepEqual(await page.evaluate(() => window.consumer.hasTemplates), [true, true, true]);
  assert.equal(await page.locator('[data-test-card] h1').textContent(), 'Packed renderer');
  assert.deepEqual(await page.locator('[data-test-card] [data-test-text]').allTextContents(), ['First', 'Second']);
  await page.evaluate(() => window.consumer.updateTitle());
  await page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Updated from store');
  await page.evaluate(() => window.consumer.destroy());
  assert.deepEqual(errors, [], 'consumer has no browser errors');
});
