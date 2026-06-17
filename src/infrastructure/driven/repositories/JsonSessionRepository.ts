import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import { NotFoundError } from '@domain/errors'
import type Session from '@domain/Session'

class JsonSessionRepository implements SessionRepositoryPort {
	constructor(protected readonly filePath: string) {}

	protected async read(): Promise<Session[]> {
		try {
			const raw = await readFile(this.filePath, 'utf-8')
			const items: unknown[] = JSON.parse(raw)
			return items.filter((item) => {
				if (this.isValidSession(item as Session)) {
					return true
				}
				console.warn('[Session] Invalid item filtered:', item)
				return false
			}) as Session[]
		} catch (error) {
			if (
				error instanceof Error &&
				'code' in error &&
				error.code === 'ENOENT'
			) {
				return []
			}
			throw error
		}
	}

	private isValidSession(item: unknown): boolean {
		if (typeof item !== 'object' || item === null) {
			return false
		}
		const obj = item as Record<string, unknown>
		return (
			typeof obj.id === 'string' &&
			typeof obj.name === 'string' &&
			typeof obj.agentId === 'string' &&
			typeof obj.createdAt === 'number'
		)
	}

	protected async write(items: Session[]): Promise<void> {
		await mkdir(dirname(this.filePath), { recursive: true })
		await writeFile(this.filePath, JSON.stringify(items, null, 2), 'utf-8')
	}

	async get(id: string): Promise<Session> {
		const sessions = await this.read()
		const session = sessions.find((s) => s.id === id)
		if (!session) {
			throw new NotFoundError('Session', id)
		}
		return session
	}

	async list(): Promise<Array<Pick<Session, 'id' | 'name' | 'agentId'>>> {
		const sessions = await this.read()
		return sessions.map((session) => ({
			id: session.id,
			name: session.name,
			agentId: session.agentId,
		}))
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
		const sessions = await this.read()
		sessions.push(session)
		await this.write(sessions)
		return session
	}

	async setName(id: string, name: string): Promise<void> {
		const sessions = await this.read()
		const session = sessions.find((s) => s.id === id)
		if (!session) {
			throw new NotFoundError('Session', id)
		}
		session.name = name
		session.updatedAt = Date.now()
		await this.write(sessions)
	}

	async delete(id: string): Promise<void> {
		const sessions = await this.read()
		const filtered = sessions.filter((s) => s.id !== id)
		await this.write(filtered)
	}
}

export default JsonSessionRepository
