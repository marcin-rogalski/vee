import type ConversationEntry from '@domain/ConversationEntry'

interface ContextRepositoryPort {
	get(sessionId: string): Promise<Array<ConversationEntry>>
	append(sessionId: string, ...entries: Array<ConversationEntry>): Promise<void>
	update(sessionId: string, entries: Array<ConversationEntry>): Promise<void>
	delete(sessionId: string): Promise<void>
}

export default ContextRepositoryPort
