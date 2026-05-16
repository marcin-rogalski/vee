import type Provider from '@domain/Provider'

interface ProviderRepositoryPort {
	get(id: string): Promise<Provider>
	list(): Promise<Array<Pick<Provider, 'id' | 'name'>>>
	save(provider: Provider): Promise<void>
	delete(id: string): Promise<void>
}

export default ProviderRepositoryPort
