import type LoggerPort from '@application/ports/Logger.port'
import { Command } from 'commander'

export type HelpCommandDeps = {
	logger: LoggerPort
	registeredCommands: Array<{
		name: string
		aliases: string[]
		description: string
	}>
}

export function createHelpCommand(deps: HelpCommandDeps): Command {
	const command = new Command('help [command]')
		.alias('h,?')
		.description('Show available commands')
		.action((cmd?: string) => {
			if (cmd) {
				const registered = deps.registeredCommands.find(
					(c) => c.name === cmd || c.aliases.includes(cmd),
				)
				if (registered) {
					deps.logger.info(`Command: ${registered.name}`)
					deps.logger.info(`Description: ${registered.description}`)
					return
				}
				deps.logger.error('Unknown command', { command: cmd })
				return
			}
			deps.logger.info('Available commands:')
			for (const cmd of deps.registeredCommands) {
				const aliases =
					cmd.aliases.length > 0 ? ` (${cmd.aliases.join(', ')})` : ''
				deps.logger.info(`  ${cmd.name}${aliases} - ${cmd.description}`)
			}
		})

	return command
}
