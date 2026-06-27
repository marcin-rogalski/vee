import readline from 'node:readline'
import type LoggerPort from '@application/ports/Logger.port'
import { Command } from 'commander'

export type SessionsDeleteCommandDeps = {
	sessionDeleteUseCase: { execute(id: string): Promise<void> }
	logger: LoggerPort
}

export function createSessionsDeleteCommand(
	deps: SessionsDeleteCommandDeps,
): Command {
	const command = new Command('delete')
		.description('Delete a session by ID')
		.argument('<id>', 'Session ID to delete')
		.option('-y, --yes', 'Skip confirmation prompt')
		.action(async (id: string, options: { yes?: boolean }) => {
			if (!options.yes) {
				const rl = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				})
				const answer = await new Promise<string>((resolve) => {
					rl.question(
						`Are you sure you want to delete session ${id}? (y/N): `,
						(answer) => {
							rl.close()
							resolve(answer.trim().toLowerCase())
						},
					)
				})
				if (answer !== 'y' && answer !== 'yes') {
					deps.logger.info('Delete cancelled')
					return
				}
			}

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
