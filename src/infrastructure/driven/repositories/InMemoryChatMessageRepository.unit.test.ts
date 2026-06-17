import { describe, expect, it } from 'vitest'
import type { ChatMessage } from '../../../application/ports/ChatMessageRepository.port'
import InMemoryChatMessageRepository from './InMemoryChatMessageRepository'

describe('InMemoryChatMessageRepository', () => {
	it('returns empty array for unknown session', async () => {
		const repo = new InMemoryChatMessageRepository()

		const result = await repo.getBySession('unknown')

		expect(result).toEqual([])
	})

	it('returns messages for a session after creating', async () => {
		const repo = new InMemoryChatMessageRepository()
		const message: ChatMessage = {
			id: 'msg-1',
			sessionId: 'session-1',
			role: 'user',
			content: 'Hello',
			ts: 100,
		}

		await repo.create(message)
		const result = await repo.getBySession('session-1')

		expect(result).toEqual([message])
	})

	it('returns only messages for the requested session', async () => {
		const repo = new InMemoryChatMessageRepository()

		await repo.create({
			id: 'msg-1',
			sessionId: 'session-1',
			role: 'user',
			content: 'Hello',
			ts: 100,
		})
		await repo.create({
			id: 'msg-2',
			sessionId: 'session-2',
			role: 'assistant',
			content: 'Hi there',
			ts: 200,
		})

		const result = await repo.getBySession('session-1')

		expect(result).toHaveLength(1)
		expect(result[0]).toEqual({
			id: 'msg-1',
			sessionId: 'session-1',
			role: 'user',
			content: 'Hello',
			ts: 100,
		})
	})

	it('deletes all messages for a session', async () => {
		const repo = new InMemoryChatMessageRepository()

		await repo.create({
			id: 'msg-1',
			sessionId: 'session-1',
			role: 'user',
			content: 'Hello',
			ts: 100,
		})
		await repo.create({
			id: 'msg-2',
			sessionId: 'session-1',
			role: 'assistant',
			content: 'Hi',
			ts: 200,
		})
		await repo.create({
			id: 'msg-3',
			sessionId: 'session-2',
			role: 'user',
			content: 'World',
			ts: 300,
		})

		await repo.deleteBySession('session-1')

		const result = await repo.getBySession('session-1')
		expect(result).toEqual([])

		const result2 = await repo.getBySession('session-2')
		expect(result2).toHaveLength(1)
		expect(result2[0]).toEqual({
			id: 'msg-3',
			sessionId: 'session-2',
			role: 'user',
			content: 'World',
			ts: 300,
		})
	})

	it('does nothing on delete for unknown session', async () => {
		const repo = new InMemoryChatMessageRepository()

		await repo.create({
			id: 'msg-1',
			sessionId: 'session-1',
			role: 'user',
			content: 'Hello',
			ts: 100,
		})

		await repo.deleteBySession('unknown')

		const result = await repo.getBySession('session-1')
		expect(result).toHaveLength(1)
	})
})
