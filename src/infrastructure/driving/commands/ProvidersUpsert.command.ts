import type LoggerPort from '@application/ports/Logger.port'
import type Provider from '@domain/Provider'
import { Command } from 'commander'

export type ProvidersUpsertCommandDeps = {
	providerUpsertUseCase: { execute(provider: Provider): Promise<void> }
	logger: LoggerPort
}

export function createProvidersUpsertCommand(
	deps: ProvidersUpsertCommandDeps,
): Command {
	const command = new Command('upsert')
		.description('Create or update a provider')
		.requiredOption('--name <name>', 'Provider name')
		.requiredOption('--type <type>', 'Provider type (e.g., openai)')
		.option('--id <id>', 'Provider ID (for update)')
		.action(async ({ name, type, id }) => {
			await deps.providerUpsertUseCase.execute({
				id: id ?? '',
				name,
				type,
				configSchema: [],
			})
			deps.logger.info('Provider saved', { id: id || 'new' })
		})

	return command
}
