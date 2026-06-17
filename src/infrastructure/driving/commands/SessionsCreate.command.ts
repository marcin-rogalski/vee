import type LoggerPort from '@application/ports/Logger.port'
import { Command } from 'commander'

export type SessionsCreateCommandDeps = {
	sessionCreateUseCase: {
		execute(name?: string, agentId?: string): Promise<string>
	}
	logger: LoggerPort
}

export function createSessionsCreateCommand(
	deps: SessionsCreateCommandDeps,
): Command {
	const command = new Command('create [name]')
		.description('Create a new session')
		.requiredOption(
			'--agent <agentId>',
			'Agent ID to associate with the session',
		)
		.action(async (name?: string, options?: { agent?: string }) => {
			if (!options?.agent) {
				deps.logger.error('Agent ID is required. Use --agent <id>')
				return
			}
			const sessionName = name || `Session ${new Date().toLocaleString()}`
			const id = await deps.sessionCreateUseCase.execute(
				sessionName,
				options.agent,
			)
			deps.logger.info('Created session', { id })
		})

	return command
}
