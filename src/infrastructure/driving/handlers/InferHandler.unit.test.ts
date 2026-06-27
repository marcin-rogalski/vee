/** biome-ignore-all lint/suspicious/noExplicitAny: test mocks require any casts */
import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type ChatMessageService from '@application/ports/ChatMessageService.port'
import type ContextService from '@application/ports/ContextService.port'
import type EventBusPort from '@application/ports/EventBus.port'
import type ProviderRegistryPort from '@application/ports/ProviderRegistry.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import type ToolRegistryPort from '@application/ports/ToolRegistry.port'
import type BuildContextUseCase from '@application/usecases/BuildContext.usecase'
import type { AgentData } from '@domain/Agent'
import type { ProviderData } from '@domain/Provider'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import InferHandler from './InferHandler'

// Shared mock state for sub-use cases created by handler
const mockInferTurnExecute = vi.fn()
const mockExecuteToolsExecute = vi.fn()

vi.mock('@application/usecases/InferTurn.usecase', () => ({
	default: class {
		execute = mockInferTurnExecute
	},
}))

vi.mock('@application/usecases/ExecuteTools.usecase', () => ({
	default: class {
		execute = mockExecuteToolsExecute
	},
}))

const mockAgent: AgentData = {
	id: 'agent-1',
	name: 'Test Agent',
	systemPrompt: 'You are a test agent.',
	providerId: 'provider-1',
	providerOverrides: { model: 'test-model' },
	toolIds: [],
}

const mockProviderEntity: ProviderData = {
	id: 'provider-1',
	name: 'Test Provider',
	type: 'openai',
	configSchema: {
		$schema: 'http://json-schema.org/draft-07/schema#',
		type: 'object',
		properties: {},
	},
	config: {},
}

let mockAgentRepository: AgentRepositoryPort
let mockProviderRepository: ProviderRepositoryPort
let mockProviderRegistry: ProviderRegistryPort
let mockToolRegistry: ToolRegistryPort
let mockContextService: ContextService
let mockChatMessageService: ChatMessageService
let mockEventBus: EventBusPort
let mockBuildContextUseCase: BuildContextUseCase
let handler: InferHandler

beforeEach(() => {
	vi.clearAllMocks()

	mockAgentRepository = {
		get: vi.fn().mockResolvedValue(mockAgent),
		list: vi.fn().mockResolvedValue([]),
		save: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
	} as unknown as AgentRepositoryPort

	mockProviderRepository = {
		get: vi.fn().mockResolvedValue(mockProviderEntity),
		list: vi.fn().mockResolvedValue([]),
		save: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
	} as unknown as ProviderRepositoryPort

	mockProviderRegistry = {
		resolve: vi.fn().mockReturnValue({}),
		schema: vi.fn().mockReturnValue({}),
	} as unknown as ProviderRegistryPort

	mockToolRegistry = {
		get: vi.fn().mockReturnValue({ definition: {} }),
		list: vi.fn().mockReturnValue([]),
	} as unknown as ToolRegistryPort

	mockContextService = {
		build: vi.fn().mockResolvedValue([]),
		append: vi.fn().mockResolvedValue(undefined),
		compact: vi.fn().mockResolvedValue(undefined),
	}

	mockChatMessageService = {
		create: vi.fn().mockResolvedValue(undefined),
		getBySession: vi.fn().mockResolvedValue([]),
		deleteBySession: vi.fn().mockResolvedValue(undefined),
	}

	mockEventBus = {
		publish: vi.fn(),
		subscribe: vi.fn(),
	} as unknown as EventBusPort

	mockBuildContextUseCase = {
		execute: vi.fn().mockResolvedValue([]),
	} as unknown as BuildContextUseCase

	// Default: no tool calls (simple response)
	mockInferTurnExecute.mockResolvedValue({
		tokens: 'Hello world',
		thoughts: [],
	})
	mockExecuteToolsExecute.mockResolvedValue([])

	handler = new InferHandler(
		mockAgentRepository,
		mockProviderRepository,
		mockProviderRegistry,
		mockToolRegistry,
		mockContextService,
		mockChatMessageService,
		mockEventBus,
		mockBuildContextUseCase,
		{ execute: mockExecuteToolsExecute } as any,
		() => ({ execute: mockInferTurnExecute }) as any,
	)
})

