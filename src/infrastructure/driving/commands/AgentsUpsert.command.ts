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
		.requiredOption('--provider-id <id>', 'Provider ID')
		.requiredOption('--prompt <text>', 'System prompt')
		.option(
			'--override <key=value>',
			'Provider config override (repeatable)',
			collectRepeatable,
			[],
		)
		.option('--tool-id <toolId>', 'Tool ID (repeatable)', collectRepeatable, [])
		.action(
			async ({
				name,
				description,
				id,
				providerId,
				prompt,
				override,
				toolId,
			}) => {
				const providerOverrides: Record<string, unknown> = {}
				for (const kv of override) {
					const eqIndex = kv.indexOf('=')
					if (eqIndex === -1) {
						deps.logger.error(
							`Invalid override format: ${kv} (expected key=value)`,
						)
						process.exit(1)
					}
					providerOverrides[kv.slice(0, eqIndex)] = kv.slice(eqIndex + 1)
				}

				const agent: Agent = {
					id: id ?? '',
					name,
					description: description ?? undefined,
					systemPrompt: prompt,
					providerId,
					providerOverrides,
					toolIds: toolId,
				}

				await deps.agentUpsertUseCase.execute(agent)
				deps.logger.info('Agent saved', { id: id || 'new' })
			},
		)

	return command
}

function collectRepeatable(current: string, previous: string[]): string[] {
	return previous.concat([current])
}
