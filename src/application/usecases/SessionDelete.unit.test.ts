import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SessionDeleteUseCase from './SessionDelete.usecase'

describe('UC6 — SessionDelete use case', () => {
	let mockRepository: SessionRepositoryPort
	let useCase: SessionDeleteUseCase

	beforeEach(() => {
		mockRepository = {
			get: async () => ({
				id: 'session-1',
				name: '',
				createdAt: 0,
				updatedAt: 0,
			}),
			list: async () => [],
			create: async () => ({
				id: 'session-1',
				name: '',
				createdAt: 0,
				updatedAt: 0,
			}),
			setName: async () => {},
			delete: async () => {},
		}
		useCase = new SessionDeleteUseCase(mockRepository)
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
})
