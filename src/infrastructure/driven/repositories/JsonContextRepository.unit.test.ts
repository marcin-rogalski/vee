import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type ConversationEntry from '@domain/ConversationEntry'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import JsonContextRepository from './JsonContextRepository'

describe('JsonContextRepository', () => {
	let tmpDir: string
	let repo: JsonContextRepository

	beforeEach(async () => {
		tmpDir = await mkdtemp(join(tmpdir(), 'vee-test-'))
		repo = new JsonContextRepository(join(tmpDir, 'context.json'))
	})

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true })
	})

	it('get() returns empty array when no entries exist', async () => {
		const result = await repo.get('session-1')
		expect(result).toEqual([])
	})

	it('append() stores entries, get() retrieves them', async () => {
		const entry: ConversationEntry = {
			id: 'entry-1',
			ts: Date.now(),
			role: 'user',
			content: 'Hello',
		}
		await repo.append('session-1', entry)

		const result = await repo.get('session-1')
		expect(result).toHaveLength(1)
		expect(result.at(0)?.content).toBe('Hello')
	})

	it('append() adds multiple entries', async () => {
		const entry1: ConversationEntry = {
			id: 'entry-1',
			ts: Date.now(),
			role: 'user',
			content: 'Hello',
		}
		const entry2: ConversationEntry = {
			id: 'entry-2',
			ts: Date.now(),
			role: 'assistant',
			content: 'Hi there',
		}
		await repo.append('session-1', entry1, entry2)

		const result = await repo.get('session-1')
		expect(result).toHaveLength(2)
	})

	it('update() replaces all entries for a session', async () => {
		const entry1: ConversationEntry = {
			id: 'entry-1',
			ts: Date.now(),
			role: 'user',
			content: 'First',
		}
		await repo.append('session-1', entry1)

		const entry2: ConversationEntry = {
			id: 'entry-2',
			ts: Date.now(),
			role: 'user',
			content: 'Replacement',
		}
		await repo.update('session-1', [entry2])

		const result = await repo.get('session-1')
		expect(result).toHaveLength(1)
		expect(result.at(0)?.content).toBe('Replacement')
	})

	it('delete() removes entries for a session', async () => {
		const entry: ConversationEntry = {
			id: 'entry-1',
			ts: Date.now(),
			role: 'user',
			content: 'Hello',
		}
		await repo.append('session-1', entry)
		await repo.delete('session-1')

		const result = await repo.get('session-1')
		expect(result).toEqual([])
	})

	it('get() returns empty array for different session', async () => {
		const entry: ConversationEntry = {
			id: 'entry-1',
			ts: Date.now(),
			role: 'user',
			content: 'Hello',
		}
		await repo.append('session-1', entry)

		const result = await repo.get('session-2')
		expect(result).toEqual([])
	})
})
