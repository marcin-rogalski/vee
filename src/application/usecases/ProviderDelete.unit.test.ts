import type EventBusPort from '@application/ports/EventBus.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProviderDeleteUseCase from './ProviderDelete.usecase'

describe('UC9 — ProviderDelete use case', () => {
	let mockRepository: ProviderRepositoryPort
	let mockEventBus: EventBusPort
	let useCase: ProviderDeleteUseCase

	beforeEach(() => {
		mockRepository = {
			get: async () => ({
				id: 'p1',
				name: 'OpenAI',
				type: 'openai',
				configSchema: [],
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
		useCase = new ProviderDeleteUseCase(mockRepository, mockEventBus)
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
		const envelope = (publishSpy.mock.calls[0] as [object])[0]
		expect(envelope).toHaveProperty('id')
		expect(envelope).toHaveProperty('ts')
		expect(typeof (envelope as any).id).toBe('string')
		expect(typeof (envelope as any).ts).toBe('number')
		expect((envelope as any).type).toBe('provider-deleted')
		expect((envelope as any).providerId).toBe('p2')
		expect((envelope as any).role).toBe('system')
	})

	it('propagates errors from eventBus.publish', async () => {
		vi.spyOn(mockRepository, 'delete').mockResolvedValue(undefined)
		vi.spyOn(mockEventBus, 'publish').mockRejectedValue(
			new Error('Event bus unavailable'),
		)
		await expect(useCase.execute('p3')).rejects.toThrow('Event bus unavailable')
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
		const envelope = (publishSpy.mock.calls[0] as [object])[0] as Record<
			string,
			unknown
		>
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
})
