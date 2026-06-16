export type ChatMessage = {
	id: string
	sessionId: string
	role: 'user' | 'assistant' | 'system'
	content: string
	ts: number
}

interface ChatMessageRepositoryPort {
	getBySession(sessionId: string): Promise<Array<ChatMessage>>
	create(message: ChatMessage): Promise<void>
	deleteBySession(sessionId: string): Promise<void>
}

export default ChatMessageRepositoryPort
