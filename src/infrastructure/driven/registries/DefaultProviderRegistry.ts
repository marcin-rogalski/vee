import type ProviderPort from '@application/ports/Provider.port'
import type ProviderRegistryPort from '@application/ports/ProviderRegistry.port'
import { NotFoundError } from '@domain/errors'
import type Provider from '@domain/Provider'

class DefaultProviderRegistry implements ProviderRegistryPort {
	private readonly providerFactories: Record<string, () => ProviderPort> = {}

	register(type: string, factory: () => ProviderPort): void {
		this.providerFactories[type] = factory
	}

	resolve(provider: Provider): ProviderPort {
		const factory = this.providerFactories[provider.type]
		if (!factory) {
			throw new NotFoundError('Provider type', provider.type)
		}
		return factory()
	}
}

export default DefaultProviderRegistry
