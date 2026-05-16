import type AgentRepositoryPort from '@application/ports/AgentRepository.port'

class AgentListUseCase {
	constructor(readonly agentRepository: AgentRepositoryPort) {}

	async execute(): Promise<Array<Pick<Agent, 'id' | 'name' | 'description'>>> {
		return await this.agentRepository.list()
	}
}

import type Agent from '@domain/Agent'
export default AgentListUseCase
