import type ProviderPort from '@application/ports/Provider.port'
import type ProviderRegistryPort from '@application/ports/ProviderRegistry.port'
import { NotFoundError } from '@domain/errors'
import type { JsonSchemaObject } from '@domain/JsonSchema'
import type Provider from '@domain/Provider'

class ProviderRegistry implements ProviderRegistryPort {
	private readonly providerFactories: Record<string, () => ProviderPort> = {}
	private readonly schemas: Record<string, JsonSchemaObject> = {}

	register(
		type: string,
		factory: () => ProviderPort,
		schema?: JsonSchemaObject,
	): void {
		this.providerFactories[type] = factory
		if (schema) {
			this.schemas[type] = schema
		}
	}

	resolve(provider: Provider): ProviderPort {
		const factory = this.providerFactories[provider.type]
		if (!factory) {
			throw new NotFoundError('Provider type', provider.type)
		}
		return factory()
	}

	schema(type: string): JsonSchemaObject {
		const schema = this.schemas[type]
		if (!schema) {
			throw new NotFoundError('Provider schema', type)
		}
		return schema
	}
}

export default ProviderRegistry
