import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  dts: false,
  format: ['esm', 'cjs'],
  sourcemap: true,
  clean: true,
  external: ['@builder.io/qwik', 'ai', '@ai-sdk/provider-utils'],
  tsconfig: 'tsconfig.build.json',
});