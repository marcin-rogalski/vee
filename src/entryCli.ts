#!/usr/bin/env node
import { createAgentsDeleteCommand } from '@infrastructure/driving/commands/AgentsDelete.command'
import { createAgentsListCommand } from '@infrastructure/driving/commands/AgentsList.command'
import { createAgentsUpsertCommand } from '@infrastructure/driving/commands/AgentsUpsert.command'
import { createHelpCommand } from '@infrastructure/driving/commands/Help.command'
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
		name: 'sessions',
		aliases: [],
		description: 'Session management commands',
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
cli.register(sessions)

const helpCommand = createHelpCommand({
	logger: compositionRoot.logger,
	registeredCommands: registeredCommands,
})
cli.register(helpCommand)

;(async () => {
	await cli.run(process.argv.slice(2))
})()
