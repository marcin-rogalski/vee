import type EventBusPort from '@application/ports/EventBus.port'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'

class SessionCreateUseCase {
	constructor(
		readonly sessionRepository: SessionRepositoryPort,
		readonly eventBus: EventBusPort,
	) {}

	async execute(name?: string): Promise<string> {
		const safeName = typeof name === 'string' ? name : ''
		const session = await this.sessionRepository.create(safeName)

		this.eventBus.publish({
			id: crypto.randomUUID(),
			ts: Date.now(),
			role: 'system',
			type: 'session-created',
			sessionId: session.id,
			name: session.name,
		})

		return session.id
	}
}

export default SessionCreateUseCase
