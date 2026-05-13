import type AgentDto from '@application/dto/Agent.dto'
import type AgentRepositoryPort from '@application/ports/AgentRepository.port'

/**
 * In-memory agent repository — uses AgentDto with default ModelConfigurationDto.
 * Infrastructure adapters can extend ModelConfigurationDto with provider-specific fields.
 */
class InMemoryAgentRepository implements AgentRepositoryPort {
	private agents: Map<string, AgentDto> = new Map()

	async findById(id: string): Promise<AgentDto | null> {
		return this.agents.get(id) ?? null
	}

	async findAll(): Promise<Array<AgentDto>> {
		return Array.from(this.agents.values())
	}

	async save(agent: AgentDto): Promise<void> {
		this.agents.set(agent.id, agent)
	}

	async delete(id: string): Promise<void> {
		this.agents.delete(id)
	}
}

export default InMemoryAgentRepository
