import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'

class AgentDeleteUseCase {
	constructor(
		readonly agentRepository: AgentRepositoryPort,
		readonly eventBus: EventBusPort,
	) {}

	async execute(id: string): Promise<void> {
		await this.agentRepository.delete(id)
		await this.eventBus.publish({
			id: crypto.randomUUID(),
			ts: Date.now(),
			role: 'system',
			type: 'agent-deleted',
			agentId: id,
		})
	}
}

export default AgentDeleteUseCase
