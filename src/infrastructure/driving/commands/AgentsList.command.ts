import type LoggerPort from '@application/ports/Logger.port'
import type { AgentData } from '@domain/Agent'
import { Command } from 'commander'

export type AgentsListCommandDeps = {
	agentListUseCase: {
		execute(): Promise<Array<Pick<AgentData, 'id' | 'name' | 'description'>>>
	}
	logger: LoggerPort
}

export function createAgentsListCommand(deps: AgentsListCommandDeps): Command {
	const command = new Command('list')
		.description('List all agents')
		.action(async () => {
			const agents = await deps.agentListUseCase.execute()
			if (agents.length === 0) {
				deps.logger.info('No agents found')
				return
			}
			deps.logger.info('Agents')
			for (const a of agents) {
				const desc = a.description ? ` - ${a.description}` : ''
				deps.logger.info(`${a.id} - ${a.name}${desc}`)
			}
		})

	return command
}
