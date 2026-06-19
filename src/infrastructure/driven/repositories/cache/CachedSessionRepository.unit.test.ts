import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import JsonSessionRepository from '../JsonSessionRepository'
import CachedSessionRepository from './CachedSessionRepository'

describe('CachedSessionRepository', () => {
	let tmpDir: string
	let jsonRepo: JsonSessionRepository
	let repo: CachedSessionRepository

	const TTL = 5000

	beforeEach(async () => {
		tmpDir = await mkdtemp(join(tmpdir(), 'vee-test-'))
		jsonRepo = new JsonSessionRepository(join(tmpDir, 'sessions.json'))
		repo = new CachedSessionRepository(jsonRepo, TTL)
	})

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true })
	})

	it('create() stores in both cache and delegate', async () => {
		const session = await repo.create('Test Session', 'agent-1')
		expect(session.id).toBeDefined()

		const retrieved = await repo.get(session.id)
		expect(retrieved.name).toBe('Test Session')

		const delegated = await jsonRepo.get(session.id)
		expect(delegated.name).toBe('Test Session')
	})

	it('list() returns cached results', async () => {
		await repo.create('Session One', 'agent-1')
		await repo.create('Session Two', 'agent-2')

		const list = await repo.list()
		expect(list).toHaveLength(2)
		expect(list.map((s) => s.name)).toEqual(['Session One', 'Session Two'])
	})

	it('setName() updates cache and delegates', async () => {
		const session = await repo.create('Original', 'agent-1')

		await repo.setName(session.id, 'Updated')

		const cached = await repo.get(session.id)
		expect(cached.name).toBe('Updated')

		const delegated = await jsonRepo.get(session.id)
		expect(delegated.name).toBe('Updated')
	})

	it('delete() removes from cache and delegate', async () => {
		const session = await repo.create('To Delete', 'agent-1')

		await repo.delete(session.id)

		const list = await repo.list()
		expect(list).toHaveLength(0)

		const delegatedList = await jsonRepo.list()
		expect(delegatedList).toHaveLength(0)
	})

	it('listByAgentId() returns only sessions for matching agent', async () => {
		await repo.create('Agent 1 Session', 'agent-1')
		await repo.create('Agent 2 Session', 'agent-2')
		await repo.create('Agent 1 Another', 'agent-1')

		const agent1Sessions = await repo.listByAgentId('agent-1')
		expect(agent1Sessions).toHaveLength(2)
		expect(agent1Sessions.map((s) => s.name)).toEqual([
			'Agent 1 Session',
			'Agent 1 Another',
		])

		const agent2Sessions = await repo.listByAgentId('agent-2')
		expect(agent2Sessions).toHaveLength(1)

		const agent3Sessions = await repo.listByAgentId('agent-3')
		expect(agent3Sessions).toHaveLength(0)
	})

	it('cache expires after TTL', async () => {
		const shortLivedRepo = new CachedSessionRepository(jsonRepo, 100)

		const session = await shortLivedRepo.create('Ephemeral', 'agent-1')
		expect(await shortLivedRepo.get(session.id)).toBeDefined()

		await new Promise((resolve) => setTimeout(resolve, 150))

		const list = await shortLivedRepo.list()
		expect(list).toHaveLength(1)
	})
})
