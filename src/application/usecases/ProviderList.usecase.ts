import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'

class ProviderListUseCase {
	constructor(readonly providerRepository: ProviderRepositoryPort) {}

	async execute(): Promise<Array<Pick<Provider, 'id' | 'name'>>> {
		return await this.providerRepository.list()
	}
}

import type Provider from '@domain/Provider'
export default ProviderListUseCase
