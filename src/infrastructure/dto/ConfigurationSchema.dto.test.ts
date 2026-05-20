import { describe, expect, it } from 'vitest'
import type ConfigurationSchemaDto from './ConfigurationSchema.dto'

describe('DTO — ConfigurationSchemaDto', () => {
	it('has required key field', () => {
		const schema: ConfigurationSchemaDto = {
			key: 'apiKey',
			required: true,
			type: 'string',
			description: 'API key for the provider',
		}

		expect(schema.key).toBe('apiKey')
	})

	it('has required required field', () => {
		const requiredSchema: ConfigurationSchemaDto = {
			key: 'apiKey',
			required: true,
			type: 'string',
			description: 'API key for the provider',
		}

		expect(requiredSchema.required).toBe(true)

		const optionalSchema: ConfigurationSchemaDto = {
			key: 'apiKey',
			required: false,
			type: 'string',
			description: 'API key for the provider',
		}

		expect(optionalSchema.required).toBe(false)
	})

	it('has required type field with string value', () => {
		const schema: ConfigurationSchemaDto = {
			key: 'apiKey',
			required: true,
			type: 'string',
			description: 'API key for the provider',
		}

		expect(schema.type).toBe('string')
	})

	it('has required type field with number value', () => {
		const schema: ConfigurationSchemaDto = {
			key: 'port',
			required: true,
			type: 'number',
			description: 'Port number',
		}

		expect(schema.type).toBe('number')
	})

	it('has required type field with boolean value', () => {
		const schema: ConfigurationSchemaDto = {
			key: 'enabled',
			required: true,
			type: 'boolean',
			description: 'Enable feature',
		}

		expect(schema.type).toBe('boolean')
	})

	it('has required description field', () => {
		const schema: ConfigurationSchemaDto = {
			key: 'apiKey',
			required: true,
			type: 'string',
			description: 'API key for the provider',
		}

		expect(schema.description).toBe('API key for the provider')
	})

	it('has optional options field with string array', () => {
		const schema: ConfigurationSchemaDto = {
			key: 'region',
			required: true,
			type: 'string',
			options: ['us-east', 'eu-west', 'ap-south'],
			description: 'Region selection',
		}

		expect(schema.options).toEqual(['us-east', 'eu-west', 'ap-south'])
	})

	it('has optional options field with number array', () => {
		const schema: ConfigurationSchemaDto = {
			key: 'retryCount',
			required: false,
			type: 'number',
			options: [1, 3, 5, 10],
			description: 'Number of retries',
		}

		expect(schema.options).toEqual([1, 3, 5, 10])
	})

	it('has optional options field with mixed array', () => {
		const schema: ConfigurationSchemaDto = {
			key: 'mode',
			required: true,
			type: 'string',
			options: ['dev', 'prod', 1, 2],
			description: 'Environment mode',
		}

		expect(schema.options).toEqual(['dev', 'prod', 1, 2])
	})

	it('supports undefined options field', () => {
		const schema: ConfigurationSchemaDto = {
			key: 'apiKey',
			required: true,
			type: 'string',
			description: 'API key for the provider',
		}

		expect(schema.options).toBeUndefined()
	})

	it('is assignable to ConfigurationSchemaDto type', () => {
		const schema: ConfigurationSchemaDto = {
			key: 'apiKey',
			required: true,
			type: 'string',
			description: 'API key for the provider',
		}

		expect(schema).toBeDefined()
	})
})
