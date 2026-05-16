import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'

class ProviderUpsertUseCase {
	constructor(readonly providerRepository: ProviderRepositoryPort) {}

	async execute(provider: Provider): Promise<void> {
		await this.providerRepository.save(provider)
	}
}

import type Provider from '@domain/Provider'
export default ProviderUpsertUseCase
