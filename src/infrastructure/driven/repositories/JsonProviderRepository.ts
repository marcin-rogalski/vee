import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import { NotFoundError } from '@domain/errors'
import type Provider from '@domain/Provider'
import JsonFileRepository from './JsonFileRepository'

class JsonProviderRepository
	extends JsonFileRepository<Provider, Pick<Provider, 'id' | 'name'>>
	implements ProviderRepositoryPort
{
	constructor(filePath: string) {
		super(filePath, 'Provider', NotFoundError)
	}

	validateItem(item: unknown): boolean {
		if (typeof item !== 'object' || item === null) {
			return false
		}
		const obj = item as Record<string, unknown>
		return (
			typeof obj.id === 'string' &&
			typeof obj.name === 'string' &&
			typeof obj.type === 'string' &&
			typeof obj.configSchema === 'object' &&
			obj.configSchema !== null &&
			typeof obj.config === 'object' &&
			obj.config !== null
		)
	}

	async get(id: string): Promise<Provider> {
		const providers = await this.read()
		const provider = providers.find((p) => p.id === id)
		if (!provider) {
			throw new NotFoundError('Provider', id)
		}
		return provider
	}

	async list(): Promise<Array<Pick<Provider, 'id' | 'name'>>> {
		const providers = await this.read()
		return providers.map(({ id, name }) => ({ id, name }))
	}

	async save(provider: Provider): Promise<void> {
		const providers = await this.read()
		const existing = providers.find((p) => p.id === provider.id)
		if (existing) {
			Object.assign(existing, provider)
		} else {
			providers.push(provider)
		}
		await this.write(providers)
	}

	async delete(id: string): Promise<void> {
		const providers = await this.read()
		const filtered = providers.filter((p) => p.id !== id)
		await this.write(filtered)
	}
}

export default JsonProviderRepository
