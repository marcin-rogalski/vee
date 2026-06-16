import type { JsonSchemaObject } from './JsonSchema'

/** JSON Schema for the `agents.json` persistence file format.
 *
 * This is a *composition* schema that describes the top-level structure
 * of the agents config file. Individual agent `providerOverrides` fields
 * are validated against their provider's type-specific `CONFIG_SCHEMA` at
 * runtime — this schema defines the container shape.
 *
 * Example file content:
 * ```json
 * {
 *   "agents": [
 *     {
 *       "id": "a1",
 *       "name": "My Agent",
 *       "description": "Optional description",
 *       "providerId": "p1",
 *       "systemPrompt": "You are a helpful assistant.",
 *       "providerOverrides": { "model": "gpt-4o" },
 *       "toolIds": ["readFile", "writeFile"]
 *     }
 *   ]
 * }
 * ```
 */
export const AGENTS_CONFIG_SCHEMA: JsonSchemaObject = {
	$schema: 'https://json-schema.org/draft/2020-12/schema',
	type: 'object',
	description: 'Vee agents configuration file',
	properties: {
		agents: {
			type: 'array',
			description: 'List of agent instances',
			items: {
				$ref: '#/definitions/agentInstance',
			},
		},
	},
	required: ['agents'],
	additionalProperties: false,
	definitions: {
		agentInstance: {
			$schema: 'https://json-schema.org/draft/2020-12/schema',
			type: 'object',
			description: 'Single agent instance',
			properties: {
				id: {
					type: 'string',
					description: 'Unique agent instance identifier',
				},
				name: {
					type: 'string',
					description: 'Human-readable agent name',
				},
				description: {
					type: 'string',
					description: 'Optional agent description',
				},
				providerId: {
					type: 'string',
					description: 'Reference to a provider instance ID',
				},
				systemPrompt: {
					type: 'string',
					description: 'System prompt for the agent',
				},
				providerOverrides: {
					$ref: '#/definitions/jsonSchemaObject',
				},
				toolIds: {
					type: 'array',
					description: 'List of tool IDs available to the agent',
					items: {
						type: 'string',
					},
				},
			},
			required: ['id', 'name', 'providerId', 'systemPrompt'],
			additionalProperties: false,
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
				},
				required: {
					type: 'array',
				},
			},
			additionalProperties: true,
		},
	},
}
