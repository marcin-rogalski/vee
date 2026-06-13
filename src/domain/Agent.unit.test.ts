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

describe('D1 — Agent edge cases', () => {
	const baseAgent: Agent = {
		id: 'agent-1',
		name: 'Test Agent',
		systemPrompt: 'You are helpful.',
		providerId: 'provider-1',
		providerConfiguration: { apiKey: 'key' },
		toolIds: ['readFile', 'writeFile'],
	}

	it('accepts Agent with empty toolIds array', () => {
		const agentWithEmptyTools: Agent = {
			...baseAgent,
			toolIds: [],
		}
		expect(agentWithEmptyTools.toolIds).toEqual([])
		expect(Array.isArray(agentWithEmptyTools.toolIds)).toBe(true)
	})

	it('accepts Agent with empty string for id', () => {
		const agentWithEmptyId: Agent = {
			...baseAgent,
			id: '',
		}
		expect(agentWithEmptyId.id).toBe('')
	})

	it('accepts Agent with blank string (whitespace only) for id', () => {
		const agentWithBlankId: Agent = {
			...baseAgent,
			id: '   ',
		}
		expect(agentWithBlankId.id).toBe('   ')
	})

	it('accepts Agent with empty string for name', () => {
		const agentWithEmptyName: Agent = {
			...baseAgent,
			name: '',
		}
		expect(agentWithEmptyName.name).toBe('')
	})

	it('accepts Agent with blank string (whitespace only) for name', () => {
		const agentWithBlankName: Agent = {
			...baseAgent,
			name: '   ',
		}
		expect(agentWithBlankName.name).toBe('   ')
	})

	it('accepts Agent with oversized id string (10000 characters)', () => {
		const oversizedId = 'a'.repeat(10000)
		const agentWithOversizedId: Agent = {
			...baseAgent,
			id: oversizedId,
		}
		expect(agentWithOversizedId.id.length).toBe(10000)
	})

	it('accepts Agent with oversized name string (10000 characters)', () => {
		const oversizedName = 'b'.repeat(10000)
		const agentWithOversizedName: Agent = {
			...baseAgent,
			name: oversizedName,
		}
		expect(agentWithOversizedName.name.length).toBe(10000)
	})

	it('accepts Agent with oversized systemPrompt string (50000 characters)', () => {
		const oversizedPrompt = 'c'.repeat(50000)
		const agentWithOversizedPrompt: Agent = {
			...baseAgent,
			systemPrompt: oversizedPrompt,
		}
		expect(agentWithOversizedPrompt.systemPrompt.length).toBe(50000)
	})

	it('accepts Agent with oversized providerId string (10000 characters)', () => {
		const oversizedProviderId = 'd'.repeat(10000)
		const agentWithOversizedProviderId: Agent = {
			...baseAgent,
			providerId: oversizedProviderId,
		}
		expect(agentWithOversizedProviderId.providerId.length).toBe(10000)
	})

	it('accepts Agent with unexpected extra keys in providerConfiguration', () => {
		const agentWithExtraKeys: Agent = {
			...baseAgent,
			providerConfiguration: {
				apiKey: 'key',
				region: 'us-east-1',
				timeout: 30000,
				retries: 3,
			},
		}
		expect(agentWithExtraKeys.providerConfiguration).toHaveProperty(
			'apiKey',
			'key',
		)
		expect(agentWithExtraKeys.providerConfiguration).toHaveProperty(
			'region',
			'us-east-1',
		)
		expect(agentWithExtraKeys.providerConfiguration).toHaveProperty(
			'timeout',
			30000,
		)
		expect(agentWithExtraKeys.providerConfiguration).toHaveProperty(
			'retries',
			3,
		)
	})

	it('accepts Agent without description key (explicitly omitted)', () => {
		const agentNoDescription: Agent = {
			...baseAgent,
		}
		expect('description' in agentNoDescription).toBe(false)
		expect(agentNoDescription.description).toBeUndefined()
	})

	it('accepts Agent with description explicitly set to undefined', () => {
		const agentDescriptionUndefined: Agent = {
			...baseAgent,
			description: undefined,
		}
		expect(agentDescriptionUndefined.description).toBeUndefined()
	})

	it('accepts Agent with description set to empty string', () => {
		const agentEmptyDescription: Agent = {
			...baseAgent,
			description: '',
		}
		expect(agentEmptyDescription.description).toBe('')
	})

	it('accepts Agent with minimal valid values for all required fields', () => {
		const minimalAgent: Agent = {
			id: 'x',
			name: 'y',
			systemPrompt: 'z',
			providerId: 'p',
			providerConfiguration: {},
			toolIds: [],
		}
		expect(minimalAgent.id).toBe('x')
		expect(minimalAgent.name).toBe('y')
		expect(minimalAgent.systemPrompt).toBe('z')
		expect(minimalAgent.providerId).toBe('p')
		expect(minimalAgent.providerConfiguration).toEqual({})
		expect(minimalAgent.toolIds).toEqual([])
	})
})
