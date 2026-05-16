import type ProviderPort from '@application/ports/Provider.port'
import type ProviderRegistryPort from '@application/ports/ProviderRegistry.port'
import type Provider from '@domain/Provider'

class DefaultProviderRegistry implements ProviderRegistryPort {
	private readonly providerFactories: Record<string, () => ProviderPort> = {}

	register(type: string, factory: () => ProviderPort): void {
		this.providerFactories[type] = factory
	}

	resolve(_provider: Provider): ProviderPort {
		const factory = this.providerFactories[_provider.type]
		if (!factory) {
			throw new Error(`Provider type ${_provider.type} not registered`)
		}
		return factory()
	}
}

export default DefaultProviderRegistry
