import type Agent from '@domain/Agent'

interface AgentRepositoryPort {
	get(id: string): Promise<Agent>
	list(): Promise<Array<Pick<Agent, 'id' | 'name' | 'description'>>>
	listByProviderId(
		providerId: string,
	): Promise<Array<Pick<Agent, 'id' | 'name'>>>
	save(agent: Agent): Promise<void>
	delete(id: string): Promise<void>
}

export default AgentRepositoryPort
