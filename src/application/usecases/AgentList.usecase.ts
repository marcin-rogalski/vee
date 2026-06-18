import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type Agent from '@domain/Agent'

class AgentListUseCase {
	constructor(readonly agentRepository: AgentRepositoryPort) {}

	async execute(): Promise<Array<Pick<Agent, 'id' | 'name' | 'description'>>> {
		return await this.agentRepository.list()
	}
}

export default AgentListUseCase
