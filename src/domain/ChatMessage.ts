export type ChatMessage = {
	id: string
	sessionId: string
	role: 'user' | 'assistant' | 'system'
	content: string
	ts: number
}

export default ChatMessage
