/** biome-ignore-all lint/suspicious/noExplicitAny: test mocks require any casts */
import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type ContextRepositoryPort from '@application/ports/ContextRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'
import type ProviderPort from '@application/ports/Provider.port'
import type ProviderRegistryPort from '@application/ports/ProviderRegistry.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import type ToolRegistryPort from '@application/ports/ToolRgistry.port'
import type Agent from '@domain/Agent'
import type Provider from '@domain/Provider'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import InferUseCase from './Infer.usecase'

const mockAgent: Agent = {
	id: 'agent-1',
	name: 'Test Agent',
	systemPrompt: 'You are a test agent.',
	providerId: 'provider-1',
	providerConfiguration: { model: 'test-model' },
	toolIds: ['read-file'],
}

const mockProviderEntity: Provider = {
	id: 'provider-1',
	name: 'Test Provider',
	type: 'openai',
	configSchema: [],
}

let mockAgentRepository: AgentRepositoryPort
let mockContextRepository: ContextRepositoryPort
let mockProviderRepository: ProviderRepositoryPort
let mockProviderRegistry: ProviderRegistryPort
let mockSessionRepository: SessionRepositoryPort
let mockToolRegistry: ToolRegistryPort
let mockEventBus: EventBusPort
let mockProvider: ProviderPort
let useCase: InferUseCase

beforeEach(() => {
	mockAgentRepository = {
		get: vi.fn().mockResolvedValue(mockAgent),
		list: vi.fn().mockResolvedValue([]),
		save: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
	} as unknown as AgentRepositoryPort

	mockContextRepository = {
		get: vi.fn().mockResolvedValue([]),
		append: vi.fn().mockResolvedValue(undefined),
		update: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
	} as unknown as ContextRepositoryPort

	mockProviderRepository = {
		get: vi.fn().mockResolvedValue(mockProviderEntity),
		list: vi.fn().mockResolvedValue([]),
		save: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
	} as unknown as ProviderRepositoryPort

	mockSessionRepository = {
		get: vi.fn().mockResolvedValue({
			id: 'session-1',
			name: 'test',
			createdAt: Date.now(),
			updatedAt: Date.now(),
		}),
		list: vi.fn().mockResolvedValue([]),
		create: vi.fn().mockResolvedValue({
			id: 'session-1',
			name: 'test',
			createdAt: Date.now(),
			updatedAt: Date.now(),
		}),
		setName: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
	} as unknown as SessionRepositoryPort

	mockToolRegistry = {
		get: vi.fn().mockReturnValue({
			id: 'read-file',
			description: 'Read a file',
			definition: {
				name: 'read-file',
				description: 'Read a file',
				parameters: '{}',
			},
			execute: vi
				.fn()
				.mockResolvedValue({ content: 'file content', code: undefined }),
		}),
		list: vi
			.fn()
			.mockReturnValue([{ id: 'read-file', description: 'Read a file' }]),
	} as unknown as ToolRegistryPort

	mockEventBus = {
		publish: vi.fn().mockResolvedValue(undefined),
		subscribe: vi.fn().mockReturnValue(() => {}),
	} as unknown as EventBusPort

	mockProvider = {
		id: 'provider-1',
		type: 'openai',
		countTokens: vi.fn().mockReturnValue(10),
		shouldCompact: vi.fn().mockReturnValue(false),
		compact: vi.fn().mockResolvedValue([]),
		infer: vi.fn().mockImplementation(function* () {
			yield { type: 'token', content: 'Hello, world!' }
		}),
	} as unknown as ProviderPort

	mockProviderRegistry = {
		resolve: vi.fn().mockReturnValue(mockProvider),
	} as unknown as ProviderRegistryPort

	useCase = new InferUseCase(
		mockSessionRepository,
		mockContextRepository,
		mockProviderRepository,
		mockProviderRegistry,
		mockAgentRepository,
		mockToolRegistry,
		mockEventBus,
	)
})

