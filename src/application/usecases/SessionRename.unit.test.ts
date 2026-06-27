import type EventBusPort from '@application/ports/EventBus.port'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SessionRenameUseCase from './SessionRename.usecase'

describe('SessionRename use case', () => {
	let mockRepository: SessionRepositoryPort
	let mockEventBus: EventBusPort
	let useCase: SessionRenameUseCase

	beforeEach(() => {
		mockRepository = {
			get: async () => ({
				id: 'session-1',
				name: 'Old Name',
				agentId: 'agent-1',
				createdAt: 0,
				updatedAt: 0,
			}),
			list: async () => [],
			listByAgentId: async () => [],
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
		useCase = new SessionRenameUseCase(mockRepository, mockEventBus)
	})

	it('calls sessionRepository.setName(id, name)', async () => {
		const setNameSpy = vi.spyOn(mockRepository, 'setName')
		await useCase.execute('session-123', 'New Name')
		expect(setNameSpy).toHaveBeenCalledWith('session-123', 'New Name')
	})

	it('publishes a session-renamed event', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute('session-123', 'New Name')
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'session-renamed',
				sessionId: 'session-123',
				name: 'New Name',
				id: expect.any(String),
				role: 'system',
				ts: expect.any(Number),
			}),
		)
	})

	it('propagates errors from repository', async () => {
		vi.spyOn(mockRepository, 'setName').mockRejectedValue(
			new Error('Storage error'),
		)
		await expect(useCase.execute('session-123', 'New Name')).rejects.toThrow(
			'Storage error',
		)
	})
})
