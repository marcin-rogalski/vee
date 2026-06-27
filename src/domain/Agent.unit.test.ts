import { describe, expect, it } from 'vitest'
import Agent, { type AgentData } from './Agent'
import { ValidationError } from './errors'

describe('Agent — constructor', () => {
	it('creates agent with required fields', () => {
		const agent = new Agent({
			name: 'Test Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
		})

		expect(agent.id).toBeDefined()
		expect(agent.name).toBe('Test Agent')
		expect(agent.systemPrompt).toBe('You are helpful.')
		expect(agent.providerId).toBe('provider-1')
		expect(agent.providerOverrides).toEqual({})
		expect(agent.toolIds).toEqual([])
		expect(agent.description).toBeUndefined()
	})

	it('accepts all optional fields', () => {
		const agent = new Agent({
			id: 'agent-1',
			name: 'Test Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			description: 'A test agent',
			providerOverrides: { apiKey: 'key' },
			toolIds: ['readFile', 'writeFile'],
		})

		expect(agent.id).toBe('agent-1')
		expect(agent.description).toBe('A test agent')
		expect(agent.providerOverrides).toEqual({ apiKey: 'key' })
		expect(agent.toolIds).toEqual(['readFile', 'writeFile'])
	})

	it('generates random ID when not provided', () => {
		const agent1 = new Agent({
			name: 'A',
			systemPrompt: 'P',
			providerId: 'P1',
		})
		const agent2 = new Agent({
			name: 'B',
			systemPrompt: 'P',
			providerId: 'P1',
		})

		expect(agent1.id).not.toBe(agent2.id)
	})
})

describe('Agent — Zod validation', () => {
	it('throws ValidationError for empty name', () => {
		expect(
			() => new Agent({ name: '', systemPrompt: 'P', providerId: 'P1' }),
		).toThrow(ValidationError)
	})

	it('throws ValidationError for whitespace-only name', () => {
		expect(
			() => new Agent({ name: '   ', systemPrompt: 'P', providerId: 'P1' }),
		).toThrow(ValidationError)
	})

	it('throws ValidationError for empty systemPrompt', () => {
		expect(
			() => new Agent({ name: 'A', systemPrompt: '', providerId: 'P1' }),
		).toThrow(ValidationError)
	})

	it('throws ValidationError for empty providerId', () => {
		expect(
			() => new Agent({ name: 'A', systemPrompt: 'P', providerId: '' }),
		).toThrow(ValidationError)
	})

	it('throws ValidationError for whitespace-only providerId', () => {
		expect(
			() => new Agent({ name: 'A', systemPrompt: 'P', providerId: '  ' }),
		).toThrow(ValidationError)
	})

	it('trims name and providerId', () => {
		const agent = new Agent({
			name: '  Test Agent  ',
			systemPrompt: 'P',
			providerId: '  P1  ',
		})

		expect(agent.name).toBe('Test Agent')
		expect(agent.providerId).toBe('P1')
	})
})

describe('Agent — behavior methods', () => {
	const createAgent = () =>
		new Agent({
			name: 'Test Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
		})

	it('rename changes the name', () => {
		const agent = createAgent()
		agent.rename('New Name')
		expect(agent.name).toBe('New Name')
	})

	it('rename trims whitespace', () => {
		const agent = createAgent()
		agent.rename('  New Name  ')
		expect(agent.name).toBe('New Name')
	})

	it('rename throws for empty name', () => {
		const agent = createAgent()
		expect(() => agent.rename('')).toThrow(ValidationError)
	})

	it('rename throws for whitespace-only name', () => {
		const agent = createAgent()
		expect(() => agent.rename('   ')).toThrow(ValidationError)
	})

	it('setDescription sets the description', () => {
		const agent = createAgent()
		agent.setDescription('A description')
		expect(agent.description).toBe('A description')
	})

	it('setDescription to undefined clears it', () => {
		const agent = createAgent()
		agent.setDescription('A description')
		agent.setDescription(undefined)
		expect(agent.description).toBeUndefined()
	})

	it('setSystemPrompt changes the prompt', () => {
		const agent = createAgent()
		agent.setSystemPrompt('New prompt')
		expect(agent.systemPrompt).toBe('New prompt')
	})

	it('addTool adds a tool ID', () => {
		const agent = createAgent()
		agent.addTool('readFile')
		expect(agent.toolIds).toEqual(['readFile'])
	})

	it('addTool does not duplicate', () => {
		const agent = createAgent()
		agent.addTool('readFile')
		agent.addTool('readFile')
		expect(agent.toolIds).toEqual(['readFile'])
	})

	it('removeTool removes a tool ID', () => {
		const agent = createAgent()
		agent.addTool('readFile')
		agent.addTool('writeFile')
		agent.removeTool('readFile')
		expect(agent.toolIds).toEqual(['writeFile'])
	})

	it('setProviderOverrides replaces overrides', () => {
		const agent = createAgent()
		agent.setProviderOverrides({ model: 'gpt-4', timeout: 30000 })
		expect(agent.providerOverrides).toEqual({
			model: 'gpt-4',
			timeout: 30000,
		})
	})
})

describe('Agent — toData', () => {
	it('returns AgentData with all fields', () => {
		const agent = new Agent({
			id: 'agent-1',
			name: 'Test Agent',
			description: 'A test agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			providerOverrides: { apiKey: 'key' },
			toolIds: ['readFile'],
		})

		const data: AgentData = agent.toData()

		expect(data.id).toBe('agent-1')
		expect(data.name).toBe('Test Agent')
		expect(data.description).toBe('A test agent')
		expect(data.systemPrompt).toBe('You are helpful.')
		expect(data.providerId).toBe('provider-1')
		expect(data.providerOverrides).toEqual({ apiKey: 'key' })
		expect(data.toolIds).toEqual(['readFile'])
	})

	it('omits description when undefined', () => {
		const agent = new Agent({
			name: 'Test Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
		})

		const data = agent.toData()

		expect('description' in data).toBe(false)
	})
})

describe('Agent — readonly properties', () => {
	it('id is readonly at compile time', () => {
		const agent = new Agent({
			name: 'A',
			systemPrompt: 'P',
			providerId: 'P1',
		})

		// @ts-expect-error - id is readonly
		agent.id = 'new-id'
	})

	it('providerId is readonly at compile time', () => {
		const agent = new Agent({
			name: 'A',
			systemPrompt: 'P',
			providerId: 'P1',
		})

		// @ts-expect-error - providerId is readonly
		agent.providerId = 'new-provider'
	})
})
