#!/usr/bin/env node

export function runCli(): void {
	console.log('Running vee CLI. Implement your command logic here.')
}

if (
	process.argv[1]?.endsWith('cli.ts') ||
	process.argv[1]?.endsWith('cli.js')
) {
	runCli()
}
