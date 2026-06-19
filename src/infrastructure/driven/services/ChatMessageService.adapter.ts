import type ChatMessageRepositoryPort from '@application/ports/ChatMessageRepository.port'
import type ChatMessageService from '@application/ports/ChatMessageService.port'
import type { ChatMessage } from '@domain/ChatMessage'

/** Infrastructure adapter that implements ChatMessageService using ChatMessageRepositoryPort. */
class ChatMessageServiceAdapter implements ChatMessageService {
	constructor(private readonly repository: ChatMessageRepositoryPort) {}

	async create(message: ChatMessage): Promise<void> {
		await this.repository.create(message)
	}

	async getBySession(sessionId: string): Promise<Array<ChatMessage>> {
		return this.repository.getBySession(sessionId)
	}

	async deleteBySession(sessionId: string): Promise<void> {
		await this.repository.deleteBySession(sessionId)
	}
}

export default ChatMessageServiceAdapter
