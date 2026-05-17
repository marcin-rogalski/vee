import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProviderDeleteUseCase from './ProviderDelete.usecase'

describe('UC9 — ProviderDelete use case', () => {
	let mockRepository: ProviderRepositoryPort
	let useCase: ProviderDeleteUseCase

	beforeEach(() => {
		mockRepository = {
			get: async () => ({
				id: 'p1',
				name: 'OpenAI',
				type: 'openai',
				configSchema: [],
			}),
			list: async () => [],
			save: async () => {},
			delete: async () => {},
		}
		useCase = new ProviderDeleteUseCase(mockRepository)
	})

	it('calls providerRepository.delete(id) with correct id', async () => {
		const deleteSpy = vi.spyOn(mockRepository, 'delete')
		await useCase.execute('p1')
		expect(deleteSpy).toHaveBeenCalledWith('p1')
	})
})
