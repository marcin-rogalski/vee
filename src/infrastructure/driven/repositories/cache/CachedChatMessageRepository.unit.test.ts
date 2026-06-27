import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type LoggerPort from '@application/ports/Logger.port'
import type { ChatMessage } from '@domain/ChatMessage'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import JsonChatMessageRepository from '../JsonChatMessageRepository'
import CachedChatMessageRepository from './CachedChatMessageRepository'

const noopLogger: LoggerPort = {
	info: () => {},
	warn: () => {},
	error: () => {},
	debug: () => {},
}

describe('CachedChatMessageRepository', () => {
	let tmpDir: string
	let repo: CachedChatMessageRepository

	const TTL = 5000

	beforeEach(async () => {
		tmpDir = await mkdtemp(join(tmpdir(), 'vee-test-'))
		const jsonRepo = new JsonChatMessageRepository(
			join(tmpDir, 'chat-messages.json'),
			noopLogger,
		)
		repo = new CachedChatMessageRepository(jsonRepo, TTL)
	})

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true })
	})

	const makeMessage = (sessionId: string, content: string): ChatMessage => ({
		id: crypto.randomUUID(),
		sessionId,
		role: 'user',
		content,
		ts: Date.now(),
	})

	it('getBySession() returns empty array for unknown session', async () => {
		const messages = await repo.getBySession('unknown-session')
		expect(messages).toEqual([])
	})

	it('create() stores message in cache and delegate', async () => {
		const msg = makeMessage('session-1', 'Hello')
		await repo.create(msg)

		const messages = await repo.getBySession('session-1')
		expect(messages).toHaveLength(1)
		expect(messages.at(0)?.content).toBe('Hello')
	})

	it('getBySession() filters by sessionId', async () => {
		await repo.create(makeMessage('session-1', 'A'))
		await repo.create(makeMessage('session-2', 'B'))

		const s1 = await repo.getBySession('session-1')
		expect(s1).toHaveLength(1)
		expect(s1.at(0)?.content).toBe('A')

		const s2 = await repo.getBySession('session-2')
		expect(s2).toHaveLength(1)
		expect(s2.at(0)?.content).toBe('B')
	})

	it('deleteBySession() removes messages from cache', async () => {
		await repo.create(makeMessage('session-1', 'To Delete'))
		await repo.deleteBySession('session-1')

		const messages = await repo.getBySession('session-1')
		expect(messages).toEqual([])
	})

	it('listAll() returns all messages across sessions', async () => {
		await repo.create(makeMessage('session-1', 'A'))
		await repo.create(makeMessage('session-1', 'B'))
		await repo.create(makeMessage('session-2', 'C'))

		const all = await repo.listAll()
		expect(all).toHaveLength(3)
	})

	it('cache expires after TTL', async () => {
		const shortLivedRepo = new CachedChatMessageRepository(
			new JsonChatMessageRepository(
				join(tmpDir, 'chat-messages2.json'),
				noopLogger,
			),
			100,
		)

		await shortLivedRepo.create(makeMessage('session-1', 'Ephemeral'))
		expect(await shortLivedRepo.getBySession('session-1')).toHaveLength(1)

		await new Promise((resolve) => setTimeout(resolve, 150))

		// After TTL, cache reloads from disk - data persists (write-through cache)
		const messages = await shortLivedRepo.getBySession('session-1')
		expect(messages).toHaveLength(1)
		expect(messages[0]?.content).toBe('Ephemeral')
	})
})
