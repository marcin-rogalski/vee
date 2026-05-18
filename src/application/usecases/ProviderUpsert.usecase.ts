import type EventBusPort from '@application/ports/EventBus.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import type Provider from '@domain/Provider'

class ProviderUpsertUseCase {
	constructor(
		readonly providerRepository: ProviderRepositoryPort,
		readonly eventBus: EventBusPort,
	) {}

	async execute(provider: Provider): Promise<void> {
		await this.providerRepository.save(provider)
		await this.eventBus.publish({
			id: crypto.randomUUID(),
			ts: Date.now(),
			role: 'system',
			type: 'provider-saved',
			providerId: provider.id,
			name: provider.name,
		})
	}
}

export default ProviderUpsertUseCase
