import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AgentListUseCase from './AgentList.usecase'

describe('UC2 — AgentList use case', () => {
	let mockRepository: AgentRepositoryPort
	let useCase: AgentListUseCase

	beforeEach(() => {
		mockRepository = {
			get: async () => ({
				id: 'agent-1',
				name: 'Test',
				systemPrompt: '',
				providerId: 'p1',
				providerConfiguration: {},
				toolIds: [],
			}),
			list: async () => [],
			save: async () => {},
			delete: async () => {},
		}
		useCase = new AgentListUseCase(mockRepository)
	})

	it('returns array of { id, name, description? } objects', async () => {
		vi.spyOn(mockRepository, 'list').mockResolvedValue([
			{ id: 'a1', name: 'Agent One', description: 'First agent' },
			{ id: 'a2', name: 'Agent Two' },
		])
		const result = await useCase.execute()
		expect(Array.isArray(result)).toBe(true)
		expect(result).toHaveLength(2)
		expect(result[0]).toEqual({
			id: 'a1',
			name: 'Agent One',
			description: 'First agent',
		})
		expect(result[1]).toEqual({ id: 'a2', name: 'Agent Two' })
	})

	it('returns empty array when no agents exist', async () => {
		vi.spyOn(mockRepository, 'list').mockResolvedValue([])
		const result = await useCase.execute()
		expect(result).toEqual([])
	})

	it('omits description when undefined', async () => {
		vi.spyOn(mockRepository, 'list').mockResolvedValue([
			{ id: 'a1', name: 'Agent One' },
		])
		const result = await useCase.execute()
		expect(result[0]).not.toHaveProperty('description')
	})
})
