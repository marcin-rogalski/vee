import type LoggerPort from '@application/ports/Logger.port'
import type { ProviderData } from '@domain/Provider'
import { Command } from 'commander'

export type ProvidersListCommandDeps = {
	providerListUseCase: {
		execute(): Promise<Array<Pick<ProviderData, 'id' | 'name'>>>
	}
	logger: LoggerPort
}

export function createProvidersListCommand(
	deps: ProvidersListCommandDeps,
): Command {
	const command = new Command('list')
		.description('List all providers')
		.action(async () => {
			const providers = await deps.providerListUseCase.execute()
			if (providers.length === 0) {
				deps.logger.info('No providers found')
				return
			}
			deps.logger.info('Providers')
			for (const p of providers) {
				deps.logger.info(`${p.id} - ${p.name}`)
			}
		})

	return command
}
