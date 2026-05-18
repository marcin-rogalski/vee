import type EventBusPort from '@application/ports/EventBus.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'

class ProviderDeleteUseCase {
	constructor(
		readonly providerRepository: ProviderRepositoryPort,
		readonly eventBus: EventBusPort,
	) {}

	async execute(id: string): Promise<void> {
		await this.providerRepository.delete(id)
		await this.eventBus.publish({
			id: crypto.randomUUID(),
			ts: Date.now(),
			role: 'system',
			type: 'provider-deleted',
			providerId: id,
		})
	}
}

export default ProviderDeleteUseCase
