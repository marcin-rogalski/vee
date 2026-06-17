import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import InMemorySessionRepository from './InMemorySessionRepository'

class TestableSessionRepository extends InMemorySessionRepository {
	getSessionsForTest(): Map<
		string,
		{
			session: {
				id: string
				name: string
				agentId: string
				createdAt: number
				updatedAt: number
			}
			expiresAt: number
		}
	> {
		return this.sessions
	}

	runCleanupForTest(): void {
		this.cleanup()
	}
}

describe('R6 — InMemorySessionRepository', () => {
	let repo: InMemorySessionRepository

	beforeEach(() => {
		repo = new TestableSessionRepository()
	})

	afterEach(() => {
		repo.destroy()
	})

	it('create() returns session with generated id, agentId, createdAt, updatedAt', async () => {
		const session = await repo.create('Test Session', 'agent-1')
		expect(session.id).toBeDefined()
		expect(typeof session.id).toBe('string')
		expect(typeof session.createdAt).toBe('number')
		expect(typeof session.updatedAt).toBe('number')
		expect(session.name).toBe('Test Session')
		expect(session.agentId).toBe('agent-1')
	})

	it('get() retrieves session by id', async () => {
		const session = await repo.create('Test Session', 'agent-1')
		const retrieved = await repo.get(session.id)
		expect(retrieved.id).toBe(session.id)
		expect(retrieved.name).toBe('Test Session')
		expect(retrieved.agentId).toBe('agent-1')
	})

	it('get() throws when session not found', async () => {
		await expect(repo.get('nonexistent')).rejects.toThrow(
			'Session with id nonexistent not found',
		)
	})

	it('get() extends TTL on access (sliding expiration)', async () => {
		const session = await repo.create('Test Session', 'agent-1')
		await repo.get(session.id)
		const retrieved = await repo.get(session.id)
		expect(retrieved.id).toBe(session.id)
	})

	it('list() returns only non-expired sessions', async () => {
		const s1 = await repo.create('Session 1', 'agent-1')
		const s2 = await repo.create('Session 2', 'agent-2')
		const result = await repo.list()
		const ids = result.map((s) => s.id)
		expect(ids).toContain(s1.id)
		expect(ids).toContain(s2.id)
	})

	it('list() excludes expired sessions', async () => {
		const session = await repo.create('Test Session', 'agent-1')
		const cachedSessions = (
			repo as TestableSessionRepository
		).getSessionsForTest()
		const cached = cachedSessions.get(session.id)
		if (cached) {
			cached.expiresAt = Date.now() - 1
		}
		const result = await repo.list()
		expect(result).toHaveLength(0)
	})

	it('setName() updates session name and updatedAt', async () => {
		const session = await repo.create('Original Name', 'agent-1')
		await repo.setName(session.id, 'New Name')
		const retrieved = await repo.get(session.id)
		expect(retrieved.name).toBe('New Name')
	})

	it('setName() throws when session not found', async () => {
		await expect(repo.setName('nonexistent', 'Name')).rejects.toThrow(
			'Session with id nonexistent not found',
		)
	})

	it('delete() removes session', async () => {
		const session = await repo.create('Test Session', 'agent-1')
		await repo.delete(session.id)
		await expect(repo.get(session.id)).rejects.toThrow()
	})

	it('destroy() clears cleanup timer', () => {
		const destroySpy = vi.spyOn(repo, 'destroy')
		repo.destroy()
		expect(destroySpy).toHaveBeenCalled()
	})

	it('background cleanup() removes expired sessions', async () => {
		const session = await repo.create('Test Session', 'agent-1')
		const cachedSessions = (
			repo as TestableSessionRepository
		).getSessionsForTest()
		const cached = cachedSessions.get(session.id)
		if (cached) {
			cached.expiresAt = Date.now() - 1
		}
		;(repo as TestableSessionRepository).runCleanupForTest()
		const result = await repo.list()
		expect(result).toHaveLength(0)
	})
})
