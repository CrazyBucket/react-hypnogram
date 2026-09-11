import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  } as any,
  build: {
    outDir: 'dist',
    lib: { entry: 'src/index.ts', formats: ['es', 'cjs'], fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs' },
    sourcemap: process.env.HYPNOGRAM_SOURCEMAP === '1',
    rollupOptions: {
      external: ['react'],
      output: { banner: "'use client';" },
    },
  },
});
