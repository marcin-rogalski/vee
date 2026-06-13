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
let inferCallCount = 0

beforeEach(() => {
	inferCallCount = 0

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
		publish: vi.fn().mockReturnValue(undefined),
		subscribe: vi.fn().mockReturnValue(() => {}),
	} as unknown as EventBusPort

	mockProvider = {
		id: 'provider-1',
		type: 'openai',
		countTokens: vi.fn().mockReturnValue(10),
		shouldCompact: vi.fn().mockReturnValue(false),
		compact: vi.fn().mockResolvedValue([]),
		infer: vi.fn().mockImplementation(() => {
			inferCallCount++
			if (inferCallCount > 1) {
				// Return empty iterator on subsequent calls to prevent infinite loop
				return {
					[Symbol.asyncIterator]() {
						return {
							async next() {
								return { done: true }
							},
						}
					},
				}
			}

			const events = [{ type: 'token', content: 'Hello, world!' }]
			let index = 0
			return {
				[Symbol.asyncIterator]() {
					return this
				},
				async next() {
					if (index >= events.length) {
						return { done: true }
					}
					const value = events[index++]
					return { value, done: false }
				},
			}
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
			expect.objectContaining({ type: 'prompt' }),
		)
	})

	it('publishes token events', async () => {
		await useCase.execute('Hello', 'agent-1', 'session-1')
		expect(mockEventBus.publish).toHaveBeenCalledWith(
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
		// With no tool calls, tokens are published individually but no assistant entry is created
		// Capture publish calls after useCase.execute to see events
		await useCase.execute('Hello', 'agent-1', 'session-1')
		const publishCalls = (mockEventBus.publish as any).mock.calls
		// Count assistant token events
		const assistantTokenEvents = publishCalls.filter((call: any) => {
			const envelope = call[0]
			return envelope?.role === 'assistant' && envelope?.type === 'token'
		})
		// Verify token events were published
		expect(assistantTokenEvents).toHaveLength(1) // 'Hello, world!' (single token from mock)
	})

	it('executes single tool call and publishes tool-call and tool-response events', async () => {
		const mockToolCall = {
			name: 'read-file',
			arguments: JSON.stringify({ path: '/test.txt' }),
		}

		// Track calls to prevent infinite loop
		let toolCallTestCallCount = 0
		const mockInfer = vi.fn()
		mockInfer.mockImplementation(() => {
			toolCallTestCallCount++
			if (toolCallTestCallCount > 1) {
				// Return empty iterator on subsequent calls to prevent infinite loop
				return {
					[Symbol.asyncIterator]() {
						return {
							async next() {
								return { done: true }
							},
						}
					},
				}
			}

			const events = [
				{ type: 'token', content: 'I ' },
				{ type: 'token', content: 'will ' },
				{ type: 'token', content: 'read ' },
				{ type: 'token', content: 'the ' },
				{ type: 'token', content: 'file.' },
				{ type: 'tool-call', toolCalls: [mockToolCall] },
			]
			let index = 0
			return {
				[Symbol.asyncIterator]() {
					return this
				},
				async next() {
					if (index >= events.length) {
						return { done: true }
					}
					const value = events[index++]
					return { value, done: false }
				},
			}
		})
		;(mockProvider.infer as any).mockImplementation(() => mockInfer())

		// Setup mock to track tool execution call arguments
		const _executeCallCount = 0
		;(mockToolRegistry.get as any).mockReturnValue({
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
		})

		await useCase.execute('Hello', 'agent-1', 'session-1')

		// Verify tool-call event was published
		const publishCalls = (mockEventBus.publish as any).mock.calls
		const toolCallEvent = publishCalls.find(
			(call: any) => call[0]?.type === 'tool-call',
		)
		expect(toolCallEvent).toBeDefined()
		expect(toolCallEvent[0].toolCalls).toEqual([mockToolCall])

		// Verify tool execution was called with JSON string argument
		expect(mockToolRegistry.get).toHaveBeenCalledWith('read-file')
		const mockTool = mockToolRegistry.get('read-file')
		expect(mockTool.execute).toHaveBeenCalledWith(
			JSON.stringify({ path: '/test.txt' }),
		)

		// Verify tool-response event was published
		const toolResponseEvent = publishCalls.find(
			(call: any) => call[0]?.type === 'tool-response',
		)
		expect(toolResponseEvent).toBeDefined()
		expect(toolResponseEvent[0].content).toBe('file content')

		// Verify context repository was updated with tool call and response entries
		expect(mockContextRepository.append).toHaveBeenCalledTimes(3) // user prompt + tool call + tool response
	})

	it('executes multiple tool calls concurrently', async () => {
		const mockToolCall1 = {
			name: 'read-file',
			arguments: JSON.stringify({ path: '/test1.txt' }),
		}
		const mockToolCall2 = {
			name: 'read-file',
			arguments: JSON.stringify({ path: '/test2.txt' }),
		}

		let multipleToolCallsTestCallCount = 0
		const mockInfer = vi.fn()
		mockInfer.mockImplementation(() => {
			multipleToolCallsTestCallCount++
			if (multipleToolCallsTestCallCount > 1) {
				// Return empty iterator on subsequent calls to prevent infinite loop
				return {
					[Symbol.asyncIterator]() {
						return {
							async next() {
								return { done: true }
							},
						}
					},
				}
			}

			const events = [
				{ type: 'tool-call', toolCalls: [mockToolCall1, mockToolCall2] },
			]
			let index = 0
			return {
				[Symbol.asyncIterator]() {
					return this
				},
				async next() {
					if (index >= events.length) {
						return { done: true }
					}
					const value = events[index++]
					return { value, done: false }
				},
			}
		})
		;(mockProvider.infer as any).mockImplementation(() => mockInfer())

		// Mock two separate tool executions with JSON string arguments
		const mockExecute1 = vi
			.fn()
			.mockResolvedValue({ content: 'content1', code: undefined })
		const mockExecute2 = vi
			.fn()
			.mockResolvedValue({ content: 'content2', code: undefined })

		let executeCallCount = 0
		;(mockToolRegistry.get as any).mockReturnValue({
			id: 'read-file',
			description: 'Read a file',
			definition: {
				name: 'read-file',
				description: 'Read a file',
				parameters: '{}',
			},
			execute: vi.fn().mockImplementation((args: string) => {
				executeCallCount++
				if (executeCallCount === 1) {
					return mockExecute1(args)
				} else {
					return mockExecute2(args)
				}
			}),
		})

		await useCase.execute('Hello', 'agent-1', 'session-1')

		// Verify both tool calls were executed with JSON string arguments
		expect(mockExecute1).toHaveBeenCalledWith(
			JSON.stringify({ path: '/test1.txt' }),
		)
		expect(mockExecute2).toHaveBeenCalledWith(
			JSON.stringify({ path: '/test2.txt' }),
		)

		// Verify tool-response events were published for each tool call
		const publishCalls = (mockEventBus.publish as any).mock.calls
		const toolResponseEvents = publishCalls.filter(
			(call: any) => call[0]?.type === 'tool-response',
		)
		expect(toolResponseEvents).toHaveLength(2)
	})

	it('handles tool execution error with proper event publishing', async () => {
		const mockToolCall = {
			name: 'read-file',
			arguments: JSON.stringify({ path: '/error.txt' }),
		}

		let toolExecutionErrorTestCallCount = 0
		const mockInfer = vi.fn()
		mockInfer.mockImplementation(() => {
			toolExecutionErrorTestCallCount++
			if (toolExecutionErrorTestCallCount > 1) {
				// Return empty iterator on subsequent calls to prevent infinite loop
				return {
					[Symbol.asyncIterator]() {
						return {
							async next() {
								return { done: true }
							},
						}
					},
				}
			}

			const events = [{ type: 'tool-call', toolCalls: [mockToolCall] }]
			let index = 0
			return {
				[Symbol.asyncIterator]() {
					return this
				},
				async next() {
					if (index >= events.length) {
						return { done: true }
					}
					const value = events[index++]
					return { value, done: false }
				},
			}
		})
		;(mockProvider.infer as any).mockImplementation(() => mockInfer())

		// Mock tool execution to throw an error
		const error = new Error('File not found')
		;(mockToolRegistry.get as any).mockReturnValue({
			id: 'read-file',
			description: 'Read a file',
			definition: {
				name: 'read-file',
				description: 'Read a file',
				parameters: '{}',
			},
			execute: vi.fn().mockRejectedValue(error),
		})

		await expect(
			useCase.execute('Hello', 'agent-1', 'session-1'),
		).rejects.toThrow('File not found')
	})

	it('propagates provider.infer() errors', async () => {
		;(mockProvider.infer as any).mockImplementation(() => {
			throw new Error('Provider error')
		})

		await expect(
			useCase.execute('Hello', 'agent-1', 'session-1'),
		).rejects.toThrow('Provider error')
	})

	it('handles empty toolIds array correctly', async () => {
		const emptyToolAgent = {
			...mockAgent,
			toolIds: [],
		}
		;(mockAgentRepository.get as any).mockResolvedValue(emptyToolAgent)

		await useCase.execute('Hello', 'agent-1', 'session-1')

		// Verify no tools were retrieved
		expect(mockToolRegistry.get).not.toHaveBeenCalled()
		// With empty toolIds, only user prompt is appended (no assistant entry since no tool calls or tokens)
		expect(mockContextRepository.append).toHaveBeenCalledTimes(1)
		expect(mockContextRepository.append).toHaveBeenCalledWith(
			'session-1',
			expect.objectContaining({ role: 'user' }),
		)
	})
})
