import type LoggerPort from '@application/ports/Logger.port'
import type Agent from '@domain/Agent'
import { Command } from 'commander'

export type AgentsUpsertCommandDeps = {
	agentUpsertUseCase: { execute(agent: Agent): Promise<void> }
	logger: LoggerPort
}

export function createAgentsUpsertCommand(
	deps: AgentsUpsertCommandDeps,
): Command {
	const command = new Command('upsert')
		.description('Create or update an agent')
		.requiredOption('--name <name>', 'Agent name')
		.option('--description <description>', 'Agent description')
		.option('--id <id>', 'Agent ID (for update)')
		.action(async ({ name, description, id }) => {
			await deps.agentUpsertUseCase.execute({
				id: id ?? '',
				name,
				systemPrompt: '',
				providerId: '',
				providerConfiguration: {},
				toolIds: [],
				...(description !== undefined && { description }),
			})
			deps.logger.info('Agent saved', { id: id || 'new' })
		})

	return command
}
