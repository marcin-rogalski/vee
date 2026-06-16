/** biome-ignore-all lint/suspicious/noExplicitAny: test mocks require any casts */
import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'
import type ProviderRegistryPort from '@application/ports/ProviderRegistry.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import type ToolRegistryPort from '@application/ports/ToolRgistry.port'
import type ChatMessageService from '@application/services/ChatMessageService.port'
import type ContextService from '@application/services/ContextService.port'
import type Agent from '@domain/Agent'
import type Provider from '@domain/Provider'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type BuildContextUseCase from './BuildContext.usecase'
import type ExecuteToolsUseCase from './ExecuteTools.usecase'
import InferOrchestratorUseCase from './InferOrchestrator.usecase'
import type InferTurnUseCase from './InferTurn.usecase'

const mockAgent: Agent = {
	id: 'agent-1',
	name: 'Test Agent',
	systemPrompt: 'You are a test agent.',
	providerId: 'provider-1',
	providerOverrides: { model: 'test-model' },
	toolIds: [],
}

const mockProviderEntity: Provider = {
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
let mockInferTurnUseCase: InferTurnUseCase
let mockExecuteToolsUseCase: ExecuteToolsUseCase
let orchestrator: InferOrchestratorUseCase

beforeEach(() => {
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

	mockInferTurnUseCase = {
		execute: vi.fn().mockResolvedValue({
			tokens: 'Hello world',
			thoughts: [],
		}),
	} as unknown as InferTurnUseCase

	mockExecuteToolsUseCase = {
		execute: vi.fn().mockResolvedValue([]),
	} as unknown as ExecuteToolsUseCase

	orchestrator = new InferOrchestratorUseCase(
		mockAgentRepository,
		mockProviderRepository,
		mockProviderRegistry,
		mockToolRegistry,
		mockContextService,
		mockChatMessageService,
		mockEventBus,
		mockBuildContextUseCase,
		mockInferTurnUseCase,
		mockExecuteToolsUseCase,
	)
})

describe('InferOrchestratorUseCase', () => {
	it('resolves agent from agentRepository', async () => {
		await orchestrator.execute('Hello', 'agent-1', 'session-1')
		expect(mockAgentRepository.get).toHaveBeenCalledWith('agent-1')
	})

	it('resolves provider from providerRepository using agent.providerId', async () => {
		await orchestrator.execute('Hello', 'agent-1', 'session-1')
		expect(mockProviderRepository.get).toHaveBeenCalledWith('provider-1')
	})

	it('persists user prompt via contextService', async () => {
		await orchestrator.execute('Hello', 'agent-1', 'session-1')
		expect(mockContextService.append).toHaveBeenCalledWith(
			'session-1',
			expect.objectContaining({
				role: 'user',
				content: 'Hello',
			}),
		)
	})

	it('creates chat message for user prompt', async () => {
		await orchestrator.execute('Hello', 'agent-1', 'session-1')
		expect(mockChatMessageService.create).toHaveBeenCalledWith(
			expect.objectContaining({
				role: 'user',
				content: 'Hello',
			}),
		)
	})

	it('publishes prompt event to event bus', async () => {
		await orchestrator.execute('Hello', 'agent-1', 'session-1')
		expect(mockEventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'prompt',
				role: 'user',
			}),
		)
	})

	it('delegates context building to buildContextUseCase', async () => {
		await orchestrator.execute('Hello', 'agent-1', 'session-1')
		expect(mockBuildContextUseCase.execute).toHaveBeenCalledWith(
			mockAgent,
			'session-1',
		)
	})

	it('delegates inference to inferTurnUseCase with context and config', async () => {
		await orchestrator.execute('Hello', 'agent-1', 'session-1')
		expect(mockInferTurnUseCase.execute).toHaveBeenCalledWith(
			[], // context from buildContextUseCase mock
			expect.objectContaining({ model: 'test-model' }), // merged config
			[], // tools
		)
	})

	it('persists assistant response via contextService', async () => {
		await orchestrator.execute('Hello', 'agent-1', 'session-1')
		expect(mockContextService.append).toHaveBeenCalledWith(
			'session-1',
			expect.objectContaining({
				role: 'assistant',
				content: 'Hello world',
			}),
		)
	})

	it('creates chat message for assistant response', async () => {
		await orchestrator.execute('Hello', 'agent-1', 'session-1')
		expect(mockChatMessageService.create).toHaveBeenCalledWith(
			expect.objectContaining({
				role: 'assistant',
				content: 'Hello world',
			}),
		)
	})

	it('publishes done event when no tool calls', async () => {
		await orchestrator.execute('Hello', 'agent-1', 'session-1')
		expect(mockEventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'done' }),
		)
	})

	it('executes tools when infer result has tool calls', async () => {
		mockInferTurnUseCase.execute = vi.fn().mockResolvedValue({
			tokens: '',
			thoughts: [],
			toolCalls: [{ name: 'read-file', arguments: '{"path":"test.txt"}' }],
		})

		await orchestrator.execute('Hello', 'agent-1', 'session-1')
		expect(mockExecuteToolsUseCase.execute).toHaveBeenCalled()
	})

	it('re-enters loop after tool execution', async () => {
		let callCount = 0
		mockInferTurnUseCase.execute = vi.fn().mockImplementation(() => {
			callCount++
			if (callCount === 1) {
				return Promise.resolve({
					tokens: '',
					thoughts: [],
					toolCalls: [{ name: 'read-file', arguments: '{}' }],
				})
			}
			return Promise.resolve({
				tokens: 'Final response',
				thoughts: [],
			})
		})

		await orchestrator.execute('Hello', 'agent-1', 'session-1')
		expect(mockInferTurnUseCase.execute).toHaveBeenCalledTimes(2)
	})

	it('publishes tool-call event when tools are requested', async () => {
		mockInferTurnUseCase.execute = vi.fn().mockResolvedValue({
			tokens: '',
			thoughts: [],
			toolCalls: [{ name: 'read-file', arguments: '{}' }],
		})

		await orchestrator.execute('Hello', 'agent-1', 'session-1')
		expect(mockEventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'tool-call' }),
		)
	})

	it('publishes tool-response events for each tool result', async () => {
		mockInferTurnUseCase.execute = vi.fn().mockResolvedValue({
			tokens: '',
			thoughts: [],
			toolCalls: [{ name: 'read-file', arguments: '{}' }],
		})

		mockExecuteToolsUseCase.execute = vi.fn().mockResolvedValue([
			{
				id: 'tool-1',
				role: 'system',
				name: 'read-file',
				content: 'file contents',
				ts: Date.now(),
			},
		])

		await orchestrator.execute('Hello', 'agent-1', 'session-1')
		expect(mockEventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'tool-response' }),
		)
	})

	it('respects max iteration limit', async () => {
		// Always return tool calls — should not loop infinitely
		mockInferTurnUseCase.execute = vi.fn().mockResolvedValue({
			tokens: '',
			thoughts: [],
			toolCalls: [{ name: 'read-file', arguments: '{}' }],
		})

		await expect(
			orchestrator.execute('Hello', 'agent-1', 'session-1'),
		).resolves.toBeUndefined()
	})

	it('publishes thought events from infer result', async () => {
		mockInferTurnUseCase.execute = vi.fn().mockResolvedValue({
			tokens: 'Response',
			thoughts: ['Thinking...'],
		})

		await orchestrator.execute('Hello', 'agent-1', 'session-1')
		expect(mockEventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'thought', content: 'Thinking...' }),
		)
	})
})
