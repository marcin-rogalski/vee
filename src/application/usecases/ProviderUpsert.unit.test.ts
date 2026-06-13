import type EventBusPort from '@application/ports/EventBus.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import type ConfigurationSchema from '@domain/ConfigurationSchema'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProviderUpsertUseCase from './ProviderUpsert.usecase'

describe('UC8 — ProviderUpsert use case', () => {
	let mockRepository: ProviderRepositoryPort
	let mockEventBus: EventBusPort
	let useCase: ProviderUpsertUseCase

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
		useCase = new ProviderUpsertUseCase(mockRepository, mockEventBus)
	})

	it('calls providerRepository.save(provider) with full provider object', async () => {
		const saveSpy = vi.spyOn(mockRepository, 'save')
		const configSchema: ConfigurationSchema[] = [
			{
				key: 'apiKey',
				required: true,
				type: 'string' as const,
				options: undefined,
				description: 'Key',
			},
		]
		const provider = {
			id: 'p1',
			name: 'OpenAI',
			type: 'openai',
			configSchema,
		}
		await useCase.execute(provider)
		expect(saveSpy).toHaveBeenCalledWith(provider)
	})

	it('publishes a provider-saved event', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const configSchema: ConfigurationSchema[] = [
			{
				key: 'apiKey',
				required: true,
				type: 'string' as const,
				options: undefined,
				description: 'Key',
			},
		]
		const provider = {
			id: 'p1',
			name: 'OpenAI',
			type: 'openai',
			configSchema,
		}
		await useCase.execute(provider)
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'provider-saved',
				providerId: 'p1',
				name: 'OpenAI',
				id: expect.any(String),
				role: 'system',
				ts: expect.any(Number),
			}),
		)
	})

	it('publishes event envelope with correct type contract (single argument)', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const configSchema: ConfigurationSchema[] = [
			{
				key: 'apiKey',
				required: true,
				type: 'string' as const,
				options: undefined,
				description: 'Key',
			},
		]
		const provider = {
			id: 'p2',
			name: 'Anthropic',
			type: 'anthropic',
			configSchema,
		}
		await useCase.execute(provider)
		const envelope = (
			publishSpy.mock.calls[0] as [
				{
					id: string
					ts: number
					type: string
					providerId: string
					name: string
					role: string
				},
			]
		)[0]
		expect(envelope).toHaveProperty('id')
		expect(envelope).toHaveProperty('ts')
		expect(typeof envelope.id).toBe('string')
		expect(typeof envelope.ts).toBe('number')
		expect(envelope.type).toBe('provider-saved')
		expect(envelope.providerId).toBe('p2')
		expect(envelope.name).toBe('Anthropic')
		expect(envelope.role).toBe('system')
	})

	it('propagates errors from eventBus.publish', async () => {
		vi.spyOn(mockRepository, 'save').mockResolvedValue(undefined)
		vi.spyOn(mockEventBus, 'publish').mockRejectedValue(
			new Error('Event bus unavailable'),
		)
		const configSchema: ConfigurationSchema[] = [
			{
				key: 'apiKey',
				required: true,
				type: 'string' as const,
				options: undefined,
				description: 'Key',
			},
		]
		const provider = { id: 'p3', name: 'Test', type: 'test', configSchema }
		await expect(useCase.execute(provider)).rejects.toThrow(
			'Event bus unavailable',
		)
	})

	// --- Error paths ---

	it('propagates errors from providerRepository.save', async () => {
		vi.spyOn(mockRepository, 'save').mockRejectedValue(
			new Error('Database error'),
		)
		const configSchema: ConfigurationSchema[] = [
			{
				key: 'apiKey',
				required: true,
				type: 'string' as const,
				options: undefined,
				description: 'Key',
			},
		]
		const provider = {
			id: 'p4',
			name: 'ErrorProvider',
			type: 'test',
			configSchema,
		}
		await expect(useCase.execute(provider)).rejects.toThrow('Database error')
	})

	// --- Edge cases: missing provider fields ---

	it('handles provider with missing name field (partial provider object)', async () => {
		const saveSpy = vi.spyOn(mockRepository, 'save')
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const configSchema: ConfigurationSchema[] = [
			{
				key: 'apiKey',
				required: true,
				type: 'string' as const,
				options: undefined,
				description: 'Key',
			},
		]
		const provider = {
			id: 'p5',
			type: 'test',
			configSchema,
		} as unknown as import('@domain/Provider').default
		await useCase.execute(provider)
		expect(saveSpy).toHaveBeenCalledWith(provider)
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				providerId: 'p5',
				name: undefined,
			}),
		)
	})

	it('handles provider with missing configSchema (partial provider object)', async () => {
		const saveSpy = vi.spyOn(mockRepository, 'save')
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const provider = {
			id: 'p6',
			name: 'NoSchema',
			type: 'test',
		} as unknown as import('@domain/Provider').default
		await useCase.execute(provider)
		expect(saveSpy).toHaveBeenCalledWith(provider)
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				providerId: 'p6',
				name: 'NoSchema',
			}),
		)
	})

	// --- Event content: crypto.randomUUID() and timestamp correctness ---

	it('publishes event with id as non-empty string (crypto.randomUUID() behavior)', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const configSchema: ConfigurationSchema[] = [
			{
				key: 'apiKey',
				required: true,
				type: 'string' as const,
				options: undefined,
				description: 'Key',
			},
		]
		const provider = { id: 'p7', name: 'UUID Test', type: 'test', configSchema }
		await useCase.execute(provider)
		const envelope = (publishSpy.mock.calls[0] as [{ id: string }])[0]
		expect(typeof envelope.id).toBe('string')
		expect(envelope.id.length).toBeGreaterThan(0)
	})

	it('publishes event with ts as integer <= Date.now()', async () => {
		const before = Date.now()
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const configSchema: ConfigurationSchema[] = [
			{
				key: 'apiKey',
				required: true,
				type: 'string' as const,
				options: undefined,
				description: 'Key',
			},
		]
		const provider = {
			id: 'p8',
			name: 'Timestamp Test',
			type: 'test',
			configSchema,
		}
		await useCase.execute(provider)
		const after = Date.now()
		const envelope = (publishSpy.mock.calls[0] as [{ ts: number }])[0]
		expect(Number.isInteger(envelope.ts)).toBe(true)
		expect(envelope.ts).toBeLessThanOrEqual(after)
		expect(envelope.ts).toBeGreaterThanOrEqual(before)
	})

	// --- Update vs Create differentiation ---

	it('calls save() with provider containing existing id (update scenario)', async () => {
		const saveSpy = vi.spyOn(mockRepository, 'save')
		const configSchema: ConfigurationSchema[] = [
			{
				key: 'apiKey',
				required: true,
				type: 'string' as const,
				options: undefined,
				description: 'Key',
			},
		]
		const existingProvider = {
			id: 'existing-123',
			name: 'Updated Provider',
			type: 'openai',
			configSchema,
		}
		await useCase.execute(existingProvider)
		expect(saveSpy).toHaveBeenCalledWith(existingProvider)
		expect(saveSpy).toHaveBeenCalledTimes(1)
	})

	it('calls save() with provider without id (create scenario)', async () => {
		const saveSpy = vi.spyOn(mockRepository, 'save')
		const configSchema: ConfigurationSchema[] = [
			{
				key: 'apiKey',
				required: true,
				type: 'string' as const,
				options: undefined,
				description: 'Key',
			},
		]
		const newProvider = {
			id: 'new-456',
			name: 'New Provider',
			type: 'anthropic',
			configSchema,
		}
		await useCase.execute(newProvider)
		expect(saveSpy).toHaveBeenCalledWith(newProvider)
		expect(saveSpy).toHaveBeenCalledTimes(1)
	})

	it('publishes event with providerId and name from the provider object', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const configSchema: ConfigurationSchema[] = [
			{
				key: 'apiKey',
				required: true,
				type: 'string' as const,
				options: undefined,
				description: 'Key',
			},
		]
		const provider = {
			id: 'p9',
			name: 'Edge Case Provider',
			type: 'custom',
			configSchema,
		}
		await useCase.execute(provider)
		const envelope = (
			publishSpy.mock.calls[0] as [{ providerId: string; name: string }]
		)[0]
		expect(envelope.providerId).toBe('p9')
		expect(envelope.name).toBe('Edge Case Provider')
	})
})
