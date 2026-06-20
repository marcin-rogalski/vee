import type { SessionData } from '@domain/Session'

interface SessionRepositoryPort {
	get(id: string): Promise<SessionData>
	list(): Promise<Array<Pick<SessionData, 'id' | 'name' | 'agentId'>>>
	listByAgentId(
		agentId: string,
	): Promise<Array<Pick<SessionData, 'id' | 'name'>>>
	create(name: string, agentId: string): Promise<SessionData>
	setName(id: string, name: string): Promise<void>
	delete(id: string): Promise<void>
}

export default SessionRepositoryPort
