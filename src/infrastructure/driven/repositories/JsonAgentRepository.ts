import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type Agent from '@domain/Agent'
import { NotFoundError } from '@domain/errors'
import JsonFileRepository from './JsonFileRepository'

class JsonAgentRepository
	extends JsonFileRepository<Agent>
	implements AgentRepositoryPort
{
	constructor(filePath: string) {
		super(filePath, 'Agent', NotFoundError)
	}

	async get(id: string): Promise<Agent> {
		const agents = await this.read()
		const agent = agents.find((a) => a.id === id)
		if (!agent) {
			throw new NotFoundError('Agent', id)
		}
		return agent
	}

	async list(): Promise<Array<Pick<Agent, 'id' | 'name' | 'description'>>> {
		const agents = await this.read()
		return agents.map((agent) => {
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

	async listByProviderId(
		providerId: string,
	): Promise<Array<Pick<Agent, 'id' | 'name'>>> {
		const agents = await this.read()
		return agents
			.filter((agent) => agent.providerId === providerId)
			.map((agent) => ({ id: agent.id, name: agent.name }))
	}

	async save(agent: Agent): Promise<void> {
		const agents = await this.read()
		const existing = agents.find((a) => a.id === agent.id)
		if (existing) {
			Object.assign(existing, agent)
		} else {
			agents.push(agent)
		}
		await this.write(agents)
	}

	async delete(id: string): Promise<void> {
		const agents = await this.read()
		const filtered = agents.filter((a) => a.id !== id)
		await this.write(filtered)
	}
}

export default JsonAgentRepository
