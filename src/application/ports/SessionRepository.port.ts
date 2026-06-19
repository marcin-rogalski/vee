import type Session from '@domain/Session'

interface SessionRepositoryPort {
	get(id: string): Promise<Session>
	list(): Promise<Array<Pick<Session, 'id' | 'name' | 'agentId'>>>
	listByAgentId(agentId: string): Promise<Array<Pick<Session, 'id' | 'name'>>>
	create(name: string, agentId: string): Promise<Session>
	setName(id: string, name: string): Promise<void>
	delete(id: string): Promise<void>
}

export default SessionRepositoryPort
