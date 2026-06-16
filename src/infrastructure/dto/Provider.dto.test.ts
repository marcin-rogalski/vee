import { describe, expect, it } from 'vitest'
import type ProviderDto from './Provider.dto'

describe('DTO — ProviderDto', () => {
	it('has required id field', () => {
		const provider: ProviderDto = {
			id: 'provider-123',
			name: 'OpenAI',
			type: 'chat',
			configSchema: {
				$schema: 'https://json-schema.org/draft/2020-12/schema',
				type: 'object',
				properties: {},
			},
			config: {},
		}

		expect(provider.id).toBe('provider-123')
	})

	it('has required name field', () => {
		const provider: ProviderDto = {
			id: 'provider-123',
			name: 'OpenAI',
			type: 'chat',
			configSchema: {
				$schema: 'https://json-schema.org/draft/2020-12/schema',
				type: 'object',
				properties: {},
			},
			config: {},
		}

		expect(provider.name).toBe('OpenAI')
	})

	it('has required type field', () => {
		const provider: ProviderDto = {
			id: 'provider-123',
			name: 'OpenAI',
			type: 'chat',
			configSchema: {
				$schema: 'https://json-schema.org/draft/2020-12/schema',
				type: 'object',
				properties: {},
			},
			config: {},
		}

		expect(provider.type).toBe('chat')
	})

	it('has required configSchema field', () => {
		const provider: ProviderDto = {
			id: 'provider-123',
			name: 'OpenAI',
			type: 'chat',
			configSchema: {
				$schema: 'https://json-schema.org/draft/2020-12/schema',
				type: 'object',
				properties: {
					apiKey: { type: 'string', description: 'API key' },
				},
			},
			config: {},
		}

		expect(Object.keys(provider.configSchema.properties ?? {})).toHaveLength(1)
	})

	it('has complex configSchema with multiple fields', () => {
		const provider: ProviderDto = {
			id: 'provider-123',
			name: 'OpenAI',
			type: 'chat',
			configSchema: {
				$schema: 'https://json-schema.org/draft/2020-12/schema',
				type: 'object',
				properties: {
					apiKey: { type: 'string', description: 'API key' },
					model: { type: 'string', description: 'Model name' },
					temperature: { type: 'number', description: 'Temperature setting' },
				},
			},
			config: {},
		}

		expect(Object.keys(provider.configSchema.properties ?? {})).toHaveLength(3)
	})

	it('supports empty configSchema properties', () => {
		const provider: ProviderDto = {
			id: 'provider-123',
			name: 'Provider',
			type: 'simple',
			configSchema: {
				$schema: 'https://json-schema.org/draft/2020-12/schema',
				type: 'object',
				properties: {},
			},
			config: {},
		}

		expect(provider.configSchema.properties).toEqual({})
	})

	it('is assignable to ProviderDto type', () => {
		const provider: ProviderDto = {
			id: 'provider-123',
			name: 'OpenAI',
			type: 'chat',
			configSchema: {
				$schema: 'https://json-schema.org/draft/2020-12/schema',
				type: 'object',
				properties: {},
			},
			config: {},
		}

		expect(provider).toBeDefined()
	})
})
