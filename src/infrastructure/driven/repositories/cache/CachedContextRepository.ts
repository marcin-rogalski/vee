import type ContextRepositoryPort from '@application/ports/ContextRepository.port'
import type ConversationEntry from '@domain/ConversationEntry'
import { isExpired } from './util'

type CacheState = {
	contexts: Record<string, Array<ConversationEntry>>
	timestamp: number
}

class CachedContextRepository implements ContextRepositoryPort {
	private cache: CacheState | null = null

	constructor(
		private readonly delegate: ContextRepositoryPort,
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
		const contexts: Record<string, Array<ConversationEntry>> = {}
		this.cache = { contexts, timestamp: Date.now() }
	}

	async get(sessionId: string): Promise<Array<ConversationEntry>> {
		await this.ensureCache()
		return this.cache?.contexts[sessionId] ?? []
	}

	async append(
		sessionId: string,
		...entries: Array<ConversationEntry>
	): Promise<void> {
		await this.ensureCache()
		if (this.cache) {
			if (!this.cache.contexts[sessionId]) {
				this.cache.contexts[sessionId] = []
			}
			this.cache.contexts[sessionId].push(...entries)
			this.cache.timestamp = Date.now()
		}
		await this.delegate.append(sessionId, ...entries)
	}

	async update(
		sessionId: string,
		entries: Array<ConversationEntry>,
	): Promise<void> {
		await this.ensureCache()
		if (this.cache) {
			this.cache.contexts[sessionId] = entries
			this.cache.timestamp = Date.now()
		}
		await this.delegate.update(sessionId, entries)
	}

	async delete(sessionId: string): Promise<void> {
		await this.ensureCache()
		if (this.cache) {
			delete this.cache.contexts[sessionId]
		}
		await this.delegate.delete(sessionId)
	}
}

export default CachedContextRepository
