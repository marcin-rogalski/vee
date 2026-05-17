import type ProviderPort from '@application/ports/Provider.port'
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
		const result = registry.resolve({
			id: 'p1',
			type: 'openai',
			configSchema: [],
		} as any)
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
		const result = registry.resolve({
			id: 'p1',
			type: 'anthropic',
			configSchema: [],
		} as any)
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
		const a = registry.resolve({
			id: 'p1',
			type: 'openai',
			configSchema: [],
		} as any)
		const b = registry.resolve({
			id: 'p2',
			type: 'openai',
			configSchema: [],
		} as any)
		expect(a).not.toBe(b)
	})

	it('throws Error when provider type is not registered', () => {
		expect(() =>
			registry.resolve({ id: 'p1', type: 'unknown', configSchema: [] } as any),
		).toThrow('Provider type unknown not registered')
	})
})
