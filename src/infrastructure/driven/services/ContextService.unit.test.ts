/** biome-ignore-all lint/suspicious/noExplicitAny: test mocks require any casts */
import type ContextRepositoryPort from '@application/ports/ContextRepository.port'
import type Agent from '@domain/Agent'
import type ConversationEntry from '@domain/ConversationEntry'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContextServiceAdapter from './ContextService.adapter'

const mockAgent: Agent = {
	id: 'agent-1',
	name: 'Test Agent',
	systemPrompt: 'You are a helpful assistant.',
	providerId: 'provider-1',
	providerOverrides: { model: 'test-model' },
	toolIds: [],
}

let mockGet: ReturnType<typeof vi.fn>
let mockAppend: ReturnType<typeof vi.fn>
let mockUpdate: ReturnType<typeof vi.fn>
let mockDelete: ReturnType<typeof vi.fn>
let mockRepository: ContextRepositoryPort
let service: ContextServiceAdapter

beforeEach(() => {
	mockGet = vi.fn().mockResolvedValue([])
	mockAppend = vi.fn().mockResolvedValue(undefined)
	mockUpdate = vi.fn().mockResolvedValue(undefined)
	mockDelete = vi.fn().mockResolvedValue(undefined)

	mockRepository = {
		get: mockGet,
		append: mockAppend,
		update: mockUpdate,
		delete: mockDelete,
	} as unknown as ContextRepositoryPort

	service = new ContextServiceAdapter(mockRepository)
})

describe('ContextServiceAdapter', () => {
	describe('build', () => {
		it('returns system prompt entry followed by empty history', async () => {
			const result = await service.build(mockAgent, 'session-1')

			expect(result).toHaveLength(1)
			expect(result[0]).toMatchObject({
				role: 'system',
				content: 'You are a helpful assistant.',
			})
		})

		it('prepends system prompt before existing history', async () => {
			const history: Array<ConversationEntry> = [
				{ id: '1', role: 'user', content: 'Hello', ts: 100 },
				{ id: '2', role: 'assistant', content: 'Hi there', ts: 200 },
			]
			mockGet.mockResolvedValue(history)

			const result = await service.build(mockAgent, 'session-1')

			expect(result).toHaveLength(3)
			const [system, user, assistant] = result as [
				ConversationEntry,
				ConversationEntry,
				ConversationEntry,
			]
			expect(system.role).toBe('system')
			expect(user.role).toBe('user')
			expect(assistant.role).toBe('assistant')
		})

		it('fetches history from repository for given sessionId', async () => {
			await service.build(mockAgent, 'session-42')

			expect(mockGet).toHaveBeenCalledWith('session-42')
		})
	})

	describe('append', () => {
		it('delegates to repository append', async () => {
			const entries: Array<ConversationEntry> = [
				{ id: '1', role: 'user', content: 'test', ts: 1 },
			]

			await service.append('session-1', ...entries)

			expect(mockAppend).toHaveBeenCalledWith('session-1', ...entries)
		})

		it('supports multiple entries in a single call', async () => {
			const entries: Array<ConversationEntry> = [
				{ id: '1', role: 'user', content: 'Q', ts: 1 },
				{ id: '2', role: 'assistant', content: 'A', ts: 2 },
			]

			await service.append('session-1', ...entries)

			expect(mockAppend).toHaveBeenCalledTimes(1)
		})
	})

	describe('compact', () => {
		it('does not call update when shouldCompact returns false', async () => {
			mockGet.mockResolvedValue([
				{ id: '1', role: 'user', content: 'short', ts: 1 },
			])

			await service.compact(
				'session-1',
				(context) => context.length > 100,
				vi.fn(),
			)

			expect(mockUpdate).not.toHaveBeenCalled()
		})

		it('calls compact function and updates when shouldCompact returns true', async () => {
			const current: Array<ConversationEntry> = [
				{ id: '1', role: 'user', content: 'long context', ts: 1 },
			]
			const compacted: Array<ConversationEntry> = [
				{ id: '2', role: 'system', content: 'summarized', ts: 2 },
			]

			mockGet.mockResolvedValue(current)

			const compactFn = vi.fn().mockResolvedValue(compacted)

			await service.compact(
				'session-1',
				(context) => context.length > 0,
				compactFn,
			)

			expect(compactFn).toHaveBeenCalledWith(current)
			expect(mockUpdate).toHaveBeenCalledWith('session-1', compacted)
		})
	})
})
