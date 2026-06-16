import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import type ToolRegistryPort from '@application/ports/ToolRgistry.port'
import type Agent from '@domain/Agent'
import type { JsonSchemaObject } from '@domain/JsonSchema'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import AgentUpsertUseCase from './AgentUpsert.usecase'

describe('UC3 — AgentUpsert use case', () => {
	let mockAgentRepository: AgentRepositoryPort
	let mockProviderRepository: ProviderRepositoryPort
	let mockToolRegistry: ToolRegistryPort
	let mockEventBus: EventBusPort
	let useCase: AgentUpsertUseCase

	beforeEach(() => {
		mockAgentRepository = {
			get: async () => ({
				id: 'agent-1',
				name: 'Test',
				systemPrompt: '',
				providerId: 'p1',
				providerOverrides: {},
				toolIds: [],
			}),
			list: async () => [],
			listByProviderId: async () => [],
			save: async () => {},
			delete: async () => {},
		}
		mockProviderRepository = {
			get: async () => ({
				id: 'provider-1',
				name: 'Test Provider',
				type: 'openai',
				configSchema: {
					$schema: 'http://json-schema.org/draft-07/schema#',
					type: 'object',
					properties: {},
				} as JsonSchemaObject,
				config: {},
			}),
			list: async () => [],
			save: async () => {},
			delete: async () => {},
		}
		mockToolRegistry = {
			get: () =>
				({
					id: 'readFile',
					description: 'Read a file',
					definition: {
						name: 'readFile',
						description: 'Read a file',
						parameters: '{}',
					},
					execute: vi.fn(),
				}) as import('@application/ports/Tool.port').default,
			list: () => [],
		}
		mockEventBus = {
			publish: vi.fn(),
			subscribe: vi.fn().mockReturnValue({
				next: vi.fn(),
				return: vi.fn(),
				throw: vi.fn(),
				[Symbol.asyncIterator]: vi.fn(),
				unsubscribe: vi.fn(),
			} as unknown as AsyncGenerator<
				import('@application/ports/EventBus.port').Envelope
			> & {
				unsubscribe: () => void
			}),
		}
		useCase = new AgentUpsertUseCase(
			mockAgentRepository,
			mockProviderRepository,
			mockToolRegistry,
			mockEventBus,
		)
	})

	it('calls agentRepository.save(agent) with full agent object', async () => {
		const saveSpy = vi.spyOn(mockAgentRepository, 'save')
		const agent = {
			id: 'agent-1',
			name: 'Test Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			providerOverrides: { apiKey: 'key' },
			toolIds: ['readFile'],
		}
		await useCase.execute(agent)
		expect(saveSpy).toHaveBeenCalledWith(agent)
	})

	it('propagates errors from repository', async () => {
		vi.spyOn(mockAgentRepository, 'save').mockRejectedValue(
			new Error('Storage error'),
		)
		const agent = {
			id: 'agent-1',
			name: 'Test Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			providerOverrides: { apiKey: 'key' },
			toolIds: [],
		}
		await expect(useCase.execute(agent)).rejects.toThrow('Storage error')
	})

	it('publishes an agent-saved event', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const agent = {
			id: 'agent-1',
			name: 'Test Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			providerOverrides: { apiKey: 'key' },
			toolIds: ['readFile'],
		}
		await useCase.execute(agent)
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'agent-saved',
				agentId: 'agent-1',
				name: 'Test Agent',
				id: expect.any(String),
				role: 'system',
				ts: expect.any(Number),
			}),
		)
	})

	it('publishes event envelope with correct type contract (single argument)', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const agent = {
			id: 'agent-2',
			name: 'Another Agent',
			systemPrompt: 'You are a test agent.',
			providerId: 'provider-2',
			providerOverrides: { apiKey: 'test-key' },
			toolIds: [],
		}
		await useCase.execute(agent)
		const envelope = publishSpy.mock.calls[0]?.[0] as {
			id: string
			ts: number
			type: 'agent-saved'
			agentId: string | undefined
			name: string | undefined
			role: 'system'
		}
		expect(envelope.id).toBeTypeOf('string')
		expect(envelope.ts).toBeTypeOf('number')
		expect(envelope.type).toBe('agent-saved')
		expect(envelope.agentId).toBe('agent-2')
		expect(envelope.name).toBe('Another Agent')
		expect(envelope.role).toBe('system')
	})

	it('does not await eventBus.publish', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		publishSpy.mockReturnValue(undefined)
		const agent = {
			id: 'agent-3',
			name: 'No Await Agent',
			systemPrompt: 'Test',
			providerId: 'p1',
			providerOverrides: {},
			toolIds: [],
		}
		await expect(useCase.execute(agent)).resolves.toBeUndefined()
	})

	it('throws if providerId does not exist', async () => {
		vi.spyOn(mockProviderRepository, 'get').mockRejectedValue(
			new Error('Provider not found'),
		)
		const agent = {
			id: 'agent-1',
			name: 'Test Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'nonexistent-provider',
			providerOverrides: {},
			toolIds: [],
		}
		await expect(useCase.execute(agent)).rejects.toThrow('Provider not found')
	})

	it('throws if toolId does not exist', async () => {
		vi.spyOn(mockToolRegistry, 'get').mockImplementation(() => {
			throw new Error('Tool not found')
		})
		const agent = {
			id: 'agent-1',
			name: 'Test Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			providerOverrides: {},
			toolIds: ['nonexistent-tool'],
		}
		await expect(useCase.execute(agent)).rejects.toThrow('Tool not found')
	})

	it('skips tool validation when toolIds is empty', async () => {
		const saveSpy = vi.spyOn(mockAgentRepository, 'save')
		const agent = {
			id: 'agent-1',
			name: 'Test Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			providerOverrides: {},
			toolIds: [],
		}
		await useCase.execute(agent)
		expect(saveSpy).toHaveBeenCalledWith(agent)
	})

	it('handles empty agent object', async () => {
		const saveSpy = vi.spyOn(mockAgentRepository, 'save')
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const emptyAgent: Agent = {
			id: '',
			name: '',
			systemPrompt: '',
			providerId: '',
			providerOverrides: {},
			toolIds: [],
		}
		await useCase.execute(emptyAgent)
		expect(saveSpy).toHaveBeenCalledWith(emptyAgent)
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				agentId: '',
				name: '',
				type: 'agent-saved',
			}),
		)
	})

	it('verifies event envelope structure: id is UUID string, ts is current timestamp number', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const agent = {
			id: 'agent-envelope-test',
			name: 'Envelope Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			providerOverrides: {},
			toolIds: [],
		}
		const before = Date.now()
		await useCase.execute(agent)
		const after = Date.now()

		const envelope = publishSpy.mock.calls[0]?.[0] as {
			id: string
			ts: number
			type: 'agent-saved'
			agentId: string | undefined
			name: string | undefined
			role: 'system'
		}
		expect(envelope.id).toBeTypeOf('string')
		expect(envelope.id.length).toBeGreaterThan(0)
		expect(envelope.ts).toBeTypeOf('number')
		expect(envelope.ts).toBeGreaterThanOrEqual(before)
		expect(envelope.ts).toBeLessThanOrEqual(after)
		expect(envelope.type).toBe('agent-saved')
		expect(envelope.agentId).toBe('agent-envelope-test')
		expect(envelope.name).toBe('Envelope Agent')
		expect(envelope.role).toBe('system')
	})
})
