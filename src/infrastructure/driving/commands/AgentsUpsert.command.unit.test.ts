import type LoggerPort from '@application/ports/Logger.port'
import type Agent from '@domain/Agent'
import { describe, expect, it, vi } from 'vitest'
import { createAgentsUpsertCommand } from './AgentsUpsert.command'

describe('AgentsUpsert.command', () => {
	const makeMockUseCase = () => ({
		execute: vi.fn().mockResolvedValue(undefined),
	})

	const makeMockLogger = (): LoggerPort => ({
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	})

	it('registers the upsert command with correct name and description', () => {
		const mockUseCase = makeMockUseCase()
		const mockLogger = makeMockLogger()

		const command = createAgentsUpsertCommand({
			agentUpsertUseCase: mockUseCase,
			logger: mockLogger,
		})

		expect(command.name()).toBe('upsert')
		expect(command.description()).toBe('Create or update an agent')
	})

	it('calls usecase with provider-id and prompt', async () => {
		const mockUseCase = makeMockUseCase()
		const mockLogger = makeMockLogger()

		const command = createAgentsUpsertCommand({
			agentUpsertUseCase: mockUseCase,
			logger: mockLogger,
		})

		await command.parseAsync([
			'node',
			'test',
			'--name',
			'My Agent',
			'--provider-id',
			'p1',
			'--prompt',
			'You are helpful.',
		])

		expect(mockUseCase.execute).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'My Agent',
				providerId: 'p1',
				systemPrompt: 'You are helpful.',
			}),
		)
	})

	it('parses --override flags into providerOverrides', async () => {
		const mockUseCase = makeMockUseCase()
		const mockLogger = makeMockLogger()

		const command = createAgentsUpsertCommand({
			agentUpsertUseCase: mockUseCase,
			logger: mockLogger,
		})

		await command.parseAsync([
			'node',
			'test',
			'--name',
			'My Agent',
			'--provider-id',
			'p1',
			'--prompt',
			'You are helpful.',
			'--override',
			'model=gpt-4o',
			'--override',
			'temperature=0.2',
		])

		const agent = mockUseCase.execute.mock.calls[0]?.[0] as Agent
		expect(agent.providerOverrides).toEqual({
			model: 'gpt-4o',
			temperature: '0.2',
		})
	})

	it('parses --tool-id flags into toolIds array', async () => {
		const mockUseCase = makeMockUseCase()
		const mockLogger = makeMockLogger()

		const command = createAgentsUpsertCommand({
			agentUpsertUseCase: mockUseCase,
			logger: mockLogger,
		})

		await command.parseAsync([
			'node',
			'test',
			'--name',
			'My Agent',
			'--provider-id',
			'p1',
			'--prompt',
			'You are helpful.',
			'--tool-id',
			'readFile',
			'--tool-id',
			'writeFile',
		])

		const agent = mockUseCase.execute.mock.calls[0]?.[0] as Agent
		expect(agent.toolIds).toEqual(['readFile', 'writeFile'])
	})

	it('uses empty string id for new agents', async () => {
		const mockUseCase = makeMockUseCase()
		const mockLogger = makeMockLogger()

		const command = createAgentsUpsertCommand({
			agentUpsertUseCase: mockUseCase,
			logger: mockLogger,
		})

		await command.parseAsync([
			'node',
			'test',
			'--name',
			'My Agent',
			'--provider-id',
			'p1',
			'--prompt',
			'You are helpful.',
		])

		const agent = mockUseCase.execute.mock.calls[0]?.[0] as Agent
		expect(agent.id).toBe('')
	})

	it('uses --id for updates', async () => {
		const mockUseCase = makeMockUseCase()
		const mockLogger = makeMockLogger()

		const command = createAgentsUpsertCommand({
			agentUpsertUseCase: mockUseCase,
			logger: mockLogger,
		})

		await command.parseAsync([
			'node',
			'test',
			'--name',
			'My Agent',
			'--provider-id',
			'p1',
			'--prompt',
			'You are helpful.',
			'--id',
			'agent-42',
		])

		const agent = mockUseCase.execute.mock.calls[0]?.[0] as Agent
		expect(agent.id).toBe('agent-42')
	})
})
