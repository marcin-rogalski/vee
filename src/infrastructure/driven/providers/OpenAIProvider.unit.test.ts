import { ValidationError } from '@domain/errors'
import { isTypedProperty } from '@domain/JsonSchema'
import { validateJsonSchema } from '@infrastructure/utilities/JsonSchemaValidator.adapter'
import { describe, expect, it } from 'vitest'
import OpenAIProvider from './OpenAIProvider'

describe('OpenAIProvider', () => {
	it('has type openai', () => {
		const provider = new OpenAIProvider('p1')
		expect(provider.type).toBe('openai')
	})

	it('has the correct id', () => {
		const provider = new OpenAIProvider('my-openai')
		expect(provider.id).toBe('my-openai')
	})

	it('has CONFIG_SCHEMA with apiKey and model as required', () => {
		const schema = OpenAIProvider.CONFIG_SCHEMA
		expect(schema.type).toBe('object')
		expect(schema.required).toContain('apiKey')
		expect(schema.required).toContain('model')
		expect(schema.properties).toHaveProperty('apiKey')
		expect(schema.properties).toHaveProperty('model')
		expect(schema.properties).toHaveProperty('temperature')
	})

	it('has model property with enum values', () => {
		const modelProp = OpenAIProvider.CONFIG_SCHEMA.properties.model
		if (!modelProp || !isTypedProperty(modelProp)) {
			throw new Error('Model property not found')
		}
		if (modelProp.type !== 'string') {
			throw new Error('Expected model to be string type')
		}
		expect(modelProp.type).toBe('string')
		expect(modelProp.enum).toContain('gpt-4o')
		expect(modelProp.enum).toContain('gpt-4o-mini')
	})

	it('throws Not implemented on infer', () => {
		const provider = new OpenAIProvider('p1')
		expect(() => provider.infer({}, [], []).next()).toThrow('Not implemented')
	})

	it('validates correct config against CONFIG_SCHEMA', () => {
		expect(() =>
			validateJsonSchema(
				{ apiKey: 'sk-123', model: 'gpt-4o' },
				OpenAIProvider.CONFIG_SCHEMA,
			),
		).not.toThrow()
	})

	it('rejects config missing required apiKey', () => {
		expect(() =>
			validateJsonSchema({ model: 'gpt-4o' }, OpenAIProvider.CONFIG_SCHEMA),
		).toThrow(ValidationError)
	})

	it('rejects config with invalid model enum value', () => {
		expect(() =>
			validateJsonSchema(
				{ apiKey: 'sk-123', model: 'llama-3' },
				OpenAIProvider.CONFIG_SCHEMA,
			),
		).toThrow(ValidationError)
	})

	it('accepts config with optional temperature', () => {
		expect(() =>
			validateJsonSchema(
				{ apiKey: 'sk-123', model: 'gpt-4o', temperature: 0.7 },
				OpenAIProvider.CONFIG_SCHEMA,
			),
		).not.toThrow()
	})
})
