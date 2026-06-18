import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import { NotFoundError } from '@domain/errors'
import type Session from '@domain/Session'
import JsonFileRepository from './JsonFileRepository'

class JsonSessionRepository
	extends JsonFileRepository<Session, Pick<Session, 'id' | 'name' | 'agentId'>>
	implements SessionRepositoryPort
{
	constructor(filePath: string) {
		super(filePath, 'Session', NotFoundError)
	}

	validateItem(item: unknown): boolean {
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

	async save(session: Session): Promise<void> {
		const sessions = await this.read()
		const existing = sessions.find((s) => s.id === session.id)
		if (existing) {
			Object.assign(existing, session)
		} else {
			sessions.push(session)
		}
		await this.write(sessions)
	}
}

export default JsonSessionRepository
