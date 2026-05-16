import type ContextRepositoryPort from '@application/ports/ContextRepository.port'
import type ConversationEntry from '@domain/ConversationEntry'

class InMemoryContextRepository implements ContextRepositoryPort {
	private readonly contexts: Map<string, Array<ConversationEntry>> = new Map()

	async get(sessionId: string): Promise<Array<ConversationEntry>> {
		const entries = this.contexts.get(sessionId)
		if (!entries) return []
		return [...entries]
	}

	async append(
		sessionId: string,
		...entries: Array<ConversationEntry>
	): Promise<void> {
		const context = this.contexts.get(sessionId)
		if (!context) {
			this.contexts.set(sessionId, [...entries])
		} else {
			this.contexts.set(sessionId, [...context, ...entries])
		}
	}

	async update(
		sessionId: string,
		entries: Array<ConversationEntry>,
	): Promise<void> {
		this.contexts.set(sessionId, [...entries])
	}

	async delete(sessionId: string): Promise<void> {
		this.contexts.delete(sessionId)
	}
}

export default InMemoryContextRepository
