import { describe, expect, it } from 'vitest'
import type Agent from './Agent'

describe('D1 — Agent type shape', () => {
	const validAgent: Agent = {
		id: 'agent-1',
		name: 'Test Agent',
		systemPrompt: 'You are helpful.',
		providerId: 'provider-1',
		providerConfiguration: { apiKey: 'key' },
		toolIds: ['readFile', 'writeFile'],
	}

	it('creates valid Agent object with all required fields', () => {
		expect(validAgent.id).toBe('agent-1')
		expect(validAgent.name).toBe('Test Agent')
		expect(validAgent.systemPrompt).toBe('You are helpful.')
		expect(validAgent.providerId).toBe('provider-1')
		expect(validAgent.providerConfiguration).toEqual({ apiKey: 'key' })
		expect(validAgent.toolIds).toEqual(['readFile', 'writeFile'])
	})

	it('accepts optional description field', () => {
		const agentWithDescription: Agent = {
			...validAgent,
			description: 'A test agent',
		}
		expect(agentWithDescription.description).toBe('A test agent')
	})

	it('accepts Agent without description (undefined)', () => {
		const agentWithoutDescription: Agent = validAgent
		expect(agentWithoutDescription.description).toBeUndefined()
	})

	it('has all required keys present on valid object', () => {
		const keys = Object.keys(validAgent).sort()
		const requiredKeys = [
			'id',
			'name',
			'systemPrompt',
			'providerId',
			'providerConfiguration',
			'toolIds',
		].sort()
		expect(keys).toEqual(requiredKeys)
	})

	it('has description key absent when not provided', () => {
		expect(Object.hasOwn(validAgent, 'description')).toBe(false)
	})
})
