import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Optional consumer directory exercises the same React version as a local app.
const consumer = createRequire(resolve(process.argv[2] ?? '.', 'package.json'));
const React = consumer('react');
const { renderToStaticMarkup } = consumer('react-dom/server');
const fixture = await mkdtemp(join(tmpdir(), 'hypnogram-package-'));

try {
  const packageDir = join(fixture, 'node_modules/react-hypnogram');
  await cp('dist', join(packageDir, 'dist'), { recursive: true });
  await cp('package.json', join(packageDir, 'package.json'));
  await symlink(dirname(consumer.resolve('react/package.json')), join(fixture, 'node_modules/react'), 'dir');
  await writeFile(join(fixture, 'import.mjs'), "export * from 'react-hypnogram';\n");
  const require = createRequire(join(fixture, 'require.cjs'));
  const modules = [
    ['CJS', require('react-hypnogram')],
    ['ESM', await import(pathToFileURL(join(fixture, 'import.mjs')).href)],
  ];
  assert.equal(globalThis.React, undefined, 'No global React may hide missing imports');
  const data = [
    { id: 'short', stage: 'light', start: 1738598400000, end: 1738598410000 },
    { id: 'next', stage: 'deep', start: 1738598410000, end: 1738600200000 },
  ];
  for (const [format, { Hypnogram, DEFAULT_STAGES, normalizeTimeline }] of modules) {
    for (const gradient of [false, true]) {
      const stages = DEFAULT_STAGES.map(stage => gradient ? {
        ...stage,
        fill: { type: 'linear', stops: [{ offset: 0, color: stage.color }, { offset: 1, color: '#fff' }] },
      } : stage);
      const output = renderToStaticMarkup(React.createElement('div', null,
        React.createElement(Hypnogram, { data, stages }),
        React.createElement(Hypnogram, { data, stages })));
      assert.match(output, /<svg/);
      assert.match(output, /data-segment="short"/);
      assert.doesNotMatch(output, /NaN|Infinity/);
      if (gradient) assert.match(output, /linearGradient/);
      const ids = [...output.matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
      assert.equal(new Set(ids).size, ids.length, 'Instance IDs must not collide');
    }
    assert.throws(() => normalizeTimeline([{ ...data[0], end: data[0].start }]), /Invalid interval/);
    console.log(`${format}: solid, gradient, short intervals, unique IDs and validation pass (React ${React.version})`);
  }
  // Verify declared entry points exist, including the TypeScript entry.
  const manifest = JSON.parse(await readFile(join(packageDir, 'package.json'), 'utf8'));
  for (const entry of Object.values(manifest.exports['.'])) await readFile(join(packageDir, entry));
} finally {
  await rm(fixture, { recursive: true, force: true });
}
