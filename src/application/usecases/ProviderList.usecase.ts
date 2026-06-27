import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import type { ProviderData } from '@domain/Provider'

class ProviderListUseCase {
	constructor(readonly providerRepository: ProviderRepositoryPort) {}

	async execute(): Promise<Array<Pick<ProviderData, 'id' | 'name'>>> {
		return await this.providerRepository.list()
	}
}

export default ProviderListUseCase
