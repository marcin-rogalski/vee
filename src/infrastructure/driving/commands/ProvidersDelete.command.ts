import type LoggerPort from '@application/ports/Logger.port'
import { Command } from 'commander'

export type ProvidersDeleteCommandDeps = {
	providerDeleteUseCase: { execute(id: string): Promise<void> }
	logger: LoggerPort
}

export function createProvidersDeleteCommand(
	deps: ProvidersDeleteCommandDeps,
): Command {
	const command = new Command('delete <id>')
		.description('Delete a provider by ID')
		.action(async (id: string) => {
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
