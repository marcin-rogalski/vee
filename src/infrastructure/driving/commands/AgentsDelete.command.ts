import type LoggerPort from '@application/ports/Logger.port'
import { Command } from 'commander'

export type AgentsDeleteCommandDeps = {
	agentDeleteUseCase: { execute(id: string): Promise<void> }
	logger: LoggerPort
}

export function createAgentsDeleteCommand(
	deps: AgentsDeleteCommandDeps,
): Command {
	const command = new Command('delete <id>')
		.description('Delete an agent by ID')
		.action(async (id: string) => {
			try {
				await deps.agentDeleteUseCase.execute(id)
				deps.logger.info('Agent deleted', { id })
			} catch (e) {
				deps.logger.error('Delete agent failed', {
					error: e instanceof Error ? e.message : String(e),
				})
			}
		})

	return command
}
