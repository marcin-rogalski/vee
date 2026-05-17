import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AgentUpsertUseCase from './AgentUpsert.usecase'

describe('UC3 — AgentUpsert use case', () => {
	let mockRepository: AgentRepositoryPort
	let useCase: AgentUpsertUseCase

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
		useCase = new AgentUpsertUseCase(mockRepository)
	})

	it('calls agentRepository.save(agent) with full agent object', async () => {
		const saveSpy = vi.spyOn(mockRepository, 'save')
		const agent = {
			id: 'agent-1',
			name: 'Test Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			providerConfiguration: { apiKey: 'key' },
			toolIds: ['readFile'],
		}
		await useCase.execute(agent)
		expect(saveSpy).toHaveBeenCalledWith(agent)
	})

	it('propagates errors from repository', async () => {
		vi.spyOn(mockRepository, 'save').mockRejectedValue(
			new Error('Storage error'),
		)
		const agent = {
			id: 'agent-1',
			name: 'Test Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			providerConfiguration: { apiKey: 'key' },
			toolIds: [],
		}
		await expect(useCase.execute(agent)).rejects.toThrow('Storage error')
	})
})
