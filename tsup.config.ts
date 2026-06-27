import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/entryCli.ts', 'src/entryServer.ts'],
	outDir: 'dist',
	format: ['esm'],
	platform: 'node',
	target: 'node18',
	splitting: false,
	sourcemap: true,
	clean: true,
	dts: true,
	external: [],
})
