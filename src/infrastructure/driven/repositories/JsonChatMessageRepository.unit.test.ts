import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type LoggerPort from '@application/ports/Logger.port'
import type { ChatMessage } from '@domain/ChatMessage'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import JsonChatMessageRepository from './JsonChatMessageRepository'

const noopLogger: LoggerPort = {
	info: () => {},
	warn: () => {},
	error: () => {},
	debug: () => {},
}

describe('JsonChatMessageRepository', () => {
	let tmpDir: string
	let repo: JsonChatMessageRepository

	beforeEach(async () => {
		tmpDir = await mkdtemp(join(tmpdir(), 'vee-test-'))
		repo = new JsonChatMessageRepository(
			join(tmpDir, 'chat-messages.json'),
			noopLogger,
		)
	})

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true })
	})

	it('getBySession() returns empty array when no messages exist', async () => {
		const result = await repo.getBySession('session-1')
		expect(result).toEqual([])
	})

	it('create() stores message, getBySession() retrieves it', async () => {
		const message: ChatMessage = {
			id: 'msg-1',
			sessionId: 'session-1',
			role: 'user',
			content: 'Hello',
			ts: Date.now(),
		}
		await repo.create(message)

		const result = await repo.getBySession('session-1')
		expect(result).toHaveLength(1)
		expect(result.at(0)?.content).toBe('Hello')
	})

	it('getBySession() filters by sessionId', async () => {
		const msg1: ChatMessage = {
			id: 'msg-1',
			sessionId: 'session-1',
			role: 'user',
			content: 'Hello session 1',
			ts: Date.now(),
		}
		const msg2: ChatMessage = {
			id: 'msg-2',
			sessionId: 'session-2',
			role: 'user',
			content: 'Hello session 2',
			ts: Date.now(),
		}
		await repo.create(msg1)
		await repo.create(msg2)

		const result1 = await repo.getBySession('session-1')
		expect(result1).toHaveLength(1)
		expect(result1.at(0)?.content).toBe('Hello session 1')

		const result2 = await repo.getBySession('session-2')
		expect(result2).toHaveLength(1)
		expect(result2.at(0)?.content).toBe('Hello session 2')
	})

	it('deleteBySession() removes only messages for that session', async () => {
		const msg1: ChatMessage = {
			id: 'msg-1',
			sessionId: 'session-1',
			role: 'user',
			content: 'Hello session 1',
			ts: Date.now(),
		}
		const msg2: ChatMessage = {
			id: 'msg-2',
			sessionId: 'session-2',
			role: 'user',
			content: 'Hello session 2',
			ts: Date.now(),
		}
		await repo.create(msg1)
		await repo.create(msg2)
		await repo.deleteBySession('session-1')

		const result1 = await repo.getBySession('session-1')
		expect(result1).toEqual([])

		const result2 = await repo.getBySession('session-2')
		expect(result2).toHaveLength(1)
	})

	it('get() returns message by id', async () => {
		const message: ChatMessage = {
			id: 'msg-1',
			sessionId: 'session-1',
			role: 'user',
			content: 'Hello',
			ts: Date.now(),
		}
		await repo.create(message)

		const result = await repo.get('msg-1')
		expect(result.id).toBe('msg-1')
		expect(result.content).toBe('Hello')
	})

	it('get() throws NotFoundError for unknown id', async () => {
		await expect(repo.get('nonexistent')).rejects.toThrow()
	})

	it('delete() removes message by id', async () => {
		const message: ChatMessage = {
			id: 'msg-1',
			sessionId: 'session-1',
			role: 'user',
			content: 'Hello',
			ts: Date.now(),
		}
		await repo.create(message)
		await repo.delete('msg-1')

		await expect(repo.get('msg-1')).rejects.toThrow()
	})
})
