import { describe, expect, it } from 'vitest'
import { ValidationError } from './errors'
import type { JsonSchemaObject } from './JsonSchema'
import Provider, { type ProviderData } from './Provider'

describe('Provider — constructor', () => {
	const validSchema: JsonSchemaObject = {
		$schema: 'http://json-schema.org/draft-07/schema#',
		type: 'object',
		properties: {
			apiKey: {
				type: 'string',
				description: 'The API key',
			},
		},
		required: ['apiKey'],
	}

	it('creates provider with required fields', () => {
		const provider = new Provider({
			name: 'OpenAI',
			type: 'openai',
		})

		expect(provider.id).toBeDefined()
		expect(provider.name).toBe('OpenAI')
		expect(provider.type).toBe('openai')
		expect(provider.configSchema).toEqual({
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {},
		})
		expect(provider.config).toEqual({})
	})

	it('accepts all optional fields', () => {
		const provider = new Provider({
			id: 'provider-1',
			name: 'OpenAI',
			type: 'openai',
			configSchema: validSchema,
			config: { apiKey: 'sk-123' },
		})

		expect(provider.id).toBe('provider-1')
		expect(provider.configSchema).toEqual(validSchema)
		expect(provider.config).toEqual({ apiKey: 'sk-123' })
	})

	it('generates random ID when not provided', () => {
		const provider1 = new Provider({
			name: 'A',
			type: 'T',
		})
		const provider2 = new Provider({
			name: 'B',
			type: 'T',
		})

		expect(provider1.id).not.toBe(provider2.id)
	})
})

describe('Provider — Zod validation', () => {
	it('throws ValidationError for empty name', () => {
		expect(() => new Provider({ name: '', type: 'openai' })).toThrow(
			ValidationError,
		)
	})

	it('throws ValidationError for whitespace-only name', () => {
		expect(() => new Provider({ name: '   ', type: 'openai' })).toThrow(
			ValidationError,
		)
	})

	it('throws ValidationError for empty type', () => {
		expect(() => new Provider({ name: 'A', type: '' })).toThrow(ValidationError)
	})

	it('throws ValidationError for whitespace-only type', () => {
		expect(() => new Provider({ name: 'A', type: '  ' })).toThrow(
			ValidationError,
		)
	})

	it('trims name and type', () => {
		const provider = new Provider({
			name: '  OpenAI  ',
			type: '  openai  ',
		})

		expect(provider.name).toBe('OpenAI')
		expect(provider.type).toBe('openai')
	})
})

describe('Provider — behavior methods', () => {
	const createProvider = () =>
		new Provider({
			name: 'OpenAI',
			type: 'openai',
		})

	it('rename changes the name', () => {
		const provider = createProvider()
		provider.rename('Anthropic')
		expect(provider.name).toBe('Anthropic')
	})

	it('rename trims whitespace', () => {
		const provider = createProvider()
		provider.rename('  Anthropic  ')
		expect(provider.name).toBe('Anthropic')
	})

	it('rename throws for empty name', () => {
		const provider = createProvider()
		expect(() => provider.rename('')).toThrow(ValidationError)
	})

	it('rename throws for whitespace-only name', () => {
		const provider = createProvider()
		expect(() => provider.rename('   ')).toThrow(ValidationError)
	})

	it('setConfig sets the config', () => {
		const provider = createProvider()
		provider.setConfig({ apiKey: 'sk-123', baseUrl: 'https://api.openai.com' })
		expect(provider.config).toEqual({
			apiKey: 'sk-123',
			baseUrl: 'https://api.openai.com',
		})
	})

	it('setConfigSchema sets the config schema', () => {
		const schema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
				},
			},
			required: ['apiKey'],
		}
		const provider = createProvider()
		provider.setConfigSchema(schema)
		expect(provider.configSchema).toEqual(schema)
	})
})

describe('Provider — toData', () => {
	it('returns ProviderData with all fields', () => {
		const schema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
				},
			},
			required: ['apiKey'],
		}
		const provider = new Provider({
			id: 'provider-1',
			name: 'OpenAI',
			type: 'openai',
			configSchema: schema,
			config: { apiKey: 'sk-123' },
		})

		const data: ProviderData = provider.toData()

		expect(data.id).toBe('provider-1')
		expect(data.name).toBe('OpenAI')
		expect(data.type).toBe('openai')
		expect(data.configSchema).toEqual(schema)
		expect(data.config).toEqual({ apiKey: 'sk-123' })
	})
})

describe('Provider — readonly properties', () => {
	it('id is readonly at compile time', () => {
		const provider = new Provider({
			name: 'A',
			type: 'T',
		})

		// @ts-expect-error - id is readonly
		provider.id = 'new-id'
	})

	it('type is readonly at compile time', () => {
		const provider = new Provider({
			name: 'A',
			type: 'T',
		})

		// @ts-expect-error - type is readonly
		provider.type = 'new-type'
	})
})

describe('Provider — edge cases', () => {
	it('accepts special characters in name', () => {
		const provider = new Provider({
			name: 'OpenAI™ — Pro/Max (v2.0)',
			type: 'openai',
		})
		expect(provider.name).toContain('™')
		expect(provider.name).toContain('—')
	})

	it('accepts unicode characters in name', () => {
		const provider = new Provider({
			name: 'オープンエアイー',
			type: 'openai',
		})
		expect(provider.name).toBe('オープンエアイー')
	})

	it('accepts very long string for name', () => {
		const longName = 'a'.repeat(10001)
		const provider = new Provider({
			name: longName,
			type: 'openai',
		})
		expect(provider.name.length).toBe(10001)
	})

	it('accepts multiple properties in configSchema', () => {
		const multiSchema: JsonSchemaObject = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				apiKey: {
					type: 'string',
					description: 'The API key',
				},
				baseUrl: {
					type: 'string',
					description: 'Base URL override',
				},
				timeout: {
					type: 'number',
					description: 'Request timeout in ms',
				},
			},
			required: ['apiKey', 'timeout'],
		}
		const provider = new Provider({
			name: 'Test',
			type: 'test',
			configSchema: multiSchema,
		})
		const props = provider.configSchema.properties ?? {}
		expect(Object.keys(props)).toHaveLength(3)
	})
})
