import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'

class ProviderDeleteUseCase {
	constructor(readonly providerRepository: ProviderRepositoryPort) {}

	async execute(id: string): Promise<void> {
		await this.providerRepository.delete(id)
	}
}

export default ProviderDeleteUseCase
