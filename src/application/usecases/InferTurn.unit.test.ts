/** biome-ignore-all lint/suspicious/noExplicitAny: test mocks require any casts */
import type ProviderPort from '@application/ports/Provider.port'
import type ConversationEntry from '@domain/ConversationEntry'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import InferTurnUseCase from './InferTurn.usecase'

const mockContext: Array<ConversationEntry> = [
	{ id: '1', role: 'system', content: 'You are helpful.', ts: 0 },
	{ id: '2', role: 'user', content: 'Hello', ts: 1 },
]

const mockConfig = { model: 'test-model' }
const mockTools: Array<{
	name: string
	description: string
	parameters: string
}> = []

let mockProvider: ProviderPort
let useCase: InferTurnUseCase

async function* createMockStream(events: Array<any>) {
	for (const event of events) {
		yield event
	}
}

beforeEach(() => {
	mockProvider = {
		id: 'test-provider',
		type: 'openai',
		countTokens: vi.fn(),
		compact: vi.fn(),
		shouldCompact: vi.fn(),
		infer: vi.fn().mockImplementation(() => createMockStream([])),
	} as unknown as ProviderPort

	useCase = new InferTurnUseCase(mockProvider)
})

describe('InferTurnUseCase', () => {
	it('calls provider.infer with correct arguments', async () => {
		await useCase.execute(mockContext, mockConfig, mockTools)

		expect(mockProvider.infer).toHaveBeenCalledWith(
			mockConfig,
			mockContext,
			mockTools,
		)
	})

	it('accumulates token events into a single string', async () => {
		const stream = createMockStream([
			{ type: 'token', content: 'Hello' },
			{ type: 'token', content: ' ' },
			{ type: 'token', content: 'world' },
		])

		mockProvider.infer = vi.fn().mockImplementation(() => stream)

		const result = await useCase.execute(mockContext, mockConfig, mockTools)

		expect(result.tokens).toBe('Hello world')
	})

	it('collects thought events', async () => {
		const stream = createMockStream([
			{ type: 'thought', content: 'Let me think...' },
			{ type: 'token', content: 'Response' },
			{ type: 'thought', content: 'Done thinking' },
		])

		mockProvider.infer = vi.fn().mockImplementation(() => stream)

		const result = await useCase.execute(mockContext, mockConfig, mockTools)

		expect(result.thoughts).toEqual(['Let me think...', 'Done thinking'])
	})

	it('captures tool-call events', async () => {
		const stream = createMockStream([
			{ type: 'token', content: '' },
			{
				type: 'tool-call',
				toolCalls: [{ name: 'read-file', arguments: '{"path":"test.txt"}' }],
			},
		])

		mockProvider.infer = vi.fn().mockImplementation(() => stream)

		const result = await useCase.execute(mockContext, mockConfig, mockTools)

		expect(result.toolCalls).toEqual([
			{ name: 'read-file', arguments: '{"path":"test.txt"}' },
		])
	})

	it('returns empty result when no events', async () => {
		const stream = createMockStream([])

		mockProvider.infer = vi.fn().mockImplementation(() => stream)

		const result = await useCase.execute(mockContext, mockConfig, mockTools)

		expect(result).toEqual({
			tokens: '',
			thoughts: [],
			toolCalls: undefined,
		})
	})

	it('handles mixed event types in order', async () => {
		const stream = createMockStream([
			{ type: 'thought', content: 'Planning...' },
			{ type: 'token', content: 'A' },
			{ type: 'token', content: 'B' },
			{
				type: 'tool-call',
				toolCalls: [{ name: 'calc', arguments: '{"expr":"1+1"}' }],
			},
		])

		mockProvider.infer = vi.fn().mockImplementation(() => stream)

		const result = await useCase.execute(mockContext, mockConfig, mockTools)

		expect(result.tokens).toBe('AB')
		expect(result.thoughts).toEqual(['Planning...'])
		expect(result.toolCalls).toEqual([
			{ name: 'calc', arguments: '{"expr":"1+1"}' },
		])
	})
})
