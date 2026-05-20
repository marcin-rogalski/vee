import { describe, expect, it } from 'vitest'
import type AgentDto from './Agent.dto'

describe('DTO — AgentDto', () => {
	it('has required id field', () => {
		const agent: AgentDto = {
			id: 'agent-123',
			name: 'Test Agent',
			providerId: 'provider-1',
			providerConfiguration: {},
			toolIds: [],
		}

		expect(agent.id).toBe('agent-123')
	})

	it('has required name field', () => {
		const agent: AgentDto = {
			id: 'agent-123',
			name: 'Test Agent',
			providerId: 'provider-1',
			providerConfiguration: {},
			toolIds: [],
		}

		expect(agent.name).toBe('Test Agent')
	})

	it('has required providerId field', () => {
		const agent: AgentDto = {
			id: 'agent-123',
			name: 'Test Agent',
			providerId: 'provider-1',
			providerConfiguration: {},
			toolIds: [],
		}

		expect(agent.providerId).toBe('provider-1')
	})

	it('has required providerConfiguration field', () => {
		const agent: AgentDto = {
			id: 'agent-123',
			name: 'Test Agent',
			providerId: 'provider-1',
			providerConfiguration: { apiKey: 'secret' },
			toolIds: [],
		}

		expect(agent.providerConfiguration).toEqual({ apiKey: 'secret' })
	})

	it('has required toolIds field', () => {
		const agent: AgentDto = {
			id: 'agent-123',
			name: 'Test Agent',
			providerId: 'provider-1',
			providerConfiguration: {},
			toolIds: ['tool-1', 'tool-2'],
		}

		expect(agent.toolIds).toEqual(['tool-1', 'tool-2'])
	})

	it('has optional description field', () => {
		const agentWithDescription: AgentDto = {
			id: 'agent-123',
			name: 'Test Agent',
			description: 'This is a test agent',
			providerId: 'provider-1',
			providerConfiguration: {},
			toolIds: [],
		}

		expect(agentWithDescription.description).toBe('This is a test agent')

		const agentWithoutDescription: AgentDto = {
			id: 'agent-123',
			name: 'Test Agent',
			providerId: 'provider-1',
			providerConfiguration: {},
			toolIds: [],
		}

		expect(agentWithoutDescription.description).toBeUndefined()
	})

	it('has complex providerConfiguration object', () => {
		const agent: AgentDto = {
			id: 'agent-123',
			name: 'Test Agent',
			providerId: 'provider-1',
			providerConfiguration: {
				apiKey: 'secret',
				endpoint: 'https://api.example.com',
				settings: {
					timeout: 5000,
					retries: 3,
				},
			},
			toolIds: [],
		}

		expect(agent.providerConfiguration).toEqual({
			apiKey: 'secret',
			endpoint: 'https://api.example.com',
			settings: {
				timeout: 5000,
				retries: 3,
			},
		})
	})

	it('supports empty toolIds array', () => {
		const agent: AgentDto = {
			id: 'agent-123',
			name: 'Test Agent',
			providerId: 'provider-1',
			providerConfiguration: {},
			toolIds: [],
		}

		expect(agent.toolIds).toEqual([])
	})

	it('supports multiple tools in toolIds', () => {
		const agent: AgentDto = {
			id: 'agent-123',
			name: 'Test Agent',
			providerId: 'provider-1',
			providerConfiguration: {},
			toolIds: ['tool-1', 'tool-2', 'tool-3', 'tool-4', 'tool-5'],
		}

		expect(agent.toolIds).toHaveLength(5)
	})

	it('is assignable to AgentDto type', () => {
		const agent: AgentDto = {
			id: 'agent-123',
			name: 'Test Agent',
			description: 'Test description',
			providerId: 'provider-1',
			providerConfiguration: { key: 'value' },
			toolIds: ['tool-1'],
		}

		expect(agent).toBeDefined()
	})
})
