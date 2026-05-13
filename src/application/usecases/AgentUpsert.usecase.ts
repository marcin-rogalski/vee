import type AgentDto from '@application/dto/Agent.dto'
import type ModelConfigurationDto from '@application/dto/ModelConfiguration.dto'
import type AgentManagerPort from '@application/ports/AgentManager.port'

class AgentUpsertUseCase {
	constructor(readonly agentManager: AgentManagerPort) {
		//
	}

	async execute(agent: AgentDto<ModelConfigurationDto>): Promise<void> {
		await this.agentManager.upsert(agent)
	}
}

export default AgentUpsertUseCase
