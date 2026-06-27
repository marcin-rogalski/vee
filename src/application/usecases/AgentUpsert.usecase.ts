import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import type ToolRegistryPort from '@application/ports/ToolRegistry.port'
import type { AgentData } from '@domain/Agent'
import { NotFoundError, ValidationError } from '@domain/errors'

class AgentUpsertUseCase {
	constructor(
		readonly agentRepository: AgentRepositoryPort,
		readonly providerRepository: ProviderRepositoryPort,
		readonly toolRegistry: ToolRegistryPort,
		readonly eventBus: EventBusPort,
	) {}

	async execute(agent: AgentData): Promise<void> {
		await this.providerRepository.get(agent.providerId)

		for (const toolId of agent.toolIds) {
			try {
				this.toolRegistry.get(toolId)
			} catch (error) {
				if (error instanceof NotFoundError) {
					throw new ValidationError({
						tool: `Tool "${toolId}" is not registered`,
					})
				}
				throw error
			}
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
