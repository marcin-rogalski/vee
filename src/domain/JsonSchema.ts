/** Minimal JSON Schema subset we use for form-driven configuration.
 *
 * We don't import a heavy library — just the TypeScript shape that matches
 * the JSON Schema Draft 2020-12 spec for the features we need:
 *   - object type with properties
 *   - required array
 *   - string / number / boolean property types
 *   - enum for dropdowns
 *   - description for labels
 *   - array type with items (for composition schemas)
 *   - nested object references via $ref
 */

/** A single property definition inside an object schema. */
export type JsonSchemaProperty =
	| {
			type: 'string'
			description?: string | undefined
			/** When present, renders as a dropdown/SelectInput instead of free text. */
			enum?: string[] | undefined
	  }
	| {
			type: 'number'
			description?: string | undefined
	  }
	| {
			type: 'boolean'
			description?: string | undefined
	  }
	| {
			type: 'array'
			description?: string | undefined
			items?: JsonSchemaProperty | undefined
	  }
	| {
			/** Reference to a named schema definition (e.g., "#/definitions/openai/configSchema"). */
			$ref: string
			description?: string | undefined
	  }

/** Top-level JSON Schema object shape we use for provider config schemas. */
export type JsonSchemaObject = {
	$schema:
		| 'https://json-schema.org/draft/2020-12/schema'
		| 'http://json-schema.org/draft-07/schema#'
	type: 'object'
	properties: Record<string, JsonSchemaProperty>
	required?: string[] | undefined
	description?: string | undefined
	/** Named schema definitions for $ref resolution (composition schemas). */
	definitions?: Record<string, JsonSchemaObject> | undefined
	/** Disallow additional properties not defined in `properties`. */
	additionalProperties?: boolean | undefined
}

/** Type guard: checks if a property has a `type` field (i.e., is not a `$ref`). */
export function isTypedProperty(
	prop: JsonSchemaProperty,
): prop is Extract<JsonSchemaProperty, { type: string }> {
	return 'type' in prop
}

/** Type guard: checks if a property is a `$ref`. */
export function isRefProperty(
	prop: JsonSchemaProperty,
): prop is Extract<JsonSchemaProperty, { $ref: string }> {
	return '$ref' in prop
}
