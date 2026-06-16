import type { JsonSchemaObject } from '@domain/JsonSchema'
import type Provider from '@domain/Provider'
import type ProviderPort from './Provider.port'

interface ProviderRegistryPort {
	resolve(provider: Provider): ProviderPort
	schema(type: string): JsonSchemaObject
}

export default ProviderRegistryPort
