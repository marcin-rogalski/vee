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
				providerOverrides: {},
				toolIds: [],
			}),
			list: async () => [],
			listByProviderId: async () => [],
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

	it('propagates error when repository.list() throws', async () => {
		const testError = new Error('database connection failed')
		vi.spyOn(mockRepository, 'list').mockRejectedValue(testError)
		await expect(useCase.execute()).rejects.toThrow(
			'database connection failed',
		)
	})

	it('returns correct structure for large dataset (1000 agents)', async () => {
		const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
			id: `agent-${i}`,
			name: `Agent ${i}`,
			...(i % 3 === 0 ? { description: `Description for agent ${i}` } : {}),
		}))
		vi.spyOn(mockRepository, 'list').mockResolvedValue(largeDataset)
		const result = await useCase.execute()
		expect(Array.isArray(result)).toBe(true)
		expect(result).toHaveLength(1000)
		expect(result[0]).toEqual({
			id: 'agent-0',
			name: 'Agent 0',
			description: 'Description for agent 0',
		})
		expect(result[998]).toEqual({ id: 'agent-998', name: 'Agent 998' })
		expect(result[998]).not.toHaveProperty('description')
	})
})
