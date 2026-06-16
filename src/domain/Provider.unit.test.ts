import { describe, expect, it } from 'vitest'
import type { JsonSchemaObject } from './JsonSchema'
import { isTypedProperty } from './JsonSchema'
import type Provider from './Provider'

describe('D2 — Provider type shape', () => {
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

	const validProvider: Provider = {
		id: 'provider-1',
		name: 'OpenAI',
		type: 'openai',
		configSchema: validSchema,
		config: {},
	}

	it('creates valid Provider with id, name, type, configSchema, config', () => {
		expect(validProvider.id).toBe('provider-1')
		expect(validProvider.name).toBe('OpenAI')
		expect(validProvider.type).toBe('openai')
		expect(validProvider.configSchema).toEqual(validSchema)
		expect(validProvider.config).toEqual({})
	})

	it('accepts empty configSchema object', () => {
		const providerEmptySchema: Provider = {
			...validProvider,
			configSchema: {
				$schema: 'http://json-schema.org/draft-07/schema#',
				type: 'object',
				properties: {},
			},
		}
		expect(providerEmptySchema.configSchema.properties).toEqual({})
	})

	it('has all required keys present on valid object', () => {
		const keys = Object.keys(validProvider).sort()
		const requiredKeys = ['config', 'configSchema', 'id', 'name', 'type'].sort()
		expect(keys).toEqual(requiredKeys)
	})

	/* ---- Type constraint enforcement (string-only fields) ---- */

	it('rejects non-string id via runtime shape check (number)', () => {
		const badIdProvider: Record<string, unknown> = {
			id: 123,
			name: 'Test',
			type: 'test',
			configSchema: {},
			config: {},
		}
		expect(typeof badIdProvider.id).toBe('number')
		expect(badIdProvider.id).not.toBeTypeOf('string')
	})

	it('rejects non-string id via runtime shape check (null)', () => {
		const badIdProvider: Record<string, unknown> = {
			id: null,
			name: 'Test',
			type: 'test',
			configSchema: {},
			config: {},
		}
		expect(badIdProvider.id).toBeNull()
	})

	it('rejects non-string id via runtime shape check (object)', () => {
		const badIdProvider: Record<string, unknown> = {
			id: { nested: 'obj' },
			name: 'Test',
			type: 'test',
			configSchema: {},
			config: {},
		}
		expect(typeof badIdProvider.id).toBe('object')
	})

	it('rejects non-string name via runtime shape check (number)', () => {
		const badNameProvider: Record<string, unknown> = {
			id: 'p1',
			name: 42,
			type: 'test',
			configSchema: {},
			config: {},
		}
		expect(typeof badNameProvider.name).toBe('number')
	})

	it('rejects non-string name via runtime shape check (array)', () => {
		const badNameProvider: Record<string, unknown> = {
			id: 'p1',
			name: ['a', 'b'],
			type: 'test',
			configSchema: {},
			config: {},
		}
		expect(Array.isArray(badNameProvider.name)).toBe(true)
	})

	it('rejects non-string type via runtime shape check (boolean)', () => {
		const badTypeProvider: Record<string, unknown> = {
			id: 'p1',
			name: 'Test',
			type: true,
			configSchema: {},
			config: {},
		}
		expect(typeof badTypeProvider.type).toBe('boolean')
	})

	it('rejects non-string type via runtime shape check (null)', () => {
		const badTypeProvider: Record<string, unknown> = {
			id: 'p1',
			name: 'Test',
			type: null,
			configSchema: {},
			config: {},
		}
		expect(badTypeProvider.type).toBeNull()
	})

	it('rejects non-object configSchema via runtime shape check (array)', () => {
		const badSchemaProvider: Record<string, unknown> = {
			id: 'p1',
			name: 'Test',
			type: 'test',
			configSchema: [],
			config: {},
		}
		expect(Array.isArray(badSchemaProvider.configSchema)).toBe(true)
	})

	/* ---- Multiple schema properties ---- */

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
		const multiSchemaProvider: Provider = {
			...validProvider,
			configSchema: multiSchema,
		}
		const props = multiSchemaProvider.configSchema.properties ?? {}
		expect(Object.keys(props)).toHaveLength(3)
		const apiKeyProp = props.apiKey
		if (apiKeyProp && isTypedProperty(apiKeyProp)) {
			expect(apiKeyProp.type).toBe('string')
		}
		const baseUrlProp = props.baseUrl
		if (baseUrlProp && isTypedProperty(baseUrlProp)) {
			expect(baseUrlProp.type).toBe('string')
		}
		const timeoutProp = props.timeout
		if (timeoutProp && isTypedProperty(timeoutProp)) {
			expect(timeoutProp.type).toBe('number')
		}
	})

	/* ---- Boundary values ---- */

	it('accepts empty string for id', () => {
		const emptyIdProvider: Provider = {
			...validProvider,
			id: '',
		}
		expect(emptyIdProvider.id).toBe('')
		expect(emptyIdProvider.id.length).toBe(0)
	})

	it('accepts config with shared values', () => {
		const providerWithConfig: Provider = {
			...validProvider,
			config: { apiKey: 'sk-123', baseUrl: 'https://api.openai.com' },
		}
		expect(providerWithConfig.config.apiKey).toBe('sk-123')
		expect(providerWithConfig.config.baseUrl).toBe('https://api.openai.com')
	})

	it('accepts empty string for name', () => {
		const emptyNameProvider: Provider = {
			...validProvider,
			name: '',
		}
		expect(emptyNameProvider.name).toBe('')
		expect(emptyNameProvider.name.length).toBe(0)
	})

	it('accepts empty string for type', () => {
		const emptyTypeProvider: Provider = {
			...validProvider,
			type: '',
		}
		expect(emptyTypeProvider.type).toBe('')
	})

	it('accepts special characters in id', () => {
		const specialIdProvider: Provider = {
			...validProvider,
			id: 'provider!@#$%^&*()-_+=[]{}|;:\'",.<>?/~`',
		}
		expect(specialIdProvider.id).toContain('@')
		expect(specialIdProvider.id).toContain('#')
		expect(specialIdProvider.id).toContain('~')
	})

	it('accepts special characters in name', () => {
		const specialNameProvider: Provider = {
			...validProvider,
			name: 'OpenAI™ — Pro/Max (v2.0) <test>',
		}
		expect(specialNameProvider.name).toContain('™')
		expect(specialNameProvider.name).toContain('—')
		expect(specialNameProvider.name).toContain('<')
	})

	it('accepts unicode characters in id and name', () => {
		const unicodeProvider: Provider = {
			...validProvider,
			id: 'プロバイダー-1',
			name: 'オープンエアイー',
		}
		expect(unicodeProvider.id).toBe('プロバイダー-1')
		expect(unicodeProvider.name).toBe('オープンエアイー')
	})

	it('accepts very long string for id (10000+ characters)', () => {
		const longId = 'a'.repeat(10001)
		const longIdProvider: Provider = {
			...validProvider,
			id: longId,
		}
		expect(longIdProvider.id.length).toBe(10001)
		expect(longIdProvider.id).toBe(longId)
	})

	it('accepts very long string for name (10000+ characters)', () => {
		const longName = 'b'.repeat(10001)
		const longNameProvider: Provider = {
			...validProvider,
			name: longName,
		}
		expect(longNameProvider.name.length).toBe(10001)
		expect(longNameProvider.name).toBe(longName)
	})

	it('accepts whitespace-only strings for id and name', () => {
		const whitespaceProvider: Provider = {
			...validProvider,
			id: '   ',
			name: '\t\n\r',
		}
		expect(whitespaceProvider.id).toBe('   ')
		expect(whitespaceProvider.name).toBe('\t\n\r')
	})

	/* ---- Invalid provider shapes ---- */

	it('rejects provider missing required field id', () => {
		const missingId: Record<string, unknown> = {
			name: 'Test',
			type: 'test',
			configSchema: [],
		}
		expect(missingId).not.toHaveProperty('id')
	})

	it('rejects provider missing required field name', () => {
		const missingName: Record<string, unknown> = {
			id: 'p1',
			type: 'test',
			configSchema: [],
		}
		expect(missingName).not.toHaveProperty('name')
	})

	it('rejects provider missing required field type', () => {
		const missingType: Record<string, unknown> = {
			id: 'p1',
			name: 'Test',
			configSchema: [],
		}
		expect(missingType).not.toHaveProperty('type')
	})

	it('rejects provider missing required field configSchema', () => {
		const missingSchema: Record<string, unknown> = {
			id: 'p1',
			name: 'Test',
			type: 'test',
		}
		expect(missingSchema).not.toHaveProperty('configSchema')
	})

	it('rejects provider with all required fields missing', () => {
		const emptyProvider: Record<string, unknown> = {}
		expect(Object.keys(emptyProvider)).toHaveLength(0)
	})

	it('accepts extra unexpected keys on provider (shape allows it)', () => {
		const extraKeysProvider: Record<string, unknown> = {
			...validProvider,
			extraField: 'should not affect type',
			anotherExtra: { nested: true },
		}
		expect(extraKeysProvider.extraField).toBe('should not affect type')
		expect(extraKeysProvider.anotherExtra).toEqual({ nested: true })
	})

	it('rejects provider with undefined id', () => {
		const undefinedIdProvider: Record<string, unknown> = {
			id: undefined,
			name: 'Test',
			type: 'test',
			configSchema: [],
		}
		expect(undefinedIdProvider.id).toBeUndefined()
	})

	it('rejects provider with undefined name', () => {
		const undefinedNameProvider: Record<string, unknown> = {
			id: 'p1',
			name: undefined,
			type: 'test',
			configSchema: [],
		}
		expect(undefinedNameProvider.name).toBeUndefined()
	})
})
