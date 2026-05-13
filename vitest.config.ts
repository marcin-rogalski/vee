import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	resolve: {
		alias: {
			'@application': fileURLToPath(
				new URL('./src/application', import.meta.url),
			),
			'@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
			'@driving': fileURLToPath(
				new URL('./src/infrastructure/driving', import.meta.url),
			),
			'@driven': fileURLToPath(
				new URL('./src/infrastructure/driven', import.meta.url),
			),
			'@utilities': fileURLToPath(
				new URL('./src/infrastructure/utilities', import.meta.url),
			),
		},
	},
})
