import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import { NotFoundError } from '@domain/errors'
import Session, { type SessionData } from '@domain/Session'
import JsonFileRepository from './JsonFileRepository'

class JsonSessionRepository
	extends JsonFileRepository<
		SessionData,
		Pick<SessionData, 'id' | 'name' | 'agentId'>
	>
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

	async get(id: string): Promise<SessionData> {
		const sessions = await this.read()
		const data = sessions.find((s) => s.id === id)
		if (!data) {
			throw new NotFoundError('Session', id)
		}
		return data
	}

	async list(): Promise<Array<Pick<Session, 'id' | 'name' | 'agentId'>>> {
		const sessions = await this.read()
		return sessions.map((session) => ({
			id: session.id,
			name: session.name,
			agentId: session.agentId,
		}))
	}

	async listByAgentId(
		agentId: string,
	): Promise<Array<Pick<Session, 'id' | 'name'>>> {
		const sessions = await this.read()
		return sessions
			.filter((s) => s.agentId === agentId)
			.map((s) => ({ id: s.id, name: s.name }))
	}

	async create(name: string, agentId: string): Promise<SessionData> {
		const session = new Session({ name, agentId })
		const data = session.toData()
		const sessions = await this.read()
		sessions.push(data)
		await this.write(sessions)
		return data
	}

	async setName(id: string, name: string): Promise<void> {
		const sessions = await this.read()
		const data = sessions.find((s) => s.id === id)
		if (!data) {
			throw new NotFoundError('Session', id)
		}
		const session = new Session(data)
		session.rename(name)
		Object.assign(data, session.toData())
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
