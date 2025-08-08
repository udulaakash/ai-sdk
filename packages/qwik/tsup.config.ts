import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Disable for now due to project configuration issues
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@builder.io/qwik', 'ai', '@ai-sdk/provider-utils', 'zod'],
});