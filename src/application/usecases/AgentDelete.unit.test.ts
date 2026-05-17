import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AgentDeleteUseCase from './AgentDelete.usecase'

describe('UC1 — AgentDelete use case', () => {
	let mockRepository: AgentRepositoryPort
	let useCase: AgentDeleteUseCase

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
		useCase = new AgentDeleteUseCase(mockRepository)
	})

	it('calls agentRepository.delete(id) with correct id', async () => {
		const deleteSpy = vi.spyOn(mockRepository, 'delete')
		await useCase.execute('agent-123')
		expect(deleteSpy).toHaveBeenCalledWith('agent-123')
	})

	it('propagates errors from repository', async () => {
		vi.spyOn(mockRepository, 'delete').mockRejectedValue(
			new Error('Database error'),
		)
		await expect(useCase.execute('agent-123')).rejects.toThrow('Database error')
	})
})
