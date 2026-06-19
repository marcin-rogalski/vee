import type { ChatMessage } from '@domain/ChatMessage'

interface ChatMessageRepositoryPort {
	getBySession(sessionId: string): Promise<Array<ChatMessage>>
	listAll(): Promise<Array<ChatMessage>>
	create(message: ChatMessage): Promise<void>
	deleteBySession(sessionId: string): Promise<void>
}

export default ChatMessageRepositoryPort