describe('InferHandler', () => {
	it('resolves agent from agentRepository', async () => {
		await handler.execute('Hello', 'agent-1', 'session-1')
		expect(mockAgentRepository.get).toHaveBeenCalledWith('agent-1')
	})

	it('resolves provider from providerRepository using agent.providerId', async () => {
		await handler.execute('Hello', 'agent-1', 'session-1')
		expect(mockProviderRepository.get).toHaveBeenCalledWith('provider-1')
	})

	it('persists user prompt via contextService', async () => {
		await handler.execute('Hello', 'agent-1', 'session-1')
		expect(mockContextService.append).toHaveBeenCalledWith(
			'session-1',
			expect.objectContaining({
				role: 'user',
				content: 'Hello',
			}),
		)
	})

	it('creates chat message for user prompt', async () => {
		await handler.execute('Hello', 'agent-1', 'session-1')
		expect(mockChatMessageService.create).toHaveBeenCalledWith(
			expect.objectContaining({
				role: 'user',
				content: 'Hello',
			}),
		)
	})

	it('publishes prompt event to event bus', async () => {
		await handler.execute('Hello', 'agent-1', 'session-1')
		expect(mockEventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'prompt',
				role: 'user',
			}),
		)
	})

	it('delegates context building to buildContextUseCase', async () => {
		await handler.execute('Hello', 'agent-1', 'session-1')
		expect(mockBuildContextUseCase.execute).toHaveBeenCalledWith(
			mockAgent,
			'session-1',
		)
	})

	it('persists assistant response via contextService', async () => {
		await handler.execute('Hello', 'agent-1', 'session-1')
		expect(mockContextService.append).toHaveBeenCalledWith(
			'session-1',
			expect.objectContaining({
				role: 'assistant',
				content: 'Hello world',
			}),
		)
	})

	it('creates chat message for assistant response', async () => {
		await handler.execute('Hello', 'agent-1', 'session-1')
		expect(mockChatMessageService.create).toHaveBeenCalledWith(
			expect.objectContaining({
				role: 'assistant',
				content: 'Hello world',
			}),
		)
	})

	it('publishes done event after successful inference', async () => {
		await handler.execute('Hello', 'agent-1', 'session-1')
		expect(mockEventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'done',
				role: 'system',
			}),
		)
	})

	it('executes tools when provider returns tool calls', async () => {
		mockInferTurnExecute.mockResolvedValueOnce({
			tokens: '',
			thoughts: [],
			toolCalls: [{ name: 'search', arguments: '{"query":"test"}' }],
		})
		mockExecuteToolsExecute.mockResolvedValueOnce([
			{
				id: 'tool-1',
				role: 'system',
				name: 'search',
				content: 'Tool result',
				ts: Date.now(),
			},
		])

		// Second turn: no tool calls
		mockInferTurnExecute.mockResolvedValueOnce({
			tokens: 'Final answer',
			thoughts: [],
		})

		await handler.execute('Hello', 'agent-1', 'session-1')

		expect(mockExecuteToolsExecute).toHaveBeenCalled()
		expect(mockInferTurnExecute).toHaveBeenCalledTimes(2)
	})

	it('publishes tool-call event when tools are invoked', async () => {
		mockInferTurnExecute.mockResolvedValueOnce({
			tokens: '',
			thoughts: [],
			toolCalls: [{ name: 'search', arguments: '{}' }],
		})
		mockExecuteToolsExecute.mockResolvedValueOnce([])

		// Second turn: no tool calls
		mockInferTurnExecute.mockResolvedValueOnce({
			tokens: 'Done',
			thoughts: [],
		})

		await handler.execute('Hello', 'agent-1', 'session-1')

		expect(mockEventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'tool-call',
				role: 'assistant',
			}),
		)
	})

	it('publishes thought events for reasoning tokens', async () => {
		mockInferTurnExecute.mockResolvedValueOnce({
			tokens: 'Answer',
			thoughts: ['Let me think...'],
		})

		await handler.execute('Hello', 'agent-1', 'session-1')

		expect(mockEventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'thought',
				content: 'Let me think...',
			}),
		)
	})

	it('stops after max iterations to prevent infinite loops', async () => {
		// Always return tool calls — should stop at 10 iterations
		mockInferTurnExecute.mockResolvedValue({
			tokens: '',
			thoughts: [],
			toolCalls: [{ name: 'loop', arguments: '{}' }],
		})
		mockExecuteToolsExecute.mockResolvedValue([])

		await handler.execute('Hello', 'agent-1', 'session-1')

		expect(mockInferTurnExecute).toHaveBeenCalledTimes(10)
	})
})
