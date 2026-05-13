import type AgentManagerPort from '@application/ports/AgentManager.port'

class AgentListUseCase {
	constructor(readonly agentManager: AgentManagerPort) {
		//
	}

	async execute(): Promise<Array<string>> {
		return await this.agentManager.list()
	}
}

export default AgentListUseCase
