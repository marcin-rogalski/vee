import { describe, expect, it } from 'vitest'
import type ConversationEntry from './ConversationEntry'

describe('D4 — ConversationEntry discriminated union', () => {
	// Valid user entry
	const validUserEntry: ConversationEntry = {
		id: 'entry-1',
		ts: 1000000,
		role: 'user',
		content: 'Hello, world!',
	}

	// Valid assistant entry (without toolCalls)
	const validAssistantEntry: ConversationEntry = {
		id: 'entry-2',
		ts: 1000001,
		role: 'assistant',
		content: 'Hi there!',
	}

	// Valid assistant entry with toolCalls
	const validAssistantToolCallEntry: ConversationEntry = {
		id: 'entry-3',
		ts: 1000002,
		role: 'assistant',
		content: 'Let me check that.',
		toolCalls: [
			{ name: 'readFile', arguments: JSON.stringify({ path: '/foo.txt' }) },
		],
	}

	// Valid system entry (two-arg form: role + content)
	const validSystemEntry: ConversationEntry = {
		id: 'entry-4',
		ts: 1000003,
		role: 'system',
		content: 'You are a helpful assistant.',
	}

	// Valid system entry with name (three-arg form)
	const validSystemNamedEntry: ConversationEntry = {
		id: 'entry-5',
		ts: 1000004,
		role: 'system',
		name: 'system',
		content: 'You are a helpful assistant.',
	}

	// Valid developer entry (two-arg form)
	const validDeveloperEntry: ConversationEntry = {
		id: 'entry-6',
		ts: 1000005,
		role: 'developer',
		content: 'Do not mention you are an AI.',
	}

	it('creates valid user entry with required id, ts, role, content', () => {
		expect(validUserEntry.role).toBe('user')
		expect(validUserEntry.content).toBe('Hello, world!')
	})

	it('creates valid assistant entry without toolCalls', () => {
		expect(validAssistantEntry.role).toBe('assistant')
		expect(validAssistantEntry.content).toBe('Hi there!')
		expect(validAssistantEntry.toolCalls).toBeUndefined()
	})

	it('creates valid assistant entry with toolCalls', () => {
		expect(validAssistantToolCallEntry.role).toBe('assistant')
		expect(validAssistantToolCallEntry.content).toBe('Let me check that.')
		expect(validAssistantToolCallEntry.toolCalls).toEqual([
			{ name: 'readFile', arguments: JSON.stringify({ path: '/foo.txt' }) },
		])
	})

	it('creates valid system entry (two-arg form) with required id, ts', () => {
		expect(validSystemEntry.role).toBe('system')
		expect(validSystemEntry.content).toBe('You are a helpful assistant.')
		expect('name' in validSystemEntry).toBe(false)
	})

	it('creates valid system entry with name (three-arg form) with required id, ts', () => {
		expect(validSystemNamedEntry.role).toBe('system')
		expect(validSystemNamedEntry.name).toBe('system')
		expect(validSystemNamedEntry.content).toBe('You are a helpful assistant.')
	})

	it('creates valid developer entry (two-arg form: role: developer, content)', () => {
		expect(validDeveloperEntry.role).toBe('developer')
		expect(validDeveloperEntry.content).toBe('Do not mention you are an AI.')
	})

	it('has valid role values across all entries', () => {
		const roles = [
			validUserEntry.role,
			validAssistantEntry.role,
			validSystemEntry.role,
			validSystemNamedEntry.role,
			validDeveloperEntry.role,
		]
		const validRoles = ['user', 'assistant', 'system', 'developer']
		for (const role of roles) {
			expect(validRoles).toContain(role)
		}
	})

	it('has all entries with id and ts', () => {
		const entries: Array<ConversationEntry> = [
			validUserEntry,
			validAssistantEntry,
			validAssistantToolCallEntry,
			validSystemEntry,
			validSystemNamedEntry,
			validDeveloperEntry,
		]
		for (const entry of entries) {
			expect(typeof entry.id).toBe('string')
			expect(typeof entry.ts).toBe('number')
			expect(entry.id.length).toBeGreaterThan(0)
		}
	})

	describe('edge cases for id and ts boundaries', () => {
		it('accepts empty string id (TypeScript allows it)', () => {
			const emptyIdEntry: ConversationEntry = {
				id: '',
				ts: 0,
				role: 'user',
				content: 'test',
			}
			expect(emptyIdEntry.id).toBe('')
			expect(emptyIdEntry.ts).toBe(0)
			expect(emptyIdEntry.role).toBe('user')
			expect(emptyIdEntry.content).toBe('test')
		})

		it('accepts zero timestamp (TypeScript allows it)', () => {
			const zeroTsEntry: ConversationEntry = {
				id: 'zero-ts',
				ts: 0,
				role: 'user',
				content: 'test',
			}
			expect(zeroTsEntry.id).toBe('zero-ts')
			expect(zeroTsEntry.ts).toBe(0)
		})

		it('accepts negative timestamp (TypeScript allows it)', () => {
			const negativeTsEntry: ConversationEntry = {
				id: 'negative-ts',
				ts: -1,
				role: 'user',
				content: 'test',
			}
			expect(negativeTsEntry.id).toBe('negative-ts')
			expect(negativeTsEntry.ts).toBe(-1)
		})

		it('accepts very large timestamp (TypeScript allows it)', () => {
			const largeTsEntry: ConversationEntry = {
				id: 'large-ts',
				ts: Number.MAX_SAFE_INTEGER,
				role: 'user',
				content: 'test',
			}
			expect(largeTsEntry.id).toBe('large-ts')
			expect(largeTsEntry.ts).toBe(Number.MAX_SAFE_INTEGER)
		})
	})
})
