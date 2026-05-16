export type Agent = {
	id: string
	name: string
	description?: string | undefined
	providerId: string
	providerConfiguration: Record<string, unknown>
	toolIds: string[]
}

export default Agent
