import { describe, expect, it } from 'vitest'
import type SessionDto from './Session.dto'
import type { ChatSessionSummaryDto } from './Session.dto'

describe('DTO — SessionDto', () => {
	it('has required id field', () => {
		const session: SessionDto = {
			id: 'session-123',
			name: 'Test Session',
			agentId: 'agent-1',
			createdAt: 1678867200000,
			updatedAt: 1678867200000,
		}

		expect(session.id).toBe('session-123')
	})

	it('has required name field', () => {
		const session: SessionDto = {
			id: 'session-123',
			name: 'Test Session',
			agentId: 'agent-1',
			createdAt: 1678867200000,
			updatedAt: 1678867200000,
		}

		expect(session.name).toBe('Test Session')
	})

	it('has required createdAt field as timestamp', () => {
		const timestamp = 1678867200000
		const session: SessionDto = {
			id: 'session-123',
			name: 'Test Session',
			agentId: 'agent-1',
			createdAt: timestamp,
			updatedAt: timestamp,
		}

		expect(session.createdAt).toBe(timestamp)
		expect(typeof session.createdAt).toBe('number')
	})

	it('has required updatedAt field as timestamp', () => {
		const timestamp = 1678867200000
		const session: SessionDto = {
			id: 'session-123',
			name: 'Test Session',
			agentId: 'agent-1',
			createdAt: timestamp,
			updatedAt: timestamp,
		}

		expect(session.updatedAt).toBe(timestamp)
		expect(typeof session.updatedAt).toBe('number')
	})

	it('has different createdAt and updatedAt for new session', () => {
		const now = Date.now()
		const session: SessionDto = {
			id: 'session-123',
			name: 'Test Session',
			agentId: 'agent-1',
			createdAt: now,
			updatedAt: now + 1000,
		}

		expect(session.createdAt).toBe(now)
		expect(session.updatedAt).toBe(now + 1000)
		expect(session.updatedAt).toBeGreaterThan(session.createdAt)
	})

	it('has same createdAt and updatedAt for new session', () => {
		const now = Date.now()
		const session: SessionDto = {
			id: 'session-123',
			name: 'Test Session',
			agentId: 'agent-1',
			createdAt: now,
			updatedAt: now,
		}

		expect(session.createdAt).toBe(now)
		expect(session.updatedAt).toBe(now)
	})

	it('is assignable to SessionDto type', () => {
		const session: SessionDto = {
			id: 'session-123',
			name: 'Test Session',
			agentId: 'agent-1',
			createdAt: Date.now(),
			updatedAt: Date.now(),
		}

		expect(session).toBeDefined()
	})
})

describe('DTO — ChatSessionSummaryDto', () => {
	it('has only id, name, and agentId fields', () => {
		const summary: ChatSessionSummaryDto = {
			id: 'session-123',
			name: 'Test Session',
			agentId: 'agent-1',
		}

		expect(summary.id).toBe('session-123')
		expect(summary.name).toBe('Test Session')
		expect(summary.agentId).toBe('agent-1')

		// Verify that other fields are not included
		// @ts-expect-error - createdAt should not exist
		expect(summary.createdAt).toBeUndefined()

		// @ts-expect-error - updatedAt should not exist
		expect(summary.updatedAt).toBeUndefined()
	})

	it('can be created from SessionDto', () => {
		const session: SessionDto = {
			id: 'session-123',
			name: 'Test Session',
			agentId: 'agent-1',
			createdAt: Date.now(),
			updatedAt: Date.now(),
		}

		// Pick only id, name, and agentId
		const summary: ChatSessionSummaryDto = {
			id: session.id,
			name: session.name,
			agentId: session.agentId,
		}

		expect(summary.id).toBe(session.id)
		expect(summary.name).toBe(session.name)
	})

	it('is assignable to ChatSessionSummaryDto type', () => {
		const summary: ChatSessionSummaryDto = {
			id: 'session-123',
			name: 'Test Session',
			agentId: 'agent-1',
		}

		expect(summary).toBeDefined()
	})
})
