import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import type ConfigurationSchema from '@domain/ConfigurationSchema'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProviderUpsertUseCase from './ProviderUpsert.usecase'

describe('UC8 — ProviderUpsert use case', () => {
	let mockRepository: ProviderRepositoryPort
	let useCase: ProviderUpsertUseCase

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
		useCase = new ProviderUpsertUseCase(mockRepository)
	})

	it('calls providerRepository.save(provider) with full provider object', async () => {
		const saveSpy = vi.spyOn(mockRepository, 'save')
		const configSchema: ConfigurationSchema[] = [
			{
				key: 'apiKey',
				required: true,
				type: 'string' as const,
				options: undefined,
				description: 'Key',
			},
		]
		const provider = {
			id: 'p1',
			name: 'OpenAI',
			type: 'openai',
			configSchema,
		}
		await useCase.execute(provider)
		expect(saveSpy).toHaveBeenCalledWith(provider)
	})
})
