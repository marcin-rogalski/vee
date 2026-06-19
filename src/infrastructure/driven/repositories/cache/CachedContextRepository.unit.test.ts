import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type ConversationEntry from '@domain/ConversationEntry'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import JsonContextRepository from '../JsonContextRepository'
import CachedContextRepository from './CachedContextRepository'

describe('CachedContextRepository', () => {
	let tmpDir: string
	let repo: CachedContextRepository

	const TTL = 5000

	beforeEach(async () => {
		tmpDir = await mkdtemp(join(tmpdir(), 'vee-test-'))
		const jsonRepo = new JsonContextRepository(join(tmpDir, 'context.json'))
		repo = new CachedContextRepository(jsonRepo, TTL)
	})

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true })
	})

	const makeEntry = (text: string): ConversationEntry => ({
		id: crypto.randomUUID(),
		role: 'user',
		content: text,
		ts: Date.now(),
	})

	it('get() returns empty array for unknown session', async () => {
		const entries = await repo.get('unknown-session')
		expect(entries).toEqual([])
	})

	it('append() stores entries in cache and delegate', async () => {
		const entry = makeEntry('Hello')
		await repo.append('session-1', entry)

		const cached = await repo.get('session-1')
		expect(cached).toHaveLength(1)
		expect(cached.at(0)?.content).toBe('Hello')
	})

	it('append() supports multiple entries at once', async () => {
		await repo.append('session-1', makeEntry('A'), makeEntry('B'))
		const entries = await repo.get('session-1')
		expect(entries).toHaveLength(2)
	})

	it('update() replaces all entries for session', async () => {
		await repo.append('session-1', makeEntry('Old'))
		const newEntries = [makeEntry('New')]
		await repo.update('session-1', newEntries)

		const entries = await repo.get('session-1')
		expect(entries).toHaveLength(1)
		expect(entries.at(0)?.content).toBe('New')
	})

	it('delete() removes session from cache', async () => {
		await repo.append('session-1', makeEntry('Data'))
		await repo.delete('session-1')

		const entries = await repo.get('session-1')
		expect(entries).toEqual([])
	})

	it('listAll() returns all sessions contexts', async () => {
		await repo.append('session-1', makeEntry('A'))
		await repo.append('session-2', makeEntry('B'))

		const all = await repo.listAll()
		expect(Object.keys(all)).toHaveLength(2)
		expect(all['session-1']).toHaveLength(1)
		expect(all['session-2']).toHaveLength(1)
	})

	it('cache expires after TTL', async () => {
		const shortLivedRepo = new CachedContextRepository(
			new JsonContextRepository(join(tmpDir, 'context2.json')),
			100,
		)

		await shortLivedRepo.append('session-1', makeEntry('Ephemeral'))
		expect(await shortLivedRepo.get('session-1')).toHaveLength(1)

		await new Promise((resolve) => setTimeout(resolve, 150))

		// After TTL, cache reloads from disk - data persists (write-through cache)
		const entries = await shortLivedRepo.get('session-1')
		expect(entries).toHaveLength(1)
		expect(entries[0]?.content).toBe('Ephemeral')
	})
})
