import type ProviderPort from '@application/ports/Provider.port'
import type { JsonSchemaObject } from '@domain/JsonSchema'
import type { ProviderData } from '@domain/Provider'
import { beforeEach, describe, expect, it } from 'vitest'
import ProviderRegistry from './ProviderRegistry'

describe('R1 — ProviderRegistry', () => {
	let registry: ProviderRegistry

	beforeEach(() => {
		registry = new ProviderRegistry()
	})

	it('registers a provider factory by type', () => {
		const mockProvider: ProviderPort = {
			id: 'test',
			type: 'openai',
			countTokens: () => 0,
			compact: async () => [],
			shouldCompact: () => false,
			infer: async function* () {},
		}
		registry.register('openai', () => mockProvider)
		const provider: ProviderData = {
			id: 'p1',
			name: 'Test Provider',
			type: 'openai',
			configSchema: {
				$schema: 'https://json-schema.org/draft/2020-12/schema',
				type: 'object',
				properties: {},
			},
			config: {},
		}
		const result = registry.resolve(provider)
		expect(result).toBe(mockProvider)
	})

	it('resolves provider using resolve() with matching type', () => {
		const mockProvider: ProviderPort = {
			id: 'test',
			type: 'anthropic',
			countTokens: () => 0,
			compact: async () => [],
			shouldCompact: () => false,
			infer: async function* () {},
		}
		registry.register('anthropic', () => mockProvider)
		const provider: ProviderData = {
			id: 'p1',
			name: 'Test Provider',
			type: 'anthropic',
			configSchema: {
				$schema: 'https://json-schema.org/draft/2020-12/schema',
				type: 'object',
				properties: {},
			},
			config: {},
		}
		const result = registry.resolve(provider)
		expect(result).toBe(mockProvider)
	})

	it('returns different instances per call (factory pattern)', () => {
		registry.register('openai', () => ({
			id: 'test',
			type: 'openai',
			countTokens: () => 0,
			compact: async () => [],
			shouldCompact: () => false,
			infer: async function* () {},
		}))
		const providerA: ProviderData = {
			id: 'p1',
			name: 'Provider A',
			type: 'openai',
			configSchema: {
				$schema: 'https://json-schema.org/draft/2020-12/schema',
				type: 'object',
				properties: {},
			},
			config: {},
		}
		const providerB: ProviderData = {
			id: 'p2',
			name: 'Provider B',
			type: 'openai',
			configSchema: {
				$schema: 'https://json-schema.org/draft/2020-12/schema',
				type: 'object',
				properties: {},
			},
			config: {},
		}
		const a = registry.resolve(providerA)
		const b = registry.resolve(providerB)
		expect(a).not.toBe(b)
	})

	it('throws Error when provider type is not registered', () => {
		const provider: ProviderData = {
			id: 'p1',
			name: 'Unknown Provider',
			type: 'unknown',
			configSchema: {
				$schema: 'https://json-schema.org/draft/2020-12/schema',
				type: 'object',
				properties: {},
			},
			config: {},
		}
		expect(() => registry.resolve(provider)).toThrow(
			'Provider type with id unknown not found',
		)
	})

	it('returns schema for registered provider type', () => {
		const mockProvider: ProviderPort = {
			id: 'test',
			type: 'openai',
			countTokens: () => 0,
			compact: async () => [],
			shouldCompact: () => false,
			infer: async function* () {},
		}
		const schema: JsonSchemaObject = {
			$schema: 'https://json-schema.org/draft/2020-12/schema',
			type: 'object',
			properties: {
				apiKey: { type: 'string', description: 'API key' },
			},
			required: ['apiKey'],
		}
		registry.register('openai', () => mockProvider, schema)
		expect(registry.schema('openai')).toBe(schema)
	})

	it('throws when schema is not registered', () => {
		const mockProvider: ProviderPort = {
			id: 'test',
			type: 'openai',
			countTokens: () => 0,
			compact: async () => [],
			shouldCompact: () => false,
			infer: async function* () {},
		}
		registry.register('openai', () => mockProvider)
		expect(() => registry.schema('openai')).toThrow(
			'Provider schema with id openai not found',
		)
	})
})
