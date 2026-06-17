import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ChatMessage } from '@application/ports/ChatMessageRepository.port'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import JsonChatMessageRepository from '../JsonChatMessageRepository'
import CachedChatMessageRepository from './CachedChatMessageRepository'

describe('CachedChatMessageRepository', () => {
	let tmpDir: string
	let repo: CachedChatMessageRepository

	const TTL = 5000

	beforeEach(async () => {
		tmpDir = await mkdtemp(join(tmpdir(), 'vee-test-'))
		const jsonRepo = new JsonChatMessageRepository(
			join(tmpDir, 'chat-messages.json'),
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

	it('cache expires after TTL', async () => {
		const shortLivedRepo = new CachedChatMessageRepository(
			new JsonChatMessageRepository(join(tmpDir, 'chat-messages2.json')),
			100,
		)

		await shortLivedRepo.create(makeMessage('session-1', 'Ephemeral'))
		expect(await shortLivedRepo.getBySession('session-1')).toHaveLength(1)

		await new Promise((resolve) => setTimeout(resolve, 150))

		const messages = await shortLivedRepo.getBySession('session-1')
		expect(messages).toEqual([])
	})
})
