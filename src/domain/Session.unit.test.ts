import { describe, expect, it } from 'vitest'
import type Session from './Session'

describe('D3 — Session type shape', () => {
	const validSession: Session = {
		id: 'session-1',
		name: 'Test Session',
		createdAt: 1700000000000,
		updatedAt: 1700000001000,
	}

	it('creates valid Session with id, name, createdAt, updatedAt', () => {
		expect(validSession.id).toBe('session-1')
		expect(validSession.name).toBe('Test Session')
		expect(validSession.createdAt).toBe(1700000000000)
		expect(validSession.updatedAt).toBe(1700000001000)
	})

	it('verifies createdAt and updatedAt are numbers (timestamps)', () => {
		expect(typeof validSession.createdAt).toBe('number')
		expect(typeof validSession.updatedAt).toBe('number')
	})

	it('has all required keys present on valid object', () => {
		const keys = Object.keys(validSession).sort()
		const requiredKeys = ['createdAt', 'id', 'name', 'updatedAt'].sort()
		expect(keys).toEqual(requiredKeys)
	})
})
