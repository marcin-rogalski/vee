import type LoggerPort from '@application/ports/Logger.port'
import { Command } from 'commander'

export type SessionsCreateCommandDeps = {
	sessionCreateUseCase: { execute(name?: string): Promise<string> }
	logger: LoggerPort
}

export function createSessionsCreateCommand(
	deps: SessionsCreateCommandDeps,
): Command {
	const command = new Command('create [name]')
		.description('Create a new session')
		.action(async (name?: string) => {
			const sessionName = name || `Session ${new Date().toLocaleString()}`
			const id = await deps.sessionCreateUseCase.execute(sessionName)
			deps.logger.info('Created session', { id })
		})

	return command
}
