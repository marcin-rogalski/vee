import { describe, expect, it } from 'vitest'
import type ConfigurationSchema from './ConfigurationSchema'
import type Provider from './Provider'

describe('D2 — Provider type shape', () => {
	const validSchema: ConfigurationSchema = {
		key: 'apiKey',
		required: true,
		type: 'string',
		options: ['key1', 'key2'],
		description: 'The API key',
	}

	const validProvider: Provider = {
		id: 'provider-1',
		name: 'OpenAI',
		type: 'openai',
		configSchema: [validSchema],
	}

	it('creates valid Provider with id, name, type, configSchema', () => {
		expect(validProvider.id).toBe('provider-1')
		expect(validProvider.name).toBe('OpenAI')
		expect(validProvider.type).toBe('openai')
		expect(validProvider.configSchema).toEqual([validSchema])
	})

	it('accepts empty configSchema array', () => {
		const providerEmptySchema: Provider = {
			...validProvider,
			configSchema: [],
		}
		expect(providerEmptySchema.configSchema).toEqual([])
	})

	it('has all required keys present on valid object', () => {
		const keys = Object.keys(validProvider).sort()
		const requiredKeys = ['id', 'name', 'type', 'configSchema'].sort()
		expect(keys).toEqual(requiredKeys)
	})
})
