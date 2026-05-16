import type AgentRepositoryPort from '@application/ports/AgentRepository.port'

class AgentUpsertUseCase {
	constructor(readonly agentRepository: AgentRepositoryPort) {}

	async execute(agent: Agent): Promise<void> {
		await this.agentRepository.save(agent)
	}
}

import type Agent from '@domain/Agent'
export default AgentUpsertUseCase
