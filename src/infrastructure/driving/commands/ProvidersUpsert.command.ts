import type LoggerPort from '@application/ports/Logger.port'
import type ProviderRegistryPort from '@application/ports/ProviderRegistry.port'
import type { ProviderData } from '@domain/Provider'
import { Command } from 'commander'

export type ProvidersUpsertCommandDeps = {
	providerUpsertUseCase: { execute(provider: ProviderData): Promise<void> }
	providerRegistry: ProviderRegistryPort
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
		.option(
			'--config <key=value>',
			'Config key-value pair (repeatable)',
			(c: string, prev: string[] = []) => [...prev, c],
			[],
		)
		.action(async ({ name, type, id, config }) => {
			const configSchema = deps.providerRegistry.schema(type)

			const configValues: Record<string, unknown> = {}
			for (const pair of config) {
				const eqIndex = pair.indexOf('=')
				if (eqIndex === -1) {
					deps.logger.error(
						`Invalid config format: "${pair}". Expected key=value`,
					)
					process.exit(1)
				}
				const key = pair.slice(0, eqIndex)
				const value = pair.slice(eqIndex + 1)
				configValues[key] = value
			}

			await deps.providerUpsertUseCase.execute({
				id: id ?? '',
				name,
				type,
				configSchema,
				config: configValues,
			})
			deps.logger.info('Provider saved', { id: id || 'new' })
		})

	return command
}
