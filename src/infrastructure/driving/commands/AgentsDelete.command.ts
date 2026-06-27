import readline from 'node:readline'
import type LoggerPort from '@application/ports/Logger.port'
import { Command } from 'commander'

export type AgentsDeleteCommandDeps = {
	agentDeleteUseCase: { execute(id: string): Promise<void> }
	logger: LoggerPort
}

export function createAgentsDeleteCommand(
	deps: AgentsDeleteCommandDeps,
): Command {
	const command = new Command('delete')
		.description('Delete an agent by ID')
		.argument('<id>', 'Agent ID to delete')
		.option('-y, --yes', 'Skip confirmation prompt')
		.action(async (id: string, options: { yes?: boolean }) => {
			if (!options.yes) {
				const rl = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				})
				const answer = await new Promise<string>((resolve) => {
					rl.question(
						`Are you sure you want to delete agent ${id}? (y/N): `,
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
