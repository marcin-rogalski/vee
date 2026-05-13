import { randomUUID } from 'node:crypto'
import type ContextEntryDto from '@application/dto/ContextEntry.dto'
import type ChatSessionDto from '@application/dto/Session.dto'
import type SessionManagerPort from '@application/ports/SessionManager.port'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'

const SESSION_TTL_MS = 10 * 60 * 1000 // 10 minutes
const FLUSH_INTERVAL_MS = 1000 // 1 second

interface CachedSession {
	session: ChatSessionDto
	expiresAt: number
	pendingFlush: Promise<void> | null
}

class SessionManager implements SessionManagerPort {
	private readonly sessions: Map<string, CachedSession> = new Map()
	private readonly cleanupTimer: NodeJS.Timeout

	constructor(private readonly sessionRepository: SessionRepositoryPort) {
		this.cleanupTimer = setInterval(() => this.cleanup(), 60 * 1000)

		process.once('SIGINT', this.destroy.bind(this))
		process.once('SIGTERM', this.destroy.bind(this))
	}

	async get(id: string): Promise<ChatSessionDto> {
		const cached = this.sessions.get(id)
		if (cached) {
			cached.expiresAt = Date.now() + SESSION_TTL_MS
			return cached.session
		}

		const existing = await this.sessionRepository.findById(id)
		if (existing) {
			this.sessions.set(id, {
				session: existing,
				expiresAt: Date.now() + SESSION_TTL_MS,
				pendingFlush: null,
			})
			return existing
		}

		throw new Error(`Session with id ${id} not found`)
	}

	async create(): Promise<ChatSessionDto> {
		const id = randomUUID()
		const now = Date.now()
		const session: ChatSessionDto = {
			id,
			name: `Session ${id}`,
			history: [],
			createdAt: now,
			updatedAt: now,
		}
		await this.sessionRepository.save(session)

		this.sessions.set(id, {
			session,
			expiresAt: Date.now() + SESSION_TTL_MS,
			pendingFlush: null,
		})

		return session
	}

	async append(id: string, ...messages: ContextEntryDto[]): Promise<void> {
		const cached = this.sessions.get(id)
		if (!cached) {
			throw new Error(`Session with id ${id} not found in cache`)
		}

		cached.session.history.push(...messages)
		cached.session.updatedAt = Date.now()
		cached.expiresAt = Date.now() + SESSION_TTL_MS

		if (!cached.pendingFlush) {
			cached.pendingFlush = this.startFlushWindow(cached)
		}

		return cached.pendingFlush
	}

	private startFlushWindow(cached: CachedSession): Promise<void> {
		return new Promise<void>((resolve, reject) =>
			setTimeout(async () => {
				try {
					await this.sessionRepository.save(cached.session)
					// Clear pending flush on success
					cached.pendingFlush = null
					resolve()
				} catch (err) {
					// Reject and propagate error to caller
					cached.pendingFlush = null
					reject(err)
				}
			}, FLUSH_INTERVAL_MS).unref(),
		)
	}

	private cleanup(): void {
		const now = Date.now()
		for (const [id, cached] of this.sessions) {
			// Keep sessions with pending flushes in cache
			if (cached.pendingFlush) {
				continue
			}
			if (cached.expiresAt <= now) {
				this.sessions.delete(id)
			}
		}
	}

	async destroy(): Promise<void> {
		clearInterval(this.cleanupTimer)

		const pendingSaves: Promise<void>[] = []

		for (const [, cached] of this.sessions) {
			if (cached.pendingFlush) {
				pendingSaves.push(cached.pendingFlush)
			}
		}

		await Promise.all(pendingSaves)
	}
}

export default SessionManager
