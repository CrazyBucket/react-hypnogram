import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const entry = fileURLToPath(new URL('../dist/index.js', import.meta.url));
const virtualId = '\0hypnogram-size-entry';
const result = await build({
  configFile: false,
  root,
  logLevel: 'silent',
  plugins: [{
    name: 'measure-component-import',
    resolveId: id => id === 'hypnogram-size-entry' ? virtualId : null,
    load: id => id === virtualId ? `export { Hypnogram } from ${JSON.stringify(entry)};` : null,
  }],
  build: {
    write: false, minify: 'oxc', sourcemap: false, target: 'es2022',
    rollupOptions: { preserveEntrySignatures: 'strict', input: 'hypnogram-size-entry', external: ['react', 'react/jsx-runtime'], output: { format: 'es' } },
  },
});
const outputs = (Array.isArray(result) ? result : [result]).flatMap(item => item.output);
const javascript = outputs.filter(item => item.type === 'chunk').map(item => item.code).join('\n');
if (!javascript || !javascript.includes('Hypnogram')) throw new Error('Size entry was eliminated; refusing to report an empty bundle.');
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const [tarball] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: root, encoding: 'utf8' }));
const measurement = {
  version: pkg.version,
  component: { minified: Buffer.byteLength(javascript), gzip: gzipSync(javascript, { level: 9 }).length },
  package: { gzip: tarball.size, unpacked: tarball.unpackedSize },
  sourceMap: tarball.files.some(file => file.path.endsWith('.map')),
  method: 'Vite production build; Hypnogram export only; React and react/jsx-runtime external; gzip level 9; decimal kB.',
};
await writeFile(new URL('../examples/playground/size.json', import.meta.url), JSON.stringify(measurement, null, 2) + '\n');
console.log(JSON.stringify(measurement, null, 2));
