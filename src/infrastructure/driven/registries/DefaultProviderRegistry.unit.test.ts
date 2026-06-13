import type ProviderPort from '@application/ports/Provider.port'
import type Provider from '@domain/Provider'
import { beforeEach, describe, expect, it } from 'vitest'
import DefaultProviderRegistry from './DefaultProviderRegistry'

describe('R1 — DefaultProviderRegistry', () => {
	let registry: DefaultProviderRegistry

	beforeEach(() => {
		registry = new DefaultProviderRegistry()
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
		const provider: Provider = {
			id: 'p1',
			name: 'Test Provider',
			type: 'openai',
			configSchema: [],
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
		const provider: Provider = {
			id: 'p1',
			name: 'Test Provider',
			type: 'anthropic',
			configSchema: [],
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
		const providerA: Provider = {
			id: 'p1',
			name: 'Provider A',
			type: 'openai',
			configSchema: [],
		}
		const providerB: Provider = {
			id: 'p2',
			name: 'Provider B',
			type: 'openai',
			configSchema: [],
		}
		const a = registry.resolve(providerA)
		const b = registry.resolve(providerB)
		expect(a).not.toBe(b)
	})

	it('throws Error when provider type is not registered', () => {
		const provider: Provider = {
			id: 'p1',
			name: 'Unknown Provider',
			type: 'unknown',
			configSchema: [],
		}
		expect(() => registry.resolve(provider)).toThrow(
			'Provider type with id unknown not found',
		)
	})
})
