import type { JsonSchemaObject } from './JsonSchema'

/** JSON Schema for the `providers.json` persistence file format.
 *
 * This is a *composition* schema that describes the top-level structure
 * of the providers config file. Individual provider `config` fields are
 * validated against their type-specific `CONFIG_SCHEMA` from the
 * ProviderRegistry — this schema defines the container shape.
 *
 * Example file content:
 * ```json
 * {
 *   "providers": [
 *     {
 *       "id": "p1",
 *       "name": "My OpenAI",
 *       "type": "openai",
 *       "configSchema": { "$schema": "...", "type": "object", "properties": { ... } },
 *       "config": { "apiKey": "sk-...", "model": "gpt-4o" }
 *     }
 *   ]
 * }
 * ```
 */
export const PROVIDERS_CONFIG_SCHEMA: JsonSchemaObject = {
	$schema: 'https://json-schema.org/draft/2020-12/schema',
	type: 'object',
	description: 'Vee providers configuration file',
	properties: {
		providers: {
			type: 'array',
			description: 'List of provider instances',
			items: {
				$ref: '#/definitions/providerInstance',
			},
		},
	},
	required: ['providers'],
	definitions: {
		providerInstance: {
			$schema: 'https://json-schema.org/draft/2020-12/schema',
			type: 'object',
			description: 'Single provider instance',
			properties: {
				id: {
					type: 'string',
					description: 'Unique provider instance identifier',
				},
				name: {
					type: 'string',
					description: 'Human-readable provider name',
				},
				type: {
					type: 'string',
					description: 'Provider type key (matches registry)',
				},
				configSchema: {
					$ref: '#/definitions/jsonSchemaObject',
				},
				config: {
					$ref: '#/definitions/jsonSchemaObject',
				},
			},
			required: ['id', 'name', 'type', 'configSchema', 'config'],
		},
		jsonSchemaObject: {
			$schema: 'https://json-schema.org/draft/2020-12/schema',
			type: 'object',
			description: 'JSON Schema object (generic)',
			properties: {
				$schema: {
					type: 'string',
					description: 'JSON Schema draft URI',
				},
				type: {
					type: 'string',
					description: 'Schema type',
				},
				properties: {
					type: 'string',
					description: 'Property definitions',
				},
				required: {
					type: 'string',
					description: 'Required property names',
				},
			},
		},
	},
}
