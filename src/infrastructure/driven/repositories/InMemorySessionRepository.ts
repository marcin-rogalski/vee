import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import { NotFoundError } from '@domain/errors'
import type Session from '@domain/Session'

const SESSION_TTL_MS = 10 * 60 * 1000 // 10 minutes

interface CachedSession {
	session: Session
	expiresAt: number
}

class InMemorySessionRepository implements SessionRepositoryPort {
	protected readonly sessions: Map<string, CachedSession> = new Map()
	protected readonly cleanupTimer: NodeJS.Timeout

	constructor() {
		this.cleanupTimer = setInterval(() => this.cleanup(), 60 * 1000)
		this.cleanupTimer.unref()
	}

	protected cleanup(): void {
		const now = Date.now()
		for (const [id, cached] of this.sessions) {
			if (cached.expiresAt <= now) {
				this.sessions.delete(id)
			}
		}
	}

	async get(id: string): Promise<Session> {
		const cached = this.sessions.get(id)
		if (!cached || cached.expiresAt <= Date.now()) {
			throw new NotFoundError('Session', id)
		}
		cached.expiresAt = Date.now() + SESSION_TTL_MS
		return cached.session
	}

	async list(): Promise<Array<Pick<Session, 'id' | 'name' | 'agentId'>>> {
		const now = Date.now()
		return Array.from(this.sessions.values())
			.filter((cached) => cached.expiresAt > now)
			.map(({ session: { id, name, agentId } }) => ({ id, name, agentId }))
	}

	async create(name: string, agentId: string): Promise<Session> {
		const id = crypto.randomUUID()
		const now = Date.now()
		const session: Session = {
			id,
			name,
			agentId,
			createdAt: now,
			updatedAt: now,
		}
		this.sessions.set(id, { session, expiresAt: now + SESSION_TTL_MS })
		return session
	}

	async setName(id: string, name: string): Promise<void> {
		const cached = this.sessions.get(id)
		if (!cached) {
			throw new NotFoundError('Session', id)
		}
		cached.session.name = name
		cached.session.updatedAt = Date.now()
	}

	async delete(id: string): Promise<void> {
		this.sessions.delete(id)
	}

	destroy(): void {
		clearInterval(this.cleanupTimer)
	}
}

export default InMemorySessionRepository
