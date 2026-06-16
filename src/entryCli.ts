#!/usr/bin/env node
import { createAgentsDeleteCommand } from '@infrastructure/driving/commands/AgentsDelete.command'
import { createAgentsListCommand } from '@infrastructure/driving/commands/AgentsList.command'
import { createAgentsUpsertCommand } from '@infrastructure/driving/commands/AgentsUpsert.command'
import { createHelpCommand } from '@infrastructure/driving/commands/Help.command'
import { createInferCommand } from '@infrastructure/driving/commands/Infer.command'
import { createProvidersDeleteCommand } from '@infrastructure/driving/commands/ProvidersDelete.command'
import { createProvidersListCommand } from '@infrastructure/driving/commands/ProvidersList.command'
import { createProvidersUpsertCommand } from '@infrastructure/driving/commands/ProvidersUpsert.command'
import { createSessionsCreateCommand } from '@infrastructure/driving/commands/SessionsCreate.command'
import { createSessionsDeleteCommand } from '@infrastructure/driving/commands/SessionsDelete.command'
import { createSessionsListCommand } from '@infrastructure/driving/commands/SessionsList.command'
import CLI from '@infrastructure/utilities/CLI'
import { Command } from 'commander'
import compositionRoot from './compositionRoot'

const cli = new CLI(compositionRoot)

const registeredCommands = [
	{ name: 'agents', aliases: [], description: 'Agent management commands' },
	{
		name: 'providers',
		aliases: [],
		description: 'Provider management commands',
	},
	{
		name: 'sessions',
		aliases: [],
		description: 'Session management commands',
	},
	{
		name: 'infer',
		aliases: [],
		description: 'Run inference with an agent',
	},
	{
		name: 'help',
		aliases: ['h', '?'],
		description: 'Show available commands',
	},
]

const agents = new Command('agents').description('Agent management commands')

agents.addCommand(
	createAgentsListCommand({
		agentListUseCase: compositionRoot.agentList,
		logger: compositionRoot.logger,
	}),
)
agents.addCommand(
	createAgentsUpsertCommand({
		agentUpsertUseCase: compositionRoot.agentUpsert,
		logger: compositionRoot.logger,
	}),
)
agents.addCommand(
	createAgentsDeleteCommand({
		agentDeleteUseCase: compositionRoot.agentDelete,
		logger: compositionRoot.logger,
	}),
)

const providers = new Command('providers').description(
	'Provider management commands',
)

providers.addCommand(
	createProvidersListCommand({
		providerListUseCase: compositionRoot.providerList,
		logger: compositionRoot.logger,
	}),
)
providers.addCommand(
	createProvidersUpsertCommand({
		providerUpsertUseCase: compositionRoot.providerUpsert,
		providerRegistry: compositionRoot.providerRegistry,
		logger: compositionRoot.logger,
	}),
)
providers.addCommand(
	createProvidersDeleteCommand({
		providerDeleteUseCase: compositionRoot.providerDelete,
		logger: compositionRoot.logger,
	}),
)

const sessions = new Command('sessions').description(
	'Session management commands',
)

sessions.addCommand(
	createSessionsListCommand({
		sessionListUseCase: compositionRoot.sessionList,
		logger: compositionRoot.logger,
	}),
)
sessions.addCommand(
	createSessionsCreateCommand({
		sessionCreateUseCase: compositionRoot.sessionCreate,
		logger: compositionRoot.logger,
	}),
)
sessions.addCommand(
	createSessionsDeleteCommand({
		sessionDeleteUseCase: compositionRoot.sessionDelete,
		logger: compositionRoot.logger,
	}),
)

cli.register(agents)
cli.register(providers)
cli.register(sessions)

cli.register(
	createInferCommand({
		inferUseCase: compositionRoot.infer,
		logger: compositionRoot.logger,
	}),
)

const helpCommand = createHelpCommand({
	logger: compositionRoot.logger,
	registeredCommands: registeredCommands,
})
cli.register(helpCommand)

;(async () => {
	await cli.run(process.argv.slice(2))
})()
