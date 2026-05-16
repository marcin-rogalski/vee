import type Provider from '@domain/Provider'
import type ProviderPort from './Provider.port'

interface ProviderRegistryPort {
	resolve(provider: Provider): ProviderPort
}

export default ProviderRegistryPort
