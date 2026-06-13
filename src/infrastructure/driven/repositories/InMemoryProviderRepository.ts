import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import { NotFoundError } from '@domain/errors'
import type Provider from '@domain/Provider'

class InMemoryProviderRepository implements ProviderRepositoryPort {
	private providers: Map<string, Provider> = new Map()

	async get(id: string): Promise<Provider> {
		const provider = this.providers.get(id)
		if (!provider) {
			throw new NotFoundError('Provider', id)
		}
		return provider
	}

	async list(): Promise<Array<Pick<Provider, 'id' | 'name'>>> {
		return Array.from(this.providers.values()).map(({ id, name }) => ({
			id,
			name,
		}))
	}

	async save(provider: Provider): Promise<void> {
		this.providers.set(provider.id, provider)
	}

	async delete(id: string): Promise<void> {
		this.providers.delete(id)
	}
}

export default InMemoryProviderRepository
