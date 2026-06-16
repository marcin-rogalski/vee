interface AgentDto {
	id: string
	name: string
	description?: string
	providerId: string
	providerOverrides: Record<string, unknown>
	toolIds: string[]
}

export default AgentDto
