import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import { ConflictError } from '@domain/errors'

class ProviderDeleteUseCase {
	constructor(
		readonly providerRepository: ProviderRepositoryPort,
		readonly agentRepository: AgentRepositoryPort,
		readonly eventBus: EventBusPort,
	) {}

	async execute(id: string): Promise<void> {
		const agents = await this.agentRepository.listByProviderId(id)
		if (agents.length > 0) {
			const agentNames = agents.map((a) => a.name).join(', ')
			throw new ConflictError(
				`Cannot delete provider: referenced by agent(s): ${agentNames}`,
				{ agentIds: agents.map((a) => a.id) },
			)
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
