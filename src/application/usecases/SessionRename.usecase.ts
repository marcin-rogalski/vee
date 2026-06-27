import type EventBusPort from '@application/ports/EventBus.port'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'

class SessionRenameUseCase {
	constructor(
		readonly sessionRepository: SessionRepositoryPort,
		readonly eventBus: EventBusPort,
	) {}

	async execute(id: string, name: string): Promise<void> {
		await this.sessionRepository.setName(id, name)

		this.eventBus.publish({
			id: crypto.randomUUID(),
			ts: Date.now(),
			role: 'system',
			type: 'session-renamed',
			sessionId: id,
			name,
		})
	}
}

export default SessionRenameUseCase
