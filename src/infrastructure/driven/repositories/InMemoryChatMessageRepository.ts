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
		const index = this.messages.findIndex((m) => m.sessionId === sessionId)
		if (index !== -1) {
			this.messages.splice(index, this.messages.length)
		}
	}
}

export default InMemoryChatMessageRepository
