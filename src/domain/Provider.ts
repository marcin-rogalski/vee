import type { JsonSchemaObject } from './JsonSchema'

/** Named provider instance with shared base configuration.
 *
 * The `type` field references a provider class registered in ProviderRegistry.
 * The `configSchema` is populated from that class's static CONFIG_SCHEMA.
 * The `config` holds shared values (apiKey, baseUrl) that all agents using this
 * provider instance will inherit.
 */
export type Provider = {
	id: string
	name: string
	type: string
	configSchema: JsonSchemaObject
	config: Record<string, unknown>
}

export default Provider
