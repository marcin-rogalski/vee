import { ValidationError } from '@domain/errors'
import type { JsonSchemaObject } from '@domain/JsonSchema'
import { describe, expect, it } from 'vitest'
import { validateJsonSchema } from './jsonSchemaToZod'

const SCHEMA: JsonSchemaObject = {
	$schema: 'https://json-schema.org/draft/2020-12/schema',
	type: 'object',
	properties: {
		apiKey: { type: 'string', description: 'API key' },
		model: {
			type: 'string',
			description: 'Model name',
			enum: ['gpt-4o', 'gpt-4o-mini'],
		},
		temperature: { type: 'number', description: 'Temperature' },
		debug: { type: 'boolean', description: 'Debug mode' },
	},
	required: ['apiKey', 'model'],
}

describe('validateJsonSchema', () => {
	it('passes valid config with all required fields', () => {
		expect(() =>
			validateJsonSchema({ apiKey: 'sk-123', model: 'gpt-4o' }, SCHEMA),
		).not.toThrow()
	})

	it('passes valid config with optional fields', () => {
		expect(() =>
			validateJsonSchema(
				{ apiKey: 'sk-123', model: 'gpt-4o', temperature: 0.7, debug: true },
				SCHEMA,
			),
		).not.toThrow()
	})

	it('throws ValidationError when required field is missing', () => {
		expect(() => validateJsonSchema({ apiKey: 'sk-123' }, SCHEMA)).toThrow(
			ValidationError,
		)
	})

	it('throws ValidationError when type is wrong', () => {
		expect(() =>
			validateJsonSchema({ apiKey: 123, model: 'gpt-4o' }, SCHEMA),
		).toThrow(ValidationError)
	})

	it('throws ValidationError when enum value is invalid', () => {
		expect(() =>
			validateJsonSchema({ apiKey: 'sk-123', model: 'unknown-model' }, SCHEMA),
		).toThrow(ValidationError)
	})

	it('throws ValidationError when boolean is wrong type', () => {
		expect(() =>
			validateJsonSchema(
				{ apiKey: 'sk-123', model: 'gpt-4o', debug: 'yes' },
				SCHEMA,
			),
		).toThrow(ValidationError)
	})
})
