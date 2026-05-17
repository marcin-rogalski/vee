import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SessionListUseCase from './SessionList.usecase'

describe('UC5 — SessionList use case', () => {
	let mockRepository: SessionRepositoryPort
	let useCase: SessionListUseCase

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
		useCase = new SessionListUseCase(mockRepository)
	})

	it('returns array of { id, name } objects', async () => {
		vi.spyOn(mockRepository, 'list').mockResolvedValue([
			{ id: 's1', name: 'Session One' },
			{ id: 's2', name: 'Session Two' },
		])
		const result = await useCase.execute()
		expect(Array.isArray(result)).toBe(true)
		expect(result).toHaveLength(2)
		expect(result[0]).toEqual({ id: 's1', name: 'Session One' })
		expect(result[1]).toEqual({ id: 's2', name: 'Session Two' })
	})

	it('returns empty array when no sessions exist', async () => {
		vi.spyOn(mockRepository, 'list').mockResolvedValue([])
		const result = await useCase.execute()
		expect(result).toEqual([])
	})
})