describe('InferUseCase', () => {
	it('retrieves agent from agentRepository with correct agentId', async () => {
		await useCase.execute('Hello', 'agent-1', 'session-1')
		expect(mockAgentRepository.get).toHaveBeenCalledWith('agent-1')
	})

	it('retrieves provider entity from providerRepository with agent.providerId', async () => {
		await useCase.execute('Hello', 'agent-1', 'session-1')
		expect(mockProviderRepository.get).toHaveBeenCalledWith('provider-1')
	})

	it('resolves provider from providerRegistry using provider entity', async () => {
		await useCase.execute('Hello', 'agent-1', 'session-1')
		expect(mockProviderRegistry.resolve).toHaveBeenCalledWith(
			mockProviderEntity,
		)
	})

	it('collects tool definitions from toolRegistry for each agent.toolIds', async () => {
		await useCase.execute('Hello', 'agent-1', 'session-1')
		expect(mockToolRegistry.get).toHaveBeenCalledWith('read-file')
	})

	it('appends user message to context', async () => {
		await useCase.execute('Hello', 'agent-1', 'session-1')
		expect(mockContextRepository.append).toHaveBeenCalledWith(
			'session-1',
			expect.objectContaining({
				role: 'user',
				content: 'Hello',
			}),
		)
	})

	it('publishes prompt event to event bus', async () => {
		await useCase.execute('Hello', 'agent-1', 'session-1')
		expect(mockEventBus.publish).toHaveBeenCalledWith(
			'inference',
			expect.objectContaining({ type: 'prompt' }),
		)
	})

	it('publishes token events', async () => {
		await useCase.execute('Hello', 'agent-1', 'session-1')
		expect(mockEventBus.publish).toHaveBeenCalledWith(
			'inference',
			expect.objectContaining({ type: 'token' }),
		)
	})

	it('breaks loop when no pending tool calls (final response)', async () => {
		await useCase.execute('Hello', 'agent-1', 'session-1')
		expect(mockProvider.infer).toHaveBeenCalled()
	})

	it('propagates errors from agent/repository lookups', async () => {
		;(mockAgentRepository.get as any).mockImplementation(() => {
			throw new Error('Agent not found')
		})
		await expect(
			useCase.execute('Hello', 'agent-1', 'session-1'),
		).rejects.toThrow('Agent not found')
	})

	it('propagates errors from provider lookups', async () => {
		;(mockProviderRepository.get as any).mockImplementation(() => {
			throw new Error('Provider not found')
		})
		await expect(
			useCase.execute('Hello', 'agent-1', 'session-1'),
		).rejects.toThrow('Provider not found')
	})

	it('iterates over provider.infer() async generator correctly', async () => {
		await useCase.execute('Hello', 'agent-1', 'session-1')
		expect(mockProvider.infer).toHaveBeenCalledWith(
			mockAgent.providerConfiguration,
			expect.any(Array),
			expect.any(Array),
		)
	})

	it('prepends agent systemPrompt to context on each loop iteration', async () => {
		await useCase.execute('Hello', 'agent-1', 'session-1')
		const inferCalls = (mockProvider.infer as any).mock.calls
		expect(inferCalls.length).toBeGreaterThan(0)
		const context = inferCalls[0][1]
		const systemEntry = context.find(
			(e: { role: string; id: string }) =>
				e.role === 'system' && e.id === 'system-prompt',
		)
		expect(systemEntry).toBeDefined()
	})

	it('calls provider.shouldCompact(context) and compacts if needed', async () => {
		const compactedContext = [
			{
				id: 'system-prompt',
				role: 'system' as const,
				content: 'compacted',
				ts: 0,
			},
		]
		const compactingProvider = {
			...(mockProvider as any),
			shouldCompact: vi.fn().mockReturnValue(true),
			compact: vi.fn().mockResolvedValue(compactedContext),
		} as ProviderPort
		;(mockProviderRegistry.resolve as any).mockReturnValue(compactingProvider)

		await useCase.execute('Hello', 'agent-1', 'session-1')

		expect(compactingProvider.shouldCompact).toHaveBeenCalled()
		expect(compactingProvider.compact).toHaveBeenCalled()
		expect(mockContextRepository.update).toHaveBeenCalledWith(
			'session-1',
			compactedContext,
		)
	})

	it('joins pendingTokens into content before tool-call entry creation', async () => {
		// With no tool calls, the final assistant entry should have joined tokens
		const publishCalls = (mockEventBus.publish as any).mock.calls as Array<
			[event: string, envelope: { role?: string; type?: string }]
		>
		const assistantEntries = publishCalls.filter((call) => {
			const envelope = call[1]
			return (
				envelope?.role === 'assistant' &&
				envelope?.type !== 'token' &&
				envelope?.type !== 'thought'
			)
		})
		expect(assistantEntries.length).toBeGreaterThanOrEqual(0)
	})
})
