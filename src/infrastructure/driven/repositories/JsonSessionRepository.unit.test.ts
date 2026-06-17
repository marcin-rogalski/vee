import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import JsonSessionRepository from './JsonSessionRepository'

describe('JsonSessionRepository', () => {
	let tmpDir: string
	let repo: JsonSessionRepository

	beforeEach(async () => {
		tmpDir = await mkdtemp(join(tmpdir(), 'vee-test-'))
		repo = new JsonSessionRepository(join(tmpDir, 'sessions.json'))
	})

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true })
	})

	it('create() stores session, get() retrieves it', async () => {
		const session = await repo.create('Test Session', 'agent-1')
		expect(session.id).toBeDefined()
		expect(session.name).toBe('Test Session')
		expect(session.agentId).toBe('agent-1')

		const retrieved = await repo.get(session.id)
		expect(retrieved.id).toBe(session.id)
		expect(retrieved.name).toBe('Test Session')
		expect(retrieved.agentId).toBe('agent-1')
	})

	it('get() throws when session id not found', async () => {
		await expect(repo.get('nonexistent')).rejects.toThrow(
			'Session with id nonexistent not found',
		)
	})

	it('list() returns projected { id, name, agentId } array', async () => {
		await repo.create('Session One', 'agent-1')
		await repo.create('Session Two', 'agent-2')
		const result = await repo.list()
		expect(Array.isArray(result)).toBe(true)
		expect(result).toHaveLength(2)
		expect(result[0]).toHaveProperty('id')
		expect(result[0]).toHaveProperty('name')
		expect(result[0]).toHaveProperty('agentId')
	})

	it('create() returns session with timestamps', async () => {
		const session = await repo.create('Test Session', 'agent-1')
		expect(session.createdAt).toBeDefined()
		expect(session.updatedAt).toBeDefined()
		expect(typeof session.createdAt).toBe('number')
		expect(typeof session.updatedAt).toBe('number')
	})

	it('setName() updates session name', async () => {
		const session = await repo.create('Original Name', 'agent-1')
		await repo.setName(session.id, 'Updated Name')

		const retrieved = await repo.get(session.id)
		expect(retrieved.name).toBe('Updated Name')
	})

	it('setName() throws when session not found', async () => {
		await expect(repo.setName('nonexistent', 'New Name')).rejects.toThrow(
			'Session with id nonexistent not found',
		)
	})

	it('delete() removes session', async () => {
		const session = await repo.create('To Delete', 'agent-1')
		await repo.delete(session.id)

		await expect(repo.get(session.id)).rejects.toThrow()
	})

	it('list() returns empty array when no sessions exist', async () => {
		const result = await repo.list()
		expect(result).toEqual([])
	})
})
