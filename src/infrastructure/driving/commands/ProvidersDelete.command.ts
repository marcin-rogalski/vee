import readline from 'node:readline'
import type LoggerPort from '@application/ports/Logger.port'
import { Command } from 'commander'

export type ProvidersDeleteCommandDeps = {
	providerDeleteUseCase: { execute(id: string): Promise<void> }
	logger: LoggerPort
}

export function createProvidersDeleteCommand(
	deps: ProvidersDeleteCommandDeps,
): Command {
	const command = new Command('delete')
		.description('Delete a provider by ID')
		.argument('<id>', 'Provider ID to delete')
		.option('-y, --yes', 'Skip confirmation prompt')
		.action(async (id: string, options: { yes?: boolean }) => {
			if (!options.yes) {
				const rl = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				})
				const answer = await new Promise<string>((resolve) => {
					rl.question(
						`Are you sure you want to delete provider ${id}? (y/N): `,
						(answer) => {
							rl.close()
							resolve(answer.trim().toLowerCase())
						},
					)
				})
				if (answer !== 'y' && answer !== 'yes') {
					deps.logger.info('Delete cancelled')
					return
				}
			}

			try {
				await deps.providerDeleteUseCase.execute(id)
				deps.logger.info('Provider deleted', { id })
			} catch (e) {
				deps.logger.error('Delete provider failed', {
					error: e instanceof Error ? e.message : String(e),
				})
			}
		})

	return command
}
