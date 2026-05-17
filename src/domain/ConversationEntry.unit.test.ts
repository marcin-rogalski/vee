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
		expect(validUserEntry.id).toBe('entry-1')
		expect(validUserEntry.ts).toBe(1000000)
		expect(validUserEntry.role).toBe('user')
		expect(validUserEntry.content).toBe('Hello, world!')
	})

	it('creates valid assistant entry with required id, ts, role, content', () => {
		expect(validAssistantEntry.id).toBe('entry-2')
		expect(validAssistantEntry.role).toBe('assistant')
		expect(validAssistantEntry.content).toBe('Hi there!')
		expect(validAssistantToolCallEntry).toHaveProperty('toolCalls')
	})

	it('creates valid assistant entry with toolCalls', () => {
		expect(validAssistantToolCallEntry.toolCalls).toEqual([
			{ name: 'readFile', arguments: JSON.stringify({ path: '/foo.txt' }) },
		])
	})

	it('creates valid assistant entry without toolCalls', () => {
		expect(validAssistantEntry.toolCalls).toBeUndefined()
	})

	it('creates valid system entry (two-arg form) with required id, ts', () => {
		expect(validSystemEntry.id).toBe('entry-4')
		expect(validSystemEntry.ts).toBe(1000003)
		expect(validSystemEntry.role).toBe('system')
		expect(validSystemEntry.content).toBe('You are a helpful assistant.')
		expect('name' in validSystemEntry).toBe(false)
	})

	it('creates valid system entry with name (three-arg form) with required id, ts', () => {
		expect(validSystemNamedEntry.id).toBe('entry-5')
		expect(validSystemNamedEntry.ts).toBe(1000004)
		expect(validSystemNamedEntry.role).toBe('system')
		expect(validSystemNamedEntry.name).toBe('system')
		expect(validSystemNamedEntry.content).toBe('You are a helpful assistant.')
	})

	it('creates valid developer entry (two-arg form: role: developer, content)', () => {
		expect(validDeveloperEntry.id).toBe('entry-6')
		expect(validDeveloperEntry.ts).toBe(1000005)
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
})
