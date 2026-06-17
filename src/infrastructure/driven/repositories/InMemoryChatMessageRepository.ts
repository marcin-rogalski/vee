import type ChatMessageRepositoryPort from '../../../application/ports/ChatMessageRepository.port'
import type { ChatMessage } from '../../../application/ports/ChatMessageRepository.port'

class InMemoryChatMessageRepository implements ChatMessageRepositoryPort {
	private readonly messages: Array<ChatMessage> = []

	async getBySession(sessionId: string): Promise<Array<ChatMessage>> {
		return this.messages.filter((m) => m.sessionId === sessionId)
	}

	async create(message: ChatMessage): Promise<void> {
		this.messages.push(message)
	}

	async deleteBySession(sessionId: string): Promise<void> {
		this.messages.splice(
			0,
			this.messages.length,
			...this.messages.filter((m) => m.sessionId !== sessionId),
		)
	}
}

export default InMemoryChatMessageRepository
