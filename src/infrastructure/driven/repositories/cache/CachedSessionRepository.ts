import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import { NotFoundError } from '@domain/errors'
import Session, { type SessionData } from '@domain/Session'
import { isExpired } from './util'

type CacheState = {
	sessions: Map<string, Session>
	timestamp: number
}

class CachedSessionRepository implements SessionRepositoryPort {
	private cache: CacheState | null = null

	constructor(
		private readonly delegate: SessionRepositoryPort,
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
		// Rebuild cache from delegate — use list() to get IDs, then hydrate each
		const summaries = await this.delegate.list()
		const sessionMap = new Map<string, Session>()
		for (const s of summaries) {
			const full = await this.delegate.get(s.id)
			sessionMap.set(full.id, new Session(full))
		}
		this.cache = {
			sessions: sessionMap,
			timestamp: Date.now(),
		}
	}

	async get(id: string): Promise<SessionData> {
		await this.ensureCache()
		const session = this.cache?.sessions.get(id)
		if (!session) {
			throw new NotFoundError('Session', id)
		}
		return session.toData()
	}

	async list(): Promise<Array<Pick<Session, 'id' | 'name' | 'agentId'>>> {
		await this.ensureCache()
		return Array.from(this.cache?.sessions.values() ?? []).map((s) => ({
			id: s.id,
			name: s.name,
			agentId: s.agentId,
		}))
	}

	async listByAgentId(
		agentId: string,
	): Promise<Array<Pick<Session, 'id' | 'name'>>> {
		await this.ensureCache()
		return Array.from(this.cache?.sessions.values() ?? [])
			.filter((s) => s.agentId === agentId)
			.map((s) => ({ id: s.id, name: s.name }))
	}

	async create(name: string, agentId: string): Promise<SessionData> {
		const session = await this.delegate.create(name, agentId)
		const sessionObj = new Session(session)
		if (!this.cache) {
			this.cache = { sessions: new Map(), timestamp: Date.now() }
		}
		this.cache.sessions.set(sessionObj.id, sessionObj)
		this.cache.timestamp = Date.now()
		return session
	}

	async setName(id: string, name: string): Promise<void> {
		await this.ensureCache()
		const session = this.cache?.sessions.get(id)
		if (!session) {
			throw new NotFoundError('Session', id)
		}
		session.rename(name)
		await this.delegate.setName(id, name)
	}

	async delete(id: string): Promise<void> {
		await this.ensureCache()
		this.cache?.sessions.delete(id)
		await this.delegate.delete(id)
	}
}

export default CachedSessionRepository
