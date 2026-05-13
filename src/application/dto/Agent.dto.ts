import type ModelConfigurationDto from '@application/dto/ModelConfiguration.dto'

interface AgentDto<
	ModelConfiguration extends ModelConfigurationDto = ModelConfigurationDto,
> {
	id: string
	integrationId: string
	model: ModelConfiguration
}

export default AgentDto
