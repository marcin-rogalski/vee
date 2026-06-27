import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type LoggerPort from '@application/ports/Logger.port'
import type { AgentData } from '@domain/Agent'
import { NotFoundError } from '@domain/errors'
import JsonFileRepository from './JsonFileRepository'

class JsonAgentRepository
	extends JsonFileRepository<
		AgentData,
		Pick<AgentData, 'id' | 'name' | 'description'>
	>
	implements AgentRepositoryPort
{
	constructor(filePath: string, logger: LoggerPort) {
		super(filePath, 'Agent', NotFoundError, logger)
	}

	validateItem(item: unknown): boolean {
		if (typeof item !== 'object' || item === null) {
			return false
		}
		const obj = item as Record<string, unknown>
		return (
			typeof obj.id === 'string' &&
			typeof obj.name === 'string' &&
			typeof obj.systemPrompt === 'string' &&
			typeof obj.providerId === 'string'
		)
	}

	async get(id: string): Promise<AgentData> {
		const agents = await this.read()
		const data = agents.find((a) => a.id === id)
		if (!data) {
			throw new NotFoundError('Agent', id)
		}
		return data
	}

	async list(): Promise<Array<Pick<AgentData, 'id' | 'name' | 'description'>>> {
		const agents = await this.read()
		return agents.map((agent) => {
			const result: Pick<AgentData, 'id' | 'name' | 'description'> = {
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
	): Promise<Array<Pick<AgentData, 'id' | 'name'>>> {
		const agents = await this.read()
		return agents
			.filter((agent) => agent.providerId === providerId)
			.map((agent) => ({ id: agent.id, name: agent.name }))
	}

	async save(agent: AgentData): Promise<void> {
		const agents = await this.read()
		const existing = agents.find((a) => a.id === agent.id)
		if (existing) {
			Object.assign(existing, agent)
		} else {
			agents.push(this.ensureId(agent))
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
