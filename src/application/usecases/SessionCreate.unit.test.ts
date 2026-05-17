import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SessionCreateUseCase from './SessionCreate.usecase'

describe('UC4 — SessionCreate use case', () => {
	let mockRepository: SessionRepositoryPort
	let useCase: SessionCreateUseCase

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
		useCase = new SessionCreateUseCase(mockRepository)
	})

	it('returns session id from repository', async () => {
		const result = await useCase.execute()
		expect(result).toBe('session-1')
	})

	it('passes empty string when name is undefined', async () => {
		const createSpy = vi.spyOn(mockRepository, 'create')
		await useCase.execute()
		expect(createSpy).toHaveBeenCalledWith('')
	})

	it('passes provided name when given', async () => {
		const createSpy = vi.spyOn(mockRepository, 'create')
		await useCase.execute('My Session')
		expect(createSpy).toHaveBeenCalledWith('My Session')
	})
})
