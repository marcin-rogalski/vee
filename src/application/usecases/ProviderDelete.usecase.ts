import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'

class ProviderDeleteUseCase {
	constructor(
		readonly providerRepository: ProviderRepositoryPort,
		readonly agentRepository: AgentRepositoryPort,
		readonly eventBus: EventBusPort,
	) {}

	async execute(id: string): Promise<void> {
		// Ensure provider exists before attempting deletion
		await this.providerRepository.get(id)
		const agents = await this.agentRepository.listByProviderId(id)
		for (const agent of agents) {
			await this.agentRepository.delete(agent.id)
		}
		await this.providerRepository.delete(id)
		this.eventBus.publish({
			id: crypto.randomUUID(),
			ts: Date.now(),
			role: 'system',
			type: 'provider-deleted',
			providerId: id,
		})
	}
}

export default ProviderDeleteUseCase
