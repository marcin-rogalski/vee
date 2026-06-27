import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type LoggerPort from '@application/ports/Logger.port'
import type { AgentData } from '@domain/Agent'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import JsonAgentRepository from './JsonAgentRepository'

const noopLogger: LoggerPort = {
	info: () => {},
	warn: () => {},
	error: () => {},
	debug: () => {},
}

describe('JsonAgentRepository', () => {
	let tmpDir: string
	let repo: JsonAgentRepository

	beforeEach(async () => {
		tmpDir = await mkdtemp(join(tmpdir(), 'vee-test-'))
		repo = new JsonAgentRepository(join(tmpDir, 'agents.json'), noopLogger)
	})

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true })
	})

	it('save() stores agent, get() retrieves it', async () => {
		const agent: AgentData = {
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

	it('listByProviderId() filters by providerId', async () => {
		await repo.save({
			id: 'a1',
			name: 'Agent One',
			systemPrompt: '',
			providerId: 'p1',
			providerOverrides: {},
			toolIds: [],
		})
		await repo.save({
			id: 'a2',
			name: 'Agent Two',
			systemPrompt: '',
			providerId: 'p2',
			providerOverrides: {},
			toolIds: [],
		})
		const result = await repo.listByProviderId('p1')
		expect(result).toHaveLength(1)
		const first = result.at(0)
		expect(first?.id).toBe('a1')
	})

	it('save() updates existing agent', async () => {
		await repo.save({
			id: 'a1',
			name: 'Original',
			systemPrompt: '',
			providerId: 'p1',
			providerOverrides: {},
			toolIds: [],
		})
		await repo.save({
			id: 'a1',
			name: 'Updated',
			systemPrompt: 'New prompt',
			providerId: 'p1',
			providerOverrides: {},
			toolIds: [],
		})
		const result = await repo.get('a1')
		expect(result.name).toBe('Updated')
		expect(result.systemPrompt).toBe('New prompt')
	})

	it('persists data across instances', async () => {
		const agent: AgentData = {
			id: 'a1',
			name: 'Persistent',
			systemPrompt: '',
			providerId: 'p1',
			providerOverrides: {},
			toolIds: [],
		}
		await repo.save(agent)

		const repo2 = new JsonAgentRepository(
			join(tmpDir, 'agents.json'),
			noopLogger,
		)
		const retrieved = await repo2.get('a1')
		expect(retrieved.name).toBe('Persistent')
	})
})
