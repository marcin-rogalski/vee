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
				configSchema: {
					$schema: 'http://json-schema.org/draft-07/schema#',
					type: 'object',
					properties: {},
				},
				config: {},
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

	it('returns empty array when no providers exist', async () => {
		vi.spyOn(mockRepository, 'list').mockResolvedValue([])
		const result = await useCase.execute()
		expect(Array.isArray(result)).toBe(true)
		expect(result).toHaveLength(0)
	})

	it('propagates errors from repository.list()', async () => {
		const errorMessage = 'database connection failed'
		vi.spyOn(mockRepository, 'list').mockRejectedValue(new Error(errorMessage))
		await expect(useCase.execute()).rejects.toThrow(errorMessage)
	})

	it('handles large lists (500 providers)', async () => {
		const largeList = Array.from({ length: 500 }, (_, i) => ({
			id: `provider-${i}`,
			name: `Provider ${i}`,
		}))
		vi.spyOn(mockRepository, 'list').mockResolvedValue(largeList)
		const result = await useCase.execute()
		expect(Array.isArray(result)).toBe(true)
		expect(result).toHaveLength(500)
		expect(result[0]).toEqual({ id: 'provider-0', name: 'Provider 0' })
		expect(result[499]).toEqual({ id: 'provider-499', name: 'Provider 499' })
	})

	it('handles partial projections correctly', async () => {
		vi.spyOn(mockRepository, 'list').mockResolvedValue([
			{ id: 'p1', name: 'OpenAI' },
			{ id: 'p2', name: 'Anthropic' },
		])
		const result = await useCase.execute()
		expect(result).toHaveLength(2)
		expect(result[0]).toEqual({ id: 'p1', name: 'OpenAI' })
		expect(result[1]).toEqual({ id: 'p2', name: 'Anthropic' })
	})
})
