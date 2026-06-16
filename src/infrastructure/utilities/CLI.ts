import type Agent from '@domain/Agent'
import { AppError } from '@domain/errors'
import type Provider from '@domain/Provider'
import { Command } from 'commander'
import { render } from 'ink'
import React from 'react'
import type { CompositionRoot } from '../../compositionRoot'
import { ChatScreen } from '../driving/screens/ChatScreen'
import { ConfigScreen } from '../driving/screens/ConfigScreen'
import { MainScreen } from '../driving/screens/MainScreen'
import { SessionScreen } from '../driving/screens/SessionScreen'

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
			await this.program.parseAsync(process.argv)
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

	private buildScreens(core: CompositionRoot): Array<{
		id: string
		label: string
		component: React.ElementType
		props: (navigate: (id: string) => void) => Record<string, unknown>
	}> {
		return [
			{
				id: 'config',
				label: 'Config',
				component: ConfigScreen,
				props: (navigate) => ({
					agents: { list: core.agentList.execute.bind(core.agentList) },
					onUpsertAgent: (agent: {
						name: string
						description?: string
						systemPrompt: string
						providerId: string
						providerOverrides: Record<string, unknown>
						toolIds: string[]
					}) =>
						core.agentUpsert.execute({
							...agent,
							id: '',
						} as Agent),
					onDeleteAgent: core.agentDelete.execute,
					providers: {
						list: core.providerList.execute.bind(core.providerList),
					},
					onUpsertProvider: (provider: {
						id?: string
						name: string
						type: string
						config: Record<string, unknown>
					}) => {
						const schema = core.providerRegistry.schema(provider.type)
						core.providerUpsert.execute({
							id: provider.id ?? '',
							name: provider.name,
							type: provider.type,
							configSchema: schema,
							config: provider.config,
						} as Provider)
					},
					onDeleteProvider: core.providerDelete.execute,
					providerRegistry: core.providerRegistry,
					toolRegistry: core.toolRegistry,
					onBack: () => navigate('menu'),
				}),
			},
			{
				id: 'sessions',
				label: 'Sessions',
				component: SessionScreen,
				props: (navigate) => ({
					sessions: { list: core.sessionList.execute.bind(core.sessionList) },
					onCreateSession: core.sessionCreate.execute,
					agents: { list: core.agentList.execute.bind(core.agentList) },
					onBack: () => navigate('menu'),
				}),
			},
			{
				id: 'chat',
				label: 'Chat',
				component: ChatScreen,
				props: () => ({
					streamMessage: core.infer.execute,
					streamEvents: core.eventBus.subscribe,
				}),
			},
		]
	}

	private async runInteractive(): Promise<void> {
		const core = this.compositionRoot
		const screens = this.buildScreens(core)

		const instance = render(React.createElement(MainScreen, { screens }))

		const handleSignal = () => {
			instance.unmount()
			process.exit(0)
		}

		process.on('SIGINT', handleSignal)
		process.on('SIGTERM', handleSignal)
	}
}
