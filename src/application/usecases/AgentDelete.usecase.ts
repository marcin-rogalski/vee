import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'

class AgentDeleteUseCase {
	constructor(
		readonly agentRepository: AgentRepositoryPort,
		readonly sessionRepository: SessionRepositoryPort,
		readonly eventBus: EventBusPort,
	) {}

	async execute(id: string): Promise<void> {
		const sessions = await this.sessionRepository.list()
		const agentSessions = sessions.filter((s) => s.agentId === id)
		for (const session of agentSessions) {
			await this.sessionRepository.delete(session.id)
		}
		await this.agentRepository.delete(id)
		this.eventBus.publish({
			id: crypto.randomUUID(),
			ts: Date.now(),
			role: 'system',
			type: 'agent-deleted',
			agentId: id,
		})
	}
}

export default AgentDeleteUseCase
