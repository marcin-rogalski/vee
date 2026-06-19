import type ChatMessageRepositoryPort from '@application/ports/ChatMessageRepository.port'
import type { ChatMessage } from '@domain/ChatMessage'
import { isExpired } from './util'

type CacheState = {
	messages: Map<string, ChatMessage>
	timestamp: number
}

class CachedChatMessageRepository implements ChatMessageRepositoryPort {
	private cache: CacheState | null = null

	constructor(
		private readonly delegate: ChatMessageRepositoryPort,
		private readonly ttl: number,
	) {}

	private isCacheFresh(): boolean {
		if (!this.cache) {
			return false
		}
		return !isExpired(this.cache, this.ttl)
	}

	private async ensureCache(): Promise<void> {
		if (this.isCacheFresh()) {
			return
		}
		const messages = await this.delegate.listAll()
		const messageMap = new Map<string, ChatMessage>()
		for (const m of messages) {
			messageMap.set(m.id, m)
		}
		this.cache = { messages: messageMap, timestamp: Date.now() }
	}

	async getBySession(sessionId: string): Promise<Array<ChatMessage>> {
		await this.ensureCache()
		return Array.from(this.cache?.messages.values() ?? []).filter(
			(m) => m.sessionId === sessionId,
		)
	}

	async create(message: ChatMessage): Promise<void> {
		await this.ensureCache()
		if (this.cache) {
			this.cache.messages.set(message.id, message)
			this.cache.timestamp = Date.now()
		}
		await this.delegate.create(message)
	}

	async listAll(): Promise<Array<ChatMessage>> {
		await this.ensureCache()
		return Array.from(this.cache?.messages.values() ?? [])
	}

	async deleteBySession(sessionId: string): Promise<void> {
		await this.ensureCache()
		if (this.cache) {
			for (const [id, m] of this.cache.messages) {
				if (m.sessionId === sessionId) {
					this.cache.messages.delete(id)
				}
			}
		}
		await this.delegate.deleteBySession(sessionId)
	}
}

export default CachedChatMessageRepository
