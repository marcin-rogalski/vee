import { describe, expect, it } from 'vitest'
import type ProviderDto from './Provider.dto'

describe('DTO — ProviderDto', () => {
	it('has required id field', () => {
		const provider: ProviderDto = {
			id: 'provider-123',
			name: 'OpenAI',
			type: 'chat',
			configSchema: [],
		}

		expect(provider.id).toBe('provider-123')
	})

	it('has required name field', () => {
		const provider: ProviderDto = {
			id: 'provider-123',
			name: 'OpenAI',
			type: 'chat',
			configSchema: [],
		}

		expect(provider.name).toBe('OpenAI')
	})

	it('has required type field', () => {
		const provider: ProviderDto = {
			id: 'provider-123',
			name: 'OpenAI',
			type: 'chat',
			configSchema: [],
		}

		expect(provider.type).toBe('chat')
	})

	it('has required configSchema field', () => {
		const provider: ProviderDto = {
			id: 'provider-123',
			name: 'OpenAI',
			type: 'chat',
			configSchema: [
				{
					key: 'apiKey',
					required: true,
					type: 'string',
					options: undefined,
					description: 'API key',
				},
			],
		}

		expect(provider.configSchema).toHaveLength(1)
	})

	it('has complex configSchema with multiple fields', () => {
		const provider: ProviderDto = {
			id: 'provider-123',
			name: 'OpenAI',
			type: 'chat',
			configSchema: [
				{
					key: 'apiKey',
					required: true,
					type: 'string',
					options: undefined,
					description: 'API key',
				},
				{
					key: 'model',
					required: true,
					type: 'string',
					options: undefined,
					description: 'Model name',
				},
				{
					key: 'temperature',
					required: false,
					type: 'number',
					options: undefined,
					description: 'Temperature setting',
				},
			],
		}

		expect(provider.configSchema).toHaveLength(3)
	})

	it('supports empty configSchema array', () => {
		const provider: ProviderDto = {
			id: 'provider-123',
			name: 'Provider',
			type: 'simple',
			configSchema: [],
		}

		expect(provider.configSchema).toEqual([])
	})

	it('is assignable to ProviderDto type', () => {
		const provider: ProviderDto = {
			id: 'provider-123',
			name: 'OpenAI',
			type: 'chat',
			configSchema: [],
		}

		expect(provider).toBeDefined()
	})
})
