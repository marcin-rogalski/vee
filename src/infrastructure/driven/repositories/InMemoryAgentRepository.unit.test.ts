import type Agent from '@domain/Agent'
import { beforeEach, describe, expect, it } from 'vitest'
import InMemoryAgentRepository from './InMemoryAgentRepository'

describe('R3 — InMemoryAgentRepository', () => {
	let repo: InMemoryAgentRepository

	beforeEach(() => {
		repo = new InMemoryAgentRepository()
	})

	it('save() stores agent, get() retrieves it', async () => {
		const agent: Agent = {
			id: 'agent-1',
			name: 'Test Agent',
			systemPrompt: 'Be helpful',
			providerId: 'p1',
			providerOverrides: {},
			toolIds: [],
		}
		await repo.save(agent)
		const retrieved = await repo.get('agent-1')
		expect(retrieved.id).toBe('agent-1')
		expect(retrieved.name).toBe('Test Agent')
	})

	it('get() throws when agent id not found', async () => {
		await expect(repo.get('nonexistent')).rejects.toThrow(
			'Agent with id nonexistent not found',
		)
	})

	it('list() returns projected { id, name, description? } array', async () => {
		await repo.save({
			id: 'a1',
			name: 'Agent One',
			systemPrompt: '',
			providerId: 'p1',
			providerOverrides: {},
			toolIds: [],
			description: 'First',
		})
		await repo.save({
			id: 'a2',
			name: 'Agent Two',
			systemPrompt: '',
			providerId: 'p1',
			providerOverrides: {},
			toolIds: [],
		})
		const result = await repo.list()
		expect(Array.isArray(result)).toBe(true)
		expect(result).toHaveLength(2)
		expect(result).toContainEqual({
			id: 'a1',
			name: 'Agent One',
			description: 'First',
		})
		expect(result).toContainEqual({ id: 'a2', name: 'Agent Two' })
	})

	it('list() omits description when undefined', async () => {
		await repo.save({
			id: 'a1',
			name: 'Agent One',
			systemPrompt: '',
			providerId: 'p1',
			providerOverrides: {},
			toolIds: [],
		})
		const result = await repo.list()
		expect(result[0]).not.toHaveProperty('description')
	})

	it('delete() removes agent from store', async () => {
		await repo.save({
			id: 'a1',
			name: 'Agent One',
			systemPrompt: '',
			providerId: 'p1',
			providerOverrides: {},
			toolIds: [],
		})
		await repo.delete('a1')
		await expect(repo.get('a1')).rejects.toThrow()
	})

	it('list() returns empty array when store is empty', async () => {
		const result = await repo.list()
		expect(result).toEqual([])
	})
})
