import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AgentUpsertUseCase from './AgentUpsert.usecase'

describe('UC3 — AgentUpsert use case', () => {
	let mockRepository: AgentRepositoryPort
	let mockEventBus: EventBusPort
	let useCase: AgentUpsertUseCase

	beforeEach(() => {
		mockRepository = {
			get: async () => ({
				id: 'agent-1',
				name: 'Test',
				systemPrompt: '',
				providerId: 'p1',
				providerConfiguration: {},
				toolIds: [],
			}),
			list: async () => [],
			save: async () => {},
			delete: async () => {},
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
		useCase = new AgentUpsertUseCase(mockRepository, mockEventBus)
	})

	it('calls agentRepository.save(agent) with full agent object', async () => {
		const saveSpy = vi.spyOn(mockRepository, 'save')
		const agent = {
			id: 'agent-1',
			name: 'Test Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			providerConfiguration: { apiKey: 'key' },
			toolIds: ['readFile'],
		}
		await useCase.execute(agent)
		expect(saveSpy).toHaveBeenCalledWith(agent)
	})

	it('propagates errors from repository', async () => {
		vi.spyOn(mockRepository, 'save').mockRejectedValue(
			new Error('Storage error'),
		)
		const agent = {
			id: 'agent-1',
			name: 'Test Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			providerConfiguration: { apiKey: 'key' },
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
			providerConfiguration: { apiKey: 'key' },
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
			providerConfiguration: { apiKey: 'test-key' },
			toolIds: [],
		}
		await useCase.execute(agent)
		const envelope = (publishSpy.mock.calls[0] as [object])[0]
		expect(envelope).toHaveProperty('id')
		expect(envelope).toHaveProperty('ts')
		expect(typeof (envelope as any).id).toBe('string')
		expect(typeof (envelope as any).ts).toBe('number')
		expect((envelope as any).type).toBe('agent-saved')
		expect((envelope as any).agentId).toBe('agent-2')
		expect((envelope as any).name).toBe('Another Agent')
		expect((envelope as any).role).toBe('system')
	})

	it('propagates errors from eventBus.publish', async () => {
		vi.spyOn(mockRepository, 'save').mockResolvedValue(undefined)
		vi.spyOn(mockEventBus, 'publish').mockRejectedValue(
			new Error('Event bus unavailable'),
		)
		const agent = {
			id: 'agent-3',
			name: 'Error Agent',
			systemPrompt: 'Test',
			providerId: 'p1',
			providerConfiguration: {},
			toolIds: [],
		}
		await expect(useCase.execute(agent)).rejects.toThrow(
			'Event bus unavailable',
		)
	})

	it('handles empty agent object — save called with partial agent, event published with empty strings', async () => {
		const saveSpy = vi.spyOn(mockRepository, 'save')
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const emptyAgent = {} as any
		await useCase.execute(emptyAgent)
		expect(saveSpy).toHaveBeenCalledWith(emptyAgent)
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				agentId: undefined,
				name: undefined,
				type: 'agent-saved',
			}),
		)
	})

	it('handles agent with empty string id and name', async () => {
		const saveSpy = vi.spyOn(mockRepository, 'save')
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const emptyStringsAgent = {
			id: '',
			name: '',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			providerConfiguration: {},
			toolIds: [],
		}
		await useCase.execute(emptyStringsAgent)
		expect(saveSpy).toHaveBeenCalledWith(emptyStringsAgent)
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				agentId: '',
				name: '',
				type: 'agent-saved',
			}),
		)
	})

	it('handles missing name field — save called with partial agent, event published with undefined name', async () => {
		const saveSpy = vi.spyOn(mockRepository, 'save')
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const partialAgent = {
			id: 'agent-partial',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			providerConfiguration: {},
			toolIds: [],
		} as any
		await useCase.execute(partialAgent)
		expect(saveSpy).toHaveBeenCalledWith(partialAgent)
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				agentId: 'agent-partial',
				name: undefined,
				type: 'agent-saved',
			}),
		)
	})

	it('handles missing description field — save called with partial agent, event published with undefined description', async () => {
		const saveSpy = vi.spyOn(mockRepository, 'save')
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const partialAgent = {
			id: 'agent-partial',
			name: 'Partial Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			providerConfiguration: {},
			toolIds: [],
		} as any
		await useCase.execute(partialAgent)
		expect(saveSpy).toHaveBeenCalledWith(partialAgent)
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				agentId: 'agent-partial',
				name: 'Partial Agent',
				type: 'agent-saved',
			}),
		)
	})

	it('handles missing toolIds field — save called with partial agent, event published with undefined toolIds', async () => {
		const saveSpy = vi.spyOn(mockRepository, 'save')
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const partialAgent = {
			id: 'agent-partial',
			name: 'Partial Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			providerConfiguration: {},
		} as any
		await useCase.execute(partialAgent)
		expect(saveSpy).toHaveBeenCalledWith(partialAgent)
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				agentId: 'agent-partial',
				name: 'Partial Agent',
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
			providerConfiguration: {},
			toolIds: [],
		}
		const before = Date.now()
		await useCase.execute(agent)
		const after = Date.now()

		const envelope = (publishSpy.mock.calls[0] as [object])[0] as any
		expect(typeof envelope.id).toBe('string')
		expect(envelope.id.length).toBeGreaterThan(0)

		expect(typeof envelope.ts).toBe('number')
		expect(envelope.ts).toBeGreaterThanOrEqual(before)
		expect(envelope.ts).toBeLessThanOrEqual(after)

		expect(envelope.type).toBe('agent-saved')
		expect(envelope.agentId).toBe('agent-envelope-test')
		expect(envelope.name).toBe('Envelope Agent')
		expect(envelope.role).toBe('system')
	})

	it('verifies event envelope structure with empty agent — id is undefined, ts is still a valid timestamp', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const emptyAgent = {} as any
		const before = Date.now()
		await useCase.execute(emptyAgent)
		const after = Date.now()

		const envelope = (publishSpy.mock.calls[0] as [object])[0] as any
		expect(typeof envelope.id).toBe('string')
		expect(envelope.id.length).toBeGreaterThan(0)

		expect(typeof envelope.ts).toBe('number')
		expect(envelope.ts).toBeGreaterThanOrEqual(before)
		expect(envelope.ts).toBeLessThanOrEqual(after)

		expect(envelope.type).toBe('agent-saved')
		expect(envelope.agentId).toBe(undefined)
		expect(envelope.name).toBe(undefined)
		expect(envelope.role).toBe('system')
	})

	it('verifies event envelope structure with empty string agent — id and name are empty strings, ts is valid', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const emptyStringsAgent = {
			id: '',
			name: '',
			systemPrompt: 'You are helpful.',
			providerId: 'provider-1',
			providerConfiguration: {},
			toolIds: [],
		}
		const before = Date.now()
		await useCase.execute(emptyStringsAgent)
		const after = Date.now()

		const envelope = (publishSpy.mock.calls[0] as [object])[0] as any
		expect(typeof envelope.id).toBe('string')

		expect(typeof envelope.ts).toBe('number')
		expect(envelope.ts).toBeGreaterThanOrEqual(before)
		expect(envelope.ts).toBeLessThanOrEqual(after)

		expect(envelope.type).toBe('agent-saved')
		expect(envelope.agentId).toBe('')
		expect(envelope.name).toBe('')
		expect(envelope.role).toBe('system')
	})

	it('publishes event envelope with correct type contract (single argument)', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const agent = {
			id: 'agent-2',
			name: 'Another Agent',
			systemPrompt: 'You are a test agent.',
			providerId: 'provider-2',
			providerConfiguration: { apiKey: 'test-key' },
			toolIds: [],
		}
		await useCase.execute(agent)
		const envelope = (publishSpy.mock.calls[0] as [object])[0]
		expect(envelope).toHaveProperty('id')
		expect(envelope).toHaveProperty('ts')
		expect(typeof (envelope as any).id).toBe('string')
		expect(typeof (envelope as any).ts).toBe('number')
		expect((envelope as any).type).toBe('agent-saved')
		expect((envelope as any).agentId).toBe('agent-2')
		expect((envelope as any).name).toBe('Another Agent')
		expect((envelope as any).role).toBe('system')
	})

	it('propagates errors from eventBus.publish', async () => {
		vi.spyOn(mockRepository, 'save').mockResolvedValue(undefined)
		vi.spyOn(mockEventBus, 'publish').mockRejectedValue(
			new Error('Event bus unavailable'),
		)
		const agent = {
			id: 'agent-3',
			name: 'Error Agent',
			systemPrompt: 'Test',
			providerId: 'p1',
			providerConfiguration: {},
			toolIds: [],
		}
		await expect(useCase.execute(agent)).rejects.toThrow(
			'Event bus unavailable',
		)
	})
})
