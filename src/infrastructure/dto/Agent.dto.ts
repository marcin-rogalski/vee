interface AgentDto {
	id: string
	name: string
	description?: string
	providerId: string
	providerConfiguration: Record<string, unknown>
	toolIds: string[]
}

export default AgentDto
