import type AgentDto from '@application/dto/Agent.dto'

interface AgentRepositoryPort {
	findById(id: string): Promise<AgentDto | null>
	findAll(): Promise<Array<AgentDto>>
	save(agent: AgentDto): Promise<void>
	delete(id: string): Promise<void>
}

export default AgentRepositoryPort
