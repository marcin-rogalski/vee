import type { JsonSchemaObject } from '@domain/JsonSchema'
import type { ProviderData } from '@domain/Provider'
import type ProviderPort from './Provider.port'

interface ProviderRegistryPort {
	resolve(provider: ProviderData): ProviderPort
	schema(type: string): JsonSchemaObject
	listTypes(): string[]
}

export default ProviderRegistryPort
