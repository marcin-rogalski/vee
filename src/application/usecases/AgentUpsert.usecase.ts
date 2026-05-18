import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'
import type Agent from '@domain/Agent'

class AgentUpsertUseCase {
	constructor(
		readonly agentRepository: AgentRepositoryPort,
		readonly eventBus: EventBusPort,
	) {}

	async execute(agent: Agent): Promise<void> {
		await this.agentRepository.save(agent)
		await this.eventBus.publish({
			id: crypto.randomUUID(),
			ts: Date.now(),
			role: 'system',
			type: 'agent-saved',
			agentId: agent.id,
			name: agent.name,
		})
	}
}
export default AgentUpsertUseCase
