import type ChatMessageRepositoryPort from '@application/ports/ChatMessageRepository.port'
import type ContextRepositoryPort from '@application/ports/ContextRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'

class SessionDeleteUseCase {
	constructor(
		readonly sessionRepository: SessionRepositoryPort,
		readonly contextRepository: ContextRepositoryPort,
		readonly chatMessageRepository: ChatMessageRepositoryPort,
		readonly eventBus: EventBusPort,
	) {}

	async execute(id: string): Promise<void> {
		await this.sessionRepository.delete(id)
		await this.contextRepository.delete(id)
		await this.chatMessageRepository.deleteBySession(id)
		await this.eventBus.publish({
			id: crypto.randomUUID(),
			ts: Date.now(),
			role: 'system',
			type: 'session-deleted',
			sessionId: id,
		})
	}
}

export default SessionDeleteUseCase
