import type Provider from '@domain/Provider'
import { beforeEach, describe, expect, it } from 'vitest'
import InMemoryProviderRepository from './InMemoryProviderRepository'

describe('R5 — InMemoryProviderRepository', () => {
	let repo: InMemoryProviderRepository

	beforeEach(() => {
		repo = new InMemoryProviderRepository()
	})

	it('save() stores provider, get() retrieves it', async () => {
		const provider: Provider = {
			id: 'p1',
			name: 'OpenAI',
			type: 'openai',
			configSchema: [],
		}
		await repo.save(provider)
		const retrieved = await repo.get('p1')
		expect(retrieved.id).toBe('p1')
		expect(retrieved.name).toBe('OpenAI')
	})

	it('get() throws when provider id not found', async () => {
		await expect(repo.get('nonexistent')).rejects.toThrow(
			'Provider with id nonexistent not found',
		)
	})

	it('list() returns projected { id, name } array', async () => {
		await repo.save({
			id: 'p1',
			name: 'OpenAI',
			type: 'openai',
			configSchema: [],
		})
		await repo.save({
			id: 'p2',
			name: 'Anthropic',
			type: 'anthropic',
			configSchema: [],
		})
		const result = await repo.list()
		expect(Array.isArray(result)).toBe(true)
		expect(result).toHaveLength(2)
		expect(result).toContainEqual({ id: 'p1', name: 'OpenAI' })
		expect(result).toContainEqual({ id: 'p2', name: 'Anthropic' })
	})

	it('delete() removes provider', async () => {
		await repo.save({
			id: 'p1',
			name: 'OpenAI',
			type: 'openai',
			configSchema: [],
		})
		await repo.delete('p1')
		await expect(repo.get('p1')).rejects.toThrow()
	})
})
