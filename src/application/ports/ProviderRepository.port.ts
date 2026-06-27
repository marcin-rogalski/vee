import type { ProviderData } from '@domain/Provider'

interface ProviderRepositoryPort {
	get(id: string): Promise<ProviderData>
	list(): Promise<Array<Pick<ProviderData, 'id' | 'name'>>>
	save(provider: ProviderData): Promise<void>
	delete(id: string): Promise<void>
}

export default ProviderRepositoryPort
