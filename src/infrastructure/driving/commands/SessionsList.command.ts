import type LoggerPort from '@application/ports/Logger.port'
import type Session from '@domain/Session'
import { Command } from 'commander'

export type SessionsListCommandDeps = {
	sessionListUseCase: {
		execute(): Promise<Array<Pick<Session, 'id' | 'name'>>>
	}
	logger: LoggerPort
}

export function createSessionsListCommand(
	deps: SessionsListCommandDeps,
): Command {
	const command = new Command('list')
		.description('List all sessions')
		.action(async () => {
			const sessions = await deps.sessionListUseCase.execute()
			if (sessions.length === 0) {
				deps.logger.info('No sessions found')
				return
			}
			deps.logger.info('Sessions')
			for (const s of sessions) {
				deps.logger.info(`${s.id} - ${s.name}`)
			}
		})

	return command
}
