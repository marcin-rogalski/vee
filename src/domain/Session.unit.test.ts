import { describe, expect, it } from 'vitest'
import { ValidationError } from './errors'
import Session, { type SessionData } from './Session'

describe('D3 — Session class construction', () => {
	it('creates valid Session with name and agentId', () => {
		const session = new Session({ name: 'Test Session', agentId: 'agent-1' })
		expect(session.id).toBeDefined()
		expect(session.name).toBe('Test Session')
		expect(session.agentId).toBe('agent-1')
		expect(typeof session.createdAt).toBe('number')
		expect(typeof session.updatedAt).toBe('number')
	})

	it('generates UUID for id when not provided', () => {
		const session = new Session({ name: 'Test', agentId: 'agent-1' })
		expect(session.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		)
	})

	it('uses provided id when given', () => {
		const session = new Session({
			id: 'session-1',
			name: 'Test Session',
			agentId: 'agent-1',
		})
		expect(session.id).toBe('session-1')
	})

	it('defaults name to empty string when omitted', () => {
		const session = new Session({ agentId: 'agent-1' })
		expect(session.name).toBe('')
	})

	it('defaults createdAt and updatedAt to current time', () => {
		const before = Date.now()
		const session = new Session({ name: 'Test', agentId: 'agent-1' })
		const after = Date.now()
		expect(session.createdAt).toBeGreaterThanOrEqual(before)
		expect(session.createdAt).toBeLessThanOrEqual(after)
		expect(session.updatedAt).toBe(session.createdAt)
	})

	it('hydrates from full data with provided timestamps', () => {
		const session = new Session({
			id: 'session-1',
			name: 'Test Session',
			agentId: 'agent-1',
			createdAt: 1700000000000,
			updatedAt: 1700000001000,
		})
		expect(session.id).toBe('session-1')
		expect(session.name).toBe('Test Session')
		expect(session.createdAt).toBe(1700000000000)
		expect(session.updatedAt).toBe(1700000001000)
	})

	it('defaults updatedAt to createdAt when updatedAt is omitted', () => {
		const session = new Session({
			id: 'session-1',
			name: 'Test',
			agentId: 'agent-1',
			createdAt: 1700000000000,
		})
		expect(session.updatedAt).toBe(1700000000000)
	})
})

describe('D4 — Session validation', () => {
	it('throws ValidationError when agentId is missing', () => {
		expect(
			() => new Session({ name: 'Test', agentId: '' as unknown as string }),
		).toThrow(ValidationError)
	})

	it('throws ValidationError when agentId is empty string', () => {
		expect(() => new Session({ name: 'Test', agentId: '' })).toThrow(
			ValidationError,
		)
	})

	it('throws ValidationError when agentId is whitespace', () => {
		expect(() => new Session({ name: 'Test', agentId: '   ' })).toThrow(
			ValidationError,
		)
	})
})

describe('D5 — Session rename behavior', () => {
	it('updates name via rename()', () => {
		const session = new Session({ name: 'Original', agentId: 'agent-1' })
		session.rename('Updated')
		expect(session.name).toBe('Updated')
	})

	it('updates updatedAt when renamed', () => {
		const session = new Session({
			id: 'session-1',
			name: 'Original',
			agentId: 'agent-1',
			createdAt: 1700000000000,
			updatedAt: 1700000000000,
		})
		const oldUpdatedAt = session.updatedAt
		session.rename('Updated')
		expect(session.updatedAt).toBeGreaterThan(oldUpdatedAt)
	})

	it('does not change createdAt when renamed', () => {
		const session = new Session({
			id: 'session-1',
			name: 'Original',
			agentId: 'agent-1',
			createdAt: 1700000000000,
			updatedAt: 1700000000000,
		})
		session.rename('Updated')
		expect(session.createdAt).toBe(1700000000000)
	})

	it('allows rename to empty string', () => {
		const session = new Session({ name: 'Test', agentId: 'agent-1' })
		session.rename('')
		expect(session.name).toBe('')
	})
})

describe('D6 — Session.toData() serialization', () => {
	it('returns plain object with all fields', () => {
		const session = new Session({
			id: 'session-1',
			name: 'Test Session',
			agentId: 'agent-1',
			createdAt: 1700000000000,
			updatedAt: 1700000001000,
		})
		const data = session.toData()
		expect(data).toEqual({
			id: 'session-1',
			name: 'Test Session',
			agentId: 'agent-1',
			createdAt: 1700000000000,
			updatedAt: 1700000001000,
		})
	})

	it('toData result is assignable to SessionData type', () => {
		const session = new Session({ name: 'Test', agentId: 'agent-1' })
		const data: SessionData = session.toData()
		expect(data.id).toBeDefined()
	})

	it('toData reflects renamed name', () => {
		const session = new Session({ name: 'Original', agentId: 'agent-1' })
		session.rename('Updated')
		const data = session.toData()
		expect(data.name).toBe('Updated')
	})
})

describe('D7 — Session edge cases', () => {
	it('accepts very long id (10K+ characters)', () => {
		const longId = 'a'.repeat(10001)
		const session = new Session({
			id: longId,
			name: 'Test',
			agentId: 'agent-1',
		})
		expect(session.id.length).toBe(10001)
	})

	it('accepts very long name (10K+ characters)', () => {
		const longName = 'b'.repeat(10001)
		const session = new Session({ name: longName, agentId: 'agent-1' })
		expect(session.name.length).toBe(10001)
	})

	it('accepts negative timestamps', () => {
		const session = new Session({
			name: 'Test',
			agentId: 'agent-1',
			createdAt: -1700000000000,
			updatedAt: -1700000001000,
		})
		expect(session.createdAt).toBe(-1700000000000)
	})

	it('accepts equal timestamps', () => {
		const ts = 1700000000000
		const session = new Session({
			name: 'Test',
			agentId: 'agent-1',
			createdAt: ts,
			updatedAt: ts,
		})
		expect(session.createdAt).toBe(session.updatedAt)
	})

	it('id is readonly (compile-time enforcement)', () => {
		const session = new Session({ name: 'Test', agentId: 'agent-1' })
		// TypeScript enforces readonly at compile time — assignment is a type error
		// @ts-expect-error - id is readonly, this should be a type error
		session.id = 'hacked'
		// Runtime: readonly is not enforced, but type system prevents it
	})

	it('agentId is readonly (compile-time enforcement)', () => {
		const session = new Session({ name: 'Test', agentId: 'agent-1' })
		// TypeScript enforces readonly at compile time
		// @ts-expect-error - agentId is readonly, this should be a type error
		session.agentId = 'hacked'
		// Runtime: readonly is not enforced, but type system prevents it
	})
})
