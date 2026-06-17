import type ContextService from '@application/services/ContextService.port'
import type Agent from '@domain/Agent'
import type ConversationEntry from '@domain/ConversationEntry'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BuildContextUseCase from './BuildContext.usecase'

const mockAgent: Agent = {
	id: 'agent-1',
	name: 'Test Agent',
	systemPrompt: 'You are a test agent.',
	providerId: 'provider-1',
	providerOverrides: { model: 'test-model' },
	toolIds: [],
}

let mockContextService: ContextService
let useCase: BuildContextUseCase

beforeEach(() => {
	mockContextService = {
		build: vi.fn().mockResolvedValue([]),
		append: vi.fn().mockResolvedValue(undefined),
		compact: vi.fn().mockResolvedValue(undefined),
	} as unknown as ContextService

	useCase = new BuildContextUseCase(mockContextService)
})

describe('BuildContextUseCase', () => {
	it('delegates to contextService.build with agent and sessionId', async () => {
		const context: Array<ConversationEntry> = [
			{ id: '1', role: 'system', content: 'You are a test agent.', ts: 1 },
			{ id: '2', role: 'user', content: 'Hello', ts: 2 },
		]
		mockContextService.build = vi.fn().mockResolvedValue(context)

		const result = await useCase.execute(mockAgent, 'session-1')

		expect(mockContextService.build).toHaveBeenCalledWith(
			mockAgent,
			'session-1',
		)
		expect(result).toEqual(context)
	})

	it('returns empty context when service returns empty', async () => {
		mockContextService.build = vi.fn().mockResolvedValue([])

		const result = await useCase.execute(mockAgent, 'session-42')

		expect(result).toEqual([])
	})
})
