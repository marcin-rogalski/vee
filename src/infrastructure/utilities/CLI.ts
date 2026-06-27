import type { AgentData } from '@domain/Agent'
import { AppError } from '@domain/errors'
import type { ProviderData } from '@domain/Provider'
import { Command } from 'commander'
import { render } from 'ink'
import React from 'react'
import type { CompositionRoot } from '../../compositionRoot'
import { ReplScreen } from '../driving/screens/ReplScreen'
import { loadReplState, saveReplState } from './ReplState'

export default class CLI {
	private readonly program: Command
	private readonly registeredCommands: Command[] = []

	constructor(readonly compositionRoot: CompositionRoot) {
		this.program = new Command()
		this.program
			.name('vee')
			.usage('[command] [options]')
			.option('-h, --help', 'Show help')

		this.registerHelpCommand()
	}

	private registerHelpCommand(): void {
		this.program.addHelpCommand()
	}

	register(command: Command): void {
		this.program.addCommand(command)
		this.registeredCommands.push(command)
	}

	async run(args: string[]): Promise<void> {
		if (args.length === 0) {
			await this.runInteractive()
			return
		}

		try {
			await this.program.parseAsync(args, { from: 'user' })
		} catch (error) {
			if (error instanceof AppError) {
				this.compositionRoot.logger.error(error.message, {
					code: error.code,
					details: error.metadata,
				})
				process.exit(1)
			}

			this.compositionRoot.logger.error('CLI error', {
				error: error instanceof Error ? error.message : String(error),
			})
			process.exit(1)
		}
	}

	private async runInteractive(): Promise<void> {
		const core = this.compositionRoot

		// Load persisted REPL state
		const savedState = loadReplState(core.environment.replStatePath)

		const instance = render(
			React.createElement(ReplScreen, {
				agentList: core.agentList.execute.bind(core.agentList),
				agentUpsert: (agent: AgentData) => core.agentUpsert.execute(agent),
				agentDelete: core.agentDelete.execute.bind(core.agentDelete),
				providerList: core.providerList.execute.bind(core.providerList),
				providerUpsert: (provider: ProviderData) => {
					const schema = core.providerRegistry.schema(provider.type)
					return core.providerUpsert.execute({
						...provider,
						configSchema: schema,
					})
				},
				providerDelete: core.providerDelete.execute.bind(core.providerDelete),
				providerTypes: core.providerRegistry.listTypes.bind(
					core.providerRegistry,
				),
				providerSchema: (type: string) => core.providerRegistry.schema(type),
				sessionList: core.sessionList.execute.bind(core.sessionList),
				sessionCreate: core.sessionCreate.execute.bind(core.sessionCreate),
				sessionDelete: core.sessionDelete.execute.bind(core.sessionDelete),
				streamMessage: core.infer.execute.bind(core.infer),
				streamEvents: core.eventBus.subscribe.bind(core.eventBus),
				initialAgentId: savedState?.agentId ?? undefined,
				initialSessionId: savedState?.sessionId ?? undefined,
				onStateChange: (agentId: string | null, sessionId: string | null) => {
					saveReplState(core.environment.replStatePath, {
						agentId,
						sessionId,
						updatedAt: new Date().toISOString(),
					})
				},
			}),
		)

		const handleSignal = () => {
			instance.unmount()
			process.exit(0)
		}

		process.on('SIGINT', handleSignal)
		process.on('SIGTERM', handleSignal)
	}
}
