import type AgentRepositoryPort from '@application/ports/AgentRepository.port'

class AgentDeleteUseCase {
	constructor(readonly agentRepository: AgentRepositoryPort) {}

	async execute(id: string): Promise<void> {
		await this.agentRepository.delete(id)
	}
}

export default AgentDeleteUseCase
