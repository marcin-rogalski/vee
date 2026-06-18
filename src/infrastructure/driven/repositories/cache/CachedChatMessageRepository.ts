import type ChatMessageRepositoryPort from '@application/ports/ChatMessageRepository.port'
import type { ChatMessage } from '@application/ports/ChatMessageRepository.port'
import { isExpired } from './util'

type CacheState = {
	messages: Array<ChatMessage>
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
		this.cache = { messages, timestamp: Date.now() }
	}

	async getBySession(sessionId: string): Promise<Array<ChatMessage>> {
		await this.ensureCache()
		return this.cache?.messages.filter((m) => m.sessionId === sessionId) ?? []
	}

	async create(message: ChatMessage): Promise<void> {
		await this.ensureCache()
		if (this.cache) {
			this.cache.messages.push(message)
			this.cache.timestamp = Date.now()
		}
		await this.delegate.create(message)
	}

	async listAll(): Promise<Array<ChatMessage>> {
		await this.ensureCache()
		return this.cache?.messages ?? []
	}

	async deleteBySession(sessionId: string): Promise<void> {
		await this.ensureCache()
		if (this.cache) {
			this.cache.messages = this.cache.messages.filter(
				(m) => m.sessionId !== sessionId,
			)
		}
		await this.delegate.deleteBySession(sessionId)
	}
}

export default CachedChatMessageRepository
