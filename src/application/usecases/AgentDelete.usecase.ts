import type AgentManagerPort from '@application/ports/AgentManager.port'

class AgentDeleteUseCase {
	constructor(readonly agentManager: AgentManagerPort) {
		//
	}

	async execute(id: string): Promise<void> {
		await this.agentManager.delete(id)
	}
}

export default AgentDeleteUseCase
