import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	resolve: {
		alias: {
			'@application': fileURLToPath(
				new URL('./src/application', import.meta.url),
			),
			'@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
			'@infrastructure': fileURLToPath(
				new URL('./src/infrastructure', import.meta.url),
			),
		},
	},
	test: {
		include: ['test/e2e/**/*.test.ts', 'test/e2e/**/*.test.tsx'],
		exclude: ['test/e2e/setup.ts'],
		environment: 'node',
		sequence: {
			concurrent: false,
		},
		testTimeout: 30_000,
		hookTimeout: 30_000,
	},
})
