import type LoggerPort from '@application/ports/Logger.port'
import { Command } from 'commander'

export type SessionsDeleteCommandDeps = {
	sessionDeleteUseCase: { execute(id: string): Promise<void> }
	logger: LoggerPort
}

export function createSessionsDeleteCommand(
	deps: SessionsDeleteCommandDeps,
): Command {
	const command = new Command('delete <id>')
		.description('Delete a session by ID')
		.action(async (id: string) => {
			try {
				await deps.sessionDeleteUseCase.execute(id)
				deps.logger.info('Session deleted', { id })
			} catch (e) {
				deps.logger.error('Delete session failed', {
					error: e instanceof Error ? e.message : String(e),
				})
			}
		})

	return command
}
