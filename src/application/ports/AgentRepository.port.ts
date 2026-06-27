import type { AgentData } from '@domain/Agent'

interface AgentRepositoryPort {
	get(id: string): Promise<AgentData>
	list(): Promise<Array<Pick<AgentData, 'id' | 'name' | 'description'>>>
	listByProviderId(
		providerId: string,
	): Promise<Array<Pick<AgentData, 'id' | 'name'>>>
	save(agent: AgentData): Promise<void>
	delete(id: string): Promise<void>
}

export default AgentRepositoryPort
