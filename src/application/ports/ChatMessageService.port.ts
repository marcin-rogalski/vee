import type { ChatMessage } from '@domain/ChatMessage'

/** Service for chat message persistence (append-only, UI display). */
interface ChatMessageService {
	create(message: ChatMessage): Promise<void>
	getBySession(sessionId: string): Promise<Array<ChatMessage>>
	deleteBySession(sessionId: string): Promise<void>
}

export default ChatMessageService
