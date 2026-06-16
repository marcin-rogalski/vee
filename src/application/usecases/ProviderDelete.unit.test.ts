import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProviderDeleteUseCase from './ProviderDelete.usecase'

describe('UC9 — ProviderDelete use case', () => {
	let mockRepository: ProviderRepositoryPort
	let mockAgentRepository: AgentRepositoryPort
	let mockEventBus: EventBusPort
	let useCase: ProviderDeleteUseCase

	beforeEach(() => {
		mockRepository = {
			get: async () => ({
				id: 'p1',
				name: 'OpenAI',
				type: 'openai',
				configSchema: {
					$schema: 'http://json-schema.org/draft-07/schema#',
					type: 'object',
					properties: {},
				},
				config: {},
			}),
			list: async () => [],
			save: async () => {},
			delete: async () => {},
		}
		mockAgentRepository = {
			listByProviderId: vi.fn().mockResolvedValue([]),
			get: async () => ({
				id: 'a1',
				name: 'Agent',
				systemPrompt: '',
				providerId: 'p1',
				providerOverrides: {},
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
		useCase = new ProviderDeleteUseCase(
			mockRepository,
			mockAgentRepository,
			mockEventBus,
		)
	})

	it('calls providerRepository.delete(id) with correct id', async () => {
		const deleteSpy = vi.spyOn(mockRepository, 'delete')
		await useCase.execute('p1')
		expect(deleteSpy).toHaveBeenCalledWith('p1')
	})

	it('publishes a provider-deleted event', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute('p1')
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'provider-deleted',
				providerId: 'p1',
				id: expect.any(String),
				role: 'system',
				ts: expect.any(Number),
			}),
		)
	})

	it('publishes event envelope with correct type contract (single argument)', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute('p2')
		const envelope = (
			publishSpy.mock.calls[0] as [
				{
					id: string
					ts: number
					type: string
					providerId: string
					role: string
				},
			]
		)[0]
		expect(envelope).toHaveProperty('id')
		expect(envelope).toHaveProperty('ts')
		expect(typeof envelope.id).toBe('string')
		expect(typeof envelope.ts).toBe('number')
		expect(envelope.type).toBe('provider-deleted')
		expect(envelope.providerId).toBe('p2')
		expect(envelope.role).toBe('system')
	})

	it('publishes event even if publish returns a rejected promise (fire and forget)', async () => {
		vi.spyOn(mockEventBus, 'publish').mockRejectedValue(
			new Error('Event bus unavailable'),
		)
		// Fire-and-forget: publish error should not propagate
		await expect(useCase.execute('p3')).resolves.toBeUndefined()
	})

	it('forwards empty string ID to repository.delete and eventBus.publish without validation', async () => {
		const deleteSpy = vi.spyOn(mockRepository, 'delete')
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute('')
		expect(deleteSpy).toHaveBeenCalledWith('')
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'provider-deleted',
				providerId: '',
			}),
		)
	})

	it('forwards null ID to repository.delete and eventBus.publish without validation', async () => {
		const deleteSpy = vi.spyOn(mockRepository, 'delete')
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute(null as unknown as string)
		expect(deleteSpy).toHaveBeenCalledWith(null)
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'provider-deleted',
				providerId: null,
			}),
		)
	})

	it('forwards undefined ID to repository.delete and eventBus.publish without validation', async () => {
		const deleteSpy = vi.spyOn(mockRepository, 'delete')
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute(undefined as unknown as string)
		expect(deleteSpy).toHaveBeenCalledWith(undefined)
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'provider-deleted',
				providerId: undefined,
			}),
		)
	})

	it('verifies exact event envelope structure: providerId, type, timestamp, id, role', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const testProviderId = 'provider-xyz-789'
		await useCase.execute(testProviderId)
		const envelope = (
			publishSpy.mock.calls[0] as [
				{
					id: string
					ts: number
					type: string
					providerId: string
					role: string
				},
			]
		)[0]
		// providerId must match the input ID exactly
		expect(envelope.providerId).toBe(testProviderId)
		// type must be 'provider-deleted'
		expect(envelope.type).toBe('provider-deleted')
		// ts must be a number and a reasonable timestamp (integer <= Date.now())
		expect(typeof envelope.ts).toBe('number')
		expect(envelope.ts).toBeTypeOf('number')
		expect(envelope.ts as number).toBeLessThanOrEqual(Date.now())
		// id must be a non-empty string (crypto.randomUUID)
		expect(typeof envelope.id).toBe('string')
		expect((envelope.id as string).length).toBeGreaterThan(0)
		// role must be 'system'
		expect(envelope.role).toBe('system')
	})

	it('throws when provider is referenced by agents (cascade safety)', async () => {
		const deleteSpy = vi.spyOn(mockRepository, 'delete')
		vi.mocked(mockAgentRepository.listByProviderId).mockResolvedValueOnce([
			{ id: 'a1', name: 'Agent One' },
			{ id: 'a2', name: 'Agent Two' },
		])
		await expect(useCase.execute('p1')).rejects.toThrow(
			'referenced by agent(s)',
		)
		expect(deleteSpy).not.toHaveBeenCalled()
	})

	it('includes agent names in cascade safety error message', async () => {
		vi.mocked(mockAgentRepository.listByProviderId).mockResolvedValueOnce([
			{ id: 'a1', name: 'MyAgent' },
		])
		try {
			await useCase.execute('p1')
			expect.fail('should have thrown')
		} catch (error) {
			expect((error as Error).message).toContain('MyAgent')
		}
	})

	it('allows delete when no agents reference the provider', async () => {
		const deleteSpy = vi.spyOn(mockRepository, 'delete')
		vi.mocked(mockAgentRepository.listByProviderId).mockResolvedValueOnce([])
		await useCase.execute('p1')
		expect(deleteSpy).toHaveBeenCalledWith('p1')
	})
})
