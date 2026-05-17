import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProviderListUseCase from './ProviderList.usecase'

describe('UC7 — ProviderList use case', () => {
	let mockRepository: ProviderRepositoryPort
	let useCase: ProviderListUseCase

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
		useCase = new ProviderListUseCase(mockRepository)
	})

	it('returns array of { id, name } objects', async () => {
		vi.spyOn(mockRepository, 'list').mockResolvedValue([
			{ id: 'p1', name: 'OpenAI' },
			{ id: 'p2', name: 'Anthropic' },
		])
		const result = await useCase.execute()
		expect(Array.isArray(result)).toBe(true)
		expect(result).toHaveLength(2)
		expect(result[0]).toEqual({ id: 'p1', name: 'OpenAI' })
		expect(result[1]).toEqual({ id: 'p2', name: 'Anthropic' })
	})
})
