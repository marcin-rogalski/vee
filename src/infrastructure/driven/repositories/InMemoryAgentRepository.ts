import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type Agent from '@domain/Agent'

class InMemoryAgentRepository implements AgentRepositoryPort {
	private agents: Map<string, Agent> = new Map()

	async get(id: string): Promise<Agent> {
		const agent = this.agents.get(id)
		if (!agent) {
			throw new Error(`Agent with id ${id} not found`)
		}
		return agent
	}

	async list(): Promise<Array<Pick<Agent, 'id' | 'name' | 'description'>>> {
		return Array.from(this.agents.values()).map((agent) => {
			const result: Pick<Agent, 'id' | 'name' | 'description'> = {
				id: agent.id,
				name: agent.name,
			}
			if (agent.description !== undefined) {
				result.description = agent.description
			}
			return result
		})
	}

	async save(agent: Agent): Promise<void> {
		this.agents.set(agent.id, agent)
	}

	async delete(id: string): Promise<void> {
		this.agents.delete(id)
	}
}

export default InMemoryAgentRepository
