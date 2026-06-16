import type { JsonSchemaObject } from '@domain/JsonSchema'
import { isTypedProperty } from '@domain/JsonSchema'

export type FormField =
	| {
			key: string
			label: string
			type: 'string'
			required: boolean
			description?: string | undefined
			options?: string[] | undefined
	  }
	| {
			key: string
			label: string
			type: 'number'
			required: boolean
			description?: string | undefined
	  }
	| {
			key: string
			label: string
			type: 'boolean'
			required: boolean
			description?: string | undefined
	  }

/**
 * Decodes a JSON Schema object into an array of simple form field definitions
 * suitable for Ink rendering.
 */
export function jsonSchemaToFormFields(schema: JsonSchemaObject): FormField[] {
	const required = new Set(schema.required ?? [])

	return Object.entries(schema.properties).map(([key, prop]) => {
		const base = {
			key,
			label: key
				.replace(/([A-Z])/g, ' $1')
				.replace(/^./, (s) => s.toUpperCase()),
			required: required.has(key),
			description: prop.description,
		}

		if (!isTypedProperty(prop)) {
			return { ...base, type: 'string' as const }
		}

		if (prop.type === 'string' && prop.enum) {
			return { ...base, type: 'string' as const, options: prop.enum }
		}

		if (prop.type === 'string') {
			return { ...base, type: 'string' as const }
		}

		if (prop.type === 'number') {
			return { ...base, type: 'number' as const }
		}

		if (prop.type === 'boolean') {
			return { ...base, type: 'boolean' as const }
		}

		// Fallback for unsupported types (array, etc.)
		return { ...base, type: 'string' as const }
	})
}
