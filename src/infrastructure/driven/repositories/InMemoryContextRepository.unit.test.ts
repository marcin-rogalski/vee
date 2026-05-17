import type ConversationEntry from '@domain/ConversationEntry'
import { beforeEach, describe, expect, it } from 'vitest'
import InMemoryContextRepository from './InMemoryContextRepository'

describe('R4 — InMemoryContextRepository', () => {
	let repo: InMemoryContextRepository

	beforeEach(() => {
		repo = new InMemoryContextRepository()
	})

	it('get() returns empty array for new session', async () => {
		const result = await repo.get('session-1')
		expect(result).toEqual([])
	})

	it('append() adds entries to session context', async () => {
		const entry: ConversationEntry = {
			id: 'e1',
			ts: 1000,
			role: 'user',
			content: 'Hello',
		}
		await repo.append('session-1', entry)
		const result = await repo.get('session-1')
		expect(result).toHaveLength(1)
		expect(result[0]).toEqual(entry)
	})

	it('append() creates new session context if not exists', async () => {
		const entry: ConversationEntry = {
			id: 'e1',
			ts: 1000,
			role: 'user',
			content: 'Hello',
		}
		await repo.append('new-session', entry)
		const result = await repo.get('new-session')
		expect(result).toHaveLength(1)
	})

	it('append() accumulates multiple calls', async () => {
		await repo.append('session-1', {
			id: 'e1',
			ts: 1000,
			role: 'user',
			content: 'Hello',
		})
		await repo.append('session-1', {
			id: 'e2',
			ts: 2000,
			role: 'assistant',
			content: 'Hi',
		})
		const result = await repo.get('session-1')
		expect(result).toHaveLength(2)
		expect(result.at(0)?.id).toBe('e1')
		expect(result.at(1)?.id).toBe('e2')
	})

	it('update() replaces entire context for session', async () => {
		await repo.append('session-1', {
			id: 'e1',
			ts: 1000,
			role: 'user',
			content: 'Hello',
		})
		await repo.update('session-1', [
			{ id: 'e2', ts: 2000, role: 'assistant', content: 'Hi' },
		])
		const result = await repo.get('session-1')
		expect(result).toHaveLength(1)
		expect(result.at(0)?.id).toBe('e2')
	})

	it('delete() removes session context', async () => {
		await repo.append('session-1', {
			id: 'e1',
			ts: 1000,
			role: 'user',
			content: 'Hello',
		})
		await repo.delete('session-1')
		const result = await repo.get('session-1')
		expect(result).toEqual([])
	})

	it('get() returns copy (mutation-safe)', async () => {
		const entry: ConversationEntry = {
			id: 'e1',
			ts: 1000,
			role: 'user',
			content: 'Hello',
		}
		await repo.append('session-1', entry)
		const result1 = await repo.get('session-1')
		result1.push({ id: 'e2', ts: 2000, role: 'assistant', content: 'World' })
		const result2 = await repo.get('session-1')
		expect(result2).toHaveLength(1)
		expect(result2.at(0)?.id).toBe('e1')
	})
})
