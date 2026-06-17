import type EventBusPort from '@application/ports/EventBus.port'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'

class SessionCreateUseCase {
	constructor(
		readonly sessionRepository: SessionRepositoryPort,
		readonly eventBus: EventBusPort,
	) {}

	async execute(name?: string, agentId?: string): Promise<string> {
		const safeName = typeof name === 'string' ? name : ''
		if (!agentId) {
			throw new Error('agentId is required for session creation')
		}
		const session = await this.sessionRepository.create(safeName, agentId)

		this.eventBus.publish({
			id: crypto.randomUUID(),
			ts: Date.now(),
			role: 'system',
			type: 'session-created',
			sessionId: session.id,
			name: session.name,
			agentId: session.agentId,
		})

		return session.id
	}
}

export default SessionCreateUseCase
