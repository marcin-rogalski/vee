import type EventBusPort from '@application/ports/EventBus.port'
import type { Envelope } from '@application/ports/EventBus.port'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SessionDeleteUseCase from './SessionDelete.usecase'

describe('UC6 — SessionDelete use case', () => {
	let mockRepository: SessionRepositoryPort
	let mockEventBus: EventBusPort
	let useCase: SessionDeleteUseCase

	beforeEach(() => {
		mockRepository = {
			get: async () => ({
				id: 'session-1',
				name: '',
				agentId: 'agent-1',
				createdAt: 0,
				updatedAt: 0,
			}),
			list: async () => [],
			create: async () => ({
				id: 'session-1',
				name: '',
				agentId: 'agent-1',
				createdAt: 0,
				updatedAt: 0,
			}),
			setName: async () => {},
			delete: async () => {},
		}
		mockEventBus = {
			publish: vi.fn(),
			subscribe: vi.fn().mockReturnValue({
				next: vi.fn(),
				return: vi.fn(),
				throw: vi.fn(),
				[Symbol.asyncIterator]: vi.fn(),
				unsubscribe: vi.fn(),
			} as unknown as AsyncGenerator<
				import('@application/ports/EventBus.port').Envelope
			> & {
				unsubscribe: () => void
			}),
		}
		useCase = new SessionDeleteUseCase(mockRepository, mockEventBus)
	})

	it('calls sessionRepository.delete(id) with correct id', async () => {
		const deleteSpy = vi.spyOn(mockRepository, 'delete')
		await useCase.execute('session-123')
		expect(deleteSpy).toHaveBeenCalledWith('session-123')
	})

	it('propagates errors from repository', async () => {
		vi.spyOn(mockRepository, 'delete').mockRejectedValue(
			new Error('Storage error'),
		)
		await expect(useCase.execute('session-123')).rejects.toThrow(
			'Storage error',
		)
	})

	it('publishes a session-deleted event', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute('session-123')
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'session-deleted',
				sessionId: 'session-123',
				id: expect.any(String),
				role: 'system',
				ts: expect.any(Number),
			}),
		)
	})

	it('publishes event envelope with correct type contract (single argument)', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute('session-456')
		const envelope = publishSpy.mock.calls[0]?.[0] as Extract<
			Envelope,
			{ type: 'session-deleted' }
		>
		expect(envelope).toHaveProperty('id')
		expect(envelope).toHaveProperty('ts')
		expect(typeof envelope.id).toBe('string')
		expect(typeof envelope.ts).toBe('number')
		expect(envelope.type).toBe('session-deleted')
		expect(envelope.sessionId).toBe('session-456')
		expect(envelope.role).toBe('system')
	})

	it('propagates errors from eventBus.publish', async () => {
		vi.spyOn(mockRepository, 'delete').mockResolvedValue(undefined)
		vi.spyOn(mockEventBus, 'publish').mockRejectedValue(
			new Error('Event bus unavailable'),
		)
		await expect(useCase.execute('session-789')).rejects.toThrow(
			'Event bus unavailable',
		)
	})

	it('passes empty string id to repository and eventBus without validation', async () => {
		const deleteSpy = vi.spyOn(mockRepository, 'delete')
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute('')
		expect(deleteSpy).toHaveBeenCalledWith('')
		const envelope = publishSpy.mock.calls[0]?.[0] as Extract<
			Envelope,
			{ type: 'session-deleted' }
		>
		expect(envelope.sessionId).toBe('')
		expect(envelope.type).toBe('session-deleted')
	})

	it('passes whitespace-only id to repository and eventBus without validation', async () => {
		const deleteSpy = vi.spyOn(mockRepository, 'delete')
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute('   ')
		expect(deleteSpy).toHaveBeenCalledWith('   ')
		const envelope = publishSpy.mock.calls[0]?.[0] as Extract<
			Envelope,
			{ type: 'session-deleted' }
		>
		expect(envelope.sessionId).toBe('   ')
		expect(envelope.type).toBe('session-deleted')
	})

	it('handles whitespace id same as non-matching UUID (no input validation)', async () => {
		const deleteSpy = vi.spyOn(mockRepository, 'delete')
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute('   ')
		await useCase.execute('non-matching-uuid-12345')
		expect(deleteSpy).toHaveBeenNthCalledWith(1, '   ')
		expect(deleteSpy).toHaveBeenNthCalledWith(2, 'non-matching-uuid-12345')
		const envelope0 = publishSpy.mock.calls[0]?.[0] as Extract<
			Envelope,
			{ type: 'session-deleted' }
		>
		const envelope1 = publishSpy.mock.calls[1]?.[0] as Extract<
			Envelope,
			{ type: 'session-deleted' }
		>
		expect(envelope0.sessionId).toBe('   ')
		expect(envelope1.sessionId).toBe('non-matching-uuid-12345')
	})

	it('generates unique event envelope id and timestamp for each execution', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute('session-a')
		await useCase.execute('session-b')
		const env0 = publishSpy.mock.calls[0]?.[0] as Extract<
			Envelope,
			{ type: 'session-deleted' }
		>
		const env1 = publishSpy.mock.calls[1]?.[0] as Extract<
			Envelope,
			{ type: 'session-deleted' }
		>
		expect(typeof env0.id).toBe('string')
		expect(typeof env1.id).toBe('string')
		expect(env0.id).not.toBe(env1.id)
		expect(typeof env0.ts).toBe('number')
		expect(typeof env1.ts).toBe('number')
		expect(env0.ts).toBeGreaterThan(0)
		expect(env1.ts).toBeGreaterThan(0)
	})
})
