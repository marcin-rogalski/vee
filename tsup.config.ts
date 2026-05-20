import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts', 'src/cli.ts'],
	outDir: 'dist',
	format: ['cjs', 'esm'],
	platform: 'node',
	target: 'node18',
	splitting: false,
	sourcemap: true,
	clean: true,
	dts: true,
})
