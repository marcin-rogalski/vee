import type AgentDto from '@application/dto/Agent.dto'
import type ModelConfigurationDto from '@application/dto/ModelConfiguration.dto'

interface AgentManagerPort {
	list(): Promise<Array<string>>
	get(id: string): Promise<AgentDto<ModelConfigurationDto>>
	upsert(agent: AgentDto<ModelConfigurationDto>): Promise<void>
	delete(id: string): Promise<void>
}

export default AgentManagerPort
