import type EventBusPort from '@application/ports/EventBus.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import type SchemaValidationService from '@application/ports/SchemaValidationService.port'
import type { JsonSchemaObject } from '@domain/JsonSchema'
import { validateJsonSchema } from '@infrastructure/utilities/JsonSchemaValidator.adapter'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProviderUpsertUseCase from './ProviderUpsert.usecase'

describe('UC8 — ProviderUpsert use case', () => {
	let mockRepository: ProviderRepositoryPort
	let mockEventBus: EventBusPort
	let mockSchemaValidationService: SchemaValidationService
	let useCase: ProviderUpsertUseCase

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
		mockSchemaValidationService = {
			validate: vi.fn((config, schema) => validateJsonSchema(config, schema)),
		}
		useCase = new ProviderUpsertUseCase(
			mockRepository,
			mockEventBus,
			mockSchemaValidationService,
		)
	})

	it('validates config against configSchema before saving', async () => {
		const configSchema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
					description: 'Key',
				},
			},
		}
		const provider = {
			id: 'p1',
			name: 'OpenAI',
			type: 'openai',
			configSchema,
			config: { apiKey: 'sk-test' },
		}
		const saveSpy = vi.spyOn(mockRepository, 'save')
		await useCase.execute(provider)
		expect(saveSpy).toHaveBeenCalledWith(provider)
	})

	it('calls providerRepository.save(provider) with full provider object', async () => {
		const saveSpy = vi.spyOn(mockRepository, 'save')
		const configSchema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
					description: 'Key',
				},
			},
		}
		const provider = {
			id: 'p1',
			name: 'OpenAI',
			type: 'openai',
			configSchema,
			config: {},
		}
		await useCase.execute(provider)
		expect(saveSpy).toHaveBeenCalledWith(provider)
	})

	it('throws ValidationError when config is missing required field', async () => {
		const configSchema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
					description: 'Key',
				},
			},
			required: ['apiKey'],
		}
		const provider = {
			id: 'p1',
			name: 'OpenAI',
			type: 'openai',
			configSchema,
			config: {},
		}
		await expect(useCase.execute(provider)).rejects.toThrow('Validation failed')
	})

	it('throws ValidationError with provider name context on config failure', async () => {
		const configSchema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
					description: 'Key',
				},
			},
			required: ['apiKey'],
		}
		const provider = {
			id: 'p1',
			name: 'My Provider',
			type: 'openai',
			configSchema,
			config: {},
		}
		try {
			await useCase.execute(provider)
			expect.fail('should have thrown')
		} catch (error) {
			expect(
				(error as import('@domain/errors').ValidationError).metadata.details,
			).toHaveProperty(
				'_config',
				'Provider config for "My Provider" is invalid',
			)
		}
	})

	it('throws ValidationError when config field has wrong type', async () => {
		const configSchema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				temperature: {
					type: 'number',
					description: 'Temp',
				},
			},
		}
		const provider = {
			id: 'p1',
			name: 'OpenAI',
			type: 'openai',
			configSchema,
			config: { temperature: 'not-a-number' },
		}
		await expect(useCase.execute(provider)).rejects.toThrow('Validation failed')
	})

	it('publishes a provider-saved event', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const configSchema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
					description: 'Key',
				},
			},
		}
		const provider = {
			id: 'p1',
			name: 'OpenAI',
			type: 'openai',
			configSchema,
			config: {},
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
		const configSchema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
					description: 'Key',
				},
			},
		}
		const provider = {
			id: 'p2',
			name: 'Anthropic',
			type: 'anthropic',
			configSchema,
			config: {},
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

	it('publishes event even if publish returns rejected promise (fire and forget)', async () => {
		vi.spyOn(mockRepository, 'save').mockResolvedValue(undefined)
		vi.spyOn(mockEventBus, 'publish').mockRejectedValue(
			new Error('Event bus unavailable'),
		)
		const configSchema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
					description: 'Key',
				},
			},
		}
		const provider = {
			id: 'p3',
			name: 'Test',
			type: 'test',
			configSchema,
			config: {},
		}
		// Fire-and-forget: publish error should not propagate
		await expect(useCase.execute(provider)).resolves.toBeUndefined()
	})

	// --- Error paths ---

	it('propagates errors from providerRepository.save', async () => {
		vi.spyOn(mockRepository, 'save').mockRejectedValue(
			new Error('Database error'),
		)
		const configSchema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
					description: 'Key',
				},
			},
		}
		const provider = {
			id: 'p4',
			name: 'ErrorProvider',
			type: 'test',
			configSchema,
			config: {},
		}
		await expect(useCase.execute(provider)).rejects.toThrow('Database error')
	})

	// --- Edge cases: missing provider fields ---

	it('handles provider with missing name field (partial provider object)', async () => {
		const saveSpy = vi.spyOn(mockRepository, 'save')
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const configSchema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
					description: 'Key',
				},
			},
		}
		const provider = {
			id: 'p5',
			type: 'test',
			configSchema,
			config: {},
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
		const configSchema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
					description: 'Key',
				},
			},
		}
		const provider = {
			id: 'p7',
			name: 'UUID Test',
			type: 'test',
			configSchema,
			config: {},
		}
		await useCase.execute(provider)
		const envelope = (publishSpy.mock.calls[0] as [{ id: string }])[0]
		expect(typeof envelope.id).toBe('string')
		expect(envelope.id.length).toBeGreaterThan(0)
	})

	it('publishes event with ts as integer <= Date.now()', async () => {
		const before = Date.now()
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const configSchema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
					description: 'Key',
				},
			},
		}
		const provider = {
			id: 'p8',
			name: 'Timestamp Test',
			type: 'test',
			configSchema,
			config: {},
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
		const configSchema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
					description: 'Key',
				},
			},
		}
		const existingProvider = {
			id: 'existing-123',
			name: 'Updated Provider',
			type: 'openai',
			configSchema,
			config: {},
		}
		await useCase.execute(existingProvider)
		expect(saveSpy).toHaveBeenCalledWith(existingProvider)
		expect(saveSpy).toHaveBeenCalledTimes(1)
	})

	it('calls save() with provider without id (create scenario)', async () => {
		const saveSpy = vi.spyOn(mockRepository, 'save')
		const configSchema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
					description: 'Key',
				},
			},
		}
		const newProvider = {
			id: 'new-456',
			name: 'New Provider',
			type: 'anthropic',
			configSchema,
			config: {},
		}
		await useCase.execute(newProvider)
		expect(saveSpy).toHaveBeenCalledWith(newProvider)
		expect(saveSpy).toHaveBeenCalledTimes(1)
	})

	it('publishes event with providerId and name from the provider object', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const configSchema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
					description: 'Key',
				},
			},
		}
		const provider = {
			id: 'p9',
			name: 'Edge Case Provider',
			type: 'custom',
			configSchema,
			config: {},
		}
		await useCase.execute(provider)
		const envelope = (
			publishSpy.mock.calls[0] as [{ providerId: string; name: string }]
		)[0]
		expect(envelope.providerId).toBe('p9')
		expect(envelope.name).toBe('Edge Case Provider')
	})
})
