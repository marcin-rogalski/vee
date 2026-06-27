import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import stripAnsi from 'strip-ansi'

/**
 * Create a temporary data directory for E2E tests.
 * Returns { dir, cleanup } — call cleanup() after the test.
 */
export function createTempDataDir(): {
	dir: string
	cleanup: () => void
} {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vee-e2e-'))
	return {
		dir,
		cleanup: () => {
			try {
				fs.rmSync(dir, { recursive: true, force: true })
			} catch {
				// ignore cleanup errors
			}
		},
	}
}

/**
 * Build env object with isolated data directory.
 */
export function withDataDir(
	env: NodeJS.ProcessEnv,
	dataDir: string,
): Record<string, string> {
	const filtered: Record<string, string> = {} as Record<string, string>
	for (const [key, value] of Object.entries(env)) {
		if (typeof value === 'string') {
			filtered[key] = value
		}
	}
	return {
		...filtered,
		CONFIG_FOLDER: dataDir,
		NODE_ENV: 'test',
	}
}

/**
 * Strip ANSI escape codes from terminal output.
 */
export function cleanOutput(raw: string): string {
	return stripAnsi(raw)
}

/**
 * Simple sleep helper.
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Path to the CLI entry point.
 */
export const CLI_ENTRY = path.resolve('src/entryCli.ts')
