import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [{
    name: 'include-api-reference',
    generateBundle() {
      for (const file of ['api.md', 'time-and-data.md']) {
        this.emitFile({ type: 'asset', fileName: `docs/${file}`, source: readFileSync(new URL(`./docs/${file}`, import.meta.url), 'utf8') });
      }
    },
  }],
  build: { outDir: 'example-dist' },
  test: { include: ['tests/**/*.test.{ts,tsx}'] },
});
