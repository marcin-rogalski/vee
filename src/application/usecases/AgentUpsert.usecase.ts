import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import type ToolRegistryPort from '@application/ports/ToolRgistry.port'
import type Agent from '@domain/Agent'

class AgentUpsertUseCase {
	constructor(
		readonly agentRepository: AgentRepositoryPort,
		readonly providerRepository: ProviderRepositoryPort,
		readonly toolRegistry: ToolRegistryPort,
		readonly eventBus: EventBusPort,
	) {}

	async execute(agent: Agent): Promise<void> {
		await this.providerRepository.get(agent.providerId)

		for (const toolId of agent.toolIds) {
			this.toolRegistry.get(toolId)
		}

		await this.agentRepository.save(agent)
		this.eventBus.publish({
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
