import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type { AgentData } from '@domain/Agent'

class AgentListUseCase {
	constructor(readonly agentRepository: AgentRepositoryPort) {}

	async execute(): Promise<
		Array<Pick<AgentData, 'id' | 'name' | 'description'>>
	> {
		return await this.agentRepository.list()
	}
}

export default AgentListUseCase
