import { describe, expect, it } from 'vitest'
import { jsonSchemaToFormFields } from './jsonSchemaToFormFields'

describe('jsonSchemaToFormFields', () => {
	it('converts string fields', () => {
		const schema = {
			$schema: 'http://json-schema.org/draft-07/schema#' as const,
			type: 'object' as const,
			properties: {
				apiKey: { type: 'string' as const },
				model: { type: 'string' as const },
			},
		}

		const fields = jsonSchemaToFormFields(schema)

		expect(fields).toHaveLength(2)
		expect(fields[0]).toMatchObject({
			key: 'apiKey',
			label: 'Api Key',
			type: 'string',
			required: false,
		})
		expect(fields[1]).toMatchObject({
			key: 'model',
			label: 'Model',
			type: 'string',
			required: false,
		})
	})

	it('marks required fields', () => {
		const schema = {
			$schema: 'http://json-schema.org/draft-07/schema#' as const,
			type: 'object' as const,
			properties: {
				apiKey: { type: 'string' as const },
				model: { type: 'string' as const },
			},
			required: ['apiKey'],
		}

		const fields = jsonSchemaToFormFields(schema)

		expect(fields).toHaveLength(2)
		const first = fields.at(0)
		const second = fields.at(1)
		expect(first?.required).toBe(true)
		expect(second?.required).toBe(false)
	})

	it('converts string enum to select options', () => {
		const schema = {
			$schema: 'http://json-schema.org/draft-07/schema#' as const,
			type: 'object' as const,
			properties: {
				model: {
					type: 'string' as const,
					enum: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
				},
			},
		}

		const fields = jsonSchemaToFormFields(schema)

		expect(fields[0]).toMatchObject({
			key: 'model',
			type: 'string',
			options: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
		})
	})

	it('converts number fields', () => {
		const schema = {
			$schema: 'http://json-schema.org/draft-07/schema#' as const,
			type: 'object' as const,
			properties: {
				temperature: { type: 'number' as const },
			},
		}

		const fields = jsonSchemaToFormFields(schema)

		expect(fields[0]).toMatchObject({
			key: 'temperature',
			label: 'Temperature',
			type: 'number',
			required: false,
		})
	})

	it('converts boolean fields', () => {
		const schema = {
			$schema: 'http://json-schema.org/draft-07/schema#' as const,
			type: 'object' as const,
			properties: {
				stream: { type: 'boolean' as const },
			},
		}

		const fields = jsonSchemaToFormFields(schema)

		expect(fields[0]).toMatchObject({
			key: 'stream',
			label: 'Stream',
			type: 'boolean',
			required: false,
		})
	})

	it('preserves descriptions', () => {
		const schema = {
			$schema: 'http://json-schema.org/draft-07/schema#' as const,
			type: 'object' as const,
			properties: {
				apiKey: {
					type: 'string' as const,
					description: 'Your API key',
				},
			},
		}

		const fields = jsonSchemaToFormFields(schema)

		expect(fields).toHaveLength(1)
		const first = fields.at(0)
		expect(first?.description).toBe('Your API key')
	})

	it('handles empty properties', () => {
		const schema = {
			$schema: 'http://json-schema.org/draft-07/schema#' as const,
			type: 'object' as const,
			properties: {},
		}

		const fields = jsonSchemaToFormFields(schema)

		expect(fields).toHaveLength(0)
	})
})
