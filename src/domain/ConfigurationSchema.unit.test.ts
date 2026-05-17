import { describe, expect, it } from 'vitest'
import type ConfigurationSchema from './ConfigurationSchema'

describe('D5 — ConfigurationSchema type shape', () => {
	const validSchema: ConfigurationSchema = {
		key: 'apiKey',
		required: true,
		type: 'string',
		options: ['key1', 'key2'],
		description: 'The API key',
	}

	const schemaWithoutOptions: ConfigurationSchema = {
		key: 'baseUrl',
		required: false,
		type: 'string',
		options: undefined,
		description: 'Base URL',
	}

	const schemaWithStringOptions: ConfigurationSchema = {
		key: 'region',
		required: true,
		type: 'string',
		options: ['us-east-1', 'eu-west-1'],
		description: 'AWS region',
	}

	const schemaWithNumberOptions: ConfigurationSchema = {
		key: 'port',
		required: true,
		type: 'number',
		options: [3000, 8080],
		description: 'Server port',
	}

	const schemaWithBooleanType: ConfigurationSchema = {
		key: 'debug',
		required: false,
		type: 'boolean',
		options: undefined,
		description: 'Debug mode',
	}

	it('creates valid schema with all fields (key, required, type, options, description)', () => {
		expect(validSchema.key).toBe('apiKey')
		expect(validSchema.required).toBe(true)
		expect(validSchema.type).toBe('string')
		expect(validSchema.options).toEqual(['key1', 'key2'])
		expect(validSchema.description).toBe('The API key')
	})

	it('accepts options as undefined (optional field)', () => {
		expect(schemaWithoutOptions.options).toBeUndefined()
	})

	it('accepts options as array of strings', () => {
		expect(schemaWithStringOptions.options).toEqual(['us-east-1', 'eu-west-1'])
	})

	it('accepts options as array of numbers', () => {
		expect(schemaWithNumberOptions.options).toEqual([3000, 8080])
	})

	it('accepts type as number', () => {
		expect(schemaWithNumberOptions.type).toBe('number')
	})

	it('accepts type as boolean', () => {
		expect(schemaWithBooleanType.type).toBe('boolean')
	})

	it('has all required keys present on valid object', () => {
		const keys = Object.keys(validSchema).sort()
		const requiredKeys = [
			'key',
			'required',
			'type',
			'options',
			'description',
		].sort()
		expect(keys).toEqual(requiredKeys)
	})

	it('has options key present even when undefined', () => {
		expect(Object.hasOwn(schemaWithoutOptions, 'options')).toBe(true)
	})
})
